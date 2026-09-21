import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, BarChart3, PlusCircle, SearchX } from 'lucide-react'
import { useSearch } from '@/contexts/SearchContext'
import { matches } from '@/lib/search'
import { fadeUp, staggerContainer, staggerItem3D } from '@/lib/animations'
import { useToast, ToastContainer } from '@/components/Toast'

import ConversorCoordenadas    from '@/components/herramientas/ConversorCoordenadas'
import PanelChocoTool           from '@/components/herramientas/PanelChocoTool'
import HerramientaLauncherCard  from '@/components/herramientas/HerramientaLauncherCard'
import ResumenActividad        from '@/components/herramientas/ResumenActividad'
import SolicitarHerramientaModal from '@/components/herramientas/SolicitarHerramientaModal'

// Registro de herramientas — añadir aquí cuando el backend provea nuevas.
// Calculadora de Áreas, Generador de Buffers, Analizador de Superposición,
// Geoformularios y Aplicaciones Móviles se retiraron (2026-09-21): eran
// maquetas sin función real o vaporware ("En desarrollo"/"Próximamente" sin
// ningún backend detrás) — Calculadora además duplicaba, peor, la medición
// de área geodésica real que ya existe en el Geovisor
// (components/geovisor-viewer/HerramientasDibujo.tsx + lib/geo/areaUtils.ts).
// Ver PR #187 para el análisis completo. Próximo paso: módulo de
// administración real de herramientas (tabla + admin UI) en vez de este
// registro hardcodeado.
//
// `focusable: true` es para herramientas con su propia navegación interna
// (varias secciones/pestañas) en vez de un formulario compacto: en la grilla
// se muestran como una tarjeta lanzadora (HerramientaLauncherCard, sin tilt —
// interactuar con pestañas/filtros mientras la tarjeta se inclina es un
// problema real, no solo estético) y al abrirse ocupan toda la página, sin
// competir por espacio con las demás herramientas.
const TOOLS_META = [
  { id: 'conversor', tag: 'Geodésico', title: 'Conversor de Coordenadas', Component: ConversorCoordenadas },
  {
    id: 'panel-choco', tag: 'Reportes', title: 'Panel de Análisis Territorial — Chocó Biogeográfico',
    description: 'Titulación colectiva, cuencas, RUNAP, humedales, páramos, ciénagas y población del Chocó Biogeográfico — 8 secciones con gráficas y tablas por departamento.',
    icon: BarChart3, color: 'gold' as const, Component: PanelChocoTool, focusable: true,
  },
]

export default function Herramientas() {
  const { query }                    = useSearch()
  const [showSolicitar, setShowSolicitar] = useState(false)
  const [herramientaAbiertaId, setHerramientaAbiertaId] = useState<string | null>(null)
  const { toasts, toast, dismiss }   = useToast()

  const filteredTools = TOOLS_META.filter((t) => matches([t.title, t.tag], query))
  const herramientaAbierta = TOOLS_META.find((t) => t.id === herramientaAbiertaId)

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
        <h1 className="page-header-title">{herramientaAbierta.title}</h1>
        {React.createElement(herramientaAbierta.Component as React.ComponentType<{ onToast?: typeof toast }>, { onToast: toast })}
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
      {filteredTools.length > 0 ? (
        <motion.div
          variants={staggerContainer(0.07, 0.08)}
          initial="initial" animate="animate"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {filteredTools.map((tool) => (
            <motion.div key={tool.id} variants={staggerItem3D}>
              {tool.focusable ? (
                <HerramientaLauncherCard
                  tag={tool.tag}
                  title={tool.title}
                  description={tool.description ?? ''}
                  icon={tool.icon!}
                  color={tool.color}
                  onAbrir={() => setHerramientaAbiertaId(tool.id)}
                />
              ) : (
                React.createElement(tool.Component as React.ComponentType<{ onToast?: typeof toast }>, { onToast: toast })
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
