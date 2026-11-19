import { MOTIVO_ESPECIES_CON_FUENTE } from '../lib/aplicabilidad'

interface Props {
  /** Quita la entidad y el conjunto para volver a ver las especies del territorio. */
  onQuitarFuente: () => void
}

/** Con entidad o conjunto en un inventario agregado no hay lista de especies que corresponda al filtro: se explica y se ofrece la salida. */
export default function EspeciesNoDisponibles({ onQuitarFuente }: Props) {
  return (
    <div className="bio-panel p-6 text-center space-y-3" role="status">
      <p className="font-bold text-text">Las especies no se pueden separar por fuente</p>
      <p className="text-sm text-text-muted max-w-xl mx-auto">{MOTIVO_ESPECIES_CON_FUENTE}</p>
      <button type="button" className="bio-boton" onClick={onQuitarFuente}>Quitar entidad y conjunto</button>
    </div>
  )
}
