import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PlusCircle, SearchX } from 'lucide-react'
import { useSearch } from '@/contexts/SearchContext'
import { matches } from '@/lib/search'
import { fadeUp } from '@/lib/animations'
import { useToast, ToastContainer } from '@/components/Toast'

import CalculadoraAreas       from '@/components/herramientas/CalculadoraAreas'
import GeneradorBuffers        from '@/components/herramientas/GeneradorBuffers'
import ConversorCoordenadas    from '@/components/herramientas/ConversorCoordenadas'
import AnalizadorSuperposicion from '@/components/herramientas/AnalizadorSuperposicion'
import Geoformularios          from '@/components/herramientas/Geoformularios'
import AplicacionesMoviles     from '@/components/herramientas/AplicacionesMoviles'
import TablerosControl         from '@/components/herramientas/TablerosControl'
import ResumenActividad        from '@/components/herramientas/ResumenActividad'
import SolicitarHerramientaModal from '@/components/herramientas/SolicitarHerramientaModal'

// Registro de herramientas — añadir aquí cuando el backend provea nuevas
const TOOLS_META = [
  { id: 'calculadora',    tag: 'Geometría',        title: 'Calculadora de Áreas y Perímetros', Component: CalculadoraAreas       },
  { id: 'buffers',        tag: 'Procesamiento',     title: 'Generador de Buffers',               Component: GeneradorBuffers        },
  { id: 'conversor',      tag: 'Geodésico',         title: 'Conversor de Coordenadas',           Component: ConversorCoordenadas    },
  { id: 'superposicion',  tag: 'Análisis Espacial', title: 'Analizador de Superposición',        Component: AnalizadorSuperposicion },
  { id: 'geoformularios', tag: 'Captura en Campo',  title: 'Geoformularios',                     Component: Geoformularios          },
  { id: 'apps-moviles',   tag: 'Movilidad',         title: 'Aplicaciones Móviles',               Component: AplicacionesMoviles     },
  { id: 'tableros',       tag: 'Reportes',          title: 'Tableros de Control',                Component: TablerosControl         },
]

export default function Herramientas() {
  const { query }                    = useSearch()
  const [showSolicitar, setShowSolicitar] = useState(false)
  const { toasts, toast, dismiss }   = useToast()

  const filteredTools = TOOLS_META.filter((t) => matches([t.title, t.tag], query))

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
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-border rounded-xl text-sm font-semibold text-text hover:border-primary-800 hover:text-primary-800 transition-colors shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Solicitar herramienta
        </button>
      </motion.div>

      {/* Tools grid */}
      {filteredTools.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTools.map(({ id, Component }) => (
            <Component key={id} onToast={toast} />
          ))}
        </div>
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
