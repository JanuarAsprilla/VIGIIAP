import { describe, test, expect, vi, beforeEach } from 'vitest'
import ExcelJS from 'exceljs'

const descargar = vi.fn()
vi.mock('@/lib/excelInstitucional', () => ({ descargarWorkbook: (wb: unknown, nombre: string) => descargar(wb, nombre) }))

import { leerLibroExcel, escribirLibroExcel, limpiarTexto } from '@/components/herramientas/validador-coordenadas/excelIO'

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
