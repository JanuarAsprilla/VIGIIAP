import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Newspaper, Search, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useNoticiasList } from '@/hooks/useNoticias'
import { useSearch } from '@/contexts/SearchContext'
import { matches } from '@/lib/search'

const PAGE_SIZE = 12

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
})

function NewsCard({ article, index }) {
  return (
    <motion.div
      key={article.id}
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      layout>
      <Link to={`/noticias/${article.slug}`}
        className="block bg-white border border-border rounded-xl p-6 hover:shadow-card transition-shadow no-underline group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[0.7rem] font-bold uppercase tracking-wider text-primary-700">
            {article.tag}
          </span>
          <span className="text-xs text-text-muted bg-bg-alt px-2 py-0.5 rounded-full">
            {article.category}
          </span>
        </div>
        <h3 className="text-lg font-bold text-text leading-snug mb-2 group-hover:text-primary-800 transition-colors">
          {article.title}
        </h3>
        <p className="text-[0.9rem] text-text-muted leading-relaxed mb-4">{article.excerpt}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span>{article.date}</span>
            <span>·</span>
            <span>{article.author}</span>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-primary-800 uppercase tracking-wider group-hover:gap-2 transition-all">
            Leer más <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </Link>
    </motion.div>
  )
}

export default function Noticias() {
  const { query } = useSearch()
  const [localSearch,    setLocalSearch]    = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [page,           setPage]           = useState(1)

  const hasFilter = !!(localSearch || activeCategory || query)

  // Cuando hay filtros locales cargamos más para filtrar en cliente;
  // sin filtros usamos paginación real del servidor.
  const { data, isLoading, isError } = useNoticiasList(
    hasFilter
      ? { limit: 200 }
      : { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE },
  )

  const allNews    = data?.data ?? []
  const totalServer = data?.meta?.total ?? allNews.length
  const categories = [...new Set(allNews.map((a) => a.category).filter(Boolean))]

  const filtered = hasFilter
    ? allNews.filter((a) => {
        const globalMatch = matches([a.title, a.excerpt, a.tag, a.author, a.category], query)
        const localQ      = localSearch.toLowerCase()
        const localMatch  = !localQ || a.title.toLowerCase().includes(localQ) || a.author.toLowerCase().includes(localQ)
        const catMatch    = !activeCategory || a.category === activeCategory
        return globalMatch && localMatch && catMatch
      })
    : allNews

  const total      = hasFilter ? filtered.length : totalServer
  const totalPages = Math.max(1, Math.ceil((hasFilter ? filtered.length : totalServer) / PAGE_SIZE))

  const counts = categories.reduce((acc, c) => {
    acc[c] = allNews.filter((a) => a.category === c).length
    return acc
  }, {})

  const resetFilters = () => { setLocalSearch(''); setActiveCategory(''); setPage(1) }
  const goPage       = (n) => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  return (
    <div className="space-y-8">
      <motion.div {...fadeUp(0)}>
        <span className="page-header-tag block mb-2">Actualidad Territorial</span>
        <h1 className="page-header-title mb-3">Noticias Territoriales</h1>
        <p className="page-header-description max-w-2xl">
          Mantente al día con las últimas actualizaciones de datos, eventos regionales
          y novedades del sistema de información territorial.
        </p>
      </motion.div>

      <motion.div {...fadeUp(0.08)} className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input type="text" placeholder="Buscar noticias..." value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-9 pr-10 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition" />
          {localSearch && (
            <button onClick={() => setLocalSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => { setActiveCategory(''); setPage(1) }}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${!activeCategory ? 'bg-primary-800 text-white border-primary-800' : 'bg-white text-text-muted border-border hover:border-primary-400 hover:text-primary-800'}`}>
            Todas <span className="ml-1 opacity-70">{hasFilter ? allNews.length : totalServer}</span>
          </button>
          {categories.map((cat) => (
            <button key={cat} onClick={() => { setActiveCategory(activeCategory === cat ? '' : cat); setPage(1) }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${activeCategory === cat ? 'bg-primary-800 text-white border-primary-800' : 'bg-white text-text-muted border-border hover:border-primary-400 hover:text-primary-800'}`}>
              {cat} <span className="ml-1 opacity-70">{counts[cat]}</span>
            </button>
          ))}
          {hasFilter && (
            <button onClick={resetFilters} className="text-xs font-semibold text-text-muted hover:text-red-500 transition-colors flex items-center gap-1 ml-1">
              <X className="w-3 h-3" /> Limpiar
            </button>
          )}
        </div>
      </motion.div>

      {hasFilter && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-text-muted">
          {filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}
          {activeCategory && <> en <strong className="text-text">{activeCategory}</strong></>}
          {localSearch && <> para <strong className="text-text">"{localSearch}"</strong></>}
        </motion.p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-800 animate-spin" />
        </div>
      ) : isError ? (
        <motion.div {...fadeUp(0.1)} className="py-16 text-center text-text-muted">
          <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No se pudo cargar las noticias. Verifique su conexión.</p>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          {filtered.length > 0 ? (
            <div className="space-y-4">
              {filtered.map((article, i) => (
                <NewsCard key={article.id} article={article} index={i} />
              ))}
            </div>
          ) : (
            <motion.div key="empty" {...fadeUp(0.1)} className="py-16 text-center text-text-muted">
              <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No se encontraron noticias</p>
              {hasFilter && (
                <button onClick={resetFilters} className="mt-3 text-xs font-semibold text-primary-800 hover:text-primary-600 transition-colors">
                  Limpiar filtros
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Paginación — solo visible cuando no hay filtros activos */}
      {!hasFilter && totalPages > 1 && (
        <motion.div {...fadeUp(0.1)} className="flex items-center justify-between pt-2">
          <span className="text-xs text-text-muted">
            Página {page} de {totalPages} · {totalServer} noticias
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goPage(page - 1)}
              disabled={page === 1}
              className="p-2 rounded-lg border border-border text-text-muted hover:text-primary-800 hover:border-primary-800 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => goPage(n)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${n === page ? 'bg-primary-800 text-white' : 'border border-border text-text-muted hover:border-primary-800 hover:text-primary-800'}`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => goPage(page + 1)}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-border text-text-muted hover:text-primary-800 hover:border-primary-800 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
