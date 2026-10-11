// Import solo de tipos: el valor real de exceljs (~930 kB) se carga bajo demanda
// dentro de leerFilasExcel(), no al abrir la herramienta.
import type ExcelJS from 'exceljs'

export type FilaExcel = Record<string, string | number>

// exceljs tipa `load` para Node (`Buffer`), pero su build de navegador acepta ArrayBuffer.
type BufferXlsx = Parameters<InstanceType<typeof ExcelJS.Workbook>['xlsx']['load']>[0]

/** Neutraliza marcado HTML en texto de celdas: el panel arma tablas con innerHTML,
 * así que un Excel con `<`/`>` nunca debe llegar como marcado. */
export function limpiarTexto(valor: string): string {
  return valor.replace(/[<>]/g, '').trim()
}

export function celdaAValor(valor: ExcelJS.CellValue): string | number | undefined {
  if (valor === null || valor === undefined) return undefined
  if (typeof valor === 'number') return valor
  if (typeof valor === 'string') return limpiarTexto(valor)
  if (valor instanceof Date) return valor.toISOString()
  if (typeof valor === 'object') {
    if ('result' in valor) return celdaAValor(valor.result as ExcelJS.CellValue)
    if ('richText' in valor) return limpiarTexto(valor.richText.map((t) => t.text).join(''))
    if ('text' in valor) return limpiarTexto(String(valor.text))
  }
  return limpiarTexto(String(valor))
}

/** Primera hoja de un .xlsx como filas {encabezado: valor} (fila 1 = encabezados).
 * Las celdas vacías se omiten, igual que `sheet_to_json` en el dashboard original. */
export async function leerFilasExcel(file: File): Promise<FilaExcel[]> {
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load((await file.arrayBuffer()) as unknown as BufferXlsx)

  const hoja = workbook.worksheets[0]
  if (!hoja) throw new Error('El archivo no contiene hojas de cálculo')

  const encabezados: string[] = []
  const filas: FilaExcel[] = []

  hoja.eachRow((row, rowNumber) => {
    const valores = row.values as ExcelJS.CellValue[] // 1-indexed
    if (rowNumber === 1) {
      for (let i = 1; i < valores.length; i++) {
        encabezados[i - 1] = String(celdaAValor(valores[i]) ?? '')
      }
      return
    }
    const fila: FilaExcel = {}
    encabezados.forEach((encabezado, i) => {
      if (!encabezado) return
      const v = celdaAValor(valores[i + 1])
      if (v !== undefined && v !== '') fila[encabezado] = v
    })
    filas.push(fila)
  })

  return filas
}
