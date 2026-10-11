import { useEffect, useRef, useState, useCallback } from 'react'
import { GeoJSON } from 'react-leaflet'
import * as L from 'leaflet'
import { ChevronDown, Ruler } from 'lucide-react'
import 'leaflet-draw'
import './dibujo-tema.css'
import { useCoordinadorDibujo } from '@/hooks/useCoordinadorDibujo'
import { hectareasDeGeometria, distanciaMetros, formatearArea, formatearDistancia } from '@/lib/geo/areaUtils'
import ControlAreaInteres, { type AreaInteresState } from './ControlAreaInteres'
import ControlMedicion from './ControlMedicion'
import type { PresetArea } from '@/types'

type ModoDibujo = 'area-poligono' | 'area-rectangulo' | 'medir-distancia' | 'medir-area' | null

interface ResultadoMedicion {
  geometria: GeoJSON.Geometry
  texto: string
}

const COLOR_AREA = '#1B4332'
const COLOR_MEDICION = '#c9821f'
const ESTILO_AREA: L.PathOptions = { color: COLOR_AREA, weight: 2, fillOpacity: 0.08 }
const ESTILO_MEDICION: L.PathOptions = { color: COLOR_MEDICION, weight: 2, fillOpacity: 0.06, dashArray: '6 4' }

/** Vértice redondo del color del modo activo -- reemplaza el cuadrado gris genérico de Leaflet.draw. */
function iconoVertice(color: string) {
  return L.divIcon({
    className: 'geovisor-vertice-dibujo',
    html: `<span style="border:2px solid ${color}"></span>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  })
}
const ICONO_VERTICE_AREA = iconoVertice(COLOR_AREA)
const ICONO_VERTICE_MEDICION = iconoVertice(COLOR_MEDICION)

export default function HerramientasDibujo({ presetsArea, areaMaxHa, areaActual, onCambiarArea, abiertoInicial = false }: {
  presetsArea: PresetArea[]
  areaMaxHa?: number
  areaActual: AreaInteresState | null
  onCambiarArea: (area: AreaInteresState | null) => void
  /** Las herramientas nacen plegadas para no tapar el mapa; solo la prueba las abre de entrada. */
  abiertoInicial?: boolean
}) {
  const [abierto, setAbierto] = useState(abiertoInicial)
  const { map, iniciarDibujo } = useCoordinadorDibujo()
  const modoRef = useRef<ModoDibujo>(null)
  const [errorArea, setErrorArea] = useState<string | null>(null)
  const [resultadoMedicion, setResultadoMedicion] = useState<ResultadoMedicion | null>(null)

  useEffect(() => {
    const onCreated = (e: L.DrawEvents.Created) => {
      const modo = modoRef.current
      modoRef.current = null
      if (modo) setAbierto(true)

      if (modo === 'medir-distancia') {
        const latlngs = (e.layer as L.Polyline).getLatLngs() as L.LatLng[]
        const metros = distanciaMetros(latlngs)
        setResultadoMedicion({ geometria: (e.layer as L.Polyline).toGeoJSON().geometry, texto: `Distancia: ${formatearDistancia(metros)}` })
        return
      }
      if (modo === 'medir-area') {
        const geometria = (e.layer as L.Polygon).toGeoJSON().geometry
        setResultadoMedicion({ geometria, texto: `Área: ${formatearArea(hectareasDeGeometria(geometria as PresetArea['geometria']))}` })
        return
      }
      if (modo === 'area-poligono' || modo === 'area-rectangulo') {
        const geometria = (e.layer as L.Polygon).toGeoJSON().geometry as PresetArea['geometria']
        const hectareas = hectareasDeGeometria(geometria)
        if (areaMaxHa && hectareas > areaMaxHa) {
          setErrorArea(`El área dibujada (${formatearArea(hectareas)}) supera el máximo permitido (${areaMaxHa} ha).`)
          return
        }
        setErrorArea(null)
        onCambiarArea({ nombre: 'Área dibujada', geometria, hectareas })
      }
    }
    const handler = onCreated as L.LeafletEventHandlerFn
    map.on(L.Draw.Event.CREATED, handler)
    return () => { map.off(L.Draw.Event.CREATED, handler) }
  }, [map, areaMaxHa, onCambiarArea])

  const empezarAreaPoligono = useCallback(() => {
    modoRef.current = 'area-poligono'
    iniciarDibujo(new L.Draw.Polygon(map as L.DrawMap, { shapeOptions: ESTILO_AREA, icon: ICONO_VERTICE_AREA, touchIcon: ICONO_VERTICE_AREA }))
  }, [map, iniciarDibujo])

  const empezarAreaRectangulo = useCallback(() => {
    modoRef.current = 'area-rectangulo'
    iniciarDibujo(new L.Draw.Rectangle(map as L.DrawMap, { shapeOptions: ESTILO_AREA }))
  }, [map, iniciarDibujo])

  const empezarMedirDistancia = useCallback(() => {
    modoRef.current = 'medir-distancia'
    setResultadoMedicion(null)
    iniciarDibujo(new L.Draw.Polyline(map as L.DrawMap, { shapeOptions: ESTILO_MEDICION, icon: ICONO_VERTICE_MEDICION, touchIcon: ICONO_VERTICE_MEDICION }))
  }, [map, iniciarDibujo])

  const empezarMedirArea = useCallback(() => {
    modoRef.current = 'medir-area'
    setResultadoMedicion(null)
    iniciarDibujo(new L.Draw.Polygon(map as L.DrawMap, { shapeOptions: ESTILO_MEDICION, icon: ICONO_VERTICE_MEDICION, touchIcon: ICONO_VERTICE_MEDICION }))
  }, [map, iniciarDibujo])

  const aplicarPreset = useCallback((preset: PresetArea) => {
    setErrorArea(null)
    const hectareas = hectareasDeGeometria(preset.geometria)
    onCambiarArea({ nombre: preset.nombre, geometria: preset.geometria, hectareas })
    const bounds = L.geoJSON(preset.geometria as GeoJSON.GeoJsonObject).getBounds()
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40] })
  }, [map, onCambiarArea])

  return (
    <>
      {areaActual && <GeoJSON key={areaActual.nombre} data={areaActual.geometria as GeoJSON.GeoJsonObject} pathOptions={ESTILO_AREA} />}
      {resultadoMedicion && <GeoJSON data={resultadoMedicion.geometria} pathOptions={ESTILO_MEDICION} />}

      <div className="absolute bottom-3 right-3 z-[1000] flex flex-col gap-2 items-end">
        {abierto && (
          <div id="herramientas-dibujo" className="flex flex-col gap-2 items-end">
            <ControlMedicion
              onDistancia={empezarMedirDistancia}
              onArea={empezarMedirArea}
              resultado={resultadoMedicion?.texto ?? null}
              onLimpiar={() => setResultadoMedicion(null)}
            />
            <ControlAreaInteres
              onPoligono={empezarAreaPoligono}
              onRectangulo={empezarAreaRectangulo}
              presets={presetsArea}
              areaActual={areaActual}
              error={errorArea}
              onAplicarPreset={aplicarPreset}
              onQuitar={() => onCambiarArea(null)}
            />
          </div>
        )}
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          aria-controls="herramientas-dibujo"
          className="relative flex items-center gap-2 pl-3 pr-2.5 py-2 rounded-xl bg-[var(--card-bg)]/95 backdrop-blur-sm border border-border shadow-md text-xs font-semibold text-text hover:border-primary-600 hover:text-primary-700 transition-colors"
        >
          <Ruler className="w-3.5 h-3.5" aria-hidden="true" />
          Medir y área de interés
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${abierto ? '' : 'rotate-180'}`} aria-hidden="true" />
          {!abierto && (resultadoMedicion || areaActual) && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary-600 ring-2 ring-[var(--card-bg)]" aria-label="Hay una medición o área activa" />
          )}
        </button>
      </div>
    </>
  )
}
