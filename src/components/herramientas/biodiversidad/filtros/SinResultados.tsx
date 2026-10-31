import { X } from 'lucide-react'
import type { ChipFiltro } from '../lib/chips'
import type { CambiosUrl } from '../lib/filtros'

interface Props {
  titulo: string
  chips: ChipFiltro[]
  /** Texto cuando no hay filtros que sugerir quitar. */
  sinFiltros: string
  onCambio: (cambios: CambiosUrl) => void
  onLimpiar: () => void
}

/** «Sin resultados» que propone qué filtro quitar, en vez de dejar a la persona sin salida. */
export default function SinResultados({ titulo, chips, sinFiltros, onCambio, onLimpiar }: Props) {
  return (
    <div className="bio-panel p-6 text-center space-y-3">
      <p className="font-bold text-text">{titulo}</p>
      {chips.length === 0 ? <p className="text-sm text-text-muted">{sinFiltros}</p> : (
        <>
          <p className="text-sm text-text-muted">Ningún dato cumple todos los filtros a la vez. Prueba quitando alguno:</p>
          <ul className="flex flex-wrap justify-center gap-2">
            {chips.map((c) => (
              <li key={c.clave}>
                <button type="button" className="bio-boton bio-boton-chico" onClick={() => onCambio(c.quitar)} aria-label={c.quitarEtiqueta}>
                  <X className="w-3.5 h-3.5" aria-hidden="true" />{c.etiqueta}
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="bio-limpiar" onClick={onLimpiar}>Limpiar todos los filtros</button>
        </>
      )}
    </div>
  )
}
