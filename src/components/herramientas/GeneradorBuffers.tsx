import { Target, Construction } from 'lucide-react'
import ToolCard from './ToolCard'

export default function GeneradorBuffers() {
  return (
    <ToolCard tag="Procesamiento" title="Generador de Buffers" icon={Target} color="orange" index={1}>
      <p className="text-sm text-text-muted leading-relaxed mb-5">
        Genera zonas de influencia (buffers) alrededor de puntos, líneas y polígonos
        con resolución configurable en el Sistema de Referencia MAGNA-SIRGAS.
      </p>
      <div className="flex flex-col items-center justify-center py-6 gap-3 border border-dashed border-border rounded-xl bg-bg-alt/40">
        <div className="w-10 h-10 bg-gold-50 rounded-xl flex items-center justify-center">
          <Construction className="w-5 h-5 text-gold-500" aria-hidden="true" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-text mb-0.5">En desarrollo</p>
          <p className="text-xs text-text-muted">Requiere integración con el servicio PostGIS</p>
        </div>
        <span className="text-[0.6rem] font-bold uppercase tracking-widest text-gold-600 bg-gold-50 px-3 py-1 rounded-full border border-gold-200">
          Próximamente
        </span>
      </div>
    </ToolCard>
  )
}
