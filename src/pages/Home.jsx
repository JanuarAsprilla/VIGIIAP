import { useState, useRef, useEffect, lazy, Suspense } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, useMotionTemplate } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  ArrowRight, Map, FileText, Globe, Wrench,
  ClipboardList, Newspaper, Plus, SearchX, ArrowUpRight,
  ChevronRight, Lock, ChevronDown,
} from 'lucide-react'
import { STATS, NEWS } from '@/lib/constants'
import { useAuth } from '@/contexts/AuthContext'
import { useSearch } from '@/contexts/SearchContext'
import { matches } from '@/lib/search'
import NuevoAnalisisModal from '@/components/NuevoAnalisisModal'
import { useNoticiasList } from '@/hooks/useNoticias'

gsap.registerPlugin(ScrollTrigger)

const GlobeScene = lazy(() => import('@/components/GlobeScene'))

// ── Módulos ──────────────────────────────────────────────────────────────────
const ALL_MODULES = [
  {
    id: 'mapas', title: 'Catálogo de Mapas',
    description: 'Mapas temáticos de biodiversidad, suelos, hidrografía y cobertura vegetal del Chocó Biogeográfico producidos por el IIAP.',
    icon: Map, path: '/mapas', action: 'Explorar mapas', tag: 'Cartografía',
    gradient: 'from-[#1A5632] to-[#284E39]', chip: 'bg-primary-50 text-primary-800',
    glow: 'rgba(26,86,50,0.28)', ctaColor: '#1A5632', publicAccess: true,
  },
  {
    id: 'documentos', title: 'Biblioteca Documental',
    description: 'Informes técnicos, investigaciones científicas, protocolos ambientales y documentos institucionales del IIAP.',
    icon: FileText, path: '/documentos', action: 'Consultar biblioteca', tag: 'Documentos',
    gradient: 'from-[#F08143] to-[#F7AC42]', chip: 'bg-amber-50 text-amber-800',
    glow: 'rgba(247,172,66,0.28)', ctaColor: '#C45A1A', publicAccess: true,
  },
  {
    id: 'noticias', title: 'Noticias y Eventos',
    description: 'Últimas publicaciones, investigaciones destacadas, eventos y comunicados del Instituto de Investigaciones Ambientales del Pacífico.',
    icon: Newspaper, path: '/noticias', action: 'Ver noticias', tag: 'Actualidad',
    gradient: 'from-[#218842] to-[#009846]', chip: 'bg-emerald-50 text-emerald-800',
    glow: 'rgba(0,152,70,0.22)', ctaColor: '#1A7038', publicAccess: true,
  },
  {
    id: 'geovisor', title: 'Geovisor Interactivo',
    description: 'Herramienta SIG en línea para la visualización y análisis de capas geoespaciales sobre el territorio del Pacífico colombiano.',
    icon: Globe, path: '/geovisor', action: 'Abrir geovisor', tag: 'SIG',
    gradient: 'from-[#1A5632] to-[#218842]', chip: 'bg-primary-50 text-primary-800',
    glow: 'rgba(26,86,50,0.22)', ctaColor: '#1A5632', publicAccess: false,
  },
  {
    id: 'herramientas', title: 'Herramientas SIG',
    description: 'Calculadoras de área, convertidores de coordenadas y motores de análisis espacial para procesamiento de datos geográficos.',
    icon: Wrench, path: '/herramientas', action: 'Usar herramientas', tag: 'Análisis',
    gradient: 'from-[#B0CB1F] to-[#218842]', chip: 'bg-lime-50 text-lime-800',
    glow: 'rgba(176,203,31,0.22)', ctaColor: '#6B8A0C', publicAccess: false,
  },
  {
    id: 'solicitudes', title: 'Solicitudes de Acceso',
    description: 'Gestiona solicitudes de acceso a datos, información especializada y colaboración con el IIAP.',
    icon: ClipboardList, path: '/solicitudes', action: 'Gestionar solicitudes', tag: 'Gestión',
    gradient: 'from-[#284E39] to-[#1A5632]', chip: 'bg-primary-50 text-primary-800',
    glow: 'rgba(40,78,57,0.22)', ctaColor: '#1A5632', publicAccess: false,
  },
]

// ── Bento order para desktop ──────────────────────────────────────────────────
// [Mapas - wide] [Geovisor] [Herramientas]
// [Docs] [Noticias] [Solicitudes - wide]
const BENTO_SPANS = {
  mapas:       'lg:col-span-2',
  documentos:  'lg:col-span-1',
  noticias:    'lg:col-span-1',
  geovisor:    'lg:col-span-1',
  herramientas:'lg:col-span-1',
  solicitudes: 'lg:col-span-2',
}

// ── Module Card 3D ─────────────────────────────────────────────────────────────
function ModuleCard({ mod, index, isVisitante, isPublico }) {
  const ref    = useRef()
  const blocked = !mod.publicAccess && (isVisitante || isPublico)

  const mouseX  = useMotionValue(0)
  const mouseY  = useMotionValue(0)
  const rawRX   = useTransform(mouseY, [-0.5, 0.5], [6, -6])
  const rawRY   = useTransform(mouseX, [-0.5, 0.5], [-6, 6])
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

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 900 }}
      className={`relative bg-white rounded-2xl border h-full overflow-hidden transition-shadow ${blocked ? 'border-border/30 opacity-55 cursor-not-allowed' : 'border-border/60 cursor-pointer group'}`}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: index * 0.06 }}
      whileHover={!blocked ? { y: -4, boxShadow: `0 24px 64px ${mod.glow}, 0 4px 20px rgba(0,0,0,0.07)` } : {}}
    >
      {/* Top accent */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${mod.gradient} ${blocked ? 'opacity-25' : ''}`} />
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
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider no-underline transition-all group-hover:gap-3"
            style={{ color: mod.ctaColor }}>
            {mod.action}<ArrowRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>
    </motion.div>
  )
}

// ── Hero ───────────────────────────────────────────────────────────────────────
function HeroBanner({ onAccederVisitante, heroRef }) {
  const { isAuthenticated, isVisitante } = useAuth()
  const titleRef    = useRef()
  const subtitleRef = useRef()
  const ctaRef      = useRef()

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.1 })
    tl.from(titleRef.current,    { y: 70, opacity: 0, duration: 1.1, ease: 'power4.out' })
      .from(subtitleRef.current, { y: 28, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.55')
      .from(ctaRef.current?.children ?? [], { y: 20, opacity: 0, stagger: 0.1, duration: 0.5, ease: 'power2.out' }, '-=0.3')
    return () => tl.kill()
  }, [])

  return (
    <div ref={heroRef}
      className="relative rounded-3xl overflow-hidden flex flex-col"
      style={{ minHeight: '640px', background: 'linear-gradient(135deg, #0c1f14 0%, #0f2b1a 45%, #122e1d 100%)' }}>

      {/* Dot grid */}
      <div className="absolute inset-0 opacity-[0.055]"
        style={{ backgroundImage: 'radial-gradient(circle, #009846 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      {/* Ambient orbs */}
      <div className="absolute top-[-15%] left-[-8%] w-[640px] h-[640px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,152,70,0.14) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-20%] right-[15%] w-[440px] h-[440px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(247,172,66,0.10) 0%, transparent 70%)' }} />

      {/* Horizontal rule accent */}
      <div className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(0,152,70,0.45), rgba(176,203,31,0.25), transparent)' }} />

      <div className="relative z-10 flex flex-col lg:flex-row w-full flex-1">
        {/* Left — copy */}
        <div className="flex-1 flex flex-col justify-center px-10 py-16 lg:px-16 lg:py-16">

          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8"
            style={{ border: '1px solid rgba(176,203,31,0.28)', background: 'rgba(0,152,70,0.10)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background: '#B0CB1F' }} />
            <span className="text-[0.62rem] font-bold uppercase tracking-[0.25em]" style={{ color: 'rgba(176,203,31,0.9)' }}>
              Sistema activo · IIAP Colombia · Chocó Biogeográfico
            </span>
          </div>

          {/* Logo word */}
          <div ref={titleRef} className="mb-6">
            <h1 className="font-display font-black leading-[0.9] tracking-tight"
              style={{ fontSize: 'clamp(4rem, 10vw, 7.5rem)' }}>
              <span style={{ color: '#C8E6CE', textShadow: '0 0 80px rgba(0,152,70,0.4)' }}>
                VIGI
              </span>
              <span style={{ color: 'rgba(176,203,31,0.92)', textShadow: '0 0 60px rgba(176,203,31,0.25)' }}>
                -IIAP
              </span>
            </h1>
            <p className="text-white/55 text-xs font-semibold tracking-[0.22em] mt-3 ml-1">
              Visor Gestor de Información Ambiental del Pacífico
            </p>
          </div>

          {/* Description */}
          <div ref={subtitleRef} className="max-w-lg mb-10">
            <p className="text-white/72 text-[0.95rem] leading-[1.8]">
              Plataforma institucional para la consulta, análisis y gestión de información
              ambiental y territorial del{' '}
              <span className="text-[#B0CB1F] font-semibold">Chocó Biogeográfico</span> colombiano,
              la región más biodiversa del planeta.
            </p>
          </div>

          {/* CTAs */}
          <div ref={ctaRef} className="flex flex-wrap items-center gap-3">
            <Link to="/geovisor"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold no-underline transition-all hover:scale-[1.03] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #009846, #1A5632)', color: '#fff', boxShadow: '0 4px 28px rgba(0,152,70,0.38)' }}>
              <Globe className="w-4 h-4" />Explorar Geovisor
            </Link>

            {!isAuthenticated && (
              <button onClick={onAccederVisitante}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.03] active:scale-[0.98] border"
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(8px)' }}>
                <ArrowRight className="w-4 h-4" />Acceder como visitante
              </button>
            )}
            {isAuthenticated && !isVisitante && (
              <Link to="/mapas"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold no-underline transition-all hover:scale-[1.03] border"
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(8px)' }}>
                <Map className="w-4 h-4" />Ver Catálogo
              </Link>
            )}
          </div>

          {/* Scroll indicator */}
          <div className="hidden lg:flex items-center gap-2 mt-12 text-white/25">
            <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
            <span className="text-[0.6rem] uppercase tracking-[0.22em]">Explorar</span>
          </div>
        </div>

        {/* Right — globe */}
        <div className="hidden lg:flex w-[500px] items-center justify-center relative shrink-0">
          <Suspense fallback={
            <div className="w-[400px] h-[400px] rounded-full border border-green-800/20 animate-pulse"
              style={{ background: 'radial-gradient(circle, rgba(82,183,136,0.05) 0%, transparent 70%)' }} />
          }>
            <GlobeScene className="w-[440px] h-[440px]" />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

// ── Marquee ────────────────────────────────────────────────────────────────────
const MARQUEE_ITEMS = [
  'Biogeografía', 'Cartografía Ambiental', 'Datos Espaciales',
  'Chocó Colombiano', 'Investigación IIAP', 'Biodiversidad',
  'Pacífico Colombiano', 'SIG & Geovisor', 'Gestión Territorial',
]

function MarqueeStrip() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]
  return (
    <div className="overflow-hidden border-y border-border/60 bg-white py-3.5 select-none">
      <motion.div
        className="flex gap-10 whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
      >
        {items.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-4 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-text-muted/60">
            {item}
            <span className="w-1 h-1 rounded-full bg-primary-300 shrink-0" />
          </span>
        ))}
      </motion.div>
    </div>
  )
}

// ── Stats — editorial ──────────────────────────────────────────────────────────
function StatsSection() {
  return (
    <div>
      <div className="mb-7 flex items-end gap-4">
        <div>
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-text-muted block mb-1.5">
            Territorio de cobertura
          </span>
          <h2 className="font-display text-2xl font-bold text-text">Chocó Biogeográfico en cifras</h2>
        </div>
        <div className="flex-1 h-px bg-border mb-1.5 hidden sm:block" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 bg-white border border-border rounded-2xl overflow-hidden">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
            className="px-7 py-9 border-r border-b border-border last:border-r-0 md:[&:nth-child(4)]:border-r-0 [&:nth-child(3)]:border-r-0 md:[&:nth-child(3)]:border-r [&:nth-child(3)]:border-b-0 [&:nth-child(4)]:border-b-0 md:[&:nth-child(2)]:border-r group cursor-default"
          >
            <div className="font-display text-5xl font-bold text-primary-800 leading-none mb-3
              group-hover:text-primary-600 transition-colors duration-300">
              {stat.value}
            </div>
            <div className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-text-muted leading-relaxed">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ── Section heading ────────────────────────────────────────────────────────────
function SectionHeading({ eyebrow, title, action, actionTo, note }) {
  return (
    <div className="mb-7">
      <span className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-text-muted block mb-1.5">
        {eyebrow}
      </span>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <h2 className="font-display text-2xl font-bold text-text">{title}</h2>
        <div className="flex items-center gap-3 mb-0.5">
          {note && (
            <span className="text-xs text-text-muted bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              {note}
            </span>
          )}
          {action && (
            <Link to={actionTo}
              className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-text-muted hover:text-primary-800 no-underline transition-colors">
              {action} <ArrowRight className="w-3 h-3" />
            </Link>
          )}
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
  const bentoOrder = ['mapas', 'geovisor', 'herramientas', 'documentos', 'noticias', 'solicitudes']
  const sortedModules = query.trim()
    ? filtered
    : bentoOrder.map((id) => ALL_MODULES.find((m) => m.id === id)).filter(Boolean)

  return (
    <section>
      <SectionHeading
        eyebrow="Plataforma"
        title="Módulos de VIGI-IIAP"
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
function NewsCard({ article, variant = 'default' }) {
  const isFeature = variant === 'feature'
  const isTall    = variant === 'tall'

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25 }}
      className="bg-white border border-border/60 rounded-2xl overflow-hidden h-full group"
      style={{ boxShadow: 'none' }}
      whileInView={{ opacity: 1 }}
      initial={{ opacity: 0 }}
      viewport={{ once: true }}
    >
      <Link to={`/noticias/${article.slug || article.id}`}
        className="flex flex-col p-5 no-underline h-full">

        <div className="flex items-center justify-between mb-3">
          <span className="text-[0.62rem] font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full">
            {article.tag || article.categoria || 'IIAP'}
          </span>
          {isFeature && (
            <span className="text-[0.6rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
              style={{ color: '#B7791F', background: '#FFFBEB' }}>Destacada</span>
          )}
        </div>

        <h3 className={`font-bold text-text leading-snug mb-2 group-hover:text-primary-800 transition-colors flex-1 ${isFeature ? 'text-base' : 'text-sm'}`}>
          {article.title || article.titulo}
        </h3>

        {(isFeature || isTall) && (
          <p className="text-sm text-text-muted leading-relaxed mb-4 line-clamp-3">
            {article.excerpt || article.resumen}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
          <span className="text-xs text-text-muted">{article.time || article.date}</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-primary-700 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </Link>
    </motion.div>
  )
}

// ── News section — editorial ───────────────────────────────────────────────────
function NewsSection({ articles, query }) {
  if (!articles.length) return null
  const [featured, ...rest] = articles.slice(0, 4)

  return (
    <section>
      <SectionHeading
        eyebrow="Actualidad"
        title={query.trim() ? `Noticias — "${query}"` : 'Noticias del IIAP'}
        action={!query.trim() ? 'Ver todas' : undefined}
        actionTo="/noticias"
      />

      {query.trim() ? (
        /* Search result: uniform grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {articles.slice(0, 4).map((a) => <NewsCard key={a.id} article={a} />)}
        </div>
      ) : (
        /* Editorial: featured + grid */
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
          {/* Featured — left */}
          <NewsCard article={featured} variant="feature" />

          {/* Side stack — right */}
          {rest.length > 0 && (
            <div className="flex flex-col gap-4">
              {rest.map((a) => <NewsCard key={a.id} article={a} />)}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

// ── Institutional banner ───────────────────────────────────────────────────────
function InstitutionalBanner() {
  const ref = useRef()
  useEffect(() => {
    gsap.from(ref.current, {
      opacity: 0, y: 24, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: ref.current, start: 'top 88%', once: true },
    })
  }, [])

  return (
    <div ref={ref}
      className="relative rounded-2xl overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0c1f14 0%, #122e1d 100%)' }}>

      {/* Dot grid */}
      <div className="absolute inset-0 opacity-[0.055]"
        style={{ backgroundImage: 'radial-gradient(circle, #009846 1px, transparent 1px)', backgroundSize: '26px 26px' }} />

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(0,152,70,0.5) 30%, rgba(176,203,31,0.4) 70%, transparent 100%)' }} />

      <div className="relative px-10 py-10 flex flex-col sm:flex-row items-center gap-6">
        <div className="flex-1 text-center sm:text-left">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.24em] text-green-400/65 mb-2">
            Instituto de Investigaciones Ambientales del Pacífico
          </p>
          <h3 className="font-display text-2xl font-bold text-white mb-2 leading-snug">
            Conocimiento al servicio<br className="hidden sm:block" /> del territorio
          </h3>
          <p className="text-white/45 text-sm leading-relaxed max-w-lg">
            El IIAP genera, sistematiza y transfiere conocimiento sobre el Chocó Biogeográfico
            para apoyar la toma de decisiones ambientales y el desarrollo sostenible.
          </p>
        </div>
        <div className="shrink-0">
          <Link to="/solicitar-acceso"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold no-underline transition-all hover:scale-105"
            style={{ background: 'rgba(0,152,70,0.14)', color: '#C8E6CE', border: '1px solid rgba(0,152,70,0.25)' }}>
            Solicitar acceso <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Welcome strip ──────────────────────────────────────────────────────────────
function WelcomeStrip({ user }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
  const firstName = user?.name?.split(' ')[0] || 'Usuario'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.12 }}
      className="flex items-center gap-4 bg-white border border-border/60 rounded-2xl px-5 py-3.5"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${user?.isVisitante ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 'bg-gradient-to-br from-primary-700 to-primary-950'}`}>
        <span className="text-white font-bold text-xs">{(firstName[0] || 'V').toUpperCase()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-text">{greeting}, {firstName}</p>
        <p className="text-xs text-text-muted truncate">
          {user?.isVisitante ? 'Modo visitante — acceso a información pública' : `${user?.role || 'Sesión activa'} · VIGI-IIAP`}
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
  const { isAuthenticated, user, loginVisitante, isVisitante } = useAuth()
  const isPublico = user?.role === 'Público'
  const navigate  = useNavigate()
  const { query } = useSearch()
  const [showModal, setShowModal] = useState(false)
  const heroRef = useRef()

  const { data: noticiasData } = useNoticiasList({ limit: 4 })
  const apiNews      = noticiasData?.data ?? []
  const displayNews  = apiNews.length > 0 ? apiNews : NEWS
  const filteredNews = displayNews.filter((a) =>
    matches([a.title || a.titulo, a.excerpt || a.resumen, a.tag || a.categoria], query)
  )

  const handleAccederVisitante = async () => {
    try { await loginVisitante(); navigate('/') } catch { /* silent */ }
  }

  // Parallax hero
  useEffect(() => {
    if (!heroRef.current) return
    const tween = gsap.to(heroRef.current, {
      yPercent: -10, ease: 'none',
      scrollTrigger: { trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: true },
    })
    return () => tween.kill()
  }, [])

  const noResults = query.trim()
    && !ALL_MODULES.some((m) => matches([m.title, m.description], query))
    && filteredNews.length === 0

  return (
    <>
      <div className="space-y-10">

        {/* Hero */}
        {!query.trim() && <HeroBanner onAccederVisitante={handleAccederVisitante} heroRef={heroRef} />}

        {/* Marquee — solo fuera de búsqueda */}
        {!query.trim() && <MarqueeStrip />}

        {/* Welcome strip — usuario autenticado */}
        {isAuthenticated && !query.trim() && <WelcomeStrip user={user} />}

        {/* Módulos */}
        <ModulesSection isVisitante={isVisitante} isPublico={isPublico} />

        {/* Sin resultados */}
        {noResults && (
          <div className="py-20 text-center text-text-muted">
            <SearchX className="w-10 h-10 mx-auto mb-3 opacity-25" />
            <p className="text-sm">Sin resultados para <strong className="text-text">"{query}"</strong></p>
          </div>
        )}

        {/* Stats */}
        {!query.trim() && <StatsSection />}

        {/* Banner institucional */}
        {!query.trim() && <InstitutionalBanner />}

        {/* Noticias */}
        <NewsSection articles={filteredNews} query={query} />

      </div>

      {/* FAB nuevo análisis */}
      {isAuthenticated && !user?.isVisitante && (
        <motion.button
          onClick={() => setShowModal(true)}
          whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.93 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="fixed bottom-20 lg:bottom-6 right-6 z-30 flex items-center justify-center rounded-full text-white"
          style={{ width: '3.25rem', height: '3.25rem', background: 'linear-gradient(135deg, #F7AC42, #F08143)', boxShadow: '0 8px 32px rgba(247,172,66,0.45)', color: '#284E39' }}>
          <Plus className="w-5 h-5" />
        </motion.button>
      )}

      <AnimatePresence>
        {showModal && <NuevoAnalisisModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </>
  )
}
