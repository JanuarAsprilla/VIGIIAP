import { AlertTriangle, FilterX, RotateCw } from 'lucide-react'
import { describirError } from './lib/errores'

interface ErrorProps {
  error: unknown
  onReintentar: () => void
  /** Si se da, en un error de filtros (422) se ofrece limpiarlos en vez de repetir la misma consulta. */
  onLimpiarFiltros?: () => void
  compacto?: boolean
}

/** Error de consulta con mensaje por código HTTP y botón de reintento. */
export function PanelError({ error, onReintentar, onLimpiarFiltros, compacto = false }: ErrorProps) {
  const { titulo, detalle, requiereCambiarFiltros } = describirError(error)
  const limpiar = requiereCambiarFiltros && onLimpiarFiltros ? onLimpiarFiltros : null
  return (
    <div role="alert" className={`bio-panel flex flex-col items-start gap-3 ${compacto ? 'p-4' : 'p-6'}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-gold-500" aria-hidden="true" />
        <div>
          <p className="font-bold text-text">{titulo}</p>
          <p className="text-sm text-text-muted mt-0.5">{detalle}</p>
        </div>
      </div>
      {limpiar ? (
        <button type="button" className="bio-boton" onClick={limpiar}>
          <FilterX className="w-4 h-4" aria-hidden="true" />
          Limpiar filtros
        </button>
      ) : (
        <button type="button" className="bio-boton" onClick={onReintentar}>
          <RotateCw className="w-4 h-4" aria-hidden="true" />
          Reintentar
        </button>
      )}
    </div>
  )
}

export function PanelVacio({ titulo, detalle }: { titulo: string; detalle: string }) {
  return (
    <div className="bio-panel p-6 text-center">
      <p className="font-bold text-text">{titulo}</p>
      <p className="text-sm text-text-muted mt-1">{detalle}</p>
    </div>
  )
}

/** `anunciar={false}` en una fila de esqueletos: solo uno se lee, los demás son decorativos. */
export function Cargando({ etiqueta, className = '', anunciar = true }: { etiqueta: string; className?: string; anunciar?: boolean }) {
  if (!anunciar) return <div aria-hidden="true" className={`skeleton rounded-xl ${className}`} />
  return <div role="status" aria-label={etiqueta} className={`skeleton rounded-xl ${className}`} />
}
