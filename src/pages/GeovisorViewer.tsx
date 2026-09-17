import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapContainer, WMSTileLayer, ScaleControl } from 'react-leaflet'
import type { WMSParams } from 'leaflet'
import { motion } from 'framer-motion'
import { Loader2, Lock, ArrowLeft } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import api from '@/lib/api'
import { fadeUp } from '@/lib/animations'
import { getApiErrorMessage } from '@/lib/apiError'
import { useGeovisorPorSlug, useCapasDeGeovisor } from '@/hooks/useGeovisores'
import BasemapCapas from '@/components/geovisor-viewer/BasemapCapas'
import BasemapGaleria from '@/components/geovisor-viewer/BasemapGaleria'
import PanelCapas from '@/components/geovisor-viewer/PanelCapas'
import HerramientasDibujo from '@/components/geovisor-viewer/HerramientasDibujo'
import ConsultaCapaClick from '@/components/geovisor-viewer/ConsultaCapaClick'
import type { AreaInteresState } from '@/components/geovisor-viewer/ControlAreaInteres'
import type { CapaGeoserver } from '@/types'

interface CapaActiva {
  capa: CapaGeoserver
  tema: string
}

const API_BASE = api.defaults.baseURL ?? '/api/v1'

export default function GeovisorViewer() {
  const { slug } = useParams<{ slug: string }>()
  const { data: geovisor, isLoading: cargandoGeovisor, isError, error } = useGeovisorPorSlug(slug)
  const { data: temas = [], isLoading: cargandoCapas } = useCapasDeGeovisor(slug)

  const [basemap, setBasemap] = useState<string | null>(null)
  const [capasActivas, setCapasActivas] = useState<CapaActiva[]>([])
  const [areaInteres, setAreaInteres] = useState<AreaInteresState | null>(null)

  const toggleCapa = (capa: CapaGeoserver, tema: string) => {
    setCapasActivas((prev) =>
      prev.some((c) => c.capa.id === capa.id)
        ? prev.filter((c) => c.capa.id !== capa.id)
        : [...prev, { capa, tema }],
    )
  }

  const moverCapa = (capaId: string, direccion: 'subir' | 'bajar') => {
    setCapasActivas((prev) => {
      const i = prev.findIndex((c) => c.capa.id === capaId)
      const j = direccion === 'subir' ? i + 1 : i - 1
      if (i < 0 || j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  if (cargandoGeovisor) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary-700" />
      </div>
    )
  }

  if (isError || !geovisor) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[70vh] px-6" style={{ background: 'var(--shell-bg)' }}>
        <motion.div {...fadeUp(0)} className="max-w-md text-center flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-primary-800/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary-800" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-text">Geovisor no disponible</h1>
          <p className="text-sm text-text-muted leading-relaxed">
            {getApiErrorMessage(error, 'Este geovisor no existe o no tienes permiso para verlo.')}
          </p>
          <Link to="/geovisores" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-800 no-underline">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Volver al portal de geovisores
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 3.5rem)' }}>
      <div className="px-4 sm:px-6 py-3 border-b border-border bg-[var(--card-bg)] shrink-0">
        <Link to="/geovisores" className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-primary-700 no-underline mb-1">
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Geovisores
        </Link>
        <h1 className="text-lg font-bold text-text leading-tight">{geovisor.titulo}</h1>
        {geovisor.subtitulo && <p className="text-xs text-text-muted mt-0.5">{geovisor.subtitulo}</p>}
      </div>

      <div className="relative flex-1 min-h-0">
        <MapContainer
          center={[geovisor.centro.lat, geovisor.centro.lng]}
          zoom={geovisor.zoomInicial}
          className="w-full h-full"
          zoomControl
        >
          <BasemapCapas basemapId={basemap ?? geovisor.basemapDefecto} />

          {capasActivas.map((ca, i) => {
            const params: WMSParams & { geometria?: string } = {
              layers: ca.capa.id, format: 'image/png', transparent: true, version: '1.1.1',
              ...(areaInteres ? { geometria: JSON.stringify(areaInteres.geometria) } : {}),
            }
            return (
              <WMSTileLayer
                key={ca.capa.id}
                url={`${API_BASE}/geovisores/${geovisor.slug}/wms`}
                params={params as WMSParams}
                crossOrigin="use-credentials"
                zIndex={100 + i}
              />
            )
          })}

          <ScaleControl position="bottomleft" imperial={false} />

          <PanelCapas
            temas={temas}
            capasActivas={capasActivas}
            colorPorTema={geovisor.colorPorTema}
            apiBase={API_BASE}
            slug={geovisor.slug}
            onToggleCapa={toggleCapa}
            onMoverCapa={moverCapa}
          />

          <BasemapGaleria basemapId={basemap ?? geovisor.basemapDefecto} onChange={setBasemap} />

          <HerramientasDibujo
            presetsArea={geovisor.presetsArea}
            areaMaxHa={geovisor.areaMaxHa ?? undefined}
            areaActual={areaInteres}
            onCambiarArea={setAreaInteres}
          />

          <ConsultaCapaClick
            slug={geovisor.slug}
            capasActivas={capasActivas}
            colorPorTema={geovisor.colorPorTema}
            presentacion={geovisor.presentacion}
          />
        </MapContainer>

        {cargandoCapas && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 px-3 py-1.5 bg-[var(--card-bg)]/95 backdrop-blur-sm border border-border rounded-lg text-xs text-text-muted shadow-md">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Cargando catálogo de capas…
          </div>
        )}
      </div>
    </div>
  )
}
