import { Ruler, Shapes, X } from 'lucide-react'

export default function ControlMedicion({ onDistancia, onArea, resultado, onLimpiar }: {
  onDistancia: () => void
  onArea: () => void
  resultado: string | null
  onLimpiar: () => void
}) {
  return (
    <div className="bg-[var(--card-bg)]/95 backdrop-blur-sm border border-border rounded-xl shadow-md p-2.5 space-y-2 w-64">
      <p className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted px-0.5">Medir</p>

      <div className="flex gap-1.5">
        <button type="button" onClick={onDistancia} title="Medir distancia"
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-border text-xs font-semibold text-text hover:border-amber-500 hover:text-amber-700 transition-colors">
          <Ruler className="w-3.5 h-3.5" aria-hidden="true" />
          Distancia
        </button>
        <button type="button" onClick={onArea} title="Medir área"
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-border text-xs font-semibold text-text hover:border-amber-500 hover:text-amber-700 transition-colors">
          <Shapes className="w-3.5 h-3.5" aria-hidden="true" />
          Área
        </button>
      </div>

      {resultado && (
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25">
          <p className="text-xs font-semibold text-amber-800 flex-1">{resultado}</p>
          <button type="button" onClick={onLimpiar} title="Limpiar medición"
            className="p-1 rounded text-text-muted hover:text-red-dark hover:bg-red/10 transition-colors shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
