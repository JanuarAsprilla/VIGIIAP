import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Crosshair, BookOpen, Activity, Plus } from 'lucide-react'
import { MODULES, STATS, NEWS, SYSTEM_STATUS } from '@/lib/constants'

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
      className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary-800 to-primary-700 min-h-[260px] flex items-center"
    >
      {/* Background decoration */}
      <div
        className="absolute top-0 right-0 bottom-0 w-1/2 opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%231B4332' width='400' height='400'/%3E%3Cg fill='%2340916C' opacity='0.3'%3E%3Ccircle cx='50' cy='50' r='30'/%3E%3Ccircle cx='150' cy='120' r='45'/%3E%3Ccircle cx='300' cy='80' r='35'/%3E%3Ccircle cx='250' cy='200' r='50'/%3E%3Ccircle cx='100' cy='300' r='40'/%3E%3Ccircle cx='350' cy='320' r='30'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: 'cover',
        }}
      />

      <div className="relative z-10 p-8 max-w-xl">
        <span className="inline-block text-[0.7rem] font-semibold uppercase tracking-widest text-primary-300 mb-3">
          Bienvenido al Portal Territorial
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
          Explora el Corazón del{' '}
          <span className="block">Chocó Biogeográfico</span>
        </h1>
        <p className="text-white/75 text-sm leading-relaxed mb-6 max-w-md">
          Accede a la infraestructura de datos espaciales más completa de la
          región. Monitorea ecosistemas, analiza demografía y gestiona el
          territorio con precisión científica.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/geovisor"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-300 text-primary-900 rounded-lg text-sm font-semibold no-underline hover:bg-white transition-colors"
          >
            <Crosshair className="w-4 h-4" />
            Abrir Geovisor
          </Link>
          
           <a href="#"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/30 text-white rounded-lg text-sm font-semibold no-underline hover:bg-white/10 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Ver Tutoriales
          </a>
        </div>
      </div>
    </motion.div>
  )
}

// ── Module Card ──
function ModuleCard({ module, index }) {
  const { title, description, icon: Icon, path, action } = module
  const accentColors = [
    'border-t-primary-800',
    'border-t-gold-400',
    'border-t-primary-500',
    'border-t-primary-600',
  ]

  return (
    <motion.div
      {...fadeUp(0.15 + index * 0.08)}
      className={`bg-white rounded-xl border border-border ${accentColors[index]} border-t-2 p-5 hover:shadow-card transition-shadow`}
    >
      <div className="w-10 h-10 bg-bg-alt rounded-lg flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-primary-800" />
      </div>
      <h3 className="text-base font-bold text-text mb-1">{title}</h3>
      <p className="text-sm text-text-muted leading-relaxed mb-4">{description}</p>
      <Link
        to={path}
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary-800 no-underline hover:text-primary-600 transition-colors"
      >
        {action}
        <ArrowRight className="w-3.5 h-3.5" />
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
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-border rounded-xl p-4 text-center"
          >
            <stat.icon className="w-6 h-6 text-primary-700 mx-auto mb-2" />
            <div className="font-display text-2xl font-bold text-text">
              {stat.value}
            </div>
            <div className="text-[0.7rem] text-text-muted uppercase tracking-wider mt-1">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ── News Section ──
function NewsSection() {
  return (
    <motion.div {...fadeUp(0.5)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold text-text">
          Noticias Territoriales
        </h2>
        <a href="#" className="text-xs font-bold uppercase tracking-wider text-text-muted hover:text-primary-800 no-underline transition-colors">
          Ver Todas
        </a>
      </div>

      <div className="space-y-4">
        {NEWS.map((article) => (
          <div
            key={article.id}
            className="bg-white border border-border rounded-xl p-5 hover:shadow-card transition-shadow"
          >
            <span className="inline-block text-[0.65rem] font-bold uppercase tracking-wider text-primary-700 mb-2">
              {article.tag}
            </span>
            <h3 className="text-sm font-bold text-text leading-snug mb-2">
              {article.title}
            </h3>
            <p className="text-sm text-text-muted leading-relaxed mb-3">
              {article.excerpt}
            </p>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span>{article.time}</span>
              <span>·</span>
              <span>Autor: {article.author}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ── System Status Widget ──
function SystemStatus() {
  return (
    <motion.div {...fadeUp(0.55)}>
      <div className="bg-white border border-border rounded-xl p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-text mb-4">
          <Activity className="w-4 h-4 text-primary-700" />
          Estado del Sistema
        </h3>
        <div className="space-y-3">
          {SYSTEM_STATUS.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
            >
              <span className="text-sm font-medium text-text">{item.label}</span>
              <span className="text-sm text-text-muted">{item.value}</span>
            </div>
          ))}
        </div>
        <button className="w-full mt-4 py-2 border border-border rounded-lg text-xs font-bold uppercase tracking-wider text-text-muted hover:border-primary-800 hover:text-primary-800 transition-colors">
          Reporte Técnico Completo
        </button>
      </div>
    </motion.div>
  )
}

// ── Home Page ──
export default function Home() {
  return (
    <>


      <div className="space-y-8">
        <HeroBanner />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {MODULES.map((mod, i) => (
            <ModuleCard key={mod.id} module={mod} index={i} />
          ))}
        </div>

        <StatsSection />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <NewsSection />
          <SystemStatus />
        </div>
      </div>

      <button className="fixed bottom-20 lg:bottom-6 right-6 w-12 h-12 bg-primary-800 text-white rounded-full shadow-elevated flex items-center justify-center hover:bg-primary-700 hover:shadow-float hover:scale-105 transition-all z-30">
        <Plus className="w-5 h-5" />
      </button>
    </>
  )
}