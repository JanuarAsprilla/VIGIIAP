import { describe, test, expect, vi, beforeEach } from 'vitest'
import ExcelJS from 'exceljs'

const descargar = vi.fn()
vi.mock('@/lib/excelInstitucional', () => ({ descargarWorkbook: (wb: unknown, nombre: string) => descargar(wb, nombre) }))

import { leerLibroExcel, leerLibroCsv, escribirLibroExcel, limpiarTexto } from '@/components/herramientas/validador-coordenadas/excelIO'

async function xlsx(hojas: Record<string, (string | number | null)[][]>): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook()
  for (const [nombre, filas] of Object.entries(hojas)) {
    const hoja = wb.addWorksheet(nombre)
    filas.forEach((f) => hoja.addRow(f))
  }
  const buf = await wb.xlsx.writeBuffer()
  return buf as ArrayBuffer
}

beforeEach(() => descargar.mockClear())

describe('limpiarTexto', () => {
  test('quita < y > para que una celda no pueda inyectar marcado', () => {
    expect(limpiarTexto('<img src=x onerror=alert(1)>')).toBe('img src=x onerror=alert(1)')
  })
})

describe('leerLibroExcel', () => {
  test('devuelve todas las hojas como filas de texto con encabezados de la fila 1', async () => {
    const libro = await leerLibroExcel(await xlsx({
      Datos: [['Lat', 'Lon', 'Nota'], [5.69, -76.65, 'ok'], [4.7, -74.07, null]],
      Otra: [['A'], ['x']],
    }))
    expect(libro.SheetNames).toEqual(['Datos', 'Otra'])
    expect(libro.Sheets.Datos).toEqual([
      { Lat: '5.69', Lon: '-76.65', Nota: 'ok' },
      { Lat: '4.7', Lon: '-74.07', Nota: '' },
    ])
  })

  test('omite las filas totalmente vacías', async () => {
    const libro = await leerLibroExcel(await xlsx({ D: [['Lat', 'Lon'], [null, null], [1, 2]] }))
    expect(libro.Sheets.D).toHaveLength(1)
  })

  test('neutraliza marcado HTML en las celdas', async () => {
    const libro = await leerLibroExcel(await xlsx({ D: [['Especie'], ['<b>x</b>']] }))
    expect(libro.Sheets.D[0].Especie).toBe('bx/b')
  })

  test('rechaza contenido que no es un xlsx', async () => {
    await expect(leerLibroExcel(new TextEncoder().encode('no es excel').buffer as ArrayBuffer)).rejects.toThrow()
  })
})

describe('escribirLibroExcel', () => {
  test('crea una hoja por entrada con la unión de columnas y descarga el archivo', async () => {
    await escribirLibroExcel(
      [
        { nombre: 'Resultados', filas: [{ a: 1, b: 'x' }, { a: 2, c: 'y' }] },
        { nombre: 'Vacía', filas: [] },
      ],
      'salida.xlsx',
    )
    expect(descargar).toHaveBeenCalledTimes(1)
    const [wb, nombre] = descargar.mock.calls[0] as [ExcelJS.Workbook, string]
    expect(nombre).toBe('salida.xlsx')
    const hoja = wb.getWorksheet('Resultados')!
    expect(hoja.getRow(1).values).toEqual([undefined, 'a', 'b', 'c'])
    expect(hoja.getRow(3).values).toEqual([undefined, 2, '', 'y'])
    expect(wb.getWorksheet('Vacía')!.rowCount).toBe(0)
  })

  test('sanea nombres de hoja no válidos para Excel', async () => {
    await escribirLibroExcel([{ nombre: 'Datos: [1]/2?', filas: [{ a: 1 }] }], 's.xlsx')
    const [wb] = descargar.mock.calls[0] as [ExcelJS.Workbook]
    expect(wb.worksheets[0].name).toBe('Datos   1  2 ')
  })
})

function csvBuffer(texto: string, codificacion: 'utf8' | 'cp1252' = 'utf8'): ArrayBuffer {
  if (codificacion === 'utf8') return new TextEncoder().encode(texto).buffer as ArrayBuffer
  // Windows-1252: á é í ó ú ñ caben en un byte (mismos códigos que Latin-1)
  const bytes = Uint8Array.from(Array.from(texto).map((c) => c.charCodeAt(0)))
  return bytes.buffer as ArrayBuffer
}

describe('leerLibroCsv', () => {
  test('detecta la coma como separador y devuelve texto por columna', () => {
    const libro = leerLibroCsv(csvBuffer('Lat,Lon,Nota\n5.69,-76.65,ok\n4.7,-74.07,'))
    expect(libro.SheetNames).toEqual(['CSV'])
    expect(libro.Sheets.CSV).toEqual([
      { Lat: '5.69', Lon: '-76.65', Nota: 'ok' },
      { Lat: '4.7', Lon: '-74.07', Nota: '' },
    ])
  })

  test('detecta punto y coma (CSV de Excel en español) y conserva la coma decimal', () => {
    const libro = leerLibroCsv(csvBuffer('Lat;Lon\r\n5,6919;-76,6583\r\n'))
    expect(libro.Sheets.CSV).toEqual([{ Lat: '5,6919', Lon: '-76,6583' }])
  })

  test('detecta tabuladores', () => {
    const libro = leerLibroCsv(csvBuffer('Lat\tLon\n1\t2\n'))
    expect(libro.Sheets.CSV).toEqual([{ Lat: '1', Lon: '2' }])
  })

  test('respeta comillas, comillas escapadas y saltos de línea dentro de comillas', () => {
    const libro = leerLibroCsv(csvBuffer('Nota,Lat\n"dijo ""hola"", y siguió",1\n"línea 1\nlínea 2",2\n'))
    expect(libro.Sheets.CSV[0].Nota).toBe('dijo "hola", y siguió')
    expect(libro.Sheets.CSV[1].Nota).toBe('línea 1\nlínea 2')
  })

  test('ignora la marca BOM de UTF-8 y las filas totalmente vacías', () => {
    const libro = leerLibroCsv(csvBuffer('\uFEFFLat,Lon\n\n1,2\n,\n'))
    expect(Object.keys(libro.Sheets.CSV[0])).toEqual(['Lat', 'Lon'])
    expect(libro.Sheets.CSV).toHaveLength(1)
  })

  test('cae a Windows-1252 cuando el archivo no es UTF-8 válido', () => {
    const libro = leerLibroCsv(csvBuffer('Municipio;Lat\nQuibdó;5,6\n', 'cp1252'))
    expect(libro.Sheets.CSV[0].Municipio).toBe('Quibdó')
  })

  test('neutraliza marcado HTML en las celdas', () => {
    const libro = leerLibroCsv(csvBuffer('Especie\n<img src=x onerror=alert(1)>\n'))
    expect(libro.Sheets.CSV[0].Especie).toBe('img src=x onerror=alert(1)')
  })

  test('un CSV vacío devuelve una hoja sin filas', () => {
    expect(leerLibroCsv(csvBuffer('')).Sheets.CSV).toEqual([])
  })
})
