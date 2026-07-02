/* Hallmark · macrostructure: Bento Grid · genre: institutional-editorial
 * tokens: design.md · stamp: 2026-05-25
 */
import { useState, useRef, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, useMotionTemplate, useReducedMotion as useFMReducedMotion } from 'framer-motion'
import {
  ArrowRight, Plus, SearchX, ArrowUpRight,
  ChevronRight, Lock,
} from 'lucide-react'
import { STATS, ALL_MODULES } from '@/lib/constants'
import { useAuth, ROLES } from '@/contexts/AuthContext'
import { useSearch } from '@/contexts/SearchContext'
import { matches } from '@/lib/search'
import NuevoAnalisisModal from '@/components/NuevoAnalisisModal'
const PlatformIntroSection = lazy(() => import('@/components/PlatformIntroSection'))

// ── Bento order para desktop ──────────────────────────────────────────────────
// [Mapas - wide] [Geovisor] [Herramientas]
const BENTO_SPANS = {
  mapas:       'lg:col-span-2',
  documentos:  'lg:col-span-1',
  geovisor:    'lg:col-span-1',
  herramientas:'lg:col-span-1',
  solicitudes: 'lg:col-span-2',
}

// ── Module Card 3D ─────────────────────────────────────────────────────────────
function ModuleCard({ mod, index, isVisitante, isPublico }) {
  const ref    = useRef<HTMLDivElement>(null)
  const blocked = !mod.publicAccess && (isVisitante || isPublico)
  const prefersReduced = useFMReducedMotion()

  const mouseX  = useMotionValue(0)
  const mouseY  = useMotionValue(0)
  const rawRX   = useTransform(mouseY, [-0.5, 0.5], prefersReduced ? [0, 0] : [6, -6])
  const rawRY   = useTransform(mouseX, [-0.5, 0.5], prefersReduced ? [0, 0] : [-6, 6])
  const rotateX = useSpring(rawRX, { stiffness: 300, damping: 30 })
  const rotateY = useSpring(rawRY, { stiffness: 300, damping: 30 })
  const glareX  = useTransform(mouseX, [-0.5, 0.5], ['0%', '100%'])
  const glareY  = useTransform(mouseY, [-0.5, 0.5], ['0%', '100%'])
  const glareOp = useMotionValue(0)
  const glareBg = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.18), transparent 65%)`

  const onMove = (e) => {
    if (blocked) return
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    mouseX.set((e.clientX - r.left) / r.width - 0.5)
    mouseY.set((e.clientY - r.top) / r.height - 0.5)
    glareOp.set(1)
  }
  const onLeave = () => { mouseX.set(0); mouseY.set(0); glareOp.set(0) }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 900, background: 'var(--card-bg)' }}
      className={`relative rounded-2xl border h-full overflow-hidden transition-shadow ${blocked ? 'border-border/30 opacity-55 cursor-not-allowed' : 'border-border/60 cursor-pointer group'}`}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: index * 0.06 }}
      whileHover={!blocked ? { y: -4, boxShadow: `0 24px 64px ${mod.glow}, 0 4px 20px rgba(0,0,0,0.07)` } : {}}
    >
      {/* Top accent */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${mod.gradient} ${blocked ? 'opacity-25' : ''}`} />
      {!blocked && (
        <motion.div style={{ background: glareBg, opacity: glareOp }}
          className="absolute inset-0 rounded-[inherit] pointer-events-none z-20" />
      )}
      {!blocked && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
          style={{ background: `radial-gradient(ellipse at 30% 0%, ${mod.glow} 0%, transparent 65%)` }} />
      )}
      <div className="relative p-6 flex flex-col h-full min-h-[200px]">
        <div className="flex items-start justify-between mb-5">
          <div
            className={`w-12 h-12 bg-gradient-to-br ${mod.gradient} rounded-xl flex items-center justify-center shadow transition-transform ${!blocked ? 'group-hover:scale-110 group-hover:-rotate-6' : 'grayscale opacity-50'}`}>
            <mod.icon className="w-5.5 h-5.5 text-white" style={{ width: '1.375rem', height: '1.375rem' }} />
          </div>
          {blocked ? (
            <span className="inline-flex items-center gap-1 text-[0.6rem] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-gray-100 text-gray-400">
              <Lock className="w-2.5 h-2.5" />Institucional
            </span>
          ) : (
            <span className={`text-[0.6rem] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${mod.chip}`}>{mod.tag}</span>
          )}
        </div>
        <h3 className="text-[0.95rem] font-bold text-text mb-2 leading-snug">{mod.title}</h3>
        <p className="text-sm text-text-muted leading-relaxed mb-5 flex-1">{mod.description}</p>
        {blocked ? (
          <Link to="/solicitar-acceso"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 no-underline hover:text-primary-900 transition-colors pointer-events-auto">
            <Lock className="w-3 h-3" />Solicitar acceso
          </Link>
        ) : (
          <Link to={mod.path}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider no-underline transition-colors"
            style={{ color: mod.ctaColor }}>
            {mod.action}<ArrowRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>
    </motion.div>
  )
}


// ── Stats — editorial ──────────────────────────────────────────────────────────
function StatsSection() {
  return (
    <div>
      {/* Heading editorial */}
      <div className="mb-7 flex items-end gap-4">
        <div>
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-text-muted block mb-1.5">
            Territorio de cobertura
          </span>
          <h2 className="font-display text-2xl font-bold text-text">Chocó Biogeográfico en cifras</h2>
        </div>
        <div className="flex-1 h-px bg-border mb-1.5 hidden sm:block" />
      </div>

      {/* Stats grid — glass sutil con acento verde */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 rounded-2xl overflow-hidden"
        style={{
          background: 'var(--stats-bg)',
          border: '1px solid var(--stats-border)',
        }}
      >
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
            className="px-7 py-9 cursor-default group relative"
            style={{
              borderRight: i < 3 ? '1px solid var(--stats-divider)' : 'none',
              borderBottom: i < 2 ? '1px solid var(--stats-divider)' : 'none',
            }}
          >
            {/* Hover glow */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,152,70,0.07) 0%, transparent 70%)' }}
            />
            <div
              className="tabular font-display font-bold leading-none mb-3 transition-colors duration-300 relative"
              style={{
                fontSize: 'clamp(2.2rem, 4vw, 3rem)',
                color: 'var(--stats-value)',
              }}
            >
              {stat.value}
            </div>
            <div className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-text-muted leading-relaxed relative">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ── Section heading ────────────────────────────────────────────────────────────
function SectionHeading({ id, eyebrow, title, action, actionTo, note }: { id?: string; eyebrow?: string; title?: string; action?: string; actionTo?: string; note?: string }) {
  return (
    <div className="mb-7 flex items-start gap-4">
      {/* Acento vertical verde */}
      <div
        className="shrink-0 mt-1 w-[3px] rounded-full"
        style={{
          height: '36px',
          background: 'linear-gradient(180deg, #009846, rgba(0,152,70,0.15))',
        }}
      />
      <div className="flex-1">
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-text-muted block mb-1">
          {eyebrow}
        </span>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h2 id={id} className="font-display text-2xl font-bold text-text">{title}</h2>
          <div className="flex items-center gap-3 mb-0.5">
            {note && (
              <span
                className="text-xs px-3 py-1 rounded-full"
                style={{ background: 'var(--note-bg)', border: '1px solid var(--note-border)', color: 'var(--note-text)' }}
              >
                {note}
              </span>
            )}
            {action && (
              <Link to={actionTo ?? '/'}
                className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-text-muted hover:text-primary-800 no-underline transition-colors">
                {action} <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Modules — bento ────────────────────────────────────────────────────────────
function ModulesSection({ isVisitante, isPublico }) {
  const { query } = useSearch()
  const filtered  = ALL_MODULES.filter((m) => matches([m.title, m.description, m.action], query))
  const restricted = filtered.filter((m) => !m.publicAccess).length
  if (!filtered.length) return null

  const showNote = (isVisitante || isPublico) && restricted > 0

  // Bento layout: ordered for visual balance
  const bentoOrder = ['mapas', 'geovisor', 'herramientas', 'documentos', 'solicitudes']
  const sortedModules = query.trim()
    ? filtered
    : bentoOrder.map((id) => ALL_MODULES.find((m) => m.id === id)).filter((m): m is typeof ALL_MODULES[number] => Boolean(m))

  return (
    <section aria-labelledby="modules-section-title">
      <SectionHeading
        id="modules-section-title"
        eyebrow="Plataforma"
        title="Módulos de VIGIA-IIAP"
        note={showNote ? `${restricted} módulos requieren cuenta de investigador` : undefined}
      />

      {/* Bento grid — desktop */}
      <div className={`hidden lg:grid grid-cols-4 gap-4 ${query.trim() ? '' : 'auto-rows-[260px]'}`}>
        {sortedModules.map((mod, i) => (
          <div key={mod.id} className={query.trim() ? '' : (BENTO_SPANS[mod.id] ?? '')}>
            <ModuleCard mod={mod} index={i} isVisitante={isVisitante} isPublico={isPublico} />
          </div>
        ))}
      </div>

      {/* Standard grid — mobile/tablet */}
      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((mod, i) => (
          <ModuleCard key={mod.id} mod={mod} index={i} isVisitante={isVisitante} isPublico={isPublico} />
        ))}
      </div>
    </section>
  )
}

// ── News card ──────────────────────────────────────────────────────────────────
// ── News section — editorial ───────────────────────────────────────────────────
// ── Welcome strip ──────────────────────────────────────────────────────────────
function WelcomeStrip({ user }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
  const firstName = user?.name?.split(' ')[0] || 'Usuario'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.12 }}
      className="flex items-center gap-4 rounded-2xl px-5 py-3.5"
      style={{
        background: 'var(--welcome-bg)',
        border: '1px solid var(--welcome-border)',
      }}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${user?.isVisitante ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 'bg-gradient-to-br from-primary-700 to-primary-950'}`}>
        <span className="text-white font-bold text-xs">{(firstName[0] || 'V').toUpperCase()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-text">{greeting}, {firstName}</p>
        <p className="text-xs text-text-muted truncate">
          {user?.isVisitante ? 'Modo visitante — acceso a información pública' : `${user?.role || 'Sesión activa'} · VIGIA-IIAP`}
        </p>
      </div>
      {!user?.isVisitante ? (
        <Link to="/herramientas"
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-800 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 active:scale-[0.97] no-underline transition-all duration-150">
          <Plus className="w-3.5 h-3.5" />Nuevo análisis
        </Link>
      ) : (
        <Link to="/solicitar-acceso"
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 active:scale-[0.97] no-underline transition-all duration-150">
          <ChevronRight className="w-3.5 h-3.5" />Solicitar acceso
        </Link>
      )}
    </motion.div>
  )
}

// ── Home ───────────────────────────────────────────────────────────────────────
export default function Home() {
  const { isAuthenticated, user, isVisitante } = useAuth()
  const isPublico = user?.role === ROLES.PUBLICO
  const { query } = useSearch()
  const [showModal, setShowModal] = useState(false)

  // Si hay error de API, no mostrar datos estáticos falsos como si fueran reales
    matches([a.title || a.titulo, a.excerpt || a.resumen, a.tag || a.categoria], query)
  )

  const noResults = query.trim()
    && !ALL_MODULES.some((m) => matches([m.title, m.description], query))

  return (
    <>
      <div className="space-y-10">

        {/* Presentación 3D scroll-driven */}
        {!query.trim() && <Suspense fallback={null}><PlatformIntroSection /></Suspense>}


        {/* Welcome strip — usuario autenticado */}
        {isAuthenticated && !query.trim() && <WelcomeStrip user={user} />}

        {/* Módulos */}
        <ModulesSection isVisitante={isVisitante} isPublico={isPublico} />

        {/* Sin resultados */}
        {noResults && (
          <div className="py-20 text-center text-text-muted">
            <SearchX aria-hidden="true" className="w-10 h-10 mx-auto mb-3 opacity-25" />
            <p className="text-sm">Sin resultados para <strong className="text-text">"{query}"</strong></p>
          </div>
        )}

        {/* Stats */}
        {!query.trim() && <StatsSection />}



      </div>

      {/* FAB nuevo análisis */}
      {isAuthenticated && !user?.isVisitante && (
        <motion.button
          onClick={() => setShowModal(true)}
          aria-label="Nuevo análisis"
          whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.93 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="fixed bottom-20 lg:bottom-6 right-6 z-30 flex items-center justify-center rounded-full text-white"
          style={{ width: '3.25rem', height: '3.25rem', background: 'linear-gradient(135deg, #F7AC42, #F08143)', boxShadow: '0 8px 32px rgba(247,172,66,0.45)', color: '#284E39' }}>
          <Plus className="w-5 h-5" aria-hidden="true" />
        </motion.button>
      )}

      <AnimatePresence>
        {showModal && <NuevoAnalisisModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </>
  )
}
