import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, X, Edit2, Trash2, Download,
  FileText, File, Image, Send, Upload, CheckCircle,
  AlertCircle, Link as LinkIcon,
} from 'lucide-react'
import { fadeUpSm, panelAnim } from '@/lib/animations'
import { ADMIN_MOCK_DOCS } from '@/lib/constants'

const fadeUp = fadeUpSm

const CATEGORIES = ['Cartografía', 'Estudios Ambientales', 'Normativa', 'Informes Técnicos', 'Biodiversidad', 'Hidrología']
const TIPOS = ['PDF', 'IMG', 'Geovisor']

// MIME types y límites de tamaño aceptados por tipo de documento
const ACCEPT = {
  PDF:      '.pdf,application/pdf',
  IMG:      '.jpg,.jpeg,.png,.webp,image/*',
  Geovisor: null,
}
const MAX_SIZE_BYTES = {
  PDF: 20 * 1024 * 1024,  // 20 MB
  IMG: 25 * 1024 * 1024,  // 25 MB
}

const EMPTY_FORM = { nombre: '', categoria: CATEGORIES[0], tipo: TIPOS[0], autor: '', fecha: '', url: '' }

// Fase 2: reemplazar con llamadas a /api/admin/documentos

const TipoIcon = ({ tipo }) => {
  if (tipo === 'PDF') return <FileText className="w-4 h-4 text-red-500" />
  if (tipo === 'IMG') return <Image className="w-4 h-4 text-blue-500" />
  return <File className="w-4 h-4 text-primary-600" />
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// ── Dropzone component ──
function FileDropzone({ tipo, onFile, currentFile, editing, onError }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const accept = ACCEPT[tipo]

  const validateAndAccept = useCallback((file) => {
    if (!file) return
    const maxBytes = MAX_SIZE_BYTES[tipo]
    if (maxBytes && file.size > maxBytes) {
      onError?.(`El archivo supera el límite de ${tipo === 'PDF' ? '20 MB' : '25 MB'}`)
      return
    }
    onError?.(null)
    onFile(file)
  }, [tipo, onFile, onError])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    validateAndAccept(e.dataTransfer.files[0])
  }, [validateAndAccept])

  const handleChange = (e) => {
    validateAndAccept(e.target.files[0])
    // reset value so the same file can be re-selected after error
    e.target.value = ''
  }

  if (tipo === 'Geovisor') return null

  return (
    <div>
      <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
        Archivo <span className="text-orange-500">*</span>
        {editing && <span className="ml-2 font-normal text-text-muted normal-case tracking-normal">— sube un nuevo archivo para reemplazar</span>}
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
          <button
            type="button"
            onClick={() => onFile(null)}
            className="p-1 rounded-lg text-text-muted hover:text-red-500 transition-colors shrink-0"
          >
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
              {tipo === 'PDF' ? 'Solo archivos PDF' : 'JPG, PNG, WebP'}
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="sr-only"
          />
        </div>
      )}
    </div>
  )
}

export default function GestionDocumentos() {
  const [docs, setDocs] = useState(ADMIN_MOCK_DOCS)
  const [search, setSearch] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [uploadedFile, setUploadedFile] = useState(null)
  const [uploadError, setUploadError] = useState(null)
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
    setUploadedFile(null)
    setUploadError(null)
    setShowModal(true)
  }

  const openEdit = (d) => {
    setEditing(d)
    setForm({ nombre: d.nombre, categoria: d.categoria, tipo: d.tipo, autor: d.autor, fecha: d.fecha, url: d.url || '' })
    setFormErrors({})
    setUploadedFile(null)
    setUploadError(null)
    setShowModal(true)
  }

  const validate = () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'Requerido'
    if (!form.autor.trim()) e.autor = 'Requerido'
    if (form.tipo !== 'Geovisor' && !editing && !uploadedFile) e.archivo = 'Debes seleccionar un archivo'
    if (form.tipo === 'Geovisor' && !form.url.trim()) e.url = 'Debes ingresar la URL del Geovisor'
    return e
  }

  const handleSave = (ev) => {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setFormErrors(e); return }

    const tamano = uploadedFile ? formatBytes(uploadedFile.size) : (editing?.tamano || '—')
    const fileName = uploadedFile?.name

    if (editing) {
      setDocs((prev) => prev.map((d) => d.id === editing.id
        ? { ...d, ...form, tamano, ...(fileName ? { fileName } : {}) }
        : d
      ))
    } else {
      setDocs((prev) => [...prev, {
        id: prev.length + 1,
        ...form,
        tamano,
        fileName,
        descargas: 0,
      }])
    }
    setShowModal(false)
  }

  const confirmDelete = () => {
    setDocs((prev) => prev.filter((d) => d.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

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

      {/* Category pills */}
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
                      <div>
                        <p className="text-sm font-semibold text-text">{d.nombre}</p>
                        {d.fileName && <p className="text-[0.6rem] text-text-muted">{d.fileName}</p>}
                      </div>
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
                      <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg text-text-muted hover:text-primary-800 hover:bg-primary-50 transition-colors" aria-label={`Editar ${d.nombre}`}>
                        <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                      <button onClick={() => setDeleteTarget(d)} className="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors" aria-label={`Eliminar ${d.nombre}`}>
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
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
            <motion.div {...panelAnim} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-5 border-b border-border sticky top-0 bg-white z-10">
                <h3 className="text-base font-bold text-text">{editing ? 'Editar Documento' : 'Subir Nuevo Documento'}</h3>
                <button onClick={() => setShowModal(false)} className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-alt transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">

                {/* Tipo selector first — determines what upload UI shows */}
                <div className="grid grid-cols-3 gap-2">
                  {TIPOS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => { setForm((f) => ({ ...f, tipo: t, url: '' })); setUploadedFile(null); setFormErrors({}) }}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${form.tipo === t ? 'bg-primary-800 text-white border-primary-800' : 'bg-white text-text-muted border-border hover:border-primary-400'}`}
                    >
                      {t === 'PDF' && <FileText className="w-4 h-4" />}
                      {t === 'IMG' && <Image className="w-4 h-4" />}
                      {t === 'Geovisor' && <File className="w-4 h-4" />}
                      {t}
                    </button>
                  ))}
                </div>

                {/* File dropzone or Geovisor URL */}
                <FileDropzone
                  tipo={form.tipo}
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
                {form.tipo === 'Geovisor' && (
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

                {/* Metadata fields */}
                {[
                  { key: 'nombre', label: 'Nombre del Documento', required: true },
                  { key: 'autor', label: 'Autor / Responsable', required: true },
                  { key: 'fecha', label: 'Fecha (ej. 15 Abr 2026)', required: false },
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

                <div>
                  <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Categoría</label>
                  <select value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))} className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition">
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 hover:text-primary-800 transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">
                    <Send className="w-4 h-4" />
                    {editing ? 'Guardar Cambios' : 'Subir Documento'}
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
