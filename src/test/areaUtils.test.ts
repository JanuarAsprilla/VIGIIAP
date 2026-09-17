import { describe, test, expect } from 'vitest'
import * as L from 'leaflet'
import {
  hectareasDeGeometria, distanciaMetros, formatearArea, formatearDistancia,
} from '@/lib/geo/areaUtils'
import type { PresetArea } from '@/types'

// Cuadrado ~0.01° de lado cerca del ecuador (111.32 km/° ahí) -- área esperada ≈ 123.9 ha,
// suficiente para validar la extracción del anillo [lng,lat]→{lat,lng} sin exigir precisión exacta.
const cuadradoPequenio: PresetArea['geometria'] = {
  type: 'Polygon',
  coordinates: [[[-76.60, 5.55], [-76.59, 5.55], [-76.59, 5.56], [-76.60, 5.56], [-76.60, 5.55]]],
}

describe('hectareasDeGeometria', () => {
  test('calcula un área positiva y del orden esperado para un Polygon pequeño', () => {
    const hectareas = hectareasDeGeometria(cuadradoPequenio)
    expect(hectareas).toBeGreaterThan(100)
    expect(hectareas).toBeLessThan(150)
  })

  test('un MultiPolygon suma el área de cada polígono', () => {
    // Dos copias del mismo cuadrado (en la práctica no se solaparían, pero para la prueba
    // solo importa que la función sume ambas partes en vez de quedarse con la primera).
    const multi: PresetArea['geometria'] = {
      type: 'MultiPolygon',
      coordinates: [cuadradoPequenio.coordinates as unknown as number[][][], cuadradoPequenio.coordinates as unknown as number[][][]],
    }
    const hectareasUno = hectareasDeGeometria(cuadradoPequenio)
    const hectareasMulti = hectareasDeGeometria(multi)
    expect(hectareasMulti).toBeCloseTo(hectareasUno * 2, 1)
  })
})

describe('distanciaMetros', () => {
  test('suma la distancia geodésica tramo a tramo', () => {
    const a = L.latLng(5.55, -76.60)
    const b = L.latLng(5.55, -76.59)
    const c = L.latLng(5.56, -76.59)
    const total = distanciaMetros([a, b, c])
    expect(total).toBeCloseTo(a.distanceTo(b) + b.distanceTo(c), 0)
    expect(total).toBeGreaterThan(1000)
  })

  test('una sola coordenada da distancia cero', () => {
    expect(distanciaMetros([L.latLng(5.55, -76.60)])).toBe(0)
  })
})

describe('formatearArea / formatearDistancia', () => {
  test('formatearArea incluye una unidad legible', () => {
    expect(formatearArea(hectareasDeGeometria(cuadradoPequenio))).toMatch(/ha|m²|km²/)
  })

  test('formatearDistancia incluye una unidad legible', () => {
    expect(formatearDistancia(1500)).toMatch(/km|m/)
  })
})
