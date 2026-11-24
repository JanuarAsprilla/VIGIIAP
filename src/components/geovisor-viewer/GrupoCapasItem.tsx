import { useId, useState } from 'react'
import { ChevronRight, Layers3 } from 'lucide-react'
import { estadoDeGrupo, type GrupoResuelto, type MiembroGrupo } from '@/lib/geovisores/grupos'
import DetalleCapa from './DetalleCapa'
import FilaCapaCatalogo from './FilaCapaCatalogo'

const POSICION_PERILLA = { ninguna: 'translate-x-0', algunas: 'translate-x-[0.5625rem]', todas: 'translate-x-[1.125rem]' } as const

export default function GrupoCapasItem({ resuelto, idsActivos, color, onToggleCapa }: {
  resuelto: GrupoResuelto
  idsActivos: ReadonlySet<string>
  color: string
  onToggleCapa: (miembro: MiembroGrupo) => void
}) {
  const { grupo, miembros } = resuelto
  const [abierto, setAbierto] = useState(false)
  const idDetalle = useId()
  const titulo = grupo.titulo?.trim() || grupo.nombre
  const estado = estadoDeGrupo(miembros, idsActivos)

  // Parcial o apagado enciende lo que falta; solo con todo encendido se apaga todo.
  const alternarTodas = () => {
    const pendientes = estado === 'todas' ? miembros : miembros.filter((m) => !idsActivos.has(m.capa.id))
    pendientes.forEach(onToggleCapa)
  }

  return (
    <div className="border-l-2 bg-primary-700/[0.04]" style={{ borderColor: color }}>
      <div className="flex items-center gap-2 pr-2.5">
        <button type="button" onClick={() => setAbierto((v) => !v)} aria-expanded={abierto} aria-controls={idDetalle}
          className="flex flex-1 min-w-0 items-center gap-2 px-2.5 py-2 text-left text-xs font-semibold text-text hover:bg-bg-alt transition-colors">
          <Layers3 className="w-3.5 h-3.5 shrink-0 text-primary-700" aria-hidden="true" />
          <span className="truncate flex-1">{titulo}</span>
          <span className="text-[0.6rem] font-normal text-text-muted shrink-0">{miembros.length === 1 ? '1 capa' : `${miembros.length} capas`}</span>
          <ChevronRight className={`w-3.5 h-3.5 shrink-0 text-text-muted transition-transform ${abierto ? 'rotate-90' : ''}`} aria-hidden="true" />
        </button>
        <button type="button" role="checkbox" aria-checked={estado === 'todas' ? true : estado === 'algunas' ? 'mixed' : false}
          aria-label={`Todas las capas de ${titulo}`} onClick={alternarTodas}
          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
            estado === 'ninguna' ? 'bg-bg-alt border border-border' : estado === 'todas' ? 'bg-primary-700' : 'bg-primary-700/55'
          }`}>
          <span aria-hidden="true" className={`ml-0.5 inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${POSICION_PERILLA[estado]}`} />
        </button>
      </div>
      {abierto && (
        <div id={idDetalle} className="px-2.5 pb-1">
          <DetalleCapa resumen={grupo.resumen} palabrasClave={[...new Set(miembros.flatMap((m) => m.capa.palabrasClave ?? []))]} />
          <div className="divide-y divide-border/40 -mx-2.5">
            {miembros.map((m) => (
              <FilaCapaCatalogo key={m.capa.id} capa={m.capa} activa={idsActivos.has(m.capa.id)} onToggle={() => onToggleCapa(m)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
