/* Hallmark · macrostructure: Workbench · genre: data-catalog
 * tokens: design.md · stamp: 2026-05-25
 */
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, FileSpreadsheet, Search, SlidersHorizontal, ArrowUpDown, ArrowRight,
  Eye, Download,
  Waves, BookOpen, TrendingUp,
  Map as MapIcon, Leaf, Scale, ClipboardList, ClipboardCheck,
  Headphones, X, Check, Send, CheckCircle, Loader2,
} from 'lucide-react'
import { useSearch } from '@/contexts/SearchContext'
import { useAuth } from '@/contexts/AuthContext'
import { matches } from '@/lib/search'
import { useToast, ToastContainer } from '@/components/Toast'
import { useDocumentosList } from '@/hooks/useDocumentos'

// Meta por categoría — debe coincidir con CATEGORIES en GestionDocumentos.jsx
const CATEGORY_META = {
  default:                  { icon: 'BookOpen' },
  'Cartografía':            { icon: 'MapIcon' },
  'Estudios Ambientales':   { icon: 'Leaf' },
  'Normativa':              { icon: 'Scale' },
  'Informes Técnicos':      { icon: 'ClipboardList' },
  'Biodiversidad':          { icon: 'Leaf' },
  'Hidrología':             { icon: 'Waves' },
  'Protocolos Ambientales': { icon: 'ClipboardCheck' },
  'Bibliografía Técnica':   { icon: 'BookOpen' },
  'Análisis de Tendencias': { icon: 'TrendingUp' },
  'Formatos y Plantillas':  { icon: 'FileSpreadsheet' },
}

const CATEGORY_COLORS = {
  'Cartografía':            { from: '#1B4332', to: '#2D6A4F' },
  'Estudios Ambientales':   { from: '#7C2D12', to: '#C2410C' },
  'Normativa':              { from: '#1E3A5F', to: '#1D4ED8' },
  'Informes Técnicos':      { from: '#78350F', to: '#B45309' },
  'Biodiversidad':          { from: '#14532D', to: '#15803D' },
  'Hidrología':             { from: '#1E3A8A', to: '#0284C7' },
  'Protocolos Ambientales': { from: '#1B4332', to: '#40916C' },
  'Bibliografía Técnica':   { from: '#0F766E', to: '#0D9488' },
  'Análisis de Tendencias': { from: '#4C1D95', to: '#7C3AED' },
  'Formatos y Plantillas':  { from: '#92400E', to: '#D4A373' },
  default:                  { from: '#1B4332', to: '#52B788' },
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
})

const categoryIcons = { MapIcon, Leaf, Scale, ClipboardList, ClipboardCheck, FileSpreadsheet, Waves, BookOpen, TrendingUp }

const typeStyles = {
  pdf:  { bg: 'bg-red-50',   text: 'text-red-500',   label: 'PDF' },
  docx: { bg: 'bg-blue-50',  text: 'text-blue-500',  label: 'Word' },
  xlsx: { bg: 'bg-green-50', text: 'text-green-600', label: 'Excel' },
}

const SORT_OPTIONS = [
  { value: 'name-asc',  label: 'Nombre A–Z' },
  { value: 'name-desc', label: 'Nombre Z–A' },
  { value: 'date-desc', label: 'Más reciente' },
  { value: 'date-asc',  label: 'Más antiguo' },
]

// ── File type icon ──
function FileIcon({ type }) {
  const s = typeStyles[type] || typeStyles.pdf
  return (
    <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${s.bg}`}>
      <FileText className={`w-4 h-4 ${s.text}`} />
    </div>
  )
}

async function forceDownload(url, filename) {
  if (!url) return
  const name = filename || url.split('?')[0].split('/').pop() || 'archivo'
  try {
    const res  = await fetch(url)
    const blob = await res.blob()
    const tmp  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = tmp
    a.download = name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(tmp)
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

// ── Preview Modal ──
function PreviewModal({ doc, categoryTitle, onClose }) {
  const s = typeStyles[doc.type] || typeStyles.pdf
  const isImage  = doc.url && /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(doc.url)
  const isPdf    = doc.type === 'pdf'
  const isOffice = doc.type === 'docx' || doc.type === 'doc' || doc.type === 'xlsx' || doc.type === 'xls'
  const OfficeIcon = (doc.type === 'xlsx' || doc.type === 'xls') ? FileSpreadsheet : FileText

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${s.bg} ${s.text}`}>
              {s.label}
            </span>
            <span className="text-sm font-semibold text-text truncate max-w-xs">{doc.name}</span>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:bg-bg-alt transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {doc.url ? (
          <div className="w-full">
            {isImage ? (
              <div className="p-4 flex justify-center bg-bg-alt">
                <img src={doc.url} alt={doc.name}
                  className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-sm" />
              </div>
            ) : isPdf ? (
              <div className="p-6 flex flex-col items-center gap-4 text-center">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${s.bg}`}>
                  <FileText className={`w-8 h-8 ${s.text}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-text mb-1">{doc.name}</p>
                  <p className="text-xs text-text-muted">{categoryTitle}</p>
                </div>
                <div className="flex gap-3">
                  <a href={doc.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">
                    <Eye className="w-4 h-4" />
                    Visualizar PDF
                  </a>
                  <button onClick={() => forceDownload(doc.url, `${doc.name}.${doc.type}`)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-50 border border-primary-200 text-primary-800 rounded-lg text-sm font-semibold hover:bg-primary-100 transition-colors">
                    <Download className="w-4 h-4" />
                    Descargar
                  </button>
                </div>
              </div>
            ) : isOffice ? (
              <div className="p-6 flex flex-col items-center gap-4 text-center">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${s.bg}`}>
                  <OfficeIcon className={`w-8 h-8 ${s.text}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-text mb-1">{doc.name}</p>
                  <p className="text-xs text-text-muted mb-1">{categoryTitle}</p>
                  <p className="text-xs text-text-muted">Los archivos {s.label} no se pueden previsualizar en el navegador.</p>
                </div>
                <button onClick={() => forceDownload(doc.url, `${doc.name}.${doc.type}`)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">
                  <Download className="w-4 h-4" />
                  Descargar {s.label}
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="px-6 py-10 flex flex-col items-center text-center text-text-muted">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${s.bg}`}>
              <FileText className={`w-7 h-7 ${s.text}`} />
            </div>
            <p className="text-sm font-medium text-text mb-1">{doc.name}</p>
            <p className="text-xs">Archivo no disponible</p>
          </div>
        )}

        <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs text-text-muted">
            {doc.updated && <span>Actualizado: {doc.updated}</span>}
            {categoryTitle && <span>{categoryTitle}</span>}
          </div>
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text transition-colors">
            Cerrar
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Document Table Row ──
function DocRow({ doc, onPreview, onDownload }) {
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
            className="w-8 h-8 rounded-lg border border-border bg-white flex items-center justify-center text-text-muted hover:bg-primary-800 hover:border-primary-800 hover:text-white transition-colors"
            title="Vista previa"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDownload(doc)}
            className="w-8 h-8 rounded-lg border border-border bg-white flex items-center justify-center text-text-muted hover:bg-primary-800 hover:border-primary-800 hover:text-white transition-colors"
            title="Descargar"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ── useClickOutside ──
function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => { if (ref.current && !ref.current.contains(e.target)) handler() }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [ref, handler])
}

// ── Category Card ──
function CategoryCard({ category, filteredCount, onOpen, index }) {
  const Icon = categoryIcons[category.icon] || BookOpen
  const colors = CATEGORY_COLORS[category.title] || CATEGORY_COLORS.default
  const hasFilter = filteredCount !== null

  return (
    <motion.button
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05 + index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      onClick={onOpen}
      className="group relative w-full text-left rounded-2xl overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-800 focus-visible:ring-offset-2"
      style={{ aspectRatio: '4 / 3' }}
    >
      {/* Background — zooms on hover */}
      <div className="absolute inset-0 scale-100 group-hover:scale-110 transition-transform duration-700 ease-out">
        {category.thumbnail ? (
          <img src={category.thumbnail} alt="" className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: `linear-gradient(145deg, ${colors.from} 0%, ${colors.to} 100%)` }}
          />
        )}
        {/* Highlight blobs */}
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: `radial-gradient(ellipse at 15% 85%, rgba(255,255,255,0.35) 0%, transparent 55%),
                              radial-gradient(ellipse at 85% 10%, rgba(255,255,255,0.12) 0%, transparent 50%)`,
          }}
        />
      </div>

      {/* Dark vignette overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Hover tint */}
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-5">
        {/* Top: icon + count badge */}
        <div className="flex items-start justify-between">
          <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <Icon className="w-4 h-4 text-white" />
          </div>
          <span className="text-[0.7rem] text-white/90 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full font-semibold leading-none">
            {hasFilter
              ? `${filteredCount} / ${category.docs.length}`
              : `${category.docs.length} doc${category.docs.length !== 1 ? 's' : ''}`
            }
          </span>
        </div>

        {/* Bottom: title + CTA */}
        <div>
          <h3 className="text-white font-bold text-sm sm:text-base leading-snug mb-2 drop-shadow-sm">
            {category.title}
          </h3>
          <div className="flex items-center gap-1.5 text-white/0 group-hover:text-white/90 translate-y-1 group-hover:translate-y-0 transition-all duration-300 text-xs sm:text-sm font-semibold">
            <span>Ver documentos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </motion.button>
  )
}

// ── Category Documents Modal ──
function CategoryModal({ category, onClose, onPreview, onDownload }) {
  const Icon = categoryIcons[category.icon] || BookOpen
  const colors = CATEGORY_COLORS[category.title] || CATEGORY_COLORS.default
  const [localQuery, setLocalQuery] = useState('')
  const [sortBy, setSortBy] = useState('name-asc')
  const [showSort, setShowSort] = useState(false)
  const sortRef = useRef(null)

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  useClickOutside(sortRef, () => setShowSort(false))

  let docs = category.docs.filter((d) => matches([d.name], localQuery))
  docs = [...docs].sort((a, b) => {
    if (sortBy === 'name-asc')  return a.name.localeCompare(b.name)
    if (sortBy === 'name-desc') return b.name.localeCompare(a.name)
    if (sortBy === 'date-desc') return new Date(b.dateISO) - new Date(a.dateISO)
    if (sortBy === 'date-asc')  return new Date(a.dateISO) - new Date(b.dateISO)
    return 0
  })

  const activeSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? 'Ordenar'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.98 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white w-full sm:rounded-2xl sm:max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Gradient header */}
        <div
          className="px-6 py-5 shrink-0"
          style={{ background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%)` }}
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-bold text-lg leading-tight">{category.title}</h2>
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

        {/* Toolbar: search + sort */}
        <div className="px-6 py-3 border-b border-border flex items-center gap-3 shrink-0 bg-white">
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
                  className="absolute right-0 top-full mt-2 w-44 bg-white border border-border rounded-xl shadow-lg z-20 py-1"
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

        {/* Document list */}
        <div className="flex-1 overflow-y-auto">
          {docs.length > 0 ? (
            <div className="px-6 py-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-primary-700 pb-3 pr-4">Archivo</th>
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
            <div className="py-14 text-center text-text-muted">
              <FileText className="w-8 h-8 mx-auto mb-3 opacity-30" />
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

        {/* Footer */}
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

// ── Modal Soporte Documental ──
const CONSULTA_TYPES = [
  { value: '', label: 'Seleccione el tipo de consulta' },
  { value: 'documento-no-encontrado', label: 'Documento no encontrado' },
  { value: 'formato-requerido', label: 'Formato o plantilla requerida' },
  { value: 'acceso-restringido', label: 'Problema de acceso a documento' },
  { value: 'documento-desactualizado', label: 'Documento desactualizado' },
  { value: 'otro', label: 'Otro' },
]

function SoporteDocumentalModal({ onClose }) {
  const { user, isAuthenticated } = useAuth()
  const [step, setStep] = useState('form')
  const [form, setForm] = useState({
    nombre: isAuthenticated ? user.name : '',
    correo: isAuthenticated ? user.email : '',
    tipo: '',
    descripcion: '',
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const set = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'Requerido'
    if (!form.correo.trim()) e.correo = 'Requerido'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) e.correo = 'Correo no válido'
    if (!form.tipo) e.tipo = 'Requerido'
    if (!form.descripcion.trim()) e.descripcion = 'Requerido'
    else if (form.descripcion.trim().length < 20) e.descripcion = 'Mínimo 20 caracteres'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    setStep('success')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="soporte-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        {step === 'success' ? (
          <div className="p-10 text-center">
            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-primary-800" />
            </div>
            <h3 className="font-display text-xl font-bold text-text mb-2">Solicitud Enviada</h3>
            <p className="text-sm text-text-muted leading-relaxed mb-2">
              Su consulta fue recibida correctamente. El equipo de gestión documental
              del IIAP le responderá a{' '}
              <strong className="text-text">{form.correo}</strong>{' '}
              en un plazo máximo de 24 horas hábiles.
            </p>
            <p className="text-xs text-text-muted mb-8">
              También puede comunicarse directamente a{' '}
              <a href="mailto:soportegis@iiap.org.co" className="text-primary-800 hover:underline">
                soportegis@iiap.org.co
              </a>
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors"
            >
              Entendido
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary-800 rounded-lg flex items-center justify-center">
                  <Headphones className="w-4 h-4 text-white" aria-hidden="true" />
                </div>
                <div>
                  <h3 id="soporte-modal-title" className="text-base font-bold text-text leading-tight">
                    Soporte Documental
                  </h3>
                  <p className="text-xs text-text-muted">Gestión de Datos — IIAP</p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-alt transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    Nombre <span className="text-orange-500" aria-hidden="true">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) => set('nombre', e.target.value)}
                    placeholder="Su nombre completo"
                    readOnly={isAuthenticated}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${
                      isAuthenticated ? 'bg-bg-alt cursor-default' : 'bg-white focus:border-primary-800'
                    } ${errors.nombre ? 'border-red-400' : 'border-border'}`}
                  />
                  {errors.nombre && <p className="text-xs text-red-500 mt-1" role="alert">{errors.nombre}</p>}
                </div>
                <div>
                  <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    Correo <span className="text-orange-500" aria-hidden="true">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.correo}
                    onChange={(e) => set('correo', e.target.value)}
                    placeholder="su@correo.com"
                    readOnly={isAuthenticated}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${
                      isAuthenticated ? 'bg-bg-alt cursor-default' : 'bg-white focus:border-primary-800'
                    } ${errors.correo ? 'border-red-400' : 'border-border'}`}
                  />
                  {errors.correo && <p className="text-xs text-red-500 mt-1" role="alert">{errors.correo}</p>}
                </div>
              </div>

              <div>
                <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                  Tipo de consulta <span className="text-orange-500" aria-hidden="true">*</span>
                </label>
                <select
                  value={form.tipo}
                  onChange={(e) => set('tipo', e.target.value)}
                  className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${errors.tipo ? 'border-red-400' : 'border-border focus:border-primary-800'}`}
                >
                  {CONSULTA_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                {errors.tipo && <p className="text-xs text-red-500 mt-1" role="alert">{errors.tipo}</p>}
              </div>

              <div>
                <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                  Descripción <span className="text-orange-500" aria-hidden="true">*</span>
                </label>
                <textarea
                  rows={4}
                  value={form.descripcion}
                  onChange={(e) => set('descripcion', e.target.value)}
                  placeholder="Describa con detalle el documento o formato que necesita, incluyendo el período, territorio o tema de interés..."
                  className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition resize-none ${errors.descripcion ? 'border-red-400' : 'border-border focus:border-primary-800'}`}
                />
                <div className="flex items-center justify-between mt-1">
                  {errors.descripcion
                    ? <p className="text-xs text-red-500" role="alert">{errors.descripcion}</p>
                    : <span />
                  }
                  <span className="text-xs text-text-muted ml-auto">{form.descripcion.length} / 500</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 hover:text-primary-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors"
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                  Enviar Solicitud
                </button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </div>
  )
}

// ── Support CTA ──
function SupportCTA({ onContactar }) {
  return (
    <motion.div
      {...fadeUp(0.5)}
      className="grid grid-cols-1 md:grid-cols-2 rounded-2xl overflow-hidden"
    >
      <div className="bg-primary-100 p-8 flex flex-col justify-center">
        <h3 className="font-display text-2xl font-bold text-primary-900 leading-tight mb-3">
          ¿Necesita soporte documental?
        </h3>
        <p className="text-sm text-primary-800/70 leading-relaxed mb-6">
          Si no encuentra el documento o formato requerido para sus operaciones
          técnicas, contacte con nuestra oficina de gestión de datos.
        </p>
        <div>
          <button
            onClick={onContactar}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-primary-900 rounded-lg text-sm font-semibold hover:bg-primary-800 hover:text-white transition-colors border border-primary-200"
          >
            <Headphones className="w-4 h-4" aria-hidden="true" />
            Contactar Soporte
          </button>
        </div>
      </div>
      <div className="bg-gradient-to-br from-bg-alt to-border min-h-[200px] hidden md:block" />
    </motion.div>
  )
}

// ── Main Documentos Page ──
export default function Documentos() {
  const { query, setQuery } = useSearch()
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [showSoporte, setShowSoporte] = useState(false)
  const [activeTypes, setActiveTypes] = useState([])
  const [showFilter, setShowFilter] = useState(false)
  const [previewDoc, setPreviewDoc] = useState(null)
  const [previewCategory, setPreviewCategory] = useState('')

  const filterRef = useRef(null)
  useClickOutside(filterRef, () => setShowFilter(false))

  const { toasts, toast, dismiss } = useToast()
  const handleDownload = async (doc) => {
    await forceDownload(doc.url, `${doc.name}.${doc.type}`)
    toast(`Descargando "${doc.name}"`, 'success')
  }

  const toggleType = (type) => {
    setActiveTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  // ── Real data from API ──
  const { data, isLoading, isError } = useDocumentosList({ limit: 200 })
  const allDocs = data?.data ?? []

  const allCategories = (() => {
    const map = {}
    allDocs.forEach((d) => {
      const catName = d.categoria || 'General'
      if (!map[catName]) {
        const meta = CATEGORY_META[catName] ?? CATEGORY_META.default
        map[catName] = {
          id:        catName.toLowerCase().replace(/\s+/g, '-'),
          title:     catName,
          icon:      meta.icon,
          thumbnail: d.categoria_thumbnail_url ?? null,
          docs:      [],
        }
      } else if (!map[catName].thumbnail && d.categoria_thumbnail_url) {
        map[catName].thumbnail = d.categoria_thumbnail_url
      }
      map[catName].docs.push({
        name:    d.nombre,
        type:    d.type,
        size:    d.tamano ?? '—',
        updated: d.fecha,
        dateISO: d.creado_en ?? '',
        url:     d.url,
      })
    })
    return Object.values(map)
  })()

  // Categories with filtered doc counts (for badge on card)
  const isFiltering = query.trim() !== '' || activeTypes.length > 0
  const displayCategories = allCategories.map((cat) => {
    let filtered = cat.docs.filter((d) => matches([d.name, cat.title], query))
    if (activeTypes.length > 0) filtered = filtered.filter((d) => activeTypes.includes(d.type))
    return { ...cat, filteredDocs: filtered }
  }).filter((cat) => !isFiltering || cat.filteredDocs.length > 0)

  const openCategory = (cat) => {
    // always open full (unfiltered) category so user can browse all docs
    setSelectedCategory(allCategories.find((c) => c.id === cat.id) || cat)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div {...fadeUp(0)}>
        <span className="page-header-tag block mb-2">Repositorio Institucional</span>
        <h1 className="page-header-title mb-3">Centro de <em>Documentos</em></h1>
        <p className="page-header-description max-w-2xl">
          Acceda a la biblioteca técnica y normativa del Sistema de Información
          Territorial del Chocó. Un espacio inmersivo para la gestión del conocimiento biogeográfico.
        </p>
      </motion.div>

      {/* Search & Filter Bar */}
      <motion.div {...fadeUp(0.1)} className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-border rounded-lg px-4 py-2.5 flex-1">
          <Search className="w-4 h-4 text-text-muted shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nombre, categoría o tipo..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-text w-full placeholder:text-text-muted"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-text-muted hover:text-text transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="relative shrink-0" ref={filterRef}>
          <button
            onClick={() => setShowFilter((v) => !v)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
              showFilter || activeTypes.length > 0
                ? 'bg-primary-800 border-primary-800 text-white'
                : 'bg-white border-border text-text hover:border-primary-800 hover:text-primary-800'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
            {activeTypes.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-white text-primary-800 text-xs font-bold flex items-center justify-center">
                {activeTypes.length}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showFilter && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-52 bg-white border border-border rounded-xl shadow-lg z-20 overflow-hidden"
              >
                <div className="px-4 pt-3 pb-1">
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted">
                    Tipo de Archivo
                  </span>
                </div>
                {[
                  { value: 'pdf',  label: 'PDF' },
                  { value: 'docx', label: 'Word (DOCX)' },
                  { value: 'xlsx', label: 'Excel (XLSX)' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => toggleType(value)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-bg-alt transition-colors text-sm text-text"
                  >
                    <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      activeTypes.includes(value) ? 'bg-primary-800 border-primary-800' : 'border-border'
                    }`}>
                      {activeTypes.includes(value) && <Check className="w-3 h-3 text-white" />}
                    </span>
                    {label}
                  </button>
                ))}
                {activeTypes.length > 0 && (
                  <div className="px-4 py-2.5 border-t border-border">
                    <button
                      onClick={() => setActiveTypes([])}
                      className="text-xs font-medium text-text-muted hover:text-primary-800 transition-colors"
                    >
                      Limpiar filtros
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Category Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-primary-800 animate-spin" />
        </div>
      ) : isError ? (
        <motion.div {...fadeUp(0.1)} className="py-16 text-center text-text-muted">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No se pudo cargar los documentos. Verifique su conexión.</p>
        </motion.div>
      ) : displayCategories.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayCategories.map((cat, i) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              filteredCount={isFiltering ? cat.filteredDocs.length : null}
              onOpen={() => openCategory(cat)}
              index={i}
            />
          ))}
        </div>
      ) : (
        <motion.div {...fadeUp(0.1)} className="py-16 text-center text-text-muted">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            No se encontraron documentos
            {query && <> para <strong className="text-text">&quot;{query}&quot;</strong></>}
            {activeTypes.length > 0 && <> con los filtros seleccionados</>}
          </p>
          {isFiltering && (
            <button
              onClick={() => { setQuery(''); setActiveTypes([]) }}
              className="mt-3 text-sm font-medium text-primary-800 hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </motion.div>
      )}

      {/* Support CTA */}
      <SupportCTA onContactar={() => setShowSoporte(true)} />

      {/* Category Documents Modal */}
      <AnimatePresence>
        {selectedCategory && (
          <CategoryModal
            category={selectedCategory}
            onClose={() => setSelectedCategory(null)}
            onPreview={(doc, catTitle) => { setPreviewDoc(doc); setPreviewCategory(catTitle) }}
            onDownload={handleDownload}
          />
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewDoc && (
          <PreviewModal
            doc={previewDoc}
            categoryTitle={previewCategory}
            onClose={() => { setPreviewDoc(null); setPreviewCategory('') }}
          />
        )}
      </AnimatePresence>

      {/* Soporte Modal */}
      <AnimatePresence>
        {showSoporte && (
          <SoporteDocumentalModal onClose={() => setShowSoporte(false)} />
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  )
}
