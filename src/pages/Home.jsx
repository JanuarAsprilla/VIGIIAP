import { useState, useRef, useEffect, lazy, Suspense } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, useMotionTemplate } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  ArrowRight, Map, FileText, Globe, Wrench,
  ClipboardList, Newspaper, Plus, SearchX, ArrowUpRight,
  ChevronRight, Lock,
} from 'lucide-react'
import { STATS, NEWS } from '@/lib/constants'
import { useAuth } from '@/contexts/AuthContext'
import { useSearch } from '@/contexts/SearchContext'
import { matches } from '@/lib/search'
import NuevoAnalisisModal from '@/components/NuevoAnalisisModal'
import { useNoticiasList } from '@/hooks/useNoticias'

gsap.registerPlugin(ScrollTrigger)

// Globe cargado lazy — no bloquea el render inicial
const GlobeScene = lazy(() => import('@/components/GlobeScene'))

// ── Módulos — publicAccess: true = visible para visitantes ──
const ALL_MODULES = [
  {
    id: 'mapas', title: 'Catálogo de Mapas',
    description: 'Consulta y descarga mapas temáticos de biodiversidad, suelos, hidrografía y cobertura vegetal del Chocó Biogeográfico producidos por el IIAP.',
    icon: Map, path: '/mapas', action: 'Explorar mapas', tag: 'Cartografía',
    gradient: 'from-[#1B4332] to-[#2D6A4F]', chip: 'bg-primary-50 text-primary-800',
    glow: 'rgba(27,67,50,0.25)', publicAccess: true,
  },
  {
    id: 'documentos', title: 'Biblioteca Documental',
    description: 'Informes técnicos, investigaciones científicas, protocolos ambientales y documentos institucionales del IIAP disponibles para consulta.',
    icon: FileText, path: '/documentos', action: 'Consultar biblioteca', tag: 'Documentos',
    gradient: 'from-[#B7791F] to-[#D4A373]', chip: 'bg-amber-50 text-amber-800',
    glow: 'rgba(212,163,115,0.25)', publicAccess: true,
  },
  {
    id: 'noticias', title: 'Noticias y Eventos',
    description: 'Últimas publicaciones, investigaciones destacadas, eventos y comunicados del Instituto de Investigaciones Ambientales del Pacífico.',
    icon: Newspaper, path: '/noticias', action: 'Ver noticias', tag: 'Actualidad',
    gradient: 'from-[#065f46] to-[#059669]', chip: 'bg-emerald-50 text-emerald-800',
    glow: 'rgba(5,150,105,0.2)', publicAccess: true,
  },
  {
    id: 'geovisor', title: 'Geovisor Interactivo',
    description: 'Herramienta SIG en línea para la visualización y análisis de capas geoespaciales sobre el territorio del Pacífico colombiano. Requiere cuenta institucional.',
    icon: Globe, path: '/geovisor', action: 'Abrir geovisor', tag: 'SIG',
    gradient: 'from-[#1d4ed8] to-[#3b82f6]', chip: 'bg-blue-50 text-blue-800',
    glow: 'rgba(59,130,246,0.2)', publicAccess: false,
  },
  {
    id: 'herramientas', title: 'Herramientas SIG',
    description: 'Calculadoras de área, convertidores de coordenadas, motores de análisis espacial y herramientas de procesamiento de datos geográficos. Uso interno IIAP.',
    icon: Wrench, path: '/herramientas', action: 'Usar herramientas', tag: 'Análisis',
    gradient: 'from-[#c2410c] to-[#f97316]', chip: 'bg-orange-50 text-orange-800',
    glow: 'rgba(249,115,22,0.2)', publicAccess: false,
  },
  {
    id: 'solicitudes', title: 'Solicitudes de Acceso',
    description: 'Realiza y gestiona solicitudes de acceso a datos, información especializada o colaboración con el IIAP. Disponible para usuarios registrados.',
    icon: ClipboardList, path: '/solicitudes', action: 'Gestionar solicitudes', tag: 'Gestión',
    gradient: 'from-[#5b21b6] to-[#7c3aed]', chip: 'bg-violet-50 text-violet-800',
    glow: 'rgba(124,58,237,0.2)', publicAccess: false,
  },
]

// ── Card 3D con glow y control de acceso ──
function ModuleCard({ mod, index, isVisitante, isPublico }) {
  const ref     = useRef()
  // Visitantes y usuarios Público no pueden acceder a herramientas SIG avanzadas
  const blocked = !mod.publicAccess && (isVisitante || isPublico)

  const mouseX  = useMotionValue(0)
  const mouseY  = useMotionValue(0)
  const rawRX   = useTransform(mouseY, [-0.5, 0.5], [8, -8])
  const rawRY   = useTransform(mouseX, [-0.5, 0.5], [-8, 8])
  const rotateX = useSpring(rawRX, { stiffness: 300, damping: 30 })
  const rotateY = useSpring(rawRY, { stiffness: 300, damping: 30 })
  const glareX  = useTransform(mouseX, [-0.5, 0.5], ['0%', '100%'])
  const glareY  = useTransform(mouseY, [-0.5, 0.5], ['0%', '100%'])
  const glareOp = useMotionValue(0)
  const glareBg = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.18), transparent 65%)`

  const onMove = (e) => {
    if (blocked) return
    const r = ref.current.getBoundingClientRect()
    mouseX.set((e.clientX - r.left) / r.width - 0.5)
    mouseY.set((e.clientY - r.top) / r.height - 0.5)
    glareOp.set(1)
  }
  const onLeave = () => { mouseX.set(0); mouseY.set(0); glareOp.set(0) }

  const CardContent = (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 900 }}
      className={`module-card relative bg-white rounded-2xl border h-full overflow-hidden transition-all ${blocked ? 'border-border/30 opacity-60 cursor-not-allowed' : 'border-border/60 cursor-pointer group'}`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: index * 0.08 }}
      whileHover={!blocked ? { y: -4, boxShadow: `0 20px 60px ${mod.glow}, 0 4px 20px rgba(0,0,0,0.08)` } : {}}
    >
      {/* Top bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${mod.gradient} rounded-t-2xl ${blocked ? 'opacity-30' : ''}`} />
      {/* Glare */}
      {!blocked && (
        <motion.div style={{ background: glareBg, opacity: glareOp }}
          className="absolute inset-0 rounded-[inherit] pointer-events-none z-20" />
      )}
      {/* Glow hover */}
      {!blocked && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
          style={{ background: `radial-gradient(ellipse at 30% 0%, ${mod.glow} 0%, transparent 70%)` }} />
      )}

      <div className="relative p-6 flex flex-col h-full">
        {/* Icon + badge */}
        <div className="flex items-start justify-between mb-5">
          <div className={`w-13 h-13 bg-gradient-to-br ${mod.gradient} rounded-xl flex items-center justify-center shadow-md transition-transform ${!blocked ? 'group-hover:scale-110 group-hover:-rotate-6' : 'grayscale opacity-50'}`}
            style={{ width: '3.25rem', height: '3.25rem' }}>
            <mod.icon className="w-6 h-6 text-white" />
          </div>
          {blocked ? (
            <span className="inline-flex items-center gap-1 text-[0.6rem] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-gray-100 text-gray-400">
              <Lock className="w-2.5 h-2.5" />Institucional
            </span>
          ) : (
            <span className={`text-[0.6rem] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${mod.chip}`}>
              {mod.tag}
            </span>
          )}
        </div>

        <h3 className="text-[1rem] font-bold text-text mb-2 leading-snug">{mod.title}</h3>
        <p className="text-sm text-text-muted leading-relaxed mb-6 flex-1">{mod.description}</p>

        {blocked ? (
          <Link to="/solicitar-acceso"
            className="inline-flex items-center gap-2 text-xs font-semibold text-primary-700 no-underline hover:text-primary-900 transition-colors pointer-events-auto">
            <Lock className="w-3 h-3" />
            Solicitar acceso
          </Link>
        ) : (
          <Link to={mod.path}
            className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider no-underline transition-all bg-gradient-to-r ${mod.gradient} bg-clip-text text-transparent group-hover:gap-3`}>
            {mod.action}
            <ArrowRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>
    </motion.div>
  )

  return CardContent
}

// ── Hero con Globo 3D ──
function HeroBanner({ onAccederVisitante, heroRef }) {
  const { isAuthenticated, isVisitante } = useAuth()
  const titleRef = useRef()
  const subtitleRef = useRef()
  const chipsRef = useRef()
  const ctaRef = useRef()

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.2 })
    tl.from(titleRef.current, { y: 60, opacity: 0, duration: 1, ease: 'power4.out' })
      .from(subtitleRef.current, { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.5')
      .from(chipsRef.current?.children ?? [], { y: 20, opacity: 0, stagger: 0.08, duration: 0.5, ease: 'power2.out' }, '-=0.4')
      .from(ctaRef.current?.children ?? [], { y: 20, opacity: 0, stagger: 0.1, duration: 0.5, ease: 'power2.out' }, '-=0.3')
    return () => tl.kill()
  }, [])

  return (
    <div ref={heroRef}
      className="relative rounded-3xl overflow-hidden flex items-stretch"
      style={{ minHeight: '520px' }}>

      {/* Fondo oscuro degradado */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, #020d09 0%, #0a1f12 40%, #0d2b1a 100%)' }} />

      {/* Malla de puntos sutil */}
      <div className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: 'radial-gradient(circle, #52B788 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />

      {/* Orb de luz verde */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(82,183,136,0.15) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-30%] right-[20%] w-[400px] h-[400px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(212,163,115,0.1) 0%, transparent 70%)' }} />

      {/* Contenido */}
      <div className="relative z-10 flex flex-col lg:flex-row w-full">

        {/* Izquierda — texto */}
        <div className="flex-1 flex flex-col justify-center p-8 lg:p-14 lg:pr-6">

          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-green-400/80">
                Sistema activo · IIAP Colombia
              </span>
            </div>
          </div>

          {/* Título */}
          <div ref={titleRef}>
            <h1 className="font-display font-bold leading-none mb-2"
              style={{ fontSize: 'clamp(3.5rem, 8vw, 6rem)' }}>
              <span style={{
                background: 'linear-gradient(135deg, #D8F3DC 0%, #52B788 50%, #D4A373 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                VIGIIAP
              </span>
            </h1>
          </div>

          <div ref={subtitleRef}>
            <p className="text-white/50 text-sm font-medium tracking-wide mb-2 uppercase">
              Visor y Gestor de Información Ambiental del Pacífico
            </p>
            <p className="text-white/55 text-[0.93rem] leading-relaxed max-w-md mb-8">
              Plataforma institucional para la consulta, análisis y gestión de
              información ambiental y territorial del{' '}
              <span className="text-green-300/80 font-semibold">Chocó Biogeográfico</span> colombiano.
            </p>
          </div>

          {/* Texto descriptivo ampliado */}
          <div ref={chipsRef} className="mb-8 space-y-3 max-w-lg">
            <p className="text-white/55 text-[0.9rem] leading-relaxed">
              Plataforma de gestión del conocimiento ambiental del{' '}
              <span className="text-green-300/90 font-semibold">Chocó Biogeográfico</span>,
              la región más biodiversa de Colombia. Centraliza mapas, investigaciones,
              datos geoespaciales e información territorial producida por el IIAP.
            </p>
            <p className="text-white/40 text-[0.83rem] leading-relaxed">
              Diseñada para investigadores, gestores ambientales, instituciones aliadas
              y la ciudadanía en general — con diferentes niveles de acceso según el
              perfil del usuario.
            </p>
          </div>

          {/* CTAs */}
          <div ref={ctaRef} className="flex flex-wrap gap-3">
            <Link to="/geovisor"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold no-underline transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #52B788, #2D6A4F)', color: '#fff', boxShadow: '0 4px 24px rgba(82,183,136,0.35)' }}>
              <Globe className="w-4 h-4" />
              Explorar Geovisor
            </Link>

            {!isAuthenticated && (
              <button onClick={onAccederVisitante}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] border"
                style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)' }}>
                <ArrowRight className="w-4 h-4" />
                Acceder como visitante
              </button>
            )}
            {isAuthenticated && !isVisitante && (
              <Link to="/mapas"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold no-underline transition-all hover:scale-[1.02] border"
                style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)' }}>
                <Map className="w-4 h-4" />
                Ver Catálogo
              </Link>
            )}
          </div>
        </div>

        {/* Derecha — Globo 3D */}
        <div className="hidden lg:flex w-[480px] items-center justify-center relative">
          <Suspense fallback={
            <div className="w-[380px] h-[380px] rounded-full border border-green-800/20 animate-pulse"
              style={{ background: 'radial-gradient(circle, rgba(82,183,136,0.05) 0%, transparent 70%)' }} />
          }>
            <GlobeScene className="w-[420px] h-[420px]" />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

// ── Stats ──
function StatsSection({ sectionRef }) {
  return (
    <div ref={sectionRef} className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {STATS.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }}
          className="bg-white border border-border/60 rounded-2xl p-5 text-center group hover:border-primary-300 transition-colors"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
            <stat.icon className="w-5 h-5 text-primary-700" />
          </div>
          <div className="font-display text-2xl font-bold text-primary-800 mb-1">{stat.value}</div>
          <div className="text-[0.65rem] text-text-muted uppercase tracking-wider">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  )
}

// ── Sección de módulos ──
function ModulesSection({ sectionRef, isVisitante, isPublico }) {
  const { query } = useSearch()
  const filteredModules = ALL_MODULES.filter((m) =>
    matches([m.title, m.description, m.action], query)
  )

  const restricted = filteredModules.filter((m) => !m.publicAccess).length
  const showNote = isVisitante || isPublico

  if (!filteredModules.length) return null

  return (
    <section ref={sectionRef}>
      <div className="mb-8">
        <span className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-text-muted block mb-2">
          Plataforma
        </span>
        <div className="flex items-end justify-between flex-wrap gap-2">
          <h2 className="font-display text-2xl font-bold text-text">Módulos de VIGIIAP</h2>
          {showNote && (
            <span className="text-xs text-text-muted bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              {restricted} módulos requieren cuenta de investigador
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredModules.map((mod, i) => (
          <ModuleCard key={mod.id} mod={mod} index={i} isVisitante={isVisitante} isPublico={isPublico} />
        ))}
      </div>
    </section>
  )
}

// ── Franja institucional ──
function InstitutionalStrip() {
  const ref = useRef()
  useEffect(() => {
    gsap.from(ref.current, {
      opacity: 0, y: 30, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true },
    })
  }, [])

  return (
    <div ref={ref}
      className="relative rounded-2xl overflow-hidden px-8 py-10 flex flex-col sm:flex-row items-center gap-6"
      style={{ background: 'linear-gradient(135deg, #020d09 0%, #0d2b1a 100%)' }}>
      <div className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(circle, #52B788 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-green-400 to-transparent" />

      <div className="relative flex-1 text-center sm:text-left">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-green-400/70 mb-2">
          Instituto de Investigaciones Ambientales del Pacífico
        </p>
        <h3 className="font-display text-xl font-bold text-white mb-1">
          Conocimiento al servicio del territorio
        </h3>
        <p className="text-white/50 text-sm leading-relaxed max-w-lg">
          El IIAP genera, sistematiza y transfiere conocimiento sobre el
          Chocó Biogeográfico para apoyar la toma de decisiones ambientales y el desarrollo sostenible.
        </p>
      </div>
      <div className="relative shrink-0">
        <Link to="/solicitar-acceso"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold no-underline transition-all hover:scale-105"
          style={{ background: 'rgba(82,183,136,0.15)', color: '#D8F3DC', border: '1px solid rgba(82,183,136,0.25)' }}>
          Solicitar acceso
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}

// ── News Card ──
function NewsCard({ article, featured }) {
  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: '0 16px 48px rgba(0,0,0,0.1)' }}
      transition={{ duration: 0.3 }}
      className={`bg-white border border-border/60 rounded-2xl overflow-hidden ${featured ? 'lg:col-span-2' : ''}`}>
      <Link to={`/noticias/${article.slug || article.id}`}
        className="block p-5 no-underline group h-full">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[0.65rem] font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full">
            {article.tag || article.categoria || 'IIAP'}
          </span>
          {featured && (
            <span className="text-[0.6rem] font-bold uppercase tracking-widest"
              style={{ color: '#B7791F', background: '#FFFBEB', padding: '2px 8px', borderRadius: '9999px' }}>
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
          <ArrowUpRight className="w-4 h-4 text-primary-800 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </Link>
    </motion.div>
  )
}

// ── Welcome strip ──
function WelcomeStrip({ user }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
  const firstName = user?.name?.split(' ')[0] || 'Usuario'

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="flex items-center gap-4 bg-white border border-border/60 rounded-2xl px-5 py-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${user?.isVisitante ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 'bg-gradient-to-br from-primary-700 to-primary-950'}`}>
        <span className="text-white font-bold text-sm">{(firstName[0] || 'V').toUpperCase()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-text">{greeting}, {firstName}</p>
        <p className="text-xs text-text-muted truncate">
          {user?.isVisitante ? 'Modo visitante — acceso a información pública' : `${user?.role || 'Sesión activa'} · VIGIIAP`}
        </p>
      </div>
      {!user?.isVisitante ? (
        <Link to="/herramientas"
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-800 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 no-underline transition-colors">
          <Plus className="w-3.5 h-3.5" />Nuevo análisis
        </Link>
      ) : (
        <Link to="/solicitar-acceso"
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 no-underline transition-colors">
          <ChevronRight className="w-3.5 h-3.5" />Solicitar acceso
        </Link>
      )}
    </motion.div>
  )
}

// ── Home Page ──
export default function Home() {
  const { isAuthenticated, user, loginVisitante, isVisitante } = useAuth()
  const isPublico = user?.role === 'Público'
  const navigate = useNavigate()
  const { query } = useSearch()
  const [showModal, setShowModal] = useState(false)

  const heroRef     = useRef()
  const statsRef    = useRef()
  const modulesRef  = useRef()

  const { data: noticiasData } = useNoticiasList({ limit: 4 })
  const apiNews    = noticiasData?.data ?? []
  const displayNews = apiNews.length > 0 ? apiNews : NEWS

  const filteredNews = displayNews.filter((a) =>
    matches([a.title || a.titulo, a.excerpt || a.resumen, a.tag || a.categoria], query)
  )

  const handleAccederVisitante = async () => {
    try { await loginVisitante(); navigate('/') } catch { /* silent */ }
  }

  // Parallax sutil en el hero al scrollear
  useEffect(() => {
    if (!heroRef.current) return
    const tween = gsap.to(heroRef.current, {
      yPercent: -12,
      ease: 'none',
      scrollTrigger: {
        trigger: heroRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    })
    return () => tween.kill()
  }, [])

  return (
    <>
      <div className="space-y-12">

        {/* Hero */}
        {!query.trim() && <HeroBanner onAccederVisitante={handleAccederVisitante} heroRef={heroRef} />}

        {/* Welcome */}
        {isAuthenticated && !query.trim() && <WelcomeStrip user={user} />}

        {/* Módulos */}
        {!query.trim()
          ? <ModulesSection sectionRef={modulesRef} isVisitante={isVisitante} isPublico={isPublico} />
          : <section>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {ALL_MODULES
                  .filter((m) => matches([m.title, m.description, m.action], query))
                  .map((mod, i) => <ModuleCard key={mod.id} mod={mod} index={i} isVisitante={isVisitante} isPublico={isPublico} />)
                }
              </div>
            </section>
        }

        {/* Sin resultados */}
        {query.trim() && !ALL_MODULES.some((m) => matches([m.title, m.description], query)) && filteredNews.length === 0 && (
          <div className="py-20 text-center text-text-muted">
            <SearchX className="w-10 h-10 mx-auto mb-3 opacity-25" />
            <p className="text-sm">Sin resultados para <strong className="text-text">"{query}"</strong></p>
          </div>
        )}

        {/* Stats */}
        {!query.trim() && (
          <div>
            <div className="mb-6">
              <span className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-text-muted block mb-2">Territorio de cobertura</span>
              <h2 className="font-display text-2xl font-bold text-text">Chocó Biogeográfico en cifras</h2>
            </div>
            <StatsSection sectionRef={statsRef} />
          </div>
        )}

        {/* Franja institucional */}
        {!query.trim() && <InstitutionalStrip />}

        {/* Noticias */}
        {filteredNews.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                {!query.trim() && <span className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-text-muted block mb-2">Actualidad</span>}
                <h2 className="font-display text-2xl font-bold text-text">
                  {query.trim() ? `Noticias — "${query}"` : 'Noticias del IIAP'}
                </h2>
              </div>
              {!query.trim() && (
                <Link to="/noticias"
                  className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-text-muted hover:text-primary-800 no-underline transition-colors">
                  Ver todas <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredNews.slice(0, 4).map((article, i) => (
                <NewsCard key={article.id} article={article} featured={i === 0 && !query.trim()} />
              ))}
            </div>
          </section>
        )}

      </div>

      {/* FAB */}
      {isAuthenticated && !user?.isVisitante && (
        <motion.button onClick={() => setShowModal(true)}
          whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="fixed bottom-20 lg:bottom-6 right-6 z-30 flex items-center justify-center rounded-full shadow-elevated text-white"
          style={{ width: '3.25rem', height: '3.25rem', background: 'linear-gradient(135deg, #2D6A4F, #1B4332)', boxShadow: '0 8px 32px rgba(27,67,50,0.45)' }}>
          <Plus className="w-5 h-5" />
        </motion.button>
      )}

      <AnimatePresence>
        {showModal && <NuevoAnalisisModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </>
  )
}
