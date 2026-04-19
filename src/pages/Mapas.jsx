import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Map, Filter, ChevronLeft, ChevronRight, X,
  FileText, Image, Globe, Loader2, Eye, Download, Calendar, ExternalLink,
} from 'lucide-react'
import { MAP_CATEGORIES, MAP_FORMATS, MAP_YEARS } from '@/lib/constants'
import { useMapasList } from '@/hooks/useMapas'
import { useSearch } from '@/contexts/SearchContext'
import { matches } from '@/lib/search'
import { useToast, ToastContainer } from '@/components/Toast'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
})

// ── Preview Modal para mapas ──────────────────────────────────────────────────
function MapPreviewModal({ map, format, onClose }) {
  const fileUrl = format === 'IMG' ? map.archivo_img_url : map.archivo_pdf_url
  const isImage = format === 'IMG' || (fileUrl && /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(fileUrl))

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded mr-2 ${isImage ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-500'}`}>
              {format}
            </span>
            <span className="text-sm font-semibold text-text">{map.title}</span>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:bg-bg-alt transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {fileUrl ? (
          <div className="w-full">
            {isImage ? (
              <div className="p-4 flex justify-center bg-bg-alt">
                <img src={fileUrl} alt={map.title}
                  className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-sm" />
              </div>
            ) : (
              <div className="p-8 flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-red-50">
                  <FileText className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text mb-1">{map.title}</p>
                  <p className="text-xs text-text-muted">{map.category} · {map.year}</p>
                </div>
                <div className="flex gap-3">
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">
                    <Eye className="w-4 h-4" />
                    Abrir PDF
                  </a>
                  <a href={fileUrl} download
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-50 border border-primary-200 text-primary-800 rounded-lg text-sm font-semibold hover:bg-primary-100 transition-colors">
                    <Download className="w-4 h-4" />
                    Descargar
                  </a>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-10 text-center text-text-muted text-sm">Archivo no disponible</div>
        )}

        {fileUrl && isImage && (
          <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
            <a href={fileUrl} download
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">
              <Download className="w-4 h-4" />
              Descargar imagen
            </a>
          </div>
        )}
      </motion.div>
    </div>
  )
}

async function forceDownload(url) {
  if (!url) return
  const filename = url.split('?')[0].split('/').pop() || 'archivo'
  try {
    const res  = await fetch(url)
    const blob = await res.blob()
    const tmp  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = tmp
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(tmp)
  } catch {
    window.open(url, '_blank', 'noopener')
  }
}

const CATEGORY_COLORS = {
  'Hidrología':       { pill: 'bg-blue-100 text-blue-700',    accent: '#3b82f6' },
  'Biodiversidad':    { pill: 'bg-green-100 text-green-700',  accent: '#22c55e' },
  'Zonificación':     { pill: 'bg-violet-100 text-violet-700',accent: '#8b5cf6' },
  'Cartografía Base': { pill: 'bg-slate-100 text-slate-600',  accent: '#64748b' },
  'Infraestructura':  { pill: 'bg-orange-100 text-orange-700',accent: '#f97316' },
  'Riesgo':           { pill: 'bg-red-100 text-red-600',      accent: '#ef4444' },
}

function MapCard({ map, index, onPreview }) {
  const colors = CATEGORY_COLORS[map.category] ?? { pill: 'bg-primary-100 text-primary-700', accent: '#1B4332' }
  const hasPdf     = map.formats.includes('PDF')
  const hasImg     = map.formats.includes('IMG')
  const hasGeovisor = map.formats.includes('GEOVISOR')

  return (
    <motion.div {...fadeUp(0.06 + index * 0.04)}
      className="group bg-white border border-border rounded-2xl overflow-hidden hover:border-primary-300 hover:shadow-lg transition-all duration-300 flex flex-col">

      {/* Visual header */}
      <div className="relative h-44 overflow-hidden bg-bg-alt shrink-0">
        {map.thumbnail_url ? (
          <img src={map.thumbnail_url} alt={map.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${colors.accent}18 0%, ${colors.accent}08 100%)` }}>
            <Map className="w-16 h-16 opacity-10" style={{ color: colors.accent }} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* Year badge top-left */}
        {map.year && (
          <span className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm text-white text-[0.65rem] font-bold rounded-lg">
            <Calendar className="w-3 h-3" />
            {map.year}
          </span>
        )}

        {/* Format badges top-right */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
          {hasPdf && <span className="px-2 py-0.5 bg-red-500 text-white text-[0.6rem] font-bold uppercase rounded">PDF</span>}
          {hasImg && <span className="px-2 py-0.5 bg-blue-500 text-white text-[0.6rem] font-bold uppercase rounded">IMG</span>}
          {hasGeovisor && <span className="px-2 py-0.5 bg-primary-800 text-white text-[0.6rem] font-bold uppercase rounded">Geovisor</span>}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <span className={`self-start text-[0.6rem] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3 ${colors.pill}`}>
          {map.category}
        </span>
        <h3 className="text-sm font-bold text-text leading-snug mb-2 line-clamp-2 flex-1">{map.title}</h3>
        {map.excerpt && (
          <p className="text-xs text-text-muted leading-relaxed line-clamp-2 mb-4">{map.excerpt}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-border/60 mt-auto">
          {hasPdf && (
            <button onClick={() => forceDownload(map.archivo_pdf_url)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-text-muted border border-border rounded-lg hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-colors">
              <Download className="w-3.5 h-3.5" />
              Descargar PDF
            </button>
          )}
          {hasPdf && (
            <a href={map.archivo_pdf_url} target="_blank" rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-text-muted border border-border rounded-lg hover:border-primary-300 hover:text-primary-800 hover:bg-primary-50 transition-colors no-underline">
              <Eye className="w-3.5 h-3.5" />
              Visualizar
            </a>
          )}
          {hasImg && (
            <button onClick={() => forceDownload(map.archivo_img_url)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-text-muted border border-border rounded-lg hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors">
              <Download className="w-3.5 h-3.5" />
              Descargar
            </button>
          )}
          {hasImg && (
            <a href={map.archivo_img_url} target="_blank" rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-text-muted border border-border rounded-lg hover:border-primary-300 hover:text-primary-800 hover:bg-primary-50 transition-colors no-underline">
              <Eye className="w-3.5 h-3.5" />
              Visualizar
            </a>
          )}
          {hasGeovisor && (
            <a href={map.geovisorLink || '/geovisor'} target="_blank" rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-primary-800 border border-primary-200 rounded-lg bg-primary-50 hover:bg-primary-100 transition-colors no-underline">
              <Globe className="w-3.5 h-3.5" />
              Geovisor
            </a>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function FilterSelect({ label, options, value, onChange }) {
  return (
    <div className="flex-1 min-w-[180px]">
      <label className="table-header block text-text-muted mb-1.5">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-[0.9rem] text-text focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition">
        {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  )
}

function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-800 text-white rounded-full text-xs font-semibold">
      {label}
      <button onClick={onRemove} className="hover:bg-white/20 rounded-full p-0.5 transition-colors">
        <X className="w-3 h-3" />
      </button>
    </span>
  )
}

export default function Mapas() {
  const { query }    = useSearch()
  const { toasts, toast, dismiss } = useToast()
  const [filters, setFilters] = useState({ category: '', format: '', year: '' })
  const [page, setPage]       = useState(1)
  const [previewMap, setPreviewMap]       = useState(null)
  const [previewFormat, setPreviewFormat] = useState(null)
  const PER_PAGE = 6

  // ── Datos reales ─────────────────────────────────────────────────────────────
  const { data, isLoading, isError } = useMapasList({
    categoria: filters.category || undefined,
    anio:      filters.year     || undefined,
    limit:     100,
  })
  const allMaps = data?.data ?? []

  // Filtrado local (búsqueda global + filtros que el backend aún no tiene)
  const filteredMaps = allMaps.filter((m) => {
    if (!matches([m.title, m.category, m.excerpt], query)) return false
    if (filters.format && !m.formats.some((f) => f.toLowerCase() === filters.format)) return false
    return true
  })

  const activeChips = []
  if (filters.category) {
    const cat = MAP_CATEGORIES.find((c) => c.value === filters.category)
    if (cat) activeChips.push({ key: 'category', label: cat.label })
  }
  if (filters.year)   activeChips.push({ key: 'year', label: filters.year })
  if (filters.format) {
    const fmt = MAP_FORMATS.find((f) => f.value === filters.format)
    if (fmt) activeChips.push({ key: 'format', label: fmt.label })
  }

  const totalPages = Math.max(1, Math.ceil(filteredMaps.length / PER_PAGE))
  const safePage   = Math.min(page, totalPages)
  const pagedMaps  = filteredMaps.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const updateFilter = (key, value) => { setFilters((p) => ({ ...p, [key]: value })); setPage(1) }
  const removeChip   = (key)        => { setFilters((p) => ({ ...p, [key]: '' }));    setPage(1) }
  const clearAll     = ()           => { setFilters({ category: '', format: '', year: '' }); setPage(1) }

  const handlePreview = (map, format) => {
    setPreviewMap(map)
    setPreviewFormat(format)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div>
          <span className="page-header-tag block mb-2">Cartografía Institucional</span>
          <h1 className="page-header-title mb-3">
            Repositorio de <span className="block">Mapas Temáticos</span>
          </h1>
          <p className="page-header-description max-w-lg">
            Explore y descargue la cartografía oficial. Información científica curada para el análisis territorial.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white border border-border rounded-xl px-5 py-4 shrink-0">
          <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
            <Map className="w-5 h-5 text-primary-800" />
          </div>
          <div>
            <span className="block text-xl font-bold text-text">
              {isLoading ? '—' : (data?.meta?.total ?? allMaps.length)}
            </span>
            <span className="block table-header text-text-muted">Mapas Disponibles</span>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div {...fadeUp(0.1)} className="bg-white border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-text-muted" />
          <span className="table-header text-text-muted">Filtros Avanzados</span>
        </div>
        <div className="flex flex-wrap gap-4">
          <FilterSelect label="Categoría" options={MAP_CATEGORIES} value={filters.category} onChange={(v) => updateFilter('category', v)} />
          <FilterSelect label="Formato" options={MAP_FORMATS} value={filters.format} onChange={(v) => updateFilter('format', v)} />
          <FilterSelect label="Año de Publicación" options={MAP_YEARS} value={filters.year} onChange={(v) => updateFilter('year', v)} />
        </div>
        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border">
            {activeChips.map((chip) => (
              <FilterChip key={chip.key} label={chip.label} onRemove={() => removeChip(chip.key)} />
            ))}
            <button onClick={clearAll} className="text-sm font-medium text-text-muted hover:text-primary-800 ml-auto transition-colors">
              Limpiar todos los filtros
            </button>
          </div>
        )}
      </motion.div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-800 animate-spin" />
        </div>
      ) : isError ? (
        <motion.div {...fadeUp(0.1)} className="py-16 text-center text-text-muted">
          <Map className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No se pudo cargar los mapas. Verifique su conexión.</p>
        </motion.div>
      ) : pagedMaps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {pagedMaps.map((map, i) => (
            <MapCard key={map.id} map={map} index={i} onPreview={handlePreview} />
          ))}
        </div>
      ) : (
        <motion.div {...fadeUp(0.1)} className="py-16 text-center text-text-muted">
          <Map className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No se encontraron mapas{query && <> para <strong className="text-text">"{query}"</strong></>}</p>
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div {...fadeUp(0.3)} className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}
              className="w-9 h-9 rounded-lg border border-border bg-white text-text-muted flex items-center justify-center disabled:opacity-40 hover:enabled:bg-primary-800 hover:enabled:border-primary-800 hover:enabled:text-white transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button key={n} onClick={() => setPage(n)}
                className={`w-9 h-9 rounded-lg border text-sm font-medium flex items-center justify-center transition-colors ${n === safePage ? 'bg-primary-800 border-primary-800 text-white' : 'border-border bg-white text-text-light hover:bg-primary-800 hover:border-primary-800 hover:text-white'}`}>
                {n}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
              className="w-9 h-9 rounded-lg border border-border bg-white text-text-light flex items-center justify-center disabled:opacity-40 hover:enabled:bg-primary-800 hover:enabled:border-primary-800 hover:enabled:text-white transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <span className="text-sm text-text-muted">
            Mostrando {(safePage - 1) * PER_PAGE + 1}–{Math.min(safePage * PER_PAGE, filteredMaps.length)} de {filteredMaps.length} resultados
          </span>
        </motion.div>
      )}

      <ToastContainer toasts={toasts} dismiss={dismiss} />

      <AnimatePresence>
        {previewMap && (
          <MapPreviewModal
            map={previewMap}
            format={previewFormat}
            onClose={() => { setPreviewMap(null); setPreviewFormat(null) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
