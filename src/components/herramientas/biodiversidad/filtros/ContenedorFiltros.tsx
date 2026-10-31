import { useId, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { useDialogoModal } from '@/hooks/useDialogoModal'

interface Props {
  /** Pantalla ancha: columna fija junto al contenido; si no, hoja inferior modal. */
  ancho: boolean
  abierto: boolean
  origen: RefObject<HTMLElement | null>
  onCerrar: () => void
  children: (idTitulo: string, cerrar: (() => void) | undefined) => ReactNode
}

function Hoja({ origen, onCerrar, children }: Omit<Props, 'ancho' | 'abierto'>) {
  const titulo = useId()
  const { caja, alTeclear } = useDialogoModal(origen, onCerrar)
  return createPortal(
    <div className="bio-root bio-velo bio-velo-hoja" onMouseDown={(e) => { if (e.target === e.currentTarget) onCerrar() }}>
      <div ref={caja} role="dialog" aria-modal="true" aria-labelledby={titulo} tabIndex={-1} className="bio-hoja" onKeyDown={alTeclear}>
        {children(titulo, onCerrar)}
      </div>
    </div>,
    document.body,
  )
}

/** Escritorio: panel pegajoso al lado del contenido. Móvil y tableta: hoja inferior con foco atrapado. */
export default function ContenedorFiltros({ ancho, abierto, origen, onCerrar, children }: Props) {
  const titulo = useId()
  if (!abierto) return null
  if (ancho) {
    return (
      <aside className="bio-lateral" aria-labelledby={titulo}>
        {children(titulo, undefined)}
      </aside>
    )
  }
  return <Hoja origen={origen} onCerrar={onCerrar}>{children}</Hoja>
}
