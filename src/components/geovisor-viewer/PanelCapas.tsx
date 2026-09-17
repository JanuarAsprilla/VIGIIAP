import { useState } from 'react'
import { useMap } from 'react-leaflet'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown, ChevronUp, ChevronRight, Layers, Crosshair, X,
} from 'lucide-react'
import type { TemaCapas, CapaGeoserver } from '@/types'

interface CapaActiva {
  capa: CapaGeoserver
  tema: string
}

const PALETA_TEMA = ['#1B4332', '#B08D57', '#C0357C', '#2563EB', '#B45309', '#0F766E', '#7C3AED', '#DC2626']

function colorDeTemaRespaldo(temaId: string) {
  let hash = 0
  for (let i = 0; i < temaId.length; i++) hash = (hash * 31 + temaId.charCodeAt(i)) >>> 0
  return PALETA_TEMA[hash % PALETA_TEMA.length]
}

function FilaCapaActiva({ capaActiva, color, leyendaUrl, expandida, onToggleLeyenda, onUbicar, onQuitar, onMover, esPrimera, esUltima }: {
  capaActiva: CapaActiva
  color: string
  leyendaUrl: string
  expandida: boolean
  onToggleLeyenda: () => void
  onUbicar: () => void
  onQuitar: () => void
  onMover: (direccion: 'subir' | 'bajar') => void
  esPrimera: boolean
  esUltima: boolean
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="border border-border/70 rounded-lg bg-[var(--card-bg)] overflow-hidden"
    >
      <div className="flex items-center gap-2 px-2.5 py-2">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} aria-hidden="true" />
        <span className="text-xs font-semibold text-text truncate flex-1">{capaActiva.capa.nombre}</span>
        <div className="flex items-center gap-0.5 shrink-0">
          <button type="button" onClick={() => onMover('subir')} disabled={esUltima} title="Subir"
            className="p-1 rounded text-text-muted hover:text-primary-700 hover:bg-primary-500/10 disabled:opacity-30 disabled:pointer-events-none transition-colors">
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => onMover('bajar')} disabled={esPrimera} title="Bajar"
            className="p-1 rounded text-text-muted hover:text-primary-700 hover:bg-primary-500/10 disabled:opacity-30 disabled:pointer-events-none transition-colors">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {capaActiva.capa.bbox && (
            <button type="button" onClick={onUbicar} title="Ubicar capa"
              className="p-1 rounded text-text-muted hover:text-primary-700 hover:bg-primary-500/10 transition-colors">
              <Crosshair className="w-3.5 h-3.5" />
            </button>
          )}
          <button type="button" onClick={onToggleLeyenda} title="Leyenda"
            className="p-1 rounded text-text-muted hover:text-primary-700 hover:bg-primary-500/10 transition-colors">
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandida ? 'rotate-180' : ''}`} />
          </button>
          <button type="button" onClick={onQuitar} title="Quitar capa"
            className="p-1 rounded text-text-muted hover:text-red-dark hover:bg-red/10 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {expandida && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-2.5 pb-2.5 pt-0.5">
              <img src={leyendaUrl} alt={`Leyenda de ${capaActiva.capa.nombre}`} crossOrigin="use-credentials"
                className="max-w-full rounded border border-border/50 bg-white" loading="lazy" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function PanelCapas({ temas, capasActivas, colorPorTema, apiBase, slug, onToggleCapa, onMoverCapa }: {
  temas: TemaCapas[]
  capasActivas: CapaActiva[]
  colorPorTema: Record<string, string>
  apiBase: string
  slug: string
  onToggleCapa: (capa: CapaGeoserver, tema: string) => void
  onMoverCapa: (capaId: string, direccion: 'subir' | 'bajar') => void
}) {
  const map = useMap()
  const [temasExpandidos, setTemasExpandidos] = useState<Set<string>>(new Set())
  const [leyendasExpandidas, setLeyendasExpandidas] = useState<Set<string>>(new Set())
  const [colapsado, setColapsado] = useState(false)

  const idsActivos = new Set(capasActivas.map((c) => c.capa.id))

  const toggleTema = (temaId: string) => setTemasExpandidos((prev) => {
    const next = new Set(prev)
    if (next.has(temaId)) next.delete(temaId)
    else next.add(temaId)
    return next
  })
  const toggleLeyenda = (capaId: string) => setLeyendasExpandidas((prev) => {
    const next = new Set(prev)
    if (next.has(capaId)) next.delete(capaId)
    else next.add(capaId)
    return next
  })

  const ubicarCapa = (capa: CapaGeoserver) => {
    if (!capa.bbox) return
    map.flyToBounds([[capa.bbox.sur, capa.bbox.oeste], [capa.bbox.norte, capa.bbox.este]], { duration: 0.6 })
  }

  return (
    <div className="absolute top-3 left-3 z-[1000] w-72 max-h-[calc(100%-1.5rem)] flex flex-col">
      <div className="bg-[var(--card-bg)]/95 backdrop-blur-sm border border-border rounded-xl shadow-md flex flex-col overflow-hidden">
        <button type="button" onClick={() => setColapsado((v) => !v)}
          className="flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-text uppercase tracking-wide shrink-0">
          <Layers className="w-4 h-4 text-primary-700" aria-hidden="true" />
          Capas
          <ChevronDown className={`w-3.5 h-3.5 ml-auto text-text-muted transition-transform ${colapsado ? '-rotate-90' : ''}`} />
        </button>

        {!colapsado && (
          <div className="overflow-y-auto px-2.5 pb-2.5 space-y-3" style={{ maxHeight: '70vh' }}>
            {capasActivas.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted px-0.5">
                  Activas ({capasActivas.length})
                </p>
                <AnimatePresence initial={false}>
                  {[...capasActivas].reverse().map((ca, i) => (
                    <FilaCapaActiva
                      key={ca.capa.id}
                      capaActiva={ca}
                      color={colorPorTema[ca.tema] ?? colorDeTemaRespaldo(ca.tema)}
                      leyendaUrl={`${apiBase}/geovisores/${slug}/capas/${encodeURIComponent(ca.capa.id)}/leyenda`}
                      expandida={leyendasExpandidas.has(ca.capa.id)}
                      onToggleLeyenda={() => toggleLeyenda(ca.capa.id)}
                      onUbicar={() => ubicarCapa(ca.capa)}
                      onQuitar={() => onToggleCapa(ca.capa, ca.tema)}
                      onMover={(dir) => onMoverCapa(ca.capa.id, dir)}
                      esPrimera={i === capasActivas.length - 1}
                      esUltima={i === 0}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted px-0.5">Catálogo</p>
              {temas.length === 0 && (
                <p className="text-xs text-text-muted px-0.5 py-2">Este geovisor no tiene capas publicadas todavía.</p>
              )}
              {temas.map((tema) => {
                const abierto = temasExpandidos.has(tema.id)
                return (
                  <div key={tema.id} className="border border-border/60 rounded-lg overflow-hidden">
                    <button type="button" onClick={() => toggleTema(tema.id)}
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-text hover:bg-bg-alt transition-colors">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colorPorTema[tema.id] ?? colorDeTemaRespaldo(tema.id) }} aria-hidden="true" />
                      <span className="truncate flex-1 text-left">{tema.nombre}</span>
                      <span className="text-[0.6rem] text-text-muted">{tema.capas.length}</span>
                      <ChevronRight className={`w-3.5 h-3.5 text-text-muted transition-transform ${abierto ? 'rotate-90' : ''}`} />
                    </button>
                    {abierto && (
                      <div className="border-t border-border/50 divide-y divide-border/40">
                        {tema.capas.map((capa) => (
                          <label key={capa.id} className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-text cursor-pointer hover:bg-bg-alt transition-colors">
                            <input type="checkbox" checked={idsActivos.has(capa.id)} onChange={() => onToggleCapa(capa, tema.id)}
                              className="w-3.5 h-3.5 rounded border-border text-primary-800 focus:ring-primary-800/30 shrink-0" />
                            <span className="truncate flex-1">{capa.nombre}</span>
                            <span className="text-[0.55rem] uppercase font-bold text-text-muted/70 shrink-0">{capa.tipo === 'raster' ? 'raster' : 'vector'}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
