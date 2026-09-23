import { describe, test, expect } from 'vitest'
import {
  limpiarCoord, ddToDms, ddToUtm, formatearLat, formatearLon, formatearUtm,
  cantidadDecimales, haversineKm,
} from '@/components/herramientas/validador-coordenadas/lib/coordenadas'

describe('limpiarCoord()', () => {
  test('parsea un número normal', () => { expect(limpiarCoord('5.6987')).toBe(5.6987) })
  test('acepta coma decimal (es-CO)', () => { expect(limpiarCoord('5,6987')).toBe(5.6987) })
  test('ignora espacios', () => { expect(limpiarCoord(' 5.6987 ')).toBe(5.6987) })
  test('acepta un número ya numérico', () => { expect(limpiarCoord(5.6987)).toBe(5.6987) })
  test.each([undefined, null, ''])('retorna NaN para %s', (v) => { expect(limpiarCoord(v)).toBeNaN() })
  test('retorna NaN para texto no numérico', () => { expect(limpiarCoord('no-es-numero')).toBeNaN() })
})

describe('ddToDms()', () => {
  test('convierte latitud positiva a N', () => { expect(ddToDms(5.6987, true)).toBe('5°41\'55.3"N') })
  test('convierte latitud negativa a S', () => { expect(ddToDms(-5.6987, true)).toBe('5°41\'55.3"S') })
  test('convierte longitud positiva a E', () => { expect(ddToDms(76.66, false)).toBe('76°39\'36.0"E') })
  test('convierte longitud negativa a O', () => { expect(ddToDms(-76.66, false)).toBe('76°39\'36.0"O') })
  test('NaN retorna cadena vacía', () => { expect(ddToDms(NaN, true)).toBe('') })
})

describe('ddToUtm()', () => {
  test('calcula zona/banda/este/norte para un punto del Chocó', () => {
    const u = ddToUtm(5.6947, -76.6611) // cerca de Quibdó
    expect(u).not.toBeNull()
    expect(u!.zone).toBe(18)
    expect(u!.banda).toBe('N')
    expect(u!.easting).toBeGreaterThan(0)
    expect(u!.northing).toBeGreaterThan(0)
  })
  test('latitud negativa usa banda S y suma el offset de 10,000,000', () => {
    const u = ddToUtm(-5.6947, -76.6611)
    expect(u!.banda).toBe('S')
    expect(u!.northing).toBeGreaterThan(9_000_000)
  })
  test('NaN retorna null', () => { expect(ddToUtm(NaN, -76)).toBeNull() })
})

describe('formatearLat() / formatearLon() / formatearUtm()', () => {
  test('formato dd usa 6 decimales', () => {
    expect(formatearLat(5.6987123456, 'dd')).toBe('5.698712')
    expect(formatearLon(-76.6611, 'dd')).toBe('-76.661100')
  })
  test('formato dms delega en ddToDms', () => {
    expect(formatearLat(5.6987, 'dms')).toBe(ddToDms(5.6987, true))
  })
  test('formato utm arma zona+este+norte', () => {
    expect(formatearUtm(5.6947, -76.6611)).toMatch(/^18N\s+\d+E\s+\d+N$/)
  })
  test('NaN retorna cadena vacía en todos los formatos', () => {
    expect(formatearLat(NaN, 'dd')).toBe('')
    expect(formatearLon(NaN, 'dms')).toBe('')
  })
})

describe('cantidadDecimales()', () => {
  test('cuenta los decimales de un número', () => { expect(cantidadDecimales('5.698712')).toBe(6) })
  test('un número entero tiene 0 decimales', () => { expect(cantidadDecimales('5')).toBe(0) })
  test('un valor no numérico retorna 0', () => { expect(cantidadDecimales('abc')).toBe(0) })
})

describe('haversineKm()', () => {
  test('distancia cero entre el mismo punto', () => { expect(haversineKm(5, -76, 5, -76)).toBe(0) })
  test('distancia positiva entre dos puntos distintos', () => {
    const d = haversineKm(5.6947, -76.6611, 5.7, -76.65)
    expect(d).toBeGreaterThan(0)
    expect(d).toBeLessThan(20)
  })
  test('retorna null si algún valor es NaN', () => { expect(haversineKm(NaN, -76, 5, -76)).toBeNull() })
})
