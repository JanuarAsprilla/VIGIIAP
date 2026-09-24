import { TrendingUp, TrendingDown } from 'lucide-react'

/** Badge de variación semana-vs-anterior — usado en las tarjetas KPI del
 *  Dashboard y de Analítica (misma semántica de color: verde=sube, naranja=baja). */
export default function DeltaBadge({ pct }: { pct: number }) {
  if (pct === 0) {
    return <span className="text-[0.65rem] font-semibold text-text-faint">Sin cambios</span>
  }
  const up = pct > 0
  return (
    <span className={`inline-flex items-center gap-1 text-[0.65rem] font-semibold ${up ? 'text-green-600' : 'text-orange-500'}`}>
      {up ? <TrendingUp className="w-3 h-3" aria-hidden="true" /> : <TrendingDown className="w-3 h-3" aria-hidden="true" />}
      {up ? '+' : ''}{pct}%
    </span>
  )
}
