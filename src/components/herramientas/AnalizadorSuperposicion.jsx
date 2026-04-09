import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers, Eye, ChevronRight, CheckCircle, Loader2 } from 'lucide-react'
import { Minus as MinusIcon } from 'lucide-react'
import { TriangleRight } from 'lucide-react'
import ToolCard from './ToolCard'

const OVERLAP_RESULTS = {
  interseccion: {
    area: '3,842.6 ha', porc: '7.9%', poligonos: 14,
    alerta: 'Conflicto detectado: títulos mineros superpuestos con reservas protegidas.',
  },
  union: {
    area: '60,318.4 ha', porc: '100%', poligonos: 38,
    alerta: null,
  },
  diferencia: {
    area: '44,155.1 ha', porc: '92.1%', poligonos: 24,
    alerta: null,
  },
}

const OPERACIONES = [
  { id: 'interseccion', label: 'Intersección', icon: Eye },
  { id: 'union',        label: 'Unión',        icon: ChevronRight },
  { id: 'diferencia',   label: 'Diferencia',   icon: MinusIcon },
]

export default function AnalizadorSuperposicion() {
  const [operacion, setOperacion] = useState('interseccion')
  const [loading,   setLoading]   = useState(false)
  const [result,    setResult]    = useState(null)

  const ejecutar = () => {
    setLoading(true)
    setResult(null)
    setTimeout(() => { setResult(OVERLAP_RESULTS[operacion]); setLoading(false) }, 1100)
  }

  return (
    <ToolCard tag="Análisis Espacial" title="Analizador de Superposición" icon={Layers} color="green" index={3}>
      <p className="text-sm text-text-muted leading-relaxed mb-4">
        Ejecuta procesos de intersección, unión y diferencia entre múltiples capas territoriales
        para detectar conflictos de uso del suelo o áreas de traslape legal.
      </p>

      <div className="space-y-4">
        {/* Capas de entrada */}
        <div className="flex items-center gap-3">
          {[
            { label: 'Capa A', sub: 'Títulos Mineros'   },
            { label: 'Capa B', sub: 'Zonas Protegidas'  },
          ].map(({ label, sub }) => (
            <div key={label} className="flex-1 bg-bg-alt border border-border rounded-lg p-3 text-center">
              <Layers className="w-5 h-5 text-text-muted mx-auto mb-1" aria-hidden="true" />
              <span className="block text-xs font-bold text-text">{label}</span>
              <span className="block text-[0.65rem] text-text-muted">{sub}</span>
            </div>
          ))}
        </div>

        {/* Operación */}
        <div className="space-y-2">
          {OPERACIONES.map(({ id, label, icon: OpIcon }) => (
            <button
              key={id}
              onClick={() => { setOperacion(id); setResult(null) }}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                operacion === id
                  ? 'bg-primary-800 text-white border-primary-800'
                  : 'bg-white text-text border-border hover:border-primary-300'
              }`}
            >
              <OpIcon className="w-4 h-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={ejecutar}
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
          {loading ? 'Ejecutando análisis...' : 'Ejecutar Análisis'}
        </button>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-primary-50 border border-primary-200 rounded-xl p-4 space-y-2"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary-700" />
                <span className="text-[0.6rem] font-bold uppercase tracking-wider text-primary-700">
                  {operacion.charAt(0).toUpperCase() + operacion.slice(1)} completada
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Área resultante', value: result.area       },
                  { label: '% del total',     value: result.porc       },
                  { label: 'Polígonos',        value: result.poligonos },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white rounded-lg px-3 py-2 text-center border border-primary-100">
                    <p className="text-[0.55rem] font-bold uppercase tracking-wider text-primary-600 mb-0.5">{label}</p>
                    <p className="text-xs font-bold text-text">{value}</p>
                  </div>
                ))}
              </div>
              {result.alerta && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-1">
                  <span className="text-amber-500 text-xs mt-0.5" aria-hidden="true">⚠</span>
                  <p className="text-xs text-amber-700">{result.alerta}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToolCard>
  )
}
