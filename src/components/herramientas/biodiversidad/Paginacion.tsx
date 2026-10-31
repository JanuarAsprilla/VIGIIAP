import { ChevronLeft, ChevronRight } from 'lucide-react'
import { fmtNum } from './lib/format'

interface Props {
  etiqueta: string
  pagina: number
  maxPaginas: number
  onCambio: (pagina: number) => void
  nota?: string
}

export default function Paginacion({ etiqueta, pagina, maxPaginas, onCambio, nota }: Props) {
  if (maxPaginas <= 1) return null
  return (
    <nav className="flex flex-wrap items-center justify-between gap-3" aria-label={etiqueta}>
      <div className="flex items-center gap-2">
        <button type="button" className="bio-boton" disabled={pagina <= 1} onClick={() => onCambio(pagina - 1)}>
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />Anterior
        </button>
        <button type="button" className="bio-boton" disabled={pagina >= maxPaginas} onClick={() => onCambio(pagina + 1)}>
          Siguiente<ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      <span className="text-sm text-text-muted tabular-nums">Página {fmtNum(pagina)} de {fmtNum(maxPaginas)}</span>
      {nota && <p className="basis-full text-xs text-text-muted">{nota}</p>}
    </nav>
  )
}
