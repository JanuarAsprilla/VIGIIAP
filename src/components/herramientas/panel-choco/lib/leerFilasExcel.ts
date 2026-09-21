import ExcelJS from 'exceljs'
import type { FilaExcel } from '../types'

function celdaAValor(valor: ExcelJS.CellValue): string | number | undefined {
  if (valor === null || valor === undefined) return undefined
  if (typeof valor === 'object') {
    if ('result' in valor) return valor.result as string | number // fórmula
    if ('text' in valor) return String(valor.text) // rich text
    if (valor instanceof Date) return valor.toISOString()
  }
  if (typeof valor === 'number' || typeof valor === 'string') return valor
  return String(valor)
}

/** Lee la primera hoja de un .xlsx/.xls como filas objeto {columna: valor}, usando la
 * fila 1 como encabezados. Reutiliza `exceljs` (ya dependencia del proyecto para exportar)
 * en vez de sumar una librería nueva solo para leer. */
// exceljs tipa `load` para Node (`Buffer`), pero su build de navegador acepta un
// ArrayBuffer sin problema — se referencia el tipo del propio parámetro en vez de
// nombrar `Buffer` (no disponible en el lib de TS para código de navegador).
type BufferXlsx = Parameters<InstanceType<typeof ExcelJS.Workbook>['xlsx']['load']>[0]

export async function leerFilasExcel(file: File): Promise<FilaExcel[]> {
  const buffer = await file.arrayBuffer()
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer as unknown as BufferXlsx)

  const hoja = workbook.worksheets[0]
  if (!hoja) throw new Error('El archivo no contiene hojas de cálculo')

  const encabezados: string[] = []
  const filas: FilaExcel[] = []

  hoja.eachRow((row, rowNumber) => {
    const valores = row.values as ExcelJS.CellValue[] // exceljs es 1-indexed; valores[0] es undefined
    if (rowNumber === 1) {
      for (let i = 1; i < valores.length; i++) {
        encabezados[i - 1] = String(celdaAValor(valores[i]) ?? '').trim()
      }
      return
    }
    const fila: FilaExcel = {}
    encabezados.forEach((encabezado, i) => {
      if (!encabezado) return
      fila[encabezado] = celdaAValor(valores[i + 1])
    })
    filas.push(fila)
  })

  return filas
}
