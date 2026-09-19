// Helpers compartidos para generar libros .xlsx con la identidad institucional
// de VIGIA/IIAP (logo, paleta de marca, secciones con banda de color). Usado
// por los exports de Reportes y Actividad -- evita reimplementar el mismo
// encabezado institucional en cada página que exporta a Excel.

export const COLOR_INSTITUCIONAL = {
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

export async function logoInstitucionalBase64(): Promise<string | null> {
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

/** Banda verde institucional en las filas 1-3, con logo flotante y título en las columnas 2..ultimaColumna. */
export function bandaInstitucional(
  workbook: import('exceljs').Workbook,
  sheet: import('exceljs').Worksheet,
  opciones: { titulo: string; ultimaColumna: number; logo: string | null },
): void {
  for (let r = 1; r <= 3; r++) {
    const row = sheet.getRow(r)
    row.height = 20
    for (let c = 1; c <= opciones.ultimaColumna; c++) {
      row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_INSTITUCIONAL.primary700 } }
    }
  }
  sheet.mergeCells(1, 2, 3, opciones.ultimaColumna)
  const tituloCell = sheet.getCell(1, 2)
  tituloCell.value = opciones.titulo
  tituloCell.font = { bold: true, size: 12, color: { argb: COLOR_INSTITUCIONAL.white } }
  tituloCell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'left', indent: 1 }

  if (opciones.logo) {
    const imageId = workbook.addImage({ base64: opciones.logo, extension: 'png' })
    sheet.addImage(imageId, { tl: { col: 0.15, row: 0.15 }, ext: { width: 48, height: 48 } })
  }
}

/** Línea de metadatos (período, filtros aplicados, fecha de generación) bajo la banda institucional. */
export function lineaMeta(
  sheet: import('exceljs').Worksheet,
  texto: string,
  opciones: { ultimaColumna: number; destacado?: boolean },
): import('exceljs').Row {
  const row = sheet.addRow([])
  const cell = row.getCell(2)
  cell.value = texto
  sheet.mergeCells(row.number, 2, row.number, opciones.ultimaColumna)
  if (opciones.destacado) {
    cell.font = { bold: true, size: 10.5, color: { argb: COLOR_INSTITUCIONAL.primary700 } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_INSTITUCIONAL.primary50 } }
  } else {
    cell.font = { italic: true, size: 9, color: { argb: COLOR_INSTITUCIONAL.textMuted } }
  }
  return row
}

/** Banda de sección (p. ej. "Usuarios", "Actividad por módulo") con fondo verde vivo. */
export function seccion(sheet: import('exceljs').Worksheet, titulo: string, ultimaColumna: number): import('exceljs').Row {
  const row = sheet.addRow([])
  row.height = 22
  for (let c = 1; c <= ultimaColumna; c++) {
    row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_INSTITUCIONAL.primary500 } }
  }
  const cell = row.getCell(2)
  cell.value = titulo
  cell.font = { bold: true, color: { argb: COLOR_INSTITUCIONAL.white }, size: 11 }
  cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  sheet.mergeCells(row.number, 1, row.number, ultimaColumna)
  return row
}

/** Fila de encabezado de tabla (nombres de columna) con fondo gris claro. */
export function encabezadoFila(sheet: import('exceljs').Worksheet, valores: (string | null)[]): import('exceljs').Row {
  const row = sheet.addRow(valores)
  row.eachCell({ includeEmpty: false }, (cell) => {
    cell.font = { bold: true, size: 10, color: { argb: COLOR_INSTITUCIONAL.textMuted } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_INSTITUCIONAL.bgAlt } }
    cell.border = { bottom: { style: 'thin', color: { argb: COLOR_INSTITUCIONAL.border } } }
  })
  return row
}

/** Fila de datos con relleno zebra opcional en el rango [colInicio, colFin]. */
export function filaDatos(
  sheet: import('exceljs').Worksheet,
  valores: (string | number | null)[],
  opciones: { zebra: boolean; colInicio: number; colFin: number },
): import('exceljs').Row {
  const row = sheet.addRow(valores)
  if (opciones.zebra) {
    for (let c = opciones.colInicio; c <= opciones.colFin; c++) {
      row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_INSTITUCIONAL.bgAlt } }
    }
  }
  return row
}

export function pieDePagina(sheet: import('exceljs').Worksheet, texto: string, ultimaColumna: number): void {
  sheet.addRow([])
  const row = sheet.addRow([])
  const cell = row.getCell(2)
  cell.value = texto
  cell.font = { italic: true, size: 8, color: { argb: COLOR_INSTITUCIONAL.textMuted } }
  sheet.mergeCells(row.number, 2, row.number, ultimaColumna)
}

export async function descargarWorkbook(workbook: import('exceljs').Workbook, nombreArchivo: string): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer()
  const blobUrl = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = nombreArchivo
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(blobUrl)
}
