import { useState } from 'react'
import { Loader2, ArrowRight, Check, AlertCircle } from 'lucide-react'
import { MapContainer, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getApiErrorMessage } from '@/lib/apiError'
import { useFicha, useUpsertFicha } from '@/hooks/useFichasPunto'
import BasemapCapas from '@/components/geovisor-viewer/BasemapCapas'
import MediosFichaGrid from './MediosFichaGrid'
import type { FeatureFichaEstado } from '@/types'

const DESCRIPCION_MINIMA = 20

/**
 * Editor de UNA ficha: título, descripción y sus fotos/video. El mapa es
 * solo de referencia visual (sin interacción) para que el administrador
 * confirme que está editando el punto correcto antes de escribir -- no hay
 * forma de deshacer un contenido curado pegado al punto equivocado sin
 * darse cuenta.
 */
export default function FichaPuntoEditor({ configId, feature, onGuardado, onGuardarYSiguiente }: {
  configId: string
  feature: FeatureFichaEstado
  onGuardado: () => void
  onGuardarYSiguiente: () => void
}) {
  const { data: ficha, isLoading } = useFicha(configId, feature.valor)
  const upsertFicha = useUpsertFicha(configId)

  const [titulo, setTitulo] = useState(() => ficha?.titulo ?? '')
  const [descripcion, setDescripcion] = useState(() => ficha?.descripcion ?? '')
  const [fichaAnterior, setFichaAnterior] = useState(ficha)
  const [error, setError] = useState('')

  // Ajustado durante el render, no en un efecto -- evita el re-render extra
  // que produciría un useEffect solo para sincronizar este estado derivado
  // cuando la ficha completa termina de cargar (o al cambiar de punto).
  if (ficha !== fichaAnterior) {
    setFichaAnterior(ficha)
    setTitulo(ficha?.titulo ?? '')
    setDescripcion(ficha?.descripcion ?? '')
  }

  const guardar = async (avanzar: boolean) => {
    setError('')
    try {
      await upsertFicha.mutateAsync({ valor: feature.valor, titulo: titulo.trim() || undefined, descripcion: descripcion.trim() })
      if (avanzar) onGuardarYSiguiente()
      else onGuardado()
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar la ficha'))
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
      </div>
    )
  }

  const contador = descripcion.trim().length
  const descripcionCompleta = contador >= DESCRIPCION_MINIMA

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="h-36 shrink-0 border-b border-border">
        <MapContainer
          center={[feature.centroide[1], feature.centroide[0]]}
          zoom={15}
          className="w-full h-full"
          zoomControl={false} dragging={false} scrollWheelZoom={false} doubleClickZoom={false} touchZoom={false} attributionControl={false}
        >
          <BasemapCapas basemapId="claro" />
          <CircleMarker center={[feature.centroide[1], feature.centroide[0]]}
            radius={7} pathOptions={{ color: '#1A5632', fillColor: '#1A5632', fillOpacity: 1, weight: 2 }} />
        </MapContainer>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div>
          <p className="text-sm font-bold text-text truncate">{feature.etiqueta || feature.valor}</p>
          {feature.etiqueta && <p className="text-[0.65rem] text-text-muted font-mono">{feature.valor}</p>}
        </div>

        <div>
          <label htmlFor="ficha-titulo" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
            Título <span className="font-normal normal-case text-text-muted">(opcional)</span>
          </label>
          <input id="ficha-titulo" type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--card-bg)] border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="ficha-descripcion" className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted">Descripción</label>
            <span className={`text-[0.65rem] font-mono ${descripcionCompleta ? 'text-primary-700' : 'text-text-muted'}`}>
              {contador}/{DESCRIPCION_MINIMA}
            </span>
          </div>
          <textarea id="ficha-descripcion" rows={5} value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--card-bg)] border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition" />
          {!descripcionCompleta && (
            <p className="text-[0.65rem] text-text-muted mt-1">
              Se guarda igual con menos, pero para contar como completa hace falta un mínimo de {DESCRIPCION_MINIMA} caracteres.
            </p>
          )}
        </div>

        <div>
          <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Fotos y video</label>
          <MediosFichaGrid configId={configId} valor={feature.valor} medios={ficha?.medios ?? []} />
        </div>

        {error && (
          <p className="flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
          </p>
        )}
      </div>

      <div className="flex gap-2 p-4 border-t border-border shrink-0">
        <button type="button" onClick={() => guardar(false)} disabled={upsertFicha.isPending}
          className="flex-1 inline-flex items-center justify-center gap-2 py-2 border border-border rounded-lg text-sm font-semibold text-text hover:border-primary-800 disabled:opacity-40 transition-colors">
          {upsertFicha.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Guardar
        </button>
        <button type="button" onClick={() => guardar(true)} disabled={upsertFicha.isPending}
          className="flex-1 inline-flex items-center justify-center gap-2 py-2 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors">
          {upsertFicha.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          Guardar y siguiente pendiente
        </button>
      </div>
    </div>
  )
}
