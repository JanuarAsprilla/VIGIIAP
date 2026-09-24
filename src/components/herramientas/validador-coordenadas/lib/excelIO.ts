/**
 * Lectura/escritura de Excel -- misma lógica que validador_coordenadas_IIAP.html
 * (elegir la hoja con más filas, adivinar columnas de lat/lon, exportar en
 * varias hojas), reimplementada sobre `exceljs` en vez de SheetJS/xlsx: xlsx
 * tiene una vulnerabilidad alta sin parche disponible en el registro de npm
 * (GHSA-4r6h-8v6p-xvw6, prototype pollution) -- exceljs ya es dependencia
 * vetada del proyecto (ver panel-choco/lib/leerFilasExcel.ts) y produce el
 * mismo resultado (mismas hojas, mismas columnas) sin esa exposición.
 */
// Import solo de tipos -- se borra por completo en el JS compilado. El valor
// real de ExcelJS (929 kB / 256 kB gzip) se carga bajo demanda dentro de
// leerExcelMejorHoja()/exportarResultados(), no al abrir la herramienta.
import type ExcelJS from 'exceljs'
import { descargarWorkbook } from '@/lib/excelInstitucional'
import type { FilaExcel, FilaResultado } from '../types'
import { limpiarCoord, ddToDms, ddToUtm } from './coordenadas'

type BufferXlsx = Parameters<InstanceType<typeof ExcelJS.Workbook>['xlsx']['load']>[0]

function celdaAValor(valor: ExcelJS.CellValue): string | number | undefined {
  if (valor === null || valor === undefined) return undefined
  if (typeof valor === 'object') {
    if ('result' in valor) return valor.result as string | number
    if ('text' in valor) return String(valor.text)
    if (valor instanceof Date) return valor.toISOString()
  }
  if (typeof valor === 'number' || typeof valor === 'string') return valor
  return String(valor)
}

function leerHoja(hoja: ExcelJS.Worksheet): FilaExcel[] {
  const encabezados: string[] = []
  const filas: FilaExcel[] = []
  hoja.eachRow((row, rowNumber) => {
    const valores = row.values as ExcelJS.CellValue[]
    if (rowNumber === 1) {
      for (let i = 1; i < valores.length; i++) encabezados[i - 1] = String(celdaAValor(valores[i]) ?? '').trim()
      return
    }
    const fila: FilaExcel = {}
    encabezados.forEach((encabezado, i) => { if (encabezado) fila[encabezado] = celdaAValor(valores[i + 1]) })
    filas.push(fila)
  })
  return filas
}

export interface HojaLeida {
  nombreHoja: string
  filas: FilaExcel[]
}

/** Lee el archivo y elige la hoja con más filas de datos (normalmente la principal). */
export async function leerExcelMejorHoja(file: File): Promise<HojaLeida> {
  const { default: ExcelJS } = await import('exceljs')
  const buffer = await file.arrayBuffer()
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer as unknown as BufferXlsx)

  let mejorHoja = '', mejorFilas: FilaExcel[] = []
  for (const hoja of workbook.worksheets) {
    const filas = leerHoja(hoja)
    if (filas.length > mejorFilas.length) { mejorHoja = hoja.name; mejorFilas = filas }
  }
  if (!mejorHoja || mejorFilas.length === 0) {
    throw new Error('El archivo no contiene datos en ninguna hoja.')
  }
  return { nombreHoja: mejorHoja, filas: mejorFilas }
}

/** Columnas cuyos valores son ≥80% numéricos en una muestra de 50 filas. */
export function detectarColumnasNumericas(rows: FilaExcel[]): string[] {
  if (!rows.length) return []
  const cols = Object.keys(rows[0])
  const muestra = rows.slice(0, 50)
  return cols.filter((c) => {
    const valores = muestra.map((r) => r[c]).filter((v) => v !== undefined && v !== null && String(v).trim() !== '')
    if (valores.length === 0) return false
    const numericos = valores.filter((v) => !isNaN(limpiarCoord(v)))
    return numericos.length / valores.length >= 0.8
  })
}

const NOMBRES_LAT_PROBABLES = ['decimallatitude', 'latitude', 'latitud', 'lat', 'y']
const NOMBRES_LON_PROBABLES = ['decimallongitude', 'longitude', 'longitud', 'lon', 'lng', 'long', 'x']

export function adivinarColumna(numCols: string[], nombresProbables: string[]): string {
  for (const nombre of nombresProbables) {
    const match = numCols.find((c) => c.toLowerCase().trim() === nombre)
    if (match) return match
  }
  return numCols[0] || ''
}

export function adivinarColumnasLatLon(numCols: string[]): { lat: string; lon: string } {
  const lat = adivinarColumna(numCols, NOMBRES_LAT_PROBABLES)
  const lon = adivinarColumna(numCols.filter((c) => c !== lat), NOMBRES_LON_PROBABLES) || numCols.find((c) => c !== lat) || ''
  return { lat, lon }
}

// ── Exportar resultados ─────────────────────────────────────────────────────

type FilaSalida = Record<string, string | number | boolean | undefined>

function construirFilaSalida(row: FilaExcel, r: FilaResultado, colLat: string, colLon: string): FilaSalida {
  const lat = limpiarCoord(row[colLat]), lon = limpiarCoord(row[colLon])
  const utm = ddToUtm(lat, lon)
  return {
    ...row,
    estado_coordenada: r.estado,
    tipo_error: r.tipoError,
    observacion: r.observacion,
    departamento_detectado: r.depDet,
    municipio_detectado: r.muniDet,
    codigo_divipola: r.codigoDivipola,
    latitud_intercambiada: r.latIntercambiada,
    distancia_centroide_km: r.distCentroideKm != null ? +r.distCentroideKm.toFixed(3) : '',
    movida_manualmente: !!r.movido,
    lat_original_antes_de_mover: r.movido ? r.latOriginalAntesDeMover : '',
    lon_original_antes_de_mover: r.movido ? r.lonOriginalAntesDeMover : '',
    fila_excel_original: r.filaExcel ?? (r.manual ? 'Agregado manualmente' : ''),
    confirmada_manualmente: !!r.confirmadoManual,
    lat_dms: ddToDms(lat, true),
    lon_dms: ddToDms(lon, false),
    utm_zona: utm ? `${utm.zone}${utm.banda}` : '',
    utm_este: utm ? utm.easting : '',
    utm_norte: utm ? utm.northing : '',
  }
}

function agregarHoja(workbook: ExcelJS.Workbook, nombre: string, filas: FilaSalida[]): void {
  const sheet = workbook.addWorksheet(nombre)
  if (filas.length === 0) return
  const columnas = Object.keys(filas[0])
  sheet.columns = columnas.map((key) => ({ header: key, key, width: 18 }))
  filas.forEach((fila) => sheet.addRow(fila))
}

/** Genera y descarga el .xlsx de resultados -- mismas hojas/columnas que el original. */
export async function exportarResultados(
  rows: FilaExcel[], results: FilaResultado[], colLat: string, colLon: string,
  totalMunicipiosObjetivo: number, municipiosEncontrados: number,
): Promise<void> {
  const { default: ExcelJS } = await import('exceljs')
  const salida = rows.map((row, i) => construirFilaSalida(row, results[i], colLat, colLon))
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'VIGIA — IIAP'
  workbook.created = new Date()

  agregarHoja(workbook, 'Resultados', salida)
  agregarHoja(workbook, 'Validas', salida.filter((_, i) => results[i].estado === 'VÁLIDA'))
  agregarHoja(workbook, 'Sospechosas', salida.filter((_, i) => results[i].estado === 'SOSPECHOSA'))
  agregarHoja(workbook, 'Invalidas', salida.filter((_, i) => results[i].estado === 'INVÁLIDA'))

  const agregadosManualmente = salida.filter((_, i) => results[i].manual)
  if (agregadosManualmente.length) agregarHoja(workbook, 'Agregados manualmente', agregadosManualmente)

  const movidosManualmente = salida.filter((_, i) => results[i].movido)
  if (movidosManualmente.length) agregarHoja(workbook, 'Movidos manualmente', movidosManualmente)

  const total = rows.length
  const val = results.filter((r) => r.estado === 'VÁLIDA').length
  const sos = results.filter((r) => r.estado === 'SOSPECHOSA').length
  const inv = results.filter((r) => r.estado === 'INVÁLIDA').length
  agregarHoja(workbook, 'Resumen', [
    { Indicador: 'Total de registros', Cantidad: total },
    { Indicador: 'Coordenadas válidas', Cantidad: val },
    { Indicador: 'Coordenadas sospechosas', Cantidad: sos },
    { Indicador: 'Coordenadas inválidas', Cantidad: inv },
    { Indicador: 'Porcentaje válidas', Cantidad: total ? +(val / total * 100).toFixed(2) : 0 },
    { Indicador: 'Porcentaje sospechosas', Cantidad: total ? +(sos / total * 100).toFixed(2) : 0 },
    { Indicador: 'Porcentaje inválidas', Cantidad: total ? +(inv / total * 100).toFixed(2) : 0 },
    { Indicador: 'Municipios objetivo', Cantidad: totalMunicipiosObjetivo },
    { Indicador: 'Municipios encontrados en DANE', Cantidad: municipiosEncontrados },
  ])

  const fecha = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const nombre = `VALIDADOR_COORDENADAS_${pad(fecha.getDate())}-${pad(fecha.getMonth() + 1)}-${fecha.getFullYear()}_hora_${pad(fecha.getHours())}-${pad(fecha.getMinutes())}.xlsx`
  await descargarWorkbook(workbook, nombre)
}
