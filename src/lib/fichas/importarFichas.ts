import { leerFilasExcel } from '@/components/herramientas/panel-choco/leerFilasExcel'
import { descargarWorkbook } from '@/lib/excelInstitucional'
import type { FeatureFichaEstado } from '@/types'

export const DESCRIPCION_MINIMA = 20
/** Filas por petición: el backend admite hasta 500 (su parser JSON global es de 1 MB). */
export const TAMANO_TANDA = 500

export interface FilaFicha {
  valor: string
  titulo?: string
  descripcion: string
}

type Registro = Record<string, string | number>

const ALIAS_COLUMNAS = {
  valor: ['identificador', 'valor', 'codigo', 'id'],
  titulo: ['titulo'],
  descripcion: ['descripcion', 'texto', 'detalle'],
} as const

function normalizarEncabezado(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function contar(texto: string, caracter: string): number {
  return texto.split(caracter).length - 1
}

/**
 * CSV a registros {encabezado: valor}. Excel en español exporta con ";" y en
 * inglés con ","; se elige según la primera línea. Respeta comillas (comas,
 * saltos de línea y "" escapadas dentro de una celda).
 */
export function parseCsv(texto: string): Registro[] {
  const limpio = texto.replace(/^\uFEFF/, '')
  const primeraLinea = limpio.split(/\r?\n/, 1)[0] ?? ''
  const delimitador = contar(primeraLinea, ';') > contar(primeraLinea, ',') ? ';' : ','

  const filas: string[][] = []
  let fila: string[] = []
  let celda = ''
  let enComillas = false

  for (let i = 0; i < limpio.length; i++) {
    const c = limpio[i]
    if (enComillas) {
      if (c !== '"') celda += c
      else if (limpio[i + 1] === '"') { celda += '"'; i++ }
      else enComillas = false
    } else if (c === '"') {
      enComillas = true
    } else if (c === delimitador) {
      fila.push(celda)
      celda = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && limpio[i + 1] === '\n') i++
      fila.push(celda)
      celda = ''
      filas.push(fila)
      fila = []
    } else {
      celda += c
    }
  }
  if (celda !== '' || fila.length > 0) {
    fila.push(celda)
    filas.push(fila)
  }

  const [encabezados, ...datos] = filas.filter((f) => f.some((c) => c.trim() !== ''))
  if (!encabezados) return []
  return datos.map((f) => Object.fromEntries(encabezados.map((h, i) => [h.trim(), (f[i] ?? '').trim()])))
}

/** Lee un .xlsx o .csv como registros {encabezado: valor} (primera hoja, fila 1 = encabezados). */
export async function leerTablaFichas(archivo: File): Promise<Registro[]> {
  if (/\.csv$/i.test(archivo.name)) return parseCsv(await archivo.text())
  return leerFilasExcel(archivo)
}

export interface TablaFichas {
  filas: FilaFicha[]
  sinIdentificador: number
  error: string | null
}

function claveDeColumna(registros: Registro[], alias: readonly string[]): string | null {
  for (const registro of registros) {
    const clave = Object.keys(registro).find((k) => alias.includes(normalizarEncabezado(k)))
    if (clave) return clave
  }
  return null
}

/** Mapea las columnas del archivo (por nombre, tolerante a tildes/mayúsculas) a filas de ficha. */
export function filasDeTabla(registros: Registro[]): TablaFichas {
  const vacio = { filas: [], sinIdentificador: 0 }
  if (registros.length === 0) return { ...vacio, error: 'El archivo no tiene filas de datos.' }

  const claveValor = claveDeColumna(registros, ALIAS_COLUMNAS.valor)
  if (!claveValor) return { ...vacio, error: 'Falta la columna «Identificador» en el archivo.' }

  const claveTitulo = claveDeColumna(registros, ALIAS_COLUMNAS.titulo)
  const claveDescripcion = claveDeColumna(registros, ALIAS_COLUMNAS.descripcion)
  if (!claveTitulo && !claveDescripcion) {
    return { ...vacio, error: 'Falta la columna «Descripción» (o «Título») en el archivo.' }
  }

  const filas: FilaFicha[] = []
  let sinIdentificador = 0
  for (const registro of registros) {
    const valor = String(registro[claveValor] ?? '').trim()
    if (!valor) { sinIdentificador++; continue }
    filas.push({
      valor,
      titulo: claveTitulo ? String(registro[claveTitulo] ?? '').trim() || undefined : undefined,
      descripcion: claveDescripcion ? String(registro[claveDescripcion] ?? '').trim() : '',
    })
  }
  return { filas, sinIdentificador, error: null }
}

/** Separa las filas que corresponden a un punto real de la capa de las que no. */
export function cruzarConPuntos(filas: readonly FilaFicha[], valoresConocidos: ReadonlySet<string>) {
  const coinciden: FilaFicha[] = []
  const sinCoincidencia: string[] = []
  for (const fila of filas) {
    if (valoresConocidos.has(fila.valor)) coinciden.push(fila)
    else sinCoincidencia.push(fila.valor)
  }
  return { coinciden, sinCoincidencia }
}

export function contarDescripcionesCortas(filas: readonly FilaFicha[]): number {
  return filas.filter((f) => f.descripcion.trim().length < DESCRIPCION_MINIMA).length
}

export function enTandas<T>(items: readonly T[], tamano: number): T[][] {
  const tandas: T[][] = []
  for (let i = 0; i < items.length; i += tamano) tandas.push(items.slice(i, i + tamano))
  return tandas
}

/**
 * Plantilla .xlsx con un punto por fila, ya con los identificadores reales de
 * la capa: el equipo solo escribe título y descripción, sin riesgo de teclear
 * mal un código. La columna "Etiqueta" es solo de referencia (no se importa).
 */
export async function descargarPlantillaFichas(features: readonly FeatureFichaEstado[], capaNombre: string): Promise<void> {
  const { default: ExcelJS } = await import('exceljs')
  const libro = new ExcelJS.Workbook()
  const hoja = libro.addWorksheet('Fichas')
  hoja.columns = [
    { header: 'Identificador', key: 'valor', width: 26 },
    { header: 'Etiqueta (solo referencia)', key: 'etiqueta', width: 30 },
    { header: 'Título', key: 'titulo', width: 32 },
    { header: 'Descripción', key: 'descripcion', width: 80 },
  ]
  hoja.getRow(1).font = { bold: true }
  hoja.views = [{ state: 'frozen', ySplit: 1 }]
  features.forEach((f) => hoja.addRow({ valor: f.valor, etiqueta: f.etiqueta ?? '' }))
  hoja.getColumn('descripcion').alignment = { wrapText: true, vertical: 'top' }

  const slug = capaNombre.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  await descargarWorkbook(libro, `fichas-${slug || 'capa'}.xlsx`)
}
