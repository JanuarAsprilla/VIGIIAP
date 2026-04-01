import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Newspaper } from 'lucide-react'
import { ALL_NEWS } from '@/lib/constants'
import { useSearch } from '@/contexts/SearchContext'
import { matches } from '@/lib/search'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
})

function NewsCard({ article, index }) {
  const tagColors = {
    primary: 'text-primary-700',
    gold: 'text-gold-500',
  }

  return (
    <motion.div {...fadeUp(0.05 + index * 0.05)}>
      <Link
        to={`/noticias/${article.slug}`}
        className="block bg-white border border-border rounded-xl p-6 hover:shadow-card transition-shadow no-underline group"
      >
        {/* Tag + category */}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-[0.7rem] font-bold uppercase tracking-wider ${tagColors[article.tagColor] || tagColors.primary}`}>
            {article.tag}
          </span>
          <span className="text-xs text-text-muted bg-bg-alt px-2 py-0.5 rounded-full">
            {article.category}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-text leading-snug mb-2 group-hover:text-primary-800 transition-colors">
          {article.title}
        </h3>

        {/* Excerpt */}
        <p className="text-[0.9rem] text-text-muted leading-relaxed mb-4">
          {article.excerpt}
        </p>

        {/* Meta */}
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
  const filteredNews = ALL_NEWS.filter((a) =>
    matches([a.title, a.excerpt, a.tag, a.author, a.category], query)
  )

  return (
    <div className="space-y-8">
      <motion.div {...fadeUp(0)}>
        <span className="page-header-tag block mb-2">Actualidad Territorial</span>
        <h1 className="page-header-title mb-3">Noticias Territoriales</h1>
        <p className="page-header-description max-w-2xl">
          Mantente al día con las últimas actualizaciones de datos, eventos regionales
          y novedades del sistema de información territorial del Chocó Biogeográfico.
        </p>
      </motion.div>

      <div className="space-y-4">
        {filteredNews.length > 0 ? filteredNews.map((article, i) => (
          <NewsCard key={article.id} article={article} index={i} />
        )) : (
          <motion.div {...fadeUp(0.1)} className="py-16 text-center text-text-muted">
            <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No se encontraron noticias para <strong className="text-text">"{query}"</strong></p>
          </motion.div>
        )}
      </div>
    </div>
  )
}