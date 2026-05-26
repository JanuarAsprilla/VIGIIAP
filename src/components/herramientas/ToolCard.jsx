import Card3D from '@/components/ui/Card3D'
import { motion } from 'framer-motion'
import { cardEnter3D } from '@/lib/animations'

const accentStyles = {
  primary: { border: 'border-t-primary-800', glow: 'rgba(26,86,50,0.22)'   },
  orange:  { border: 'border-t-gold-400',    glow: 'rgba(247,172,66,0.22)' },
  gold:    { border: 'border-t-gold-500',    glow: 'rgba(212,163,115,0.22)'},
  green:   { border: 'border-t-primary-500', glow: 'rgba(33,136,66,0.20)'  },
}

/**
 * Tarjeta contenedora para cada herramienta SIG — 3D tilt.
 * Responsabilidad única: layout visual + animación de entrada.
 */
export default function ToolCard({ tag, title, icon: Icon, color, children, index }) {
  const styles = accentStyles[color] || accentStyles.primary

  return (
    <Card3D
      {...cardEnter3D(index)}
      glow={styles.glow}
      intensity={4}
      className={`bg-white border border-border/70 rounded-xl overflow-hidden border-t-2 ${styles.border}`}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="inline-block text-[0.6rem] font-bold uppercase tracking-widest text-text-muted mb-1.5">
              {tag}
            </span>
            <h3 className="text-lg font-bold text-text leading-snug">{title}</h3>
          </div>
          <motion.div
            whileHover={{ rotate: -6, scale: 1.08 }}
            transition={{ type: 'spring', stiffness: 350, damping: 20 }}
            className="w-10 h-10 bg-bg-alt rounded-lg flex items-center justify-center shrink-0"
          >
            <Icon className="w-5 h-5 text-primary-800" aria-hidden="true" />
          </motion.div>
        </div>
        {children}
      </div>
    </Card3D>
  )
}
