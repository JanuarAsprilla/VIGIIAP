import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, Pencil, CheckCircle, Globe, Layers, MapPinned,
  ShieldAlert, Power, Search, X, AlertTriangle, Rows, Columns2, Columns3,
} from 'lucide-react'
import { fadeUpSm, panelAnim } from '@/lib/animations'
import { getApiErrorMessage } from '@/lib/apiError'
import {
  useGeovisoresList, useToggleGeovisorActivo, useDeleteGeovisor,
} from '@/hooks/useGeovisores'
import { useConexionesGeoserverList } from '@/hooks/useConexionesGeoserver'
import type { GeovisorRaw } from '@/types'
import GeovisorFormModal from '@/components/admin/geovisores/GeovisorFormModal'

const fadeUp = fadeUpSm

const COLS_STORAGE_KEY = 'vigiiap:admin-geovisores-cols'
const COLS_GRID_CLASS: Record<1 | 2 | 3, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
}

const VISIBILIDAD_PILL: Record<string, string> = {
  publico:     'bg-primary-700/10 text-primary-700',
  usuarios:    'bg-gold-400/12 text-gold-400',
  acreditados: 'bg-magenta/12 text-magenta',
}
const VISIBILIDAD_LABEL: Record<string, string> = {
  publico: 'Público', usuarios: 'Usuarios', acreditados: 'Acreditados',
}

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useState(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t) })
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-3 px-5 py-3 bg-green-700 text-white rounded-2xl shadow-xl"
    >
      <CheckCircle className="w-5 h-5 shrink-0" />
      <span className="text-sm font-semibold">{message}</span>
    </motion.div>
  )
}

// Misma tarjeta "full-bleed" que MapaCard (GestionMapas.tsx) -- miniatura o
// gradiente de respaldo llenando toda la tarjeta, clic para revelar el panel
// de detalle y acciones, en vez de la fila plana anterior que no mostraba
// ninguna miniatura ni distinguía visualmente un geovisor de otro.
function GeovisorCard({
  geovisor, conexionNombre, expanded, onToggleExpand, onEdit, onToggle, onDelete, toggling,
}: {
  geovisor: GeovisorRaw
  conexionNombre: string
  expanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
  toggling: boolean
}) {
  const totalWorkspaces = geovisor.workspacesGeoserver?.length ?? 0

  return (
    <motion.div
      {...fadeUp(0)}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      aria-label={`${geovisor.titulo}. Clic para ver detalle y acciones.`}
      onClick={onToggleExpand}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleExpand() } }}
      className={`group/card relative h-64 rounded-2xl overflow-hidden cursor-pointer border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ring-offset-background ${
        geovisor.activo ? 'border-border/70' : 'border-border/40 opacity-70'
      }`}
    >
      {geovisor.thumbnailUrl ? (
        <img src={geovisor.thumbnailUrl} alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover bg-bg-alt group-hover/card:scale-105 transition-transform duration-500" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-800 to-primary-950">
          <MapPinned className="w-12 h-12 text-white/25" aria-hidden="true" />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10 pointer-events-none" />

      <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className={`text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white bg-black/40 backdrop-blur-sm`}>
            {VISIBILIDAD_LABEL[geovisor.visibilidad] ?? geovisor.visibilidad}
          </span>
          {geovisor.categoria && (
            <span className="text-[0.6rem] font-semibold px-1.5 py-0.5 rounded border border-white/30 text-white bg-black/30 backdrop-blur-sm">
              {geovisor.categoria}
            </span>
          )}
          {!geovisor.activo && (
            <span className="text-[0.6rem] font-semibold px-1.5 py-0.5 rounded bg-white/90 text-text-muted">Inactivo</span>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggle() }}
          disabled={toggling}
          className={`shrink-0 p-1.5 rounded-lg bg-black/30 backdrop-blur-sm transition-colors disabled:opacity-40 ${
            geovisor.activo ? 'text-green-400 hover:bg-black/50' : 'text-white/70 hover:bg-black/50'
          }`}
          title={geovisor.activo ? 'Desactivar' : 'Activar'}
        >
          <Power className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-sm font-bold text-white leading-tight line-clamp-2">{geovisor.titulo}</p>
        <p className="text-xs text-white/70 mt-1 flex items-center gap-1">
          <Globe className="w-3 h-3 shrink-0" />
          <span className="truncate">{conexionNombre}</span>
        </p>
      </div>

      <div
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col justify-end p-4 transition-opacity duration-250 ${
          expanded ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleExpand() }}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Cerrar detalle"
        >
          <X className="w-4 h-4" />
        </button>

        <span className={`self-start text-[0.6rem] font-semibold px-1.5 py-0.5 rounded mb-2 ${VISIBILIDAD_PILL[geovisor.visibilidad] ?? 'bg-white/10 text-white'}`}>
          {VISIBILIDAD_LABEL[geovisor.visibilidad] ?? geovisor.visibilidad}
        </span>
        <p className="text-sm font-bold text-white leading-tight">{geovisor.titulo}</p>
        <p className="text-xs text-white/60 mt-0.5 flex items-center gap-1">
          <Layers className="w-3 h-3 shrink-0" />
          {totalWorkspaces
            ? `${totalWorkspaces} workspace${totalWorkspaces === 1 ? '' : 's'}`
            : 'Todos los workspaces de la conexión'}
        </p>

        <div className="flex items-center gap-2 mt-3">
          <button type="button"
            onClick={(e) => { e.stopPropagation(); onEdit() }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors">
            <Pencil className="w-3.5 h-3.5" /> Editar
          </button>
          <button type="button"
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red/20 text-white hover:bg-red/30 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Eliminar
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function GestionGeovisores() {
  // isError sin manejar antes: si la petición fallaba (429, 500, sesión
  // expirada a medio cargar...), la lista simplemente se veía vacía sin
  // ninguna pista de que hubo un error -- indistinguible de "no hay
  // geovisores" para quien lo ve. Ahora se distingue y se puede reintentar.
  const { data, isLoading, isError, refetch, isRefetching } = useGeovisoresList()
  const { data: conexiones = [] } = useConexionesGeoserverList()
  const geovisores = data?.data ?? []

  const toggleActivo   = useToggleGeovisorActivo()
  const deleteGeovisor  = useDeleteGeovisor()

  const [showForm, setShowForm]         = useState(false)
  const [editing, setEditing]           = useState<GeovisorRaw | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<GeovisorRaw | null>(null)
  const [toast, setToast]               = useState<string | null>(null)
  const [search, setSearch]             = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [expandedId, setExpandedId]     = useState<string | null>(null)

  const [cols, setCols] = useState<1 | 2 | 3>(() => {
    if (typeof window === 'undefined') return 3
    const raw = Number(window.localStorage.getItem(COLS_STORAGE_KEY))
    return raw === 1 || raw === 2 || raw === 3 ? raw : 3
  })
  const changeCols = (n: 1 | 2 | 3) => {
    setCols(n)
    try { window.localStorage.setItem(COLS_STORAGE_KEY, String(n)) } catch { /* localStorage no disponible */ }
  }

  const conexionNombrePorId = Object.fromEntries(conexiones.map((c) => [c.id, c.nombre]))

  const categoriasConGeovisores = [...new Set(geovisores.map((g) => g.categoria).filter(Boolean))]
    .sort((a, b) => a!.localeCompare(b!))

  const filtered = geovisores
    .filter((g) => {
      const q = search.toLowerCase()
      const matchQ = !q || g.titulo.toLowerCase().includes(q)
      const matchC = !filtroCategoria || g.categoria === filtroCategoria
      return matchQ && matchC
    })
    .sort((a, b) => a.titulo.localeCompare(b.titulo))

  const openCreate = () => { setEditing(null); setShowForm(true) }
  const openEdit = (geovisor: GeovisorRaw) => { setEditing(geovisor); setShowForm(true) }

  const handleToggle = async (geovisor: GeovisorRaw) => {
    try {
      await toggleActivo.mutateAsync({ id: geovisor.id, activo: !geovisor.activo })
      setToast(`Geovisor "${geovisor.titulo}" ${geovisor.activo ? 'desactivado' : 'activado'}`)
    } catch (err) {
      setToast(getApiErrorMessage(err, 'No se pudo cambiar el estado'))
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteGeovisor.mutateAsync(deleteTarget.id)
      setToast(`Geovisor "${deleteTarget.titulo}" eliminado`)
    } catch (err) {
      setToast(getApiErrorMessage(err, 'No se pudo eliminar el geovisor'))
    }
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>

      <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[0.7rem] font-bold uppercase tracking-widest" style={{ color: 'var(--hero-eyebrow-text)' }}>Administración</span>
          <h1 className="font-display text-2xl font-bold text-text mt-0.5">Portal de Geovisores</h1>
          <p className="text-sm text-text-muted mt-1">
            {isLoading ? 'Cargando…' : `${geovisores.length} geovisor${geovisores.length === 1 ? '' : 'es'} configurado${geovisores.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <button onClick={openCreate}
          disabled={conexiones.length === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-800 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0">
          <Plus className="w-4 h-4" /> Nuevo geovisor
        </button>
      </motion.div>

      {!isLoading && geovisores.length > 0 && categoriasConGeovisores.length > 1 && (
        <motion.div {...fadeUp(0.03)} className="flex flex-wrap gap-2">
          {categoriasConGeovisores.map((c) => (
            <button key={c}
              onClick={() => setFiltroCategoria(filtroCategoria === c ? '' : c!)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                filtroCategoria === c
                  ? 'bg-primary-800 text-white border-primary-800'
                  : 'bg-[var(--card-bg)] text-text-muted border-border hover:border-primary-800 hover:text-primary-800'
              }`}
            >
              {c}
            </button>
          ))}
        </motion.div>
      )}

      {!isLoading && geovisores.length > 0 && (
        <motion.div {...fadeUp(0.05)} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input type="text" aria-label="Buscar geovisor por título" placeholder="Buscar geovisor por título…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
          />
        </motion.div>
      )}

      {isError && (
        <motion.div {...fadeUp(0.04)} className="flex items-start gap-3 p-4 bg-red/8 border border-red/20 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-red-dark mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-red-dark font-semibold">No se pudieron cargar los geovisores</p>
            <p className="text-xs text-red-dark/80 mt-0.5">Puede ser un problema temporal de conexión o de permisos. Intenta de nuevo.</p>
          </div>
          <button onClick={() => refetch()} disabled={isRefetching}
            className="text-xs font-semibold text-red-dark underline underline-offset-2 disabled:opacity-50 shrink-0">
            {isRefetching ? 'Reintentando…' : 'Reintentar'}
          </button>
        </motion.div>
      )}

      {!isLoading && conexiones.length === 0 && (
        <motion.div {...fadeUp(0.04)} className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/25 rounded-xl">
          <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">
            Todavía no hay ninguna conexión GeoServer registrada. Ve a <strong>Conexiones GeoServer</strong> y crea una
            antes de configurar el primer geovisor — cada geovisor descubre sus capas a partir de una conexión.
          </p>
        </motion.div>
      )}

      {!isLoading && geovisores.length === 0 && conexiones.length > 0 && (
        <motion.div {...fadeUp(0.08)} className="flex flex-col items-center justify-center py-20 text-center bg-[var(--card-bg)] border border-dashed border-border rounded-2xl">
          <div className="w-16 h-16 bg-primary-500/12 rounded-2xl flex items-center justify-center mb-4">
            <MapPinned className="w-8 h-8 text-primary-400" />
          </div>
          <h3 className="text-base font-bold text-text mb-1">No hay geovisores configurados</h3>
          <p className="text-sm text-text-muted mb-6 max-w-sm">
            Crea el primero eligiendo una conexión, seleccionando sus workspaces temáticos y ajustando cómo se
            mostrará la información — sin escribir código.
          </p>
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-800 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" /> Crear primer geovisor
          </button>
        </motion.div>
      )}

      {geovisores.length > 0 && filtered.length === 0 && (
        <div className="py-12 text-center text-sm text-text-muted">
          Ningún geovisor coincide con la búsqueda
        </div>
      )}

      {filtered.length > 0 && (
        <div className="space-y-4">
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
          {/* Grid sin animación de entrada (antes usaba staggerContainer +
              AnimatePresence mode="popLayout" + layout en cada tarjeta):
              en producción, con un solo geovisor, la tarjeta quedaba
              invisible -- sin ningún error en consola, lo que apunta a la
              animación quedándose "pegada" en su estado inicial
              (opacity:0) en vez de resolver a animate. El toggle de
              columnas (no animado) sí se veía siempre, confirmando que el
              bloque en sí renderizaba bien. Se prefiere una grilla simple y
              confiable sobre una animación de entrada que puede fallar en
              silencio. */}
          <div className={`grid ${COLS_GRID_CLASS[cols]} gap-6`}>
            {filtered.map((geovisor) => (
              <GeovisorCard
                key={geovisor.id}
                geovisor={geovisor}
                conexionNombre={conexionNombrePorId[geovisor.conexionGeoserverId] ?? 'Conexión desconocida'}
                expanded={expandedId === geovisor.id}
                onToggleExpand={() => setExpandedId((id) => (id === geovisor.id ? null : geovisor.id))}
                onEdit={() => openEdit(geovisor)}
                onToggle={() => handleToggle(geovisor)}
                onDelete={() => setDeleteTarget(geovisor)}
                toggling={toggleActivo.isPending}
              />
            ))}
          </div>
        </div>
      )}

      <GeovisorFormModal
        open={showForm}
        editing={editing}
        onClose={() => setShowForm(false)}
        onSaved={(msg) => { setToast(msg); setShowForm(false) }}
      />

      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div {...panelAnim} className="bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
              <div className="w-12 h-12 bg-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-5 h-5 text-red-dark" />
              </div>
              <h3 className="text-base font-bold text-text mb-2">Eliminar geovisor</h3>
              <p className="text-sm text-text-muted mb-6">
                ¿Seguro que deseas eliminar <strong className="text-text">"{deleteTarget.titulo}"</strong>? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 transition-colors">
                  Cancelar
                </button>
                <button onClick={confirmDelete}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">
                  Sí, eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
