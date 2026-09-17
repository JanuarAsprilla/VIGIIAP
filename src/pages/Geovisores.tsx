import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Globe, Search, MapPinned, Users, ShieldCheck, Loader2 } from 'lucide-react'
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

function GeovisorCard({ geovisor, index, colors }: { geovisor: GeovisorRaw; index: number; colors: { accent: string; pill: string } }) {
  const restringido = VISIBILIDAD_BADGE[geovisor.visibilidad]

  return (
    <Card3D
      {...cardEnter3D(index)}
      glow={`${colors.accent}38`}
      intensity={5}
      className="group bg-[var(--card-bg)] border border-border/70 rounded-2xl overflow-hidden flex flex-col"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
    >
      <Link to={`/geovisores/${geovisor.slug}`} className="flex flex-col flex-1 no-underline text-inherit">
        <div className="relative h-40 overflow-hidden bg-bg-alt shrink-0">
          {geovisor.thumbnailUrl ? (
            <img src={geovisor.thumbnailUrl} alt={geovisor.titulo}
              width={320} height={160}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
              loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center relative overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${colors.accent}14 0%, ${colors.accent}06 100%)` }}>
              <div className="absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage: `radial-gradient(circle, ${colors.accent} 1px, transparent 1px)`,
                  backgroundSize: '18px 18px',
                }} />
              <MapPinned className="relative w-12 h-12" style={{ color: colors.accent, opacity: 0.24 }} aria-hidden="true" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
          {restringido && (
            <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 bg-black/55 backdrop-blur-sm text-white text-[0.6rem] font-bold uppercase tracking-wide rounded-lg">
              <restringido.Icon className="w-3 h-3" aria-hidden="true" />
              {restringido.label}
            </span>
          )}
        </div>

        <div className="p-5 flex flex-col flex-1">
          {geovisor.categoria && (
            <span className={`self-start text-[0.6rem] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3 ${colors.pill}`}>
              {geovisor.categoria}
            </span>
          )}
          <h3 className="text-sm font-bold text-text leading-snug mb-2 line-clamp-2">{geovisor.titulo}</h3>
          {(geovisor.subtitulo || geovisor.descripcion) && (
            <p className="text-xs text-text-muted leading-relaxed line-clamp-2 flex-1">
              {geovisor.subtitulo || geovisor.descripcion}
            </p>
          )}
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 mt-4 pt-3 border-t border-border/60">
            <Globe className="w-3.5 h-3.5" aria-hidden="true" />
            Abrir geovisor
          </span>
        </div>
      </Link>
    </Card3D>
  )
}

export default function Geovisores() {
  const { query } = useSearch()
  const { data, isLoading, isError } = useGeovisoresPublico()
  const geovisores = data?.data ?? []

  const filtrados = geovisores.filter((g) => matches([g.titulo, g.categoria, g.subtitulo, g.descripcion], query))

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

      {categoriasOrdenadas.map((categoria, seccionIndex) => (
        <motion.section key={categoria} {...fadeUp(0.05 + seccionIndex * 0.03)} className="space-y-4">
          <h2 className="text-lg font-bold text-text flex items-center gap-2">
            {categoria}
            <span className="text-xs font-normal text-text-muted">
              ({grupos.get(categoria)!.length})
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {grupos.get(categoria)!.map((geovisor, i) => (
              <GeovisorCard key={geovisor.id} geovisor={geovisor} index={i} colors={colorDeCategoria(categoria)} />
            ))}
          </div>
        </motion.section>
      ))}
    </div>
  )
}
