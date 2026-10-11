import { describe, test, expect } from 'vitest'
import ExcelJS from 'exceljs'
import { celdaAValor, limpiarTexto, leerFilasExcel } from '@/components/herramientas/panel-choco/leerFilasExcel'

async function xlsxComoFile(filas: (string | number | null)[][]): Promise<File> {
  const wb = new ExcelJS.Workbook()
  const hoja = wb.addWorksheet('datos')
  filas.forEach((f) => hoja.addRow(f))
  const buffer = await wb.xlsx.writeBuffer()
  return new File([buffer], 'datos.xlsx')
}

describe('limpiarTexto / celdaAValor', () => {
  test('elimina < y > para que un Excel no pueda inyectar marcado', () => {
    expect(limpiarTexto('  <img src=x onerror=alert(1)> Riosucio ')).toBe('img src=x onerror=alert(1) Riosucio')
  })

  test('devuelve números tal cual y texto limpio', () => {
    expect(celdaAValor(12.5)).toBe(12.5)
    expect(celdaAValor('<b>Chocó</b>')).toBe('bChocó/b')
  })

  test('null y undefined quedan como undefined', () => {
    expect(celdaAValor(null)).toBeUndefined()
    expect(celdaAValor(undefined)).toBeUndefined()
  })

  test('toma el resultado de una fórmula y el texto de rich text', () => {
    expect(celdaAValor({ formula: 'A1+1', result: 7 } as ExcelJS.CellValue)).toBe(7)
    expect(celdaAValor({ richText: [{ text: 'Ría' }, { text: 'ño' }] } as ExcelJS.CellValue)).toBe('Ríaño')
  })
})

describe('leerFilasExcel', () => {
  test('usa la fila 1 como encabezados y omite celdas vacías', async () => {
    const file = await xlsxComoFile([
      ['DeptoNom', 'MpNombre', 'Area_ha'],
      ['Chocó', 'Riosucio', 100.5],
      ['Chocó', null, 20],
    ])
    const filas = await leerFilasExcel(file)
    expect(filas).toEqual([
      { DeptoNom: 'Chocó', MpNombre: 'Riosucio', Area_ha: 100.5 },
      { DeptoNom: 'Chocó', Area_ha: 20 },
    ])
  })

  test('rechaza un archivo que no es un xlsx válido', async () => {
    await expect(leerFilasExcel(new File(['no es excel'], 'x.xlsx'))).rejects.toThrow()
  })
})
