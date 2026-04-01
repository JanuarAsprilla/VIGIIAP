import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, User, Tag } from 'lucide-react'
import { ALL_NEWS } from '@/lib/constants'

export default function NoticiaDetalle() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const article = ALL_NEWS.find((n) => n.slug === slug)

  if (!article) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-text mb-2">Noticia no encontrada</h2>
          <Link to="/noticias" className="text-sm text-primary-800 no-underline hover:underline">
            Volver a noticias
          </Link>
        </div>
      </div>
    )
  }

  const tagColors = {
    primary: 'bg-primary-100 text-primary-800',
    gold: 'bg-gold-300/20 text-gold-500',
  }

  // Split content by paragraphs
  const paragraphs = article.content.split('\n\n')

  return (
    <div className="space-y-6">
      {/* Back button */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-primary-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
      </motion.div>

      {/* Article card overlay style */}
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white border border-border rounded-2xl overflow-hidden max-w-3xl"
      >
        {/* Header bar */}
        <div className="bg-gradient-to-r from-primary-800 to-primary-700 px-8 py-6">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 ${tagColors[article.tagColor] || tagColors.primary}`}>
            {article.tag}
          </span>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-white leading-tight">
            {article.title}
          </h1>
        </div>

        {/* Meta bar */}
        <div className="flex flex-wrap items-center gap-4 px-8 py-4 border-b border-border bg-bg-alt/50">
          <div className="flex items-center gap-1.5 text-sm text-text-muted">
            <Calendar className="w-4 h-4" />
            <span>{article.date}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-text-muted">
            <User className="w-4 h-4" />
            <span>{article.author}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-text-muted">
            <Tag className="w-4 h-4" />
            <span>{article.category}</span>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-8">
          <div className="space-y-4">
            {paragraphs.map((paragraph, i) => (
              <p key={i} className="text-[0.95rem] text-text-light leading-[1.8]">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-border bg-bg-alt/30 flex items-center justify-between">
          <Link
            to="/noticias"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-800 no-underline hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Todas las noticias
          </Link>
          <span className="text-xs text-text-muted">{article.time}</span>
        </div>
      </motion.article>
    </div>
  )
}