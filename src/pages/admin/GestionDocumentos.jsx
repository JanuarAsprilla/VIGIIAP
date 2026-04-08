import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, X, Edit2, Trash2, Download,
  FileText, File, Image, Send,
} from 'lucide-react'

const fadeUp = (d = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: d, ease: [0.22, 1, 0.36, 1] } })
const panelAnim = {
  initial: { opacity: 0, scale: 0.96, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit:    { opacity: 0, scale: 0.96, y: 10 },
  transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
}

const CATEGORIES = ['Cartografía', 'Estudios Ambientales', 'Normativa', 'Informes Técnicos', 'Biodiversidad', 'Hidrología']
const TIPOS = ['PDF', 'IMG', 'Geovisor']

const MOCK_DOCS = [
  { id: 1, nombre: 'Mapa Base Chocó 2024', categoria: 'Cartografía', tipo: 'PDF', autor: 'Equipo Cartográfico', fecha: '15 Mar 2026', tamano: '4.2 MB', descargas: 142 },
  { id: 2, nombre: 'Estudio Cobertura Vegetal 2024', categoria: 'Estudios Ambientales', tipo: 'PDF', autor: 'Laboratorio SIG', fecha: '10 Mar 2026', tamano: '8.7 MB', descargas: 98 },
  { id: 3, nombre: 'Red Hidrográfica Pacífico', categoria: 'Hidrología', tipo: 'IMG', autor: 'Equipo Hidrografía', fecha: '05 Mar 2026', tamano: '12.1 MB', descargas: 67 },
  { id: 4, nombre: 'Zonificación Ambiental 2023', categoria: 'Cartografía', tipo: 'PDF', autor: 'Gestión Territorial', fecha: '28 Feb 2026', tamano: '6.3 MB', descargas: 215 },
  { id: 5, nombre: 'Informe de Biodiversidad Q4-2025', categoria: 'Biodiversidad', tipo: 'PDF', autor: 'Equipo Biodiversidad', fecha: '20 Feb 2026', tamano: '3.8 MB', descargas: 54 },
  { id: 6, nombre: 'Normativa Ambiental Chocó 2024', categoria: 'Normativa', tipo: 'PDF', autor: 'Jurídica IIAP', fecha: '15 Feb 2026', tamano: '2.1 MB', descargas: 183 },
  { id: 7, nombre: 'Geovisor — Cuencas Hidrográficas', categoria: 'Hidrología', tipo: 'Geovisor', autor: 'Geoportal Regional', fecha: '10 Feb 2026', tamano: '—', descargas: 312 },
  { id: 8, nombre: 'Imagen Satelital Atrato 2025', categoria: 'Cartografía', tipo: 'IMG', autor: 'Teledetección IIAP', fecha: '05 Feb 2026', tamano: '22.4 MB', descargas: 78 },
]

const EMPTY_FORM = { nombre: '', categoria: CATEGORIES[0], tipo: TIPOS[0], autor: '', fecha: '', tamano: '' }

const TipoIcon = ({ tipo }) => {
  if (tipo === 'PDF') return <FileText className="w-4 h-4 text-red-500" />
  if (tipo === 'IMG') return <Image className="w-4 h-4 text-blue-500" />
  return <File className="w-4 h-4 text-primary-600" />
}

export default function GestionDocumentos() {
  const [docs, setDocs] = useState(MOCK_DOCS)
  const [search, setSearch] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)

  const filtered = docs.filter((d) => {
    const q = search.toLowerCase()
    const matchQ = !q || d.nombre.toLowerCase().includes(q) || d.autor.toLowerCase().includes(q)
    const matchC = !filtroCategoria || d.categoria === filtroCategoria
    const matchT = !filtroTipo || d.tipo === filtroTipo
    return matchQ && matchC && matchT
  })

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
    setShowModal(true)
  }

  const openEdit = (d) => {
    setEditing(d)
    setForm({ nombre: d.nombre, categoria: d.categoria, tipo: d.tipo, autor: d.autor, fecha: d.fecha, tamano: d.tamano })
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
      setDocs((prev) => prev.map((d) => d.id === editing.id ? { ...d, ...form } : d))
    } else {
      setDocs((prev) => [...prev, { id: prev.length + 1, ...form, descargas: 0 }])
    }
    setShowModal(false)
  }

  const confirmDelete = () => {
    setDocs((prev) => prev.filter((d) => d.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  // Totals by category
  const byCategory = CATEGORIES.map((c) => ({ label: c, count: docs.filter((d) => d.categoria === c).length })).filter((c) => c.count > 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[0.7rem] font-bold uppercase tracking-widest text-primary-700">Administración</span>
          <h1 className="font-display text-2xl font-bold text-text mt-0.5">Gestión de Documentos</h1>
          <p className="text-sm text-text-muted mt-1">{docs.length} documentos · {docs.reduce((a, d) => a + d.descargas, 0)} descargas totales</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-800 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nuevo Documento
        </button>
      </motion.div>

      {/* Category summary */}
      <motion.div {...fadeUp(0.06)} className="flex flex-wrap gap-2">
        {byCategory.map((c) => (
          <button
            key={c.label}
            onClick={() => setFiltroCategoria(filtroCategoria === c.label ? '' : c.label)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${filtroCategoria === c.label ? 'bg-primary-800 text-white border-primary-800' : 'bg-white text-text-muted border-border hover:border-primary-800 hover:text-primary-800'}`}
          >
            {c.label} <span className="ml-1 opacity-70">{c.count}</span>
          </button>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div {...fadeUp(0.1)} className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar por nombre o autor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
          />
        </div>
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="px-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 transition"
        >
          <option value="">Todos los tipos</option>
          {TIPOS.map((t) => <option key={t}>{t}</option>)}
        </select>
      </motion.div>

      {/* Table */}
      <motion.div {...fadeUp(0.16)} className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-alt/50">
                {['Documento', 'Categoría', 'Tipo', 'Autor', 'Fecha', 'Tamaño', 'Descargas', 'Acciones'].map((h) => (
                  <th key={h} className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-text-muted px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-text-muted">Sin resultados</td></tr>
              )}
              {filtered.map((d) => (
                <tr key={d.id} className="border-b border-border last:border-b-0 hover:bg-bg-alt/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <TipoIcon tipo={d.tipo} />
                      <p className="text-sm font-semibold text-text">{d.nombre}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs px-2 py-0.5 bg-primary-50 text-primary-800 rounded-full font-medium">{d.categoria}</span>
                  </td>
                  <td className="px-5 py-3.5 text-xs font-semibold text-text-muted">{d.tipo}</td>
                  <td className="px-5 py-3.5 text-sm text-text-muted">{d.autor}</td>
                  <td className="px-5 py-3.5 text-sm text-text-muted">{d.fecha}</td>
                  <td className="px-5 py-3.5 text-xs text-text-muted">{d.tamano}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <Download className="w-3 h-3 text-text-muted" />
                      <span className="text-xs font-semibold text-text">{d.descargas}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg text-text-muted hover:text-primary-800 hover:bg-primary-50 transition-colors" title="Editar">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(d)} className="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors" title="Eliminar">
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
          <span className="text-xs text-text-muted">Mostrando {filtered.length} de {docs.length} documentos</span>
        </div>
      </motion.div>

      {/* Create/Edit modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>
            <motion.div {...panelAnim} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <h3 className="text-base font-bold text-text">{editing ? 'Editar Documento' : 'Nuevo Documento'}</h3>
                <button onClick={() => setShowModal(false)} className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-alt transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                {[
                  { key: 'nombre', label: 'Nombre del Documento', required: true },
                  { key: 'autor', label: 'Autor / Responsable', required: true },
                  { key: 'fecha', label: 'Fecha', required: false },
                  { key: 'tamano', label: 'Tamaño (ej. 4.2 MB)', required: false },
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
                    <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Categoría</label>
                    <select value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))} className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition">
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Tipo</label>
                    <select value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))} className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition">
                      {TIPOS.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
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
              <h3 className="text-base font-bold text-text mb-2">Eliminar Documento</h3>
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
