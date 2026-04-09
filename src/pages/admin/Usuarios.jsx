import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, X, Send, Trash2, Edit2,
  CheckCircle, XCircle, UserPlus, Mail,
  Shield, User, Clock, Activity, Copy, Check,
} from 'lucide-react'
import { ADMIN_MOCK_USERS, ADMIN_ACTIVITY_LOG } from '@/lib/constants'

const fadeUp = (d = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: d, ease: [0.22, 1, 0.36, 1] } })

const ROLES_LIST = ['Administrador SIG', 'Investigador', 'Público']
const ROLE_COLORS = {
  'Administrador SIG': 'bg-primary-100 text-primary-800',
  'Investigador':      'bg-blue-100 text-blue-700',
  'Público':           'bg-gray-100 text-gray-600',
}

const panelAnim = {
  initial: { opacity: 0, scale: 0.96, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit:    { opacity: 0, scale: 0.96, y: 10 },
  transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
}
const drawerAnim = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit:    { x: '100%' },
  transition: { type: 'spring', damping: 28, stiffness: 320 },
}

// ── User detail drawer ──
function UserDrawer({ user, onClose }) {
  const activity = ADMIN_ACTIVITY_LOG.filter((l) =>
    l.usuario.toLowerCase().includes(user.nombre.split(' ')[0].toLowerCase())
  ).slice(0, 5)

  const typeStyles = {
    success: 'bg-green-100 text-green-700',
    error:   'bg-red-100 text-red-600',
    warning: 'bg-amber-100 text-amber-700',
    info:    'bg-primary-100 text-primary-700',
  }

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
              { icon: User,    label: 'ID',              value: user.id },
              { icon: Clock,   label: 'Último acceso',   value: user.ultimoAcceso },
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
              {user.rol === 'Investigador' && (
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

          {/* Recent activity */}
          <div>
            <p className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted mb-2">Actividad Reciente</p>
            {activity.length > 0 ? (
              <div className="space-y-2">
                {activity.map((log) => (
                  <div key={log.id} className="flex items-start gap-2.5 p-2.5 bg-bg-alt rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-text truncate">{log.accion}</p>
                      <p className="text-[0.6rem] text-text-muted">{log.modulo} · {log.hora}</p>
                    </div>
                    <span className={`text-[0.55rem] font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0 ${typeStyles[log.tipo]}`}>
                      {log.tipo}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted italic">Sin actividad registrada</p>
            )}
          </div>
        </div>
      </motion.div>
    </>
  )
}

// ── Invite modal ──
function InviteModal({ onClose }) {
  const [email, setEmail] = useState('')
  const [rol, setRol] = useState('Investigador')
  const [step, setStep] = useState('form') // 'form' | 'sent'
  const [copied, setCopied] = useState(false)
  const fakeLink = `https://vigiiap.iiap.org.co/invitacion/${btoa(email || 'usuario').slice(0, 12)}`

  const handleSend = (e) => {
    e.preventDefault()
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return
    setStep('sent')
  }

  const copyLink = () => {
    navigator.clipboard.writeText(fakeLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div {...panelAnim} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h3 className="text-base font-bold text-text">Invitar Usuario</h3>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-alt transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleSend} className="p-6 space-y-4">
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
                  placeholder="usuario@dominio.com"
                  className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Rol a asignar</label>
              <select value={rol} onChange={(e) => setRol(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition">
                {ROLES_LIST.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <p className="text-xs text-text-muted">Se enviará un correo con un enlace de activación. El enlace expira en 48 horas.</p>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 transition-colors">Cancelar</button>
              <button type="submit" className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">
                <Send className="w-4 h-4" /> Enviar Invitación
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text mb-1">¡Invitación enviada!</h4>
              <p className="text-xs text-text-muted">Correo enviado a <strong className="text-text">{email}</strong> con rol <strong className="text-text">{rol}</strong>.</p>
            </div>
            <div className="bg-bg-alt rounded-xl p-3 text-left">
              <p className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted mb-1">Enlace de activación</p>
              <div className="flex items-center gap-2">
                <p className="text-xs font-mono text-text-muted truncate flex-1">{fakeLink}</p>
                <button onClick={copyLink} className="shrink-0 p-1.5 rounded-lg hover:bg-white transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-text-muted" />}
                </button>
              </div>
            </div>
            <button onClick={onClose} className="w-full py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">Cerrar</button>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default function Usuarios() {
  const [users, setUsers] = useState(ADMIN_MOCK_USERS)
  const [search, setSearch] = useState('')
  const [filtroRol, setFiltroRol] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [detailUser, setDetailUser] = useState(null)
  const [form, setForm] = useState({ nombre: '', correo: '', rol: 'Público', estado: 'Activo' })
  const [formErrors, setFormErrors] = useState({})

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    const matchQ = !q || u.nombre.toLowerCase().includes(q) || u.correo.toLowerCase().includes(q)
    const matchRol = !filtroRol || u.rol === filtroRol
    const matchEst = !filtroEstado || u.estado === filtroEstado
    return matchQ && matchRol && matchEst
  })

  const openCreate = () => {
    setEditingUser(null)
    setForm({ nombre: '', correo: '', rol: 'Público', estado: 'Activo' })
    setFormErrors({})
    setShowModal(true)
  }

  const openEdit = (u) => {
    setEditingUser(u)
    setForm({ nombre: u.nombre, correo: u.correo, rol: u.rol, estado: u.estado })
    setFormErrors({})
    setShowModal(true)
  }

  const validate = () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'Requerido'
    if (!form.correo.trim()) e.correo = 'Requerido'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) e.correo = 'Correo inválido'
    return e
  }

  const handleSave = (ev) => {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setFormErrors(e); return }
    if (editingUser) {
      setUsers((prev) => prev.map((u) => u.id === editingUser.id
        ? { ...u, ...form, initials: form.nombre.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() }
        : u
      ))
    } else {
      const newId = `USR-${String(users.length + 1).padStart(3, '0')}`
      setUsers((prev) => [...prev, {
        id: newId, ...form,
        ultimoAcceso: 'Hoy',
        initials: form.nombre.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
      }])
    }
    setShowModal(false)
  }

  const toggleEstado = (id) => {
    setUsers((prev) => prev.map((u) => u.id === id
      ? { ...u, estado: u.estado === 'Activo' ? 'Inactivo' : 'Activo' }
      : u
    ))
  }

  const confirmDelete = () => {
    setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id))
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
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-border text-text rounded-xl text-sm font-semibold hover:border-primary-800 hover:text-primary-800 transition-colors"
          >
            <Mail className="w-4 h-4" />
            Invitar
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-800 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Nuevo Usuario
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
                {['Usuario', 'Correo', 'Rol', 'Estado', 'Último Acceso', 'Acciones'].map((h) => (
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
                    <button
                      onClick={() => toggleEstado(u.id)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${u.estado === 'Activo' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                    >
                      {u.estado}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-text-muted">{u.ultimoAcceso}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-text-muted hover:text-primary-800 hover:bg-primary-50 transition-colors" title="Editar">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(u)} className="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors" title="Eliminar">
                        <Trash2 className="w-3.5 h-3.5" />
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
                <h3 className="text-base font-bold text-text">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                <button onClick={() => setShowModal(false)} className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-alt transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                {[
                  { key: 'nombre', label: 'Nombre Completo', type: 'text', placeholder: 'Ej. María García' },
                  { key: 'correo', label: 'Correo Electrónico', type: 'email', placeholder: 'usuario@iiap.org.co' },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key}>
                    <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                      {label} <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type={type}
                      value={form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${formErrors[key] ? 'border-red-400' : 'border-border focus:border-primary-800'}`}
                    />
                    {formErrors[key] && <p className="text-xs text-red-500 mt-1">{formErrors[key]}</p>}
                  </div>
                ))}
                <div>
                  <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Rol</label>
                  <select value={form.rol} onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))} className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition">
                    {ROLES_LIST.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 hover:text-primary-800 transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">
                    <Send className="w-4 h-4" />
                    {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
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
