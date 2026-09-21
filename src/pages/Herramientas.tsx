import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, ArrowLeft, PlusCircle, SearchX } from 'lucide-react'
import { useSearch } from '@/contexts/SearchContext'
import { matches } from '@/lib/search'
import { fadeUp, staggerContainer, staggerItem3D } from '@/lib/animations'
import { useToast, ToastContainer } from '@/components/Toast'
import { useHerramientasCatalogo, type HerramientaCatalogo } from '@/hooks/useHerramientasCatalogo'

import HerramientaLauncherCard  from '@/components/herramientas/HerramientaLauncherCard'
import ResumenActividad        from '@/components/herramientas/ResumenActividad'
import SolicitarHerramientaModal from '@/components/herramientas/SolicitarHerramientaModal'

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse" role="status" aria-label="Cargando herramientas">
      {[0, 1].map((i) => <div key={i} className="h-64 bg-bg-alt rounded-xl" />)}
    </div>
  )
}

export default function Herramientas() {
  const { query }                    = useSearch()
  const [showSolicitar, setShowSolicitar] = useState(false)
  const [herramientaAbiertaId, setHerramientaAbiertaId] = useState<string | null>(null)
  const { toasts, toast, dismiss }   = useToast()
  const { items: herramientas, isLoading, isError } = useHerramientasCatalogo()

  const filteredTools = herramientas.filter((t) => matches([t.titulo, t.tag], query))
  // Distinto de "sin resultados de búsqueda" (query no vacío): esto es el
  // catálogo real vacío o inalcanzable, no algo que el usuario tecleó mal.
  const sinCatalogo = !isLoading && herramientas.length === 0
  const herramientaAbierta = herramientas.find((t) => t.clave === herramientaAbiertaId)

  if (herramientaAbierta) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setHerramientaAbiertaId(null)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-primary-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Volver a Herramientas
        </button>
        <h1 className="page-header-title">{herramientaAbierta.titulo}</h1>
        {React.createElement(herramientaAbierta.Component, { onToast: toast })}
        <ToastContainer toasts={toasts} dismiss={dismiss} />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <span className="page-header-tag block mb-2">SIG · Análisis Territorial</span>
          <h1 className="page-header-title mb-3">Caja de Herramientas</h1>
          <div className="flex items-center gap-3">
            <div className="w-8 h-0.5 bg-primary-800 rounded-full" />
            <p className="text-sm text-text-muted leading-relaxed">
              Herramientas avanzadas para procesamiento de datos espaciales y modelamiento geográfico.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowSolicitar(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--card-bg)] border border-border rounded-xl text-sm font-semibold text-text hover:border-primary-800 hover:text-primary-800 transition-colors shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Solicitar herramienta
        </button>
      </motion.div>

      {/* Tools grid */}
      {isLoading ? (
        <GridSkeleton />
      ) : sinCatalogo ? (
        <motion.div {...fadeUp(0.1)} className="py-16 text-center text-text-muted">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-30" aria-hidden="true" />
          <p className="text-sm">
            {isError
              ? 'No se pudo cargar el catálogo de herramientas. Intenta de nuevo en unos minutos.'
              : 'No hay herramientas disponibles todavía.'}
          </p>
        </motion.div>
      ) : filteredTools.length > 0 ? (
        <motion.div
          variants={staggerContainer(0.07, 0.08)}
          initial="initial" animate="animate"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {filteredTools.map((tool: HerramientaCatalogo) => (
            <motion.div key={tool.clave} variants={staggerItem3D}>
              {tool.focusable ? (
                <HerramientaLauncherCard
                  tag={tool.tag}
                  title={tool.titulo}
                  description={tool.descripcion ?? ''}
                  icon={tool.icon!}
                  color={tool.color}
                  onAbrir={() => setHerramientaAbiertaId(tool.clave)}
                />
              ) : (
                React.createElement(tool.Component, { onToast: toast })
              )}
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div {...fadeUp(0.1)} className="py-16 text-center text-text-muted">
          <SearchX className="w-10 h-10 mx-auto mb-3 opacity-30" aria-hidden="true" />
          <p className="text-sm">
            No se encontraron herramientas para <strong className="text-text">"{query}"</strong>
          </p>
        </motion.div>
      )}

      {/* Activity summary — only when not filtering */}
      {!query && <ResumenActividad />}

      {/* Modal */}
      <AnimatePresence>
        {showSolicitar && (
          <SolicitarHerramientaModal onClose={() => setShowSolicitar(false)} />
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  )
}
