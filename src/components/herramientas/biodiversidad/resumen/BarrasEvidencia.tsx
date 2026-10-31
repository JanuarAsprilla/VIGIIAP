import { fmtNum, fmtPct } from '../lib/format'
import { traducirEvidencia } from '../lib/evidencia'

export default function BarrasEvidencia({ datos }: { datos: { tipo: string; registros: number }[] }) {
  if (datos.length === 0) return <p className="text-sm text-text-muted">Sin información de evidencia en este alcance.</p>
  const total = datos.reduce((a, d) => a + d.registros, 0)
  const maximo = Math.max(1, ...datos.map((d) => d.registros))
  return (
    <ul className="space-y-2.5">
      {datos.slice(0, 6).map((d) => (
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
  )
}
