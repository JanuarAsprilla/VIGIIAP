import React, { useState } from 'react'

interface AdminSigUser {
  id: string
  nombre: string
  email: string
  institucion?: string | null
  activo: boolean
  permisos?: PermisoModulo[]
}
type AdminUsersApiRes = { data?: AdminSigUser[] }
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, UserPlus, Users, Activity, RefreshCw, X, KeyRound, Power, Trash2, Loader2, Eye, Pencil } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { staggerContainer, staggerItem3D, EASE_OUT_EXPO } from '@/lib/animations'
import Card3D from '@/components/ui/Card3D'
import api from '@/lib/api'
import { MODULOS_CATALOGO, type ModuloClave, type PermisoModulo } from '@/lib/constants/modulos'
import { useToast, ToastContainer } from '@/components/Toast'

// ── API helpers ───────────────────────────────────────────────────────────────
const fetchSuperStats  = () => api.get('/admin/super/stats')
const fetchAdministradores = () => api.get('/admin/administradores')
const crearAdmin       = (data: { nombre: string; email: string; institucion: string }) => api.post('/admin/super/crear-admin', data)
const toggleActivoAdmin = ({ id, activo }: { id: string; activo: boolean }) => api.patch(`/admin/usuarios/${id}`, { activo })
const eliminarAdmin     = (id: string) => api.delete(`/admin/usuarios/${id}`)
const guardarPermisos   = ({ id, permisos }: { id: string; permisos: PermisoModulo[] }) =>
  api.put(`/admin/administradores/${id}/permisos`, { permisos })

function permisoDe(permisos: PermisoModulo[] | undefined, clave: ModuloClave) {
  return permisos?.find((p) => p.modulo === clave) ?? { modulo: clave, puede_ver: false, puede_editar: false }
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color = 'primary' }: { icon: React.ComponentType<{ className?: string }>; label: string; value?: number | string; color?: string }) {
  const colors = {
    primary: 'bg-primary-500/10 text-primary-600 border-primary-500/25',
    amber:   'bg-gold-500/10    text-gold-500     border-gold-500/25',
    green:   'bg-primary-500/10 text-primary-500  border-primary-500/25',
    red:     'bg-red/10         text-red-dark     border-red/25',
  }
  return (
    <Card3D
      glow="rgba(26,86,50,0.12)"
      intensity={4}
      whileHover={{ y: -3 }}
      className={`flex items-center gap-3 p-4 rounded-xl border ${(colors as Record<string, string>)[color]}`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <div>
        <p className="text-2xl font-bold leading-none">{value ?? '—'}</p>
        <p className="text-xs mt-0.5 opacity-80">{label}</p>
      </div>
    </Card3D>
  )
}

function CrearAdminModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (data: unknown) => void }) {
  const [form, setForm] = useState({ nombre: '', email: '', institucion: '' })
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: crearAdmin,
    onSuccess: (data) => {
      onSuccess(data)
      onClose()
    },
    onError: (err) => {
      setServerError(err?.message ?? 'Error al crear el administrador')
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setServerError(null)
    if (!showConfirm) { setShowConfirm(true); return }
    mutation.mutate(form)
  }

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="bg-[var(--card-bg)] rounded-2xl shadow-xl w-full max-w-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary-700" />
            <h2 className="text-base font-semibold text-text">Crear Administrador SIG</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-alt transition-colors text-text-muted hover:text-text">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {showConfirm && (
            <div className="bg-gold-500/10 border border-gold-500/25 rounded-xl p-3 text-sm text-gold-500">
              Se creará el usuario <strong>{form.email}</strong> como Administrador SIG. Recibirá su contraseña temporal por correo. ¿Confirmar?
            </div>
          )}

          <div>
            <label htmlFor="ga-nombre" className="block text-xs font-semibold text-text-muted mb-1.5">Nombre completo</label>
            <input
              id="ga-nombre"
              type="text"
              value={form.nombre}
              onChange={set('nombre')}
              required
              disabled={showConfirm}
              placeholder="Ej. María García López"
              className="w-full px-3 py-2.5 rounded-xl border border-border text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:opacity-60"
            />
          </div>

          <div>
            <label htmlFor="ga-email" className="block text-xs font-semibold text-text-muted mb-1.5">Correo electrónico</label>
            <input
              id="ga-email"
              type="email"
              value={form.email}
              onChange={set('email')}
              required
              disabled={showConfirm}
              placeholder="admin@institucion.gov.co"
              className="w-full px-3 py-2.5 rounded-xl border border-border text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:opacity-60"
            />
          </div>

          <div>
            <label htmlFor="ga-institucion" className="block text-xs font-semibold text-text-muted mb-1.5">Institución</label>
            <input
              id="ga-institucion"
              type="text"
              value={form.institucion}
              onChange={set('institucion')}
              required
              disabled={showConfirm}
              placeholder="Nombre de la institución"
              className="w-full px-3 py-2.5 rounded-xl border border-border text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:opacity-60"
            />
          </div>

          {serverError && (
            <p className="text-sm text-red-dark bg-red/10 border border-red/25 rounded-xl px-3 py-2">{serverError}</p>
          )}

          <div className="flex gap-2 pt-1">
            {showConfirm && (
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-text-muted hover:bg-bg-alt transition-colors"
              >
                Editar datos
              </button>
            )}
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 px-4 py-2.5 rounded-xl bg-primary-800 text-white text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {mutation.isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              {showConfirm ? 'Confirmar y crear' : 'Revisar datos'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ── Permisos por módulo ────────────────────────────────────────────────────────
function PermisosModal({ admin, onClose, onSaved }: { admin: AdminSigUser; onClose: () => void; onSaved: () => void }) {
  const [permisos, setPermisos] = useState<PermisoModulo[]>(
    MODULOS_CATALOGO.map(({ clave }) => permisoDe(admin.permisos, clave)),
  )
  const { toast } = useToast()

  const mutation = useMutation({
    mutationFn: guardarPermisos,
    onSuccess: () => {
      toast(`Permisos de ${admin.nombre} actualizados`, 'success')
      onSaved()
      onClose()
    },
    onError: () => toast('Error al guardar los permisos', 'error'),
  })

  const toggle = (clave: ModuloClave, campo: 'puede_ver' | 'puede_editar') => {
    setPermisos((prev) => prev.map((p) => {
      if (p.modulo !== clave) return p
      if (campo === 'puede_editar') {
        const puede_editar = !p.puede_editar
        return { ...p, puede_editar, puede_ver: puede_editar ? true : p.puede_ver }
      }
      const puede_ver = !p.puede_ver
      return { ...p, puede_ver, puede_editar: puede_ver ? p.puede_editar : false }
    }))
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="bg-[var(--card-bg)] rounded-2xl shadow-xl w-full max-w-lg"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary-700" />
            <div>
              <h2 className="text-base font-semibold text-text">Módulos habilitados</h2>
              <p className="text-xs text-text-muted">{admin.nombre}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-alt transition-colors text-text-muted hover:text-text">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-1 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-2 pb-2 text-[0.65rem] font-bold uppercase tracking-wide text-text-muted">
            <span>Módulo</span>
            <span className="w-14 text-center">Ver</span>
            <span className="w-14 text-center">Editar</span>
          </div>
          {MODULOS_CATALOGO.map(({ clave, nombre }) => {
            const p = permisos.find((x) => x.modulo === clave)!
            return (
              <div key={clave} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-bg-alt/60">
                <span className="text-sm text-text">{nombre}</span>
                <label className="w-14 flex justify-center cursor-pointer">
                  <input type="checkbox" checked={p.puede_ver} onChange={() => toggle(clave, 'puede_ver')} aria-label={`Ver ${nombre}`} className="w-4 h-4 accent-primary-700" />
                </label>
                <label className="w-14 flex justify-center cursor-pointer">
                  <input type="checkbox" checked={p.puede_editar} onChange={() => toggle(clave, 'puede_editar')} aria-label={`Editar ${nombre}`} className="w-4 h-4 accent-primary-700" />
                </label>
              </div>
            )
          })}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 transition-colors">Cancelar</button>
          <button
            onClick={() => mutation.mutate({ id: admin.id, permisos })}
            disabled={mutation.isPending}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Guardar permisos
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function AdminTable({
  usuarios, isLoading, onEditPermisos, onToggleActivo, onDelete, togglingId, deletingId,
}: {
  usuarios: AdminSigUser[] | undefined
  isLoading: boolean
  onEditPermisos: (a: AdminSigUser) => void
  onToggleActivo: (a: AdminSigUser) => void
  onDelete: (a: AdminSigUser) => void
  togglingId: string | null
  deletingId: string | null
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-bg-alt animate-pulse rounded-xl" />
        ))}
      </div>
    )
  }

  if (!usuarios?.length) {
    return (
      <div className="text-center py-10 text-text-muted">
        <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No hay administradores registrados</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wide">Nombre</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wide">Correo</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wide">Institución</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wide">Módulos</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wide">Estado</th>
            <th className="text-right px-4 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wide">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {usuarios.map((u) => {
            const habilitados = (u.permisos ?? []).filter((p) => p.puede_ver).length
            return (
              <tr key={u.id} className="hover:bg-bg-alt/50 transition-colors">
                <td className="px-4 py-3 font-medium text-text">{u.nombre}</td>
                <td className="px-4 py-3 text-text-muted">{u.email}</td>
                <td className="px-4 py-3 text-text-muted">{u.institucion ?? '—'}</td>
                <td className="px-4 py-3 text-text-muted">
                  <span className="inline-flex items-center gap-1 text-xs">
                    <Eye className="w-3 h-3" />{habilitados}/{MODULOS_CATALOGO.length}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${u.activo ? 'bg-primary-500/12 text-primary-500' : 'bg-red/10 text-red-dark'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${u.activo ? 'bg-green-500' : 'bg-red-400'}`} />
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEditPermisos(u)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-primary-800 hover:bg-primary-500/10 transition-colors"
                      title="Editar módulos habilitados"
                      aria-label={`Editar módulos de ${u.nombre}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onToggleActivo(u)}
                      disabled={togglingId === u.id}
                      className="p-1.5 rounded-lg text-text-muted hover:text-gold-500 hover:bg-gold-500/10 disabled:opacity-50 transition-colors"
                      title={u.activo ? 'Desactivar' : 'Activar'}
                      aria-label={`${u.activo ? 'Desactivar' : 'Activar'} a ${u.nombre}`}
                    >
                      {togglingId === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => onDelete(u)}
                      disabled={deletingId === u.id}
                      className="p-1.5 rounded-lg text-text-muted hover:text-red-dark hover:bg-red/10 disabled:opacity-50 transition-colors"
                      title="Eliminar"
                      aria-label={`Eliminar administrador ${u.nombre}`}
                    >
                      {deletingId === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GestionAdmins() {
  const [showModal, setShowModal] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [permisosTarget, setPermisosTarget] = useState<AdminSigUser | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminSigUser | null>(null)
  const queryClient = useQueryClient()
  const { toasts, toast, dismiss } = useToast()

  const { data: stats } = useQuery({
    queryKey: ['super-stats'],
    queryFn: fetchSuperStats,
    select: (d) => d.data ?? d,
  })

  const { data: usuariosData, isLoading: loadingUsuarios } = useQuery({
    queryKey: ['administradores'],
    queryFn: fetchAdministradores,
    select: (d: AdminUsersApiRes) => d?.data ?? [],
  })

  const invalidateAdmins = () => {
    queryClient.invalidateQueries({ queryKey: ['super-stats'] })
    queryClient.invalidateQueries({ queryKey: ['administradores'] })
  }

  const toggleMutation = useMutation({
    mutationFn: toggleActivoAdmin,
    onSuccess: (_d, vars) => {
      invalidateAdmins()
      toast(`Administrador ${vars.activo ? 'activado' : 'desactivado'}`, 'success')
    },
    onError: () => toast('Error al cambiar el estado', 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: eliminarAdmin,
    onSuccess: () => {
      invalidateAdmins()
      toast(`${deleteTarget?.nombre} eliminado correctamente`, 'success')
      setDeleteTarget(null)
    },
    onError: () => toast('Error al eliminar el administrador', 'error'),
  })

  const handleSuccess = () => {
    invalidateAdmins()
    setSuccessMsg('Administrador creado. Recibirá su contraseña temporal por correo.')
    setTimeout(() => setSuccessMsg(null), 5000)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="page-header-tag">Super Admin</p>
          <h1 className="page-header-title">Gestión de Administradores</h1>
          <p className="page-header-description">
            Crea, supervisa y habilita módulos para los administradores SIG de la plataforma. Solo el Super Administrador puede realizar estas acciones.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-800 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo Admin
        </motion.button>
      </div>

      {/* Success banner */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-primary-500/10 border border-primary-500/25 rounded-xl px-4 py-3 text-sm text-primary-600 flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 shrink-0 text-primary-600" />
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        variants={staggerContainer(0.07, 0.1)}
        initial="hidden" animate="visible"
      >
        <motion.div variants={staggerItem3D}><StatCard icon={Users}       label="Total usuarios"  value={stats?.total_usuarios} color="primary" /></motion.div>
        <motion.div variants={staggerItem3D}><StatCard icon={ShieldCheck} label="Administradores" value={stats?.admins}         color="amber"   /></motion.div>
        <motion.div variants={staggerItem3D}><StatCard icon={Activity}    label="Activos"         value={stats?.activos}         color="green"   /></motion.div>
        <motion.div variants={staggerItem3D}><StatCard icon={Users}       label="Sin verificar"   value={stats?.pendientes_verificacion} color="red" /></motion.div>
      </motion.div>

      {/* Admins table — sin tilt 3D: es una superficie de datos que se opera, no se admira */}
      <Card3D
        disabled
        glow="rgba(26,86,50,0.10)"
        intensity={3}
        initial={{ opacity: 0, y: 24, rotateX: 4, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  rotateX: 0, scale: 1    }}
        transition={{ delay: 0.22, duration: 0.5, ease: EASE_OUT_EXPO }}
        style={{ transformPerspective: 900 }}
        className="bg-[var(--card-bg)] border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary-700" />
            Administradores SIG
          </h2>
          <span className="text-xs text-text-muted">
            {usuariosData?.length ?? 0} registrado{usuariosData?.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="p-2">
          <AdminTable
            usuarios={usuariosData}
            isLoading={loadingUsuarios}
            onEditPermisos={setPermisosTarget}
            onToggleActivo={(a) => toggleMutation.mutate({ id: a.id, activo: !a.activo })}
            onDelete={setDeleteTarget}
            togglingId={toggleMutation.isPending ? toggleMutation.variables?.id ?? null : null}
            deletingId={deleteMutation.isPending ? deleteTarget?.id ?? null : null}
          />
        </div>
      </Card3D>

      {/* Modal: crear admin */}
      <AnimatePresence>
        {showModal && (
          <CrearAdminModal
            onClose={() => setShowModal(false)}
            onSuccess={handleSuccess}
          />
        )}
      </AnimatePresence>

      {/* Modal: permisos por módulo */}
      <AnimatePresence>
        {permisosTarget && (
          <PermisosModal
            admin={permisosTarget}
            onClose={() => setPermisosTarget(null)}
            onSaved={invalidateAdmins}
          />
        )}
      </AnimatePresence>

      {/* Confirmar eliminación */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
            >
              <div className="w-12 h-12 bg-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-5 h-5 text-red-dark" />
              </div>
              <h3 className="text-base font-bold text-text mb-2">Eliminar Administrador</h3>
              <p className="text-sm text-text-muted mb-6">
                ¿Seguro que deseas eliminar a <strong className="text-text">{deleteTarget.nombre}</strong>? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 disabled:opacity-50 transition-colors">Cancelar</button>
                <button
                  onClick={() => deleteMutation.mutate(deleteTarget.id)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60 transition-colors"
                >
                  {deleteMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Eliminando...</> : 'Eliminar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  )
}
