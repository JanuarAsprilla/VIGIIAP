import { motion } from 'framer-motion'
import { staggerContainer, staggerItem3D } from '@/lib/animations'
import Card3D from '@/components/ui/Card3D'
import type { SolicitudData } from '@/hooks/useSolicitudes'

interface BottomStatsProps {
  rows: SolicitudData[]
}

export function BottomStats({ rows }: BottomStatsProps) {
  const total     = rows.length
  const pendiente = rows.filter((r) => r.estado === 'Pendiente' || r.estado === 'En Revisión').length
  const resuelta  = rows.filter((r) => r.estado === 'Resuelta' || r.estado === 'Aprobado').length
  const tasaStr   = total > 0 ? `${Math.round((resuelta / total) * 100)}%` : '—'
  const kpis = [
    { label: 'Total',      value: String(total),      glow: 'rgba(26,86,50,0.18)'   },
    { label: 'En Proceso', value: String(pendiente),  glow: 'rgba(247,172,66,0.18)' },
    { label: 'Resueltas',  value: tasaStr,            glow: 'rgba(26,86,50,0.22)'   },
    { label: 'Rechazadas', value: String(rows.filter((r) => r.estado === 'Rechazado').length), glow: 'rgba(231,111,81,0.18)' },
  ]
  return (
    <motion.div
      variants={staggerContainer(0.07, 0.35)}
      initial="initial" animate="animate"
      className="grid grid-cols-2 md:grid-cols-4 gap-4"
    >
      {kpis.map((kpi) => (
        <motion.div key={kpi.label} variants={staggerItem3D}>
          <Card3D
            glow={kpi.glow}
            intensity={4}
            className="bg-white border border-border/70 rounded-xl px-5 py-4 text-center"
            whileHover={{ y: -3 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="block text-[0.6rem] font-bold uppercase tracking-widest text-text-muted mb-1">
              {kpi.label}
            </span>
            <span className="block font-display text-3xl font-bold text-text tabular-nums">
              {kpi.value}
            </span>
          </Card3D>
        </motion.div>
      ))}
    </motion.div>
  )
}
