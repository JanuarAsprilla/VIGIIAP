import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowLeft, Map, FileText, Users } from 'lucide-react'

// ── Mini animated globe for left panel ──
function GlobeDecor() {
  return (
    <div className="relative w-52 h-52 mx-auto select-none">
      <div className="absolute inset-0 rounded-full bg-primary-500/10 blur-3xl" />
      <svg viewBox="0 0 200 200" className="w-full h-full"
        style={{ filter: 'drop-shadow(0 0 16px rgba(82,183,136,0.3))' }}>
        <defs>
          <radialGradient id="al-sg" cx="36%" cy="32%" r="65%">
            <stop offset="0%"   stopColor="rgba(64,145,108,0.25)" />
            <stop offset="100%" stopColor="rgba(8,28,21,0.05)"    />
          </radialGradient>
          <clipPath id="al-clip"><circle cx="100" cy="100" r="80" /></clipPath>
        </defs>
        {/* Atmosphere */}
        <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(116,198,157,0.06)" strokeWidth="14" />
        {/* Fill */}
        <circle cx="100" cy="100" r="80" fill="url(#al-sg)" />
        {/* Latitude lines */}
        {[
          { ry: 7,  cy: 100, op: 0.55 },
          { ry: 22, cy: 100, op: 0.28 },
          { ry: 40, cy: 100, op: 0.18 },
          { ry: 17, cy: 72,  op: 0.20 },
          { ry: 17, cy: 128, op: 0.20 },
          { ry: 9,  cy: 52,  op: 0.14 },
          { ry: 9,  cy: 148, op: 0.14 },
        ].map((l, i) => (
          <motion.ellipse key={i}
            cx="100" cy={l.cy} rx="80" ry={l.ry}
            fill="none" stroke={`rgba(116,198,157,${l.op})`} strokeWidth="0.7"
            clipPath="url(#al-clip)"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, delay: i * 0.08, ease: 'easeOut' }}
          />
        ))}
        {/* Longitude lines */}
        {[0, 45, 90, 135].map((angle, i) => (
          <motion.ellipse key={`l${i}`}
            cx="100" cy="100" rx="9" ry="80"
            fill="none" stroke={`rgba(116,198,157,${i === 0 ? 0.45 : 0.20})`}
            strokeWidth={i === 0 ? 0.9 : 0.6}
            transform={`rotate(${angle}, 100, 100)`}
            clipPath="url(#al-clip)"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 1.6, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
          />
        ))}
        {/* Scanning sweep */}
        <motion.g clipPath="url(#al-clip)" style={{ transformOrigin: '100px 100px' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}>
          <path d="M100 100 L180 100 A80 80 0 0 0 180 100 Z"
            fill="none" stroke="rgba(116,198,157,0)" />
          <line x1="100" y1="100" x2="180" y2="100"
            stroke="rgba(116,198,157,0.5)" strokeWidth="0.8" />
        </motion.g>
        {/* Outer ring */}
        <motion.circle cx="100" cy="100" r="80" fill="none"
          stroke="rgba(116,198,157,0.55)" strokeWidth="1"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 1.0, ease: 'easeOut' }} />
        {/* Data points */}
        {[
          { cx: 138, cy: 74,  r: 2.5, c: '#D4A373', p: true  },
          { cx: 64,  cy: 90,  r: 2,   c: '#74C69D', p: false },
          { cx: 110, cy: 130, r: 2,   c: '#74C69D', p: true  },
          { cx: 158, cy: 108, r: 1.5, c: '#52B788', p: false },
          { cx: 52,  cy: 118, r: 2,   c: '#D4A373', p: false },
        ].map((pt, i) => (
          <g key={i}>
            <motion.circle cx={pt.cx} cy={pt.cy} r={pt.r} fill={pt.c}
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.0 + i * 0.1, duration: 0.3, type: 'spring' }}
              style={{ transformOrigin: `${pt.cx}px ${pt.cy}px` }} />
            {pt.p && (
              <motion.circle cx={pt.cx} cy={pt.cy} r={pt.r}
                fill="none" stroke={pt.c} strokeWidth="0.8"
                animate={{ r: [pt.r, pt.r + 6], opacity: [0.8, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }} />
            )}
          </g>
        ))}
        {/* Crosshair */}
        <g opacity="0.35">
          <line x1="94" y1="100" x2="106" y2="100" stroke="#74C69D" strokeWidth="0.8" />
          <line x1="100" y1="94"  x2="100" y2="106" stroke="#74C69D" strokeWidth="0.8" />
          <circle cx="100" cy="100" r="3" fill="none" stroke="#74C69D" strokeWidth="0.6" />
        </g>
      </svg>
    </div>
  )
}

const PANEL_STATS = [
  { icon: Map,      value: '1,248', label: 'Mapas temáticos' },
  { icon: FileText, value: '3,400', label: 'Documentos técnicos' },
  { icon: Users,    value: '320',   label: 'Investigadores' },
]

// ── Shared Auth Layout ──
export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex">

      {/* ══ Left panel — decoration ══ */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[38%] flex-col relative overflow-hidden"
        style={{ background: 'radial-gradient(ellipse 80% 80% at 40% 40%, #0d2818 0%, #050e09 60%, #020805 100%)' }}>

        {/* Noise overlay */}
        <div className="noise-overlay absolute inset-0 opacity-50" />

        {/* Grid floor */}
        <div className="absolute inset-0 overflow-hidden" style={{ perspective: '500px' }}>
          <div className="absolute bottom-0 left-0 right-0 h-[45%]"
            style={{
              transform: 'rotateX(62deg)',
              transformOrigin: 'bottom center',
              backgroundImage: `
                linear-gradient(rgba(82,183,136,0.06) 1px, transparent 1px),
                linear-gradient(90deg, rgba(82,183,136,0.06) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
              maskImage: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)',
            }} />
        </div>

        {/* HUD corners */}
        {['top-5 left-5 border-t border-l', 'top-5 right-5 border-t border-r',
          'bottom-5 left-5 border-b border-l', 'bottom-5 right-5 border-b border-r'].map((cls) => (
          <div key={cls} className={`absolute w-6 h-6 border-primary-700/40 ${cls}`} />
        ))}

        {/* Scanline */}
        <motion.div className="absolute inset-x-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(116,198,157,0.35),transparent)' }}
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-10 py-10">
          {/* Brand */}
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            <span className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-primary-400/60">
              Portal Territorial · IIAP
            </span>
            <h1 className="font-display text-4xl font-bold text-white mt-1 tracking-[0.18em]">
              VIGIIAP
            </h1>
          </motion.div>

          {/* Globe */}
          <motion.div className="flex-1 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
            <div className="w-full max-w-xs">
              <GlobeDecor />
              <motion.p className="text-center text-white/40 text-xs mt-4 font-mono tracking-widest"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.5 }}>
                CHOCÓ BIOGEOGRÁFICO · COLOMBIA
              </motion.p>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div className="space-y-2"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            {PANEL_STATS.map(({ icon: Icon, value, label }, i) => (
              <motion.div key={label}
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.08 }}
                className="flex items-center gap-3 px-4 py-2.5 bg-white/5 border border-white/8 rounded-xl backdrop-blur-sm">
                <div className="w-7 h-7 bg-primary-800/60 rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-primary-300" />
                </div>
                <span className="text-sm font-bold text-white">{value}</span>
                <span className="text-xs text-white/45">{label}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Footer */}
          <p className="mt-6 text-[0.6rem] text-white/25 font-mono">
            © {new Date().getFullYear()} Instituto de Investigaciones Ambientales del Pacífico
          </p>
        </div>
      </div>

      {/* ══ Right panel — form ══ */}
      <div className="flex-1 flex flex-col bg-bg relative">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between px-6 py-5 lg:hidden border-b border-border bg-white">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">V</span>
            </div>
            <span className="font-display font-bold text-text tracking-wider">VIGIIAP</span>
          </div>
          <Link to="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-primary-800 no-underline transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Inicio
          </Link>
        </div>

        {/* Desktop back link */}
        <Link to="/"
          className="hidden lg:flex absolute top-6 right-6 items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-primary-800 no-underline transition-colors z-10">
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver al inicio
        </Link>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <motion.div className="w-full max-w-md"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
