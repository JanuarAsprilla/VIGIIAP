import { describe, test, expect } from 'vitest'
import { haceCuanto, lineasResumen, coincideBusqueda } from '@/lib/inventarioGeoserver'

const AHORA = Date.parse('2026-11-24T12:00:00Z')
const antes = (ms: number) => new Date(AHORA - ms).toISOString()

describe('haceCuanto', () => {
  test.each([
    [5_000, 'hace unos segundos'],
    [90_000, 'hace 1 min'],
    [25 * 60_000, 'hace 25 min'],
    [3 * 3_600_000, 'hace 3 h'],
    [26 * 3_600_000, 'hace 1 día'],
    [4 * 86_400_000, 'hace 4 días'],
  ])('%i ms atrás se dice «%s»', (ms, texto) => {
    expect(haceCuanto(antes(ms), AHORA)).toBe(texto)
  })

  test('una fecha futura o inválida no rompe', () => {
    expect(haceCuanto(antes(-60_000), AHORA)).toBe('hace unos segundos')
    expect(haceCuanto('no-es-fecha', AHORA)).toBe('en una fecha desconocida')
  })
})

describe('lineasResumen', () => {
  test('lista solo los tipos presentes, en orden fijo, con ceros por omisión', () => {
    const lineas = lineasResumen({ capas: { nuevos: 2, eliminados: 1 }, espacios: { cambiados: 3 } })
    expect(lineas).toEqual([
      { tipo: 'espacios', etiqueta: 'Espacios de trabajo', nuevos: 0, cambiados: 3, eliminados: 0 },
      { tipo: 'capas', etiqueta: 'Capas', nuevos: 2, cambiados: 0, eliminados: 1 },
    ])
  })

  test('null o vacío da una lista vacía', () => {
    expect(lineasResumen(null)).toEqual([])
    expect(lineasResumen({})).toEqual([])
  })
})

describe('coincideBusqueda', () => {
  test('ignora mayúsculas y tildes y exige todas las palabras', () => {
    expect(coincideBusqueda(['Geología', 't_15:unidades'], 'geologia unidades')).toBe(true)
    expect(coincideBusqueda(['Geología'], 'suelos')).toBe(false)
  })

  test('búsqueda vacía coincide con todo y los nulos se ignoran', () => {
    expect(coincideBusqueda([null, undefined], '  ')).toBe(true)
    expect(coincideBusqueda([null, 'abc'], 'abc')).toBe(true)
  })
})
