import api from '@/lib/api'
import { ACCION_LABEL } from '@/hooks/useAuditLog'
import { formatDate } from '@/lib/dateUtils'
import {
  bandaInstitucional, lineaMeta, seccion, encabezadoFila, filaDatos, pieDePagina,
  descargarWorkbook, logoInstitucionalBase64, COLOR_INSTITUCIONAL,
} from '@/lib/excelInstitucional'

const ULTIMA_COLUMNA = 7 // A: gutter/logo · B-G: Acción, Módulo, Descripción, Usuario, IP, Fecha

interface AuditExportRaw {
  id: string
  accion: string
  modulo: string
  descripcion?: string | null
  usuario_email?: string | null
  ip?: string | null
  creado_en: string
}

interface FilaActividad {
  accionLabel: string
  modulo: string
  descripcion: string
  email: string
  ip: string
  fecha: string
}

function normalizar(r: AuditExportRaw): FilaActividad {
  return {
    accionLabel: ACCION_LABEL[r.accion]?.label ?? r.accion,
    modulo:      r.modulo,
    descripcion: r.descripcion ?? '—',
    email:       r.usuario_email ?? '—',
    ip:          r.ip ?? '—',
    fecha:       formatDate(r.creado_en),
  }
}

export interface OpcionesExportarActividad {
  filtroModulo?: string
  busqueda?: string
}

/**
 * Exporta el registro de actividad COMPLETO (hasta 10.000 eventos, vía
 * /admin/export/audit) en vez de solo la página de 10 filas visible en
 * pantalla -- una tabla de 10 filas no sirve para ningún análisis real.
 * Aplica los mismos filtros de módulo/búsqueda que la vista actual.
 */
export async function exportarActividadExcel(opciones: OpcionesExportarActividad = {}): Promise<void> {
  const crudo = await api.get('/admin/export/audit', { params: { formato: 'json' } }) as AuditExportRaw[]
  let filas = crudo.map(normalizar)

  if (opciones.filtroModulo) {
    filas = filas.filter((f) => f.modulo === opciones.filtroModulo)
  }
  if (opciones.busqueda) {
    const q = opciones.busqueda.toLowerCase()
    filas = filas.filter((f) =>
      f.descripcion.toLowerCase().includes(q) || f.email.toLowerCase().includes(q) || f.accionLabel.toLowerCase().includes(q))
  }

  const porModulo = new Map<string, number>()
  for (const f of filas) porModulo.set(f.modulo, (porModulo.get(f.modulo) ?? 0) + 1)
  const modulosOrdenados = [...porModulo.entries()].sort((a, b) => b[1] - a[1])

  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'VIGIA — IIAP'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Registro de actividad', {
    views: [{ state: 'frozen', ySplit: 7, showGridLines: false }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
  })
  sheet.columns = [{ width: 6 }, { width: 18 }, { width: 14 }, { width: 42 }, { width: 24 }, { width: 15 }, { width: 18 }]

  const logo = await logoInstitucionalBase64()
  bandaInstitucional(workbook, sheet, {
    titulo: 'VIGIA — Sistema de Información Territorial del Chocó\n'
      + 'Instituto de Investigaciones Ambientales del Pacífico (IIAP)\n'
      + 'Registro de actividad',
    ultimaColumna: ULTIMA_COLUMNA,
    logo,
  })
  lineaMeta(sheet, `${filas.length} eventos exportados`, { ultimaColumna: ULTIMA_COLUMNA, destacado: true })
  if (opciones.filtroModulo) lineaMeta(sheet, `Filtro de módulo: ${opciones.filtroModulo}`, { ultimaColumna: ULTIMA_COLUMNA })
  if (opciones.busqueda) lineaMeta(sheet, `Búsqueda: "${opciones.busqueda}"`, { ultimaColumna: ULTIMA_COLUMNA })
  lineaMeta(sheet, `Generado el ${new Date().toLocaleString('es-CO')}`, { ultimaColumna: ULTIMA_COLUMNA })
  sheet.addRow([])

  // ── Eventos por módulo — con barra de datos nativa de Excel ─────
  if (modulosOrdenados.length > 0) {
    seccion(sheet, 'Eventos por módulo', ULTIMA_COLUMNA)
    encabezadoFila(sheet, [null, 'Módulo', 'Eventos'])
    const primeraFila = sheet.rowCount + 1
    modulosOrdenados.forEach(([modulo, total], i) => {
      const row = filaDatos(sheet, [null, modulo, total], { zebra: i % 2 === 1, colInicio: 2, colFin: 3 })
      row.getCell(2).font = { size: 10.5, color: { argb: COLOR_INSTITUCIONAL.text } }
      row.getCell(3).font = { size: 10.5, bold: true, color: { argb: COLOR_INSTITUCIONAL.text } }
      row.getCell(3).alignment = { horizontal: 'right' }
    })
    const ultimaFila = sheet.rowCount
    sheet.addConditionalFormatting({
      ref: `C${primeraFila}:C${ultimaFila}`,
      rules: [{
        type: 'dataBar', priority: 1, gradient: true, minLength: 0, maxLength: 100, showValue: true, border: false,
        cfvo: [{ type: 'min' }, { type: 'max' }],
        color: { argb: COLOR_INSTITUCIONAL.gold400 },
      } as import('exceljs').ConditionalFormattingRule],
    })
    sheet.addRow([])
  }

  // ── Detalle de eventos ────────────────────────────────────────────
  seccion(sheet, 'Detalle de eventos', ULTIMA_COLUMNA)
  encabezadoFila(sheet, [null, 'Acción', 'Módulo', 'Descripción', 'Usuario', 'IP', 'Fecha'])
  filas.forEach((f, i) => {
    const row = filaDatos(
      sheet, [null, f.accionLabel, f.modulo, f.descripcion, f.email, f.ip, f.fecha],
      { zebra: i % 2 === 1, colInicio: 2, colFin: 7 },
    )
    for (let c = 2; c <= 7; c++) row.getCell(c).font = { size: 9.5, color: { argb: COLOR_INSTITUCIONAL.text } }
  })

  pieDePagina(sheet, 'Generado automáticamente por VIGIA — máximo 10.000 eventos por exportación.', ULTIMA_COLUMNA)

  await descargarWorkbook(workbook, `actividad-${new Date().toISOString().slice(0, 10)}.xlsx`)
}
