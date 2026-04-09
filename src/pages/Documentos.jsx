import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Search, SlidersHorizontal, ArrowUpDown,
  ChevronUp, ChevronDown, Eye, Download,
  Waves, FileInput, BookOpen, TrendingUp,
  Headphones, X, Check, AlertCircle, Send, CheckCircle,
} from 'lucide-react'
import { DOC_CATEGORIES } from '@/lib/constants'
import { useSearch } from '@/contexts/SearchContext'
import { useAuth } from '@/contexts/AuthContext'
import { matches } from '@/lib/search'
import { useToast, ToastContainer } from '@/components/Toast'

// ── Animation helper ──
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
})

// ── Icon mapping for categories ──
const categoryIcons = { Waves, FileInput, BookOpen, TrendingUp }

// ── File type styles ──
const typeStyles = {
  pdf:  { bg: 'bg-red-50',   text: 'text-red-500',   label: 'PDF' },
  docx: { bg: 'bg-blue-50',  text: 'text-blue-500',  label: 'Word' },
  xlsx: { bg: 'bg-green-50', text: 'text-green-600', label: 'Excel' },
}

// ── Sort options ──
const SORT_OPTIONS = [
  { value: 'name-asc',   label: 'Nombre A–Z' },
  { value: 'name-desc',  label: 'Nombre Z–A' },
  { value: 'date-desc',  label: 'Más reciente' },
  { value: 'date-asc',   label: 'Más antiguo' },
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

// ── Preview Modal ──
function PreviewModal({ doc, categoryTitle, onClose }) {
  const s = typeStyles[doc.type] || typeStyles.pdf

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${s.bg} ${s.text}`}>
              {s.label}
            </span>
            <span className="text-sm font-semibold text-text">Vista Previa</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:bg-bg-alt transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* File preview area */}
        <div className="px-6 py-8 flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-4 ${s.bg}`}>
            <FileText className={`w-8 h-8 ${s.text}`} />
          </div>
          <h3 className="text-sm font-semibold text-text leading-snug mb-1 break-all">
            {doc.name}
          </h3>
          <span className="text-xs text-text-muted mb-6">{categoryTitle}</span>

          {/* Metadata grid */}
          <div className="w-full grid grid-cols-2 gap-3 mb-6 text-left">
            {[
              ['Tamaño', doc.size],
              ['Formato', s.label],
              ['Actualizado', doc.updated],
              ['Estado', 'Pendiente carga'],
            ].map(([label, value]) => (
              <div key={label} className="bg-bg-alt rounded-lg px-3 py-2">
                <span className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-0.5">
                  {label}
                </span>
                <span className="text-sm font-medium text-text">{value}</span>
              </div>
            ))}
          </div>

          {/* Placeholder notice */}
          <div className="w-full flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-left">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              La vista previa estará disponible una vez el archivo sea cargado al servidor en la Fase 2 del sistema.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text transition-colors"
          >
            Cerrar
          </button>
          {doc.url ? (
            <a
              href={doc.url}
              download={doc.name}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-800 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Descargar
            </a>
          ) : (
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-800/30 text-white rounded-lg text-sm font-medium cursor-not-allowed">
              <Download className="w-4 h-4" />
              Descargar
            </span>
          )}
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
      <td className="py-3 pr-4">
        <span className="text-sm text-text-muted">{doc.size}</span>
      </td>
      <td className="py-3 pr-4">
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

// ── Accordion Category ──
function CategoryAccordion({ category, isOpen, onToggle, index, onPreview, onDownload }) {
  const Icon = categoryIcons[category.icon] || FileText

  return (
    <motion.div
      {...fadeUp(0.1 + index * 0.08)}
      className={`bg-white border border-border rounded-xl overflow-hidden border-l-4 ${category.color}`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-6 py-5 hover:bg-bg-alt/50 transition-colors text-left"
      >
        <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary-800" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-text">{category.title}</h3>
          <span className="text-sm text-text-muted">{category.docs.length} documento{category.docs.length !== 1 ? 's' : ''}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-text-muted shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-text-muted shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-primary-700 pb-3 pr-4">Nombre del Archivo</th>
                    <th className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-text-muted pb-3 pr-4">Tamaño</th>
                    <th className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-text-muted pb-3 pr-4">Última Actualización</th>
                    <th className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-text-muted pb-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {category.docs.map((doc, i) => (
                    <DocRow key={i} doc={doc} onPreview={(d) => onPreview(d, category.title)} onDownload={onDownload} />
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
  const [step, setStep] = useState('form') // 'form' | 'success'
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
            {/* Header */}
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nombre */}
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

                {/* Correo */}
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

              {/* Tipo de consulta */}
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

              {/* Descripción */}
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

              {/* Actions */}
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

// ── useClickOutside ──
function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => { if (ref.current && !ref.current.contains(e.target)) handler() }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [ref, handler])
}

// ── Main Documentos Page ──
export default function Documentos() {
  const { query, setQuery } = useSearch()
  const [openId, setOpenId] = useState('protocolos')
  const [showSoporte, setShowSoporte] = useState(false)

  // Filter & sort state
  const [activeTypes, setActiveTypes] = useState([])
  const [sortBy, setSortBy] = useState('date-desc')
  const [showFilter, setShowFilter] = useState(false)
  const [showSort, setShowSort] = useState(false)

  // Preview modal
  const [previewDoc, setPreviewDoc] = useState(null)
  const [previewCategory, setPreviewCategory] = useState('')

  const filterRef = useRef(null)
  const sortRef = useRef(null)
  useClickOutside(filterRef, () => setShowFilter(false))
  useClickOutside(sortRef, () => setShowSort(false))

  const { toasts, toast, dismiss } = useToast()
  const handleDownload = (doc) => {
    if (doc.url) {
      const a = document.createElement('a')
      a.href = doc.url
      a.download = doc.name
      a.click()
    }
    toast(`Descargando "${doc.name}"`, 'success')
  }

  const toggleType = (type) => {
    setActiveTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  // Build filtered + sorted categories
  const filteredCategories = DOC_CATEGORIES.map((cat) => {
    let docs = cat.docs.filter((d) => matches([d.name, cat.title], query))
    if (activeTypes.length > 0) {
      docs = docs.filter((d) => activeTypes.includes(d.type))
    }
    docs = [...docs].sort((a, b) => {
      if (sortBy === 'name-asc')  return a.name.localeCompare(b.name)
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name)
      if (sortBy === 'date-desc') return new Date(b.dateISO) - new Date(a.dateISO)
      if (sortBy === 'date-asc')  return new Date(a.dateISO) - new Date(b.dateISO)
      return 0
    })
    return { ...cat, docs }
  }).filter((cat) => cat.docs.length > 0)

  const getIsOpen = (catId) => {
    if (query.trim() || activeTypes.length > 0) return filteredCategories.some((c) => c.id === catId)
    return openId === catId
  }

  const toggleCategory = (id) => {
    if (!query.trim() && activeTypes.length === 0) setOpenId(openId === id ? '' : id)
  }

  const activeSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? 'Ordenar'

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
      <motion.div {...fadeUp(0.1)} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-border rounded-lg px-4 py-2.5 flex-1">
          <Search className="w-4 h-4 text-text-muted shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nom
            bre, tipo o fecha..."
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

        {/* Filtros button + panel */}
        <div className="relative shrink-0" ref={filterRef}>
          <button
            onClick={() => { setShowFilter((v) => !v); setShowSort(false) }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
              showFilter || activeTypes.length > 0
                ? 'bg-primary-800 border-primary-800 text-white'
                : 'bg-white border-border text-text hover:border-primary-800 hover:text-primary-800'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
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
                      activeTypes.includes(value)
                        ? 'bg-primary-800 border-primary-800'
                        : 'border-border'
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

        {/* Ordenar button + dropdown */}
        <div className="relative shrink-0" ref={sortRef}>
          <button
            onClick={() => { setShowSort((v) => !v); setShowFilter(false) }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
              showSort
                ? 'bg-primary-800 border-primary-800 text-white'
                : 'bg-primary-800 border-primary-800 text-white hover:bg-primary-700'
            }`}
          >
            <ArrowUpDown className="w-4 h-4" />
            {activeSortLabel}
          </button>

          <AnimatePresence>
            {showSort && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-48 bg-white border border-border rounded-xl shadow-lg z-20 overflow-hidden py-1"
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
                      {sortBy === opt.value && (
                        <span className="w-2 h-2 rounded-full bg-primary-800" />
                      )}
                    </span>
                    {opt.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Document Categories (Accordions) */}
      <div className="space-y-4">
        {filteredCategories.length > 0 ? filteredCategories.map((cat, i) => (
          <CategoryAccordion
            key={cat.id}
            category={cat}
            isOpen={getIsOpen(cat.id)}
            onToggle={() => toggleCategory(cat.id)}
            index={i}
            onPreview={(doc, catTitle) => { setPreviewDoc(doc); setPreviewCategory(catTitle) }}
            onDownload={handleDownload}
          />
        )) : (
          <motion.div {...fadeUp(0.1)} className="py-16 text-center text-text-muted">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              No se encontraron documentos
              {query && <> para <strong className="text-text">"{query}"</strong></>}
              {activeTypes.length > 0 && <> con los filtros seleccionados</>}
            </p>
            {activeTypes.length > 0 && (
              <button
                onClick={() => setActiveTypes([])}
                className="mt-3 text-sm font-medium text-primary-800 hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Support CTA */}
      <SupportCTA onContactar={() => setShowSoporte(true)} />

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

      {/* Soporte Documental Modal */}
      <AnimatePresence>
        {showSoporte && (
          <SoporteDocumentalModal onClose={() => setShowSoporte(false)} />
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  )
}
