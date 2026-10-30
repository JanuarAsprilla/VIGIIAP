import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'

export interface Pestana<T extends string> {
  id: T
  titulo: string
  contenido: ReactNode
}

interface Props<T extends string> {
  pestanas: Pestana<T>[]
  activa: T
  onCambiar: (id: T) => void
  etiqueta: string
}

/** Pestañas WAI-ARIA con navegación por flechas, Inicio y Fin (activación automática). */
export default function Pestanas<T extends string>({ pestanas, activa, onCambiar, etiqueta }: Props<T>) {
  const base = useId()
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const actual = pestanas.find((p) => p.id === activa) ?? pestanas[0]

  function alTeclear(e: KeyboardEvent, i: number) {
    const n = pestanas.length
    const destino = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n
      : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1
    if (destino < 0) return
    e.preventDefault()
    onCambiar(pestanas[destino].id)
    refs.current[destino]?.focus()
  }

  return (
    <div>
      <div role="tablist" aria-label={etiqueta} className="flex gap-1 border-b border-border overflow-x-auto">
        {pestanas.map((p, i) => {
          const sel = p.id === actual.id
          return (
            <button
              key={p.id} ref={(el) => { refs.current[i] = el }} type="button" role="tab" id={`${base}-t-${p.id}`}
              aria-selected={sel} aria-controls={`${base}-p-${p.id}`} tabIndex={sel ? 0 : -1}
              onClick={() => onCambiar(p.id)} onKeyDown={(e) => alTeclear(e, i)}
              className={`relative min-h-11 px-3 sm:px-4 text-sm font-semibold whitespace-nowrap transition-colors ${sel ? 'text-text' : 'text-text-muted hover:text-text'}`}
            >
              {p.titulo}
              <span className={`absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary-600 dark:bg-primary-400 transition-opacity ${sel ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true" />
            </button>
          )
        })}
      </div>
      <div role="tabpanel" id={`${base}-p-${actual.id}`} aria-labelledby={`${base}-t-${actual.id}`} className="pt-4">
        {actual.contenido}
      </div>
    </div>
  )
}
