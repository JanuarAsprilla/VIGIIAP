import { motion } from 'framer-motion'
import { fadeUp } from '@/lib/animations'

const borderColors = {
  primary: 'border-t-primary-800',
  orange:  'border-t-gold-400',
  gold:    'border-t-gold-500',
  green:   'border-t-primary-500',
}

/**
 * Tarjeta contenedora para cada herramienta SIG.
 * Responsabilidad única: layout visual + animación de entrada.
 */
export default function ToolCard({ tag, title, icon: Icon, color, children, index }) {
  return (
    <motion.div
      {...fadeUp(0.1 + index * 0.08)}
      className={`bg-white border border-border rounded-xl overflow-hidden border-t-2 ${borderColors[color] || borderColors.primary}`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="inline-block text-[0.6rem] font-bold uppercase tracking-widest text-text-muted mb-1.5">
              {tag}
            </span>
            <h3 className="text-lg font-bold text-text leading-snug">{title}</h3>
          </div>
          <div className="w-10 h-10 bg-bg-alt rounded-lg flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-primary-800" aria-hidden="true" />
          </div>
        </div>
        {children}
      </div>
    </motion.div>
  )
}
