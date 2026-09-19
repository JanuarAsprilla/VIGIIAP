import type { ReporteData } from '@/hooks/useReportes'
import {
  bandaInstitucional, lineaMeta, seccion, encabezadoFila, filaDatos, pieDePagina,
  descargarWorkbook, logoInstitucionalBase64, COLOR_INSTITUCIONAL,
} from '@/lib/excelInstitucional'

const ULTIMA_COLUMNA = 3 // A: gutter/logo · B: métrica · C: valor

function sortedModulos(data: ReporteData) {
  return [...data.actividadPorModulo].sort((a, b) => b.total - a.total)
}

function filaMetrica(sheet: import('exceljs').Worksheet, label: string, valor: number, zebra: boolean) {
  const row = filaDatos(sheet, [null, label, valor], { zebra, colInicio: 2, colFin: 3 })
  row.getCell(2).font = { size: 10.5, color: { argb: COLOR_INSTITUCIONAL.text } }
  row.getCell(3).font = { size: 10.5, bold: true, color: { argb: COLOR_INSTITUCIONAL.text } }
  row.getCell(3).alignment = { horizontal: 'right' }
  return row
}

/**
 * Genera y descarga un .xlsx con la identidad institucional de VIGIA/IIAP:
 * logo, colores de marca y una barra de datos nativa de Excel en la sección
 * de actividad por módulo (en vez de una tabla plana sin contexto visual).
 */
export async function exportarReporteExcel(data: ReporteData): Promise<void> {
  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'VIGIA — IIAP'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Reporte de actividad', {
    views: [{ state: 'frozen', ySplit: 6, showGridLines: false }],
    pageSetup: { orientation: 'portrait', fitToPage: true, fitToWidth: 1 },
  })
  sheet.columns = [{ width: 8 }, { width: 34 }, { width: 20 }]

  const logo = await logoInstitucionalBase64()
  bandaInstitucional(workbook, sheet, {
    titulo: 'VIGIA — Sistema de Información Territorial del Chocó\n'
      + 'Instituto de Investigaciones Ambientales del Pacífico (IIAP)\n'
      + 'Reporte de actividad',
    ultimaColumna: ULTIMA_COLUMNA,
    logo,
  })
  lineaMeta(sheet, `Período: ${data.desde} al ${data.hasta}`, { ultimaColumna: ULTIMA_COLUMNA, destacado: true })
  lineaMeta(sheet, `Generado el ${new Date().toLocaleString('es-CO')}`, { ultimaColumna: ULTIMA_COLUMNA })
  sheet.addRow([])

  // ── Usuarios ──────────────────────────────────────────────────────
  seccion(sheet, 'Usuarios', ULTIMA_COLUMNA)
  encabezadoFila(sheet, [null, 'Métrica', 'Valor'])
  filaMetrica(sheet, 'Nuevos registros', data.usuarios.nuevos, false)
  filaMetrica(sheet, 'Creados por admin', data.usuarios.creadosPorAdmin, true)
  filaMetrica(sheet, 'Logins exitosos', data.logins.exitosos, false)
  filaMetrica(sheet, 'Logins fallidos', data.logins.fallidos, true)
  sheet.addRow([])

  // ── Solicitudes ───────────────────────────────────────────────────
  seccion(sheet, 'Solicitudes', ULTIMA_COLUMNA)
  encabezadoFila(sheet, [null, 'Métrica', 'Valor'])
  filaMetrica(sheet, 'Nuevas', data.solicitudes.nuevas, false)
  filaMetrica(sheet, 'Resueltas', data.solicitudes.resueltas, true)
  filaMetrica(sheet, 'Pendientes', data.solicitudes.pendientes, false)
  sheet.addRow([])

  // ── Contenido ─────────────────────────────────────────────────────
  seccion(sheet, 'Contenido', ULTIMA_COLUMNA)
  encabezadoFila(sheet, [null, 'Métrica', 'Valor'])
  filaMetrica(sheet, 'Documentos creados', data.documentos.creados, false)
  filaMetrica(sheet, 'Documentos publicados', data.documentos.publicados, true)
  filaMetrica(sheet, 'Mapas creados', data.mapas.creados, false)
  filaMetrica(sheet, 'Mapas publicados', data.mapas.publicados, true)
  sheet.addRow([])

  // ── Actividad por módulo — con barra de datos nativa de Excel ────
  const modulos = sortedModulos(data)
  if (modulos.length > 0) {
    seccion(sheet, 'Actividad por módulo (mayor a menor)', ULTIMA_COLUMNA)
    encabezadoFila(sheet, [null, 'Módulo', 'Eventos'])
    const primeraFila = sheet.rowCount + 1
    modulos.forEach((m, i) => filaMetrica(sheet, m.modulo, m.total, i % 2 === 1))
    const ultimaFila = sheet.rowCount
    sheet.addConditionalFormatting({
      ref: `C${primeraFila}:C${ultimaFila}`,
      rules: [{
        type: 'dataBar', priority: 1, gradient: true, minLength: 0, maxLength: 100, showValue: true, border: false,
        cfvo: [{ type: 'min' }, { type: 'max' }],
        color: { argb: COLOR_INSTITUCIONAL.gold400 },
      } as import('exceljs').ConditionalFormattingRule],
    })
  }

  pieDePagina(sheet, 'Generado automáticamente por VIGIA — los datos reflejan el período seleccionado.', ULTIMA_COLUMNA)

  await descargarWorkbook(workbook, `reporte-${data.desde}-a-${data.hasta}.xlsx`)
}
