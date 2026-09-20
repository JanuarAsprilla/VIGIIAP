import { useState, useEffect, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Map, Filter, ChevronLeft, ChevronRight, X,
  FileText, Globe, Loader2, Eye, Download, Calendar,
  Rows, Columns2, Columns3,
} from 'lucide-react'
import { MAP_FORMATS } from '@/lib/constants'
import { useMapasList } from '@/hooks/useMapas'
import type { MapaData } from '@/hooks/useMapas'
import { useCategoriasList } from '@/hooks/useCategorias'
import { useSearch } from '@/contexts/SearchContext'
import { matches } from '@/lib/search'
import { isTrustedUrl } from '@/lib/trustedUrl'
import { descargarUrl, forceDownload } from '@/pages/documentos/documentos.utils'
import { useToast, ToastContainer } from '@/components/Toast'
import { cardEnter3D } from '@/lib/animations'
import Card3D from '@/components/ui/Card3D'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
})

// ── Preview Modal para mapas ──────────────────────────────────────────────────
function MapPreviewModal({ map, format, onClose }: { map: MapaData; format: string; onClose: () => void }) {
  const fileUrl = format === 'IMG' ? map.archivo_img_url : map.archivo_pdf_url
  // Solo se renderiza como enlace/imagen si el origen está en la allowlist —
  // evita que un valor malicioso guardado en el backend (ej. javascript:) se ejecute al hacer clic.
  const trustedFileUrl = fileUrl && isTrustedUrl(fileUrl) ? fileUrl : null
  const isImage = format === 'IMG' || (fileUrl && /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(fileUrl))

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
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
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] as const }}
        className="bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded mr-2 ${isImage ? 'bg-gold-400/12 text-gold-400' : 'bg-red/8 text-red'}`}>
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
            {isImage && trustedFileUrl ? (
              <div className="p-4 flex justify-center bg-bg-alt">
                <img src={trustedFileUrl} alt={map.title}
                  width={1200} height={675}
                  loading="eager"
                  className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-sm" />
              </div>
            ) : !isImage ? (
              <div className="p-8 flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-red-50">
                  <FileText className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text mb-1">{map.title}</p>
                  <p className="text-xs text-text-muted">{map.category} · {map.year}</p>
                </div>
                <div className="flex gap-3">
                  {/* El PDF vive en el bucket privado -- se abre vía el proxy de
                      descarga del backend (verifica visibilidad + URL prefirmada),
                      nunca con la URL cruda de almacenamiento. */}
                  <a href={descargarUrl('mapa', map.id, 'archivo_pdf')} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">
                    <Eye className="w-4 h-4" />
                    Abrir PDF
                  </a>
                  <button type="button"
                    onClick={() => forceDownload(descargarUrl('mapa', map.id, 'archivo_pdf'), `${sanitizeFilename(map.title)}.pdf`)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-800/10 border border-primary-800/20 text-primary-600 rounded-lg text-sm font-semibold hover:bg-primary-800/15 transition-colors">
                    <Download className="w-4 h-4" />
                    Descargar
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="p-10 text-center text-text-muted text-sm">Archivo no disponible</div>
        )}

        {trustedFileUrl && isImage && (
          <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
            <button type="button"
              onClick={() => forceDownload(trustedFileUrl, `${sanitizeFilename(map.title)}.${extFromUrl(map.archivo_img_url, 'jpg')}`)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">
              <Download className="w-4 h-4" />
              Descargar imagen
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}

// Nombre de archivo para descargas -- nunca el nombre interno de almacenamiento
// (una key con hash/UUID), siempre el título real del mapa que ve el usuario.
function sanitizeFilename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'mapa'
}
function extFromUrl(url: string | null | undefined, fallback: string): string {
  const match = url?.split('?')[0].match(/\.([a-zA-Z0-9]+)$/)
  return match ? match[1] : fallback
}

/* Paleta oficial IIAP — categorías de mapas */
const CATEGORY_COLORS = {
  'Hidrología':       { pill: 'bg-primary-500/12 text-primary-500', accent: '#009846' },
  'Biodiversidad':    { pill: 'bg-accent/15 text-primary-800',      accent: '#B0CB1F' },
  'Zonificación':     { pill: 'bg-magenta/12 text-magenta',         accent: '#E51A4B' },
  'Cartografía Base': { pill: 'bg-primary-700/10 text-primary-700', accent: '#1A5632' },
  'Infraestructura':  { pill: 'bg-gold-500/12 text-gold-500',       accent: '#F08143' },
  'Riesgo':           { pill: 'bg-red/8 text-red-dark',             accent: '#C12A2B' },
}

interface MapCardProps { map: MapaData; index: number; onPreview?: (map: MapaData, format: string) => void }
function MapCard({ map, index, onPreview }: MapCardProps) {
  const colors = CATEGORY_COLORS[map.category as keyof typeof CATEGORY_COLORS] ?? { pill: 'bg-primary-800/10 text-primary-600', accent: '#1B4332' }
  const hasPdf     = map.formats.includes('PDF')
  const hasImg     = map.formats.includes('IMG')
  const hasGeovisor = map.formats.includes('GEOVISOR')
  const geovisorHref = map.geovisorLink && isTrustedUrl(map.geovisorLink) ? map.geovisorLink : '/geovisores'

  // Chaos testing (clics de frustración): sin esta guarda, clics rápidos repetidos
  // durante un cold start de Render disparaban múltiples fetch() + descargas simultáneas.
  const [downloadingField, setDownloadingField] = useState<'pdf' | 'img' | null>(null)
  const handleDownload = async (campo: 'archivo_pdf' | 'archivo_img', field: 'pdf' | 'img') => {
    if (downloadingField) return
    setDownloadingField(field)
    const ext = campo === 'archivo_pdf' ? 'pdf' : extFromUrl(map.archivo_img_url, 'jpg')
    try {
      await forceDownload(descargarUrl('mapa', map.id, campo), `${sanitizeFilename(map.title)}.${ext}`)
    } finally {
      setDownloadingField(null)
    }
  }

  // Tarjeta de imagen completa (como el panel admin): la miniatura nunca se
  // recorta -- object-contain, cualquiera que sea su proporción -- y las
  // acciones quedan en un panel que aparece al pasar el mouse o al hacer
  // clic (para touch), en vez de ocupar espacio fijo siempre visible.
  const [expanded, setExpanded] = useState(false)

  return (
    <Card3D
      {...cardEnter3D(index)}
      glow={`${colors.accent}38`}
      intensity={5}
      className="group/card relative h-64 bg-[var(--card-bg)] border border-border/70 rounded-2xl overflow-hidden cursor-pointer"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      aria-label={`${map.title}, ${map.category}. Clic para ver opciones.`}
      onClick={() => setExpanded((v) => !v)}
      onKeyDown={(e: ReactKeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded((v) => !v) } }}
    >
      {/* Miniatura de fondo -- completa, sin recortar */}
      {map.thumbnail_url ? (
        <img src={map.thumbnail_url} alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-contain bg-bg-alt group-hover/card:scale-105 transition-transform duration-500" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${colors.accent}14 0%, ${colors.accent}06 100%)` }}>
          <div className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: `radial-gradient(circle, ${colors.accent} 1px, transparent 1px)`,
              backgroundSize: '18px 18px',
            }} />
          <div className="relative flex flex-col items-center gap-2">
            <Map className="w-14 h-14" style={{ color: colors.accent, opacity: 0.22 }} />
            <span className="text-[0.6rem] font-bold uppercase tracking-widest"
              style={{ color: colors.accent, opacity: 0.35 }}>
              {map.category}
            </span>
          </div>
        </div>
      )}

      {/* Degradado permanente -- legibilidad del texto siempre visible */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/10 pointer-events-none" />

      {/* Badges superiores */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
        {map.year && (
          <span className="flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm text-white text-[0.65rem] font-bold rounded-lg">
            <Calendar className="w-3 h-3" />
            {map.year}
          </span>
        )}
        <div className="flex flex-col gap-1 items-end">
          {hasPdf && <span className="px-2 py-0.5 bg-red text-white text-[0.6rem] font-bold uppercase rounded">PDF</span>}
          {hasImg && <span className="px-2 py-0.5 bg-gold-400 text-primary-900 text-[0.6rem] font-bold uppercase rounded">IMG</span>}
          {hasGeovisor && <span className="px-2 py-0.5 bg-primary-800 text-white text-[0.6rem] font-bold uppercase rounded">Geovisor</span>}
        </div>
      </div>

      {/* Categoría + título -- siempre visibles */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
        <span className={`inline-block text-[0.6rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-1.5 ${colors.pill}`}>
          {map.category}
        </span>
        <p className="text-sm font-bold text-white leading-snug line-clamp-2">{map.title}</p>
      </div>

      {/* Panel de acciones -- revelado al pasar el mouse o al hacer clic */}
      <div
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col justify-end p-4 transition-opacity duration-250 ${
          expanded ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none group-hover/card:opacity-100 group-hover/card:pointer-events-auto'
        }`}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setExpanded(false) }}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Cerrar opciones"
        >
          <X className="w-4 h-4" />
        </button>

        <span className={`self-start text-[0.6rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-2 ${colors.pill}`}>
          {map.category}
        </span>
        <p className="text-sm font-bold text-white leading-snug">{map.title}</p>
        {map.excerpt && (
          <p className="text-xs text-white/70 leading-relaxed line-clamp-2 mt-1">{map.excerpt}</p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-3">
          {hasPdf && (
            <button onClick={(e) => { e.stopPropagation(); onPreview?.(map, 'PDF') }}
              className="flex-1 min-w-[7rem] inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-primary-700 rounded-lg hover:bg-primary-600 transition-colors">
              <Eye className="w-3.5 h-3.5" />
              Visualizar
            </button>
          )}
          {hasPdf && (
            <button onClick={(e) => { e.stopPropagation(); handleDownload('archivo_pdf', 'pdf') }}
              disabled={downloadingField !== null}
              className="flex-1 min-w-[7rem] inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-red-600/90 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:pointer-events-none">
              {downloadingField === 'pdf'
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Download className="w-3.5 h-3.5" />}
              Descargar PDF
            </button>
          )}
          {hasImg && (
            <button onClick={(e) => { e.stopPropagation(); onPreview?.(map, 'IMG') }}
              className="flex-1 min-w-[7rem] inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-primary-700 rounded-lg hover:bg-primary-600 transition-colors">
              <Eye className="w-3.5 h-3.5" />
              Visualizar
            </button>
          )}
          {hasImg && (
            <button onClick={(e) => { e.stopPropagation(); handleDownload('archivo_img', 'img') }}
              disabled={downloadingField !== null}
              className="flex-1 min-w-[7rem] inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-primary-900 bg-gold-400 rounded-lg hover:bg-gold-300 transition-colors disabled:opacity-50 disabled:pointer-events-none">
              {downloadingField === 'img'
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Download className="w-3.5 h-3.5" />}
              Descargar
            </button>
          )}
          {hasGeovisor && (
            <a href={geovisorHref} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
              className="flex-1 min-w-[7rem] inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-white/10 rounded-lg hover:bg-white/20 transition-colors no-underline">
              <Globe className="w-3.5 h-3.5" />
              Geovisor
            </a>
          )}
        </div>
      </div>
    </Card3D>
  )
}

function FilterSelect({ label, options, value, onChange }: { label: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex-1 min-w-[180px]">
      <label className="table-header block text-text-muted mb-1.5">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-lg text-[0.9rem] text-text focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition">
        {(options as { value: string; label: string }[]).map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  )
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
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
  const { toasts, dismiss } = useToast()
  const [filters, setFilters] = useState({ category: '', format: '', year: '' })
  const [page, setPage]       = useState(1)
  const [previewMap, setPreviewMap]       = useState<MapaData | null>(null)
  const [previewFormat, setPreviewFormat] = useState<string | null>(null)
  const PER_PAGE = 6

  // Columnas de la cuadrícula -- elegible por el usuario y recordado en este
  // navegador. En pantallas angostas siempre cae a 1 columna sin importar la
  // preferencia (las clases responsivas de Tailwind ya lo garantizan).
  const COLS_STORAGE_KEY = 'vigiiap:mapas-cols'
  const [cols, setCols] = useState<1 | 2 | 3>(() => {
    if (typeof window === 'undefined') return 3
    const raw = Number(window.localStorage.getItem(COLS_STORAGE_KEY))
    return raw === 1 || raw === 2 || raw === 3 ? raw : 3
  })
  const changeCols = (n: 1 | 2 | 3) => {
    setCols(n)
    try { window.localStorage.setItem(COLS_STORAGE_KEY, String(n)) } catch { /* localStorage no disponible */ }
  }
  const COLS_GRID_CLASS: Record<1 | 2 | 3, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
  }

  // ── Datos reales ─────────────────────────────────────────────────────────────
  const { data, isLoading, isError } = useMapasList({
    categoria: filters.category || undefined,
    anio:      filters.year     || undefined,
    limit:     100,
  })
  const allMaps = data?.data ?? []

  // Categorías del filtro: las que de verdad existen para este módulo (igual
  // que en el formulario de "Editar mapa"), no una lista fija que se
  // desincroniza en cuanto alguien crea una categoría nueva en Gestión de
  // Categorías -- antes ofrecía nombres que ningún mapa tenía asignado, y
  // dejaba fuera los reales, así que elegir una no filtraba nada.
  const { data: categoriasCompartidas = [] } = useCategoriasList()
  const categoryOptions = [
    { value: '', label: 'Todas las categorías' },
    ...[...new Set([
      ...allMaps.map((m) => m.category).filter(Boolean),
      ...categoriasCompartidas.filter((c) => c.modulos?.includes('mapas')).map((c) => c.nombre),
    ])].sort((a, b) => a.localeCompare(b)).map((nombre) => ({ value: nombre, label: nombre })),
  ]

  // Años del filtro: los que realmente tienen mapas publicados, no un rango fijo.
  const yearOptions = [
    { value: '', label: 'Todos los años' },
    ...[...new Set(allMaps.map((m) => m.year).filter(Boolean))].sort((a, b) => Number(b) - Number(a)).map((y) => ({ value: y, label: y })),
  ]

  // Filtrado local (búsqueda global + filtros que el backend aún no tiene)
  const filteredMaps = allMaps.filter((m) => {
    if (!matches([m.title, m.category, m.excerpt], query)) return false
    if (filters.format && !m.formats.some((f) => f.toLowerCase() === filters.format.toLowerCase())) return false
    return true
  })

  const [sortBy, setSortBy] = useState<'recientes' | 'az' | 'za'>('recientes')
  const sortedMaps = [...filteredMaps].sort((a, b) => {
    if (sortBy === 'az') return a.title.localeCompare(b.title)
    if (sortBy === 'za') return b.title.localeCompare(a.title)
    return new Date(b.creado_en ?? 0).getTime() - new Date(a.creado_en ?? 0).getTime()
  })
  const SORT_OPTIONS = [
    { value: 'recientes' as const, label: 'Más recientes' },
    { value: 'az'        as const, label: 'Nombre A-Z' },
    { value: 'za'        as const, label: 'Nombre Z-A' },
  ]

  const activeChips: { key: string; label: string }[] = []
  if (filters.category) activeChips.push({ key: 'category', label: filters.category })
  if (filters.year)   activeChips.push({ key: 'year', label: filters.year })
  if (filters.format) {
    const fmt = MAP_FORMATS.find((f) => f.value === filters.format)
    if (fmt) activeChips.push({ key: 'format', label: fmt.label })
  }

  const totalPages = Math.max(1, Math.ceil(sortedMaps.length / PER_PAGE))
  const safePage   = Math.min(page, totalPages)
  const pagedMaps  = sortedMaps.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const updateFilter = (key: string, value: string) => { setFilters((p) => ({ ...p, [key]: value })); setPage(1) }
  const removeChip   = (key: string) => { setFilters((p) => ({ ...p, [key]: '' }));    setPage(1) }
  const clearAll     = ()            => { setFilters({ category: '', format: '', year: '' }); setPage(1) }

  const handlePreview = (map: MapaData, format: string) => {
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
        <div className="flex items-center gap-3 bg-[var(--card-bg)] border border-border rounded-xl px-5 py-4 shrink-0">
          <div className="w-10 h-10 bg-primary-800/10 rounded-lg flex items-center justify-center">
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
      <motion.div {...fadeUp(0.1)} className="bg-[var(--card-bg)] border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-text-muted" />
          <span className="table-header text-text-muted">Filtros Avanzados</span>
        </div>
        <div className="flex flex-wrap gap-4">
          <FilterSelect label="Categoría" options={categoryOptions} value={filters.category} onChange={(v) => updateFilter('category', v)} />
          <FilterSelect label="Formato" options={MAP_FORMATS} value={filters.format} onChange={(v) => updateFilter('format', v)} />
          <FilterSelect label="Año de Publicación" options={yearOptions} value={filters.year} onChange={(v) => updateFilter('year', v)} />
          <FilterSelect label="Ordenar por" options={SORT_OPTIONS} value={sortBy} onChange={(v) => setSortBy(v as typeof sortBy)} />
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
        <motion.div {...fadeUp(0.1)} className="py-20 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
            <Map className="w-7 h-7 text-red-400 opacity-60" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-text-muted">Error al cargar mapas</p>
            <p className="text-xs text-text-muted/60 mt-0.5">Verifique su conexión e intente de nuevo</p>
          </div>
        </motion.div>
      ) : pagedMaps.length > 0 ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <div role="group" aria-label="Columnas de la cuadrícula" className="flex items-center gap-1 p-1 bg-[var(--card-bg)] border border-border rounded-xl">
              {([
                { n: 1 as const, Icon: Rows,     label: '1 columna' },
                { n: 2 as const, Icon: Columns2, label: '2 columnas' },
                { n: 3 as const, Icon: Columns3, label: '3 columnas' },
              ]).map(({ n, Icon, label }) => (
                <button key={n} type="button" onClick={() => changeCols(n)} title={label} aria-label={label}
                  aria-pressed={cols === n}
                  className={`p-2 rounded-lg transition-colors ${
                    cols === n ? 'bg-primary-800 text-white' : 'text-text-muted hover:bg-bg-alt hover:text-text'
                  }`}>
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
          <div className={`grid ${COLS_GRID_CLASS[cols]} gap-6`}>
            {pagedMaps.map((map, i) => (
              <MapCard key={map.id} map={map} index={i} onPreview={handlePreview} />
            ))}
          </div>
        </div>
      ) : (
        <motion.div {...fadeUp(0.1)} className="py-20 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}>
              <div className="absolute inset-0 rounded-2xl opacity-[0.04]"
                style={{ backgroundImage: 'radial-gradient(circle, #1A5632 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
              <Map className="w-9 h-9 text-text-muted opacity-30 relative" />
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-text-muted">
              {query ? `Sin resultados para "${query}"` : 'No hay mapas disponibles'}
            </p>
            <p className="text-xs text-text-muted/60">
              {query ? 'Prueba con otros filtros o términos de búsqueda' : 'Los mapas aparecerán aquí cuando estén publicados'}
            </p>
          </div>
          {(query || Object.values({}).some(Boolean)) && (
            <button onClick={clearAll}
              className="text-xs font-semibold transition-colors"
              style={{ color: 'var(--hero-eyebrow-text)' }}>
              Limpiar filtros
            </button>
          )}
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div {...fadeUp(0.3)} className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}
              className="w-9 h-9 rounded-lg border border-border bg-[var(--card-bg)] text-text-muted flex items-center justify-center disabled:opacity-40 hover:enabled:bg-primary-800 hover:enabled:border-primary-800 hover:enabled:text-white transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button key={n} onClick={() => setPage(n)}
                className={`w-9 h-9 rounded-lg border text-sm font-medium flex items-center justify-center transition-colors ${n === safePage ? 'bg-primary-800 border-primary-800 text-white' : 'border-border bg-[var(--card-bg)] text-text-light hover:bg-primary-800 hover:border-primary-800 hover:text-white'}`}>
                {n}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
              className="w-9 h-9 rounded-lg border border-border bg-[var(--card-bg)] text-text-light flex items-center justify-center disabled:opacity-40 hover:enabled:bg-primary-800 hover:enabled:border-primary-800 hover:enabled:text-white transition-colors">
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
            format={previewFormat ?? ''}
            onClose={() => { setPreviewMap(null); setPreviewFormat(null) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
