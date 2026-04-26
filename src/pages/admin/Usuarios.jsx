import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, X, Send, Trash2, Edit2,
  CheckCircle, XCircle, UserPlus,
  User, Clock, Loader2,
} from 'lucide-react'
import { ROLES } from '@/contexts/AuthContext'
import { fadeUpSm, panelAnim, drawerAnim } from '@/lib/animations'
import { useUsuariosList, useCreateUsuario, useUpdateUsuarioRol, useToggleActivo, useDeleteUsuario } from '@/hooks/useUsuarios'

const fadeUp = fadeUpSm

// Source of truth para roles: sincronizado con AuthContext
const ROLES_LIST = [ROLES.ADMIN, ROLES.INVESTIGADOR, ROLES.TECNICO, ROLES.INSTITUCIONAL, ROLES.PUBLICO]
const ROLE_COLORS = {
  [ROLES.ADMIN]:         'bg-primary-100 text-primary-800',
  [ROLES.INVESTIGADOR]:  'bg-blue-100 text-blue-700',
  [ROLES.TECNICO]:       'bg-indigo-100 text-indigo-700',
  [ROLES.INSTITUCIONAL]: 'bg-teal-100 text-teal-700',
  [ROLES.PUBLICO]:       'bg-gray-100 text-gray-600',
}

// ── User detail drawer ──
function UserDrawer({ user, onClose }) {
  return (
    <>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <motion.div key="drawer" {...drawerAnim} className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border bg-gradient-to-br from-primary-50 to-white">
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-600 to-primary-900 rounded-2xl flex items-center justify-center shadow-md">
              <span className="text-white text-lg font-bold">{user.initials}</span>
            </div>
            <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-alt transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <h3 className="text-base font-bold text-text">{user.nombre}</h3>
          <p className="text-xs text-text-muted mt-0.5">{user.correo}</p>
          <div className="flex items-center gap-2 mt-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_COLORS[user.rol]}`}>{user.rol}</span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${user.estado === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
              {user.estado}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: User,  label: 'ID',           value: user.id?.slice(0, 8) + '…' },
              { icon: Clock, label: 'Última acción', value: user.ultimoAcceso },
            ].map(({ icon: Ic, label, value }) => (
              <div key={label} className="bg-bg-alt rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Ic className="w-3 h-3 text-text-muted" />
                  <p className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted">{label}</p>
                </div>
                <p className="text-xs font-semibold text-text">{value}</p>
              </div>
            ))}
          </div>

          {/* Institución */}
          {user.institucion && (
            <div className="bg-bg-alt rounded-xl p-3">
              <p className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted mb-1">Institución</p>
              <p className="text-xs font-semibold text-text">{user.institucion}</p>
            </div>
          )}

          {/* Motivo de acceso */}
          {user.motivoAcceso && (
            <div className="bg-bg-alt rounded-xl p-3">
              <p className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted mb-1">Motivo de acceso</p>
              <p className="text-xs text-text leading-relaxed">{user.motivoAcceso}</p>
            </div>
          )}

          {/* Permissions summary */}
          <div>
            <p className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted mb-2">Permisos del Rol</p>
            <div className="space-y-1.5">
              {user.rol === 'Administrador SIG' && (
                <>
                  {['Panel de Administración', 'Gestión de Usuarios', 'Gestión de Contenido', 'Todos los módulos'].map((p) => (
                    <div key={p} className="flex items-center gap-2 text-xs text-text">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />{p}
                    </div>
                  ))}
                </>
              )}
              {(user.rol === 'Investigador' || user.rol === 'Técnico SIG' || user.rol === 'Funcionario Institucional') && (
                <>
                  {['Mapas y Documentos', 'Geovisor', 'Herramientas SIG', 'Solicitudes'].map((p) => (
                    <div key={p} className="flex items-center gap-2 text-xs text-text">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />{p}
                    </div>
                  ))}
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />Panel de Administración
                  </div>
                </>
              )}
              {user.rol === 'Público' && (
                <>
                  <div className="flex items-center gap-2 text-xs text-text">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />Noticias
                  </div>
                  {['Mapas', 'Documentos', 'Herramientas', 'Geovisor', 'Solicitudes'].map((p) => (
                    <div key={p} className="flex items-center gap-2 text-xs text-text-muted">
                      <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />{p}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

        </div>
      </motion.div>
    </>
  )
}

// ── Invite modal — crea usuario directamente vía API admin ──
function InviteModal({ onClose }) {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [rol, setRol] = useState('Investigador')
  const [institucion, setInstitucion] = useState('')
  const [step, setStep] = useState('form') // 'form' | 'sent'
  const [error, setError] = useState('')
  const createUsuario = useCreateUsuario()

  const handleSend = async (e) => {
    e.preventDefault()
    if (!nombre.trim() || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Nombre y correo válido son requeridos')
      return
    }
    setError('')
    try {
      await createUsuario.mutateAsync({ nombre, email, rol, institucion })
      setStep('sent')
    } catch (err) {
      setError(err.message ?? 'Error al crear el usuario')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div {...panelAnim} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h3 className="text-base font-bold text-text">Crear Usuario</h3>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-alt transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleSend} className="p-6 space-y-4">
            <div>
              <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                Nombre completo <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. María García"
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
              />
            </div>
            <div>
              <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                Correo electrónico <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@iiap.org.co"
                  className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Institución</label>
              <input
                type="text"
                value={institucion}
                onChange={(e) => setInstitucion(e.target.value)}
                placeholder="Ej. IIAP"
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition"
              />
            </div>
            <div>
              <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Rol a asignar</label>
              <select value={rol} onChange={(e) => setRol(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition">
                {ROLES_LIST.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <p className="text-xs text-text-muted">El usuario recibirá un correo con sus credenciales de acceso.</p>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 transition-colors">Cancelar</button>
              <button
                type="submit"
                disabled={createUsuario.isPending}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors"
              >
                {createUsuario.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Creando...</>
                  : <><Send className="w-4 h-4" /> Crear Usuario</>
                }
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text mb-1">¡Usuario creado!</h4>
              <p className="text-xs text-text-muted">
                Se envió un correo a <strong className="text-text">{email}</strong> con sus credenciales de acceso y el rol <strong className="text-text">{rol}</strong>.
              </p>
            </div>
            <button onClick={onClose} className="w-full py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">Cerrar</button>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default function Usuarios() {
  const { data } = useUsuariosList({ limit: 200 })
  const users = data?.data ?? []
  const updateRol   = useUpdateUsuarioRol()
  const toggleActivo = useToggleActivo()
  const deleteUser  = useDeleteUsuario()

  const [search, setSearch] = useState('')
  const [filtroRol, setFiltroRol] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [detailUser, setDetailUser] = useState(null)
  const [form, setForm] = useState({ rol: 'Público' })
  const [formErrors, setFormErrors] = useState({})

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    const matchQ = !q || u.nombre.toLowerCase().includes(q) || (u.correo ?? '').toLowerCase().includes(q)
    const matchRol = !filtroRol || u.rol === filtroRol
    const matchEst = !filtroEstado || u.estado === filtroEstado
    return matchQ && matchRol && matchEst
  })

  const openEdit = (u) => {
    setEditingUser(u)
    setForm((f) => ({ ...f, rol: u.rol }))
    setFormErrors({})
    setShowModal(true)
  }

  const validate = () => {
    const e = {}
    if (!form.rol) e.rol = 'Selecciona un rol'
    return e
  }

  const handleSave = async (ev) => {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setFormErrors(e); return }
    if (editingUser) {
      await updateRol.mutateAsync({ id: editingUser.id, rol: form.rol })
    }
    setShowModal(false)
  }

  const toggleEstado = async (id) => {
    const u = users.find((x) => x.id === id)
    if (!u) return
    await toggleActivo.mutateAsync({ id, activo: !u.activo })
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await deleteUser.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[0.7rem] font-bold uppercase tracking-widest text-primary-700">Administración</span>
          <h1 className="font-display text-2xl font-bold text-text mt-0.5">Gestión de Usuarios</h1>
          <p className="text-sm text-text-muted mt-1">{users.length} usuarios registrados en el sistema</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setShowInvite(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-800 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Crear Usuario
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div {...fadeUp(0.08)} className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
          />
        </div>
        <select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)} className="px-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 transition">
          <option value="">Todos los roles</option>
          {ROLES_LIST.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="px-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 transition">
          <option value="">Todos los estados</option>
          <option value="Activo">Activo</option>
          <option value="Inactivo">Inactivo</option>
        </select>
      </motion.div>

      {/* Table */}
      <motion.div {...fadeUp(0.14)} className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-alt/50">
                {['Usuario', 'Correo', 'Rol', 'Verificado', 'Estado', 'Acciones'].map((h) => (
                  <th key={h} className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-text-muted px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-text-muted">Sin resultados</td></tr>
              )}
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-b-0 hover:bg-bg-alt/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => setDetailUser(u)}
                      className="flex items-center gap-2.5 text-left group"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-900 rounded-lg flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">{u.initials}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text group-hover:text-primary-800 transition-colors">{u.nombre}</p>
                        <p className="text-[0.65rem] text-text-muted">{u.id}</p>
                      </div>
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-text-muted">{u.correo}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[u.rol]}`}>{u.rol}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    {u.emailVerified ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" />Sí
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3" />Pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggleEstado(u.id)}
                      disabled={toggleActivo.isPending}
                      title={u.activo ? 'Clic para desactivar' : 'Clic para activar'}
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors disabled:opacity-50 ${
                        u.activo
                          ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-600'
                          : 'bg-red-100 text-red-600 hover:bg-green-100 hover:text-green-700'
                      }`}
                    >
                      {toggleActivo.isPending
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : u.activo ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />
                      }
                      {u.estado}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-text-muted hover:text-primary-800 hover:bg-primary-50 transition-colors" title="Cambiar rol" aria-label={`Editar rol de ${u.nombre}`}>
                        <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(u)}
                        disabled={deleteUser.isPending && deleteTarget?.id === u.id}
                        className="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                        aria-label={`Eliminar usuario ${u.nombre}`}
                      >
                        {deleteUser.isPending && deleteTarget?.id === u.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                          : <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border bg-bg-alt/30">
          <span className="text-xs text-text-muted">Mostrando {filtered.length} de {users.length} usuarios</span>
        </div>
      </motion.div>

      {/* User detail drawer */}
      <AnimatePresence>
        {detailUser && <UserDrawer user={detailUser} onClose={() => setDetailUser(null)} />}
      </AnimatePresence>

      {/* Invite modal */}
      <AnimatePresence>
        {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
      </AnimatePresence>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>
            <motion.div {...panelAnim} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <div>
                  <h3 className="text-base font-bold text-text">Cambiar Rol</h3>
                  {editingUser && <p className="text-xs text-text-muted mt-0.5">{editingUser.nombre}</p>}
                </div>
                <button onClick={() => setShowModal(false)} className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-alt transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="bg-bg-alt/60 rounded-xl px-4 py-3 text-xs text-text-muted border border-border/50">
                  El rol determina los permisos del usuario. Para activar o desactivar una cuenta usa el botón de estado en la tabla.
                </div>
                <div>
                  <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Rol</label>
                  <select value={form.rol} onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))} className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition">
                    {ROLES_LIST.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 hover:text-primary-800 transition-colors">Cancelar</button>
                  <button type="submit" disabled={updateRol.isPending} className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors">
                    {updateRol.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div {...panelAnim} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-base font-bold text-text mb-2">Eliminar Usuario</h3>
              <p className="text-sm text-text-muted mb-6">
                ¿Seguro que deseas eliminar a <strong className="text-text">{deleteTarget.nombre}</strong>? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 transition-colors">Cancelar</button>
                <button onClick={confirmDelete} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">Eliminar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
