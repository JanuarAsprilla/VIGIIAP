import type ExcelJS from 'exceljs'
import type { DatosInforme, PlantillaInforme, TablaInforme } from './tipos'

const TIPO_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const CARACTERES_PROHIBIDOS = /[\\/*?:[\]]/g
const ANCHO_MAXIMO = 60

const argb = (hex: string) => `FF${hex.replace('#', '').toUpperCase()}`
const fechaLarga = (d: Date) => d.toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })

function nombreHoja(titulo: string, usados: Set<string>): string {
  const base = titulo.replace(CARACTERES_PROHIBIDOS, ' ').replace(/\s+/g, ' ').trim().slice(0, 31) || 'Hoja'
  let nombre = base
  for (let n = 2; usados.has(nombre.toLowerCase()); n += 1) {
    const sufijo = ` (${n})`
    nombre = `${base.slice(0, 31 - sufijo.length)}${sufijo}`
  }
  usados.add(nombre.toLowerCase())
  return nombre
}

function encabezadoInstitucional(hoja: ExcelJS.Worksheet, plantilla: PlantillaInforme, datos: DatosInforme, columnas: number): number {
  const relleno = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: argb(plantilla.colorAcento) } }
  hoja.mergeCells(1, 1, 1, columnas)
  const institucion = hoja.getCell(1, 1)
  institucion.value = plantilla.institucion
  institucion.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
  institucion.fill = relleno
  institucion.alignment = { vertical: 'middle' }
  hoja.getRow(1).height = 26
  const titulo = hoja.getCell(2, 1)
  titulo.value = datos.titulo
  titulo.font = { bold: true, size: 13, color: { argb: argb(plantilla.colorPrimario) } }
  hoja.getCell(3, 1).value = [datos.subtitulo, `Generado el ${fechaLarga(datos.generadoEn)}`].filter(Boolean).join(' · ')
  return 4
}

function estiloEncabezadoTabla(fila: ExcelJS.Row, plantilla: PlantillaInforme) {
  fila.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  fila.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(plantilla.colorPrimario) } }
  fila.alignment = { vertical: 'middle', wrapText: true }
}

function ajustarAnchos(hoja: ExcelJS.Worksheet, tabla: TablaInforme) {
  tabla.columnas.forEach((nombre, i) => {
    const mayor = Math.max(nombre.length, ...tabla.filas.map((f) => String(f[i] ?? '').length))
    hoja.getColumn(i + 1).width = Math.min(ANCHO_MAXIMO, Math.max(10, mayor + 2))
  })
}

function hojaDeTabla(libro: ExcelJS.Workbook, nombre: string, tabla: TablaInforme, plantilla: PlantillaInforme) {
  const hoja = libro.addWorksheet(nombre)
  const encabezado = hoja.addRow(tabla.columnas)
  estiloEncabezadoTabla(encabezado, plantilla)
  tabla.filas.forEach((fila) => hoja.addRow(fila))
  for (const columna of tabla.numericas ?? []) hoja.getColumn(columna + 1).numFmt = '#,##0'
  ajustarAnchos(hoja, tabla)
  hoja.views = [{ state: 'frozen', ySplit: 1 }]
  if (tabla.filas.length > 0) hoja.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: tabla.columnas.length } }
  if (tabla.nota) {
    hoja.addRow([])
    hoja.addRow([tabla.nota]).font = { italic: true }
  }
}

function hojaResumen(libro: ExcelJS.Workbook, datos: DatosInforme, plantilla: PlantillaInforme) {
  const hoja = libro.addWorksheet('Resumen')
  hoja.columns = [{ width: 38 }, { width: 22 }, { width: 60 }]
  let fila = encabezadoInstitucional(hoja, plantilla, datos, 3) + 1
  if (datos.filtros.length > 0) {
    hoja.getCell(fila, 1).value = 'Filtros aplicados'
    hoja.getCell(fila, 1).font = { bold: true }
    fila += 1
    for (const f of datos.filtros) hoja.getCell(fila++, 1).value = f
    fila += 1
  }
  for (const seccion of datos.secciones) {
    hoja.getCell(fila, 1).value = seccion.titulo
    hoja.getCell(fila, 1).font = { bold: true, size: 12, color: { argb: argb(plantilla.colorPrimario) } }
    fila += 1
    for (const c of seccion.cifras ?? []) {
      hoja.getRow(fila).values = [c.etiqueta, c.valor, c.nota ?? '']
      hoja.getCell(fila, 2).alignment = { horizontal: 'right' }
      fila += 1
    }
    for (const p of seccion.parrafos ?? []) hoja.getCell(fila++, 1).value = p
    fila += 1
  }
}

function hojaFuente(libro: ExcelJS.Workbook, datos: DatosInforme, plantilla: PlantillaInforme) {
  const hoja = libro.addWorksheet('Fuente y aviso')
  hoja.getColumn(1).width = 110
  const lineas = [...datos.fuente, '', ...(plantilla.aviso ? [plantilla.aviso] : []), ...(plantilla.pie ? [plantilla.pie] : [])]
  lineas.forEach((linea, i) => {
    const celda = hoja.getCell(i + 1, 1)
    celda.value = linea
    celda.alignment = { wrapText: true, vertical: 'top' }
  })
}

/** Libro de Excel: hoja «Resumen» con cifras y filtros, una hoja por tabla y una última con la fuente y el aviso legal. */
export async function generarExcel(datos: DatosInforme, plantilla: PlantillaInforme): Promise<Blob> {
  const { default: Excel } = await import('exceljs')
  const libro = new Excel.Workbook()
  libro.creator = plantilla.institucion
  libro.created = datos.generadoEn
  hojaResumen(libro, datos, plantilla)
  const usados = new Set(['resumen', 'fuente y aviso'])
  for (const seccion of datos.secciones) {
    for (const tabla of seccion.tablas ?? []) hojaDeTabla(libro, nombreHoja(tabla.titulo, usados), tabla, plantilla)
  }
  hojaFuente(libro, datos, plantilla)
  const bytes = await libro.xlsx.writeBuffer()
  return new Blob([bytes], { type: TIPO_XLSX })
}
