import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, X, Send, ChevronDown, Trash2, Edit2,
  CheckCircle, XCircle, UserPlus,
} from 'lucide-react'
import { ADMIN_MOCK_USERS } from '@/lib/constants'

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

export default function Usuarios() {
  const [users, setUsers] = useState(ADMIN_MOCK_USERS)
  const [search, setSearch] = useState('')
  const [filtroRol, setFiltroRol] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
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
        id: newId,
        ...form,
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
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-800 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors shrink-0"
        >
          <UserPlus className="w-4 h-4" aria-hidden="true" />
          Nuevo Usuario
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div {...fadeUp(0.08)} className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" aria-hidden="true" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
          />
        </div>
        <select
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value)}
          className="px-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 transition"
        >
          <option value="">Todos los roles</option>
          {ROLES_LIST.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 transition"
        >
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
                  <th key={h} className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-text-muted px-5 py-3">
                    {h}
                  </th>
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
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-900 rounded-lg flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">{u.initials}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text">{u.nombre}</p>
                        <p className="text-[0.65rem] text-text-muted">{u.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-text-muted">{u.correo}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[u.rol]}`}>
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggleEstado(u.id)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                        u.estado === 'Activo'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-600 hover:bg-red-200'
                      }`}
                    >
                      {u.estado}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-text-muted">{u.ultimoAcceso}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEdit(u)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-primary-800 hover:bg-primary-50 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(u)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Eliminar"
                      >
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

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
          >
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
                  <select
                    value={form.rol}
                    onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition"
                  >
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
