import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ── Deterministic data points on the globe ──
const GLOBE_POINTS = [
  { cx: 140, cy: 72,  r: 3,   color: '#D4A373', pulse: true  },
  { cx: 62,  cy: 88,  r: 2,   color: '#74C69D', pulse: false },
  { cx: 108, cy: 128, r: 2.5, color: '#74C69D', pulse: true  },
  { cx: 162, cy: 110, r: 1.5, color: '#52B788', pulse: false },
  { cx: 48,  cy: 118, r: 2,   color: '#D4A373', pulse: true  },
  { cx: 128, cy: 52,  r: 1.5, color: '#74C69D', pulse: false },
]

// ── Background star particles ──
const PARTICLES = [
  { x: 8,  y: 12, s: 1.5, d: 0    }, { x: 92, y: 8,  s: 1,   d: 0.3  },
  { x: 22, y: 38, s: 2,   d: 0.7  }, { x: 78, y: 25, s: 1.5, d: 1.1  },
  { x: 5,  y: 62, s: 1,   d: 0.5  }, { x: 95, y: 55, s: 2,   d: 0.9  },
  { x: 15, y: 82, s: 1.5, d: 1.4  }, { x: 88, y: 78, s: 1,   d: 0.2  },
  { x: 35, y: 92, s: 2,   d: 1.7  }, { x: 65, y: 88, s: 1.5, d: 0.6  },
  { x: 48, y: 6,  s: 1,   d: 1.2  }, { x: 72, y: 42, s: 2,   d: 0.4  },
  { x: 28, y: 68, s: 1.5, d: 1.9  }, { x: 82, y: 95, s: 1,   d: 0.8  },
  { x: 55, y: 72, s: 2,   d: 1.5  }, { x: 42, y: 18, s: 1,   d: 1.0  },
  { x: 18, y: 52, s: 1.5, d: 0.15 }, { x: 60, y: 32, s: 1,   d: 1.6  },
]

// ── HUD coordinate lines cycling ──
const HUD_LINES = [
  'LAT: 5°41\'13"N  LON: 76°39\'29"W',
  'EPSG:4326 → MAGNA-SIRGAS:3115',
  'SRS: WGS84 · CRS: Colombia Oeste',
  'IIAP · VIGIIAP v2.1 · BUILD 2026',
]

// ── Globe SVG ──
function Globe() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 18px rgba(82,183,136,0.35))' }}>
      <defs>
        {/* Sphere gradient */}
        <radialGradient id="sg" cx="38%" cy="32%" r="65%">
          <stop offset="0%"   stopColor="rgba(64,145,108,0.22)" />
          <stop offset="60%"  stopColor="rgba(27,67,50,0.12)"   />
          <stop offset="100%" stopColor="rgba(8,28,21,0.05)"    />
        </radialGradient>
        {/* Equator glow */}
        <radialGradient id="eg" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(116,198,157,0.15)" />
        </radialGradient>
        {/* Scanning sweep */}
        <radialGradient id="scan" cx="0%" cy="50%" r="100%">
          <stop offset="0%"  stopColor="rgba(116,198,157,0.25)" />
          <stop offset="80%" stopColor="rgba(116,198,157,0.05)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <clipPath id="globe-clip">
          <circle cx="100" cy="100" r="80" />
        </clipPath>
      </defs>

      {/* Atmosphere ring */}
      <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(116,198,157,0.08)" strokeWidth="16" />

      {/* Globe fill */}
      <circle cx="100" cy="100" r="80" fill="url(#sg)" />
      <circle cx="100" cy="100" r="80" fill="url(#eg)" />

      {/* ── Latitude lines ── */}
      {[
        { ry: 6,  cy: 100, op: 0.55 },
        { ry: 20, cy: 100, op: 0.30 },
        { ry: 38, cy: 100, op: 0.20 },
        { ry: 18, cy: 72,  op: 0.22 },
        { ry: 18, cy: 128, op: 0.22 },
        { ry: 10, cy: 52,  op: 0.15 },
        { ry: 10, cy: 148, op: 0.15 },
      ].map((l, i) => (
        <motion.ellipse
          key={i}
          cx="100" cy={l.cy}
          rx="80" ry={l.ry}
          fill="none"
          stroke={`rgba(116,198,157,${l.op})`}
          strokeWidth="0.7"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, delay: 0.1 + i * 0.07, ease: 'easeOut' }}
          clipPath="url(#globe-clip)"
        />
      ))}

      {/* ── Longitude lines ── */}
      {[0, 36, 72, 108, 144].map((angle, i) => (
        <motion.ellipse
          key={`lon-${i}`}
          cx="100" cy="100"
          rx="8" ry="80"
          fill="none"
          stroke={`rgba(116,198,157,${i === 0 ? 0.5 : 0.22})`}
          strokeWidth={i === 0 ? 0.8 : 0.6}
          transform={`rotate(${angle}, 100, 100)`}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, delay: 0.2 + i * 0.1, ease: 'easeOut' }}
          clipPath="url(#globe-clip)"
        />
      ))}

      {/* ── Scanning sweep ── */}
      <motion.g clipPath="url(#globe-clip)" style={{ transformOrigin: '100px 100px' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      >
        <path d="M100 100 L180 100 A80 80 0 0 0 180 100 Z" fill="url(#scan)" opacity="0.7" />
        <line x1="100" y1="100" x2="180" y2="100" stroke="rgba(116,198,157,0.6)" strokeWidth="0.8" />
      </motion.g>

      {/* Outer circle */}
      <motion.circle
        cx="100" cy="100" r="80"
        fill="none"
        stroke="rgba(116,198,157,0.6)"
        strokeWidth="1"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.0, ease: 'easeOut' }}
      />

      {/* ── Data points on globe ── */}
      {GLOBE_POINTS.map((pt, i) => (
        <g key={i}>
          <motion.circle
            cx={pt.cx} cy={pt.cy} r={pt.r}
            fill={pt.color}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8 + i * 0.12, duration: 0.3, type: 'spring' }}
            style={{ transformOrigin: `${pt.cx}px ${pt.cy}px` }}
          />
          {pt.pulse && (
            <motion.circle
              cx={pt.cx} cy={pt.cy}
              fill="none"
              stroke={pt.color}
              strokeWidth="0.8"
              initial={{ r: pt.r, opacity: 0.8 }}
              animate={{ r: [pt.r, pt.r + 6], opacity: [0.8, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.3 }}
            />
          )}
        </g>
      ))}

      {/* Center crosshair */}
      <g opacity="0.4">
        <line x1="94" y1="100" x2="106" y2="100" stroke="#74C69D" strokeWidth="0.8" />
        <line x1="100" y1="94"  x2="100" y2="106" stroke="#74C69D" strokeWidth="0.8" />
        <circle cx="100" cy="100" r="3" fill="none" stroke="#74C69D" strokeWidth="0.6" />
      </g>
    </svg>
  )
}

// ── Orbit ring with satellite ──
function OrbitRing() {
  return (
    <div className="absolute inset-0" style={{ perspective: '600px' }}>
      <div style={{ transform: 'rotateX(72deg)', width: '100%', height: '100%', position: 'relative' }}>
        {/* Ring */}
        <svg viewBox="0 0 300 300" className="absolute inset-0 w-full h-full">
          <circle cx="150" cy="150" r="135" fill="none"
            stroke="rgba(116,198,157,0.2)" strokeWidth="1"
            strokeDasharray="6 4" />
        </svg>
        {/* Satellite dot */}
        <motion.div
          className="absolute w-3 h-3 rounded-full bg-gold-400 shadow-[0_0_10px_rgba(212,163,115,0.9)]"
          style={{ top: '50%', left: '50%', marginTop: -6, marginLeft: -6, transformOrigin: '0 0' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
          // Offset to orbit edge
          initial={false}
        />
      </div>
    </div>
  )
}

// ── Main Preloader ──
export default function Preloader() {
  const [visible, setVisible] = useState(true)
  const [progress, setProgress] = useState(0)
  const [hudLine, setHudLine] = useState(0)

  useEffect(() => {
    // Progress counter
    let val = 0
    const step = setInterval(() => {
      val += Math.random() * 4 + 2
      if (val >= 100) { val = 100; clearInterval(step) }
      setProgress(Math.round(val))
    }, 60)

    // HUD lines cycle
    const hud = setInterval(() => setHudLine((p) => (p + 1) % HUD_LINES.length), 600)

    // Hide after 3.2s
    const hide = setTimeout(() => setVisible(false), 3200)

    return () => { clearInterval(step); clearInterval(hud); clearTimeout(hide) }
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{
            background: 'radial-gradient(ellipse 80% 80% at 50% 40%, #0d2818 0%, #050e09 55%, #020805 100%)',
          }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* ── Noise texture ── */}
          <div className="noise-overlay absolute inset-0 opacity-40" />

          {/* ── Grid floor ── */}
          <div className="absolute inset-0 overflow-hidden" style={{ perspective: '600px' }}>
            <div
              className="absolute bottom-0 left-0 right-0 h-[55%]"
              style={{
                transform: 'rotateX(65deg)',
                transformOrigin: 'bottom center',
                backgroundImage: `
                  linear-gradient(rgba(82,183,136,0.07) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(82,183,136,0.07) 1px, transparent 1px)
                `,
                backgroundSize: '60px 60px',
                maskImage: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
              }}
            />
          </div>

          {/* ── Background particles ── */}
          {PARTICLES.map((p, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-primary-400"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s }}
              animate={{ opacity: [0.1, 0.6, 0.1], y: [0, -8, 0] }}
              transition={{ duration: p.d + 2.5, repeat: Infinity, delay: p.d, ease: 'easeInOut' }}
            />
          ))}

          {/* ── Corner HUD decorations ── */}
          {[
            'top-5 left-5 border-t border-l',
            'top-5 right-5 border-t border-r',
            'bottom-5 left-5 border-b border-l',
            'bottom-5 right-5 border-b border-r',
          ].map((cls) => (
            <motion.div
              key={cls}
              className={`absolute w-8 h-8 border-primary-700/50 ${cls}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            />
          ))}

          {/* ── Main content ── */}
          <div className="relative z-10 flex flex-col items-center text-center px-6">

            {/* Globe 3D container */}
            <motion.div
              className="relative mb-6"
              style={{ width: 220, height: 220 }}
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Glow behind globe */}
              <div className="absolute inset-8 rounded-full bg-primary-800/20 blur-3xl" />

              {/* Globe rotates slowly */}
              <motion.div
                className="w-full h-full"
                animate={{ rotateY: 360 }}
                transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <Globe />
              </motion.div>

              {/* Orbit ring — positioned outside */}
              <div className="absolute -inset-6">
                <OrbitRing />
              </div>
            </motion.div>

            {/* Brand */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Tag */}
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.35em] text-primary-400/70 mb-3">
                Sistema de Información Territorial
              </p>

              {/* VIGIIAP */}
              <h1
                className="font-display font-bold text-white mb-2"
                style={{ fontSize: 'clamp(2.8rem, 8vw, 4.5rem)', letterSpacing: '0.22em', lineHeight: 1 }}
              >
                {['V','I','G','I','I','A','P'].map((l, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + i * 0.06, duration: 0.35, ease: 'easeOut' }}
                    style={{ display: 'inline-block' }}
                  >
                    {l}
                  </motion.span>
                ))}
              </h1>

              {/* Subtitle */}
              <motion.p
                className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-primary-300/50 mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.25, duration: 0.5 }}
              >
                IIAP · Chocó Biogeográfico · Colombia
              </motion.p>
            </motion.div>

            {/* Progress bar */}
            <motion.div
              className="mt-8 w-60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.4 }}
            >
              {/* Bar track */}
              <div className="h-px bg-primary-900/60 rounded-full overflow-hidden mb-2">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #2D6A4F, #52B788, #74C69D)',
                    boxShadow: '0 0 12px rgba(116,198,157,0.5)',
                    transition: 'width 0.08s linear',
                  }}
                />
              </div>

              {/* HUD line + percent */}
              <div className="flex items-center justify-between">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={hudLine}
                    className="text-[0.55rem] font-mono text-primary-400/50 tracking-widest text-left truncate max-w-[180px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    {HUD_LINES[hudLine]}
                  </motion.span>
                </AnimatePresence>
                <span className="text-[0.6rem] font-mono font-bold text-primary-400/70 tabular-nums ml-2 shrink-0">
                  {progress}%
                </span>
              </div>
            </motion.div>
          </div>

          {/* ── Scan line sweep across full screen ── */}
          <motion.div
            className="absolute inset-x-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(116,198,157,0.4), transparent)' }}
            animate={{ top: ['0%', '100%'] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
