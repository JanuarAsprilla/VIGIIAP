/**
 * Tests de integración real (sin mocks) para leerFilasExcel.ts -- genera un
 * .xlsx real en memoria con ExcelJS (la misma librería que usa la función) y
 * lo parsea de vuelta, en vez de mockear ExcelJS (fragil y no probaría nada real).
 */
import { describe, test, expect } from 'vitest'
import ExcelJS from 'exceljs'
import { leerFilasExcel } from '@/components/herramientas/panel-choco/lib/leerFilasExcel'

async function excelDeFilas(encabezados: string[], filas: (string | number)[][]): Promise<File> {
  const workbook = new ExcelJS.Workbook()
  const hoja = workbook.addWorksheet('Datos')
  hoja.addRow(encabezados)
  filas.forEach((fila) => hoja.addRow(fila))
  const buffer = await workbook.xlsx.writeBuffer()
  return new File([buffer], 'datos.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

describe('leerFilasExcel', () => {
  test('lee encabezados de la fila 1 y mapea cada fila siguiente a un objeto', async () => {
    const file = await excelDeFilas(['DeptoNom', 'MpNombre', 'Area_ha'], [
      ['Chocó', 'Quibdó', 1000],
      ['Chocó', 'Riosucio', 2000],
    ])
    const filas = await leerFilasExcel(file)

    expect(filas).toEqual([
      { DeptoNom: 'Chocó', MpNombre: 'Quibdó', Area_ha: 1000 },
      { DeptoNom: 'Chocó', MpNombre: 'Riosucio', Area_ha: 2000 },
    ])
  })

  test('sin filas de datos (solo encabezados), retorna un arreglo vacío', async () => {
    const file = await excelDeFilas(['DeptoNom', 'MpNombre', 'Area_ha'], [])
    const filas = await leerFilasExcel(file)
    expect(filas).toEqual([])
  })

  test('celdas de fórmula devuelven el resultado calculado, no la fórmula', async () => {
    const workbook = new ExcelJS.Workbook()
    const hoja = workbook.addWorksheet('Datos')
    hoja.addRow(['Total'])
    const row = hoja.addRow([])
    row.getCell(1).value = { formula: 'SUM(1,2)', result: 3 }
    const buffer = await workbook.xlsx.writeBuffer()
    const file = new File([buffer], 'formula.xlsx')

    const filas = await leerFilasExcel(file)
    expect(filas[0].Total).toBe(3)
  })

  test('un archivo sin ninguna hoja lanza un error explícito', async () => {
    const workbook = new ExcelJS.Workbook()
    const buffer = await workbook.xlsx.writeBuffer()
    const file = new File([buffer], 'vacio.xlsx')

    await expect(leerFilasExcel(file)).rejects.toThrow('El archivo no contiene hojas de cálculo')
  })

  test('una columna de encabezado vacía se ignora al construir cada fila', async () => {
    const workbook = new ExcelJS.Workbook()
    const hoja = workbook.addWorksheet('Datos')
    hoja.addRow(['DeptoNom', '', 'Area_ha'])
    hoja.addRow(['Chocó', 'ignorado', 1000])
    const buffer = await workbook.xlsx.writeBuffer()
    const file = new File([buffer], 'datos.xlsx')

    const filas = await leerFilasExcel(file)
    expect(filas[0]).toEqual({ DeptoNom: 'Chocó', Area_ha: 1000 })
  })
})
