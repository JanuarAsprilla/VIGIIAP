import { AlertCircle, Pentagon, Square, X } from 'lucide-react'
import { formatearArea } from '@/lib/geo/areaUtils'
import type { PresetArea } from '@/types'

export interface AreaInteresState {
  nombre: string
  geometria: PresetArea['geometria']
  hectareas: number
}

export default function ControlAreaInteres({ onPoligono, onRectangulo, presets, areaActual, error, onAplicarPreset, onQuitar }: {
  onPoligono: () => void
  onRectangulo: () => void
  presets: PresetArea[]
  areaActual: AreaInteresState | null
  error: string | null
  onAplicarPreset: (preset: PresetArea) => void
  onQuitar: () => void
}) {
  return (
    <div className="bg-[var(--card-bg)]/95 backdrop-blur-sm border border-border rounded-xl shadow-md p-2.5 space-y-2 w-64">
      <p className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted px-0.5">Área de interés</p>

      <div className="flex gap-1.5">
        <button type="button" onClick={onPoligono} title="Dibujar polígono"
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-border text-xs font-semibold text-text hover:border-primary-600 hover:text-primary-700 transition-colors">
          <Pentagon className="w-3.5 h-3.5" aria-hidden="true" />
          Polígono
        </button>
        <button type="button" onClick={onRectangulo} title="Dibujar rectángulo"
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-border text-xs font-semibold text-text hover:border-primary-600 hover:text-primary-700 transition-colors">
          <Square className="w-3.5 h-3.5" aria-hidden="true" />
          Rectángulo
        </button>
      </div>

      {presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {presets.map((preset) => (
            <button key={preset.nombre} type="button" onClick={() => onAplicarPreset(preset)}
              className="px-2.5 py-1 rounded-full border border-primary-600/40 bg-primary-600/8 text-[0.65rem] font-semibold text-primary-700 hover:bg-primary-600/15 transition-colors">
              {preset.nombre}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="flex items-start gap-1.5 text-[0.65rem] text-red-600 bg-red/10 rounded-lg px-2 py-1.5">
          <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" aria-hidden="true" />
          {error}
        </p>
      )}

      {areaActual && (
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-primary-600/8 border border-primary-600/25">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-text truncate">{areaActual.nombre}</p>
            <p className="text-[0.65rem] text-text-muted">{formatearArea(areaActual.hectareas)}</p>
          </div>
          <button type="button" onClick={onQuitar} title="Quitar área"
            className="p-1 rounded text-text-muted hover:text-red-dark hover:bg-red/10 transition-colors shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
