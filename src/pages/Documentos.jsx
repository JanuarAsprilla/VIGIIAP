import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Search, SlidersHorizontal, ArrowUpDown,
  ChevronUp, ChevronDown, Eye, Download,
  Waves, FileInput, BookOpen, TrendingUp,
  Headphones,
} from 'lucide-react'
import { DOC_CATEGORIES } from '@/lib/constants'

// ── Animation helper ──
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
})

// ── Icon mapping for categories ──
const categoryIcons = {
  Waves,
  FileInput,
  BookOpen,
  TrendingUp,
}

// ── File type icon color ──
function FileIcon({ type }) {
  const colors = {
    pdf: 'text-red-500 bg-red-50',
    docx: 'text-blue-500 bg-blue-50',
    xlsx: 'text-green-600 bg-green-50',
  }
  const style = colors[type] || colors.pdf

  return (
    <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${style}`}>
      <FileText className="w-4 h-4" />
    </div>
  )
}

// ── Document Table Row ──
function DocRow({ doc }) {
  return (
    <tr className="border-b border-border last:border-b-0 hover:bg-bg-alt/50 transition-colors">
      {/* File name */}
      <td className="py-3 pr-4">
        <div className="flex items-center gap-3">
          <FileIcon type={doc.type} />
          <span className="text-sm font-medium text-primary-800 hover:underline cursor-pointer">
            {doc.name}
          </span>
        </div>
      </td>
      {/* Size */}
      <td className="py-3 pr-4">
        <span className="text-sm text-text-muted">{doc.size}</span>
      </td>
      {/* Date */}
      <td className="py-3 pr-4">
        <span className="text-sm text-text-muted">{doc.updated}</span>
      </td>
      {/* Actions */}
      <td className="py-3">
        <div className="flex items-center gap-2">
          <button
            className="w-8 h-8 rounded-lg border border-border bg-white flex items-center justify-center text-text-muted hover:bg-primary-800 hover:border-primary-800 hover:text-white transition-colors"
            title="Vista previa"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
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
function CategoryAccordion({ category, isOpen, onToggle, index }) {
  const Icon = categoryIcons[category.icon] || FileText

  return (
    <motion.div
      {...fadeUp(0.1 + index * 0.08)}
      className={`bg-white border border-border rounded-xl overflow-hidden border-l-4 ${category.color}`}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-6 py-5 hover:bg-bg-alt/50 transition-colors text-left"
      >
        <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary-800" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-text">{category.title}</h3>
          <span className="text-sm text-text-muted">{category.subtitle}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-text-muted shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-text-muted shrink-0" />
        )}
      </button>

      {/* Content - file table */}
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
                    <th className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-primary-700 pb-3 pr-4">
                      Nombre del Archivo
                    </th>
                    <th className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-text-muted pb-3 pr-4">
                      Tamaño
                    </th>
                    <th className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-text-muted pb-3 pr-4">
                      Última Actualización
                    </th>
                    <th className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-text-muted pb-3">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {category.docs.map((doc, i) => (
                    <DocRow key={i} doc={doc} />
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

// ── Support CTA ──
function SupportCTA() {
  return (
    <motion.div
      {...fadeUp(0.5)}
      className="grid grid-cols-1 md:grid-cols-2 rounded-2xl overflow-hidden"
    >
      {/* Left - text */}
      <div className="bg-primary-100 p-8 flex flex-col justify-center">
        <h3 className="font-display text-2xl font-bold text-primary-900 leading-tight mb-3">
          ¿Necesita soporte documental?
        </h3>
        <p className="text-sm text-primary-800/70 leading-relaxed mb-6">
          Si no encuentra el documento o formato requerido para sus operaciones
          técnicas, contacte con nuestra oficina de gestión de datos.
        </p>
        <div>
          <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-primary-900 rounded-lg text-sm font-semibold hover:bg-primary-800 hover:text-white transition-colors border border-primary-200">
            <Headphones className="w-4 h-4" />
            Contactar Soporte
          </button>
        </div>
      </div>

      {/* Right - decorative */}
      <div className="bg-gradient-to-br from-bg-alt to-border min-h-[200px] hidden md:block" />
    </motion.div>
  )
}

// ── Main Documentos Page ──
export default function Documentos() {
  const [openId, setOpenId] = useState('protocolos')
  const [searchQuery, setSearchQuery] = useState('')

  const toggleCategory = (id) => {
    setOpenId(openId === id ? '' : id)
  }

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <motion.div {...fadeUp(0)}>
        <span className="inline-block text-[0.7rem] font-bold uppercase tracking-widest text-primary-700 mb-2">
          Repositorio Institucional
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-text leading-tight mb-3">
          Centro de <em>Documentos</em>
        </h1>
        <p className="text-sm text-text-muted leading-relaxed max-w-2xl">
          Acceda a la biblioteca técnica y normativa del Sistema de Información
          Territorial del Chocó. Un espacio inmersivo para la gestión del conocimiento
          biogeográfico.
        </p>
      </motion.div>

      {/* ── Search & Filter Bar ── */}
      <motion.div
        {...fadeUp(0.1)}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
      >
        {/* Search input */}
        <div className="flex items-center gap-2 bg-white border border-border rounded-lg px-4 py-2.5 flex-1">
          <Search className="w-4 h-4 text-text-muted shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nombre, tipo o fecha..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-text w-full placeholder:text-text-muted"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2 shrink-0">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-border rounded-lg text-sm font-medium text-text hover:border-primary-800 hover:text-primary-800 transition-colors">
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
            <ArrowUpDown className="w-4 h-4" />
            Ordenar
          </button>
        </div>
      </motion.div>

      {/* ── Document Categories (Accordions) ── */}
      <div className="space-y-4">
        {DOC_CATEGORIES.map((cat, i) => (
          <CategoryAccordion
            key={cat.id}
            category={cat}
            isOpen={openId === cat.id}
            onToggle={() => toggleCategory(cat.id)}
            index={i}
          />
        ))}
      </div>

      {/* ── Support CTA ── */}
      <SupportCTA />
    </div>
  )
}