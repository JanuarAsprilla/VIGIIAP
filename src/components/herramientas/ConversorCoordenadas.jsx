import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeftRight } from 'lucide-react'
import ToolCard from './ToolCard'
import { wgs84ToMagna, magnaToWgs84 } from '@/lib/proyeccionMagna'

export default function ConversorCoordenadas() {
  const [modo,     setModo]     = useState('wgs2magna') // 'wgs2magna' | 'magna2wgs'
  const [latInput, setLatInput] = useState('4.8213')
  const [lonInput, setLonInput] = useState('-76.7324')
  const [xInput,   setXInput]   = useState('1042482')
  const [yInput,   setYInput]   = useState('1120943')
  const [result,   setResult]   = useState(null)
  const [error,    setError]    = useState('')
  const [copied,   setCopied]   = useState(false)

  const convert = () => {
    setError('')
    setResult(null)
    try {
      if (modo === 'wgs2magna') {
        const lat = parseFloat(latInput)
        const lon = parseFloat(lonInput)
        if (isNaN(lat) || isNaN(lon))     throw new Error('Ingresa valores numéricos válidos')
        if (lat < -4 || lat > 14)         throw new Error('Latitud fuera del territorio colombiano')
        if (lon < -82 || lon > -66)       throw new Error('Longitud fuera del territorio colombiano')
        setResult(wgs84ToMagna(lat, lon))
      } else {
        const x = parseFloat(xInput.replace(/\./g, '').replace(',', '.'))
        const y = parseFloat(yInput.replace(/\./g, '').replace(',', '.'))
        if (isNaN(x) || isNaN(y))         throw new Error('Ingresa valores numéricos válidos')
        setResult(magnaToWgs84(x, y))
      }
    } catch (e) {
      setError(e.message)
    }
  }

  const copyResult = () => {
    if (!result) return
    const text = modo === 'wgs2magna'
      ? `X: ${result.x.toLocaleString('es-CO')} | Y: ${result.y.toLocaleString('es-CO')}`
      : `Lat: ${result.lat}° | Lon: ${result.lon}°`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  const switchModo = (id) => { setModo(id); setResult(null); setError('') }

  return (
    <ToolCard tag="Geodésico" title="Conversor de Coordenadas" icon={ArrowLeftRight} color="gold" index={2}>
      {/* Mode toggle */}
      <div className="flex gap-1 p-1 bg-bg-alt rounded-xl mb-4">
        {[
          { id: 'wgs2magna', label: 'WGS84 → Magna' },
          { id: 'magna2wgs', label: 'Magna → WGS84' },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => switchModo(m.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              modo === m.id ? 'bg-white text-primary-800 shadow-sm' : 'text-text-muted hover:text-text'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {/* Input fields — change depending on conversion direction */}
        {modo === 'wgs2magna' ? (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Latitud (°N)',   val: latInput, set: setLatInput, ph: 'ej. 4.8213'   },
              { label: 'Longitud (°W)',  val: lonInput, set: setLonInput, ph: 'ej. -76.7324' },
            ].map(({ label, val, set, ph }) => (
              <div key={label}>
                <label className="block text-[0.6rem] font-bold uppercase tracking-wider text-text-muted mb-1">{label}</label>
                <input
                  type="text"
                  value={val}
                  onChange={(e) => { set(e.target.value); setResult(null) }}
                  placeholder={ph}
                  className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm font-mono focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'X — Este (m)',   val: xInput, set: setXInput, ph: 'ej. 1042482' },
              { label: 'Y — Norte (m)',  val: yInput, set: setYInput, ph: 'ej. 1120943' },
            ].map(({ label, val, set, ph }) => (
              <div key={label}>
                <label className="block text-[0.6rem] font-bold uppercase tracking-wider text-text-muted mb-1">{label}</label>
                <input
                  type="text"
                  value={val}
                  onChange={(e) => { set(e.target.value); setResult(null) }}
                  placeholder={ph}
                  className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm font-mono focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
                />
              </div>
            ))}
          </div>
        )}

        <button
          onClick={convert}
          className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors"
        >
          <ArrowLeftRight className="w-4 h-4" />
          Convertir
        </button>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">
            <span aria-hidden="true">⚠</span>
            {error}
          </div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary-50 border border-primary-200 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[0.6rem] font-bold uppercase tracking-wider text-primary-700">
                {modo === 'wgs2magna' ? 'Magna-Sirgas Colombia Oeste (EPSG:3115)' : 'WGS84 (EPSG:4326)'}
              </span>
              <button
                onClick={copyResult}
                className="text-[0.6rem] font-bold uppercase tracking-wider text-primary-700 hover:text-primary-900 transition-colors"
              >
                {copied ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>

            {modo === 'wgs2magna' ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[0.6rem] text-primary-700 mb-0.5">X — Este</p>
                  <p className="text-sm font-mono font-bold text-primary-900">
                    {result.x.toLocaleString('es-CO', { maximumFractionDigits: 2 })} m
                  </p>
                </div>
                <div>
                  <p className="text-[0.6rem] text-primary-700 mb-0.5">Y — Norte</p>
                  <p className="text-sm font-mono font-bold text-primary-900">
                    {result.y.toLocaleString('es-CO', { maximumFractionDigits: 2 })} m
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[0.6rem] text-primary-700 mb-0.5">Latitud</p>
                  <p className="text-sm font-mono font-bold text-primary-900">{result.lat}°</p>
                </div>
                <div>
                  <p className="text-[0.6rem] text-primary-700 mb-0.5">Longitud</p>
                  <p className="text-sm font-mono font-bold text-primary-900">{result.lon}°</p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        <p className="text-[0.6rem] text-text-muted text-center">
          Sistema de referencia: MAGNA-SIRGAS / Colombia Oeste · Meridiano central −77°
        </p>
      </div>
    </ToolCard>
  )
}
