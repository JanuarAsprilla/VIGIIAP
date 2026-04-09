import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  motion, AnimatePresence,
  useMotionValue, useTransform, useSpring,
  useMotionTemplate, useInView, animate,
} from 'framer-motion'
import { ArrowRight, Crosshair, BookOpen, Plus, SearchX, ArrowUpRight } from 'lucide-react'
import { MODULES, STATS, NEWS } from '@/lib/constants'
import { useAuth } from '@/contexts/AuthContext'
import { useSearch } from '@/contexts/SearchContext'
import { matches } from '@/lib/search'
import NuevoAnalisisModal from '@/components/NuevoAnalisisModal'

// ── Fade up preset ──
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
})

// ── Animated GIS Radar (hero decoration) ──
function GISRadar() {
  return (
    <div className="relative w-full h-full flex items-center justify-center select-none pointer-events-none">
      {/* Concentric rings */}
      {[96, 72, 52, 34, 18].map((r, i) => (
        <motion.div
          key={r}
          className="absolute rounded-full border border-primary-300/20"
          style={{ width: `${r}%`, height: `${r}%` }}
          animate={{ scale: [1, 1.04, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3 + i * 0.8, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
        />
      ))}

      {/* Grid lines */}
      <div className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `
            linear-gradient(rgba(116,198,157,0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(116,198,157,0.4) 1px, transparent 1px)
          `,
          backgroundSize: '20% 20%',
        }}
      />

      {/* Radar sweep */}
      <motion.div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{ transformOrigin: 'center' }}
      >
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full"
          style={{ transformOrigin: '50% 100%' }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        >
          <div
            className="absolute bottom-0 left-1/2 w-1/2 h-1/2 origin-bottom-left"
            style={{
              background: 'conic-gradient(from -40deg, transparent, rgba(82, 183, 136, 0.18) 40deg, transparent 60deg)',
            }}
          />
        </motion.div>
      </motion.div>

      {/* Data points */}
      {[
        { x: '62%', y: '28%', delay: 0 },
        { x: '38%', y: '58%', delay: 1.2 },
        { x: '72%', y: '64%', delay: 2.4 },
        { x: '28%', y: '35%', delay: 0.7 },
        { x: '55%', y: '72%', delay: 1.8 },
      ].map((pt, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: pt.x, top: pt.y }}
          animate={{ scale: [0, 1.4, 1, 1.2, 1], opacity: [0, 1, 0.8, 1, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: pt.delay, repeatDelay: 3 }}
        >
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-primary-300" />
            <motion.div
              className="absolute inset-0 rounded-full bg-primary-300/40"
              animate={{ scale: [1, 3], opacity: [0.6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: pt.delay }}
            />
          </div>
        </motion.div>
      ))}

      {/* Center crosshair */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-6 h-6">
          <div className="absolute inset-0 border-2 border-primary-400/60 rounded-full" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-primary-400/50 -translate-y-1/2" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary-400/50 -translate-x-1/2" />
        </div>
      </div>
    </div>
  )
}

// ── Hero Banner ──
function HeroBanner() {
  return (
    <div className="relative rounded-2xl overflow-hidden min-h-[320px] flex items-stretch">
      {/* Dark gradient bg */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800" style={{ '--tw-gradient-from': '#020d09' }} />
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 80% 60% at 20% 50%, rgba(27,67,50,0.9) 0%, transparent 70%), radial-gradient(ellipse 60% 80% at 80% 30%, rgba(27,67,50,0.5) 0%, transparent 60%)',
      }} />

      {/* Noise texture */}
      <div className="absolute inset-0 noise-overlay opacity-60" />

      {/* Content grid */}
      <div className="relative z-10 flex flex-col lg:flex-row w-full">

        {/* Left — text */}
        <div className="flex-1 flex flex-col justify-center p-8 lg:p-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-2 mb-5"
          >
            <span className="w-6 h-px bg-primary-400/60" />
            <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-primary-300/80">
              Portal Territorial · IIAP
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="font-display font-bold text-white leading-[1.08] mb-5"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)' }}
          >
            Datos Territoriales<br />
            del{' '}
            <span className="text-gradient-gold">Chocó</span>
            <br />
            <span className="text-primary-300">Biogeográfico</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.48, duration: 0.6 }}
            className="text-white/55 text-sm leading-relaxed mb-8 max-w-sm"
          >
            Infraestructura de datos espaciales para la gestión, monitoreo y
            análisis del territorio más biodiverso de Colombia.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.58, duration: 0.5 }}
            className="flex flex-wrap gap-3"
          >
            <MagneticButton to="/geovisor" variant="primary">
              <Crosshair className="w-4 h-4" aria-hidden="true" />
              Abrir Geovisor
            </MagneticButton>
            <MagneticButton to="/guia-usuario" variant="ghost">
              <BookOpen className="w-4 h-4" aria-hidden="true" />
              Ver Tutoriales
            </MagneticButton>
          </motion.div>
        </div>

        {/* Right — Radar visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="hidden lg:flex w-[360px] items-center justify-center p-8 relative"
        >
          {/* Radar glow bg */}
          <div className="absolute inset-0 bg-gradient-to-l from-primary-800/40 to-transparent" />
          <div className="absolute inset-8 rounded-full bg-primary-800/20 blur-2xl" />
          <div className="relative w-full aspect-square max-w-[280px]">
            <GISRadar />
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// ── Magnetic Link Button ──
function MagneticButton({ to, variant, children }) {
  const ref = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 300, damping: 22 })
  const springY = useSpring(y, { stiffness: 300, damping: 22 })

  const handleMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect()
    x.set((e.clientX - rect.left - rect.width / 2) * 0.3)
    y.set((e.clientY - rect.top - rect.height / 2) * 0.3)
  }
  const handleMouseLeave = () => { x.set(0); y.set(0) }

  const base = 'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold no-underline transition-colors'
  const styles = {
    primary: `${base} btn-shimmer bg-primary-400 text-primary-950 hover:bg-primary-300`,
    ghost:   `${base} border border-white/20 text-white/80 hover:bg-white/10 hover:text-white backdrop-blur-sm`,
  }

  return (
    <motion.div ref={ref} style={{ x: springX, y: springY }} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <Link to={to} className={styles[variant]}>
        {children}
      </Link>
    </motion.div>
  )
}

// ── 3D Mouse-Tracking Card ──
function Card3D({ children, className }) {
  const ref = useRef(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const rawRotateX = useTransform(mouseY, [-0.5, 0.5], [7, -7])
  const rawRotateY = useTransform(mouseX, [-0.5, 0.5], [-7, 7])
  const rotateX = useSpring(rawRotateX, { stiffness: 280, damping: 28 })
  const rotateY = useSpring(rawRotateY, { stiffness: 280, damping: 28 })

  const glareX = useTransform(mouseX, [-0.5, 0.5], ['0%', '100%'])
  const glareY = useTransform(mouseY, [-0.5, 0.5], ['0%', '100%'])
  const glareOpacity = useMotionValue(0)
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.16), transparent 65%)`

  const handleMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect()
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5)
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5)
    glareOpacity.set(1)
  }
  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
    glareOpacity.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        transformPerspective: 900,
      }}
      className={`relative ${className}`}
    >
      {/* Glare layer */}
      <motion.div
        style={{ background: glareBackground, opacity: glareOpacity }}
        className="absolute inset-0 rounded-[inherit] pointer-events-none z-20"
      />
      {children}
    </motion.div>
  )
}

// ── Module Card ──
const CARD_ACCENTS = [
  { border: 'border-t-primary-800', iconFrom: 'from-primary-700', iconTo: 'to-primary-950' },
  { border: 'border-t-gold-400',    iconFrom: 'from-gold-400',    iconTo: 'to-gold-500' },
  { border: 'border-t-primary-500', iconFrom: 'from-primary-500', iconTo: 'to-primary-700' },
  { border: 'border-t-orange-500',  iconFrom: 'from-orange-400',  iconTo: 'to-orange-600' },
]

function ModuleCard({ module, index }) {
  const { title, description, icon: Icon, path, action } = module
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length]

  return (
    <motion.div {...fadeUp(0.12 + index * 0.08)}>
      <Card3D className="bg-white rounded-xl border border-border border-t-2 border-t-transparent cursor-pointer h-full">
        {/* Colored top border via gradient */}
        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${accent.iconFrom} ${accent.iconTo} rounded-t-xl`} />

        <div className="p-5 flex flex-col h-full">
          {/* Icon */}
          <motion.div
            whileHover={{ scale: 1.1, rotate: -6 }}
            transition={{ type: 'spring', stiffness: 420, damping: 16 }}
            className={`w-10 h-10 bg-gradient-to-br ${accent.iconFrom} ${accent.iconTo} rounded-xl flex items-center justify-center mb-4 shadow-sm shrink-0`}
            style={{ transform: 'translateZ(20px)' }}
          >
            <Icon className="w-5 h-5 text-white" aria-hidden="true" />
          </motion.div>

          <h3 className="text-base font-bold text-text mb-1.5" style={{ transform: 'translateZ(10px)' }}>
            {title}
          </h3>
          <p className="text-sm text-text-muted leading-relaxed mb-5 flex-1">{description}</p>

          <Link
            to={path}
            className="group inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary-800 no-underline hover:text-primary-600 transition-colors"
          >
            {action}
            <motion.span
              className="inline-flex"
              initial={{ x: 0 }}
              whileHover={{ x: 3 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </motion.span>
          </Link>
        </div>
      </Card3D>
    </motion.div>
  )
}

// ── Animated counter ──
function CounterValue({ raw }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const numeric = parseFloat(String(raw).replace(/[^0-9.]/g, ''))
  const suffix = String(raw).replace(/[0-9.]/g, '').trim()
  const isFloat = String(raw).includes('.')
  const motionVal = useMotionValue(0)
  const display = useTransform(motionVal, (v) =>
    isFloat ? v.toFixed(1) : Math.round(v).toLocaleString()
  )

  useEffect(() => {
    if (!inView) return
    const ctrl = animate(motionVal, numeric, { duration: 1.6, ease: [0.22, 1, 0.36, 1] })
    return ctrl.stop
  }, [inView, numeric, motionVal])

  return (
    <span ref={ref} className="font-display text-2xl font-bold text-gradient">
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  )
}

// ── Stats Section ──
function StatsSection() {
  return (
    <motion.div {...fadeUp(0.35)} className="flex flex-col lg:flex-row gap-8 items-start">
      <div className="lg:max-w-xs">
        <span className="inline-block text-[0.7rem] font-semibold uppercase tracking-widest text-text-muted mb-2">
          Datos de Impacto
        </span>
        <h2 className="font-display text-2xl font-bold text-text leading-tight mb-3">
          Cifras del Territorio Chocoano
        </h2>
        <p className="text-sm text-text-muted leading-relaxed">
          Un vistazo cuantitativo a la composición ambiental y administrativa
          de la región biogeográfica más biodiversa de Colombia.
        </p>
      </div>

      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
        {STATS.map((stat, i) => (
          <Card3D
            key={stat.label}
            className="bg-white border border-border rounded-xl p-4 text-center cursor-default"
          >
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                className="w-9 h-9 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl flex items-center justify-center mx-auto mb-2.5"
                style={{ transform: 'translateZ(12px)' }}
              >
                <stat.icon className="w-4.5 h-4.5 text-primary-700" aria-hidden="true" />
              </div>
              <CounterValue raw={stat.value} />
              <div className="text-[0.65rem] text-text-muted uppercase tracking-wider mt-1.5">
                {stat.label}
              </div>
            </motion.div>
          </Card3D>
        ))}
      </div>
    </motion.div>
  )
}

// ── News Card ──
function NewsCard({ article, featured }) {
  return (
    <Card3D className={`bg-white border border-border rounded-xl cursor-pointer ${featured ? 'lg:col-span-2' : ''}`}>
      <Link
        to={`/noticias/${article.slug || article.id}`}
        className="block p-5 no-underline group h-full"
      >
        <div style={{ transform: 'translateZ(8px)' }}>
          <div className="flex items-center justify-between mb-2.5">
            <span className="inline-block text-[0.65rem] font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
              {article.tag}
            </span>
            {featured && (
              <span className="text-[0.6rem] font-bold uppercase tracking-widest text-gold-500 bg-amber-50 px-2 py-0.5 rounded-full">
                Destacada
              </span>
            )}
          </div>
          <h3 className={`font-bold text-text leading-snug mb-2 group-hover:text-primary-800 transition-colors ${featured ? 'text-base' : 'text-sm'}`}>
            {article.title}
          </h3>
          <p className="text-sm text-text-muted leading-relaxed mb-4 line-clamp-2">{article.excerpt}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span>{article.time}</span>
              <span>·</span>
              <span>{article.author}</span>
            </div>
            <span className="text-primary-800 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>
    </Card3D>
  )
}

// ── Welcome strip (authenticated) ──
function WelcomeStrip({ user }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
  const firstName = user?.name?.split(' ')[0] || 'Investigador'
  return (
    <motion.div
      {...{ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.15 } }}
      className="flex items-center gap-4 bg-white border border-border rounded-xl px-5 py-4"
    >
      <div className="w-10 h-10 bg-gradient-to-br from-primary-700 to-primary-950 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
        <span className="text-white font-bold text-sm">{firstName[0]}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-text">{greeting}, {firstName}</p>
        <p className="text-xs text-text-muted truncate">{user?.role || 'Sesión activa'} · VIGIIAP</p>
      </div>
      <Link to="/herramientas"
        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-800 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 no-underline transition-colors">
        <Plus className="w-3.5 h-3.5" />
        Nuevo análisis
      </Link>
    </motion.div>
  )
}

// ── Home Page ──
export default function Home() {
  const { isAuthenticated, user } = useAuth()
  const { query } = useSearch()
  const [showModal, setShowModal] = useState(false)

  const filteredModules = MODULES.filter((m) =>
    matches([m.title, m.description, m.action], query)
  )
  const filteredNews = NEWS.filter((a) =>
    matches([a.title, a.excerpt, a.tag, a.author], query)
  )

  return (
    <>
      <div className="space-y-10">
        {/* Hero */}
        {!query.trim() && <HeroBanner />}

        {/* Welcome strip (authenticated, no search) */}
        {isAuthenticated && !query.trim() && <WelcomeStrip user={user} />}

        {/* Módulos */}
        {filteredModules.length > 0 && (
          <section>
            {!query.trim() && (
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-xl font-bold text-text">Módulos del Sistema</h2>
              </div>
            )}
            {query.trim() && (
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4">
                Módulos — "{query}"
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {filteredModules.map((mod, i) => (
                <ModuleCard key={mod.id} module={mod} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* Empty search state */}
        {query.trim() && filteredModules.length === 0 && filteredNews.length === 0 && (
          <motion.div {...fadeUp(0.1)} className="py-20 text-center text-text-muted">
            <SearchX className="w-10 h-10 mx-auto mb-3 opacity-25" aria-hidden="true" />
            <p className="text-sm">
              Sin resultados para{' '}
              <strong className="text-text">"{query}"</strong>
            </p>
          </motion.div>
        )}

        {/* Stats */}
        {!query.trim() && <StatsSection />}

        {/* Noticias */}
        {filteredNews.length > 0 && (
          <motion.section {...fadeUp(0.45)}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold text-text">
                {query.trim() ? `Noticias — "${query}"` : 'Noticias Territoriales'}
              </h2>
              {!query.trim() && (
                <Link
                  to="/noticias"
                  className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-text-muted hover:text-primary-800 no-underline transition-colors"
                >
                  Ver Todas
                  <ArrowRight className="w-3 h-3" aria-hidden="true" />
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredNews.map((article, i) => (
                <NewsCard key={article.id} article={article} featured={i === 0 && !query.trim()} />
              ))}
            </div>
          </motion.section>
        )}
      </div>

      {/* FAB */}
      {isAuthenticated && (
        <motion.button
          onClick={() => setShowModal(true)}
          aria-label="Nuevo análisis territorial"
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="btn-shimmer animate-pulse-glow fixed bottom-20 lg:bottom-6 right-6 w-13 h-13 bg-gradient-to-br from-primary-700 to-primary-950 text-white rounded-full shadow-elevated flex items-center justify-center z-30"
          style={{ width: '3.25rem', height: '3.25rem' }}
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
        </motion.button>
      )}

      <AnimatePresence>
        {showModal && <NuevoAnalisisModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </>
  )
}
