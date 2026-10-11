import { describe, test, expect, vi } from 'vitest'
import type ExcelJS from 'exceljs'

vi.mock('@/lib/excelInstitucional', () => ({ descargarWorkbook: vi.fn().mockResolvedValue(undefined) }))
import { descargarWorkbook } from '@/lib/excelInstitucional'
import {
  parseCsv, filasDeTabla, cruzarConPuntos, contarDescripcionesCortas, enTandas, descargarPlantillaFichas,
  DESCRIPCION_MINIMA, TAMANO_TANDA,
} from '@/lib/fichas/importarFichas'
import type { FeatureFichaEstado } from '@/types'

describe('parseCsv', () => {
  test('lee encabezados y filas separados por coma', () => {
    expect(parseCsv('identificador,titulo,descripcion\nEST-001,Quibdó,Texto uno\nEST-002,Atrato,Texto dos')).toEqual([
      { identificador: 'EST-001', titulo: 'Quibdó', descripcion: 'Texto uno' },
      { identificador: 'EST-002', titulo: 'Atrato', descripcion: 'Texto dos' },
    ])
  })

  test('detecta el punto y coma que usa Excel en configuración regional en español', () => {
    expect(parseCsv('identificador;descripcion\nEST-001;Texto, con coma')).toEqual([
      { identificador: 'EST-001', descripcion: 'Texto, con coma' },
    ])
  })

  test('respeta comillas con comas, saltos de línea y comillas escapadas', () => {
    const csv = 'identificador,descripcion\nEST-001,"Línea uno\nlínea dos, con ""comillas"""'
    expect(parseCsv(csv)).toEqual([{ identificador: 'EST-001', descripcion: 'Línea uno\nlínea dos, con "comillas"' }])
  })

  test('ignora el BOM inicial y los finales de línea de Windows', () => {
    expect(parseCsv('﻿identificador,descripcion\r\nEST-001,Texto\r\n')).toEqual([
      { identificador: 'EST-001', descripcion: 'Texto' },
    ])
  })

  test('omite las filas totalmente vacías', () => {
    expect(parseCsv('identificador,descripcion\nEST-001,Texto\n\n,\n')).toEqual([
      { identificador: 'EST-001', descripcion: 'Texto' },
    ])
  })
})

describe('filasDeTabla', () => {
  test('reconoce los encabezados sin importar mayúsculas, tildes ni alias', () => {
    const r = filasDeTabla([{ 'Código': 'EST-001', 'Título': 'Quibdó', 'Descripción': 'Texto largo de ejemplo' }])

    expect(r.error).toBeNull()
    expect(r.filas).toEqual([{ valor: 'EST-001', titulo: 'Quibdó', descripcion: 'Texto largo de ejemplo' }])
  })

  test('convierte identificadores numéricos a texto', () => {
    const r = filasDeTabla([{ identificador: 1001, descripcion: 'Texto' }])

    expect(r.filas[0].valor).toBe('1001')
  })

  test('la columna de etiqueta de la plantilla es solo de referencia y no se importa', () => {
    const r = filasDeTabla([{ Identificador: 'EST-001', Etiqueta: 'Quibdó Centro', Descripción: 'Texto' }])

    expect(r.filas[0]).toEqual({ valor: 'EST-001', titulo: undefined, descripcion: 'Texto' })
  })

  test('avisa si falta la columna de identificador', () => {
    expect(filasDeTabla([{ descripcion: 'Texto' }]).error).toMatch(/identificador/i)
  })

  test('avisa si faltan tanto la descripción como el título', () => {
    expect(filasDeTabla([{ identificador: 'EST-001' }]).error).toMatch(/descripci/i)
  })

  test('cuenta y descarta las filas sin identificador', () => {
    const r = filasDeTabla([{ identificador: 'EST-001', descripcion: 'Texto' }, { identificador: '  ', descripcion: 'Huérfana' }])

    expect(r.filas).toHaveLength(1)
    expect(r.sinIdentificador).toBe(1)
  })

  test('una tabla vacía no es un error de columnas pero no trae filas', () => {
    const r = filasDeTabla([])

    expect(r.filas).toEqual([])
    expect(r.error).toMatch(/no tiene filas/i)
  })
})

describe('cruzarConPuntos', () => {
  const filas = [
    { valor: 'EST-001', descripcion: 'a' },
    { valor: 'EST-999', descripcion: 'b' },
    { valor: 'EST-002', descripcion: 'c' },
  ]

  test('separa las filas que coinciden con un punto de la capa de las que no', () => {
    const r = cruzarConPuntos(filas, new Set(['EST-001', 'EST-002']))

    expect(r.coinciden.map((f) => f.valor)).toEqual(['EST-001', 'EST-002'])
    expect(r.sinCoincidencia).toEqual(['EST-999'])
  })
})

describe('contarDescripcionesCortas', () => {
  test('cuenta las descripciones por debajo del mínimo', () => {
    const corta = 'x'.repeat(DESCRIPCION_MINIMA - 1)
    const justa = 'x'.repeat(DESCRIPCION_MINIMA)

    expect(contarDescripcionesCortas([
      { valor: 'a', descripcion: corta }, { valor: 'b', descripcion: justa }, { valor: 'c', descripcion: '' },
    ])).toBe(2)
  })

  test('no cuenta los espacios sobrantes', () => {
    expect(contarDescripcionesCortas([{ valor: 'a', descripcion: `  ${'x'.repeat(DESCRIPCION_MINIMA - 1)}  ` }])).toBe(1)
  })
})

describe('enTandas', () => {
  test('parte la lista en tandas del tamaño pedido', () => {
    expect(enTandas([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
  })

  test('una lista vacía no produce tandas', () => {
    expect(enTandas([], TAMANO_TANDA)).toEqual([])
  })
})

describe('descargarPlantillaFichas', () => {
  const punto = (valor: string, etiqueta: string | null): FeatureFichaEstado => ({
    valor, etiqueta, centroide: [0, 0], nFeatures: 1, estado: 'incompleta', fichaId: null,
    nImagenes: 0, nVideos: 0, tieneDescripcion: false, actualizadoEn: null,
  })

  test('genera una fila por punto con su identificador y etiqueta, y deja título y descripción en blanco', async () => {
    await descargarPlantillaFichas([punto('EST-001', 'Quibdó Centro'), punto('EST-002', null)], 'Estaciones climáticas IDEAM')

    const [libro, nombre] = vi.mocked(descargarWorkbook).mock.calls[0] as [ExcelJS.Workbook, string]
    const hoja = libro.worksheets[0]
    expect(nombre).toBe('fichas-estaciones-climaticas-ideam.xlsx')
    expect(hoja.getRow(1).values).toEqual([undefined, 'Identificador', 'Etiqueta (solo referencia)', 'Título', 'Descripción'])
    expect(hoja.getRow(2).getCell(1).value).toBe('EST-001')
    expect(hoja.getRow(2).getCell(2).value).toBe('Quibdó Centro')
    expect(hoja.getRow(3).getCell(1).value).toBe('EST-002')
    expect(hoja.getRow(3).getCell(3).value).toBeNull()
  })

  test('la plantilla se puede volver a importar: su encabezado es reconocido', () => {
    const r = filasDeTabla([{ 'Identificador': 'EST-001', 'Etiqueta (solo referencia)': 'Quibdó', 'Título': 'Uno', 'Descripción': 'Texto largo de la ficha' }])

    expect(r.error).toBeNull()
    expect(r.filas).toEqual([{ valor: 'EST-001', titulo: 'Uno', descripcion: 'Texto largo de la ficha' }])
  })
})
