import { useState } from 'react'
import { Popup, useMapEvents } from 'react-leaflet'
import type * as L from 'leaflet'
import './popup-tema.css'
import api from '@/lib/api'
import { bufferClicEnPixeles } from '@/lib/geo/clickBuffer'
import PopupCapaContenido, { type ResultadoCapaClick } from './PopupCapaContenido'
import type { CapaGeoserver, PresentacionGeovisor } from '@/types'

interface CapaActiva {
  capa: CapaGeoserver
  tema: string
}

interface EstadoPopup {
  latlng: L.LatLng
  resultados: ResultadoCapaClick[] | null
  cargando: boolean
}

const COLOR_RESPALDO = '#1B4332'

export default function ConsultaCapaClick({ slug, capasActivas, colorPorTema, presentacion }: {
  slug: string
  capasActivas: CapaActiva[]
  colorPorTema: Record<string, string>
  presentacion: PresentacionGeovisor
}) {
  const [estado, setEstado] = useState<EstadoPopup | null>(null)

  useMapEvents({
    click: (e) => {
      if (capasActivas.length === 0) return
      const geometria = bufferClicEnPixeles(e.target, e.latlng)
      setEstado({ latlng: e.latlng, resultados: null, cargando: true })

      Promise.all(capasActivas.map(async ({ capa, tema }) => {
        const color = colorPorTema[tema] ?? COLOR_RESPALDO
        try {
          const data = await api.get(`/geovisores/${slug}/capas/${encodeURIComponent(capa.id)}/consulta`, {
            params: { geometria: JSON.stringify(geometria) },
          }) as GeoJSON.FeatureCollection
          return { capa, color, features: data.features ?? [] }
        } catch {
          return { capa, color, features: [], error: 'No se pudo consultar esta capa' }
        }
      })).then((resultados) => {
        setEstado((prev) => (prev ? { ...prev, resultados, cargando: false } : prev))
      })
    },
  })

  if (!estado) return null

  return (
    <Popup
      position={estado.latlng}
      eventHandlers={{ remove: () => setEstado(null) }}
      maxWidth={280}
      minWidth={220}
      className="geovisor-popup-capa"
    >
      <PopupCapaContenido resultados={estado.resultados} cargando={estado.cargando} presentacion={presentacion} />
    </Popup>
  )
}
