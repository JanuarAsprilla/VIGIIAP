import type * as L from 'leaflet'

/**
 * Pequeño cuadrado GeoJSON alrededor de un clic, medido en píxeles de pantalla (no en grados) --
 * un clic casi nunca cae exactamente sobre la geometría de una feature, y un radio en grados fijo
 * se vería distinto de tolerancia según el zoom. Manteniéndolo en píxeles, "clic cerca de la capa"
 * se siente igual en cualquier nivel de zoom.
 */
export function bufferClicEnPixeles(map: L.Map, latlng: L.LatLng, radioPx = 6): GeoJSON.Polygon {
  const centro = map.latLngToContainerPoint(latlng)
  const esquina = map.containerPointToLatLng([centro.x + radioPx, centro.y + radioPx])
  const dLat = Math.abs(esquina.lat - latlng.lat)
  const dLng = Math.abs(esquina.lng - latlng.lng)
  const { lat, lng } = latlng
  return {
    type: 'Polygon',
    coordinates: [[
      [lng - dLng, lat - dLat],
      [lng + dLng, lat - dLat],
      [lng + dLng, lat + dLat],
      [lng - dLng, lat + dLat],
      [lng - dLng, lat - dLat],
    ]],
  }
}
