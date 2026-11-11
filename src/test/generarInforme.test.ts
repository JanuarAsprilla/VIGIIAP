import { afterEach, describe, expect, test, vi } from 'vitest'
import ExcelJS from 'exceljs'
import { generarCsv, tablaPrincipal } from '@/lib/generarInforme/csv'
import { guardarArchivo, nombreSeguro } from '@/lib/generarInforme/descargar'
import { generarExcel } from '@/lib/generarInforme/excel'
import { cargarLogo } from '@/lib/generarInforme/logo'
import { generarPdf, hexARgb, textoPdf } from '@/lib/generarInforme/pdf'
import { generarArchivo } from '@/lib/generarInforme'
import type { DatosInforme, PlantillaInforme } from '@/lib/generarInforme/tipos'

const PLANTILLA: PlantillaInforme = {
  institucion: 'Vigía · IIAP', subtitulo: 'Observatorio de Biodiversidad', pie: 'Documento generado por el Vigía',
  aviso: 'Los datos provienen de GBIF.', colorPrimario: '#009846', colorAcento: '#0F172A', logoUrl: null,
}
const PNG_1PX = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

const especies = (n: number) => Array.from({ length: n }, (_, i) => [`Especie ejemplo ${i + 1}`, 'Tyrannidae', (n - i) * 10, i + 1, i % 2 ? 'Amenazada (EN)' : null])

const datos = (extra: Partial<DatosInforme> = {}): DatosInforme => ({
  titulo: 'Aves del Chocó',
  subtitulo: 'Observatorio de Biodiversidad',
  generadoEn: new Date('2026-11-11T15:00:00Z'),
  filtros: ['Familia: Tyrannidae', 'Departamento: Chocó'],
  secciones: [
    { titulo: 'Cifras clave', cifras: [{ etiqueta: 'Registros', valor: '2.919.072' }, { etiqueta: 'Especies', valor: '1.480', nota: 'Distintas documentadas' }] },
    {
      titulo: 'Especies',
      tablas: [{
        titulo: 'Especies con más registros', columnas: ['Especie', 'Familia', 'Registros', 'Municipios', 'Conservación'],
        filas: especies(5), numericas: [2, 3], principal: true,
      }],
    },
  ],
  fuente: ['Fuente: GBIF, corte del 20 de octubre de 2026.', 'DOI: 10.15468/example'],
  nombreArchivo: 'Informe Aves del Chocó',
  ...extra,
})

const leer = (b: Blob) => new Promise<ArrayBuffer>((resolver, rechazar) => {
  const lector = new FileReader()
  lector.onload = () => resolver(lector.result as ArrayBuffer)
  lector.onerror = () => rechazar(lector.error)
  lector.readAsArrayBuffer(b)
})
const bytes = async (b: Blob) => new Uint8Array(await leer(b))
/** Conserva el BOM (ignoreBOM) para poder comprobarlo. */
const texto = async (b: Blob) => new TextDecoder('utf-8', { ignoreBOM: true }).decode(await bytes(b))

afterEach(() => vi.restoreAllMocks())

describe('CSV', () => {
  test('lleva BOM, la tabla principal y la fuente como comentarios tras una línea en blanco', async () => {
    const salida = await texto(generarCsv(datos()))
    expect(salida.charCodeAt(0)).toBe(0xfeff)
    const lineas = salida.slice(1).split('\r\n')
    expect(lineas[0]).toBe('Especie,Familia,Registros,Municipios,Conservación')
    expect(lineas[1]).toBe('Especie ejemplo 1,Tyrannidae,50,1,')
    expect(lineas).toContain('')
    expect(lineas).toContain('# Filtro: Familia: Tyrannidae')
    expect(lineas).toContain('# DOI: 10.15468/example')
  })

  test('escapa comillas, comas y saltos de línea, y neutraliza las fórmulas', async () => {
    const d = datos({
      secciones: [{ titulo: 'T', tablas: [{ titulo: 'T', columnas: ['a', 'b'], filas: [['dice "hola", ok', '=SUMA(A1)'], ['+cmd', 'línea\nnueva'], [-5, 7]] }] }],
    })
    const filas = (await texto(generarCsv(d))).slice(1).split('\r\n')
    expect(filas[1]).toBe('"dice ""hola"", ok",\'=SUMA(A1)')
    expect(filas[2]).toBe('\'+cmd,"línea\nnueva"')
    expect(filas[3]).toBe('-5,7')
  })

  test('sin tablas solo deja los comentarios, y elige la marcada como principal', () => {
    expect(tablaPrincipal(datos({ secciones: [] }))).toBeNull()
    const d = datos({
      secciones: [{ titulo: 'a', tablas: [
        { titulo: 'uno', columnas: ['x'], filas: [] },
        { titulo: 'dos', columnas: ['y'], filas: [], principal: true },
      ] }],
    })
    expect(tablaPrincipal(d)?.titulo).toBe('dos')
  })
})

describe('nombres de archivo y guardado', () => {
  test('nombreSeguro quita acentos, rutas y caracteres raros', () => {
    expect(nombreSeguro('Informe Aves del Chocó', 'pdf')).toBe('Informe-Aves-del-Choco.pdf')
    expect(nombreSeguro('../../etc/passwd', 'csv')).toBe('etc-passwd.csv')
    expect(nombreSeguro('   ', 'xlsx')).toBe('informe.xlsx')
    expect(nombreSeguro('a'.repeat(200), 'pdf').length).toBe(84)
  })

  test('guardarArchivo descarga con el nombre dado y libera la URL', () => {
    vi.useFakeTimers()
    const crear = vi.fn(() => 'blob:prueba')
    const liberar = vi.fn()
    Object.assign(URL, { createObjectURL: crear, revokeObjectURL: liberar })
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    guardarArchivo(new Blob(['x']), 'informe.pdf')
    expect(clic).toHaveBeenCalled()
    expect(document.querySelector('a[download]')).toBeNull()
    vi.advanceTimersByTime(1500)
    expect(liberar).toHaveBeenCalledWith('blob:prueba')
    vi.useRealTimers()
  })
})

describe('PDF', () => {
  test('textoPdf normaliza signos tipográficos y acentos fuera de Latin-1, y conserva los del español', () => {
    expect(textoPdf('“hola” — ‘x’ …')).toBe('"hola" - \'x\' ...')
    expect(textoPdf('Ñandú, café, Tyrannidae ā ī')).toBe('Ñandú, café, Tyrannidae a i')
    expect(textoPdf('日本')).toBe('??')
  })

  test('hexARgb convierte colores válidos y usa el respaldo con los inválidos', () => {
    expect(hexARgb('#009846', [1, 2, 3])).toEqual([0, 152, 70])
    expect(hexARgb('verde', [1, 2, 3])).toEqual([1, 2, 3])
  })

  test('genera un PDF válido con la plantilla, con y sin logo', async () => {
    const sin = await generarPdf(datos(), PLANTILLA)
    expect(sin.type).toBe('application/pdf')
    expect(new TextDecoder().decode((await bytes(sin)).slice(0, 5))).toBe('%PDF-')
    const con = await generarPdf(datos(), PLANTILLA, { dataUrl: PNG_1PX, formato: 'PNG', ancho: 1, alto: 1 })
    expect(con.size).toBeGreaterThan(sin.size)
  })

  test('una tabla larga ocupa varias páginas y una vacía lo dice', async () => {
    const corto = await generarPdf(datos(), PLANTILLA)
    const largo = await generarPdf(datos({
      secciones: [{ titulo: 'Especies', tablas: [{ titulo: 'Todas', columnas: ['Especie', 'Familia', 'Registros', 'Municipios', 'Conservación'], filas: especies(200), numericas: [2, 3] }] }],
    }), PLANTILLA)
    expect(largo.size).toBeGreaterThan(corto.size)
    expect(await generarPdf(datos({ secciones: [{ titulo: 'x', tablas: [{ titulo: 'Vacía', columnas: ['a'], filas: [] }] }] }), PLANTILLA)).toBeInstanceOf(Blob)
  })

  test('sin filtros ni aviso ni pie también genera', async () => {
    const blob = await generarPdf(datos({ filtros: [] }), { ...PLANTILLA, pie: null, aviso: null, subtitulo: null })
    expect(blob.size).toBeGreaterThan(500)
  })
})

describe('Excel', () => {
  async function abrirLibro(blob: Blob) {
    const libro = new ExcelJS.Workbook()
    await libro.xlsx.load(await leer(blob))
    return libro
  }

  test('trae resumen, una hoja por tabla y la fuente', async () => {
    const libro = await abrirLibro(await generarExcel(datos(), PLANTILLA))
    expect(libro.worksheets.map((h) => h.name)).toEqual(['Resumen', 'Especies con más registros', 'Fuente y aviso'])
    const resumen = libro.getWorksheet('Resumen')!
    expect(resumen.getCell('A1').value).toBe('Vigía · IIAP')
    expect(resumen.getCell('A2').value).toBe('Aves del Chocó')
    const valores = resumen.getSheetValues().flat().map(String)
    expect(valores).toContain('Familia: Tyrannidae')
    expect(valores).toContain('2.919.072')
    const hoja = libro.getWorksheet('Especies con más registros')!
    expect(hoja.getRow(1).values).toEqual([undefined, 'Especie', 'Familia', 'Registros', 'Municipios', 'Conservación'])
    expect(hoja.getCell('C2').value).toBe(50)
    expect(hoja.getColumn(3).numFmt).toBe('#,##0')
    expect(hoja.views[0]).toMatchObject({ state: 'frozen', ySplit: 1 })
    expect(hoja.getCell('A1').fill).toMatchObject({ fgColor: { argb: 'FF009846' } })
    expect(libro.getWorksheet('Fuente y aviso')!.getCell('A2').value).toBe('DOI: 10.15468/example')
  })

  test('los nombres de hoja se limpian, se acortan a 31 caracteres y no se repiten', async () => {
    const tabla = (titulo: string) => ({ titulo, columnas: ['x'], filas: [[1]] })
    const libro = await abrirLibro(await generarExcel(datos({
      secciones: [{ titulo: 's', tablas: [tabla('Especies/aves: [todas]?'), tabla('Especies/aves: [todas]?'), tabla('x'.repeat(50))] }],
    }), PLANTILLA))
    const nombres = libro.worksheets.map((h) => h.name)
    expect(nombres).toContain('Especies aves todas')
    expect(nombres).toContain('Especies aves todas (2)')
    expect(nombres.every((n) => n.length <= 31)).toBe(true)
    expect(new Set(nombres.map((n) => n.toLowerCase())).size).toBe(nombres.length)
  })

  test('un texto que parece fórmula queda como texto, no como fórmula', async () => {
    const libro = await abrirLibro(await generarExcel(datos({
      secciones: [{ titulo: 's', tablas: [{ titulo: 'T', columnas: ['a'], filas: [['=1+1']] }] }],
    }), PLANTILLA))
    const celda = libro.getWorksheet('T')!.getCell('A2')
    expect(celda.type).toBe(ExcelJS.ValueType.String)
    expect(celda.value).toBe('=1+1')
  })
})

describe('generarArchivo', () => {
  test('devuelve el archivo y su nombre seguro en cada formato', async () => {
    const pdf = await generarArchivo('pdf', datos(), PLANTILLA)
    expect(pdf.nombre).toBe('Informe-Aves-del-Choco.pdf')
    expect(pdf.blob.type).toBe('application/pdf')
    expect((await generarArchivo('xlsx', datos(), PLANTILLA)).nombre).toBe('Informe-Aves-del-Choco.xlsx')
    const csv = await generarArchivo('csv', datos(), PLANTILLA)
    expect(csv.nombre).toBe('Informe-Aves-del-Choco.csv')
    expect(csv.blob.type).toContain('text/csv')
  })
})

describe('cargarLogo', () => {
  test('sin URL, con protocolo no web o con respuesta fallida no hay logo (y no falla)', async () => {
    expect(await cargarLogo(null)).toBeNull()
    expect(await cargarLogo('javascript:alert(1)')).toBeNull()
    expect(await cargarLogo('data:image/png;base64,AAAA')).toBeNull()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    expect(await cargarLogo('https://vigiiap.iiap.org.co/files/logo.webp')).toBeNull()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('red')))
    expect(await cargarLogo('https://vigiiap.iiap.org.co/files/logo.webp')).toBeNull()
    vi.unstubAllGlobals()
  })

  test('convierte la imagen a PNG reducida a 400 px como máximo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(['x'], { type: 'image/webp' }) }))
    const cerrar = vi.fn()
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 800, height: 400, close: cerrar }))
    const dibujar = vi.fn()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: dibujar } as never)
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,QUJD')
    const logo = await cargarLogo('/files/vigiiap-files-public/informes/logo.webp')
    expect(logo).toEqual({ dataUrl: 'data:image/png;base64,QUJD', formato: 'PNG', ancho: 400, alto: 200 })
    expect(dibujar).toHaveBeenCalledWith(expect.anything(), 0, 0, 400, 200)
    expect(cerrar).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
