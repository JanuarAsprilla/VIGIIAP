import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  motion, AnimatePresence,
  useMotionValue, useTransform, useSpring,
  useMotionTemplate, useInView, animate,
} from 'framer-motion'
import {
  ArrowRight, Map, FileText, Globe, Wrench,
  ClipboardList, Newspaper, Plus, SearchX, ArrowUpRight,
  LayoutGrid, Users, Building2, Shield, ChevronRight,
  BookOpen, Leaf, Droplets, TreePine,
} from 'lucide-react'
import { MODULES, STATS, NEWS } from '@/lib/constants'
import { useAuth } from '@/contexts/AuthContext'
import { useSearch } from '@/contexts/SearchContext'
import { matches } from '@/lib/search'
import NuevoAnalisisModal from '@/components/NuevoAnalisisModal'
import { useNoticiasList } from '@/hooks/useNoticias'

// ── Fade up preset ──
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
})

// ── GIS Radar decoration ──
function GISRadar() {
  return (
    <div className="relative w-full h-full flex items-center justify-center select-none pointer-events-none">
      {[96, 72, 52, 34, 18].map((r, i) => (
        <motion.div
          key={r}
          className="absolute rounded-full border border-primary-300/20"
          style={{ width: `${r}%`, height: `${r}%` }}
          animate={{ scale: [1, 1.04, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3 + i * 0.8, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
        />
      ))}
      <div className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `
            linear-gradient(rgba(116,198,157,0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(116,198,157,0.4) 1px, transparent 1px)
          `,
          backgroundSize: '20% 20%',
        }}
      />
      <motion.div className="absolute inset-0 rounded-full overflow-hidden" style={{ transformOrigin: 'center' }}>
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full"
          style={{ transformOrigin: '50% 100%' }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute bottom-0 left-1/2 w-1/2 h-1/2 origin-bottom-left"
            style={{ background: 'conic-gradient(from -40deg, transparent, rgba(82, 183, 136, 0.18) 40deg, transparent 60deg)' }}
          />
        </motion.div>
      </motion.div>
      {[
        { x: '62%', y: '28%', delay: 0 },
        { x: '38%', y: '58%', delay: 1.2 },
        { x: '72%', y: '64%', delay: 2.4 },
        { x: '28%', y: '35%', delay: 0.7 },
        { x: '55%', y: '72%', delay: 1.8 },
      ].map((pt, i) => (
        <motion.div key={i} className="absolute" style={{ left: pt.x, top: pt.y }}
          animate={{ scale: [0, 1.4, 1, 1.2, 1], opacity: [0, 1, 0.8, 1, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: pt.delay, repeatDelay: 3 }}>
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-primary-300" />
            <motion.div className="absolute inset-0 rounded-full bg-primary-300/40"
              animate={{ scale: [1, 3], opacity: [0.6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: pt.delay }} />
          </div>
        </motion.div>
      ))}
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

// ── Magnetic Button ──
function MagneticButton({ to, onClick, variant, children }) {
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

  const base = 'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold no-underline transition-colors cursor-pointer'
  const styles = {
    primary: `${base} btn-shimmer bg-primary-400 text-primary-950 hover:bg-primary-300`,
    ghost:   `${base} border border-white/20 text-white/80 hover:bg-white/10 hover:text-white backdrop-blur-sm`,
    gold:    `${base} bg-amber-400 text-amber-950 hover:bg-amber-300`,
  }

  const inner = <span className={styles[variant]}>{children}</span>

  return (
    <motion.div ref={ref} style={{ x: springX, y: springY }} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      {to ? <Link to={to} className={styles[variant]}>{children}</Link>
           : <button onClick={onClick} className={styles[variant]}>{children}</button>}
    </motion.div>
  )
}

// ── Hero Banner — carta de presentación de VIGIIAP ──
function HeroBanner({ onAccederVisitante }) {
  const { isAuthenticated, isVisitante } = useAuth()
  return (
    <div className="relative rounded-2xl overflow-hidden min-h-[380px] flex items-stretch">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800"
        style={{ '--tw-gradient-from': '#020d09' }} />
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 80% 60% at 20% 50%, rgba(27,67,50,0.9) 0%, transparent 70%), radial-gradient(ellipse 60% 80% at 80% 30%, rgba(27,67,50,0.5) 0%, transparent 60%)',
      }} />
      <div className="absolute inset-0 noise-overlay opacity-60" />

      <div className="relative z-10 flex flex-col lg:flex-row w-full">
        {/* Left — texto principal */}
        <div className="flex-1 flex flex-col justify-center p-8 lg:p-12">

          {/* Eyebrow */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-2 mb-4">
            <span className="w-6 h-px bg-primary-400/60" />
            <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-primary-300/80">
              Instituto de Investigaciones Ambientales del Pacífico
            </span>
          </motion.div>

          {/* Título principal */}
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="font-display font-bold text-white leading-[1.08] mb-4"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)' }}>
            <span className="text-gradient-gold">VIGIIAP</span>
            <br />
            <span className="text-primary-200 text-[0.55em] font-semibold tracking-wide leading-[1.4] block mt-1">
              Visor y Gestor de Información<br />Ambiental del Pacífico
            </span>
          </motion.h1>

          {/* Descripción */}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="text-white/60 text-sm leading-relaxed mb-3 max-w-sm">
            Plataforma institucional para la consulta, gestión y análisis de información
            ambiental y territorial del <strong className="text-white/80">Chocó Biogeográfico</strong> colombiano.
          </motion.p>

          {/* Chips de alcance */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-wrap gap-2 mb-7">
            {[
              { icon: Leaf,     label: 'Biodiversidad' },
              { icon: Droplets, label: 'Hidrografía' },
              { icon: TreePine, label: 'Ecosistemas' },
              { icon: Map,      label: 'Cartografía' },
            ].map(({ icon: Icon, label }) => (
              <span key={label}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-800/50 border border-primary-600/30 text-[0.65rem] font-semibold text-primary-300 uppercase tracking-wider">
                <Icon className="w-3 h-3" />
                {label}
              </span>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.58, duration: 0.5 }}
            className="flex flex-wrap gap-3">
            <MagneticButton to="/geovisor" variant="primary">
              <Globe className="w-4 h-4" />
              Explorar Geovisor
            </MagneticButton>
            {!isAuthenticated && (
              <MagneticButton onClick={onAccederVisitante} variant="ghost">
                <ArrowRight className="w-4 h-4" />
                Acceder como visitante
              </MagneticButton>
            )}
            {isAuthenticated && !isVisitante && (
              <MagneticButton to="/mapas" variant="ghost">
                <Map className="w-4 h-4" />
                Ver Catálogo
              </MagneticButton>
            )}
          </motion.div>
        </div>

        {/* Right — Radar GIS */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="hidden lg:flex w-[360px] items-center justify-center p-8 relative">
          <div className="absolute inset-0 bg-gradient-to-l from-primary-800/40 to-transparent" />
          <div className="absolute inset-8 rounded-full bg-primary-800/20 blur-2xl" />
          {/* Etiqueta VIGIIAP encima del radar */}
          <div className="absolute top-8 left-0 right-0 flex flex-col items-center">
            <span className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-primary-400/70">Sistema Activo</span>
          </div>
          <div className="relative w-full aspect-square max-w-[280px]">
            <GISRadar />
          </div>
        </motion.div>
      </div>
    </div>
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
  const handleMouseLeave = () => { mouseX.set(0); mouseY.set(0); glareOpacity.set(0) }

  return (
    <motion.div ref={ref} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', transformPerspective: 900 }}
      className={`relative ${className}`}>
      <motion.div style={{ background: glareBackground, opacity: glareOpacity }}
        className="absolute inset-0 rounded-[inherit] pointer-events-none z-20" />
      {children}
    </motion.div>
  )
}

// ── Módulos — configuración extendida ──
const ALL_MODULES = [
  {
    id: 'mapas',
    title: 'Catálogo de Mapas',
    description: 'Consulta y descarga mapas temáticos de biodiversidad, suelos, hidrografía y cobertura del Chocó Biogeográfico.',
    icon: Map,
    path: '/mapas',
    action: 'Explorar mapas',
    accent: { bg: 'from-primary-700 to-primary-950', border: 'from-primary-700 to-primary-900', chip: 'bg-primary-50 text-primary-800' },
    tag: 'Cartografía',
  },
  {
    id: 'documentos',
    title: 'Biblioteca Documental',
    description: 'Informes técnicos, investigaciones, protocolos ambientales y documentos institucionales del IIAP.',
    icon: FileText,
    path: '/documentos',
    action: 'Consultar biblioteca',
    accent: { bg: 'from-gold-400 to-gold-600', border: 'from-gold-400 to-gold-500', chip: 'bg-amber-50 text-amber-800' },
    tag: 'Documentos',
  },
  {
    id: 'geovisor',
    title: 'Geovisor Interactivo',
    description: 'Visualiza y analiza capas geoespaciales en tiempo real sobre el territorio del Pacífico colombiano.',
    icon: Globe,
    path: '/geovisor',
    action: 'Abrir geovisor',
    accent: { bg: 'from-primary-500 to-primary-700', border: 'from-primary-500 to-primary-700', chip: 'bg-primary-50 text-primary-700' },
    tag: 'SIG',
  },
  {
    id: 'herramientas',
    title: 'Herramientas SIG',
    description: 'Calculadoras de área, convertidores de coordenadas y motores de consulta espacial avanzada.',
    icon: Wrench,
    path: '/herramientas',
    action: 'Usar herramientas',
    accent: { bg: 'from-orange-400 to-orange-600', border: 'from-orange-400 to-orange-500', chip: 'bg-orange-50 text-orange-800' },
    tag: 'Análisis',
  },
  {
    id: 'noticias',
    title: 'Noticias y Eventos',
    description: 'Últimas publicaciones, investigaciones destacadas y eventos del Instituto Ambiental del Pacífico.',
    icon: Newspaper,
    path: '/noticias',
    action: 'Ver noticias',
    accent: { bg: 'from-emerald-500 to-emerald-700', border: 'from-emerald-500 to-emerald-600', chip: 'bg-emerald-50 text-emerald-800' },
    tag: 'Información',
  },
  {
    id: 'solicitudes',
    title: 'Solicitudes',
    description: 'Gestiona y realiza seguimiento de solicitudes de acceso a datos, colaboración e información especializada.',
    icon: ClipboardList,
    path: '/solicitudes',
    action: 'Mis solicitudes',
    accent: { bg: 'from-violet-500 to-violet-700', border: 'from-violet-500 to-violet-600', chip: 'bg-violet-50 text-violet-800' },
    tag: 'Gestión',
  },
]

function ModuleCard({ mod, index }) {
  return (
    <motion.div {...fadeUp(0.08 + index * 0.06)}>
      <Card3D className="bg-white rounded-xl border border-border h-full cursor-pointer group">
        {/* Top accent bar */}
        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${mod.accent.border} rounded-t-xl`} />

        <div className="p-6 flex flex-col h-full">
          {/* Icon + tag */}
          <div className="flex items-start justify-between mb-4">
            <motion.div
              whileHover={{ scale: 1.12, rotate: -6 }}
              transition={{ type: 'spring', stiffness: 420, damping: 16 }}
              className={`w-12 h-12 bg-gradient-to-br ${mod.accent.bg} rounded-xl flex items-center justify-center shadow-sm shrink-0`}
              style={{ transform: 'translateZ(20px)' }}>
              <mod.icon className="w-6 h-6 text-white" />
            </motion.div>
            <span className={`text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${mod.accent.chip}`}>
              {mod.tag}
            </span>
          </div>

          <h3 className="text-[0.95rem] font-bold text-text mb-2" style={{ transform: 'translateZ(10px)' }}>
            {mod.title}
          </h3>
          <p className="text-sm text-text-muted leading-relaxed mb-5 flex-1">{mod.description}</p>

          <Link to={mod.path}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary-800 no-underline hover:text-primary-600 transition-colors group-hover:gap-2.5">
            {mod.action}
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
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
      <div className="lg:max-w-xs shrink-0">
        <span className="inline-block text-[0.7rem] font-semibold uppercase tracking-widest text-text-muted mb-2">
          Territorio de cobertura
        </span>
        <h2 className="font-display text-2xl font-bold text-text leading-tight mb-3">
          Chocó Biogeográfico<br />en cifras
        </h2>
        <p className="text-sm text-text-muted leading-relaxed">
          La región más biodiversa de Colombia, área de acción
          del IIAP y territorio que cubre VIGIIAP.
        </p>
      </div>
      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
        {STATS.map((stat, i) => (
          <Card3D key={stat.label}
            className="bg-white border border-border rounded-xl p-4 text-center cursor-default">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}>
              <div className="w-9 h-9 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl flex items-center justify-center mx-auto mb-2.5"
                style={{ transform: 'translateZ(12px)' }}>
                <stat.icon className="w-4.5 h-4.5 text-primary-700" />
              </div>
              <CounterValue raw={stat.value} />
              <div className="text-[0.65rem] text-text-muted uppercase tracking-wider mt-1.5">{stat.label}</div>
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
      <Link to={`/noticias/${article.slug || article.id}`}
        className="block p-5 no-underline group h-full">
        <div style={{ transform: 'translateZ(8px)' }}>
          <div className="flex items-center justify-between mb-2.5">
            <span className="inline-block text-[0.65rem] font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
              {article.tag || article.categoria}
            </span>
            {featured && (
              <span className="text-[0.6rem] font-bold uppercase tracking-widest text-gold-500 bg-amber-50 px-2 py-0.5 rounded-full">
                Destacada
              </span>
            )}
          </div>
          <h3 className={`font-bold text-text leading-snug mb-2 group-hover:text-primary-800 transition-colors ${featured ? 'text-base' : 'text-sm'}`}>
            {article.title || article.titulo}
          </h3>
          <p className="text-sm text-text-muted leading-relaxed mb-4 line-clamp-2">
            {article.excerpt || article.resumen}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">{article.time || article.date}</span>
            <span className="text-primary-800 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowUpRight className="w-4 h-4" />
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
  const firstName = user?.name?.split(' ')[0] || 'Usuario'
  const isVisitante = user?.isVisitante

  return (
    <motion.div {...{ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.15 } }}
      className="flex items-center gap-4 bg-white border border-border rounded-xl px-5 py-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${isVisitante ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 'bg-gradient-to-br from-primary-700 to-primary-950'}`}>
        <span className="text-white font-bold text-sm">{(firstName[0] || 'V').toUpperCase()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-text">{greeting}, {firstName}</p>
        <p className="text-xs text-text-muted truncate">
          {isVisitante ? 'Modo visitante — acceso a información pública' : `${user?.role || 'Sesión activa'} · VIGIIAP`}
        </p>
      </div>
      {!isVisitante && (
        <Link to="/herramientas"
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-800 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 no-underline transition-colors">
          <Plus className="w-3.5 h-3.5" />
          Nuevo análisis
        </Link>
      )}
      {isVisitante && (
        <Link to="/solicitar-acceso"
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 no-underline transition-colors">
          <ChevronRight className="w-3.5 h-3.5" />
          Solicitar acceso
        </Link>
      )}
    </motion.div>
  )
}

// ── Home Page ──
export default function Home() {
  const { isAuthenticated, user, loginVisitante, loading } = useAuth()
  const navigate = useNavigate()
  const { query } = useSearch()
  const [showModal, setShowModal] = useState(false)

  // Noticias desde la API — si está vacía cae en static NEWS
  const { data: noticiasData } = useNoticiasList({ limit: 4 })
  const apiNews = noticiasData?.data ?? []
  const displayNews = apiNews.length > 0 ? apiNews : NEWS

  const filteredModules = ALL_MODULES.filter((m) =>
    matches([m.title, m.description, m.action], query)
  )
  const filteredNews = displayNews.filter((a) =>
    matches([a.title || a.titulo, a.excerpt || a.resumen, a.tag || a.categoria], query)
  )

  const handleAccederVisitante = async () => {
    try {
      await loginVisitante()
      navigate('/')
    } catch { /* silent */ }
  }

  return (
    <>
      <div className="space-y-10">

        {/* Hero */}
        {!query.trim() && <HeroBanner onAccederVisitante={handleAccederVisitante} />}

        {/* Welcome strip */}
        {isAuthenticated && !query.trim() && <WelcomeStrip user={user} />}

        {/* Módulos */}
        {filteredModules.length > 0 && (
          <section>
            {!query.trim() && (
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-[0.7rem] font-semibold uppercase tracking-widest text-text-muted block mb-1">
                    Plataforma
                  </span>
                  <h2 className="font-display text-xl font-bold text-text">Módulos de VIGIIAP</h2>
                </div>
              </div>
            )}
            {query.trim() && (
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4">
                Módulos — "{query}"
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredModules.map((mod, i) => (
                <ModuleCard key={mod.id} mod={mod} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* Empty search */}
        {query.trim() && filteredModules.length === 0 && filteredNews.length === 0 && (
          <motion.div {...fadeUp(0.1)} className="py-20 text-center text-text-muted">
            <SearchX className="w-10 h-10 mx-auto mb-3 opacity-25" />
            <p className="text-sm">
              Sin resultados para <strong className="text-text">"{query}"</strong>
            </p>
          </motion.div>
        )}

        {/* Stats */}
        {!query.trim() && <StatsSection />}

        {/* Noticias */}
        {filteredNews.length > 0 && (
          <motion.section {...fadeUp(0.45)}>
            <div className="flex items-center justify-between mb-5">
              <div>
                {!query.trim() && (
                  <span className="text-[0.7rem] font-semibold uppercase tracking-widest text-text-muted block mb-1">
                    Actualidad
                  </span>
                )}
                <h2 className="font-display text-xl font-bold text-text">
                  {query.trim() ? `Noticias — "${query}"` : 'Noticias del IIAP'}
                </h2>
              </div>
              {!query.trim() && (
                <Link to="/noticias"
                  className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-text-muted hover:text-primary-800 no-underline transition-colors">
                  Ver todas
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredNews.slice(0, 4).map((article, i) => (
                <NewsCard key={article.id} article={article} featured={i === 0 && !query.trim()} />
              ))}
            </div>
          </motion.section>
        )}

      </div>

      {/* FAB — solo usuarios con sesión real */}
      {isAuthenticated && !user?.isVisitante && (
        <motion.button onClick={() => setShowModal(true)}
          aria-label="Nuevo análisis territorial"
          whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="btn-shimmer animate-pulse-glow fixed bottom-20 lg:bottom-6 right-6 w-13 h-13 bg-gradient-to-br from-primary-700 to-primary-950 text-white rounded-full shadow-elevated flex items-center justify-center z-30"
          style={{ width: '3.25rem', height: '3.25rem' }}>
          <Plus className="w-5 h-5" />
        </motion.button>
      )}

      <AnimatePresence>
        {showModal && <NuevoAnalisisModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </>
  )
}
