import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, X, Edit2, Trash2, Eye, EyeOff,
  Layers, Map, Send,
} from 'lucide-react'

const fadeUp = (d = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: d, ease: [0.22, 1, 0.36, 1] } })
const panelAnim = {
  initial: { opacity: 0, scale: 0.96, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit:    { opacity: 0, scale: 0.96, y: 10 },
  transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
}

const TEMATICAS = ['Hidrología', 'Cartografía Base', 'Biodiversidad', 'Zonificación', 'Infraestructura', 'Riesgo']
const ESCALES = ['1:10.000', '1:25.000', '1:50.000', '1:100.000', '1:250.000', '1:500.000']

const MOCK_MAPAS = [
  { id: 1, nombre: 'Red Hidrográfica del Pacífico', tematica: 'Hidrología', escala: '1:100.000', autor: 'Equipo Hidrografía', fecha: '15 Mar 2026', visible: true, consultas: 418 },
  { id: 2, nombre: 'Mapa Base Chocó Biogeográfico', tematica: 'Cartografía Base', escala: '1:250.000', autor: 'Equipo Cartográfico', fecha: '10 Mar 2026', visible: true, consultas: 634 },
  { id: 3, nombre: 'Distribución de Especies Endémicas', tematica: 'Biodiversidad', escala: '1:50.000', autor: 'Laboratorio Biodiversidad', fecha: '05 Mar 2026', visible: true, consultas: 287 },
  { id: 4, nombre: 'Zonificación Ambiental 2024', tematica: 'Zonificación', escala: '1:100.000', autor: 'Gestión Territorial', fecha: '28 Feb 2026', visible: true, consultas: 512 },
  { id: 5, nombre: 'Infraestructura Vial — Quibdó', tematica: 'Infraestructura', escala: '1:25.000', autor: 'SIG Institucional', fecha: '20 Feb 2026', visible: false, consultas: 156 },
  { id: 6, nombre: 'Zonas de Riesgo por Inundación', tematica: 'Riesgo', escala: '1:50.000', autor: 'Gestión del Riesgo', fecha: '15 Feb 2026', visible: true, consultas: 329 },
  { id: 7, nombre: 'Cobertura Vegetal 2024', tematica: 'Biodiversidad', escala: '1:100.000', autor: 'Teledetección IIAP', fecha: '10 Feb 2026', visible: true, consultas: 445 },
  { id: 8, nombre: 'Áreas Protegidas del Chocó', tematica: 'Zonificación', escala: '1:250.000', autor: 'SIG Institucional', fecha: '05 Feb 2026', visible: true, consultas: 597 },
]

const EMPTY_FORM = { nombre: '', tematica: TEMATICAS[0], escala: ESCALES[2], autor: '', fecha: '', visible: true }

const TEMATICA_COLORS = {
  'Hidrología': 'bg-blue-100 text-blue-700',
  'Cartografía Base': 'bg-gray-100 text-gray-600',
  'Biodiversidad': 'bg-green-100 text-green-700',
  'Zonificación': 'bg-purple-100 text-purple-700',
  'Infraestructura': 'bg-orange-100 text-orange-700',
  'Riesgo': 'bg-red-100 text-red-600',
}

export default function GestionMapas() {
  const [mapas, setMapas] = useState(MOCK_MAPAS)
  const [search, setSearch] = useState('')
  const [filtroTematica, setFiltroTematica] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)

  const filtered = mapas.filter((m) => {
    const q = search.toLowerCase()
    const matchQ = !q || m.nombre.toLowerCase().includes(q) || m.autor.toLowerCase().includes(q)
    const matchT = !filtroTematica || m.tematica === filtroTematica
    return matchQ && matchT
  })

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
    setShowModal(true)
  }

  const openEdit = (m) => {
    setEditing(m)
    setForm({ nombre: m.nombre, tematica: m.tematica, escala: m.escala, autor: m.autor, fecha: m.fecha, visible: m.visible })
    setFormErrors({})
    setShowModal(true)
  }

  const validate = () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'Requerido'
    if (!form.autor.trim()) e.autor = 'Requerido'
    return e
  }

  const handleSave = (ev) => {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setFormErrors(e); return }
    if (editing) {
      setMapas((prev) => prev.map((m) => m.id === editing.id ? { ...m, ...form } : m))
    } else {
      setMapas((prev) => [...prev, { id: prev.length + 1, ...form, consultas: 0 }])
    }
    setShowModal(false)
  }

  const toggleVisible = (id) => {
    setMapas((prev) => prev.map((m) => m.id === id ? { ...m, visible: !m.visible } : m))
  }

  const confirmDelete = () => {
    setMapas((prev) => prev.filter((m) => m.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const totalConsultas = mapas.reduce((a, m) => a + m.consultas, 0)
  const capasVisibles = mapas.filter((m) => m.visible).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[0.7rem] font-bold uppercase tracking-widest text-primary-700">Administración</span>
          <h1 className="font-display text-2xl font-bold text-text mt-0.5">Gestión de Mapas</h1>
          <p className="text-sm text-text-muted mt-1">{mapas.length} capas · {capasVisibles} visibles · {totalConsultas.toLocaleString()} consultas totales</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-800 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nueva Capa
        </button>
      </motion.div>

      {/* Thematic filter pills */}
      <motion.div {...fadeUp(0.06)} className="flex flex-wrap gap-2">
        {TEMATICAS.map((t) => (
          <button
            key={t}
            onClick={() => setFiltroTematica(filtroTematica === t ? '' : t)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${filtroTematica === t ? 'bg-primary-800 text-white border-primary-800' : 'bg-white text-text-muted border-border hover:border-primary-800 hover:text-primary-800'}`}
          >
            {t}
          </button>
        ))}
      </motion.div>

      {/* Search */}
      <motion.div {...fadeUp(0.1)} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="Buscar por nombre o autor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
        />
      </motion.div>

      {/* Cards */}
      <motion.div {...fadeUp(0.16)} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-2 py-12 text-center text-sm text-text-muted">Sin resultados</div>
        )}
        {filtered.map((m) => (
          <div key={m.id} className={`bg-white border rounded-xl p-5 transition-all ${m.visible ? 'border-border' : 'border-border opacity-60'}`}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${TEMATICA_COLORS[m.tematica]}`}>{m.tematica}</span>
                  <span className="text-[0.6rem] text-text-muted">{m.escala}</span>
                </div>
                <p className="text-sm font-bold text-text">{m.nombre}</p>
                <p className="text-xs text-text-muted">{m.autor} · {m.fecha}</p>
              </div>
              <button
                onClick={() => toggleVisible(m.id)}
                className={`shrink-0 p-1.5 rounded-lg transition-colors ${m.visible ? 'text-primary-700 hover:bg-primary-50' : 'text-text-muted hover:bg-bg-alt'}`}
                title={m.visible ? 'Visible — clic para ocultar' : 'Oculta — clic para mostrar'}
              >
                {m.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-text-muted" />
                <span className="text-xs text-text-muted">{m.consultas.toLocaleString()} consultas</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg text-text-muted hover:text-primary-800 hover:bg-primary-50 transition-colors" title="Editar">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteTarget(m)} className="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors" title="Eliminar">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Create/Edit modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>
            <motion.div {...panelAnim} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <h3 className="text-base font-bold text-text">{editing ? 'Editar Capa' : 'Nueva Capa de Mapa'}</h3>
                <button onClick={() => setShowModal(false)} className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-alt transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                {[
                  { key: 'nombre', label: 'Nombre de la Capa', required: true },
                  { key: 'autor', label: 'Autor / Responsable', required: true },
                  { key: 'fecha', label: 'Fecha', required: false },
                ].map(({ key, label, required }) => (
                  <div key={key}>
                    <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                      {label} {required && <span className="text-orange-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${formErrors[key] ? 'border-red-400' : 'border-border focus:border-primary-800'}`}
                    />
                    {formErrors[key] && <p className="text-xs text-red-500 mt-1">{formErrors[key]}</p>}
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Temática</label>
                    <select value={form.tematica} onChange={(e) => setForm((f) => ({ ...f, tematica: e.target.value }))} className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition">
                      {TEMATICAS.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Escala</label>
                    <select value={form.escala} onChange={(e) => setForm((f) => ({ ...f, escala: e.target.value }))} className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition">
                      {ESCALES.map((e) => <option key={e}>{e}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="visible"
                    checked={form.visible}
                    onChange={(e) => setForm((f) => ({ ...f, visible: e.target.checked }))}
                    className="w-4 h-4 accent-primary-800"
                  />
                  <label htmlFor="visible" className="text-sm font-medium text-text">Visible en el Geovisor</label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 hover:text-primary-800 transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">
                    <Send className="w-4 h-4" />
                    {editing ? 'Guardar' : 'Agregar'}
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
              <h3 className="text-base font-bold text-text mb-2">Eliminar Capa</h3>
              <p className="text-sm text-text-muted mb-6">¿Seguro que deseas eliminar <strong className="text-text">{deleteTarget.nombre}</strong>?</p>
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
