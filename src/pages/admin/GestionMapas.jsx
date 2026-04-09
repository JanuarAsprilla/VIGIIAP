import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, X, Edit2, Trash2, Eye, EyeOff,
  Layers, Send, Upload, CheckCircle, AlertCircle,
  FileText, Image, Link as LinkIcon,
} from 'lucide-react'
import { fadeUpSm, panelAnim } from '@/lib/animations'
import { ADMIN_MOCK_MAPAS } from '@/lib/constants'

const fadeUp = fadeUpSm

const TEMATICAS = ['Hidrología', 'Cartografía Base', 'Biodiversidad', 'Zonificación', 'Infraestructura', 'Riesgo']
const ESCALES   = ['1:10.000', '1:25.000', '1:50.000', '1:100.000', '1:250.000', '1:500.000']
const FORMATOS  = ['PDF', 'IMG', 'Geovisor']

// MIME types y límites de tamaño aceptados por formato
const ACCEPT = {
  PDF:      '.pdf,application/pdf',
  IMG:      '.jpg,.jpeg,.png,.webp,image/*',
  Geovisor: null,
}
const MAX_SIZE_BYTES = {
  PDF: 20 * 1024 * 1024,  // 20 MB
  IMG: 25 * 1024 * 1024,  // 25 MB
}

const EMPTY_FORM = { nombre: '', tematica: TEMATICAS[0], escala: ESCALES[2], autor: '', fecha: '', visible: true, formato: 'PDF', url: '' }

const TEMATICA_COLORS = {
  'Hidrología':      'bg-blue-100 text-blue-700',
  'Cartografía Base':'bg-gray-100 text-gray-600',
  'Biodiversidad':   'bg-green-100 text-green-700',
  'Zonificación':    'bg-purple-100 text-purple-700',
  'Infraestructura': 'bg-orange-100 text-orange-700',
  'Riesgo':          'bg-red-100 text-red-600',
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// ── Dropzone ──
function FileDropzone({ formato, onFile, currentFile, editing, onError }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const accept = ACCEPT[formato]

  const validateAndAccept = useCallback((file) => {
    if (!file) return
    const maxBytes = MAX_SIZE_BYTES[formato]
    if (maxBytes && file.size > maxBytes) {
      onError?.(`El archivo supera el límite de ${formato === 'PDF' ? '20 MB' : '25 MB'}`)
      return
    }
    onError?.(null)
    onFile(file)
  }, [formato, onFile, onError])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    validateAndAccept(e.dataTransfer.files[0])
  }, [validateAndAccept])

  if (!accept) return null

  return (
    <div>
      <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
        Archivo del Mapa <span className="text-orange-500">*</span>
        {editing && <span className="ml-2 font-normal text-text-muted normal-case tracking-normal">— sube uno nuevo para reemplazar</span>}
      </label>

      {currentFile ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl"
        >
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text truncate">{currentFile.name}</p>
            <p className="text-xs text-text-muted">{formatBytes(currentFile.size)}</p>
          </div>
          <button type="button" onClick={() => onFile(null)} className="p-1 rounded-lg text-text-muted hover:text-red-500 transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-2 px-4 py-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
            dragging
              ? 'border-primary-600 bg-primary-50 scale-[1.01]'
              : 'border-border hover:border-primary-400 hover:bg-bg-alt/60'
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${dragging ? 'bg-primary-100' : 'bg-bg-alt'}`}>
            <Upload className={`w-5 h-5 transition-colors ${dragging ? 'text-primary-700' : 'text-text-muted'}`} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-text">
              {dragging ? 'Suelta el archivo aquí' : 'Arrastra y suelta o haz clic'}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              {formato === 'PDF' ? 'Solo archivos PDF' : 'JPG, PNG, WebP — imagen del mapa'}
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={(e) => { validateAndAccept(e.target.files[0]); e.target.value = '' }}
            className="sr-only"
          />
        </div>
      )}
    </div>
  )
}

export default function GestionMapas() {
  const [mapas, setMapas] = useState(ADMIN_MOCK_MAPAS)
  const [search, setSearch] = useState('')
  const [filtroTematica, setFiltroTematica] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [uploadedFile, setUploadedFile] = useState(null)
  const [uploadError, setUploadError] = useState(null)
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
    setUploadedFile(null)
    setUploadError(null)
    setShowModal(true)
  }

  const openEdit = (m) => {
    setEditing(m)
    setForm({ nombre: m.nombre, tematica: m.tematica, escala: m.escala, autor: m.autor, fecha: m.fecha, visible: m.visible, formato: m.formato, url: m.url || '' })
    setFormErrors({})
    setUploadedFile(null)
    setUploadError(null)
    setShowModal(true)
  }

  const validate = () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'Requerido'
    if (!form.autor.trim()) e.autor = 'Requerido'
    if (form.formato !== 'Geovisor' && !editing && !uploadedFile) e.archivo = 'Debes seleccionar un archivo'
    if (form.formato === 'Geovisor' && !form.url.trim()) e.url = 'Debes ingresar la URL del Geovisor'
    return e
  }

  const handleSave = (ev) => {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setFormErrors(e); return }

    const fileName = uploadedFile?.name

    if (editing) {
      setMapas((prev) => prev.map((m) => m.id === editing.id
        ? { ...m, ...form, ...(fileName ? { fileName } : {}) }
        : m
      ))
    } else {
      setMapas((prev) => [...prev, { id: prev.length + 1, ...form, fileName, consultas: 0 }])
    }
    setShowModal(false)
  }

  const toggleVisible = (id) => setMapas((prev) => prev.map((m) => m.id === id ? { ...m, visible: !m.visible } : m))

  const confirmDelete = () => {
    setMapas((prev) => prev.filter((m) => m.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const totalConsultas = mapas.reduce((a, m) => a + m.consultas, 0)
  const capasVisibles  = mapas.filter((m) => m.visible).length

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

      {/* Thematic pills */}
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
                  <span className={`text-[0.6rem] font-semibold px-1.5 py-0.5 rounded border ${
                    m.formato === 'PDF' ? 'border-red-200 text-red-500' :
                    m.formato === 'IMG' ? 'border-blue-200 text-blue-500' :
                    'border-primary-200 text-primary-700'
                  }`}>{m.formato}</span>
                </div>
                <p className="text-sm font-bold text-text">{m.nombre}</p>
                <p className="text-xs text-text-muted">{m.autor} · {m.fecha}</p>
                {m.fileName && <p className="text-[0.6rem] text-text-muted mt-0.5">{m.fileName}</p>}
              </div>
              <button
                onClick={() => toggleVisible(m.id)}
                className={`shrink-0 p-1.5 rounded-lg transition-colors ${m.visible ? 'text-primary-700 hover:bg-primary-50' : 'text-text-muted hover:bg-bg-alt'}`}
                aria-label={m.visible ? `Ocultar ${m.nombre}` : `Mostrar ${m.nombre}`}
              >
                {m.visible ? <Eye className="w-4 h-4" aria-hidden="true" /> : <EyeOff className="w-4 h-4" aria-hidden="true" />}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-text-muted" />
                <span className="text-xs text-text-muted">{m.consultas.toLocaleString()} consultas</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg text-text-muted hover:text-primary-800 hover:bg-primary-50 transition-colors" aria-label={`Editar ${m.nombre}`}>
                  <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button onClick={() => setDeleteTarget(m)} className="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors" aria-label={`Eliminar ${m.nombre}`}>
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
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
            <motion.div {...panelAnim} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-5 border-b border-border sticky top-0 bg-white z-10">
                <h3 className="text-base font-bold text-text">{editing ? 'Editar Capa de Mapa' : 'Subir Nueva Capa'}</h3>
                <button onClick={() => setShowModal(false)} className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-alt transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">

                {/* Formato selector */}
                <div>
                  <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Formato de Entrega</label>
                  <div className="grid grid-cols-3 gap-2">
                    {FORMATOS.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => { setForm((fm) => ({ ...fm, formato: f, url: '' })); setUploadedFile(null); setFormErrors({}) }}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${form.formato === f ? 'bg-primary-800 text-white border-primary-800' : 'bg-white text-text-muted border-border hover:border-primary-400'}`}
                      >
                        {f === 'PDF' && <FileText className="w-4 h-4" />}
                        {f === 'IMG' && <Image className="w-4 h-4" />}
                        {f === 'Geovisor' && <Layers className="w-4 h-4" />}
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dropzone or URL */}
                <FileDropzone
                  formato={form.formato}
                  onFile={setUploadedFile}
                  currentFile={uploadedFile}
                  editing={!!editing}
                  onError={setUploadError}
                />
                {uploadError && (
                  <div className="flex items-center gap-2 text-red-500 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    {uploadError}
                  </div>
                )}
                {form.formato === 'Geovisor' && (
                  <div>
                    <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5 flex items-center gap-1">
                      <LinkIcon className="w-3 h-3" /> URL del Geovisor <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.url}
                      onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                      placeholder="/geovisor o URL externa"
                      className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${formErrors.url ? 'border-red-400' : 'border-border focus:border-primary-800'}`}
                    />
                    {formErrors.url && <p className="text-xs text-red-500 mt-1">{formErrors.url}</p>}
                  </div>
                )}
                {formErrors.archivo && (
                  <div className="flex items-center gap-2 text-red-500 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {formErrors.archivo}
                  </div>
                )}

                {/* Metadata */}
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
                  <input type="checkbox" id="visible" checked={form.visible} onChange={(e) => setForm((f) => ({ ...f, visible: e.target.checked }))} className="w-4 h-4 accent-primary-800" />
                  <label htmlFor="visible" className="text-sm font-medium text-text">Visible en el Geovisor público</label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 hover:text-primary-800 transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">
                    <Send className="w-4 h-4" />
                    {editing ? 'Guardar Cambios' : 'Subir Capa'}
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
