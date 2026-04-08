import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Scaling, Target, ArrowLeftRight, Layers,
  TriangleRight, Eye, Minus as MinusIcon, SearchX,
} from 'lucide-react'
import { useSearch } from '@/contexts/SearchContext'
import { matches } from '@/lib/search'

// ── Animation helper ──
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
})

// ── Tool Card wrapper ──
function ToolCard({ tag, title, icon: Icon, color, children, index }) {
  const borderColors = {
    primary: 'border-t-primary-800',
    orange: 'border-t-gold-400',
    gold: 'border-t-gold-500',
    green: 'border-t-primary-500',
  }

  return (
    <motion.div
      {...fadeUp(0.1 + index * 0.08)}
      className={`bg-white border border-border rounded-xl overflow-hidden border-t-2 ${borderColors[color] || borderColors.primary}`}
    >
      <div className="p-6">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="inline-block text-[0.6rem] font-bold uppercase tracking-widest text-text-muted mb-1.5">
              {tag}
            </span>
            <h3 className="text-lg font-bold text-text leading-snug">{title}</h3>
          </div>
          <div className="w-10 h-10 bg-bg-alt rounded-lg flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-primary-800" />
          </div>
        </div>

        {/* Tool content */}
        {children}
      </div>
    </motion.div>
  )
}

// ── 1. Calculadora de Áreas y Perímetros ──
function CalculadoraAreas() {
  return (
    <ToolCard
      tag="Geometría"
      title="Calculadora de Áreas y Perímetros"
      icon={Scaling}
      color="primary"
      index={0}
    >
      <div className="space-y-4">
        {/* Two selects */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
              Capa de Entrada
            </label>
            <select className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition">
              <option>Seleccionar poligonal...</option>
              <option>Reserva_Natural_A1.shp</option>
              <option>Zona_Amortiguamiento_B2.shp</option>
              <option>Lote_Comunidad_C3.shp</option>
            </select>
          </div>
          <div>
            <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
              Sistema de Unidades
            </label>
            <select className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition">
              <option>Hectáreas (ha)</option>
              <option>Kilómetros² (km²)</option>
              <option>Metros² (m²)</option>
            </select>
          </div>
        </div>

        {/* Action button */}
        <button className="w-full sm:w-auto px-6 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">
          Calcular Geometría
        </button>
      </div>
    </ToolCard>
  )
}

// ── 2. Generador de Buffers ──
function GeneradorBuffers() {
  const [tipoBorde, setTipoBorde] = useState('redondeado')

  return (
    <ToolCard
      tag="Procesamiento"
      title="Generador de Buffers"
      icon={Target}
      color="orange"
      index={1}
    >
      <p className="text-sm text-text-muted leading-relaxed mb-4">
        Crea áreas de influencia alrededor de entidades geográficas lineales o puntuales.
      </p>

      <div className="space-y-4">
        {/* Distance input */}
        <div>
          <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
            Distancia (mts)
          </label>
          <input
            type="number"
            defaultValue={500}
            className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
          />
        </div>

        {/* Border type toggle */}
        <div>
          <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
            Tipo de Borde
          </label>
          <div className="flex gap-2">
            {['Redondeado', 'Plano'].map((tipo) => (
              <button
                key={tipo}
                onClick={() => setTipoBorde(tipo.toLowerCase())}
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

        {/* Action button */}
        <button className="w-full px-6 py-2.5 border-2 border-primary-800 text-primary-800 rounded-lg text-sm font-semibold hover:bg-primary-800 hover:text-white transition-colors">
          Generar Influencia
        </button>
      </div>
    </ToolCard>
  )
}

// ── 3. Conversor de Coordenadas ──
function ConversorCoordenadas() {
  return (
    <ToolCard
      tag="Geodésico"
      title="Conversor de Coordenadas"
      icon={ArrowLeftRight}
      color="gold"
      index={2}
    >
      <div className="space-y-4">
        {/* Origin */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <span className="block text-[0.6rem] font-bold uppercase tracking-wider text-primary-700 mb-1">
            Origen (WGS84)
          </span>
          <p className="text-sm font-mono font-bold text-primary-900">
            4.8213° N, 76.7324° W
          </p>
        </div>

        {/* Arrow indicator */}
        <div className="flex justify-center">
          <div className="w-8 h-8 bg-gold-400 rounded-full flex items-center justify-center">
            <TriangleRight className="w-4 h-4 text-white rotate-90" />
          </div>
        </div>

        {/* Destination */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <span className="block text-[0.6rem] font-bold uppercase tracking-wider text-primary-700 mb-1">
            Destino (Magna-Sirgas)
          </span>
          <p className="text-sm font-mono font-bold text-primary-900">
            X: 1.042.482 | Y: 1.120.943
          </p>
        </div>

        {/* Action button */}
        <button className="w-full px-6 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">
          Convertir Punto
        </button>
      </div>
    </ToolCard>
  )
}

// ── 4. Analizador de Superposición ──
function AnalizadorSuperposicion() {
  const [operacion, setOperacion] = useState('interseccion')

  return (
    <ToolCard
      tag="Análisis Espacial"
      title="Analizador de Superposición"
      icon={Layers}
      color="green"
      index={3}
    >
      <p className="text-sm text-text-muted leading-relaxed mb-4">
        Ejecuta procesos de intersección, unión y diferencia entre múltiples
        capas territoriales para detectar conflictos de uso del suelo o áreas de
        traslape legal.
      </p>

      <div className="space-y-4">
        {/* Layer selectors */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-bg-alt border border-border rounded-lg p-3 text-center">
            <Layers className="w-5 h-5 text-text-muted mx-auto mb-1" />
            <span className="block text-xs font-bold text-text">Capa A</span>
            <span className="block text-[0.65rem] text-text-muted">Títulos Mineros</span>
          </div>
          <div className="flex-1 bg-bg-alt border border-border rounded-lg p-3 text-center">
            <Layers className="w-5 h-5 text-text-muted mx-auto mb-1" />
            <span className="block text-xs font-bold text-text">Capa B</span>
            <span className="block text-[0.65rem] text-text-muted">Zonas Protegidas</span>
          </div>
        </div>

        {/* Operation buttons */}
        <div className="space-y-2">
          {[
            { id: 'interseccion', label: 'Intersección', icon: Eye },
            { id: 'union', label: 'Unión', icon: TriangleRight },
            { id: 'diferencia', label: 'Diferencia', icon: MinusIcon },
          ].map(({ id, label, icon: OpIcon }) => (
            <button
              key={id}
              onClick={() => setOperacion(id)}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                operacion === id
                  ? 'bg-primary-800 text-white border-primary-800'
                  : 'bg-white text-text border-border hover:border-primary-300'
              }`}
            >
              <OpIcon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </ToolCard>
  )
}

// ── Activity Summary ──
function ResumenActividad() {
  return (
    <motion.div
      {...fadeUp(0.5)}
      className="bg-primary-800 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6"
    >
      {/* Text */}
      <div className="flex-1 text-white">
        <h3 className="text-base font-bold mb-1">Resumen de Actividad Técnica</h3>
        <p className="text-sm text-white/70 leading-relaxed">
          Has realizado 12 análisis espaciales esta semana. El almacenamiento
          de geodatos está al 65% de su capacidad.
        </p>
      </div>

      {/* Stats */}
      <div className="flex gap-4 shrink-0">
        {[
          { value: '24', label: 'Capas Activas' },
          { value: '1.2GB', label: 'Datos Procesados' },
          { value: '98%', label: 'Precisión SIG' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white/10 rounded-lg px-4 py-3 text-center min-w-[90px]"
          >
            <span className="block text-xl font-bold text-white">{stat.value}</span>
            <span className="block text-[0.6rem] font-bold uppercase tracking-wider text-white/60 mt-0.5">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// Metadata for filtering
const TOOLS_META = [
  { id: 'calculadora', tag: 'Geometría', title: 'Calculadora de Áreas y Perímetros', Component: CalculadoraAreas },
  { id: 'buffers', tag: 'Procesamiento', title: 'Generador de Buffers', Component: GeneradorBuffers },
  { id: 'conversor', tag: 'Geodésico', title: 'Conversor de Coordenadas', Component: ConversorCoordenadas },
  { id: 'superposicion', tag: 'Análisis Espacial', title: 'Analizador de Superposición', Component: AnalizadorSuperposicion },
]

// ── Main Herramientas Page ──
export default function Herramientas() {
  const { query } = useSearch()

  const filteredTools = TOOLS_META.filter((t) =>
    matches([t.title, t.tag], query)
  )

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <motion.div {...fadeUp(0)}>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-text leading-tight mb-3">
          Caja de Herramientas de Análisis Territorial
        </h1>
        <div className="flex items-center gap-3">
          <div className="w-8 h-0.5 bg-primary-800 rounded-full" />
          <p className="text-sm text-text-muted leading-relaxed">
            Herramientas avanzadas para procesamiento de datos espaciales y modelamiento geográfico.
          </p>
        </div>
      </motion.div>

      {/* ── Tools Grid ── */}
      {filteredTools.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTools.map(({ id, Component }) => (
            <Component key={id} />
          ))}
        </div>
      ) : (
        <motion.div {...fadeUp(0.1)} className="py-16 text-center text-text-muted">
          <SearchX className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No se encontraron herramientas para <strong className="text-text">"{query}"</strong></p>
        </motion.div>
      )}

      {/* ── Activity Summary ── */}
      {!query && <ResumenActividad />}
    </div>
  )
}