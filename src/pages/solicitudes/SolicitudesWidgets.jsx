/**
 * SolicitudesWidgets — Sidebar widgets for the Solicitudes page:
 *   - MisSolicitudes: compact list of the authenticated user's own requests
 *   - AyudaCTA: help card linking to the user guide
 *   - BottomStats: KPI grid (Total, En Proceso, Resueltas, Rechazadas)
 */
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Eye, ArrowRight } from 'lucide-react'
import { useMisSolicitudes } from '@/hooks/useSolicitudes'
import { fadeUp, staggerContainer, staggerItem3D } from '@/lib/animations'
import Card3D from '@/components/ui/Card3D'

// ── Mis Solicitudes ──
export function MisSolicitudes({ onVerDetalle }) {
  const { data, isLoading } = useMisSolicitudes()
  const mis = data?.data ?? []

  if (isLoading || mis.length === 0) return null

  return (
    <Card3D
      {...fadeUp(0.3)}
      glow="rgba(26,86,50,0.14)"
      intensity={3}
      className="bg-white border border-border/70 rounded-xl overflow-hidden"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h3 className="text-sm font-bold text-text">Mis Solicitudes</h3>
          <p className="text-[0.65rem] text-text-muted mt-0.5">
            {mis.length} solicitud{mis.length !== 1 ? 'es' : ''} registrada{mis.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <div className="divide-y divide-border max-h-72 overflow-y-auto">
        {mis.map((s) => (
          <div key={s._id} className="flex items-center gap-3 px-5 py-3 hover:bg-bg-alt/30 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-[0.6rem] font-bold text-primary-800">{s.id}</p>
              <p className="text-xs font-semibold text-text truncate">{s.tipo}</p>
              <p className="text-[0.6rem] text-text-muted">{s.fecha}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[0.6rem] font-bold px-2 py-0.5 rounded-full ${
                s.estadoColor === 'green'  ? 'bg-green-100 text-green-700'
                : s.estadoColor === 'red'  ? 'bg-red-100 text-red-700'
                : s.estadoColor === 'teal' ? 'bg-teal-100 text-teal-700'
                : s.estadoColor === 'blue' ? 'bg-blue-100 text-blue-700'
                : 'bg-orange-100 text-orange-700'
              }`}>{s.estado}</span>
              <button
                onClick={() => onVerDetalle(s)}
                className="p-1 rounded-lg text-text-muted hover:text-primary-800 hover:bg-primary-50 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card3D>
  )
}

// ── Help CTA ──
export function AyudaCTA() {
  return (
    <Card3D
      {...fadeUp(0.35)}
      glow="rgba(26,86,50,0.16)"
      intensity={3}
      className="bg-primary-50 border border-primary-200 rounded-xl p-5"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <h4 className="text-sm font-bold text-primary-900 mb-1.5">
        ¿Necesitas ayuda técnica?
      </h4>
      <p className="text-xs text-primary-800/70 leading-relaxed mb-3">
        Nuestro equipo de soporte especializado está disponible para
        guiarte en trámites complejos.
      </p>
      <Link
        to="/guia-usuario"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-800 no-underline hover:text-primary-600 transition-colors"
      >
        Consultar Guía Técnica
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </Card3D>
  )
}

// ── Bottom KPIs ──
export function BottomStats({ rows }) {
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
