import { fmtNum, fmtPct } from '../lib/format'
import { traducirEvidencia } from '../lib/evidencia'

const MAXIMO_TIPOS = 6

export default function BarrasEvidencia({ datos }: { datos: { tipo: string; registros: number }[] }) {
  if (datos.length === 0) return <p className="text-sm text-text-muted">Sin información de evidencia en este alcance.</p>
  const total = datos.reduce((a, d) => a + d.registros, 0)
  const maximo = Math.max(1, ...datos.map((d) => d.registros))
  const visibles = datos.slice(0, MAXIMO_TIPOS)
  const ocultos = datos.length - visibles.length
  return (
    <div>
      <ul className="space-y-2.5">
      {visibles.map((d) => (
        <li key={d.tipo}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-text truncate">{traducirEvidencia(d.tipo)}</span>
            <span className="tabular-nums text-text-muted shrink-0"><b className="text-text">{fmtNum(d.registros)}</b> · {fmtPct(d.registros, total)}</span>
          </div>
          <span className="bio-riel block" aria-hidden="true">
            <span className="bio-barra block" style={{ transform: `scaleX(${d.registros / maximo})` }} />
          </span>
        </li>
      ))}
      </ul>
      {ocultos > 0 && <p className="text-xs text-text-muted mt-2">Y {ocultos} {ocultos === 1 ? 'tipo más' : 'tipos más'} con menos registros.</p>}
    </div>
  )
}
