import React, { useState } from 'react'

interface AdminSigUser {
  id: string
  nombre: string
  email: string
  institucion?: string | null
  activo: boolean
}
type AdminUsersApiRes = { data?: { usuarios?: AdminSigUser[] }; usuarios?: AdminSigUser[] }
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, UserPlus, Users, Activity, RefreshCw, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { staggerContainer, staggerItem3D, EASE_OUT_EXPO } from '@/lib/animations'
import Card3D from '@/components/ui/Card3D'
import api from '@/lib/api'

// ── API helpers ───────────────────────────────────────────────────────────────
const fetchSuperStats  = () => api.get('/admin/super/stats')
const fetchAdminUsers  = () => api.get('/admin/usuarios?rol=admin_sig')
const crearAdmin       = (data: { nombre: string; email: string; institucion: string }) => api.post('/admin/super/crear-admin', data)

// ── Sub-components ────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color = 'primary' }: { icon: React.ComponentType<{ className?: string }>; label: string; value?: number | string; color?: string }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-700 border-primary-200',
    amber:   'bg-amber-50  text-amber-700  border-amber-200',
    green:   'bg-green-50  text-green-700  border-green-200',
    red:     'bg-red-50    text-red-700    border-red-200',
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
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
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
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
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
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{serverError}</p>
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

function AdminTable({ usuarios, isLoading }: { usuarios: AdminSigUser[] | undefined; isLoading: boolean }) {
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
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wide">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {usuarios.map((u) => (
            <tr key={u.id} className="hover:bg-bg-alt/50 transition-colors">
              <td className="px-4 py-3 font-medium text-text">{u.nombre}</td>
              <td className="px-4 py-3 text-text-muted">{u.email}</td>
              <td className="px-4 py-3 text-text-muted">{u.institucion ?? '—'}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${u.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${u.activo ? 'bg-green-500' : 'bg-red-400'}`} />
                  {u.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GestionAdmins() {
  const [showModal, setShowModal] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: stats } = useQuery({
    queryKey: ['super-stats'],
    queryFn: fetchSuperStats,
    select: (d) => d.data ?? d,
  })

  const { data: usuariosData, isLoading: loadingUsuarios } = useQuery({
    queryKey: ['admin-usuarios', 'admin_sig'],
    queryFn: fetchAdminUsers,
    select: (d: AdminUsersApiRes) => d?.data?.usuarios ?? d?.usuarios ?? [],
  })

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['super-stats'] })
    queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] })
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
            Crea y supervisa los administradores SIG de la plataforma. Solo el Super Administrador puede realizar estas acciones.
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
            className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800 flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 shrink-0 text-green-600" />
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

      {/* Admins table */}
      <Card3D
        glow="rgba(26,86,50,0.10)"
        intensity={3}
        initial={{ opacity: 0, y: 24, rotateX: 4, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  rotateX: 0, scale: 1    }}
        transition={{ delay: 0.22, duration: 0.5, ease: EASE_OUT_EXPO }}
        style={{ transformPerspective: 900 }}
        className="bg-white border border-border rounded-2xl overflow-hidden">
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
          <AdminTable usuarios={usuariosData} isLoading={loadingUsuarios} />
        </div>
      </Card3D>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <CrearAdminModal
            onClose={() => setShowModal(false)}
            onSuccess={handleSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
