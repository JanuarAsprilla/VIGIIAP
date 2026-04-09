import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, CheckCircle, Loader2 } from 'lucide-react'
import ToolCard from './ToolCard'

export default function GeneradorBuffers() {
  const [tipoBorde, setTipoBorde] = useState('redondeado')
  const [distancia, setDistancia] = useState(500)
  const [loading,   setLoading]   = useState(false)
  const [result,    setResult]    = useState(null)

  const generar = () => {
    setLoading(true)
    setResult(null)
    setTimeout(() => {
      const d = Number(distancia) || 500
      const areaBuffer = (Math.PI * (d / 1000) ** 2).toFixed(3)
      setResult({ distancia: d, area: areaBuffer, entidades: 3, tipo: tipoBorde })
      setLoading(false)
    }, 800)
  }

  return (
    <ToolCard tag="Procesamiento" title="Generador de Buffers" icon={Target} color="orange" index={1}>
      <p className="text-sm text-text-muted leading-relaxed mb-4">
        Crea áreas de influencia alrededor de entidades geográficas lineales o puntuales.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
            Distancia (m)
          </label>
          <input
            type="number"
            value={distancia}
            min={1}
            onChange={(e) => { setDistancia(e.target.value); setResult(null) }}
            className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
          />
        </div>

        <div>
          <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
            Tipo de Borde
          </label>
          <div className="flex gap-2">
            {['Redondeado', 'Plano'].map((tipo) => (
              <button
                key={tipo}
                onClick={() => { setTipoBorde(tipo.toLowerCase()); setResult(null) }}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  tipoBorde === tipo.toLowerCase()
                    ? 'bg-primary-800 text-white border-primary-800'
                    : 'bg-white text-text border-border hover:border-primary-300'
                }`}
              >
                {tipo}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={generar}
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 border-2 border-primary-800 text-primary-800 rounded-lg text-sm font-semibold hover:bg-primary-800 hover:text-white disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
          {loading ? 'Generando...' : 'Generar Influencia'}
        </button>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-amber-50 border border-amber-200 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-amber-600" />
                <span className="text-[0.6rem] font-bold uppercase tracking-wider text-amber-700">Buffer Generado</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Radio',       value: `${result.distancia} m` },
                  { label: 'Área aprox.', value: `${result.area} km²` },
                  { label: 'Entidades',   value: result.entidades },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white rounded-lg px-3 py-2 text-center border border-amber-100">
                    <p className="text-[0.55rem] font-bold uppercase tracking-wider text-amber-600 mb-0.5">{label}</p>
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
