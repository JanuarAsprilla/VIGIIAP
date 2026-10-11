import { MapContainer, WMSTileLayer, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import { MapPinned } from 'lucide-react'
import api from '@/lib/api'
import BasemapCapas from '@/components/geovisor-viewer/BasemapCapas'
import DibujarPresetArea from './DibujarPresetArea'
import type { WorkspaceOption, PresetArea } from '@/types'

const API_BASE = api.defaults.baseURL ?? '/api/v1'

/** Reporta al formulario dónde quedó el mapa tras cada pan/zoom -- el mapa ES el
 *  control de centro/zoom en el constructor, no un input numérico suelto. */
function SincronizarVista({ onMoverMapa }: { onMoverMapa: (lat: number, lng: number, zoom: number) => void }) {
  useMapEvents({
    moveend: (e) => {
      const centro = e.target.getCenter()
      onMoverMapa(Number(centro.lat.toFixed(6)), Number(centro.lng.toFixed(6)), e.target.getZoom())
    },
  })
  return null
}

export default function GeovisorMapaConstructor({
  conexionId, workspacesSeleccionados, centroLat, centroLng, zoomInicial, basemap,
  presetsArea, onMoverMapa, onAgregarPreset, onEliminarPreset,
}: {
  conexionId: string | null
  workspacesSeleccionados: WorkspaceOption[]
  centroLat: number
  centroLng: number
  zoomInicial: number
  basemap: string
  presetsArea: PresetArea[]
  onMoverMapa: (lat: number, lng: number, zoom: number) => void
  onAgregarPreset: (preset: PresetArea) => void
  onEliminarPreset: (nombre: string) => void
}) {
  if (!conexionId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 bg-bg-alt/40 text-center px-6">
        <MapPinned className="w-8 h-8 text-text-muted/40" />
        <p className="text-sm text-text-muted max-w-xs">Elige una conexión GeoServer para ver la vista previa en vivo</p>
      </div>
    )
  }

  const capasActivas = workspacesSeleccionados.flatMap((ws) => ws.capas)

  return (
    <MapContainer center={[centroLat, centroLng]} zoom={zoomInicial} className="w-full h-full" zoomControl>
      <BasemapCapas basemapId={basemap} />

      {capasActivas.map((capa, i) => (
        <WMSTileLayer
          key={capa.id}
          url={`${API_BASE}/admin/conexiones-geoserver/${conexionId}/wms`}
          params={{ layers: capa.id, format: 'image/png', transparent: true, version: '1.1.1' }}
          crossOrigin="use-credentials"
          zIndex={100 + i}
        />
      ))}

      <SincronizarVista onMoverMapa={onMoverMapa} />

      <DibujarPresetArea presets={presetsArea} onAgregar={onAgregarPreset} onEliminar={onEliminarPreset} />
    </MapContainer>
  )
}
