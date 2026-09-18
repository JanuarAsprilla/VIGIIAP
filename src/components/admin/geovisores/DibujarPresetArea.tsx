import { useEffect, useRef, useState, useCallback } from 'react'
import { GeoJSON, useMap } from 'react-leaflet'
import * as L from 'leaflet'
import 'leaflet-draw'
import { Pentagon, Trash2, Check, X } from 'lucide-react'
import { useCoordinadorDibujo } from '@/hooks/useCoordinadorDibujo'
import { hectareasDeGeometria, formatearArea } from '@/lib/geo/areaUtils'
import type { PresetArea } from '@/types'

const ESTILO = { color: '#1B4332', weight: 2, fillOpacity: 0.1 } as const

/** Dibujar y nombrar presets de área directamente sobre el mapa del constructor de
 *  geovisores -- reemplaza pegar GeoJSON crudo a mano. Reutiliza useCoordinadorDibujo,
 *  el mismo coordinador de exclusión mutua que ya usa el geovisor público. */
export default function DibujarPresetArea({ presets, onAgregar, onEliminar }: {
  presets: PresetArea[]
  onAgregar: (preset: PresetArea) => void
  onEliminar: (nombre: string) => void
}) {
  const map = useMap()
  const { iniciarDibujo } = useCoordinadorDibujo()
  const [pendiente, setPendiente] = useState<{ geometria: PresetArea['geometria']; hectareas: number } | null>(null)
  const [nombrePendiente, setNombrePendiente] = useState('')
  const layerPendienteRef = useRef<L.Layer | null>(null)

  useEffect(() => {
    const onCreated = (e: L.DrawEvents.Created) => {
      const geometria = (e.layer as L.Polygon).toGeoJSON().geometry as PresetArea['geometria']
      layerPendienteRef.current?.remove()
      layerPendienteRef.current = e.layer.addTo(map)
      setPendiente({ geometria, hectareas: hectareasDeGeometria(geometria) })
      setNombrePendiente('')
    }
    const handler = onCreated as L.LeafletEventHandlerFn
    map.on(L.Draw.Event.CREATED, handler)
    return () => { map.off(L.Draw.Event.CREATED, handler) }
  }, [map])

  const empezarDibujo = useCallback(() => {
    iniciarDibujo(new L.Draw.Polygon(map as L.DrawMap, { shapeOptions: ESTILO }))
  }, [map, iniciarDibujo])

  const confirmarPendiente = () => {
    if (!pendiente || !nombrePendiente.trim()) return
    onAgregar({ nombre: nombrePendiente.trim(), geometria: pendiente.geometria })
    layerPendienteRef.current?.remove()
    layerPendienteRef.current = null
    setPendiente(null)
  }

  const cancelarPendiente = () => {
    layerPendienteRef.current?.remove()
    layerPendienteRef.current = null
    setPendiente(null)
  }

  return (
    <>
      {presets.map((preset) => (
        <GeoJSON key={preset.nombre} data={preset.geometria as GeoJSON.GeoJsonObject} pathOptions={ESTILO} />
      ))}

      <div className="absolute bottom-3 right-3 z-[1000] flex flex-col gap-2 items-end w-64">
        {presets.length > 0 && (
          <div className="bg-[var(--card-bg)]/95 backdrop-blur-sm border border-border rounded-xl shadow-md p-2 w-full space-y-1">
            <p className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted px-1">Presets de área</p>
            {presets.map((preset) => (
              <div key={preset.nombre} className="flex items-center gap-2 px-1.5 py-1 rounded-lg hover:bg-bg-alt/60">
                <span className="text-xs text-text truncate flex-1">{preset.nombre}</span>
                <button type="button" onClick={() => onEliminar(preset.nombre)} title="Eliminar preset"
                  aria-label={`Eliminar preset ${preset.nombre}`}
                  className="p-1 rounded text-text-muted hover:text-red-dark hover:bg-red/10 transition-colors shrink-0">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {pendiente ? (
          <div className="bg-[var(--card-bg)]/95 backdrop-blur-sm border border-border rounded-xl shadow-md p-2.5 w-full space-y-2">
            <p className="text-[0.65rem] text-text-muted">{formatearArea(pendiente.hectareas)}</p>
            <input
              type="text"
              value={nombrePendiente}
              onChange={(e) => setNombrePendiente(e.target.value)}
              placeholder="Nombre del preset"
              autoFocus
              aria-label="Nombre del preset"
              className="w-full px-2.5 py-1.5 bg-[var(--card-bg)] border border-border rounded-lg text-xs focus:outline-none focus:border-primary-800"
            />
            <div className="flex gap-1.5">
              <button type="button" onClick={cancelarPendiente}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-border text-xs font-semibold text-text-muted hover:border-red-400 hover:text-red-dark transition-colors">
                <X className="w-3 h-3" /> Descartar
              </button>
              <button type="button" onClick={confirmarPendiente} disabled={!nombrePendiente.trim()}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-primary-800 text-white text-xs font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors">
                <Check className="w-3 h-3" /> Guardar
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={empezarDibujo}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--card-bg)]/95 backdrop-blur-sm border border-border rounded-xl shadow-md text-xs font-semibold text-text hover:border-primary-600 hover:text-primary-700 transition-colors">
            <Pentagon className="w-3.5 h-3.5" /> Dibujar preset de área
          </button>
        )}
      </div>
    </>
  )
}
