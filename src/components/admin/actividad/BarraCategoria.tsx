import { motion } from 'framer-motion'
import type { ComponentType } from 'react'

/** Barra horizontal con el porcentaje que representa `valor` sobre `total`. */
export default function BarraCategoria({ label, valor, total, delay, icon: Icon }: {
  label: string
  valor: number
  total: number
  delay: number
  icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
}) {
  const pct = total > 0 ? Math.round((valor / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      {Icon && <Icon className="w-4 h-4 text-text-muted shrink-0" aria-hidden="true" />}
      <span className="text-xs text-text-muted w-28 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 bg-bg-alt rounded-full overflow-hidden">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: pct / 100 }}
          transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: 'left' }}
          className="h-full bg-primary-700 rounded-full"
        />
      </div>
      <span className="text-xs font-semibold text-text w-16 text-right shrink-0">{valor} ({pct}%)</span>
    </div>
  )
}
