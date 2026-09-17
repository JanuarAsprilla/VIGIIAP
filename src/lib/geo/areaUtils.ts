import * as L from 'leaflet'
import 'leaflet-draw'
import type { PresetArea } from '@/types'

type Posicion = [number, number]

function anilloExterior(coordinates: Posicion[][]): L.LatLngLiteral[] {
  return coordinates[0].map(([lng, lat]) => ({ lat, lng }))
}

/** Hectáreas de un Polygon/MultiPolygon GeoJSON -- suma el área geodésica del anillo exterior de cada polígono. */
export function hectareasDeGeometria(geometria: PresetArea['geometria']): number {
  const poligonos = geometria.type === 'MultiPolygon'
    ? (geometria.coordinates as unknown as Posicion[][][])
    : [geometria.coordinates as unknown as Posicion[][]]
  const areaM2 = poligonos.reduce((acc, coords) => acc + L.GeometryUtil.geodesicArea(anilloExterior(coords)), 0)
  return areaM2 / 10_000
}

/** Distancia geodésica total (metros) de una secuencia de puntos -- suma tramo a tramo. */
export function distanciaMetros(latlngs: L.LatLng[]): number {
  let total = 0
  for (let i = 1; i < latlngs.length; i++) total += latlngs[i - 1].distanceTo(latlngs[i])
  return total
}

export function formatearArea(hectareas: number): string {
  return L.GeometryUtil.readableArea(hectareas * 10_000, true, { ha: 2, m: 0, km: 2 })
}

export function formatearDistancia(metros: number): string {
  return L.GeometryUtil.readableDistance(metros, true)
}

/** Métrica legible (área u distancia) de la geometría de una feature -- null si el tipo no aplica (ej. Point). */
export function metricaDeGeometria(geometry: GeoJSON.Geometry): string | null {
  if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
    return formatearArea(hectareasDeGeometria(geometry as PresetArea['geometria']))
  }
  if (geometry.type === 'LineString') {
    const latlngs = geometry.coordinates.map(([lng, lat]) => L.latLng(lat, lng))
    return formatearDistancia(distanciaMetros(latlngs))
  }
  if (geometry.type === 'MultiLineString') {
    const total = geometry.coordinates.reduce(
      (acc, linea) => acc + distanciaMetros(linea.map(([lng, lat]) => L.latLng(lat, lng))),
      0,
    )
    return formatearDistancia(total)
  }
  return null
}
