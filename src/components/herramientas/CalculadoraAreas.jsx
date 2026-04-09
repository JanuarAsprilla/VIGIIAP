import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Scaling, CheckCircle, Loader2 } from 'lucide-react'
import ToolCard from './ToolCard'

const CAPAS = [
  { value: '',        label: 'Seleccionar poligonal...' },
  { value: 'reserva', label: 'Reserva_Natural_A1.shp',      area: 48320.7, perimetro: 892.4 },
  { value: 'amort',   label: 'Zona_Amortiguamiento_B2.shp', area: 12840.2, perimetro: 441.6 },
  { value: 'lote',    label: 'Lote_Comunidad_C3.shp',        area: 3271.5,  perimetro: 218.9 },
]

const UNIDAD_FACTOR = { ha: 1, 'km2': 0.01, 'm2': 10000 }
const UNIDAD_LABEL  = { ha: 'ha', 'km2': 'km²', 'm2': 'm²' }

export default function CalculadoraAreas() {
  const [capa,    setCapa]    = useState('')
  const [unidad,  setUnidad]  = useState('ha')
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)

  const calcular = () => {
    if (!capa) return
    setLoading(true)
    setResult(null)
    setTimeout(() => {
      const found = CAPAS.find((c) => c.value === capa)
      const f = UNIDAD_FACTOR[unidad] || 1
      setResult({
        area:      (found.area * f).toFixed(2),
        perimetro: found.perimetro.toFixed(1),
        poligonos: 1,
        crs:       'MAGNA-SIRGAS / Colombia Oeste',
      })
      setLoading(false)
    }, 900)
  }

  return (
    <ToolCard tag="Geometría" title="Calculadora de Áreas y Perímetros" icon={Scaling} color="primary" index={0}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
              Capa de Entrada
            </label>
            <select
              value={capa}
              onChange={(e) => { setCapa(e.target.value); setResult(null) }}
              className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
            >
              {CAPAS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
              Sistema de Unidades
            </label>
            <select
              value={unidad}
              onChange={(e) => { setUnidad(e.target.value); setResult(null) }}
              className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
            >
              <option value="ha">Hectáreas (ha)</option>
              <option value="km2">Kilómetros² (km²)</option>
              <option value="m2">Metros² (m²)</option>
            </select>
          </div>
        </div>

        <button
          onClick={calcular}
          disabled={!capa || loading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scaling className="w-4 h-4" />}
          {loading ? 'Calculando...' : 'Calcular Geometría'}
        </button>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-primary-50 border border-primary-200 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-primary-700" />
                <span className="text-[0.6rem] font-bold uppercase tracking-wider text-primary-700">
                  Resultado del Cálculo
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Área Total', value: `${Number(result.area).toLocaleString('es-CO')} ${UNIDAD_LABEL[unidad]}` },
                  { label: 'Perímetro',  value: `${result.perimetro} km` },
                  { label: 'Polígonos', value: result.poligonos },
                  { label: 'CRS',        value: result.crs },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white rounded-lg px-3 py-2 border border-primary-100">
                    <p className="text-[0.55rem] font-bold uppercase tracking-wider text-primary-600 mb-0.5">{label}</p>
                    <p className="text-xs font-bold text-text">{value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToolCard>
  )
}
