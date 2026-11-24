import type { ReactNode } from 'react'
import type { CapaInventario } from '@/types'

export function Guion() {
  return <span className="text-text-muted"><span aria-hidden="true">—</span><span className="sr-only">sin dato</span></span>
}

export function Codigo({ children }: { children: ReactNode }) {
  return <code className="font-mono text-[0.7rem] text-text-muted break-all">{children}</code>
}

const fechaCorta = (iso: string) => new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })

export function EstadoCapa({ capa }: { capa: CapaInventario }) {
  if (capa.eliminado_en) {
    return <span className="inline-flex flex-col"><span className="font-bold text-red-800 dark:text-red-300">Eliminada</span><span className="text-[0.65rem] text-text-muted">{fechaCorta(capa.eliminado_en)}</span></span>
  }
  return capa.habilitada
    ? <span className="text-green-800 dark:text-green-300">Habilitada</span>
    : <span className="text-amber-800 dark:text-amber-300">Deshabilitada</span>
}
