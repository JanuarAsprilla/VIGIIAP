import { Check } from 'lucide-react'
import type { PasoId } from './formState'

export interface PasoInfo {
  id: PasoId
  label: string
  /** El paso tiene un campo con error pendiente de corregir. */
  conError: boolean
  /** Lo mínimo que pide el paso ya está lleno; solo entonces se marca como hecho al pasar de largo. */
  completo: boolean
}

/** Título del paso con una frase que explica, en lenguaje llano, qué se decide ahí. */
export function TituloPaso({ titulo, explicacion }: { titulo: string; explicacion: string }) {
  return (
    <header className="space-y-1">
      <h4 className="text-base font-bold text-text">{titulo}</h4>
      <p className="text-xs text-text-muted leading-relaxed">{explicacion}</p>
    </header>
  )
}

/** Indicador de progreso del asistente: dice en qué paso va el admin y cuáles ya pasó. */
export default function PasosGeovisor({ pasos, actual, onIr }: {
  pasos: readonly PasoInfo[]
  actual: PasoId
  onIr: (id: PasoId) => void
}) {
  const indiceActual = pasos.findIndex((p) => p.id === actual)

  return (
    <nav aria-label="Pasos para crear el geovisor" className="px-6 pt-4 pb-3 border-b border-border shrink-0">
      <ol className="flex items-start">
        {pasos.map((paso, i) => {
          const esActual = paso.id === actual
          const hecho = i < indiceActual && paso.completo && !paso.conError
          return (
            <li key={paso.id} className="flex-1 min-w-0 flex flex-col items-center relative">
              {i > 0 && (
                <span aria-hidden="true"
                  className={`absolute top-3.5 right-1/2 w-full h-px ${i <= indiceActual ? 'bg-primary-700' : 'bg-border'}`} />
              )}
              <button type="button" onClick={() => onIr(paso.id)}
                aria-current={esActual ? 'step' : undefined}
                className="relative z-10 flex flex-col items-center gap-1.5 group focus-visible:outline-none">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[0.7rem] font-bold border-2 transition-colors group-focus-visible:ring-2 group-focus-visible:ring-primary-600/40 ${
                  paso.conError
                    ? 'bg-red/10 border-red-400 text-red-600'
                    : esActual
                      ? 'bg-primary-800 border-primary-800 text-white'
                      : hecho
                        ? 'bg-primary-700 border-primary-700 text-white'
                        : 'bg-[var(--card-bg)] border-border text-text-muted group-hover:border-primary-700'
                }`}>
                  {hecho ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : paso.conError ? '!' : i + 1}
                </span>
                <span className={`text-[0.65rem] leading-tight text-center max-w-full truncate px-0.5 ${
                  esActual ? 'font-bold text-text' : 'font-medium text-text-muted group-hover:text-text'
                }`}>
                  {paso.label}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
