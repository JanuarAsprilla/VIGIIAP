/**
 * Tests unitarios para recalcularLimites.ts -- reagregación del layer
 * "límites" desde Excel (columnas DeptoNom/MpNombre/AreaHa).
 */
import { describe, test, expect } from 'vitest'
import { recalcularLimites } from '@/components/herramientas/panel-choco/lib/recalcularLimites'
import type { FilaExcel } from '@/components/herramientas/panel-choco/types'

describe('recalcularLimites', () => {
  test('sin filas, retorna deptos y munis vacíos', () => {
    const result = recalcularLimites([])
    expect(result.deptos).toEqual([])
    expect(result.munis).toEqual({})
  })

  test('una fila: depto y municipio quedan con el área exacta y pct=100', () => {
    const filas: FilaExcel[] = [{ DeptoNom: 'Chocó', MpNombre: 'Quibdó', AreaHa: 1000 }]
    const { deptos, munis } = recalcularLimites(filas)

    expect(deptos).toEqual([{ id: 'choco', name: 'Chocó', municipios: 1, area: 1000, pct: 100 }])
    expect(munis.choco).toEqual([{ name: 'Quibdó', area: 1000 }])
  })

  test('varias filas del mismo municipio se acumulan en una sola entrada', () => {
    const filas: FilaExcel[] = [
      { DeptoNom: 'Chocó', MpNombre: 'Quibdó', AreaHa: 100 },
      { DeptoNom: 'Chocó', MpNombre: 'Quibdó', AreaHa: 50 },
    ]
    const { munis } = recalcularLimites(filas)
    expect(munis.choco).toEqual([{ name: 'Quibdó', area: 150 }])
  })

  test('varios municipios en el mismo depto: ordena munis por área descendente', () => {
    const filas: FilaExcel[] = [
      { DeptoNom: 'Chocó', MpNombre: 'Riosucio', AreaHa: 50 },
      { DeptoNom: 'Chocó', MpNombre: 'Quibdó', AreaHa: 200 },
    ]
    const { deptos, munis } = recalcularLimites(filas)
    expect(deptos[0]).toMatchObject({ municipios: 2, area: 250 })
    expect(munis.choco.map((m) => m.name)).toEqual(['Quibdó', 'Riosucio'])
  })

  test('varios departamentos: pct se calcula sobre el total general', () => {
    const filas: FilaExcel[] = [
      { DeptoNom: 'Chocó', MpNombre: 'Quibdó', AreaHa: 300 },
      { DeptoNom: 'Cauca', MpNombre: 'López', AreaHa: 100 },
    ]
    const { deptos } = recalcularLimites(filas)
    const choco = deptos.find((d) => d.id === 'choco')!
    const cauca = deptos.find((d) => d.id === 'cauca')!
    expect(choco.pct).toBeCloseTo(75, 5)
    expect(cauca.pct).toBeCloseTo(25, 5)
  })

  test('normaliza un alias de departamento vía DEPTO_MAP ("Valle del cauca" -> "Valle del Cauca")', () => {
    const filas: FilaExcel[] = [{ DeptoNom: 'Valle del cauca', MpNombre: 'Buenaventura', AreaHa: 10 }]
    const { deptos } = recalcularLimites(filas)
    expect(deptos[0]).toMatchObject({ id: 'valle', name: 'Valle del Cauca' })
  })

  test('departamento desconocido genera un id slugificado (sin tildes, minúsculas, espacios a guiones)', () => {
    const filas: FilaExcel[] = [{ DeptoNom: 'Región Nueva', MpNombre: 'Pueblo X', AreaHa: 10 }]
    const { deptos } = recalcularLimites(filas)
    // normalize('NFD') + strip de marcas diacríticas quita la tilde: "Región" -> "region"
    expect(deptos[0].id).toBe('region-nueva')
  })

  test('descarta filas sin depto, sin municipio, o con AreaHa no numérica', () => {
    const filas: FilaExcel[] = [
      { DeptoNom: '', MpNombre: 'Quibdó', AreaHa: 100 },
      { DeptoNom: 'Chocó', MpNombre: '', AreaHa: 100 },
      { DeptoNom: 'Chocó', MpNombre: 'Quibdó', AreaHa: 'no-numérico' as unknown as number },
      { DeptoNom: 'Chocó', MpNombre: 'Quibdó', AreaHa: 42 },
    ]
    const { munis } = recalcularLimites(filas)
    expect(munis.choco).toEqual([{ name: 'Quibdó', area: 42 }])
  })
})
