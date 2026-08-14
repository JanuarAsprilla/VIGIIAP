import { BarChart3, Construction } from 'lucide-react'
import ToolCard from './ToolCard'

export default function TablerosControl() {
  return (
    <ToolCard tag="Reportes" title="Tableros de Control" icon={BarChart3} color="gold" index={6}>
      <p className="text-sm text-text-muted leading-relaxed mb-5">
        Indicadores ambientales consolidados del Chocó Biogeográfico: cobertura forestal,
        calidad hídrica, biodiversidad y más. Configurable desde el módulo de administración.
      </p>
      <div className="flex flex-col items-center justify-center py-6 gap-3 border border-dashed border-border rounded-xl bg-bg-alt/40">
        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
          <Construction className="w-5 h-5 text-amber-500" aria-hidden="true" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-text mb-0.5">En desarrollo</p>
          <p className="text-xs text-text-muted">Requiere fuente de datos de indicadores ambientales</p>
        </div>
        <span className="text-[0.6rem] font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
          Próximamente
        </span>
      </div>
    </ToolCard>
  )
}
