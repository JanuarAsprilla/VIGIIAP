import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Home, Map, FileText } from 'lucide-react'
import Card3D from '@/components/ui/Card3D'
import { EASE_OUT_EXPO } from '@/lib/animations'

const QUICK_LINKS = [
  { to: '/',           icon: Home,     label: 'Inicio'       },
  { to: '/mapas',      icon: Map,      label: 'Mapas'        },
  { to: '/documentos', icon: FileText, label: 'Documentos'   },
]

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden"
      style={{ background: 'var(--shell-bg)' }}
    >
      {/* Ruta 404 vive fuera de MainLayout — sin sidebar/topbar — así que
          trae sus propios orbes ambientales para que el panel de vidrio
          tenga algo de profundidad detrás sobre lo cual flotar. */}
      <div className="orb-1 absolute -top-40 -left-32 w-[480px] h-[480px] rounded-full bg-primary-500/[0.07] blur-[90px] pointer-events-none" aria-hidden="true" />
      <div className="orb-2 absolute -bottom-40 -right-32 w-[420px] h-[420px] rounded-full bg-gold-400/[0.06] blur-[90px] pointer-events-none" aria-hidden="true" />

      <motion.div
        initial={{ opacity: 0, y: 28, rotateX: 5, scale: 0.96 }}
        animate={{ opacity: 1, y: 0,  rotateX: 0, scale: 1    }}
        transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
        style={{ transformPerspective: 1000, transformOrigin: 'top center' }}
        className="glass-panel relative z-10 w-full max-w-lg text-center px-8 py-12 sm:px-12 rounded-3xl"
      >
        {/* 404 visual */}
        <div className="relative mb-8 select-none overflow-hidden">
          <motion.p
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mask-fade-bottom text-[9rem] sm:text-[11rem] font-display font-bold leading-none tracking-tight"
            style={{ color: 'var(--stats-value)', opacity: 0.28 }}
          >
            404
          </motion.p>

          {/* Floating globe decoration */}
          <motion.div
            animate={{ y: [-4, 4, -4] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="relative">
              <svg viewBox="0 0 120 120" className="w-28 h-28"
                style={{ filter: 'drop-shadow(0 4px 24px rgba(27,67,50,0.15))' }}>
                <defs>
                  <radialGradient id="nf-g" cx="35%" cy="30%" r="65%">
                    <stop offset="0%" stopColor="rgba(64,145,108,0.18)" />
                    <stop offset="100%" stopColor="rgba(8,28,21,0.04)" />
                  </radialGradient>
                  <clipPath id="nf-c"><circle cx="60" cy="60" r="48" /></clipPath>
                </defs>
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(116,198,157,0.08)" strokeWidth="8" />
                <circle cx="60" cy="60" r="48" fill="url(#nf-g)" />
                {[
                  { ry: 5, cy: 60, op: 0.5 },
                  { ry: 14, cy: 60, op: 0.22 },
                  { ry: 25, cy: 60, op: 0.14 },
                  { ry: 12, cy: 42, op: 0.18 },
                  { ry: 12, cy: 78, op: 0.18 },
                ].map((l, i) => (
                  <ellipse key={i} cx="60" cy={l.cy} rx="48" ry={l.ry}
                    fill="none" stroke={`rgba(116,198,157,${l.op})`} strokeWidth="0.6"
                    clipPath="url(#nf-c)" />
                ))}
                {[0, 60, 120].map((angle, i) => (
                  <ellipse key={`m${i}`} cx="60" cy="60" rx="6" ry="48"
                    fill="none" stroke={`rgba(116,198,157,${i === 0 ? 0.4 : 0.15})`} strokeWidth="0.6"
                    transform={`rotate(${angle}, 60, 60)`} clipPath="url(#nf-c)" />
                ))}
                <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(116,198,157,0.45)" strokeWidth="0.8" />
                {/* Question mark in center */}
                <text x="60" y="68" textAnchor="middle" fontSize="26" fontWeight="bold"
                  fill="rgba(27,67,50,0.35)" fontFamily="serif">?</text>
              </svg>
            </div>
          </motion.div>
        </div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className="font-display text-2xl font-bold text-text mb-2">
            Página no encontrada
          </h1>
          <p className="text-sm text-text-muted leading-relaxed max-w-sm mx-auto mb-8">
            La ruta que solicitó no existe en el portal VIGIA-IIAP. Puede haber sido movida,
            eliminada o nunca haber existido.
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 justify-center mb-10"
        >
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border-2 border-border rounded-xl text-sm font-semibold text-text hover:border-primary-800 hover:text-primary-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver atrás
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-800 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors no-underline"
          >
            <Home className="w-4 h-4" />
            Ir al inicio
          </Link>
        </motion.div>

        {/* Quick links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
            Accesos rápidos
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {QUICK_LINKS.map(({ to, icon: Icon, label }, i) => (
              <Card3D
                key={to}
                initial={{ opacity: 0, y: 12, rotateX: 4 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: 0.45 + i * 0.05, duration: 0.4, ease: EASE_OUT_EXPO }}
                style={{ transformPerspective: 600 }}
                glow="rgba(26,86,50,0.16)"
                intensity={5}
                whileHover={{ y: -3 }}
                className="inline-flex"
              >
                <Link
                  to={to}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg-alt border border-border/70 rounded-lg text-sm text-text-muted hover:border-primary-800 hover:text-primary-800 transition-colors no-underline"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              </Card3D>
            ))}
          </div>
        </motion.div>

        {/* IIAP tag */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="mt-10 text-xs text-text-muted/50 font-mono"
        >
          VIGIA-IIAP · Instituto de Investigaciones Ambientales del Pacífico
        </motion.p>
      </motion.div>
    </div>
  )
}
