import type { ReactNode } from 'react'
import { Lock } from 'lucide-react'

interface Props {
  titulo: string
  /** Filtros activos en la sección: se muestra como contador. */
  activos: number
  /** Abierta por defecto (y se abre sola cuando aparece un filtro activo). */
  abierta?: boolean
  /** Explica por qué la sección no aplica; si se da, no se muestran los controles. */
  noAplica?: string | null
  children: ReactNode
}

/** Sección plegable del panel de filtros (`<details>` nativo: teclado y lectores de pantalla sin código extra). */
export default function SeccionFiltro({ titulo, activos, abierta = false, noAplica, children }: Props) {
  return (
    <details className="bio-seccion" open={abierta || activos > 0}>
      <summary>
        <span className="bio-seccion-titulo">{titulo}</span>
        {noAplica ? (
          <span className="bio-seccion-bloqueada"><Lock className="w-3 h-3" aria-hidden="true" />No aplica</span>
        ) : activos > 0 ? (
          <span className="bio-seccion-cuenta" aria-label={`${activos} ${activos === 1 ? 'filtro activo' : 'filtros activos'}`}>{activos}</span>
        ) : null}
      </summary>
      <div className="bio-seccion-cuerpo">
        {noAplica ? <p className="bio-seccion-aviso">{noAplica}</p> : children}
      </div>
    </details>
  )
}
