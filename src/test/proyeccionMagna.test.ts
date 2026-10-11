/**
 * WGS84 <-> MAGNA-SIRGAS (4 zonas) y WGS84 <-> UTM 18N — round-trip y
 * known-point checks contra los parámetros oficiales EPSG. Este math backs
 * el conversor de coordenadas real (ConversorCoordenadas.tsx) — una fórmula
 * silenciosamente incorrecta acá significa coordenadas oficiales
 * silenciosamente incorrectas en la plataforma, así que vale la pena
 * verificar contra propiedades exactas y demostrables, no solo "devuelve un
 * número". (El origen usado antes -77°/4° "redondo" en vez del oficial
 * -77.0775079166667°/4.59620041666667° desplazaba cada conversión varios
 * kilómetros del valor real — ver ZONAS_MAGNA.)
 */
import { describe, test, expect } from 'vitest'
import {
  wgs84ToMagna, magnaToWgs84, ZONAS_MAGNA, type ZonaMagna,
  wgs84ToUtm18N, utm18NToWgs84,
  dmsToDecimal, decimalToDms,
} from '@/lib/proyeccionMagna'

const ZONAS: ZonaMagna[] = ['oeste', 'bogota', 'esteCentral', 'este']

describe('wgs84ToMagna — cada zona mapea su propio origen oficial exacto a (FE, FN)', () => {
  test.each(ZONAS)('%s: (4°35\'46.32"N, meridiano central) → (1,000,000, 1,000,000)', (zona) => {
    const { lon0 } = ZONAS_MAGNA[zona]
    const { x, y } = wgs84ToMagna(4.59620041666667, lon0, zona)
    expect(x).toBeCloseTo(1_000_000, 1)
    expect(y).toBeCloseTo(1_000_000, 1)
  })
})

describe('wgs84ToMagna — Colombia Oeste, valores conocidos', () => {
  test('moving east of the central meridian increases X past the false easting', () => {
    const { x } = wgs84ToMagna(4.5962004, -76.0, 'oeste')
    expect(x).toBeGreaterThan(1_000_000)
  })

  test('moving west of the central meridian decreases X below the false easting', () => {
    const { x } = wgs84ToMagna(4.5962004, -78.0, 'oeste')
    expect(x).toBeLessThan(1_000_000)
  })

  test('moving north of the origin latitude increases Y past the false northing', () => {
    const { y } = wgs84ToMagna(6.0, -77.0775079, 'oeste')
    expect(y).toBeGreaterThan(1_000_000)
  })

  test('moving south of the origin latitude decreases Y below the false northing', () => {
    const { y } = wgs84ToMagna(2.0, -77.0775079, 'oeste')
    expect(y).toBeLessThan(1_000_000)
  })
})

describe('wgs84ToMagna -> magnaToWgs84 round-trip, cada zona', () => {
  const puntos: [number, number][] = [
    [6.2442, -75.5812], // Medellín
    [5.6878, -76.6581], // Quibdó
    [3.4516, -76.5320], // Cali
    [1.2, -78.9],       // sur del Chocó biogeográfico
    [4.7110, -74.0721], // Bogotá
  ]

  for (const zona of ZONAS) {
    test.each(puntos)(`${zona}: round-trips (%f, %f) dentro de 1e-5°`, (lat, lon) => {
      const { x, y } = wgs84ToMagna(lat, lon, zona)
      const back = magnaToWgs84(x, y, zona)
      expect(back.lat).toBeCloseTo(lat, 5)
      expect(back.lon).toBeCloseTo(lon, 5)
    })
  }
})

describe('WGS84 <-> UTM Zona 18N (EPSG:32618)', () => {
  test('el ecuador en el meridiano central mapea a (FE, 0)', () => {
    const { x, y } = wgs84ToUtm18N(0, -75.0)
    expect(x).toBeCloseTo(500_000, 1)
    expect(y).toBeCloseTo(0, 1)
  })

  test.each([
    [6.2442, -75.5812], // Medellín
    [5.6878, -76.6581], // Quibdó
    [4.7110, -74.0721], // Bogotá (zona 18N igual, aunque más cerca del borde)
  ])('round-trips (%f, %f) dentro de 1e-5°', (lat, lon) => {
    const { x, y } = wgs84ToUtm18N(lat, lon)
    const back = utm18NToWgs84(x, y)
    expect(back.lat).toBeCloseTo(lat, 5)
    expect(back.lon).toBeCloseTo(lon, 5)
  })
})

describe('dmsToDecimal', () => {
  test('formato completo con símbolos y hemisferio', () => {
    expect(dmsToDecimal('4°29\'16.70"N')).toBeCloseTo(4.487972, 5)
  })

  test('hemisferio sur/oeste invierte el signo', () => {
    expect(dmsToDecimal('4°29\'16.70"S')).toBeCloseTo(-4.487972, 5)
    expect(dmsToDecimal('76°39\'29.16"W')).toBeCloseTo(-76.658100, 5)
  })

  test('solo grados y minutos, sin segundos', () => {
    expect(dmsToDecimal('4°29\'N')).toBeCloseTo(4.483333, 5)
  })

  test('un decimal simple pasa tal cual', () => {
    expect(dmsToDecimal('4.4879')).toBe(4.4879)
    expect(dmsToDecimal('-76.6581')).toBe(-76.6581)
  })

  test('minutos u segundos fuera de rango (>=60) se rechazan', () => {
    expect(dmsToDecimal('4°75\'N')).toBeNull()
  })

  test('texto irreconocible retorna null', () => {
    expect(dmsToDecimal('no es una coordenada')).toBeNull()
  })
})

describe('decimalToDms', () => {
  test('latitud positiva usa hemisferio N', () => {
    expect(decimalToDms(4.487972, 'lat')).toBe('4°29\'16.70"N')
  })

  test('latitud negativa usa hemisferio S', () => {
    expect(decimalToDms(-4.487972, 'lat')).toBe('4°29\'16.70"S')
  })

  test('longitud negativa usa hemisferio W', () => {
    expect(decimalToDms(-76.6581, 'lon')).toBe('76°39\'29.16"W')
  })

  test('longitud positiva usa hemisferio E', () => {
    expect(decimalToDms(76.6581, 'lon')).toBe('76°39\'29.16"E')
  })

  test('round-trip decimal -> DMS -> decimal dentro de 1e-4°', () => {
    const original = 5.6878
    const dms = decimalToDms(original, 'lat')
    expect(dmsToDecimal(dms)).toBeCloseTo(original, 4)
  })
})
