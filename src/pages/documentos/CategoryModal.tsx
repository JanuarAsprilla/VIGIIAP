import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Search, ArrowUpDown, Eye, Download, X, BookOpen } from 'lucide-react'
import { categoryIcons, CATEGORY_COLORS, typeStyles, SORT_OPTIONS } from './documentos.constants'
import { useClickOutside } from './documentos.utils'
import type { CategoryItem, DocItem } from './documentos.utils'
import { matches } from '@/lib/search'

function FileIcon({ type }: { type: string }) {
  const s = (typeStyles as Record<string, typeof typeStyles.pdf>)[type] || typeStyles.pdf
  return (
    <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${s.bg}`}>
      <FileText className={`w-4 h-4 ${s.text}`} />
    </div>
  )
}

interface DocRowProps {
  doc: DocItem
  onPreview: (doc: DocItem) => void
  onDownload: (doc: DocItem) => void
}

function DocRow({ doc, onPreview, onDownload }: DocRowProps) {
  return (
    <tr className="border-b border-border last:border-b-0 hover:bg-bg-alt/50 transition-colors">
      <td className="py-3 pr-4">
        <div className="flex items-center gap-3">
          <FileIcon type={doc.type} />
          <button
            onClick={() => onPreview(doc)}
            className="text-sm font-medium text-primary-800 hover:underline text-left"
          >
            {doc.name}
          </button>
        </div>
      </td>
      <td className="py-3 pr-4 hidden sm:table-cell">
        <span className="text-sm text-text-muted">{doc.size}</span>
      </td>
      <td className="py-3 pr-4 hidden md:table-cell">
        <span className="text-sm text-text-muted">{doc.updated}</span>
      </td>
      <td className="py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPreview(doc)}
            className="w-8 h-8 rounded-lg border border-border bg-[var(--card-bg)] flex items-center justify-center text-text-muted hover:bg-primary-800 hover:border-primary-800 hover:text-white transition-colors"
            title="Vista previa"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDownload(doc)}
            className="w-8 h-8 rounded-lg border border-border bg-[var(--card-bg)] flex items-center justify-center text-text-muted hover:bg-primary-800 hover:border-primary-800 hover:text-white transition-colors"
            title="Descargar"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

interface CategoryModalProps {
  category: CategoryItem
  onClose: () => void
  onPreview: (doc: DocItem, catTitle: string) => void
  onDownload: (doc: DocItem) => void
}

export function CategoryModal({ category, onClose, onPreview, onDownload }: CategoryModalProps) {
  const Icon = (categoryIcons as Record<string, typeof BookOpen>)[category.icon ?? ''] || BookOpen
  const colors = (CATEGORY_COLORS as Record<string, typeof CATEGORY_COLORS.default>)[category.title] || CATEGORY_COLORS.default
  const [localQuery, setLocalQuery] = useState('')
  const [sortBy, setSortBy] = useState('name-asc')
  const [showSort, setShowSort] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  // Focus trap: keep Tab cycling within the modal while it is open
  useEffect(() => {
    const el = modalRef.current
    if (!el) return

    const focusable = el.querySelectorAll(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last  = focusable[focusable.length - 1]

    ;(first as HTMLElement)?.focus()

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); (last as HTMLElement)?.focus() }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); (first as HTMLElement)?.focus() }
      }
    }

    el.addEventListener('keydown', handleTab)
    return () => el.removeEventListener('keydown', handleTab)
  }, [])

  useClickOutside(sortRef, () => setShowSort(false))

  let docs = category.docs.filter((d) => matches([d.name], localQuery))
  docs = [...docs].sort((a, b) => {
    if (sortBy === 'name-asc')  return a.name.localeCompare(b.name)
    if (sortBy === 'name-desc') return b.name.localeCompare(a.name)
    if (sortBy === 'date-desc') return new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()
    if (sortBy === 'date-asc')  return new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime()
    return 0
  })

  const activeSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? 'Ordenar'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.98 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="bg-[var(--card-bg)] w-full sm:rounded-2xl sm:max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        <div
          className="px-6 py-5 shrink-0"
          style={{ background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%)` }}
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 id="category-modal-title" className="text-white font-bold text-lg leading-tight">{category.title}</h2>
              <p className="text-white/70 text-sm mt-0.5">
                {category.docs.length} documento{category.docs.length !== 1 ? 's' : ''} en esta categoría
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-3 border-b border-border flex items-center gap-3 shrink-0 bg-[var(--card-bg)]">
          <div className="flex items-center gap-2 bg-bg-alt border border-border rounded-lg px-3 py-2 flex-1 min-w-0">
            <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <input
              type="text"
              placeholder="Buscar documento..."
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-text w-full placeholder:text-text-muted"
              autoFocus
            />
            {localQuery && (
              <button onClick={() => setLocalQuery('')} className="text-text-muted hover:text-text">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="relative shrink-0" ref={sortRef}>
            <button
              onClick={() => setShowSort((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                showSort
                  ? 'bg-primary-800 border-primary-800 text-white'
                  : 'border-border text-text hover:border-primary-800 hover:text-primary-800'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{activeSortLabel}</span>
            </button>
            <AnimatePresence>
              {showSort && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-44 bg-[var(--card-bg)] border border-border rounded-xl shadow-lg z-20 py-1"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortBy(opt.value); setShowSort(false) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-bg-alt transition-colors text-sm text-text"
                    >
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        sortBy === opt.value ? 'border-primary-800' : 'border-border'
                      }`}>
                        {sortBy === opt.value && <span className="w-2 h-2 rounded-full bg-primary-800" />}
                      </span>
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {docs.length > 0 ? (
            <div className="px-6 py-4">
              <table className="w-full" aria-label={`Documentos en ${category?.title ?? 'esta categoría'}`}>
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-text-muted pb-3 pr-4">Archivo</th>
                    <th className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-text-muted pb-3 pr-4 hidden sm:table-cell">Tamaño</th>
                    <th className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-text-muted pb-3 pr-4 hidden md:table-cell">Actualización</th>
                    <th className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-text-muted pb-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((doc, i) => (
                    <DocRow
                      key={i}
                      doc={doc}
                      onPreview={(d) => onPreview(d, category.title)}
                      onDownload={onDownload}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div role="status" className="py-14 text-center text-text-muted">
              <FileText className="w-8 h-8 mx-auto mb-3 opacity-30" aria-hidden="true" />
              <p className="text-sm">
                No se encontraron documentos{localQuery && <> para &quot;{localQuery}&quot;</>}
              </p>
              {localQuery && (
                <button
                  onClick={() => setLocalQuery('')}
                  className="mt-3 text-sm font-medium text-primary-800 hover:underline"
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-between bg-bg-alt/40">
          <span className="text-xs text-text-muted">
            {docs.length < category.docs.length
              ? `${docs.length} de ${category.docs.length} documentos`
              : `${category.docs.length} documento${category.docs.length !== 1 ? 's' : ''} en total`
            }
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text transition-colors"
          >
            Cerrar
          </button>
        </div>
      </motion.div>
    </div>
  )
}
