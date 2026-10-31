import { Info, X } from 'lucide-react'

interface Props {
  titulo: string
  elementos: string[]
  onCerrar: () => void
}

/** Aviso descartable de filtros que se quitaron o no aplican (cambio de grupo o enlace con valores inválidos). */
export default function AvisoFiltros({ titulo, elementos, onCerrar }: Props) {
  if (elementos.length === 0) return null
  return (
    <div className="bio-aviso" role="status">
      <Info className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
      <p className="min-w-0">
        <b>{titulo}</b> {elementos.join(' · ')}
      </p>
      <button type="button" className="bio-ctl bio-ctl-chico" onClick={onCerrar} aria-label="Cerrar el aviso"><X className="w-3.5 h-3.5" aria-hidden="true" /></button>
    </div>
  )
}
