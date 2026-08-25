/**
 * WGS84 <-> MAGNA-SIRGAS Colombia Oeste (EPSG:3115) round-trip and
 * known-point checks. This math backs the real coordinate converter tool
 * (ConversorCoordenadas.tsx) — a silently wrong formula here means silently
 * wrong coordinates shown as official on the platform, so it's worth
 * verifying against exact, provable properties, not just "it returns a
 * number".
 */
import { describe, test, expect } from 'vitest'
import { wgs84ToMagna, magnaToWgs84 } from '@/lib/proyeccionMagna'

describe('wgs84ToMagna', () => {
  test('the projection origin (4°N, -77°W) maps exactly to (FE, FN) = (1,000,000, 1,000,000)', () => {
    // At the tangent meridian/parallel, A=0 and M=M0 by definition of the
    // Transverse Mercator formula, so x/y must equal the false easting/northing
    // exactly (not approximately) — this catches sign/term errors that a
    // round-trip test alone could mask.
    const { x, y } = wgs84ToMagna(4.0, -77.0)
    expect(x).toBeCloseTo(1_000_000, 2)
    expect(y).toBeCloseTo(1_000_000, 2)
  })

  test('moving east of the central meridian increases X past the false easting', () => {
    const { x } = wgs84ToMagna(4.0, -76.0)
    expect(x).toBeGreaterThan(1_000_000)
  })

  test('moving west of the central meridian decreases X below the false easting', () => {
    const { x } = wgs84ToMagna(4.0, -78.0)
    expect(x).toBeLessThan(1_000_000)
  })

  test('moving north of the origin latitude increases Y past the false northing', () => {
    const { y } = wgs84ToMagna(6.0, -77.0)
    expect(y).toBeGreaterThan(1_000_000)
  })

  test('moving south of the origin latitude decreases Y below the false northing', () => {
    const { y } = wgs84ToMagna(2.0, -77.0)
    expect(y).toBeLessThan(1_000_000)
  })
})

describe('wgs84ToMagna -> magnaToWgs84 round-trip', () => {
  const points: [number, number][] = [
    [4.0, -77.0],   // origen
    [6.2442, -75.5812], // Medellín (fuera de zona pero dentro de un rango razonable)
    [5.6878, -76.6581], // Quibdó — centro del mapa del Geovisor (Geovisor.tsx)
    [3.4516, -76.5320], // Cali
    [1.2, -78.9],   // sur del Chocó biogeográfico
  ]

  test.each(points)('round-trips (%f, %f) back to the original within 1e-5°', (lat, lon) => {
    const { x, y } = wgs84ToMagna(lat, lon)
    const back = magnaToWgs84(x, y)
    expect(back.lat).toBeCloseTo(lat, 5)
    expect(back.lon).toBeCloseTo(lon, 5)
  })
})
