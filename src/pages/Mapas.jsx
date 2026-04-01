import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Map, Filter, ChevronLeft, ChevronRight, X,
  FileText, Image, Globe,
} from 'lucide-react'
import {
  MAP_CATEGORIES, MAP_DEPARTMENTS, MAP_FORMATS,
  MAP_YEARS, SAMPLE_MAPS,
} from '@/lib/constants'

// ── Animation helper ──
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
})

// ── Format icon mapping ──
function FormatIcon({ format, geovisorLink }) {
  if (format === 'GEOVISOR') {
    return (
      <Link
        to={geovisorLink || '/geovisor'}
        className="flex flex-col items-center gap-1 text-primary-800/60 hover:text-primary-800 transition-colors no-underline"
        title="Ver en Geovisor"
      >
        <Globe className="w-5 h-5" />
        <span className="text-[0.65rem] font-bold uppercase">Geovisor</span>
      </Link>
    )
  }

  const icons = {
    PDF: FileText,
    IMG: Image,
  }
  const Icon = icons[format] || FileText

  return (
    <button
      className="flex flex-col items-center gap-1 text-primary-800/60 hover:text-primary-800 transition-colors"
      title={`Descargar ${format}`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[0.65rem] font-bold uppercase">{format}</span>
    </button>
  )
}

// ── Badge ──
function FormatBadge({ text, color }) {
  const colors = {
    primary: 'bg-primary-800 text-white',
    orange: 'bg-orange-500 text-white',
  }
  return (
    <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-wider ${colors[color] || colors.primary}`}>
      {text}
    </span>
  )
}

// ── Map Card ──
function MapCard({ map, index }) {
  const palette = ['#D8F3DC', '#E8F5E9', '#F1F8F1', '#E0F2E0', '#D4EDDA', '#EDF7ED']
  const bg = palette[index % palette.length]

  return (
    <motion.div
      {...fadeUp(0.1 + index * 0.05)}
      className="bg-white border border-border rounded-xl overflow-hidden hover:shadow-card transition-shadow"
    >
      <div
        className="h-48 relative"
        style={{ background: `linear-gradient(135deg, ${bg}, ${bg}dd)` }}
      >
        <FormatBadge text={map.badge} color={map.badgeColor} />
      </div>

      <div className="p-5">
        <span className="inline-block text-[0.7rem] font-bold uppercase tracking-wider text-primary-700 mb-1.5">
          {map.category}
        </span>
        <h3 className="card-title text-text leading-snug mb-2">{map.title}</h3>
        <p className="card-text mb-4">{map.excerpt}</p>

        {/* Download + Geovisor icons */}
        <div className="flex items-center gap-5 pt-3 border-t border-border">
          {map.formats.map((fmt) => (
            <FormatIcon key={fmt} format={fmt} />
          ))}
          <FormatIcon format="GEOVISOR" geovisorLink={map.geovisorLink} />
        </div>
      </div>
    </motion.div>
  )
}

// ── Filter Select ──
function FilterSelect({ label, options, value, onChange }) {
  return (
    <div className="flex-1 min-w-[180px]">
      <label className="table-header block text-text-muted mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-[0.9rem] text-text focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

// ── Filter Chip ──
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

// ── Main Page ──
export default function Mapas() {
  const [filters, setFilters] = useState({
    category: 'biodiversidad',
    department: '',
    format: '',
    year: '2024',
  })

  const activeChips = []
  if (filters.category) {
    const cat = MAP_CATEGORIES.find((c) => c.value === filters.category)
    if (cat) activeChips.push({ key: 'category', label: cat.label })
  }
  if (filters.year) activeChips.push({ key: 'year', label: filters.year })
  if (filters.department) {
    const dept = MAP_DEPARTMENTS.find((d) => d.value === filters.department)
    if (dept) activeChips.push({ key: 'department', label: dept.label })
  }
  if (filters.format) {
    const fmt = MAP_FORMATS.find((f) => f.value === filters.format)
    if (fmt) activeChips.push({ key: 'format', label: fmt.label })
  }

  const removeChip = (key) => setFilters((prev) => ({ ...prev, [key]: '' }))
  const clearAllFilters = () => setFilters({ category: '', department: '', format: '', year: '' })

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div>
          <span className="page-header-tag block mb-2">Cartografía Institucional</span>
          <h1 className="page-header-title mb-3">
            Repositorio de{' '}
            <span className="block">Mapas Temáticos</span>
          </h1>
          <p className="page-header-description max-w-lg">
            Explore y descargue la cartografía oficial del Chocó Biogeográfico.
            Información científica curada para el análisis territorial y la toma de decisiones.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white border border-border rounded-xl px-5 py-4 shrink-0">
          <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
            <Map className="w-5 h-5 text-primary-800" />
          </div>
          <div>
            <span className="block text-xl font-bold text-text">1,248</span>
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
          <FilterSelect label="Categoría" options={MAP_CATEGORIES} value={filters.category} onChange={(v) => setFilters({ ...filters, category: v })} />
          <FilterSelect label="Departamento / Subregión" options={MAP_DEPARTMENTS} value={filters.department} onChange={(v) => setFilters({ ...filters, department: v })} />
          <FilterSelect label="Formato" options={MAP_FORMATS} value={filters.format} onChange={(v) => setFilters({ ...filters, format: v })} />
          <FilterSelect label="Año de Publicación" options={MAP_YEARS} value={filters.year} onChange={(v) => setFilters({ ...filters, year: v })} />
        </div>

        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border">
            {activeChips.map((chip) => (
              <FilterChip key={chip.key} label={chip.label} onRemove={() => removeChip(chip.key)} />
            ))}
            <button onClick={clearAllFilters} className="text-sm font-medium text-text-muted hover:text-primary-800 ml-auto transition-colors">
              Limpiar todos los filtros
            </button>
          </div>
        )}
      </motion.div>

      {/* Map Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {SAMPLE_MAPS.map((map, i) => (
          <MapCard key={map.id} map={map} index={i} />
        ))}
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {SAMPLE_MAPS.map((map, i) => (
          <MapCard key={`row2-${map.id}`} map={map} index={i + 6} />
        ))}
      </div>

      {/* Pagination */}
      <motion.div {...fadeUp(0.3)} className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          <button disabled className="w-9 h-9 rounded-lg border border-border bg-white text-text-muted flex items-center justify-center opacity-50">
            <ChevronLeft className="w-4 h-4" />
          </button>
          {[1, 2, 3].map((n) => (
            <button key={n} className={`w-9 h-9 rounded-lg border text-sm font-medium flex items-center justify-center transition-colors ${n === 1 ? 'bg-primary-800 border-primary-800 text-white' : 'border-border bg-white text-text-light hover:bg-primary-800 hover:border-primary-800 hover:text-white'}`}>
              {n}
            </button>
          ))}
          <span className="text-text-muted text-sm px-1">...</span>
          <button className="w-9 h-9 rounded-lg border border-border bg-white text-text-light text-sm font-medium flex items-center justify-center hover:bg-primary-800 hover:border-primary-800 hover:text-white transition-colors">12</button>
          <button className="w-9 h-9 rounded-lg border border-border bg-white text-text-light flex items-center justify-center hover:bg-primary-800 hover:border-primary-800 hover:text-white transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <span className="text-sm text-text-muted">Mostrando 12 de 1,248 resultados</span>
      </motion.div>
    </div>
  )
}