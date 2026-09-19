import type { ReporteData } from '@/hooks/useReportes'

const COLOR = {
  primary700: 'FF1A5632',
  primary500: 'FF009846',
  primary50:  'FFE8F5EB',
  gold400:    'FFF7AC42',
  bgAlt:      'FFEDF2F0',
  white:      'FFFFFFFF',
  text:       'FF1A1A2E',
  textMuted:  'FF4A5568',
  border:     'FFE2E8F0',
} as const

async function logoBase64(): Promise<string | null> {
  try {
    const res = await fetch('/icon-512x512.png')
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload  = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('No se pudo leer el logo'))
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function sortedModulos(data: ReporteData) {
  return [...data.actividadPorModulo].sort((a, b) => b.total - a.total)
}

function seccion(sheet: import('exceljs').Worksheet, titulo: string) {
  const row = sheet.addRow([null, titulo, null])
  sheet.mergeCells(row.number, 1, row.number, 3)
  row.height = 22
  row.eachCell((cell: import('exceljs').Cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.primary500 } }
    cell.font = { bold: true, color: { argb: COLOR.white }, size: 11 }
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  })
  return row
}

function encabezadoTabla(sheet: import('exceljs').Worksheet, col1: string, col2: string) {
  const row = sheet.addRow([null, col1, col2])
  row.eachCell({ includeEmpty: false }, (cell) => {
    cell.font = { bold: true, size: 10, color: { argb: COLOR.textMuted } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.bgAlt } }
    cell.border = { bottom: { style: 'thin', color: { argb: COLOR.border } } }
  })
  return row
}

function filaDato(sheet: import('exceljs').Worksheet, label: string, valor: number, zebra: boolean) {
  const row = sheet.addRow([null, label, valor])
  const cB = row.getCell(2)
  const cC = row.getCell(3)
  cB.font = { size: 10.5, color: { argb: COLOR.text } }
  cC.font = { size: 10.5, bold: true, color: { argb: COLOR.text } }
  cC.alignment = { horizontal: 'right' }
  if (zebra) {
    for (const cell of [cB, cC]) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.bgAlt } }
    }
  }
  return row
}

/**
 * Genera y descarga un .xlsx con la identidad institucional de VIGIA/IIAP:
 * logo, colores de marca y barras de datos nativas de Excel en la sección
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

  // ── Banda institucional (logo + título) ──────────────────────────
  for (let r = 1; r <= 3; r++) {
    const row = sheet.getRow(r)
    row.height = 20
    for (let c = 1; c <= 3; c++) {
      row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.primary700 } }
    }
  }
  sheet.mergeCells('B1:C3')
  const tituloCell = sheet.getCell('B1')
  tituloCell.value = 'VIGIA — Sistema de Información Territorial del Chocó\n'
    + 'Instituto de Investigaciones Ambientales del Pacífico (IIAP)\n'
    + 'Reporte de actividad'
  tituloCell.font = { bold: true, size: 12, color: { argb: COLOR.white } }
  tituloCell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'left', indent: 1 }

  const logo = await logoBase64()
  if (logo) {
    const imageId = workbook.addImage({ base64: logo, extension: 'png' })
    sheet.addImage(imageId, { tl: { col: 0.15, row: 0.15 }, ext: { width: 48, height: 48 } })
  }

  const periodoRow = sheet.addRow([null, `Período: ${data.desde} al ${data.hasta}`, null])
  sheet.mergeCells(periodoRow.number, 2, periodoRow.number, 3)
  periodoRow.getCell(2).font = { bold: true, size: 10.5, color: { argb: COLOR.primary700 } }
  periodoRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.primary50 } }

  const generadoRow = sheet.addRow([null, `Generado el ${new Date().toLocaleString('es-CO')}`, null])
  sheet.mergeCells(generadoRow.number, 2, generadoRow.number, 3)
  generadoRow.getCell(2).font = { italic: true, size: 9, color: { argb: COLOR.textMuted } }

  sheet.addRow([])

  // ── Usuarios ──────────────────────────────────────────────────────
  seccion(sheet, 'Usuarios')
  encabezadoTabla(sheet, 'Métrica', 'Valor')
  filaDato(sheet, 'Nuevos registros', data.usuarios.nuevos, false)
  filaDato(sheet, 'Creados por admin', data.usuarios.creadosPorAdmin, true)
  filaDato(sheet, 'Logins exitosos', data.logins.exitosos, false)
  filaDato(sheet, 'Logins fallidos', data.logins.fallidos, true)
  sheet.addRow([])

  // ── Solicitudes ───────────────────────────────────────────────────
  seccion(sheet, 'Solicitudes')
  encabezadoTabla(sheet, 'Métrica', 'Valor')
  filaDato(sheet, 'Nuevas', data.solicitudes.nuevas, false)
  filaDato(sheet, 'Resueltas', data.solicitudes.resueltas, true)
  filaDato(sheet, 'Pendientes', data.solicitudes.pendientes, false)
  sheet.addRow([])

  // ── Contenido ─────────────────────────────────────────────────────
  seccion(sheet, 'Contenido')
  encabezadoTabla(sheet, 'Métrica', 'Valor')
  filaDato(sheet, 'Documentos creados', data.documentos.creados, false)
  filaDato(sheet, 'Documentos publicados', data.documentos.publicados, true)
  filaDato(sheet, 'Mapas creados', data.mapas.creados, false)
  filaDato(sheet, 'Mapas publicados', data.mapas.publicados, true)
  sheet.addRow([])

  // ── Actividad por módulo — con barra de datos nativa de Excel ────
  const modulos = sortedModulos(data)
  if (modulos.length > 0) {
    seccion(sheet, 'Actividad por módulo (mayor a menor)')
    encabezadoTabla(sheet, 'Módulo', 'Eventos')
    const primeraFila = sheet.rowCount + 1
    modulos.forEach((m, i) => filaDato(sheet, m.modulo, m.total, i % 2 === 1))
    const ultimaFila = sheet.rowCount
    sheet.addConditionalFormatting({
      ref: `C${primeraFila}:C${ultimaFila}`,
      rules: [{
        type: 'dataBar', priority: 1, gradient: true, minLength: 0, maxLength: 100, showValue: true, border: false,
        cfvo: [{ type: 'min' }, { type: 'max' }],
        color: { argb: COLOR.gold400 },
      } as import('exceljs').ConditionalFormattingRule],
    })
  }

  sheet.addRow([])
  const footer = sheet.addRow([null, 'Generado automáticamente por VIGIA — los datos reflejan el período seleccionado.', null])
  sheet.mergeCells(footer.number, 2, footer.number, 3)
  footer.getCell(2).font = { italic: true, size: 8, color: { argb: COLOR.textMuted } }

  const buffer = await workbook.xlsx.writeBuffer()
  const blobUrl = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = `reporte-${data.desde}-a-${data.hasta}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(blobUrl)
}
