/**
 * Tests unitarios para recalcularTitulacion.ts -- lógica real de recálculo
 * de titulación colectiva desde Excel (CC/RI), contra los datos reales
 * generados (limites.generated.ts), no mocks.
 */
import { describe, test, expect } from 'vitest'
import { recalcularTitulacion } from '@/components/herramientas/panel-choco/lib/recalcularTitulacion'
import type { FilaExcel } from '@/components/herramientas/panel-choco/types'

// Riosucio (Chocó) tiene área base real 589609.6 Ha en DEFAULT_LIMITES_MUNIS.
const RIOSUCIO_AREA = 589609.6

describe('recalcularTitulacion', () => {
  test('sin filas, retorna deptos y munis vacíos', () => {
    const result = recalcularTitulacion([], [])
    expect(result.deptos).toEqual([])
    expect(result.munis).toEqual({})
  })

  test('un predio CC y uno RI en el mismo municipio: cc/ri/st se calculan contra el área base real', () => {
    const cc: FilaExcel[] = [{ DeptoNom: 'Chocó', MpNombre: 'Riosucio', Area_ha: 1000, NOMBRE: 'Consejo A' }]
    const ri: FilaExcel[] = [{ DeptoNom: 'Chocó', MpNombre: 'Riosucio', Area_ha: 500, NOMBRE: 'Resguardo B' }]

    const { deptos, munis } = recalcularTitulacion(cc, ri)

    expect(deptos).toHaveLength(1)
    expect(deptos[0]).toMatchObject({ id: 'choco', cc: 1000, ri: 500, num_cc: 1, num_ri: 1, municipios: 1 })
    expect(deptos[0].st).toBe(RIOSUCIO_AREA - 1500)
    expect(deptos[0].pct).toBe(100)

    const municipio = munis.choco[0]
    expect(municipio).toMatchObject({ name: 'Riosucio', cc: 1000, ri: 500, area: RIOSUCIO_AREA })
    expect(municipio.cc_nombres).toEqual([{ nombre: 'Consejo A', area: 1000 }])
    expect(municipio.ri_nombres).toEqual([{ nombre: 'Resguardo B', area: 500 }])
  })

  test('municipio sin área base conocida: el área total cae al total CC+RI, sin "sin titular" negativo', () => {
    const cc: FilaExcel[] = [{ DeptoNom: 'Chocó', MpNombre: 'Municipio Inexistente', Area_ha: 300 }]
    const { deptos, munis } = recalcularTitulacion(cc, [])

    expect(munis.choco[0]).toMatchObject({ name: 'Municipio Inexistente', area: 300, st: 0 })
    expect(deptos[0].st).toBe(0)
  })

  test('normaliza un alias de departamento vía DEPTO_MAP ("Narño" -> "Nariño")', () => {
    const cc: FilaExcel[] = [{ DeptoNom: 'Narño', MpNombre: 'Tumaco', Area_ha: 100 }]
    const { deptos } = recalcularTitulacion(cc, [])
    expect(deptos[0].id).toBe('narino')
  })

  test('departamento totalmente desconocido: genera un id slugificado y nombreParaId cae al id mismo', () => {
    const cc: FilaExcel[] = [{ DeptoNom: 'Provincia Ficticia', MpNombre: 'Pueblo X', Area_ha: 50 }]
    const { deptos } = recalcularTitulacion(cc, [])
    expect(deptos[0].id).toBe('provincia-ficticia')
    expect(deptos[0].name).toBe('provincia-ficticia')
  })

  test('descarta filas sin municipio o con Area_ha no numérica', () => {
    const cc: FilaExcel[] = [
      { DeptoNom: 'Chocó', MpNombre: '', Area_ha: 100 },
      { DeptoNom: 'Chocó', MpNombre: 'Riosucio', Area_ha: 'no-es-un-número' as unknown as number },
      { DeptoNom: 'Chocó', MpNombre: 'Riosucio', Area_ha: 200 },
    ]
    const { munis } = recalcularTitulacion(cc, [])
    expect(munis.choco).toHaveLength(1)
    expect(munis.choco[0].cc).toBe(200)
  })

  test('predios sin NOMBRE ni ID usan el nombre por defecto "CC sin nombre"/"RI sin nombre"', () => {
    const cc: FilaExcel[] = [{ DeptoNom: 'Chocó', MpNombre: 'Riosucio', Area_ha: 10 }]
    const ri: FilaExcel[] = [{ DeptoNom: 'Chocó', MpNombre: 'Riosucio', Area_ha: 20 }]
    const { munis } = recalcularTitulacion(cc, ri)
    expect(munis.choco[0].cc_nombres).toEqual([{ nombre: 'CC sin nombre', area: 10 }])
    expect(munis.choco[0].ri_nombres).toEqual([{ nombre: 'RI sin nombre', area: 20 }])
  })

  test('ID sirve como respaldo del nombre del predio cuando no hay NOMBRE', () => {
    const cc: FilaExcel[] = [{ DeptoNom: 'Chocó', MpNombre: 'Riosucio', Area_ha: 10, ID: 'CC-042' }]
    const { munis } = recalcularTitulacion(cc, [])
    expect(munis.choco[0].cc_nombres).toEqual([{ nombre: 'CC-042', area: 10 }])
  })

  test('varios predios del mismo tipo en el mismo municipio se acumulan por nombre', () => {
    const cc: FilaExcel[] = [
      { DeptoNom: 'Chocó', MpNombre: 'Riosucio', Area_ha: 10, NOMBRE: 'Consejo A' },
      { DeptoNom: 'Chocó', MpNombre: 'Riosucio', Area_ha: 5, NOMBRE: 'Consejo A' },
      { DeptoNom: 'Chocó', MpNombre: 'Riosucio', Area_ha: 7, NOMBRE: 'Consejo B' },
    ]
    const { munis, deptos } = recalcularTitulacion(cc, [])
    expect(munis.choco[0].cc).toBe(22)
    expect(munis.choco[0].num_cc).toBe(2) // 2 predios distintos, no 3 filas
    expect(deptos[0].num_cc).toBe(2)
  })

  test('varios municipios en un depto: ordena por área descendente y suma correctamente a nivel depto', () => {
    const cc: FilaExcel[] = [
      { DeptoNom: 'Chocó', MpNombre: 'Riosucio', Area_ha: 100 },     // área base grande (589609.6)
      { DeptoNom: 'Chocó', MpNombre: 'Quibdó', Area_ha: 50 },        // área base menor (350865.6)
    ]
    const { munis, deptos } = recalcularTitulacion(cc, [])
    expect(munis.choco.map((m) => m.name)).toEqual(['Riosucio', 'Quibdó'])
    expect(deptos[0].municipios).toBe(2)
    expect(deptos[0].cc).toBe(150)
  })

  test('varios departamentos: pct se calcula sobre el total general y ordena deptos por área descendente', () => {
    const cc: FilaExcel[] = [
      { DeptoNom: 'Chocó', MpNombre: 'Riosucio', Area_ha: 100 },   // área base 589609.6 -- domina el total
      { DeptoNom: 'Cauca', MpNombre: 'López', Area_ha: 50 },       // área base 337042.7
    ]
    const { deptos } = recalcularTitulacion(cc, [])
    expect(deptos).toHaveLength(2)
    expect(deptos[0].id).toBe('choco') // mayor área base -> primero
    const totalPct = deptos.reduce((acc, d) => acc + d.pct, 0)
    expect(totalPct).toBeCloseTo(100, 5)
  })
})
