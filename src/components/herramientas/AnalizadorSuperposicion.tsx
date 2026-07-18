import { Layers, Construction } from 'lucide-react'
import ToolCard from './ToolCard'

export default function AnalizadorSuperposicion() {
  return (
    <ToolCard tag="Análisis Espacial" title="Analizador de Superposición" icon={Layers} color="green" index={3}>
      <p className="text-sm text-text-muted leading-relaxed mb-5">
        Ejecuta procesos de intersección, unión y diferencia entre múltiples capas territoriales
        para detectar conflictos de uso del suelo o áreas de traslape legal.
      </p>
      <div className="flex flex-col items-center justify-center py-6 gap-3 border border-dashed border-border rounded-xl bg-bg-alt/40">
        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
          <Construction className="w-5 h-5 text-primary-600" aria-hidden="true" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-text mb-0.5">En desarrollo</p>
          <p className="text-xs text-text-muted">Requiere integración con el servicio PostGIS</p>
        </div>
        <span className="text-[0.6rem] font-bold uppercase tracking-widest text-primary-700 bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
          Próximamente
        </span>
      </div>
    </ToolCard>
  )
}
