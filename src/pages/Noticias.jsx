/* Hallmark · macrostructure: Long Document · genre: editorial-catalog
 * tokens: design.md · stamp: 2026-05-25
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Newspaper, Search, X, Loader2, ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react'
import { useNoticiasList } from '@/hooks/useNoticias'
import { useSearch } from '@/contexts/SearchContext'
import { matches } from '@/lib/search'
import { fadeUp, staggerContainer, staggerItem3D } from '@/lib/animations'
import Card3D from '@/components/ui/Card3D'

const PAGE_SIZE = 12

/** Genera el array de botones: números y '…' según la posición actual. */
function buildPageButtons(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total, current])
  for (let d = -2; d <= 2; d++) {
    const n = current + d
    if (n > 1 && n < total) pages.add(n)
  }
  const sorted = [...pages].sort((a, b) => a - b)
  const result = []
  let prev = 0
  for (const n of sorted) {
    if (n - prev > 1) result.push('…')
    result.push(n)
    prev = n
  }
  return result
}

// ── Category accent colors ────────────────────────────────────────────────────
const TAG_COLORS = {
  'Investigación':   { pill: 'bg-primary-50 text-primary-800',   glow: 'rgba(26,86,50,0.20)'  },
  'Eventos':         { pill: 'bg-amber-50 text-amber-700',        glow: 'rgba(247,172,66,0.22)' },
  'Biodiversidad':   { pill: 'bg-emerald-50 text-emerald-700',    glow: 'rgba(16,185,129,0.20)' },
  'Convocatoria':    { pill: 'bg-violet-50 text-violet-700',      glow: 'rgba(139,92,246,0.18)' },
  'Publicaciones':   { pill: 'bg-sky-50 text-sky-700',            glow: 'rgba(56,189,248,0.18)' },
}
const defaultTag = { pill: 'bg-primary-50 text-primary-700', glow: 'rgba(26,86,50,0.18)' }

// ── 3D News Card ──────────────────────────────────────────────────────────────
function NewsCard({ article, featured = false }) {
  const tc = TAG_COLORS[article.tag] ?? defaultTag

  return (
    <motion.div
      variants={staggerItem3D}
      className="h-full"
    >
      <Card3D
        glow={tc.glow}
        intensity={featured ? 4 : 5}
        className={`relative bg-white border border-border/70 rounded-2xl overflow-hidden h-full group cursor-pointer
          ${featured ? 'flex flex-col lg:flex-row' : 'flex flex-col'}`}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Featured image strip */}
        {featured && (
          <div className="lg:w-[46%] shrink-0 relative overflow-hidden bg-forest-950 min-h-[200px] lg:min-h-0">
            <div className="absolute inset-0"
              style={{ background: 'linear-gradient(135deg, #0c1f14 0%, #122e1d 60%, #1A5632 100%)' }}>
              <div className="absolute inset-0 opacity-[0.055]"
                style={{ backgroundImage: 'radial-gradient(circle, #009846 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              <div className="absolute bottom-[-20%] right-[-10%] w-[200px] h-[200px] rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(176,203,31,0.15) 0%, transparent 70%)' }} />
            </div>
            <div className="relative z-10 h-full flex items-center justify-center p-8">
              <div className="text-center">
                <Newspaper className="w-16 h-16 text-green-400/30 mx-auto mb-3" />
                <span className="text-[0.6rem] font-bold uppercase tracking-[0.28em] text-green-400/50">Destacada</span>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <Link to={`/noticias/${article.slug}`}
          className="flex flex-col flex-1 p-6 no-underline">

          <div className="flex items-center justify-between mb-4">
            <span className={`text-[0.62rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${tc.pill}`}>
              {article.tag || 'IIAP'}
            </span>
            {featured && (
              <span className="text-[0.6rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ color: '#B7791F', background: '#FFFBEB' }}>Destacada</span>
            )}
          </div>

          <h3 className={`font-bold text-text leading-snug mb-3 group-hover:text-primary-800 transition-colors
            ${featured ? 'text-xl' : 'text-base'}`}>
            {article.title || article.titulo}
          </h3>

          {featured && (
            <p className="text-sm text-text-muted leading-relaxed mb-4 flex-1 line-clamp-3">
              {article.excerpt || article.resumen}
            </p>
          )}

          <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span>{article.date || article.time}</span>
              {article.author && <><span>·</span><span className="truncate max-w-[120px]">{article.author}</span></>}
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-primary-700 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </Link>
      </Card3D>
    </motion.div>
  )
}

// ── Compact list card (non-featured) ─────────────────────────────────────────
function NewsListItem({ article }) {
  const tc = TAG_COLORS[article.tag] ?? defaultTag

  return (
    <motion.div variants={staggerItem3D}>
      <Link to={`/noticias/${article.slug}`}
        className="group flex items-start gap-4 p-4 bg-white border border-border/60 rounded-xl hover:border-primary-300 hover:shadow-card no-underline transition-all duration-300 block">

        {/* Color accent dot */}
        <div className="w-1 self-stretch rounded-full shrink-0 mt-1"
          style={{ background: article.tag === 'Eventos' ? '#F7AC42' : '#009846', minHeight: 40 }} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-[0.58rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${tc.pill}`}>
              {article.tag || 'IIAP'}
            </span>
            <span className="text-xs text-text-muted">{article.date || article.time}</span>
          </div>
          <h3 className="text-sm font-bold text-text leading-snug group-hover:text-primary-800 transition-colors">
            {article.title || article.titulo}
          </h3>
          {article.author && (
            <p className="text-xs text-text-muted mt-1">{article.author}</p>
          )}
        </div>

        <ArrowRight className="w-4 h-4 text-text-muted/40 group-hover:text-primary-700 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
      </Link>
    </motion.div>
  )
}

export default function Noticias() {
  const { query } = useSearch()
  const [localSearch,    setLocalSearch]    = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [page,           setPage]           = useState(1)
  const [viewMode,       setViewMode]       = useState('grid') // 'grid' | 'list'

  const hasFilter = !!(localSearch || activeCategory || query)

  const { data, isLoading, isError } = useNoticiasList(
    hasFilter
      ? { limit: 200 }
      : { limit: PAGE_SIZE, page },
  )

  const allNews     = data?.data ?? []
  const totalServer = data?.meta?.total ?? allNews.length
  const categories  = [...new Set(allNews.map((a) => a.tag || a.categoria).filter(Boolean))]

  const filtered = hasFilter
    ? allNews.filter((a) => {
        const globalMatch = matches([a.title, a.excerpt, a.tag, a.author, a.category], query)
        const localQ      = localSearch.toLowerCase()
        const localMatch  = !localQ || (a.title || '').toLowerCase().includes(localQ) || (a.author || '').toLowerCase().includes(localQ)
        const catMatch    = !activeCategory || (a.tag === activeCategory || a.category === activeCategory)
        return globalMatch && localMatch && catMatch
      })
    : allNews

  const totalPages = Math.max(1, Math.ceil((hasFilter ? filtered.length : totalServer) / PAGE_SIZE))

  const counts = categories.reduce((acc, c) => {
    acc[c] = allNews.filter((a) => (a.tag || a.categoria) === c).length
    return acc
  }, {})

  const resetFilters = () => { setLocalSearch(''); setActiveCategory(''); setPage(1) }
  const goPage       = (n) => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  // Layout: featured (first) + grid rest
  const [featured, ...restNews] = filtered.slice(0, 13)

  return (
    <div className="space-y-8">

      {/* Header */}
      <motion.div {...fadeUp(0)}>
        <span className="page-header-tag block mb-2">Actualidad Territorial</span>
        <h1 className="page-header-title mb-3">Noticias IIAP</h1>
        <p className="page-header-description max-w-2xl">
          Investigaciones, eventos y novedades del Chocó Biogeográfico y el Instituto
          de Investigaciones Ambientales del Pacífico.
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div {...fadeUp(0.08)} className="space-y-3">
        <div className="flex gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            <input type="text" placeholder="Buscar noticias..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-9 pr-10 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition" />
            {localSearch && (
              <button onClick={() => setLocalSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-white border border-border rounded-xl p-1">
            {['grid', 'list'].map((mode) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === mode
                    ? 'bg-primary-800 text-white shadow-sm'
                    : 'text-text-muted hover:text-text'
                }`}>
                {mode === 'grid' ? '⊞ Grid' : '≡ Lista'}
              </button>
            ))}
          </div>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setActiveCategory(''); setPage(1) }}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all active:scale-[0.96] ${
              !activeCategory
                ? 'bg-primary-800 text-white border-primary-800'
                : 'bg-white text-text-muted border-border hover:border-primary-400 hover:text-primary-800'
            }`}>
            Todas <span className="ml-1 opacity-70">{hasFilter ? allNews.length : totalServer}</span>
          </button>

          {categories.map((cat) => {
            return (
              <button key={cat}
                onClick={() => { setActiveCategory(activeCategory === cat ? '' : cat); setPage(1) }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all active:scale-[0.96] ${
                  activeCategory === cat
                    ? 'bg-primary-800 text-white border-primary-800'
                    : 'bg-white text-text-muted border-border hover:border-primary-400 hover:text-primary-800'
                }`}>
                {cat} <span className="ml-1 opacity-70">{counts[cat]}</span>
              </button>
            )
          })}

          {hasFilter && (
            <button onClick={resetFilters}
              className="text-xs font-semibold text-text-muted hover:text-red-500 transition-colors flex items-center gap-1 ml-1">
              <X className="w-3 h-3" /> Limpiar
            </button>
          )}
        </div>

        {hasFilter && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-xs text-text-muted">
            {filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}
            {activeCategory && <> en <strong className="text-text">{activeCategory}</strong></>}
            {localSearch && <> para <strong className="text-text">"{localSearch}"</strong></>}
          </motion.p>
        )}
      </motion.div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-2 border-primary-200 border-t-primary-800 rounded-full"
          />
        </div>
      ) : isError ? (
        <motion.div {...fadeUp(0.1)} className="py-16 text-center text-text-muted">
          <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No se pudo cargar las noticias. Verifique su conexión.</p>
        </motion.div>
      ) : filtered.length === 0 ? (
        <motion.div {...fadeUp(0.1)} className="py-16 text-center text-text-muted">
          <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm mb-3">No se encontraron noticias</p>
          {hasFilter && (
            <button onClick={resetFilters}
              className="text-xs font-semibold text-primary-800 hover:text-primary-600 transition-colors">
              Limpiar filtros
            </button>
          )}
        </motion.div>
      ) : viewMode === 'list' ? (
        /* ── List view ── */
        <motion.div
          variants={staggerContainer()}
          initial="initial"
          animate="animate"
          className="space-y-2"
        >
          {filtered.map((article, i) => (
            <NewsListItem key={article.id} article={article} index={i} />
          ))}
        </motion.div>
      ) : (
        /* ── Grid view: featured + stagger grid ── */
        <motion.div
          variants={staggerContainer(0.06, 0.05)}
          initial="initial"
          animate="animate"
          className="space-y-4"
        >
          {/* Featured first item */}
          {featured && !hasFilter && (
            <NewsCard article={featured} index={0} featured />
          )}

          {/* Grid rest */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(hasFilter ? filtered : restNews).slice(0, 12).map((article, i) => (
              <NewsCard key={article.id} article={article} index={i} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Paginación */}
      {!hasFilter && totalPages > 1 && (
        <motion.div {...fadeUp(0.12)} className="flex items-center justify-between pt-2">
          <span className="text-xs text-text-muted">
            Página {page} de {totalPages} · {totalServer} noticias
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goPage(page - 1)}
              disabled={page === 1}
              className="p-2 rounded-lg border border-border text-text-muted hover:text-primary-800 hover:border-primary-800 disabled:opacity-40 transition-all active:scale-[0.96]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {buildPageButtons(page, totalPages).map((item, i) =>
              item === '…' ? (
                <span key={`ellipsis-${i}`} className="w-8 text-center text-xs text-text-muted select-none">…</span>
              ) : (
                <button key={item} onClick={() => goPage(item)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all active:scale-[0.96] ${
                    item === page
                      ? 'bg-primary-800 text-white shadow-sm'
                      : 'border border-border text-text-muted hover:border-primary-800 hover:text-primary-800'
                  }`}>
                  {item}
                </button>
              )
            )}
            <button
              onClick={() => goPage(page + 1)}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-border text-text-muted hover:text-primary-800 hover:border-primary-800 disabled:opacity-40 transition-all active:scale-[0.96]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
