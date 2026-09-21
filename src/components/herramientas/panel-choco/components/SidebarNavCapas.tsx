import { CAPAS_NAV } from '../capasNav'
import type { CapaId } from '../types'

interface SidebarNavCapasProps {
  capaActiva: CapaId
  onCambiarCapa: (id: CapaId) => void
}

export default function SidebarNavCapas({ capaActiva, onCambiarCapa }: SidebarNavCapasProps) {
  return (
    <nav aria-label="Capas temáticas" className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 md:w-56 shrink-0">
      {CAPAS_NAV.map((capa) => (
        <button
          key={capa.id}
          onClick={() => onCambiarCapa(capa.id)}
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left whitespace-nowrap md:whitespace-normal shrink-0 transition-colors ${
            capaActiva === capa.id
              ? 'bg-bg-alt text-text font-semibold'
              : 'text-text-muted hover:bg-bg-alt/60 hover:text-text'
          }`}
        >
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: capa.color }}
            aria-hidden="true"
          />
          {capa.label}
        </button>
      ))}
    </nav>
  )
}
