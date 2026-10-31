import { motion } from 'framer-motion'
import { Filter } from 'lucide-react'
import { fadeUpSm } from '@/lib/animations'
import EstadoCarga from '@/components/admin/actividad/EstadoCarga'
import { useEmbudos, type Embudo, type RangoFechas } from '@/hooks/useAnalitica'

function PasosDelEmbudo({ embudo }: { embudo: Embudo }) {
  if (embudo.pasos[0]?.sesiones === 0) {
    return <p className="text-xs text-text-faint py-2">Sin sesiones en este recorrido en el período</p>
  }
  return (
    <ol className="space-y-2.5">
      {embudo.pasos.map((paso, i) => (
        <li key={paso.etiqueta}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-text">{paso.etiqueta}</span>
            <span className="font-semibold text-text shrink-0">{paso.sesiones}</span>
          </div>
          <div className="mt-1 h-2 bg-bg-alt rounded-full overflow-hidden" aria-hidden="true">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: paso.pctDelInicio / 100 }}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: 'left' }}
              className="h-full bg-primary-700 rounded-full"
            />
          </div>
          {i > 0 && (
            <div className="mt-1 flex justify-between text-[0.65rem] text-text-muted">
              <span>{`${paso.pctDelAnterior} % continúa`}</span>
              <span>{`${paso.pctDelInicio} % del inicio`}</span>
            </div>
          )}
        </li>
      ))}
    </ol>
  )
}

/** Recorridos de conversión: cuántas sesiones llegan a cada paso habiendo pasado por los anteriores, en orden. */
export default function EmbudosConversion({ rango }: { rango: RangoFechas }) {
  const { data, isLoading, isError } = useEmbudos(rango)
  const embudos = Array.isArray(data) ? data : []

  return (
    <motion.div {...fadeUpSm(0.14)} className="bg-[var(--card-bg)] border border-border/70 rounded-xl p-5">
      <h3 className="section-title mb-4 flex items-center gap-2">
        <Filter className="w-4 h-4 text-primary-700" /> Embudos de Conversión
      </h3>
      <EstadoCarga isLoading={isLoading} isError={isError} vacio={embudos.length === 0} />
      {!isLoading && !isError && embudos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {embudos.map((embudo) => (
            <section key={embudo.id} aria-label={embudo.titulo}>
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">{embudo.titulo}</h4>
              <PasosDelEmbudo embudo={embudo} />
            </section>
          ))}
        </div>
      )}
    </motion.div>
  )
}
