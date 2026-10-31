import { LayoutGrid, Table2 } from 'lucide-react'
import type { ModoRegistros } from './lib/parametros'

interface Props {
  etiqueta: string
  modo: ModoRegistros
  onCambio: (modo: ModoRegistros) => void
}

/** Conmutador Tarjetas | Tabla. Las tarjetas son lo predeterminado; la tabla es la vista detallada. */
export default function ConmutadorVista({ etiqueta, modo, onCambio }: Props) {
  return (
    <div role="group" aria-label={etiqueta} className="bio-segmentos">
      <button type="button" aria-pressed={modo === 'tarjetas'} onClick={() => onCambio('tarjetas')}>
        <LayoutGrid className="w-4 h-4" aria-hidden="true" />Tarjetas
      </button>
      <button type="button" aria-pressed={modo === 'tabla'} onClick={() => onCambio('tabla')}>
        <Table2 className="w-4 h-4" aria-hidden="true" />Tabla detallada
      </button>
    </div>
  )
}
