import { useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, Pencil, X, CheckCircle, AlertCircle, Loader2,
  Server, Lock, Globe2, Clock, ShieldAlert, Eye,
} from 'lucide-react'
import { fadeUpSm, panelAnim, staggerContainer, staggerItem } from '@/lib/animations'
import { getApiErrorMessage } from '@/lib/apiError'
import { useAuth } from '@/contexts/AuthContext'
import {
  useConexionesGeoserverList,
  useCreateConexionGeoserver,
  useUpdateConexionGeoserver,
  useDeleteConexionGeoserver,
} from '@/hooks/useConexionesGeoserver'
import type { ConexionGeoserverRaw } from '@/types'
import type { FormErrors } from '@/types/forms'

const fadeUp = fadeUpSm

const EMPTY_FORM = {
  nombre: '',
  url: '',
  usuarioLectura: '',
  password: '',
  timeoutMs: '20000',
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

function ConexionCard({ conexion, canWrite, onEdit, onDelete }: {
  conexion: ConexionGeoserverRaw
  canWrite: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <motion.div
      variants={staggerItem}
      initial="initial"
      animate="animate"
      layout
      className="bg-[var(--card-bg)] border border-border/70 rounded-2xl p-5 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary-800/10 flex items-center justify-center shrink-0">
            <Server className="w-4 h-4 text-primary-800" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-text truncate">{conexion.nombre}</h3>
            <span className={`inline-flex items-center gap-1 text-[0.6rem] font-bold uppercase tracking-wider ${
              conexion.activo ? 'text-green-700' : 'text-text-muted'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${conexion.activo ? 'bg-green-600' : 'bg-text-muted/50'}`} />
              {conexion.activo ? 'Activa' : 'Desactivada'}
            </span>
          </div>
        </div>
        {canWrite && (
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={onEdit} title="Editar"
              className="p-1.5 rounded-lg text-text-muted hover:text-primary-800 hover:bg-primary-500/10 transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={onDelete} title="Eliminar"
              className="p-1.5 rounded-lg text-text-muted hover:text-red-dark hover:bg-red/10 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-1.5 text-xs text-text-muted">
        <p className="flex items-center gap-1.5 truncate">
          <Globe2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{conexion.url}</span>
        </p>
        <p className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          Usuario de lectura: <span className="text-text font-medium">{conexion.usuario_lectura}</span>
        </p>
        <p className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          Timeout: {conexion.timeout_ms} ms
        </p>
      </div>
    </motion.div>
  )
}

export default function GestionConexionesGeoserver() {
  const { isSuperAdmin } = useAuth()
  const { data: conexiones = [], isLoading } = useConexionesGeoserverList()

  const createConexion = useCreateConexionGeoserver()
  const updateConexion = useUpdateConexionGeoserver()
  const deleteConexion  = useDeleteConexionGeoserver()

  const [showForm, setShowForm]         = useState(false)
  const [editing, setEditing]           = useState<ConexionGeoserverRaw | null>(null)
  const [form, setForm]                 = useState(EMPTY_FORM)
  const [formErrors, setFormErrors]     = useState<FormErrors>({})
  const [formActivo, setFormActivo]     = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<ConexionGeoserverRaw | null>(null)
  const [toast, setToast]               = useState<string | null>(null)

  const openCreate = () => {
    setEditing(null); setForm(EMPTY_FORM); setFormErrors({}); setFormActivo(true); setShowForm(true)
  }

  const openEdit = (conexion: ConexionGeoserverRaw) => {
    setEditing(conexion)
    setForm({
      nombre: conexion.nombre,
      url: conexion.url,
      usuarioLectura: conexion.usuario_lectura,
      password: '',
      timeoutMs: String(conexion.timeout_ms),
    })
    setFormActivo(conexion.activo)
    setFormErrors({})
    setShowForm(true)
  }

  const validate = () => {
    const e: FormErrors = {}
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio'
    if (!form.url.trim()) e.url = 'La URL es obligatoria'
    else { try { new URL(form.url) } catch { e.url = 'URL inválida' } }
    if (!form.usuarioLectura.trim()) e.usuarioLectura = 'El usuario de lectura es obligatorio'
    if (!editing && !form.password.trim()) e.password = 'La contraseña es obligatoria al crear la conexión'
    const timeout = Number(form.timeoutMs)
    if (!Number.isFinite(timeout) || timeout <= 0) e.timeoutMs = 'Timeout inválido'
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!validate()) return
    try {
      if (editing) {
        await updateConexion.mutateAsync({
          id: editing.id,
          data: {
            nombre: form.nombre.trim(),
            url: form.url.trim(),
            usuarioLectura: form.usuarioLectura.trim(),
            ...(form.password.trim() ? { password: form.password.trim() } : {}),
            timeoutMs: Number(form.timeoutMs),
            activo: formActivo,
          },
        })
        setToast(`Conexión "${form.nombre.trim()}" actualizada`)
      } else {
        await createConexion.mutateAsync({
          nombre: form.nombre.trim(),
          url: form.url.trim(),
          usuarioLectura: form.usuarioLectura.trim(),
          password: form.password.trim(),
          timeoutMs: Number(form.timeoutMs),
        })
        setToast(`Conexión "${form.nombre.trim()}" creada`)
      }
      setShowForm(false)
    } catch (err) {
      setFormErrors({ _root: getApiErrorMessage(err, 'No se pudo guardar la conexión') })
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteConexion.mutateAsync(deleteTarget.id)
      setToast(`Conexión "${deleteTarget.nombre}" eliminada`)
    } catch (err) {
      setToast(getApiErrorMessage(err, 'No se pudo eliminar la conexión'))
    }
    setDeleteTarget(null)
  }

  const isSaving = createConexion.isPending || updateConexion.isPending

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>

      <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[0.7rem] font-bold uppercase tracking-widest" style={{ color: 'var(--hero-eyebrow-text)' }}>Administración</span>
          <h1 className="font-display text-2xl font-bold text-text mt-0.5">Conexiones GeoServer</h1>
          <p className="text-sm text-text-muted mt-1">
            {isLoading ? 'Cargando…' : `${conexiones.length} conexión${conexiones.length === 1 ? '' : 'es'} registrada${conexiones.length === 1 ? '' : 's'}`}
          </p>
        </div>
        {isSuperAdmin && (
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-800 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors shrink-0">
            <Plus className="w-4 h-4" /> Nueva conexión
          </button>
        )}
      </motion.div>

      {!isSuperAdmin && (
        <motion.div {...fadeUp(0.04)} className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/25 rounded-xl">
          <Eye className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">
            Solo puedes consultar las conexiones GeoServer registradas. Crear, editar o eliminar una conexión requiere
            el rol Super Administrador, porque de aquí depende toda la infraestructura de los geovisores.
          </p>
        </motion.div>
      )}

      {!isLoading && conexiones.length === 0 && (
        <motion.div {...fadeUp(0.08)} className="flex flex-col items-center justify-center py-20 text-center bg-[var(--card-bg)] border border-dashed border-border rounded-2xl">
          <div className="w-16 h-16 bg-primary-500/12 rounded-2xl flex items-center justify-center mb-4">
            <Server className="w-8 h-8 text-primary-400" />
          </div>
          <h3 className="text-base font-bold text-text mb-1">No hay conexiones GeoServer</h3>
          <p className="text-sm text-text-muted mb-6 max-w-xs">
            Registra la primera conexión antes de crear un geovisor — cada geovisor apunta a una.
          </p>
          {isSuperAdmin && (
            <button onClick={openCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-800 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors">
              <Plus className="w-4 h-4" /> Crear primera conexión
            </button>
          )}
        </motion.div>
      )}

      {conexiones.length > 0 && (
        <motion.div
          variants={staggerContainer(0.06, 0.08)}
          initial="initial" animate="animate"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {conexiones.map((conexion) => (
              <ConexionCard
                key={conexion.id}
                conexion={conexion}
                canWrite={isSuperAdmin}
                onEdit={() => openEdit(conexion)}
                onDelete={() => setDeleteTarget(conexion)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modal crear/editar */}
      <AnimatePresence>
        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget && !isSaving) setShowForm(false) }}
          >
            <motion.div {...panelAnim} className="bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <div>
                  <h3 className="text-base font-bold text-text">{editing ? 'Editar conexión' : 'Nueva conexión GeoServer'}</h3>
                  <p className="text-xs text-text-muted mt-0.5">La contraseña se cifra antes de guardarse — nunca se muestra de nuevo.</p>
                </div>
                <button onClick={() => setShowForm(false)} disabled={isSaving}
                  className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-alt transition-colors disabled:opacity-40">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {formErrors._root && (
                  <p className="flex items-center gap-2 text-xs text-red-600 bg-red/10 border border-red-300/40 rounded-lg px-3 py-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />{formErrors._root}
                  </p>
                )}

                <div>
                  <label htmlFor="cg-nombre" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    Nombre <span className="text-orange-500" aria-hidden="true">*</span>
                  </label>
                  <input id="cg-nombre" type="text" value={form.nombre} autoFocus
                    placeholder="Ej: GeoServer institucional"
                    onChange={(e) => { setForm((f) => ({ ...f, nombre: e.target.value })); setFormErrors((fe) => ({ ...fe, nombre: undefined })) }}
                    className={`w-full px-3 py-2.5 bg-[var(--card-bg)] border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${formErrors.nombre ? 'border-red-400' : 'border-border focus:border-primary-800'}`} />
                  {formErrors.nombre && <p className="text-xs text-red-500 mt-1">{formErrors.nombre}</p>}
                </div>

                <div>
                  <label htmlFor="cg-url" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    URL base <span className="text-orange-500" aria-hidden="true">*</span>
                  </label>
                  <input id="cg-url" type="text" value={form.url}
                    placeholder="https://geoserver.iiap.org.co/geoserver"
                    onChange={(e) => { setForm((f) => ({ ...f, url: e.target.value })); setFormErrors((fe) => ({ ...fe, url: undefined })) }}
                    className={`w-full px-3 py-2.5 bg-[var(--card-bg)] border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${formErrors.url ? 'border-red-400' : 'border-border focus:border-primary-800'}`} />
                  {formErrors.url && <p className="text-xs text-red-500 mt-1">{formErrors.url}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="cg-usuario" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                      Usuario de lectura <span className="text-orange-500" aria-hidden="true">*</span>
                    </label>
                    <input id="cg-usuario" type="text" value={form.usuarioLectura}
                      onChange={(e) => { setForm((f) => ({ ...f, usuarioLectura: e.target.value })); setFormErrors((fe) => ({ ...fe, usuarioLectura: undefined })) }}
                      className={`w-full px-3 py-2.5 bg-[var(--card-bg)] border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${formErrors.usuarioLectura ? 'border-red-400' : 'border-border focus:border-primary-800'}`} />
                    {formErrors.usuarioLectura && <p className="text-xs text-red-500 mt-1">{formErrors.usuarioLectura}</p>}
                  </div>
                  <div>
                    <label htmlFor="cg-timeout" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                      Timeout (ms)
                    </label>
                    <input id="cg-timeout" type="number" min={1} value={form.timeoutMs}
                      onChange={(e) => { setForm((f) => ({ ...f, timeoutMs: e.target.value })); setFormErrors((fe) => ({ ...fe, timeoutMs: undefined })) }}
                      className={`w-full px-3 py-2.5 bg-[var(--card-bg)] border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${formErrors.timeoutMs ? 'border-red-400' : 'border-border focus:border-primary-800'}`} />
                    {formErrors.timeoutMs && <p className="text-xs text-red-500 mt-1">{formErrors.timeoutMs}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="cg-password" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    Contraseña {editing ? <span className="font-normal normal-case tracking-normal text-text-muted">(dejar vacío para no cambiarla)</span> : <span className="text-orange-500" aria-hidden="true">*</span>}
                  </label>
                  <input id="cg-password" type="password" value={form.password} autoComplete="new-password"
                    onChange={(e) => { setForm((f) => ({ ...f, password: e.target.value })); setFormErrors((fe) => ({ ...fe, password: undefined })) }}
                    className={`w-full px-3 py-2.5 bg-[var(--card-bg)] border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${formErrors.password ? 'border-red-400' : 'border-border focus:border-primary-800'}`} />
                  {formErrors.password && <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>}
                </div>

                {editing && (
                  <label className="flex items-center gap-2.5 text-sm text-text cursor-pointer select-none">
                    <input type="checkbox" checked={formActivo} onChange={(e) => setFormActivo(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-primary-800 focus:ring-primary-800/30" />
                    Conexión activa
                  </label>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowForm(false)} disabled={isSaving}
                    className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 hover:text-primary-800 disabled:opacity-40 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSaving}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {isSaving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear conexión'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal confirmar eliminación */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div {...panelAnim} className="bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
              <div className="w-12 h-12 bg-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-5 h-5 text-red-dark" />
              </div>
              <h3 className="text-base font-bold text-text mb-2">Eliminar conexión</h3>
              <p className="text-sm text-text-muted mb-1">
                ¿Seguro que deseas eliminar <strong className="text-text">"{deleteTarget.nombre}"</strong>?
              </p>
              <p className="text-xs text-text-muted mb-6">
                Cualquier geovisor que dependa de esta conexión dejará de poder cargar sus capas.
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
