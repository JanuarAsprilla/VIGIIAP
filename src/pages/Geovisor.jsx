import { useState, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Polygon, useMapEvents } from 'react-leaflet'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Minus, Crosshair, RotateCw,
  Ruler, Pencil, Layers, Download,
  List, SlidersHorizontal, X, Navigation,
  CheckCircle,
} from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import { useToast, ToastContainer } from '@/components/Toast'

// ── Map config ──
const MAP_CENTER = [5.6878, -76.6581]
const MAP_ZOOM = 10

const TILE_LAYERS = [
  {
    id: 'light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    label: 'Claro',
  },
  {
    id: 'voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    label: 'Detalle',
  },
  {
    id: 'dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    label: 'Oscuro',
  },
]

// ── Chocó region polygon ──
const CHOCO_POLYGON = [
  [8.5, -77.5], [8.2, -76.5], [7.5, -76.8], [6.5, -77.2],
  [5.5, -77.5], [4.5, -77.8], [3.5, -78.0], [2.0, -78.5],
  [1.5, -79.0], [1.8, -79.2], [2.5, -78.8], [3.5, -78.2],
  [4.5, -78.0], [5.5, -77.8], [6.5, -77.5], [7.5, -77.2],
  [8.5, -77.5],
]

// ── Layer definitions ──
const LAYER_GROUPS = [
  {
    id: 'limites',
    title: 'Límites Políticos',
    subtitle: 'División Territorial',
    icon: '🏛️',
    defaultOn: true,
    color: '#1B4332',
  },
  {
    id: 'colectivos',
    title: 'Colectivos',
    subtitle: 'Territorios Étnicos',
    icon: '🏘️',
    defaultOn: false,
    color: '#E67E22',
  },
  {
    id: 'ecosistemas',
    title: 'Ecosistemas',
    subtitle: 'Biodiversidad',
    icon: '🌿',
    defaultOn: true,
    color: '#27AE60',
  },
  {
    id: 'hidrografia',
    title: 'Hidrografía',
    subtitle: 'Cuerpos de Agua',
    icon: '💧',
    defaultOn: false,
    color: '#3498DB',
  },
]

// ── Tool bar items ──
const TOOLS = [
  { id: 'medir', icon: Ruler, label: 'Medir' },
  { id: 'dibujar', icon: Pencil, label: 'Dibujar' },
  { id: 'capas', icon: Layers, label: 'Capas' },
  { id: 'exportar', icon: Download, label: 'Exportar' },
]

// ── Coordinate + zoom tracker ──
function CoordTracker({ onMove, onZoom }) {
  useMapEvents({
    mousemove(e) {
      const { lat, lng } = e.latlng
      const fmt = (v, dirs) => {
        const d = Math.floor(Math.abs(v))
        const m = Math.floor((Math.abs(v) - d) * 60)
        const s = Math.floor(((Math.abs(v) - d) * 60 - m) * 60)
        return `${d}°${m}'${s}"${v >= 0 ? dirs[0] : dirs[1]}`
      }
      onMove(`${fmt(lat, ['N','S'])} ${fmt(lng, ['E','W'])}`)
    },
    zoomend(e) { onZoom(e.target.getZoom()) },
  })
  return null
}

// ── Scale bar helper ──
const ZOOM_SCALES = {
  6: '500 km', 7: '200 km', 8: '100 km', 9: '50 km',
  10: '25 km', 11: '10 km', 12: '5 km', 13: '2 km',
  14: '1 km', 15: '500 m', 16: '200 m', 17: '100 m',
}
function getScale(zoom) { return ZOOM_SCALES[zoom] || `1:${Math.round(591657550.5 / Math.pow(2, zoom)).toLocaleString()}` }

// ── Toggle Switch ──
function Toggle({ checked, onChange, color }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        checked ? 'bg-primary-800' : 'bg-border'
      }`}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
        style={{
          backgroundColor: checked ? color : '#fff',
          border: checked ? 'none' : '1px solid #E2E8F0',
        }}
      />
    </button>
  )
}

// ── Layers Panel ──
function LayersPanel({ layers, onToggle, visible, onClose, activeTool, onToolChange }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.25 }}
          className="absolute top-4 right-4 z-[1000] w-[300px] bg-white rounded-xl shadow-float overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h3 className="text-base font-bold text-text">Capas de Información</h3>
              <p className="text-[0.6rem] text-text-muted mt-0.5">{layers.length} de {LAYER_GROUPS.length} activas</p>
            </div>
            <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text hover:bg-bg-alt rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Layer list */}
          <div className="p-3 space-y-1">
            {LAYER_GROUPS.map((layer) => {
              const isOn = layers.includes(layer.id)
              return (
                <div
                  key={layer.id}
                  onClick={() => onToggle(layer.id)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors ${isOn ? 'bg-primary-50' : 'hover:bg-bg-alt'}`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0 transition-colors ${isOn ? 'bg-white shadow-sm' : 'bg-bg-alt'}`}>
                    {layer.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-sm font-bold text-text">{layer.title}</span>
                    <span className="block text-[0.65rem] font-medium uppercase tracking-wider text-text-muted">{layer.subtitle}</span>
                  </div>
                  <Toggle checked={isOn} onChange={() => {}} color={layer.color} />
                </div>
              )
            })}
          </div>

          {/* Bottom tools bar */}
          <div className="bg-primary-900 px-4 py-3 flex items-center justify-around">
            {TOOLS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => onToolChange(id === activeTool ? null : id)}
                className={`flex flex-col items-center gap-1 transition-colors ${activeTool === id ? 'text-primary-300' : 'text-white/60 hover:text-white'}`}
                title={label}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[0.6rem] font-bold uppercase tracking-wider">{label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Legend Panel ──
function LegendPanel({ layers, visible, onClose }) {
  const active = LAYER_GROUPS.filter((l) => layers.includes(l.id))
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-16 left-4 z-[1000] w-56 bg-white rounded-xl shadow-float overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-xs font-bold uppercase tracking-wider text-text">Leyenda</span>
            <button onClick={onClose} className="p-0.5 text-text-muted hover:text-text transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-3 space-y-2">
            {active.length === 0 && (
              <p className="text-xs text-text-muted text-center py-2">Sin capas activas</p>
            )}
            {active.map((layer) => (
              <div key={layer.id} className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: layer.color }} />
                <div>
                  <p className="text-xs font-semibold text-text leading-none">{layer.title}</p>
                  <p className="text-[0.6rem] text-text-muted">{layer.subtitle}</p>
                </div>
              </div>
            ))}
            <div className="pt-1 mt-1 border-t border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-sm shrink-0 border-2 border-primary-800 bg-primary-800/15" />
                <p className="text-xs font-semibold text-text">Chocó Biogeográfico</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Basemap Selector ──
function BasemapSelector({ active, onChange }) {
  return (
    <div className="absolute bottom-4 right-4 z-[1000] flex gap-1.5">
      {TILE_LAYERS.map((tile) => (
        <button
          key={tile.id}
          onClick={() => onChange(tile.id)}
          className={`w-14 h-10 rounded-lg border-2 transition-colors overflow-hidden ${
            active === tile.id
              ? 'border-primary-800'
              : 'border-white/80 hover:border-primary-300'
          }`}
          title={tile.label}
        >
          <div className={`w-full h-full ${
            tile.id === 'dark' ? 'bg-gray-700' : tile.id === 'voyager' ? 'bg-bg-alt' : 'bg-white'
          }`} />
        </button>
      ))}
    </div>
  )
}

// ── Main Geovisor Page ──
export default function Geovisor() {
  const mapRef = useRef(null)
  const [coords, setCoords] = useState("5°41'13\"N 76°39'31\"W")
  const [zoom, setZoom] = useState(MAP_ZOOM)
  const [activeLayers, setActiveLayers] = useState(['limites', 'ecosistemas'])
  const [showPanel, setShowPanel] = useState(true)
  const [showLegend, setShowLegend] = useState(false)
  const [activeBasemap, setActiveBasemap] = useState('light')
  const [activeTool, setActiveTool] = useState(null)
  const [locating, setLocating] = useState(false)
  const { toasts, toast, dismiss } = useToast()

  const toggleLayer = (id) => setActiveLayers((prev) =>
    prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
  )

  const handleZoomIn  = useCallback(() => mapRef.current?.zoomIn(), [])
  const handleZoomOut = useCallback(() => mapRef.current?.zoomOut(), [])
  const handleReset   = useCallback(() => mapRef.current?.setView(MAP_CENTER, MAP_ZOOM), [])

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) { toast('Geolocalización no disponible en este navegador', 'error'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        mapRef.current?.setView([lat, lng], 13)
        toast('Ubicación encontrada', 'success')
        setLocating(false)
      },
      () => {
        toast('No se pudo obtener la ubicación', 'error')
        setLocating(false)
      },
      { timeout: 8000 }
    )
  }, [toast])

  const handleExport = useCallback(() => {
    toast('Exportando mapa como PNG...', 'info')
  }, [toast])

  const currentTile = TILE_LAYERS.find((t) => t.id === activeBasemap) || TILE_LAYERS[0]

  return (
    <div className="-m-4 lg:-m-6 h-[calc(100vh-56px-64px)] lg:h-[calc(100vh-56px-49px)] relative">
      {/* ── Map ── */}
      <MapContainer
        ref={mapRef}
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        zoomControl={false}
        className="h-full w-full z-0"
      >
        <TileLayer
          key={activeBasemap}
          url={currentTile.url}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <CoordTracker onMove={setCoords} onZoom={setZoom} />
        <Polygon
          positions={CHOCO_POLYGON}
          pathOptions={{ color: '#1B4332', weight: 2, fillColor: '#40916C', fillOpacity: 0.15 }}
        />
      </MapContainer>

      {/* ── Active tool banner ── */}
      <AnimatePresence>
        {activeTool && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 bg-primary-900/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-xs font-semibold shadow-elevated"
          >
            <span className="w-2 h-2 rounded-full bg-primary-300 animate-pulse" />
            Herramienta activa: <span className="text-primary-300 capitalize">{activeTool}</span>
            <button onClick={() => setActiveTool(null)} className="ml-1 hover:text-primary-300 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Left Map Controls ── */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-[1000]">
        {[
          { icon: Plus,       label: 'Acercar',       onClick: handleZoomIn },
          { icon: Minus,      label: 'Alejar',        onClick: handleZoomOut },
          { icon: RotateCw,   label: 'Vista inicial', onClick: handleReset },
        ].map(({ icon: Icon, label, onClick }) => (
          <button key={label} title={label} onClick={onClick}
            className="w-10 h-10 rounded-xl shadow-card bg-white text-text hover:bg-bg-alt flex items-center justify-center transition-colors">
            <Icon className="w-5 h-5" />
          </button>
        ))}
        {/* Geolocation */}
        <button
          title="Mi ubicación"
          onClick={handleLocate}
          disabled={locating}
          className={`w-10 h-10 rounded-xl shadow-card flex items-center justify-center transition-colors ${locating ? 'bg-primary-200 text-primary-700' : 'bg-primary-300 text-primary-900 hover:bg-primary-400'}`}
        >
          {locating
            ? <span className="w-4 h-4 border-2 border-primary-700 border-t-transparent rounded-full animate-spin" />
            : <Navigation className="w-5 h-5" />
          }
        </button>
        {/* Export */}
        <button title="Exportar mapa" onClick={handleExport}
          className="w-10 h-10 rounded-xl shadow-card bg-white text-text hover:bg-bg-alt flex items-center justify-center transition-colors">
          <Download className="w-5 h-5" />
        </button>
      </div>

      {/* ── Layers Panel (right) ── */}
      <LayersPanel
        layers={activeLayers}
        onToggle={toggleLayer}
        visible={showPanel}
        onClose={() => setShowPanel(false)}
        activeTool={activeTool}
        onToolChange={setActiveTool}
      />

      {/* Toggle panel button (when closed) */}
      {!showPanel && (
        <button onClick={() => setShowPanel(true)}
          className="absolute top-4 right-4 z-[1000] w-10 h-10 bg-white rounded-xl shadow-card flex items-center justify-center text-text hover:bg-bg-alt transition-colors"
          title="Abrir capas"
        >
          <div className="relative">
            <Layers className="w-5 h-5" />
            {activeLayers.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary-800 text-white text-[0.5rem] font-bold rounded-full flex items-center justify-center">
                {activeLayers.length}
              </span>
            )}
          </div>
        </button>
      )}

      {/* ── Bottom Bar: Legend + Coordinates + Scale ── */}
      <div className="absolute bottom-4 left-4 z-[1000] flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setShowLegend((v) => !v)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-card text-xs font-bold transition-colors ${showLegend ? 'bg-primary-800 text-white' : 'bg-white text-text hover:bg-bg-alt'}`}
        >
          <List className="w-4 h-4" />
          <span className="uppercase tracking-wider">Leyenda</span>
          {activeLayers.length > 0 && (
            <span className={`w-5 h-5 rounded-full text-[0.6rem] font-bold flex items-center justify-center ${showLegend ? 'bg-white text-primary-800' : 'bg-primary-800 text-white'}`}>
              {activeLayers.length}
            </span>
          )}
        </button>
        <div className="bg-primary-900/80 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-xs font-mono tracking-wide hidden sm:block">
          {coords}
        </div>
        <div className="bg-primary-900/80 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-xs font-mono tracking-wide">
          {getScale(zoom)}
        </div>
      </div>

      {/* ── Legend Panel ── */}
      <LegendPanel layers={activeLayers} visible={showLegend} onClose={() => setShowLegend(false)} />

      {/* ── Basemap Selector (bottom right) ── */}
      <BasemapSelector active={activeBasemap} onChange={setActiveBasemap} />

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  )
}