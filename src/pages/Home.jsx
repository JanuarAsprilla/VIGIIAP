import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Crosshair, BookOpen, Plus, SearchX } from 'lucide-react'
import { MODULES, STATS, NEWS } from '@/lib/constants'
import { useAuth } from '@/contexts/AuthContext'
import { useSearch } from '@/contexts/SearchContext'
import { matches } from '@/lib/search'
import NuevoAnalisisModal from '@/components/NuevoAnalisisModal'

// ── Animation helper ──
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
})

// ── Hero Banner ──
function HeroBanner() {
  return (
    <motion.div
      {...fadeUp(0.1)}
      className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 min-h-[280px] flex items-center noise-overlay scan-lines"
    >
      {/* Radial glow */}
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary-500/20 blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute -bottom-16 left-1/3 w-56 h-56 rounded-full bg-primary-400/10 blur-2xl pointer-events-none" aria-hidden="true" />

      {/* Floating orb decoration */}
      <div className="absolute top-0 right-0 bottom-0 w-2/5 overflow-hidden opacity-30 pointer-events-none" aria-hidden="true">
        <motion.div
          animate={{ y: [0, -12, 0], rotate: [0, 4, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <svg width="220" height="220" viewBox="0 0 220 220" fill="none">
            <circle cx="110" cy="110" r="100" stroke="rgba(116,198,157,0.35)" strokeWidth="1"/>
            <circle cx="110" cy="110" r="70"  stroke="rgba(116,198,157,0.25)" strokeWidth="1"/>
            <circle cx="110" cy="110" r="40"  stroke="rgba(116,198,157,0.2)"  strokeWidth="1"/>
            <line x1="10" y1="110" x2="210" y2="110" stroke="rgba(116,198,157,0.15)" strokeWidth="0.8"/>
            <line x1="110" y1="10" x2="110" y2="210" stroke="rgba(116,198,157,0.15)" strokeWidth="0.8"/>
          </svg>
        </motion.div>
      </div>

      <div className="relative z-10 p-8 max-w-xl">
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="inline-flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-widest text-primary-300 mb-3"
        >
          <span className="w-4 h-px bg-primary-400" />
          Bienvenido al Portal Territorial
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-3xl md:text-4xl font-bold text-white leading-tight mb-4"
        >
          Explora el Corazón del{' '}
          <span className="block text-gradient-gold">Chocó Biogeográfico</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-white/70 text-sm leading-relaxed mb-6 max-w-md"
        >
          Accede a la infraestructura de datos espaciales más completa de la
          región. Monitorea ecosistemas, analiza demografía y gestiona el
          territorio con precisión científica.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.58, duration: 0.5 }}
          className="flex flex-wrap gap-3"
        >
          <Link
            to="/geovisor"
            className="btn-shimmer lift-hover inline-flex items-center gap-2 px-5 py-2.5 bg-primary-300 text-primary-900 rounded-lg text-sm font-semibold no-underline hover:bg-white transition-colors"
          >
            <Crosshair className="w-4 h-4" aria-hidden="true" />
            Abrir Geovisor
          </Link>
          <Link
            to="/guia-usuario"
            className="lift-hover inline-flex items-center gap-2 px-5 py-2.5 border border-white/25 text-white rounded-lg text-sm font-semibold no-underline hover:bg-white/10 transition-colors backdrop-blur-sm"
          >
            <BookOpen className="w-4 h-4" aria-hidden="true" />
            Ver Tutoriales
          </Link>
        </motion.div>
      </div>
    </motion.div>
  )
}

// ── Module Card ──
const CARD_ACCENTS = [
  { border: 'border-t-primary-800', iconBg: 'from-primary-700 to-primary-900', iconColor: 'text-white' },
  { border: 'border-t-gold-400',    iconBg: 'from-gold-400 to-gold-500',       iconColor: 'text-white' },
  { border: 'border-t-primary-500', iconBg: 'from-primary-500 to-primary-700', iconColor: 'text-white' },
  { border: 'border-t-primary-600', iconBg: 'from-primary-600 to-primary-800', iconColor: 'text-white' },
]

function ModuleCard({ module, index }) {
  const { title, description, icon: Icon, path, action } = module
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length]

  return (
    <motion.div
      {...fadeUp(0.15 + index * 0.08)}
      className={`card-3d glow-hover bg-white rounded-xl border border-border ${accent.border} border-t-2 p-5 cursor-pointer`}
    >
      {/* Gradient icon */}
      <motion.div
        whileHover={{ scale: 1.08, rotate: -4 }}
        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
        className={`w-10 h-10 bg-gradient-to-br ${accent.iconBg} rounded-xl flex items-center justify-center mb-4 shadow-sm`}
      >
        <Icon className={`w-5 h-5 ${accent.iconColor}`} aria-hidden="true" />
      </motion.div>

      <h3 className="text-base font-bold text-text mb-1">{title}</h3>
      <p className="text-sm text-text-muted leading-relaxed mb-4">{description}</p>

      <Link
        to={path}
        className="group inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary-800 no-underline hover:text-primary-600 transition-colors"
      >
        {action}
        <motion.span
          className="inline-flex"
          whileHover={{ x: 3 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </motion.span>
      </Link>
    </motion.div>
  )
}

// ── Stats Section ──
function StatsSection() {
  return (
    <motion.div {...fadeUp(0.4)} className="flex flex-col lg:flex-row gap-8 items-start">
      <div className="lg:max-w-xs">
        <span className="inline-block text-[0.7rem] font-semibold uppercase tracking-widest text-text-muted mb-2">
          Datos de Impacto
        </span>
        <h2 className="font-display text-2xl font-bold text-text leading-tight mb-3">
          Cifras del Territorio Chocoano
        </h2>
        <p className="text-sm text-text-muted leading-relaxed">
          Un vistazo cuantitativo a la composición administrativa y ambiental de la
          región biogeográfica más biodiversa.
        </p>
      </div>

      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
            className="card-3d bg-white border border-border rounded-xl p-4 text-center"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <stat.icon className="w-5 h-5 text-primary-700" aria-hidden="true" />
            </div>
            <div className="font-display text-2xl font-bold text-gradient">
              {stat.value}
            </div>
            <div className="text-[0.7rem] text-text-muted uppercase tracking-wider mt-1">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}


// ── Home Page ──
export default function Home() {
  const { isAuthenticated } = useAuth()
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
      <div className="space-y-8">
        {/* Ocultar hero cuando hay búsqueda activa */}
        {!query.trim() && <HeroBanner />}

        {/* Módulos filtrados */}
        {filteredModules.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {filteredModules.map((mod, i) => (
              <ModuleCard key={mod.id} module={mod} index={i} />
            ))}
          </div>
        ) : !query.trim() ? null : null}

        {/* Mostrar mensaje solo cuando hay query sin resultados totales */}
        {query.trim() && filteredModules.length === 0 && filteredNews.length === 0 && (
          <motion.div {...fadeUp(0.1)} className="py-16 text-center text-text-muted">
            <SearchX className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No se encontraron resultados para <strong className="text-text">"{query}"</strong></p>
          </motion.div>
        )}

        {!query.trim() && <StatsSection />}

        {/* Noticias filtradas */}
        {filteredNews.length > 0 && (
          <motion.div {...fadeUp(0.5)}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-text">
                {query.trim() ? `Noticias — "${query}"` : 'Noticias Territoriales'}
              </h2>
              {!query.trim() && (
                <Link
                  to="/noticias"
                  className="text-xs font-bold uppercase tracking-wider text-text-muted hover:text-primary-800 no-underline transition-colors"
                >
                  Ver Todas
                </Link>
              )}
            </div>
            <div className="space-y-4">
              {filteredNews.map((article) => (
                <Link
                  key={article.id}
                  to={`/noticias/${article.slug || article.id}`}
                  className="block bg-white border border-border rounded-xl p-5 lift-hover glow-hover no-underline group"
                >
                  <span className="inline-block text-[0.65rem] font-bold uppercase tracking-wider text-primary-700 mb-2">
                    {article.tag}
                  </span>
                  <h3 className="text-sm font-bold text-text leading-snug mb-2 group-hover:text-primary-800 transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed mb-3">{article.excerpt}</p>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <span>{article.time}</span>
                    <span>·</span>
                    <span>Autor: {article.author}</span>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {isAuthenticated && (
        <motion.button
          onClick={() => setShowModal(true)}
          aria-label="Nuevo análisis territorial"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.93 }}
          transition={{ type: 'spring', stiffness: 420, damping: 20 }}
          className="btn-shimmer animate-pulse-glow fixed bottom-20 lg:bottom-6 right-6 w-12 h-12 bg-gradient-to-br from-primary-700 to-primary-900 text-white rounded-full shadow-elevated flex items-center justify-center z-30"
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