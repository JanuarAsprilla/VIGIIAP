import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, Pencil, CheckCircle, Globe, Layers, MapPinned,
  ShieldAlert, Power, Search,
} from 'lucide-react'
import { fadeUpSm, panelAnim, staggerContainer, staggerItem } from '@/lib/animations'
import { getApiErrorMessage } from '@/lib/apiError'
import {
  useGeovisoresList, useToggleGeovisorActivo, useDeleteGeovisor,
} from '@/hooks/useGeovisores'
import { useConexionesGeoserverList } from '@/hooks/useConexionesGeoserver'
import type { GeovisorRaw } from '@/types'
import GeovisorFormModal from '@/components/admin/geovisores/GeovisorFormModal'

const fadeUp = fadeUpSm

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

function GeovisorRow({ geovisor, conexionNombre, onEdit, onToggle, onDelete, toggling }: {
  geovisor: GeovisorRaw
  conexionNombre: string
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
  toggling: boolean
}) {
  return (
    <motion.div
      variants={staggerItem}
      layout
      className={`bg-[var(--card-bg)] border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-colors ${
        geovisor.activo ? 'border-border/70' : 'border-border/40 opacity-70'
      }`}
    >
      <div className="w-11 h-11 rounded-xl bg-primary-800/10 flex items-center justify-center shrink-0">
        <MapPinned className="w-5 h-5 text-primary-800" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-bold text-text truncate">{geovisor.titulo}</h3>
          <span className={`text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${VISIBILIDAD_PILL[geovisor.visibilidad] ?? ''}`}>
            {VISIBILIDAD_LABEL[geovisor.visibilidad] ?? geovisor.visibilidad}
          </span>
          {geovisor.categoria && (
            <span className="text-[0.6rem] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-bg-alt text-text-muted">
              {geovisor.categoria}
            </span>
          )}
        </div>
        <p className="text-xs text-text-muted mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{conexionNombre}</span>
          <span className="flex items-center gap-1"><Layers className="w-3 h-3" />
            {geovisor.workspacesGeoserver.length
              ? `${geovisor.workspacesGeoserver.length} workspace${geovisor.workspacesGeoserver.length === 1 ? '' : 's'}`
              : 'Todos los workspaces de la conexión'}
          </span>
        </p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
        <button onClick={onToggle} disabled={toggling} title={geovisor.activo ? 'Desactivar' : 'Activar'}
          className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
            geovisor.activo ? 'text-green-700 hover:bg-green-700/10' : 'text-text-muted hover:bg-bg-alt'
          }`}>
          <Power className="w-3.5 h-3.5" />
        </button>
        <button onClick={onEdit} title="Editar"
          className="p-1.5 rounded-lg text-text-muted hover:text-primary-800 hover:bg-primary-500/10 transition-colors">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} title="Eliminar"
          className="p-1.5 rounded-lg text-text-muted hover:text-red-dark hover:bg-red/10 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  )
}

export default function GestionGeovisores() {
  const { data, isLoading } = useGeovisoresList()
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

  const conexionNombrePorId = Object.fromEntries(conexiones.map((c) => [c.id, c.nombre]))

  const categoriasConGeovisores = [...new Set(geovisores.map((g) => g.categoria).filter(Boolean))]
    .sort((a, b) => a!.localeCompare(b!))

  const filtered = geovisores.filter((g) => {
    const q = search.toLowerCase()
    const matchQ = !q || g.titulo.toLowerCase().includes(q)
    const matchC = !filtroCategoria || g.categoria === filtroCategoria
    return matchQ && matchC
  })

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
        <motion.div variants={staggerContainer(0.05, 0.06)} initial="initial" animate="animate" className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((geovisor) => (
              <GeovisorRow
                key={geovisor.id}
                geovisor={geovisor}
                conexionNombre={conexionNombrePorId[geovisor.conexionGeoserverId] ?? 'Conexión desconocida'}
                onEdit={() => openEdit(geovisor)}
                onToggle={() => handleToggle(geovisor)}
                onDelete={() => setDeleteTarget(geovisor)}
                toggling={toggleActivo.isPending}
              />
            ))}
          </AnimatePresence>
        </motion.div>
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
