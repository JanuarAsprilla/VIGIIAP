import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Globe, Search, MapPinned, Users, ShieldCheck, Loader2, Rows, Columns2, Columns3,
} from 'lucide-react'
import { useGeovisoresPublico } from '@/hooks/useGeovisores'
import { useSearch } from '@/contexts/SearchContext'
import { matches } from '@/lib/search'
import { cardEnter3D, fadeUp } from '@/lib/animations'
import Card3D from '@/components/ui/Card3D'
import type { GeovisorRaw } from '@/types'

// Paleta determinista por nombre de categoría -- los geovisores no tienen un enum fijo de
// categorías (como sí lo tiene Mapas), así que en vez de mantener un mapa manual se deriva un
// color estable a partir del propio texto.
const PALETA_CATEGORIA = [
  { accent: '#1B4332', pill: 'bg-primary-800/10 text-primary-700' },
  { accent: '#B08D57', pill: 'bg-gold-400/12 text-gold-400' },
  { accent: '#C0357C', pill: 'bg-magenta/12 text-magenta' },
  { accent: '#2563EB', pill: 'bg-blue-600/10 text-blue-700' },
  { accent: '#0F766E', pill: 'bg-teal-600/10 text-teal-700' },
  { accent: '#B45309', pill: 'bg-amber-600/10 text-amber-700' },
]

function colorDeCategoria(categoria: string) {
  let hash = 0
  for (let i = 0; i < categoria.length; i++) hash = (hash * 31 + categoria.charCodeAt(i)) >>> 0
  return PALETA_CATEGORIA[hash % PALETA_CATEGORIA.length]
}

const VISIBILIDAD_BADGE: Partial<Record<GeovisorRaw['visibilidad'], { label: string; Icon: typeof Users }>> = {
  usuarios: { label: 'Usuarios registrados', Icon: Users },
  acreditados: { label: 'Acreditados', Icon: ShieldCheck },
}

// Tarjeta "full-bleed" -- mismo lenguaje visual que MapCard (Mapas.tsx): la
// miniatura (o el gradiente de respaldo) llena toda la tarjeta, con un
// degradado permanente para legibilidad y el texto superpuesto, en vez del
// patrón anterior de "imagen arriba + caja blanca abajo" que quedaba plano
// para geovisores sin miniatura ni descripción (la mayoría, hoy).
function GeovisorCard({ geovisor, index, colors }: { geovisor: GeovisorRaw; index: number; colors: { accent: string; pill: string } }) {
  const restringido = VISIBILIDAD_BADGE[geovisor.visibilidad]

  return (
    <Card3D
      {...cardEnter3D(index)}
      glow={`${colors.accent}38`}
      intensity={5}
      className="group/card relative h-64 bg-[var(--card-bg)] border border-border/70 rounded-2xl overflow-hidden"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
    >
      <Link to={`/geovisores/${geovisor.slug}`} className="absolute inset-0 no-underline text-inherit"
        aria-label={`${geovisor.titulo}${geovisor.categoria ? `, ${geovisor.categoria}` : ''}`}>
        {geovisor.thumbnailUrl ? (
          <img src={geovisor.thumbnailUrl} alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover bg-bg-alt group-hover/card:scale-105 transition-transform duration-500" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${colors.accent}2e 0%, ${colors.accent}0a 100%)` }}>
            <div className="absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage: `radial-gradient(circle, ${colors.accent} 1px, transparent 1px)`,
                backgroundSize: '18px 18px',
              }} />
            <MapPinned className="relative w-14 h-14 group-hover/card:scale-110 transition-transform duration-500"
              style={{ color: colors.accent, opacity: 0.3 }} aria-hidden="true" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10 pointer-events-none" />

        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          {geovisor.categoria && (
            <span className="text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white bg-black/40 backdrop-blur-sm">
              {geovisor.categoria}
            </span>
          )}
          {restringido && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-black/55 backdrop-blur-sm text-white text-[0.6rem] font-bold uppercase tracking-wide rounded-lg shrink-0">
              <restringido.Icon className="w-3 h-3" aria-hidden="true" />
              {restringido.label}
            </span>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-sm font-bold text-white leading-snug line-clamp-2">{geovisor.titulo}</p>
          {(geovisor.subtitulo || geovisor.descripcion) && (
            <p className="text-xs text-white/70 mt-1 line-clamp-2">
              {geovisor.subtitulo || geovisor.descripcion}
            </p>
          )}
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white mt-3 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
            <Globe className="w-3.5 h-3.5" aria-hidden="true" />
            Abrir geovisor
          </span>
        </div>
      </Link>
    </Card3D>
  )
}

const COLS_STORAGE_KEY = 'vigiiap:geovisores-cols'
const COLS_GRID_CLASS: Record<1 | 2 | 3, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
}

export default function Geovisores() {
  const { query } = useSearch()
  const { data, isLoading, isError } = useGeovisoresPublico()
  const geovisores = data?.data ?? []

  // Columnas de la cuadrícula -- elegible y recordado en este navegador,
  // igual que en Mapas (misma clave de patrón, distinto namespace).
  const [cols, setCols] = useState<1 | 2 | 3>(() => {
    if (typeof window === 'undefined') return 3
    const raw = Number(window.localStorage.getItem(COLS_STORAGE_KEY))
    return raw === 1 || raw === 2 || raw === 3 ? raw : 3
  })
  const changeCols = (n: 1 | 2 | 3) => {
    setCols(n)
    try { window.localStorage.setItem(COLS_STORAGE_KEY, String(n)) } catch { /* localStorage no disponible */ }
  }

  const filtrados = geovisores
    .filter((g) => matches([g.titulo, g.categoria, g.subtitulo, g.descripcion], query))
    .sort((a, b) => a.titulo.localeCompare(b.titulo))

  const grupos = new Map<string, GeovisorRaw[]>()
  filtrados.forEach((g) => {
    const categoria = g.categoria || 'General'
    if (!grupos.has(categoria)) grupos.set(categoria, [])
    grupos.get(categoria)!.push(g)
  })
  const categoriasOrdenadas = [...grupos.keys()].sort((a, b) => a.localeCompare(b))

  return (
    <div className="space-y-8">
      <motion.div {...fadeUp(0)}>
        <span className="page-header-tag block mb-2">Portal Institucional</span>
        <h1 className="page-header-title mb-3">Portal de <em>Geovisores</em></h1>
        <p className="page-header-description max-w-2xl">
          Explore la información geoespacial del Sistema de Información Territorial del Chocó —
          capas reales conectadas en vivo a GeoServer, organizadas por temática.
        </p>
      </motion.div>

      {isLoading && (
        <motion.div {...fadeUp(0.05)} className="flex items-center justify-center py-24 text-text-muted gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Cargando geovisores…</span>
        </motion.div>
      )}

      {isError && (
        <motion.div {...fadeUp(0.05)} className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-sm text-text-muted">No se pudieron cargar los geovisores. Intenta de nuevo más tarde.</p>
        </motion.div>
      )}

      {!isLoading && !isError && geovisores.length === 0 && (
        <motion.div {...fadeUp(0.05)} className="flex flex-col items-center justify-center py-24 text-center gap-4 bg-[var(--card-bg)] border border-dashed border-border rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-primary-800/10 flex items-center justify-center">
            <MapPinned className="w-8 h-8 text-primary-800" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text mb-1">Aún no hay geovisores publicados</h3>
            <p className="text-sm text-text-muted max-w-sm">El equipo del IIAP está configurando los primeros geovisores temáticos. Vuelve pronto.</p>
          </div>
        </motion.div>
      )}

      {!isLoading && !isError && geovisores.length > 0 && filtrados.length === 0 && (
        <motion.div {...fadeUp(0.05)} className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <Search className="w-8 h-8 text-text-muted/50" aria-hidden="true" />
          <p className="text-sm text-text-muted">Ningún geovisor coincide con «{query}».</p>
        </motion.div>
      )}

      {!isLoading && !isError && filtrados.length > 0 && (
        <div className="flex justify-end">
          <div role="group" aria-label="Columnas de la cuadrícula" className="flex items-center gap-1 p-1 bg-[var(--card-bg)] border border-border rounded-xl">
            {([
              { n: 1 as const, Icon: Rows,     label: '1 columna' },
              { n: 2 as const, Icon: Columns2, label: '2 columnas' },
              { n: 3 as const, Icon: Columns3, label: '3 columnas' },
            ]).map(({ n, Icon, label }) => (
              <button key={n} type="button" onClick={() => changeCols(n)} title={label} aria-label={label}
                aria-pressed={cols === n}
                className={`p-2 rounded-lg transition-colors ${
                  cols === n ? 'bg-primary-800 text-white' : 'text-text-muted hover:bg-bg-alt hover:text-text'
                }`}>
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      )}

      {categoriasOrdenadas.map((categoria, seccionIndex) => (
        <motion.section key={categoria} {...fadeUp(0.05 + seccionIndex * 0.03)} className="space-y-4">
          <h2 className="text-lg font-bold text-text flex items-center gap-2">
            {categoria}
            <span className="text-xs font-normal text-text-muted">
              ({grupos.get(categoria)!.length})
            </span>
          </h2>
          <div className={`grid ${COLS_GRID_CLASS[cols]} gap-6`}>
            {grupos.get(categoria)!.map((geovisor, i) => (
              <GeovisorCard key={geovisor.id} geovisor={geovisor} index={i} colors={colorDeCategoria(categoria)} />
            ))}
          </div>
        </motion.section>
      ))}
    </div>
  )
}
