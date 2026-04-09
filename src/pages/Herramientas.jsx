import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Scaling, Target, ArrowLeftRight, Layers,
  TriangleRight, Eye, Minus as MinusIcon, SearchX,
  ClipboardList, Smartphone, BarChart3,
  MapPin, Calendar, User, Camera, Lock,
  Download, ExternalLink, TrendingUp, Droplets, TreePine, Wind,
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

// ── Magna-Sirgas Colombia West (EPSG:3115) projection math ──
const TM = {
  a: 6378137.0,
  f: 1 / 298.257222101,
  k0: 1.0,
  lon0: -77.0,
  lat0: 4.0,
  FE: 1000000,
  FN: 1000000,
}

function mArc(phi, e2) {
  const e4 = e2 * e2; const e6 = e2 * e4
  return TM.a * (
    (1 - e2/4 - 3*e4/64 - 5*e6/256) * phi
    - (3*e2/8 + 3*e4/32 + 45*e6/1024) * Math.sin(2*phi)
    + (15*e4/256 + 45*e6/1024) * Math.sin(4*phi)
    - (35*e6/3072) * Math.sin(6*phi)
  )
}

function wgs84ToMagna(latD, lonD) {
  const r = Math.PI / 180
  const { a, f, k0, lon0, lat0, FE, FN } = TM
  const e2 = 2*f - f*f; const ep2 = e2/(1-e2)
  const lat = latD*r; const lon = lonD*r
  const N = a / Math.sqrt(1 - e2*Math.sin(lat)**2)
  const T = Math.tan(lat)**2; const C = ep2*Math.cos(lat)**2
  const A = (lon - lon0*r) * Math.cos(lat)
  const M = mArc(lat, e2); const M0 = mArc(lat0*r, e2)
  const x = FE + k0*N*(A + (1-T+C)*A**3/6 + (5-18*T+T**2+72*C-58*ep2)*A**5/120)
  const y = FN + k0*(M - M0 + N*Math.tan(lat)*(A**2/2 + (5-T+9*C+4*C**2)*A**4/24 + (61-58*T+T**2+600*C-330*ep2)*A**6/720))
  return { x: Math.round(x*100)/100, y: Math.round(y*100)/100 }
}

function magnaToWgs84(X, Y) {
  const r = Math.PI / 180; const d = 180 / Math.PI
  const { a, f, k0, lon0, lat0, FE, FN } = TM
  const e2 = 2*f - f*f; const e4 = e2*e2; const e6 = e2*e4; const ep2 = e2/(1-e2)
  const M0 = mArc(lat0*r, e2)
  const M1 = M0 + (Y - FN)/k0
  const e1 = (1 - Math.sqrt(1-e2)) / (1 + Math.sqrt(1-e2))
  const mu = M1 / (a*(1 - e2/4 - 3*e4/64 - 5*e6/256))
  const lat1 = mu
    + (3*e1/2 - 27*e1**3/32)*Math.sin(2*mu)
    + (21*e1**2/16 - 55*e1**4/32)*Math.sin(4*mu)
    + (151*e1**3/96)*Math.sin(6*mu)
    + (1097*e1**4/512)*Math.sin(8*mu)
  const N1 = a/Math.sqrt(1 - e2*Math.sin(lat1)**2)
  const R1 = a*(1-e2)/Math.pow(1 - e2*Math.sin(lat1)**2, 1.5)
  const T1 = Math.tan(lat1)**2; const C1 = ep2*Math.cos(lat1)**2
  const D = (X - FE)/(N1*k0)
  const lat = lat1 - (N1*Math.tan(lat1)/R1)*(D**2/2 - (5+3*T1+10*C1-4*C1**2-9*ep2)*D**4/24 + (61+90*T1+298*C1+45*T1**2-252*ep2-3*C1**2)*D**6/720)
  const lon = lon0*r + (D - (1+2*T1+C1)*D**3/6 + (5-2*C1+28*T1-3*C1**2+8*ep2+24*T1**2)*D**5/120)/Math.cos(lat1)
  return { lat: Math.round(lat*d*1e6)/1e6, lon: Math.round(lon*d*1e6)/1e6 }
}

// ── 3. Conversor de Coordenadas ──
function ConversorCoordenadas() {
  const [modo, setModo] = useState('wgs2magna') // 'wgs2magna' | 'magna2wgs'
  const [latInput, setLatInput] = useState('4.8213')
  const [lonInput, setLonInput] = useState('-76.7324')
  const [xInput, setXInput] = useState('1042482')
  const [yInput, setYInput] = useState('1120943')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const convert = () => {
    setError(''); setResult(null)
    try {
      if (modo === 'wgs2magna') {
        const lat = parseFloat(latInput); const lon = parseFloat(lonInput)
        if (isNaN(lat) || isNaN(lon)) throw new Error('Ingresa valores numéricos válidos')
        if (lat < -4 || lat > 14) throw new Error('Latitud fuera del territorio colombiano')
        if (lon < -82 || lon > -66) throw new Error('Longitud fuera del territorio colombiano')
        setResult(wgs84ToMagna(lat, lon))
      } else {
        const x = parseFloat(xInput.replace(/\./g, '').replace(',', '.'))
        const y = parseFloat(yInput.replace(/\./g, '').replace(',', '.'))
        if (isNaN(x) || isNaN(y)) throw new Error('Ingresa valores numéricos válidos')
        setResult(magnaToWgs84(x, y))
      }
    } catch(e) { setError(e.message) }
  }

  const copyResult = () => {
    if (!result) return
    const text = modo === 'wgs2magna'
      ? `X: ${result.x.toLocaleString('es-CO')} | Y: ${result.y.toLocaleString('es-CO')}`
      : `Lat: ${result.lat}° | Lon: ${result.lon}°`
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800) })
  }

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
            onClick={() => { setModo(m.id); setResult(null); setError('') }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${modo === m.id ? 'bg-white text-primary-800 shadow-sm' : 'text-text-muted hover:text-text'}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {modo === 'wgs2magna' ? (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Latitud (°N)', val: latInput, set: setLatInput, ph: 'ej. 4.8213' },
              { label: 'Longitud (°W)', val: lonInput, set: setLonInput, ph: 'ej. -76.7324' },
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
              { label: 'X — Este (m)', val: xInput, set: setXInput, ph: 'ej. 1042482' },
              { label: 'Y — Norte (m)', val: yInput, set: setYInput, ph: 'ej. 1120943' },
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
            <span>⚠</span>{error}
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
                  <p className="text-sm font-mono font-bold text-primary-900">{result.x.toLocaleString('es-CO', { maximumFractionDigits: 2 })} m</p>
                </div>
                <div>
                  <p className="text-[0.6rem] text-primary-700 mb-0.5">Y — Norte</p>
                  <p className="text-sm font-mono font-bold text-primary-900">{result.y.toLocaleString('es-CO', { maximumFractionDigits: 2 })} m</p>
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

// ── 5. Geoformularios ──
function Geoformularios() {
  const [tipoObservacion, setTipoObservacion] = useState('')

  return (
    <ToolCard
      tag="Captura en Campo"
      title="Geoformularios"
      icon={ClipboardList}
      color="primary"
      index={4}
    >
      <p className="text-sm text-text-muted leading-relaxed mb-4">
        Formularios georreferenciados para captura estructurada de datos en campo.
        Las plantillas configuradas desde el módulo de Administración aparecerán aquí.
      </p>

      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Tipo de observación */}
          <div>
            <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
              Tipo de observación
            </label>
            <select
              value={tipoObservacion}
              onChange={(e) => setTipoObservacion(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
            >
              <option value="">Seleccionar...</option>
              <option value="flora">Flora y Vegetación</option>
              <option value="fauna">Fauna Silvestre</option>
              <option value="agua">Calidad del Agua</option>
              <option value="suelo">Uso del Suelo</option>
              <option value="comunidad">Comunidades Humanas</option>
            </select>
          </div>

          {/* Coordenadas */}
          <div>
            <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
              Coordenadas (GPS)
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-bg-alt border border-border rounded-lg text-sm text-text-muted">
              <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="font-mono text-xs">4.8213° N, 76.7324° W</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Fecha */}
          <div>
            <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
              Fecha de captura
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text">
              <Calendar className="w-4 h-4 text-text-muted shrink-0" aria-hidden="true" />
              <span>2026-04-07</span>
            </div>
          </div>

          {/* Observador */}
          <div>
            <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
              Observador
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-bg-alt border border-border rounded-lg text-sm text-text-muted">
              <User className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="text-xs">Asignado desde sesión</span>
            </div>
          </div>
        </div>

        {/* Adjuntar evidencia */}
        <div className="flex items-center gap-2 p-3 border-2 border-dashed border-border rounded-lg text-text-muted hover:border-primary-300 transition-colors cursor-pointer">
          <Camera className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="text-sm">Adjuntar foto o evidencia de campo</span>
        </div>

        {/* Nota admin + botón */}
        <div className="flex items-start gap-2 bg-primary-50 border border-primary-200 rounded-lg px-3 py-2.5">
          <Lock className="w-3.5 h-3.5 text-primary-700 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs text-primary-800 leading-relaxed">
            Las plantillas personalizadas se gestionan desde el{' '}
            <span className="font-semibold">Módulo de Administración</span>.
          </p>
        </div>

        <button className="w-full px-6 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">
          Iniciar Captura
        </button>
      </div>
    </ToolCard>
  )
}

// ── 6. Aplicaciones Móviles ──
function AplicacionesMoviles() {
  const apps = [
    {
      nombre: 'VIGIIAP Field',
      descripcion: 'Captura de datos en campo con soporte offline y sincronización automática.',
      plataformas: ['Android'],
      estado: 'desarrollo',
    },
    {
      nombre: 'VIGIIAP Offline',
      descripcion: 'Visualización de capas y mapas sin conexión a internet para zonas remotas.',
      plataformas: ['Android', 'iOS'],
      estado: 'desarrollo',
    },
    {
      nombre: 'VIGIIAP Monitor',
      descripcion: 'Seguimiento de indicadores ambientales en tiempo real desde dispositivos móviles.',
      plataformas: ['Android', 'iOS'],
      estado: 'planeado',
    },
  ]

  return (
    <ToolCard
      tag="Movilidad"
      title="Aplicaciones Móviles"
      icon={Smartphone}
      color="orange"
      index={5}
    >
      <p className="text-sm text-text-muted leading-relaxed mb-4">
        Aplicaciones del IIAP para trabajo en campo, monitoreo remoto
        y acceso a datos sin conexión.
      </p>

      <div className="space-y-3">
        {apps.map((app) => (
          <div
            key={app.nombre}
            className="flex items-start gap-3 p-3 bg-bg-alt rounded-lg border border-border"
          >
            <div className="w-9 h-9 bg-primary-800 rounded-lg flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-bold text-text">{app.nombre}</span>
                <span className={`text-[0.6rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                  app.estado === 'desarrollo'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-primary-100 text-primary-700'
                }`}>
                  {app.estado === 'desarrollo' ? 'En desarrollo' : 'Planificado'}
                </span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed mb-1.5">{app.descripcion}</p>
              <div className="flex items-center gap-1.5">
                {app.plataformas.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-border rounded text-[0.65rem] font-semibold text-text-muted"
                  >
                    <Download className="w-3 h-3" aria-hidden="true" />
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}

        <p className="text-xs text-text-muted text-center pt-1">
          Las apps estarán disponibles para descarga en la Fase 2 del sistema.
        </p>
      </div>
    </ToolCard>
  )
}

// ── 7. Tableros de Control (Reportes) ──
function TablerosControl() {
  const indicadores = [
    { icon: TreePine, label: 'Cobertura Forestal', valor: '68.4%', tendencia: '+1.2%', color: 'text-primary-700', bg: 'bg-primary-50' },
    { icon: Droplets, label: 'Calidad Hídrica', valor: '82/100', tendencia: '+3pts', color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: Wind, label: 'Calidad del Aire', valor: 'Buena', tendencia: 'Estable', color: 'text-teal-600', bg: 'bg-teal-50' },
    { icon: TrendingUp, label: 'Biodiversidad', valor: '1,240 sp.', tendencia: '+18 sp.', color: 'text-gold-500', bg: 'bg-amber-50' },
  ]

  return (
    <ToolCard
      tag="Reportes"
      title="Tableros de Control"
      icon={BarChart3}
      color="gold"
      index={6}
    >
      <p className="text-sm text-text-muted leading-relaxed mb-4">
        Indicadores ambientales consolidados del Chocó Biogeográfico.
        Los reportes personalizados se configuran desde el Módulo de Administración.
      </p>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {indicadores.map((ind) => (
          <div key={ind.label} className={`rounded-lg p-3 ${ind.bg}`}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <ind.icon className={`w-3.5 h-3.5 ${ind.color}`} aria-hidden="true" />
              <span className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted">{ind.label}</span>
            </div>
            <div className="flex items-end justify-between">
              <span className={`text-lg font-bold ${ind.color}`}>{ind.valor}</span>
              <span className="text-[0.65rem] font-semibold text-primary-600 bg-primary-100 px-1.5 py-0.5 rounded">
                {ind.tendencia}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Barra de progreso — Avance monitoreo */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-text">Avance del monitoreo anual</span>
          <span className="text-xs font-bold text-primary-800">73%</span>
        </div>
        <div className="w-full h-2 bg-border rounded-full overflow-hidden">
          <div className="h-full w-[73%] bg-gradient-to-r from-primary-600 to-primary-400 rounded-full" />
        </div>
        <p className="text-xs text-text-muted">Q3 2026 — 876 de 1,200 muestras procesadas</p>
      </div>

      <div className="flex gap-2">
        <button className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">
          <BarChart3 className="w-4 h-4" aria-hidden="true" />
          Ver Tablero
        </button>
        <button className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 hover:text-primary-800 transition-colors">
          <ExternalLink className="w-4 h-4" aria-hidden="true" />
          Exportar
        </button>
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

// Metadata para filtrado por búsqueda global
const TOOLS_META = [
  { id: 'calculadora',   tag: 'Geometría',        title: 'Calculadora de Áreas y Perímetros', Component: CalculadoraAreas },
  { id: 'buffers',       tag: 'Procesamiento',     title: 'Generador de Buffers',               Component: GeneradorBuffers },
  { id: 'conversor',     tag: 'Geodésico',         title: 'Conversor de Coordenadas',           Component: ConversorCoordenadas },
  { id: 'superposicion', tag: 'Análisis Espacial', title: 'Analizador de Superposición',        Component: AnalizadorSuperposicion },
  { id: 'geoformularios',  tag: 'Captura en Campo', title: 'Geoformularios',                   Component: Geoformularios },
  { id: 'apps-moviles',    tag: 'Movilidad',        title: 'Aplicaciones Móviles',             Component: AplicacionesMoviles },
  { id: 'tableros',        tag: 'Reportes',         title: 'Tableros de Control',              Component: TablerosControl },
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