/* Hallmark · macrostructure: Scrollytelling Landing · genre: institutional-cinematic
 * tokens: index.css · stamp: 2026-07-02
 * VIGIA-IIAP landing — Chocó Biogeográfico
 */
import { useState, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Map, FileText, Globe, Shield, Lock,
  ArrowRight, ChevronDown, Users, Building2, Plus,
} from 'lucide-react'
import { ALL_MODULES } from '@/lib/constants'
import { useAuth } from '@/contexts/AuthContext'
import { ROLES } from '@/lib/constants/roles'
import { useSearch } from '@/contexts/SearchContext'
import { matches } from '@/lib/search'
import NuevoAnalisisModal from '@/components/NuevoAnalisisModal'

const PlatformIntroSection = lazy(() => import('@/components/PlatformIntroSection'))

const EASE = [0.22, 1, 0.36, 1] as const

type ModuleItem = typeof ALL_MODULES[number]

// ── Module Card (modo búsqueda) ──────────────────────────────────────────────────
function ModuleCard({ mod, index, isVisitante, isPublico }: { mod: ModuleItem; index: number; isVisitante: boolean; isPublico: boolean }) {
  const blocked = !mod.publicAccess && (isVisitante || isPublico)
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: EASE, delay: index * 0.05 }}
      whileHover={!blocked ? { y: -4, boxShadow: `0 24px 64px ${mod.glow}, 0 4px 20px rgba(0,0,0,0.07)` } : {}}
      className={`relative rounded-2xl border h-full overflow-hidden ${blocked ? 'border-border/30 opacity-55' : 'border-border/60 group'}`}
      style={{ background: 'var(--card-bg)' }}
    >
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${mod.gradient} ${blocked ? 'opacity-25' : ''}`} />
      <div className="relative p-6 flex flex-col h-full min-h-[200px]">
        <div className="flex items-start justify-between mb-5">
          <div className={`w-12 h-12 bg-gradient-to-br ${mod.gradient} rounded-xl flex items-center justify-center shadow ${blocked ? 'grayscale opacity-50' : 'group-hover:scale-110 group-hover:-rotate-6 transition-transform'}`}>
            <mod.icon className="w-5 h-5 text-white" />
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
          <Link to="/solicitar-acceso" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 no-underline hover:text-primary-900 transition-colors">
            <Lock className="w-3 h-3" />Solicitar acceso
          </Link>
        ) : (
          <Link to={mod.path} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider no-underline transition-colors" style={{ color: mod.ctaColor }}>
            {mod.action}<ArrowRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>
    </motion.div>
  )
}

// ── Sección 1: Hero ─────────────────────────────────────────────────────────────
const HERO_STATS = [
  { value: '+1,248', label: 'Mapas' },
  { value: '+3,400', label: 'Documentos' },
  { value: '+320', label: 'Investigadores' },
]

function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #050e09 0%, #0a1f10 50%, #050e09 100%)' }}
    >
      {/* ── Fondo atmosférico CSS ── */}
      {/* Grid perspectiva suelo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ perspective: '500px' }}>
        <div className="absolute bottom-0 left-0 right-0 h-[40%]" style={{
          transform: 'rotateX(60deg)',
          transformOrigin: 'bottom center',
          backgroundImage: 'linear-gradient(rgba(0,152,70,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(0,152,70,0.07) 1px,transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage: 'linear-gradient(to top,rgba(0,0,0,0.4) 0%,transparent 100%)',
        }} />
      </div>

      {/* HUD corners */}
      {(['top-5 left-5 border-t border-l','top-5 right-5 border-t border-r',
         'bottom-5 left-5 border-b border-l','bottom-5 right-5 border-b border-r'] as const).map((cls) => (
        <div key={cls} className={`absolute w-8 h-8 border-primary-700/30 pointer-events-none ${cls}`} />
      ))}

      {/* Scanline */}
      <motion.div className="absolute inset-x-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg,transparent,rgba(116,198,157,0.3),transparent)' }}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} />

      {/* Orbs ambientales */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle,rgba(0,152,70,0.12) 0%,transparent 70%)', filter: 'blur(40px)' }} />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle,rgba(26,86,50,0.10) 0%,transparent 70%)', filter: 'blur(50px)' }} />

      {/* Dot grid */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle,rgba(116,198,157,0.8) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />

      {/* Overlay gradient bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #050e09)' }} />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-xs font-bold uppercase tracking-[0.25em]"
          style={{ background: 'rgba(0,152,70,0.15)', border: '1px solid rgba(0,152,70,0.3)', color: '#74C69D' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#74C69D] animate-pulse" />
          IIAP · Información Ambiental
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
          className="font-display font-bold text-white mb-4 leading-[1.08]"
          style={{ fontSize: 'clamp(1.8rem, 3.2vw, 3rem)' }}
        >
          El conocimiento ambiental
          <span className="block" style={{ color: '#74C69D' }}>del Chocó Biogeográfico,</span>
          custodiado y disponible.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-sm text-white/60 max-w-xl mx-auto mb-7 leading-relaxed"
        >
          VIGIA-IIAP es la plataforma digital del Instituto de Investigaciones Ambientales del Pacífico (IIAP) para la gestión de información ambiental del Chocó Biogeográfico.
          Mapas, documentos técnicos, herramientas SIG y trámites — todo en un solo lugar.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            to="/mapas"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm no-underline transition-all hover:scale-[1.03]"
            style={{ background: '#009846', color: '#fff' }}
          >
            Explorar la plataforma
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/solicitar-acceso"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm no-underline border transition-all hover:bg-white/10"
            style={{ border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.85)' }}
          >
            Solicitar acceso
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-8 inline-flex items-center gap-6 px-6 py-3 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {HERO_STATS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-4">
              {i > 0 && <div className="w-px h-6 bg-white/10" />}
              <div className="text-center">
                <p className="text-white font-bold text-lg leading-none">{s.value}</p>
                <p className="text-white/40 text-[0.6rem] uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}
      >
        <ChevronDown className="w-5 h-5 text-white/30" aria-hidden="true" />
      </motion.div>
    </section>
  )
}

// ── Sección 2: Data Platform ────────────────────────────────────────────────────
const DATA_PILLARS = [
  {
    icon: Map, number: '+1,248', unit: 'mapas temáticos',
    desc: 'Cartografía de biodiversidad, hidrología, suelos, cobertura vegetal y zonificación del territorio.',
    accent: '#1A5632', bg: 'rgba(26,86,50,0.06)',
  },
  {
    icon: FileText, number: '+3,400', unit: 'documentos técnicos',
    desc: 'Informes científicos, protocolos ambientales, estudios de impacto y publicaciones institucionales del IIAP.',
    accent: '#C45A1A', bg: 'rgba(247,172,66,0.06)',
  },
  {
    icon: Globe, number: 'Capas SIG', unit: 'interactivas',
    desc: 'Geovisor con capas temáticas superpuestas para análisis espacial sin instalación de software.',
    accent: '#1A5632', bg: 'rgba(26,86,50,0.06)',
  },
  {
    icon: Shield, number: 'Alta', unit: 'disponibilidad',
    desc: 'Plataforma activa 24/7 con acceso diferenciado por rol: público, investigador y administrador SIG.',
    accent: '#284E39', bg: 'rgba(40,78,57,0.06)',
  },
]

function DataPlatformSection() {
  return (
    <section className="py-20 px-6" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <span className="text-[0.7rem] font-bold uppercase tracking-[0.25em] text-primary-700 block mb-3">
            Repositorio digital
          </span>
          <h2 className="font-display text-4xl font-bold text-text">Lo que VIGIA-IIAP custodia</h2>
          <p className="mt-4 text-text-muted max-w-lg mx-auto text-sm leading-relaxed">
            Décadas de investigación ambiental del Chocó Biogeográfico, indexadas,
            verificadas y disponibles con alta disponibilidad.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {DATA_PILLARS.map((item, i) => (
            <motion.div
              key={item.unit}
              whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 32 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.55, delay: i * 0.08, ease: EASE }}
              className="rounded-2xl p-8 border border-border/60 relative overflow-hidden group cursor-default"
              style={{ background: item.bg }}
            >
              <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{ backgroundImage: `radial-gradient(circle, ${item.accent} 1px, transparent 1px)`, backgroundSize: '20px 20px' }}
              />
              <item.icon className="w-6 h-6 mb-5 relative" style={{ color: item.accent }} />
              <div className="font-display text-5xl font-bold mb-1 relative" style={{ color: item.accent }}>
                {item.number}
              </div>
              <div className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">{item.unit}</div>
              <p className="text-sm text-text-muted leading-relaxed relative">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Sección 3: Module Showcase ──────────────────────────────────────────────────
function parseGradient(gradient: string): [string, string] {
  // "from-[#1A5632] to-[#284E39]" -> ['#1A5632', '#284E39']
  const from = gradient.match(/from-\[([^\]]+)\]/)?.[1] ?? '#1A5632'
  const to = gradient.match(/to-\[([^\]]+)\]/)?.[1] ?? from
  return [from, to]
}

function ModuleVisual({ mod, isDark }: { mod: ModuleItem; isDark: boolean }) {
  const [from, to] = parseGradient(mod.gradient)
  return (
    <div
      className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${from}18 0%, ${to}08 100%)`,
        backdropFilter: 'blur(2px) saturate(140%)',
        WebkitBackdropFilter: 'blur(2px) saturate(140%)',
        border: `1px solid ${mod.glow}`,
        boxShadow: `0 24px 64px -12px ${mod.glow}, inset 0 1px 0 ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.5)'}`,
      }}
    >
      {/* Pattern */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: `radial-gradient(circle, ${mod.ctaColor} 1px, transparent 1px)`, backgroundSize: '24px 24px' }}
      />
      {/* Centered icon — halo de vidrio + insignia con filo especular */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="absolute w-40 h-40 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${to}30 0%, transparent 70%)`, filter: 'blur(20px)' }}
        />
        <div
          className={`relative w-24 h-24 rounded-3xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center shadow-2xl`}
          style={{ boxShadow: `0 16px 40px -8px ${mod.glow}, inset 0 1.5px 0 rgba(255,255,255,0.35)` }}
        >
          <mod.icon className="w-12 h-12 text-white" />
        </div>
      </div>
      {/* Floating decorative pills — vidrio con contraste garantizado sobre fondo claro u oscuro */}
      <div className="absolute top-4 left-4 right-4 flex gap-2">
        {[mod.tag, 'IIAP', 'Chocó'].map((t) => (
          <span
            key={t}
            className={`px-2.5 py-1 rounded-full text-[0.6rem] font-bold uppercase tracking-wider ${isDark ? 'glass-chip text-white/80' : 'glass-chip-dark text-white/90'}`}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}

function ModuleShowcaseSection() {
  return (
    <section style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-10 text-center">
        <span className="text-[0.7rem] font-bold uppercase tracking-[0.25em] text-primary-700 block mb-3">
          Módulos de la plataforma
        </span>
        <h2 className="font-display text-4xl font-bold text-text">Cinco herramientas. Un territorio.</h2>
      </div>

      {ALL_MODULES.map((mod, i) => {
        const isEven = i % 2 === 0
        const isDark = i % 3 === 2
        const [, to] = parseGradient(mod.gradient)
        const rowBg = isDark ? '#050e09' : i % 2 === 1 ? 'var(--color-bg-alt)' : 'var(--color-bg)'
        const ctaFrom = mod.gradient.includes('#1A5632') ? '#009846' : mod.ctaColor
        return (
          <div key={mod.id} style={{ background: rowBg }}>
            <motion.div
              whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 40 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, ease: EASE }}
              className={`max-w-6xl mx-auto px-6 py-14 flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-16`}
            >
              <div className="w-full lg:w-1/2 shrink-0">
                <ModuleVisual mod={mod} isDark={isDark} />
              </div>

              <div className="flex-1">
                <span className={`text-[0.65rem] font-bold uppercase tracking-[0.25em] block mb-3 ${isDark ? 'text-primary-400' : 'text-primary-700'}`}>
                  {mod.tag}
                </span>
                <h3 className={`font-display text-3xl font-bold mb-4 leading-tight ${isDark ? 'text-white' : 'text-text'}`}>
                  {mod.title}
                </h3>
                <p className={`text-sm leading-relaxed mb-8 ${isDark ? 'text-white/60' : 'text-text-muted'}`}>
                  {mod.description}
                </p>
                <Link
                  to={mod.path}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold no-underline transition-all hover:scale-[1.03]"
                  style={{ background: `linear-gradient(135deg, ${ctaFrom}, ${to})`, color: '#fff' }}
                >
                  {mod.action}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        )
      })}
    </section>
  )
}

// ── Sección 4: For Whom ─────────────────────────────────────────────────────────
const PROFILES = [
  {
    title: 'Investigadores y científicos',
    desc: 'Acceso a datos primarios, cartografía de alta precisión y documentos técnicos para estudios y publicaciones sobre el Chocó Biogeográfico.',
    icon: Users, accent: '#74C69D',
  },
  {
    title: 'Entidades públicas y privadas',
    desc: 'Gestión de certificaciones ambientales, consultas territoriales y trámites con el IIAP de forma digital y con trazabilidad.',
    icon: Building2, accent: '#F7AC42',
  },
  {
    title: 'Ciudadanía y organizaciones',
    desc: 'Acceso libre a información ambiental pública del territorio. Datos abiertos para comunidades, ONG y medios de comunicación.',
    icon: Globe, accent: '#52B788',
  },
]

function ForWhomSection() {
  return (
    <section className="py-20 px-6" style={{ background: '#050e09' }}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} viewport={{ once: true }}
          transition={{ duration: 0.5 }} className="text-center mb-16"
        >
          <span className="text-[0.7rem] font-bold uppercase tracking-[0.25em] block mb-3" style={{ color: '#74C69D' }}>
            Para todos
          </span>
          <h2 className="font-display text-4xl font-bold text-white">¿Quién usa VIGIA-IIAP?</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PROFILES.map((p, i) => (
            <motion.div
              key={p.title}
              whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 32 }} viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.55, delay: i * 0.1, ease: EASE }}
              className="rounded-2xl p-8 border relative overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-6"
                style={{ background: `${p.accent}20`, border: `1px solid ${p.accent}30` }}
              >
                <p.icon className="w-5 h-5" style={{ color: p.accent }} />
              </div>
              <h3 className="font-display text-lg font-bold text-white mb-3">{p.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Sección 5: Institutional CTA ────────────────────────────────────────────────
function InstitutionalCTASection({ onVisitante }: { onVisitante: () => void }) {
  return (
    <section className="py-20 px-6" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 24 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-8"
            style={{ background: 'linear-gradient(135deg,#009846,#1A5632)' }}
          >
            <span className="text-white font-display font-bold text-xl">V</span>
          </div>
          <h2 className="font-display text-4xl font-bold text-text mb-5">
            Información ambiental con estándares institucionales
          </h2>
          <p className="text-text-muted text-sm leading-relaxed mb-10 max-w-xl mx-auto">
            Gestionada por el Instituto de Investigaciones Ambientales del Pacífico desde el Chocó Biogeográfico.
            Disponible para investigadores, entidades y ciudadanía.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/solicitar-acceso"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm no-underline transition-all hover:scale-[1.03]"
              style={{ background: '#009846', color: '#fff' }}
            >
              Crear cuenta gratuita <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={onVisitante}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm no-underline border border-border hover:border-primary-800 hover:text-primary-800 transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Acceder como visitante
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ── Modo búsqueda: bento filtrado ────────────────────────────────────────────────
function SearchResults({ isVisitante, isPublico }: { isVisitante: boolean; isPublico: boolean }) {
  const { query } = useSearch()
  const filtered = ALL_MODULES.filter((m) => matches([m.title, m.description, m.action], query))

  return (
    <div className="space-y-8 px-4 py-8 max-w-6xl mx-auto">
      <div>
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-text-muted block mb-1.5">
          Resultados de búsqueda
        </span>
        <h2 className="font-display text-2xl font-bold text-text">
          {filtered.length ? `Módulos para "${query}"` : `Sin resultados para "${query}"`}
        </h2>
      </div>

      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[260px]">
          {filtered.map((mod, i) => (
            <ModuleCard key={mod.id} mod={mod} index={i} isVisitante={isVisitante} isPublico={isPublico} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Home ─────────────────────────────────────────────────────────────────────────
export default function Home() {
  const { isAuthenticated, user, isVisitante, loginVisitante } = useAuth()
  const isPublico = user?.role === ROLES.PUBLICO
  const { query } = useSearch()
  const [showModal, setShowModal] = useState(false)

  const isSearching = Boolean(query.trim())

  const handleVisitante = () => { void loginVisitante() }

  return (
    <>
      {isSearching ? (
        <SearchResults isVisitante={isVisitante} isPublico={isPublico} />
      ) : (
        <>
          <HeroSection />
          {/* PlatformIntroSection: scrollytelling del territorio Chocó */}
          <Suspense fallback={null}><PlatformIntroSection /></Suspense>
          <DataPlatformSection />
          <ModuleShowcaseSection />
          <ForWhomSection />
          {!isAuthenticated && <InstitutionalCTASection onVisitante={handleVisitante} />}
        </>
      )}

      {/* FAB nuevo análisis */}
      {isAuthenticated && !user?.isVisitante && (
        <motion.button
          onClick={() => setShowModal(true)}
          aria-label="Nuevo análisis"
          whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.93 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="fixed bottom-20 lg:bottom-6 right-6 z-30 flex items-center justify-center rounded-full text-white"
          style={{ width: '3.25rem', height: '3.25rem', background: 'linear-gradient(135deg, #F7AC42, #F08143)', boxShadow: '0 8px 32px rgba(247,172,66,0.45)', color: '#284E39' }}
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
