import { useState, useEffect } from 'react'
import PaginationBar from '@/components/ui/PaginationBar'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Search, SlidersHorizontal, X, Loader2, Check } from 'lucide-react'
import { useSearch } from '@/contexts/SearchContext'
import { matches } from '@/lib/search'
import { useToast, ToastContainer } from '@/components/Toast'
import { useDocumentosList } from '@/hooks/useDocumentos'
import { CATEGORY_META, fadeUp } from './documentos/documentos.constants'
import { forceDownload, useClickOutside, descargarUrl, type CategoryItem, type DocItem } from './documentos/documentos.utils'
import { CategoryCard } from './documentos/CategoryCard'
import { CategoryModal } from './documentos/CategoryModal'
import { PreviewModal } from './documentos/PreviewModal'
import { SoporteDocumentalModal } from './documentos/SoporteModal'
import { SupportCTA } from './documentos/SupportCTA'
import { useRef } from 'react'

export default function Documentos() {
  const { query, setQuery } = useSearch()
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null)
  const [showSoporte, setShowSoporte] = useState(false)
  const [activeTypes, setActiveTypes] = useState<string[]>([])
  const [showFilter, setShowFilter] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<DocItem | null>(null)
  const [previewCategory, setPreviewCategory] = useState('')

  const filterRef = useRef(null)
  useClickOutside(filterRef, () => setShowFilter(false))

  const { toasts, toast, dismiss } = useToast()
  const handleDownload = async (doc: DocItem) => {
    await forceDownload(descargarUrl('documento', doc.id), `${doc.name}.${doc.type}`)
    toast(`Descargando "${doc.name}"`, 'success')
  }

  const toggleType = (type: string) => {
    setActiveTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const CAT_PAGE_SIZE = 12
  const { data, isLoading, isError } = useDocumentosList({ limit: 500 })
  const allDocs = data?.data ?? []

  const allCategories = (() => {
    const map: Record<string, CategoryItem> = {}
    allDocs.forEach((d) => {
      const catName = d.categoria || 'General'
      if (!map[catName]) {
        const meta = (CATEGORY_META as Record<string, { icon: string }>)[catName] ?? CATEGORY_META.default
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
        id:      d.id,
        name:    d.nombre,
        type:    d.type,
        size:    d.tamano ?? '—',
        updated: d.fecha,
        dateISO: d.creado_en ?? '',
        url:     d.url,
        resumen: d.resumen ?? '',
      })
    })
    return Object.values(map)
  })()

  const [catPage, setCatPage] = useState(1)
  const isFiltering = query.trim() !== '' || activeTypes.length > 0
  const displayCategories = allCategories.map((cat) => {
    let filtered = cat.docs.filter((d) => matches([d.name, cat.title], query))
    if (activeTypes.length > 0) filtered = filtered.filter((d) => activeTypes.includes(d.type))
    return { ...cat, filteredDocs: filtered }
  }).filter((cat) => !isFiltering || cat.filteredDocs.length > 0)

  // eslint-disable-next-line react-hooks/set-state-in-effect -- reset intencional de paginación al cambiar filtros
  useEffect(() => { setCatPage(1) }, [query, activeTypes])

  const catTotalPages  = Math.ceil(displayCategories.length / CAT_PAGE_SIZE) || 1
  const pagedCategories = displayCategories.slice((catPage - 1) * CAT_PAGE_SIZE, catPage * CAT_PAGE_SIZE)

  const openCategory = (cat: CategoryItem) => {
    setSelectedCategory(allCategories.find((c) => c.id === cat.id) || cat)
  }

  return (
    <div className="space-y-8">
      <motion.div {...fadeUp(0)}>
        <span className="page-header-tag block mb-2">Repositorio Institucional</span>
        <h1 className="page-header-title mb-3">Centro de <em>Documentos</em></h1>
        <p className="page-header-description max-w-2xl">
          Acceda a la biblioteca técnica y normativa del Sistema de Información
          Territorial del Chocó. Un espacio inmersivo para la gestión del conocimiento biogeográfico.
        </p>
      </motion.div>

      <motion.div {...fadeUp(0.1)} className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-[var(--card-bg)] border border-border rounded-lg px-4 py-2.5 flex-1">
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
                : 'bg-[var(--card-bg)] border-border text-text hover:border-primary-800 hover:text-primary-800'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
            {activeTypes.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-[var(--card-bg)] text-primary-800 text-xs font-bold flex items-center justify-center">
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
                className="absolute right-0 top-full mt-2 w-52 bg-[var(--card-bg)] border border-border rounded-xl shadow-lg z-20 overflow-hidden"
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

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-primary-800 animate-spin" />
        </div>
      ) : isError ? (
        <motion.div {...fadeUp(0.1)} role="alert" className="py-16 text-center text-text-muted">
          <div className="w-16 h-16 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-red-400 opacity-60" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-text-muted">Error al cargar documentos</p>
          <p className="text-xs mt-1 text-text-muted/60">Verifique su conexión e intente de nuevo</p>
        </motion.div>
      ) : displayCategories.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {pagedCategories.map((cat, i) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                filteredCount={isFiltering ? cat.filteredDocs.length : null}
                onOpen={() => openCategory(cat)}
                index={i}
              />
            ))}
          </div>
          <PaginationBar
            page={catPage}
            totalPages={catTotalPages}
            total={displayCategories.length}
            pageSize={CAT_PAGE_SIZE}
            onPage={setCatPage}
          />
        </>
      ) : (
        <motion.div {...fadeUp(0.1)} className="py-20 flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center relative overflow-hidden"
            style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}>
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: 'radial-gradient(circle, #1A5632 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
            <FileText className="w-9 h-9 text-text-muted opacity-30 relative" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-text-muted">
              {query ? `Sin resultados para "${query}"` : 'No hay documentos disponibles'}
            </p>
            <p className="text-xs text-text-muted/60">
              {isFiltering ? 'Prueba eliminando algunos filtros' : 'Los documentos aparecerán aquí cuando estén publicados'}
            </p>
          </div>
          {isFiltering && (
            <button
              onClick={() => { setQuery(''); setActiveTypes([]) }}
              className="text-xs font-semibold text-primary-800 hover:text-primary-600 transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </motion.div>
      )}

      <SupportCTA onContactar={() => setShowSoporte(true)} />

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

      <AnimatePresence>
        {previewDoc && (
          <PreviewModal
            doc={previewDoc}
            categoryTitle={previewCategory}
            onClose={() => { setPreviewDoc(null); setPreviewCategory('') }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSoporte && (
          <SoporteDocumentalModal onClose={() => setShowSoporte(false)} />
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  )
}
