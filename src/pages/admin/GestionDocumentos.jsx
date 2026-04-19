import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, X, Edit2, Trash2,
  FileText, File, FileSpreadsheet, Send, Upload, CheckCircle,
  AlertCircle, Globe, Users, ShieldCheck,
  Loader2, FolderOpen,
} from 'lucide-react'
import { fadeUpSm, panelAnim } from '@/lib/animations'
import { useDocumentosList, useCreateDocumento, useUpdateDocumento, useDeleteDocumento } from '@/hooks/useDocumentos'

const fadeUp = fadeUpSm

const CATEGORIES = [
  'Cartografía', 'Estudios Ambientales', 'Normativa', 'Informes Técnicos',
  'Biodiversidad', 'Hidrología', 'Protocolos Ambientales',
  'Bibliografía Técnica', 'Análisis de Tendencias', 'Formatos y Plantillas',
]
const TIPOS = ['PDF', 'Word', 'Excel']

const ACCEPT = {
  PDF:   '.pdf,application/pdf',
  Word:  '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  Excel: '.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}
const MAX_SIZE_BYTES = {
  PDF:   20 * 1024 * 1024,
  Word:  50 * 1024 * 1024,
  Excel: 50 * 1024 * 1024,
}
const TIPO_HINT = {
  PDF:   'Archivos PDF — máx. 20 MB',
  Word:  'Archivos Word (.doc, .docx) — máx. 50 MB',
  Excel: 'Archivos Excel (.xls, .xlsx) — máx. 50 MB',
}

const VISIBILIDAD = [
  { value: 'publico',     label: 'Público general',      icon: Globe,       color: 'text-green-700 bg-green-50 border-green-300',    pill: 'bg-green-100 text-green-700' },
  { value: 'usuarios',    label: 'Usuarios registrados', icon: Users,       color: 'text-blue-700 bg-blue-50 border-blue-300',       pill: 'bg-blue-100 text-blue-700' },
  { value: 'acreditados', label: 'Solo acreditados',     icon: ShieldCheck, color: 'text-purple-700 bg-purple-50 border-purple-300', pill: 'bg-purple-100 text-purple-700' },
]

const EMPTY_FORM = {
  nombre: '', categoria: CATEGORIES[0], tipo: TIPOS[0],
  autor: '', anio: '', visibilidad: 'publico',
}

function typeToTipo(type) {
  const t = type?.toLowerCase()
  if (t === 'doc' || t === 'docx' || t === 'word') return 'Word'
  if (t === 'xls' || t === 'xlsx' || t === 'excel') return 'Excel'
  return 'PDF'
}

const visMap = Object.fromEntries(VISIBILIDAD.map((v) => [v.value, v]))

const TipoIcon = ({ tipo }) => {
  const t = tipo?.toLowerCase()
  if (t === 'pdf')  return <FileText className="w-4 h-4 text-red-500" />
  if (t === 'docx' || t === 'doc' || t === 'word')  return <FileText className="w-4 h-4 text-blue-500" />
  if (t === 'xlsx' || t === 'xls' || t === 'excel') return <FileSpreadsheet className="w-4 h-4 text-green-600" />
  return <File className="w-4 h-4 text-primary-600" />
}

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// ── Toast de éxito ────────────────────────────────────────────────────────────
function SavedToast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-5 py-3 bg-green-700 text-white rounded-2xl shadow-xl"
    >
      <CheckCircle className="w-5 h-5 shrink-0" />
      <span className="text-sm font-semibold">{message}</span>
    </motion.div>
  )
}

// ── Barra de progreso de subida ───────────────────────────────────────────────
function UploadProgress({ progress }) {
  if (progress === null || progress === 0) return null
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs font-semibold text-primary-800">
        <span>Subiendo archivo a la nube…</span>
        <span className="tabular-nums">{progress}%</span>
      </div>
      <div className="h-2 bg-bg-alt rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary-800 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        />
      </div>
      <p className="text-[0.6rem] text-text-muted">No cierres esta ventana hasta que termine</p>
    </div>
  )
}

// ── Selector de visibilidad ───────────────────────────────────────────────────
function VisibilidadSelector({ value, onChange }) {
  return (
    <div>
      <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-2">
        Nivel de acceso al documento
      </label>
      <div className="grid grid-cols-3 gap-2">
        {VISIBILIDAD.map(({ value: v, label, icon: Icon, color }) => (
          <button key={v} type="button" onClick={() => onChange(v)}
            className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-semibold transition-all text-center ${
              value === v ? color : 'bg-white text-text-muted border-border hover:border-primary-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="leading-tight">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Dropzone ──────────────────────────────────────────────────────────────────
function FileDropzone({ tipo, onFile, currentFile, editing, onError }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const accept = ACCEPT[tipo]

  const validateAndAccept = useCallback((file) => {
    if (!file) return
    const maxBytes = MAX_SIZE_BYTES[tipo]
    if (maxBytes && file.size > maxBytes) {
      onError?.(`El archivo supera el límite permitido para ${tipo}`)
      return
    }
    onError?.(null)
    onFile(file)
  }, [tipo, onFile, onError])

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    validateAndAccept(e.dataTransfer.files[0])
  }, [validateAndAccept])

  return (
    <div>
      <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
        Archivo del documento <span className="text-orange-500">*</span>
        {editing && <span className="ml-2 font-normal normal-case tracking-normal text-text-muted">— sube uno nuevo para reemplazar el actual</span>}
      </label>
      {currentFile ? (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text truncate">{currentFile.name}</p>
            <p className="text-xs text-text-muted">{formatBytes(currentFile.size)} · listo para subir</p>
          </div>
          <button type="button" onClick={() => onFile(null)}
            className="p-1 rounded-lg text-text-muted hover:text-red-500 transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-2 px-4 py-10 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
            dragging ? 'border-primary-600 bg-primary-50 scale-[1.01]' : 'border-border hover:border-primary-400 hover:bg-bg-alt/60'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${dragging ? 'bg-primary-100' : 'bg-bg-alt'}`}>
            <Upload className={`w-6 h-6 transition-colors ${dragging ? 'text-primary-700' : 'text-text-muted'}`} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-text">{dragging ? 'Suelta el archivo aquí' : 'Haz clic o arrastra el archivo aquí'}</p>
            <p className="text-xs text-text-muted mt-1">{TIPO_HINT[tipo] ?? ''}</p>
          </div>
          <input ref={inputRef} type="file" accept={accept}
            onChange={(e) => { validateAndAccept(e.target.files[0]); e.target.value = '' }}
            className="sr-only" />
        </div>
      )}
    </div>
  )
}

export default function GestionDocumentos() {
  const { data, isLoading } = useDocumentosList({ limit: 200, admin: 'true' })
  const docs = data?.data ?? []
  const createDocumento = useCreateDocumento()
  const updateDocumento = useUpdateDocumento()
  const deleteDocumento = useDeleteDocumento()

  const [search, setSearch] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [uploadedFile, setUploadedFile] = useState(null)
  const [uploadError, setUploadError] = useState(null)
  const [submitError, setSubmitError] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, setToast] = useState(null)

  const isSubmitting = createDocumento.isPending || updateDocumento.isPending

  const filtered = docs.filter((d) => {
    const q = search.toLowerCase()
    const matchQ = !q || d.nombre?.toLowerCase().includes(q) || (d.autores ?? '').toLowerCase().includes(q)
    const matchC = !filtroCategoria || d.categoria === filtroCategoria
    const matchT = !filtroTipo || typeToTipo(d.type) === filtroTipo
    return matchQ && matchC && matchT
  })

  const openCreate = () => {
    setEditing(null); setForm(EMPTY_FORM); setFormErrors({})
    setUploadedFile(null); setUploadError(null); setSubmitError(null)
    setUploadProgress(null); setShowModal(true)
  }

  const openEdit = (d) => {
    setEditing(d)
    setForm({
      nombre:      d.nombre,
      categoria:   d.categoria,
      tipo:        typeToTipo(d.type),
      autor:       d.autores ?? '',
      anio:        d.anio ?? '',
      visibilidad: d.visibilidad ?? 'publico',
    })
    setFormErrors({}); setUploadedFile(null); setUploadError(null)
    setSubmitError(null); setUploadProgress(null); setShowModal(true)
  }

  const validate = () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'El nombre del documento es obligatorio'
    if (!editing && !uploadedFile)
      e.archivo = 'Debes seleccionar el archivo del documento para continuar'
    return e
  }

  const handleSave = async (ev) => {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setFormErrors(e); return }
    setSubmitError(null); setUploadProgress(null)

    const payload = new FormData()
    payload.append('titulo',      form.nombre)
    payload.append('tipo',        form.categoria)   // tipo en BD = categoría temática
    payload.append('visibilidad', form.visibilidad)
    if (form.autor.trim()) payload.append('autores', form.autor)
    if (form.anio) payload.append('anio', form.anio)
    if (uploadedFile) payload.append('archivo', uploadedFile)

    const onUploadProgress = uploadedFile
      ? (ev) => setUploadProgress(ev.total ? Math.round((ev.loaded / ev.total) * 100) : 50)
      : undefined

    try {
      if (editing) {
        await updateDocumento.mutateAsync({ id: editing.id, formData: payload, onUploadProgress })
        setToast(`Documento "${form.nombre}" actualizado correctamente`)
      } else {
        await createDocumento.mutateAsync({ formData: payload, onUploadProgress })
        setToast(`Documento "${form.nombre}" registrado correctamente`)
      }
      setShowModal(false)
    } catch (err) {
      setSubmitError(err?.response?.data?.error ?? err?.message ?? 'No se pudo guardar. Verifica la conexión e intenta de nuevo.')
    } finally {
      setUploadProgress(null)
    }
  }

  const confirmDelete = async () => {
    await deleteDocumento.mutateAsync(deleteTarget.id)
    setToast(`Documento "${deleteTarget.nombre}" eliminado`)
    setDeleteTarget(null)
  }

  const byCategory = CATEGORIES
    .map((c) => ({ label: c, count: docs.filter((d) => d.categoria === c).length }))
    .filter((c) => c.count > 0)

  return (
    <div className="space-y-6">

      <AnimatePresence>
        {toast && <SavedToast message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>

      {/* Header */}
      <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[0.7rem] font-bold uppercase tracking-widest text-primary-700">Administración</span>
          <h1 className="font-display text-2xl font-bold text-text mt-0.5">Gestión de Documentos</h1>
          <p className="text-sm text-text-muted mt-1">
            {isLoading ? 'Cargando…' : `${docs.length} documentos registrados`}
          </p>
        </div>
        <button onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-800 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors shrink-0">
          <Plus className="w-4 h-4" /> Ingresar nuevo documento
        </button>
      </motion.div>

      {/* Category pills */}
      {byCategory.length > 0 && (
        <motion.div {...fadeUp(0.06)} className="flex flex-wrap gap-2">
          {byCategory.map((c) => (
            <button key={c.label}
              onClick={() => setFiltroCategoria(filtroCategoria === c.label ? '' : c.label)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                filtroCategoria === c.label
                  ? 'bg-primary-800 text-white border-primary-800'
                  : 'bg-white text-text-muted border-border hover:border-primary-800 hover:text-primary-800'
              }`}>
              {c.label} <span className="ml-1 opacity-70">{c.count}</span>
            </button>
          ))}
        </motion.div>
      )}

      {/* Filters */}
      <motion.div {...fadeUp(0.1)} className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input type="text" placeholder="Buscar documento por nombre o autor…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition" />
        </div>
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}
          className="px-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 transition">
          <option value="">Todos los tipos</option>
          {TIPOS.map((t) => <option key={t}>{t}</option>)}
        </select>
      </motion.div>

      {/* Empty state */}
      {!isLoading && docs.length === 0 && (
        <motion.div {...fadeUp(0.14)} className="flex flex-col items-center justify-center py-20 text-center bg-white border border-dashed border-border rounded-2xl">
          <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-primary-400" />
          </div>
          <h3 className="text-base font-bold text-text mb-1">Aún no hay documentos registrados</h3>
          <p className="text-sm text-text-muted mb-6 max-w-xs">Ingresa el primer documento para que aparezca en el portal público de VIGIIAP.</p>
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-800 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" /> Ingresar el primer documento
          </button>
        </motion.div>
      )}

      {/* Table */}
      {docs.length > 0 && (
        <motion.div {...fadeUp(0.16)} className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg-alt/50">
                  {['Documento', 'Categoría', 'Acceso', 'Tipo', 'Autor', 'Fecha', 'Acciones'].map((h) => (
                    <th key={h} className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-text-muted px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-text-muted">No hay documentos que coincidan con la búsqueda</td></tr>
                )}
                {filtered.map((d) => {
                  const vis = visMap[d.visibilidad] ?? visMap.publico
                  const VisIcon = vis.icon
                  return (
                    <tr key={d.id} className="border-b border-border last:border-b-0 hover:bg-bg-alt/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <TipoIcon tipo={d.type?.toUpperCase() ?? 'PDF'} />
                          <p className="text-sm font-semibold text-text max-w-[200px] truncate">{d.nombre}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs px-2 py-0.5 bg-primary-50 text-primary-800 rounded-full font-medium whitespace-nowrap">{d.categoria}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-[0.65rem] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${vis.pill}`}>
                          <VisIcon className="w-3 h-3" />{vis.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-semibold text-text-muted">{d.type?.toUpperCase()}</td>
                      <td className="px-5 py-3.5 text-sm text-text-muted">{d.autores || '—'}</td>
                      <td className="px-5 py-3.5 text-sm text-text-muted whitespace-nowrap">{d.fecha}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(d)}
                            className="p-1.5 rounded-lg text-text-muted hover:text-primary-800 hover:bg-primary-50 transition-colors"
                            title="Editar documento">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteTarget(d)}
                            className="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Eliminar documento">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-border bg-bg-alt/30">
            <span className="text-xs text-text-muted">Mostrando {filtered.length} de {docs.length} documentos</span>
          </div>
        </motion.div>
      )}

      {/* Modal ingresar / editar documento */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget && !isSubmitting) setShowModal(false) }}>
            <motion.div {...panelAnim} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-border sticky top-0 bg-white z-10">
                <div>
                  <h3 className="text-base font-bold text-text">
                    {editing ? 'Editar documento' : 'Ingresar nuevo documento'}
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    {editing ? 'Actualiza los datos o reemplaza el archivo' : 'Completa el formulario y sube el archivo para registrarlo'}
                  </p>
                </div>
                <button onClick={() => setShowModal(false)} disabled={isSubmitting}
                  className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-alt transition-colors disabled:opacity-40">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-5">

                {/* Tipo selector */}
                <div>
                  <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-2">
                    Tipo de archivo
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {TIPOS.map((t) => (
                      <button key={t} type="button"
                        onClick={() => { setForm((f) => ({ ...f, tipo: t })); setUploadedFile(null); setFormErrors({}) }}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all ${
                          form.tipo === t
                            ? 'bg-primary-800 text-white border-primary-800 shadow-sm'
                            : 'bg-white text-text-muted border-border hover:border-primary-400'
                        }`}>
                        {t === 'PDF'   && <FileText className="w-4 h-4" />}
                        {t === 'Word'  && <FileText className="w-4 h-4" />}
                        {t === 'Excel' && <FileSpreadsheet className="w-4 h-4" />}
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dropzone */}
                <FileDropzone tipo={form.tipo} onFile={setUploadedFile} currentFile={uploadedFile}
                  editing={!!editing} onError={setUploadError} />
                {uploadError && (
                  <div className="flex items-center gap-2 text-red-500 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />{uploadError}
                  </div>
                )}
                {formErrors.archivo && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />{formErrors.archivo}
                  </div>
                )}

                {/* Nombre */}
                <div>
                  <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    Nombre del documento <span className="text-orange-500">*</span>
                  </label>
                  <input type="text" value={form.nombre}
                    placeholder="Ej: Informe de biodiversidad cuenca del Baudó — 2024"
                    onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                    className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${formErrors.nombre ? 'border-red-400' : 'border-border focus:border-primary-800'}`} />
                  {formErrors.nombre && <p className="text-xs text-red-500 mt-1">{formErrors.nombre}</p>}
                </div>

                {/* Autor */}
                <div>
                  <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    Autor / Responsable <span className="text-text-muted font-normal normal-case tracking-normal">(opcional)</span>
                  </label>
                  <input type="text" value={form.autor}
                    placeholder="Nombre del autor o institución responsable"
                    onChange={(e) => setForm((f) => ({ ...f, autor: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition" />
                </div>

                {/* Categoría + Año */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Categoría temática</label>
                    <select value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition">
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Año de publicación</label>
                    <input type="number" min="1900" max="2100" value={form.anio}
                      placeholder={String(new Date().getFullYear())}
                      onChange={(e) => setForm((f) => ({ ...f, anio: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition" />
                  </div>
                </div>

                {/* Visibilidad */}
                <VisibilidadSelector value={form.visibilidad} onChange={(v) => setForm((f) => ({ ...f, visibilidad: v }))} />

                {/* Progreso */}
                <UploadProgress progress={uploadProgress} />

                {/* Error */}
                {submitError && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{submitError}
                  </div>
                )}

                {/* Botones */}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowModal(false)} disabled={isSubmitting}
                    className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 hover:text-primary-800 disabled:opacity-40 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSubmitting}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {isSubmitting ? 'Registrando…' : editing ? 'Guardar cambios' : 'Registrar documento'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmar eliminación */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div {...panelAnim} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-base font-bold text-text mb-2">Eliminar documento</h3>
              <p className="text-sm text-text-muted mb-6">
                ¿Seguro que deseas eliminar <strong className="text-text">"{deleteTarget.nombre}"</strong>?<br />
                <span className="text-xs">Esta acción no se puede deshacer.</span>
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 transition-colors">Cancelar</button>
                <button onClick={confirmDelete}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">Sí, eliminar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
