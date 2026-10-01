// Lectura/escritura de Excel del validador sobre `exceljs`: el original usa SheetJS, cuyo paquete
// de npm (0.18.x) tiene vulnerabilidades sin parche. El valor de exceljs se carga bajo demanda.
import type ExcelJS from 'exceljs'
import { descargarWorkbook } from '@/lib/excelInstitucional'

type BufferXlsx = Parameters<InstanceType<typeof ExcelJS.Workbook>['xlsx']['load']>[0]

export type FilaTexto = Record<string, string>

export interface LibroLeido {
  SheetNames: string[]
  Sheets: Record<string, FilaTexto[]>
}

export interface HojaSalida {
  nombre: string
  filas: Record<string, unknown>[]
}

/** El validador arma tablas y popups con innerHTML: el texto de las celdas nunca debe llegar como marcado. */
export function limpiarTexto(valor: string): string {
  return valor.replace(/[<>]/g, '')
}

/** Todas las hojas como filas {encabezado: texto} (fila 1 = encabezados, celdas vacías = ''),
 * equivalente a sheet_to_json(hoja, { defval: '', raw: false }) del original. */
export async function leerLibroExcel(buffer: ArrayBuffer): Promise<LibroLeido> {
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer as unknown as BufferXlsx)

  const libro: LibroLeido = { SheetNames: [], Sheets: {} }
  for (const hoja of workbook.worksheets) {
    const encabezados: string[] = []
    const filas: FilaTexto[] = []
    hoja.eachRow((row, numero) => {
      if (numero === 1) {
        for (let c = 1; c <= row.cellCount; c++) encabezados[c] = limpiarTexto(row.getCell(c).text).trim()
        return
      }
      const fila: FilaTexto = {}
      let conDatos = false
      encabezados.forEach((encabezado, c) => {
        if (!encabezado) return
        const texto = limpiarTexto(row.getCell(c).text)
        if (texto !== '') conDatos = true
        fila[encabezado] = texto
      })
      if (conDatos) filas.push(fila)
    })
    libro.SheetNames.push(hoja.name)
    libro.Sheets[hoja.name] = filas
  }
  return libro
}

/** Decodifica como UTF-8 y, si el archivo no lo es (CSV de Excel en español suele ser Windows-1252), cae a Windows-1252. */
function decodificarTexto(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer).replace(/^\uFEFF/, '')
  } catch {
    return new TextDecoder('windows-1252').decode(buffer)
  }
}

function detectarSeparador(primeraLinea: string): string {
  const candidatos = [',', ';', '\t']
  const conteos = candidatos.map((c) => primeraLinea.split(c).length - 1)
  const mayor = Math.max(...conteos)
  return mayor === 0 ? ',' : candidatos[conteos.indexOf(mayor)]
}

/** Divide un CSV en filas de celdas respetando comillas, comillas escapadas ("") y saltos de línea dentro de comillas. */
function parsearCsv(texto: string, separador: string): string[][] {
  const filas: string[][] = []
  let fila: string[] = []
  let celda = ''
  let entreComillas = false
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]
    if (entreComillas) {
      if (c === '"' && texto[i + 1] === '"') { celda += '"'; i++ }
      else if (c === '"') entreComillas = false
      else celda += c
    } else if (c === '"') entreComillas = true
    else if (c === separador) { fila.push(celda); celda = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++
      fila.push(celda); celda = ''
      filas.push(fila); fila = []
    } else celda += c
  }
  if (celda !== '' || fila.length > 0) { fila.push(celda); filas.push(fila) }
  return filas
}

/** CSV como un libro de una sola hoja, con el mismo formato que leerLibroExcel (texto, celdas vacías = ''). */
export function leerLibroCsv(buffer: ArrayBuffer): LibroLeido {
  const texto = decodificarTexto(buffer)
  const salto = texto.search(/\r|\n/)
  const separador = detectarSeparador(salto === -1 ? texto : texto.slice(0, salto))
  const [encabezados = [], ...cuerpo] = parsearCsv(texto, separador).filter((f) => f.some((c) => c.trim() !== ''))
  const nombres = encabezados.map((h) => limpiarTexto(h).trim())
  const filas: FilaTexto[] = cuerpo.map((celdas) => {
    const fila: FilaTexto = {}
    nombres.forEach((nombre, i) => { if (nombre) fila[nombre] = limpiarTexto(celdas[i] ?? '') })
    return fila
  })
  return { SheetNames: ['CSV'], Sheets: { CSV: filas } }
}

/** Nombres de hoja válidos en Excel: máx. 31 caracteres y sin \ / ? * [ ] : */
function nombreHoja(nombre: string): string {
  return nombre.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31)
}

export async function escribirLibroExcel(hojas: HojaSalida[], nombreArchivo: string): Promise<void> {
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  for (const { nombre, filas } of hojas) {
    const hoja = workbook.addWorksheet(nombreHoja(nombre))
    const columnas = Array.from(new Set(filas.flatMap((f) => Object.keys(f))))
    if (columnas.length === 0) continue
    hoja.addRow(columnas)
    for (const fila of filas) hoja.addRow(columnas.map((c) => fila[c] ?? ''))
    hoja.getRow(1).font = { bold: true }
  }
  await descargarWorkbook(workbook, nombreArchivo)
}
