import { useState, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Polygon, useMapEvents } from 'react-leaflet'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Minus, Crosshair, RotateCw,
  Ruler, Pencil, Layers, Download,
  List, SlidersHorizontal,
} from 'lucide-react'
import 'leaflet/dist/leaflet.css'

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

// ── Coordinate tracker ──
function CoordTracker({ onMove }) {
  useMapEvents({
    mousemove(e) {
      const lat = e.latlng.lat
      const lng = e.latlng.lng

      const latDeg = Math.floor(Math.abs(lat))
      const latMin = Math.floor((Math.abs(lat) - latDeg) * 60)
      const latSec = Math.floor(((Math.abs(lat) - latDeg) * 60 - latMin) * 60)
      const latDir = lat >= 0 ? 'N' : 'S'

      const lngDeg = Math.floor(Math.abs(lng))
      const lngMin = Math.floor((Math.abs(lng) - lngDeg) * 60)
      const lngSec = Math.floor(((Math.abs(lng) - lngDeg) * 60 - lngMin) * 60)
      const lngDir = lng >= 0 ? 'E' : 'W'

      onMove(`${latDeg}°${latMin}'${latSec}"${latDir} ${lngDeg}°${lngMin}'${lngSec}"${lngDir}`)
    },
  })
  return null
}

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
function LayersPanel({ layers, onToggle, visible, onClose }) {
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
            <h3 className="text-base font-bold text-text">Capas de Información</h3>
            <button
              onClick={onClose}
              className="p-1 text-text-muted hover:text-text transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Layer list */}
          <div className="p-4 space-y-1">
            {LAYER_GROUPS.map((layer) => (
              <div
                key={layer.id}
                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-bg-alt transition-colors"
              >
                {/* Icon */}
                <div className="w-10 h-10 bg-bg-alt rounded-lg flex items-center justify-center text-lg shrink-0">
                  {layer.icon}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <span className="block text-sm font-bold text-text">{layer.title}</span>
                  <span className="block text-[0.65rem] font-medium uppercase tracking-wider text-text-muted">
                    {layer.subtitle}
                  </span>
                </div>

                {/* Toggle */}
                <Toggle
                  checked={layers.includes(layer.id)}
                  onChange={() => onToggle(layer.id)}
                  color={layer.color}
                />
              </div>
            ))}
          </div>

          {/* Bottom tools bar */}
          <div className="bg-primary-800 px-4 py-3 flex items-center justify-around">
            {TOOLS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors"
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
  const [activeLayers, setActiveLayers] = useState(['limites', 'ecosistemas'])
  const [showPanel, setShowPanel] = useState(true)
  const [activeBasemap, setActiveBasemap] = useState('light')

  const toggleLayer = (id) => {
    setActiveLayers((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    )
  }

  const handleZoomIn = useCallback(() => mapRef.current?.zoomIn(), [])
  const handleZoomOut = useCallback(() => mapRef.current?.zoomOut(), [])
  const handleResetView = useCallback(() => {
    mapRef.current?.setView(MAP_CENTER, MAP_ZOOM)
  }, [])

  const currentTile = TILE_LAYERS.find((t) => t.id === activeBasemap) || TILE_LAYERS[0]

  return (
    <div className="-m-6 h-[calc(100vh-56px-49px)] relative">
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
        <CoordTracker onMove={setCoords} />

        {/* Region outline */}
        <Polygon
          positions={CHOCO_POLYGON}
          pathOptions={{
            color: '#1B4332',
            weight: 2,
            fillColor: '#40916C',
            fillOpacity: 0.15,
          }}
        />
      </MapContainer>

      {/* ── Left Map Controls ── */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-[1000]">
        {[
          { icon: Plus, label: 'Acercar', onClick: handleZoomIn },
          { icon: Minus, label: 'Alejar', onClick: handleZoomOut },
          { icon: Crosshair, label: 'Mi ubicación', onClick: handleResetView, accent: false },
          { icon: RotateCw, label: 'Vista 3D', accent: false },
        ].map(({ icon: Icon, label, onClick, accent }) => (
          <button
            key={label}
            title={label}
            onClick={onClick}
            className={`w-10 h-10 rounded-xl shadow-card flex items-center justify-center transition-colors ${
              label === 'Mi ubicación'
                ? 'bg-primary-300 text-primary-900 hover:bg-primary-400'
                : 'bg-white text-text hover:bg-bg-alt'
            }`}
          >
            <Icon className="w-5 h-5" />
          </button>
        ))}
      </div>

      {/* ── Layers Panel (right) ── */}
      <LayersPanel
        layers={activeLayers}
        onToggle={toggleLayer}
        visible={showPanel}
        onClose={() => setShowPanel(false)}
      />

      {/* Toggle panel button (when closed) */}
      {!showPanel && (
        <button
          onClick={() => setShowPanel(true)}
          className="absolute top-4 right-4 z-[1000] w-10 h-10 bg-white rounded-xl shadow-card flex items-center justify-center text-text hover:bg-bg-alt transition-colors"
          title="Abrir capas"
        >
          <Layers className="w-5 h-5" />
        </button>
      )}

      {/* ── Bottom Bar: Legend + Coordinates + Scale ── */}
      <div className="absolute bottom-4 left-4 z-[1000] flex items-center gap-3">
        {/* Legend button */}
        <button className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-lg shadow-card text-sm font-bold text-text hover:bg-bg-alt transition-colors">
          <List className="w-4 h-4" />
          <span className="uppercase tracking-wider text-[0.7rem]">Leyenda Mapa</span>
        </button>

        {/* Coordinates */}
        <div className="bg-primary-900/80 backdrop-blur-sm text-white px-4 py-2.5 rounded-lg text-xs font-mono tracking-wide">
          COORD: {coords}
        </div>

        {/* Scale */}
        <div className="bg-primary-900/80 backdrop-blur-sm text-white px-4 py-2.5 rounded-lg text-xs font-mono tracking-wide">
          ESCALA: 1:25,000
        </div>
      </div>

      {/* ── Basemap Selector (bottom right) ── */}
      <BasemapSelector active={activeBasemap} onChange={setActiveBasemap} />
    </div>
  )
}