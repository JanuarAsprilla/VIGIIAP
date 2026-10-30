import { AlertTriangle, RotateCw } from 'lucide-react'
import { describirError } from './lib/errores'

interface ErrorProps {
  error: unknown
  onReintentar: () => void
  compacto?: boolean
}

/** Error de consulta con mensaje por código HTTP y botón de reintento. */
export function PanelError({ error, onReintentar, compacto = false }: ErrorProps) {
  const { titulo, detalle } = describirError(error)
  return (
    <div role="alert" className={`bio-panel flex flex-col items-start gap-3 ${compacto ? 'p-4' : 'p-6'}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-gold-500" aria-hidden="true" />
        <div>
          <p className="font-bold text-text">{titulo}</p>
          <p className="text-sm text-text-muted mt-0.5">{detalle}</p>
        </div>
      </div>
      <button type="button" className="bio-boton" onClick={onReintentar}>
        <RotateCw className="w-4 h-4" aria-hidden="true" />
        Reintentar
      </button>
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

export function Cargando({ etiqueta, className = '' }: { etiqueta: string; className?: string }) {
  return <div role="status" aria-label={etiqueta} className={`animate-pulse bg-bg-alt rounded-xl ${className}`} />
}
