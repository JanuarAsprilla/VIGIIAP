import { motion } from 'framer-motion'
import { Radio } from 'lucide-react'
import { fadeUpSm } from '@/lib/animations'
import EstadoCarga from '@/components/admin/actividad/EstadoCarga'
import { useTiempoReal } from '@/hooks/useAnalitica'

/** Visitantes con actividad en los últimos minutos y la página donde están; se refresca solo. */
export default function TiempoReal() {
  const { data, isLoading, isError } = useTiempoReal()
  const paginas = data?.paginasActuales ?? []

  return (
    <motion.div {...fadeUpSm(0.06)} className="bg-[var(--card-bg)] border border-border/70 rounded-xl p-5">
      <h3 className="section-title mb-4 flex items-center gap-2">
        <Radio className="w-4 h-4 text-primary-700" /> En línea ahora
      </h3>
      <EstadoCarga isLoading={isLoading} isError={isError} vacio={false} />
      {!isLoading && !isError && data && (
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          <div className="shrink-0">
            <p className="text-4xl font-bold text-text leading-none">{data.visitantesActivos ?? 0}</p>
            <p className="text-xs text-text-muted mt-1">visitantes en los últimos {data.ventanaMin ?? 5} min</p>
          </div>
          <div className="flex-1 min-w-0">
            {paginas.length === 0
              ? <p className="text-sm text-text-muted">Nadie en línea en este momento</p>
              : paginas.map((p) => (
                <div key={p.ruta} className="flex justify-between text-xs py-1 border-b border-border/40 last:border-0">
                  <span className="font-mono text-text truncate mr-2">{p.ruta}</span>
                  <span className="text-text-muted shrink-0">{p.visitantes}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
