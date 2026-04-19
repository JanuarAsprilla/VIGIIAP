import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, X, Edit2, Trash2, Eye, EyeOff,
  Layers, Send, Upload, CheckCircle, AlertCircle,
  FileText, Image, Link as LinkIcon, Loader2, MapPin,
  ExternalLink, Globe, Users, ShieldCheck,
} from 'lucide-react'
import { fadeUpSm, panelAnim } from '@/lib/animations'
import { useMapasList, useCreateMapa, useUpdateMapa, useToggleMapaActivo, useDeleteMapa } from '@/hooks/useMapas'

const fadeUp = fadeUpSm

const TEMATICAS = ['Hidrología', 'Cartografía Base', 'Biodiversidad', 'Zonificación', 'Infraestructura', 'Riesgo']
const ESCALES   = ['1:10.000', '1:25.000', '1:50.000', '1:100.000', '1:250.000', '1:500.000']
const FORMATOS  = ['PDF', 'IMG', 'Geovisor']

const ACCEPT = {
  PDF:      '.pdf,application/pdf',
  IMG:      '.jpg,.jpeg,.png,.webp,image/*',
  Geovisor: null,
}
const MAX_SIZE_BYTES = {
  PDF: 20 * 1024 * 1024,
  IMG: 25 * 1024 * 1024,
}

const VISIBILIDAD = [
  { value: 'publico',     label: 'Público',      desc: 'Visible para todos',             Icon: Globe,       border: 'border-emerald-500', bg: 'bg-emerald-50',  text: 'text-emerald-700', pill: 'bg-emerald-100 text-emerald-700' },
  { value: 'usuarios',    label: 'Usuarios',     desc: 'Solo usuarios registrados',      Icon: Users,       border: 'border-blue-500',   bg: 'bg-blue-50',     text: 'text-blue-700',    pill: 'bg-blue-100 text-blue-700' },
  { value: 'acreditados', label: 'Acreditados',  desc: 'Investigadores y admins',        Icon: ShieldCheck, border: 'border-violet-500', bg: 'bg-violet-50',   text: 'text-violet-700',  pill: 'bg-violet-100 text-violet-700' },
]
const visMap = Object.fromEntries(VISIBILIDAD.map((v) => [v.value, v]))

const EMPTY_FORM = {
  nombre: '', tematica: TEMATICAS[0], escala: ESCALES[2],
  descripcion: '', anio: String(new Date().getFullYear()),
  visible: true, formato: 'PDF', url: '', visibilidad: 'publico',
}

const TEMATICA_COLORS = {
  'Hidrología':       'bg-blue-100 text-blue-700',
  'Cartografía Base': 'bg-gray-100 text-gray-600',
  'Biodiversidad':    'bg-green-100 text-green-700',
  'Zonificación':     'bg-purple-100 text-purple-700',
  'Infraestructura':  'bg-orange-100 text-orange-700',
  'Riesgo':           'bg-red-100 text-red-600',
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

// ── Dropzone ──────────────────────────────────────────────────────────────────
function VisibilidadSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {VISIBILIDAD.map(({ value: v, label, desc, Icon, border, bg, text }) => {
        const active = value === v
        return (
          <button key={v} type="button" onClick={() => onChange(v)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${active ? `${border} ${bg}` : 'border-border bg-white hover:bg-bg-alt'}`}>
            <Icon className={`w-4 h-4 ${active ? text : 'text-text-muted'}`} />
            <span className={`text-[0.65rem] font-bold uppercase tracking-wide ${active ? text : 'text-text-muted'}`}>{label}</span>
            <span className="text-[0.6rem] text-text-muted leading-tight hidden sm:block">{desc}</span>
          </button>
        )
      })}
    </div>
  )
}

function FileDropzone({ formato, onFile, onFormatDetect, currentFile, editing, onError }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const accept = ACCEPT[formato]

  const validateAndAccept = useCallback((file) => {
    if (!file) return
    const detectedFmt = file.type.startsWith('image/') ? 'IMG' : 'PDF'
    if (onFormatDetect && detectedFmt !== formato) onFormatDetect(detectedFmt)
    const maxBytes = MAX_SIZE_BYTES[detectedFmt]
    if (maxBytes && file.size > maxBytes) {
      onError?.(`El archivo supera el límite de ${detectedFmt === 'PDF' ? '20 MB' : '25 MB'}`)
      return
    }
    onError?.(null)
    onFile(file)
  }, [formato, onFile, onFormatDetect, onError])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    validateAndAccept(e.dataTransfer.files[0])
  }, [validateAndAccept])

  if (!accept) return null

  return (
    <div>
      <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
        Archivo del mapa <span className="text-orange-500">*</span>
        {editing && <span className="ml-2 font-normal normal-case tracking-normal text-text-muted">— sube uno nuevo para reemplazar el actual</span>}
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
            dragging
              ? 'border-primary-600 bg-primary-50 scale-[1.01]'
              : 'border-border hover:border-primary-400 hover:bg-bg-alt/60'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${dragging ? 'bg-primary-100' : 'bg-bg-alt'}`}>
            <Upload className={`w-6 h-6 transition-colors ${dragging ? 'text-primary-700' : 'text-text-muted'}`} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-text">
              {dragging ? 'Suelta el archivo aquí' : 'Haz clic o arrastra el archivo aquí'}
            </p>
            <p className="text-xs text-text-muted mt-1">
              {formato === 'PDF' ? 'Archivos PDF — máx. 20 MB' : 'Imágenes JPG, PNG o WebP — máx. 25 MB'}
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
  const { data, isLoading } = useMapasList({ limit: 200, admin: 'true' })
  const mapas = data?.data ?? []
  const createMapa = useCreateMapa()
  const updateMapa = useUpdateMapa()
  const toggleActivo = useToggleMapaActivo()
  const deleteMapa = useDeleteMapa()

  const [search, setSearch] = useState('')
  const [filtroTematica, setFiltroTematica] = useState('')
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

  const isSubmitting = createMapa.isPending || updateMapa.isPending

  const filtered = mapas.filter((m) => {
    const q = search.toLowerCase()
    const matchQ = !q || m.nombre?.toLowerCase().includes(q) || (m.autor ?? '').toLowerCase().includes(q)
    const matchT = !filtroTematica || m.tematica === filtroTematica
    return matchQ && matchT
  })

  const openCreate = () => {
    setEditing(null); setForm(EMPTY_FORM); setFormErrors({})
    setUploadedFile(null); setUploadError(null); setSubmitError(null)
    setUploadProgress(null); setShowModal(true)
  }

  const openEdit = (m) => {
    setEditing(m)
    setForm({
      nombre:      m.nombre,
      tematica:    m.tematica,
      escala:      m.escala,
      descripcion: m.descripcion || '',
      anio:        String(m.anio || new Date().getFullYear()),
      visible:     m.visible,
      formato:     m.formato,
      url:         m.url || '',
      visibilidad: m.visibilidad ?? 'publico',
    })
    setFormErrors({}); setUploadedFile(null); setUploadError(null)
    setSubmitError(null); setUploadProgress(null); setShowModal(true)
  }

  const validate = () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'El nombre del mapa es obligatorio'
    if (form.formato !== 'Geovisor' && !editing && !uploadedFile)
      e.archivo = 'Debes seleccionar el archivo del mapa para continuar'
    if (form.formato === 'Geovisor' && !form.url.trim())
      e.url = 'Debes ingresar la URL del Geovisor'
    return e
  }

  const handleSave = async (ev) => {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setFormErrors(e); return }
    setSubmitError(null); setUploadProgress(null)

    const payload = new FormData()
    payload.append('titulo',      form.nombre)
    payload.append('categoria',   form.tematica)
    payload.append('anio',        form.anio || String(new Date().getFullYear()))
    payload.append('visibilidad', form.visibilidad)
    if (form.descripcion.trim()) payload.append('descripcion', form.descripcion)

    if (uploadedFile) {
      payload.append(form.formato === 'PDF' ? 'archivo_pdf' : 'archivo_img', uploadedFile)
    } else if (editing && form.formato !== 'Geovisor') {
      if (form.formato === 'PDF' && editing.archivo_pdf_url)
        payload.append('archivo_pdf_url', editing.archivo_pdf_url)
      if (form.formato === 'IMG' && editing.archivo_img_url)
        payload.append('archivo_img_url', editing.archivo_img_url)
    }

    if (form.formato === 'Geovisor') {
      payload.append('geovisor_url', form.url)
      payload.append('archivo_pdf_url', '')
      payload.append('archivo_img_url', '')
    } else if (editing && editing.geovisor_url) {
      payload.append('geovisor_url', '')
    }

    const onUploadProgress = uploadedFile
      ? (e) => setUploadProgress(Math.round((e.loaded * 100) / (e.total ?? e.loaded)))
      : undefined

    try {
      if (editing) {
        await updateMapa.mutateAsync({ id: editing.id, formData: payload, onUploadProgress })
        setToast(`Mapa "${form.nombre}" actualizado correctamente`)
      } else {
        await createMapa.mutateAsync({ formData: payload, onUploadProgress })
        setToast(`Mapa "${form.nombre}" registrado correctamente`)
      }
      setShowModal(false)
    } catch (err) {
      setSubmitError(err?.response?.data?.error ?? err?.message ?? 'No se pudo guardar. Verifica la conexión e intenta de nuevo.')
      setUploadProgress(null)
    }
  }

  const toggleVisible = async (id) => {
    const m = mapas.find((x) => x.id === id)
    if (!m) return
    try { await toggleActivo.mutateAsync({ id, activo: !m.visible }) } catch { /* silencioso */ }
  }

  const confirmDelete = async () => {
    await deleteMapa.mutateAsync(deleteTarget.id)
    setToast(`Mapa "${deleteTarget.nombre}" eliminado`)
    setDeleteTarget(null)
  }

  const mapasVisibles = mapas.filter((m) => m.visible).length

  return (
    <div className="space-y-6">

      <AnimatePresence>
        {toast && <SavedToast message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>

      {/* Header */}
      <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[0.7rem] font-bold uppercase tracking-widest text-primary-700">Administración</span>
          <h1 className="font-display text-2xl font-bold text-text mt-0.5">Gestión de Mapas</h1>
          <p className="text-sm text-text-muted mt-1">
            {isLoading ? 'Cargando…' : `${mapas.length} mapas registrados · ${mapasVisibles} visibles al público`}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-800 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Ingresar nuevo mapa
        </button>
      </motion.div>

      {/* Thematic pills */}
      <motion.div {...fadeUp(0.06)} className="flex flex-wrap gap-2">
        {TEMATICAS.map((t) => (
          <button key={t}
            onClick={() => setFiltroTematica(filtroTematica === t ? '' : t)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              filtroTematica === t
                ? 'bg-primary-800 text-white border-primary-800'
                : 'bg-white text-text-muted border-border hover:border-primary-800 hover:text-primary-800'
            }`}
          >
            {t}
          </button>
        ))}
      </motion.div>

      {/* Search */}
      <motion.div {...fadeUp(0.1)} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input type="text" placeholder="Buscar mapa por nombre o autor…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
        />
      </motion.div>

      {/* Empty state */}
      {!isLoading && mapas.length === 0 && (
        <motion.div {...fadeUp(0.14)} className="flex flex-col items-center justify-center py-20 text-center bg-white border border-dashed border-border rounded-2xl">
          <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
            <MapPin className="w-8 h-8 text-primary-400" />
          </div>
          <h3 className="text-base font-bold text-text mb-1">Aún no hay mapas registrados</h3>
          <p className="text-sm text-text-muted mb-6 max-w-xs">Ingresa el primer mapa para que aparezca en el portal público de VIGIIAP.</p>
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-800 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" /> Ingresar el primer mapa
          </button>
        </motion.div>
      )}

      {/* Cards */}
      {mapas.length > 0 && (
        <motion.div {...fadeUp(0.16)} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.length === 0 && (
            <div className="col-span-2 py-12 text-center text-sm text-text-muted">
              No hay mapas que coincidan con la búsqueda
            </div>
          )}
          {filtered.map((m) => (
            <div key={m.id}
              className={`bg-white border rounded-xl p-5 transition-all ${m.visible ? 'border-border' : 'border-border opacity-55'}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${TEMATICA_COLORS[m.tematica] ?? 'bg-gray-100 text-gray-600'}`}>{m.tematica}</span>
                    <span className="text-[0.6rem] text-text-muted">{m.escala}</span>
                    <span className={`text-[0.6rem] font-semibold px-1.5 py-0.5 rounded border ${
                      m.formato === 'PDF' ? 'border-red-200 text-red-500' :
                      m.formato === 'IMG' ? 'border-blue-200 text-blue-500' :
                      'border-primary-200 text-primary-700'
                    }`}>{m.formato}</span>
                    {!m.visible && (
                      <span className="text-[0.6rem] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">Oculto</span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-text">{m.nombre}</p>
                  <p className="text-xs text-text-muted mt-0.5">{m.autor || 'IIAP'} · {m.fecha}</p>
                  {m.descripcion && <p className="text-xs text-text-muted mt-1 line-clamp-1">{m.descripcion}</p>}
                </div>
                <button
                  onClick={() => toggleVisible(m.id)}
                  className={`shrink-0 p-1.5 rounded-lg transition-colors ${m.visible ? 'text-primary-700 hover:bg-primary-50' : 'text-text-muted hover:bg-bg-alt'}`}
                  title={m.visible ? 'Visible — clic para ocultar' : 'Oculto — clic para publicar'}
                >
                  {m.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-border/50">
                <div className="flex items-center gap-2">
                  {(() => {
                    const vis = visMap[m.visibilidad] ?? visMap.publico
                    return (
                      <span className={`text-[0.6rem] font-semibold px-1.5 py-0.5 rounded ${vis.pill}`}>
                        {vis.label}
                      </span>
                    )
                  })()}
                </div>
                <div className="flex items-center gap-1">
                  {(m.archivo_pdf_url || m.archivo_img_url || m.geovisor_url) && (
                    <button
                      onClick={() => window.open(m.archivo_img_url || m.archivo_pdf_url || m.geovisor_url, '_blank', 'noopener')}
                      className="p-1.5 rounded-lg text-text-muted hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Ver archivo">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => openEdit(m)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-primary-800 hover:bg-primary-50 transition-colors"
                    title="Editar mapa">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteTarget(m)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Eliminar mapa">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Modal ingresar / editar mapa */}
      <AnimatePresence>
        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => { if (!isSubmitting && e.target === e.currentTarget) setShowModal(false) }}
          >
            <motion.div {...panelAnim} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

              {/* Header modal */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-border sticky top-0 bg-white z-10">
                <div>
                  <h3 className="text-base font-bold text-text">
                    {editing ? 'Editar mapa' : 'Ingresar nuevo mapa'}
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

                {/* Formato */}
                <div>
                  <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-2">
                    Formato de entrega
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {FORMATOS.map((f) => (
                      <button key={f} type="button"
                        onClick={() => { setForm((fm) => ({ ...fm, formato: f, url: '' })); setUploadedFile(null); setFormErrors({}) }}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all ${
                          form.formato === f
                            ? 'bg-primary-800 text-white border-primary-800 shadow-sm'
                            : 'bg-white text-text-muted border-border hover:border-primary-400'
                        }`}
                      >
                        {f === 'PDF' && <FileText className="w-4 h-4" />}
                        {f === 'IMG' && <Image className="w-4 h-4" />}
                        {f === 'Geovisor' && <Layers className="w-4 h-4" />}
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dropzone */}
                <FileDropzone
                  formato={form.formato} onFile={setUploadedFile}
                  onFormatDetect={(fmt) => setForm((fm) => ({ ...fm, formato: fmt }))}
                  currentFile={uploadedFile} editing={!!editing} onError={setUploadError}
                />
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

                {/* URL Geovisor */}
                {form.formato === 'Geovisor' && (
                  <div>
                    <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5 flex items-center gap-1">
                      <LinkIcon className="w-3 h-3" /> URL del Geovisor <span className="text-orange-500">*</span>
                    </label>
                    <input type="url" value={form.url}
                      onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                      placeholder="https://geovisor.iiap.gov.co/mapa/... o /geovisor"
                      className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${formErrors.url ? 'border-red-400' : 'border-border focus:border-primary-800'}`}
                    />
                    {formErrors.url && <p className="text-xs text-red-500 mt-1">{formErrors.url}</p>}
                  </div>
                )}

                {/* Nombre del mapa */}
                <div>
                  <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    Nombre del mapa <span className="text-orange-500">*</span>
                  </label>
                  <input type="text" value={form.nombre}
                    placeholder="Ej: Mapa de cuencas hidrográficas del Chocó — 2024"
                    onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                    className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${formErrors.nombre ? 'border-red-400' : 'border-border focus:border-primary-800'}`}
                  />
                  {formErrors.nombre && <p className="text-xs text-red-500 mt-1">{formErrors.nombre}</p>}
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    Descripción <span className="text-text-muted font-normal normal-case tracking-normal">(opcional)</span>
                  </label>
                  <textarea rows={2} value={form.descripcion}
                    placeholder="Breve descripción del contenido y alcance del mapa…"
                    onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition resize-none"
                  />
                </div>

                {/* Año · Temática · Escala */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Año</label>
                    <input type="number" min="1900" max="2100" value={form.anio}
                      onChange={(e) => setForm((f) => ({ ...f, anio: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Temática</label>
                    <select value={form.tematica} onChange={(e) => setForm((f) => ({ ...f, tematica: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition">
                      {TEMATICAS.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Escala</label>
                    <select value={form.escala} onChange={(e) => setForm((f) => ({ ...f, escala: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition">
                      {ESCALES.map((e) => <option key={e}>{e}</option>)}
                    </select>
                  </div>
                </div>

                {/* Nivel de acceso */}
                <div>
                  <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-2">Nivel de acceso</label>
                  <VisibilidadSelector value={form.visibilidad} onChange={(v) => setForm((f) => ({ ...f, visibilidad: v }))} />
                </div>

                {/* Visible al público */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.visible}
                    onChange={(e) => setForm((f) => ({ ...f, visible: e.target.checked }))}
                    className="w-4 h-4 accent-primary-800" />
                  <span className="text-sm font-medium text-text">Publicar en el portal público</span>
                </label>

                {/* Progreso de subida */}
                {uploadProgress !== null && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[0.65rem] font-semibold text-primary-800">
                      <span>Subiendo archivo a la nube…</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-bg-alt rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary-700 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ ease: 'easeOut', duration: 0.2 }}
                      />
                    </div>
                    <p className="text-[0.6rem] text-text-muted">No cierres esta ventana hasta que termine la subida</p>
                  </div>
                )}

                {/* Error */}
                {submitError && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    {submitError}
                  </div>
                )}

                {/* Botones */}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowModal(false)} disabled={isSubmitting}
                    className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 hover:text-primary-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSubmitting}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {isSubmitting ? 'Registrando…' : editing ? 'Guardar cambios' : 'Registrar mapa'}
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
              <h3 className="text-base font-bold text-text mb-2">Eliminar mapa</h3>
              <p className="text-sm text-text-muted mb-6">
                ¿Seguro que deseas eliminar <strong className="text-text">"{deleteTarget.nombre}"</strong>?<br />
                <span className="text-xs">Esta acción no se puede deshacer.</span>
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 transition-colors">
                  Cancelar
                </button>
                <button onClick={confirmDelete}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">
                  Sí, eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
