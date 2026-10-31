import { describe, expect, test } from 'vitest'
import { corregirTerritorio, detalleRegistros, opcionesTerritorio, resumenTerritorio } from '@/components/herramientas/biodiversidad/lib/territorio'
import { FILTROS_VACIOS, type Filtros } from '@/components/herramientas/biodiversidad/lib/filtros'
import type { MunicipioConteo } from '@/components/herramientas/biodiversidad/types'

const m = (codigo_municipal: string, municipio: string, departamento: string, registros = 10): MunicipioConteo =>
  ({ codigo_municipal, municipio, departamento, registros, sin_especie: 0, especies: 1 })
const MUNICIPIOS = [m('27001', 'Quibdó', 'Chocó'), m('76109', 'Buenaventura', 'Valle del Cauca'), m('05837', 'Turbo', 'Antioquia', 0)]
const f = (c: Partial<Filtros>): Filtros => ({ ...FILTROS_VACIOS, ...c })

describe('corregirTerritorio: la URL nunca queda con un territorio contradictorio', () => {
  test('sin territorio no hay nada que corregir', () => {
    expect(corregirTerritorio(f({}), MUNICIPIOS)).toBeNull()
  })
  test('municipio y departamento coherentes: sin cambios', () => {
    expect(corregirTerritorio(f({ municipio: '27001', departamento: 'Chocó' }), MUNICIPIOS)).toBeNull()
  })
  test('el municipio manda: el departamento se alinea con el del municipio', () => {
    expect(corregirTerritorio(f({ municipio: '27001', departamento: 'Valle del Cauca' }), MUNICIPIOS)).toEqual({ departamento: 'Chocó' })
    expect(corregirTerritorio(f({ municipio: '27001' }), MUNICIPIOS)).toEqual({ departamento: 'Chocó' })
  })
  test('municipio inexistente se descarta; el departamento válido se conserva', () => {
    expect(corregirTerritorio(f({ municipio: '99999', departamento: 'Chocó' }), MUNICIPIOS)).toEqual({ municipio: null })
    expect(corregirTerritorio(f({ municipio: '99999' }), MUNICIPIOS)).toEqual({ municipio: null })
  })
  test('departamento inexistente se descarta', () => {
    expect(corregirTerritorio(f({ departamento: 'Foo' }), MUNICIPIOS)).toEqual({ departamento: null })
    expect(corregirTerritorio(f({ departamento: 'Choco' }), MUNICIPIOS)).toEqual({ departamento: null })
  })
  test('no corrige mientras no hay lista de municipios (aún cargando)', () => {
    expect(corregirTerritorio(f({ municipio: '27001', departamento: 'Foo' }), [])).toBeNull()
  })
})

describe('resumenTerritorio', () => {
  test('nada elegido: sin resumen', () => expect(resumenTerritorio(f({}), MUNICIPIOS)).toBeNull())
  test('solo departamento', () => expect(resumenTerritorio(f({ departamento: 'Chocó' }), MUNICIPIOS)).toBe('Chocó'))
  test('municipio con su departamento, en orden de lo general a lo específico', () => {
    expect(resumenTerritorio(f({ departamento: 'Chocó', municipio: '27001' }), MUNICIPIOS)).toBe('Chocó › Quibdó')
    expect(resumenTerritorio(f({ municipio: '27001' }), MUNICIPIOS)).toBe('Chocó › Quibdó')
  })
  test('municipio aún desconocido (cargando): muestra solo el departamento si lo hay', () => {
    expect(resumenTerritorio(f({ departamento: 'Chocó', municipio: '27001' }), [])).toBe('Chocó')
  })
})

describe('detalleRegistros', () => {
  test('con registros muestra la cifra; sin registros lo dice', () => {
    expect(detalleRegistros(1234)).toBe('1.234')
    expect(detalleRegistros(0)).toBe('sin registros')
  })
})

describe('opcionesTerritorio', () => {
  test('departamentos: orden alfabético con la suma de registros', () => {
    expect(opcionesTerritorio(MUNICIPIOS, null).departamentos).toEqual([
      { valor: 'Antioquia', etiqueta: 'Antioquia', detalle: 'sin registros' },
      { valor: 'Chocó', etiqueta: 'Chocó', detalle: '10' },
      { valor: 'Valle del Cauca', etiqueta: 'Valle del Cauca', detalle: '10' },
    ])
  })
  test('municipios: todos si no hay departamento; solo los de ese departamento si lo hay', () => {
    expect(opcionesTerritorio(MUNICIPIOS, null).municipios.map((o) => o.etiqueta)).toEqual(['Buenaventura', 'Quibdó', 'Turbo'])
    expect(opcionesTerritorio(MUNICIPIOS, 'Chocó').municipios).toEqual([{ valor: '27001', etiqueta: 'Quibdó', detalle: '10' }])
  })
  test('sin departamento, el detalle del municipio nombra su departamento para no confundir homónimos', () => {
    expect(opcionesTerritorio(MUNICIPIOS, null).municipios[0]).toMatchObject({ etiqueta: 'Buenaventura', detalle: '10 · Valle del Cauca' })
  })
})
