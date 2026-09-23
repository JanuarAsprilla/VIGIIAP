import { describe, test, expect } from 'vitest'
import { detectarColumnasNumericas, adivinarColumna, adivinarColumnasLatLon } from '@/components/herramientas/validador-coordenadas/lib/excelIO'

describe('detectarColumnasNumericas()', () => {
  test('identifica columnas donde >=80% de la muestra es numérica', () => {
    const rows = [
      { nombre: 'sitio A', lat: '5.69', lon: '-76.66' },
      { nombre: 'sitio B', lat: '5.70', lon: '-76.70' },
    ]
    expect(detectarColumnasNumericas(rows)).toEqual(['lat', 'lon'])
  })
  test('una columna de texto no se detecta como numérica', () => {
    const rows = [{ nombre: 'sitio A', lat: '5.69' }]
    expect(detectarColumnasNumericas(rows)).toEqual(['lat'])
  })
  test('celdas vacías no cuentan contra el umbral', () => {
    const rows = [{ lat: '5.69' }, { lat: '' }, { lat: '5.70' }]
    expect(detectarColumnasNumericas(rows)).toEqual(['lat'])
  })
  test('arreglo vacío retorna arreglo vacío', () => {
    expect(detectarColumnasNumericas([])).toEqual([])
  })
})

describe('adivinarColumna()', () => {
  test('encuentra el nombre exacto (case-insensitive) entre los candidatos', () => {
    expect(adivinarColumna(['Latitud', 'Longitud'], ['decimallatitude', 'latitude', 'latitud', 'lat', 'y'])).toBe('Latitud')
  })
  test('sin coincidencia, retorna la primera columna disponible', () => {
    expect(adivinarColumna(['x1', 'x2'], ['latitud', 'lat'])).toBe('x1')
  })
  test('sin columnas, retorna cadena vacía', () => {
    expect(adivinarColumna([], ['lat'])).toBe('')
  })
})

describe('adivinarColumnasLatLon()', () => {
  test('adivina lat y lon por nombre de columna común', () => {
    expect(adivinarColumnasLatLon(['id', 'decimalLatitude', 'decimalLongitude'])).toEqual({ lat: 'decimalLatitude', lon: 'decimalLongitude' })
  })
  test('la columna de longitud nunca es la misma que la de latitud', () => {
    const { lat, lon } = adivinarColumnasLatLon(['lat', 'x'])
    expect(lat).not.toBe(lon)
    expect(lat).toBe('lat')
    expect(lon).toBe('x')
  })
})
