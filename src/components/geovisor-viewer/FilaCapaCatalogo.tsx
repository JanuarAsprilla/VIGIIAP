import type { CapaGeoserver } from '@/types'
import { ayudaCapa, nombreCapa } from '@/lib/geovisores/capas'

export default function FilaCapaCatalogo({ capa, activa, onToggle }: {
  capa: CapaGeoserver
  activa: boolean
  onToggle: () => void
}) {
  return (
    <label title={ayudaCapa(capa)} className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-text cursor-pointer hover:bg-bg-alt transition-colors">
      <input type="checkbox" checked={activa} onChange={onToggle}
        className="w-3.5 h-3.5 rounded border-border text-primary-800 focus:ring-primary-800/30 shrink-0" />
      <span className="truncate flex-1">{nombreCapa(capa)}</span>
      {capa.nueva && (
        <span className="rounded-full bg-accent/15 text-primary-800 px-1.5 py-0.5 text-[0.55rem] font-bold shrink-0">Nueva</span>
      )}
      <span className="text-[0.55rem] uppercase font-bold text-text-muted/70 shrink-0">{capa.tipo === 'raster' ? 'raster' : 'vector'}</span>
    </label>
  )
}
