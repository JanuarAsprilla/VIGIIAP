import { BarChart3, TreePine, Droplets, Wind, TrendingUp, ExternalLink } from 'lucide-react'
import ToolCard from './ToolCard'

const INDICADORES = [
  { icon: TreePine,   label: 'Cobertura Forestal', valor: '68.4%',   tendencia: '+1.2%',  color: 'text-primary-700', bg: 'bg-primary-50' },
  { icon: Droplets,   label: 'Calidad Hídrica',    valor: '82/100',  tendencia: '+3pts',  color: 'text-blue-600',   bg: 'bg-blue-50'    },
  { icon: Wind,       label: 'Calidad del Aire',   valor: 'Buena',   tendencia: 'Estable', color: 'text-teal-600',   bg: 'bg-teal-50'    },
  { icon: TrendingUp, label: 'Biodiversidad',       valor: '1,240 sp.', tendencia: '+18 sp.', color: 'text-gold-500',  bg: 'bg-amber-50'  },
]

export default function TablerosControl() {
  return (
    <ToolCard tag="Reportes" title="Tableros de Control" icon={BarChart3} color="gold" index={6}>
      <p className="text-sm text-text-muted leading-relaxed mb-4">
        Indicadores ambientales consolidados del Chocó Biogeográfico.
        Los reportes personalizados se configuran desde el Módulo de Administración.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {INDICADORES.map((ind) => (
          <div key={ind.label} className={`rounded-lg p-3 ${ind.bg}`}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <ind.icon className={`w-3.5 h-3.5 ${ind.color}`} aria-hidden="true" />
              <span className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted">{ind.label}</span>
            </div>
            <div className="flex items-end justify-between">
              <span className={`text-lg font-bold ${ind.color}`}>{ind.valor}</span>
              <span className="text-[0.65rem] font-semibold text-primary-600 bg-primary-100 px-1.5 py-0.5 rounded">
                {ind.tendencia}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-text">Avance del monitoreo anual</span>
          <span className="text-xs font-bold text-primary-800">73%</span>
        </div>
        <div className="w-full h-2 bg-border rounded-full overflow-hidden">
          <div className="h-full w-[73%] bg-gradient-to-r from-primary-600 to-primary-400 rounded-full" aria-hidden="true" />
        </div>
        <p className="text-xs text-text-muted">Q3 2026 — 876 de 1,200 muestras procesadas</p>
      </div>

      <div className="flex gap-2">
        <button className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">
          <BarChart3 className="w-4 h-4" aria-hidden="true" />
          Ver Tablero
        </button>
        <button className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 hover:text-primary-800 transition-colors">
          <ExternalLink className="w-4 h-4" aria-hidden="true" />
          Exportar
        </button>
      </div>
    </ToolCard>
  )
}
