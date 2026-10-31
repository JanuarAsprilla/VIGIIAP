import { motion } from 'framer-motion'
import { ArrowRight, Route } from 'lucide-react'
import { fadeUpSm } from '@/lib/animations'
import EstadoCarga from '@/components/admin/actividad/EstadoCarga'
import { useFlujoNavegacion, type RangoFechas } from '@/hooks/useAnalitica'

const MAX_FILAS = 12

/** Pares «de esta página a esta otra» más frecuentes dentro de una misma sesión. */
export default function FlujoNavegacion({ rango }: { rango: RangoFechas }) {
  const { data, isLoading, isError } = useFlujoNavegacion(rango)
  const transiciones = Array.isArray(data) ? data : []

  return (
    <motion.div {...fadeUpSm(0.16)} className="bg-[var(--card-bg)] border border-border/70 rounded-xl p-5">
      <h3 className="section-title mb-4 flex items-center gap-2">
        <Route className="w-4 h-4 text-primary-700" /> Flujo de Navegación
      </h3>
      <EstadoCarga isLoading={isLoading} isError={isError} vacio={transiciones.length === 0} />
      {!isLoading && !isError && transiciones.length > 0 && (
        <ul className="space-y-1">
          {transiciones.slice(0, MAX_FILAS).map((t) => (
            <li key={`${t.desde}->${t.hacia}`} className="flex items-center gap-2 text-xs py-1 border-b border-border/40 last:border-0">
              <span className="font-mono text-text truncate">{t.desde}</span>
              <ArrowRight className="w-3 h-3 text-text-muted shrink-0" aria-label="va a" />
              <span className="font-mono text-text truncate flex-1">{t.hacia}</span>
              <span className="font-semibold text-text shrink-0">{t.veces}</span>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}
