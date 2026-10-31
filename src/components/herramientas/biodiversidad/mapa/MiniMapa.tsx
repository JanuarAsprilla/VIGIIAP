import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { GeoMunicipios } from './geoMunicipios'

interface Props {
  lat: number
  lon: number
  incertidumbreM: number | null
  codigoMunicipal: string
  geo: GeoMunicipios | undefined
  descripcion: string
}

/** Radio máximo de incertidumbre que se dibuja: más allá, el círculo cubriría medio departamento y no informa. */
const MAX_INCERTIDUMBRE_M = 50_000

/** Mapa estático de un registro: contorno del municipio (activo propio, sin mapa base externo) y el punto con su incertidumbre.
 *  Solo se monta con coordenadas públicas: quien lo usa debe validarlas antes con `ubicacionPublica`. */
export default function MiniMapa({ lat, lon, incertidumbreM, codigoMunicipal, geo, descripcion }: Props) {
  const contenedor = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = contenedor.current
    if (!el) return
    const mapa = L.map(el, {
      zoomControl: false, attributionControl: false, dragging: false, touchZoom: false, doubleClickZoom: false,
      scrollWheelZoom: false, boxZoom: false, keyboard: false, zoomSnap: 0.25,
    })
    mapa.setView([lat, lon], 12, { animate: false })
    const encuadre = L.latLngBounds([[lat, lon]])
    const feature = geo?.features.find((f) => f.properties.c === codigoMunicipal)
    if (feature) {
      const capa = L.geoJSON(feature, { interactive: false, style: () => ({ className: 'bio-mini-muni', weight: 1.5, fill: true }) }).addTo(mapa)
      encuadre.extend(capa.getBounds())
    }
    if (incertidumbreM !== null && incertidumbreM > 0) {
      const radio = Math.min(incertidumbreM, MAX_INCERTIDUMBRE_M)
      const circulo = L.circle([lat, lon], { radius: radio, interactive: false, className: 'bio-mini-incertidumbre', weight: 1.5 }).addTo(mapa)
      encuadre.extend(circulo.getBounds())
    }
    L.circleMarker([lat, lon], { radius: 7, interactive: false, className: 'bio-mini-punto', weight: 2.5 }).addTo(mapa)
    mapa.fitBounds(encuadre, { padding: [16, 16], maxZoom: 14, animate: false })
    const ro = new ResizeObserver(() => { mapa.invalidateSize(); mapa.fitBounds(encuadre, { padding: [16, 16], maxZoom: 14, animate: false }) })
    ro.observe(el)
    return () => { ro.disconnect(); mapa.remove() }
  }, [lat, lon, incertidumbreM, codigoMunicipal, geo])

  return <div ref={contenedor} className="bio-minimapa" role="img" aria-label={descripcion} />
}
