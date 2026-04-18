import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, X, Edit2, Trash2, Eye, EyeOff,
  Send, Globe, Clock, ImagePlus, Image,
  Users, ShieldCheck, AlertCircle, Loader2, Newspaper, CheckCircle,
} from 'lucide-react'
import { fadeUpSm, panelAnim } from '@/lib/animations'
import { useNoticiasList, useCreateNoticia, useUpdateNoticia, useDeleteNoticia } from '@/hooks/useNoticias'

const fadeUp = fadeUpSm

const MAX_THUMBNAIL_BYTES = 2 * 1024 * 1024

const CATEGORIES = ['Ambiente', 'Social', 'Tecnología', 'Capacitación', 'Investigación']
const TAGS = ['ACTUALIZACIÓN DE DATOS', 'EVENTO REGIONAL', 'TECNOLOGÍA', 'CAPACITACIÓN', 'INVESTIGACIÓN']

const VISIBILIDAD = [
  {
    value: 'publico',
    label: 'Público',
    desc: 'Visible para todos, incluso visitantes',
    Icon: Globe,
    border: 'border-emerald-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  {
    value: 'usuarios',
    label: 'Usuarios',
    desc: 'Solo usuarios registrados',
    Icon: Users,
    border: 'border-blue-500',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
  },
  {
    value: 'acreditados',
    label: 'Acreditados',
    desc: 'Investigadores y administradores',
    Icon: ShieldCheck,
    border: 'border-violet-500',
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    badge: 'bg-violet-100 text-violet-700',
  },
]

const EMPTY_FORM = {
  titulo: '', resumen: '', contenido: '', tag: TAGS[0],
  categoria: CATEGORIES[0], autor: '', publicado: true, visibilidad: 'publico',
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

// ── Visibility Selector ──────────────────────────────────────────────────────
function VisibilidadSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {VISIBILIDAD.map(({ value: v, label, desc, Icon, border, bg, text }) => {
        const active = value === v
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
              active ? `${border} ${bg}` : 'border-border bg-white hover:bg-bg-alt'
            }`}
          >
            <Icon className={`w-4 h-4 ${active ? text : 'text-text-muted'}`} />
            <span className={`text-[0.65rem] font-bold uppercase tracking-wide ${active ? text : 'text-text-muted'}`}>
              {label}
            </span>
            <span className="text-[0.6rem] text-text-muted leading-tight hidden sm:block">{desc}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── Upload Progress ───────────────────────────────────────────────────────────
function UploadProgress({ progress }) {
  if (progress === null) return null
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[0.65rem] font-semibold text-text-muted">
        <span>Subiendo imagen...</span>
        <span>{progress}%</span>
      </div>
      <div className="w-full h-1.5 bg-bg-alt rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary-700 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ ease: 'easeOut', duration: 0.2 }}
        />
      </div>
    </div>
  )
}

// ── Thumbnail Dropzone ────────────────────────────────────────────────────────
function ThumbnailDropzone({ file, previewUrl, onChange, onRemove, onError }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = useCallback((f) => {
    if (!f || !f.type.startsWith('image/')) return
    if (f.size > MAX_THUMBNAIL_BYTES) {
      onError?.('La imagen supera el límite de 2 MB')
      return
    }
    onError?.(null)
    onChange(f, URL.createObjectURL(f))
  }, [onChange, onError])

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [handleFile])

  if (previewUrl) {
    return (
      <div className="relative w-full h-36 rounded-xl overflow-hidden border border-border group">
        <img src={previewUrl} alt="Thumbnail" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="px-3 py-1.5 bg-white text-text text-xs font-semibold rounded-lg hover:bg-bg-alt transition-colors"
          >
            Cambiar
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
      </div>
    )
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`w-full h-36 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
        dragging ? 'border-primary-800 bg-primary-50' : 'border-border bg-bg-alt/40 hover:border-primary-400 hover:bg-primary-50/30'
      }`}
    >
      <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
        <ImagePlus className="w-5 h-5 text-primary-700" />
      </div>
      <p className="text-xs text-text-muted text-center">
        <span className="font-semibold text-primary-800">Seleccionar imagen</span> o arrastrar aquí<br />
        <span className="text-[0.65rem]">JPG, PNG, WEBP · máx. 2 MB</span>
      </p>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
    </div>
  )
}

export default function GestionNoticias() {
  const { data } = useNoticiasList({ limit: 200, admin: 'true' })
  const noticias = data?.data ?? []
  const createNoticia = useCreateNoticia()
  const updateNoticia = useUpdateNoticia()
  const deleteNoticia = useDeleteNoticia()

  const [search, setSearch] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [submitError, setSubmitError] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [preview, setPreview] = useState(null)
  const [thumbnail, setThumbnail] = useState(null)
  const [thumbUrl, setThumbUrl] = useState('')
  const [thumbError, setThumbError] = useState(null)
  const [toast, setToast] = useState(null)

  const isSubmitting = createNoticia.isPending || updateNoticia.isPending

  const filtered = noticias.filter((n) => {
    const q = search.toLowerCase()
    const matchQ = !q || n.titulo?.toLowerCase().includes(q) || n.autor?.toLowerCase().includes(q)
    const matchC = !filtroCategoria || n.categoria === filtroCategoria
    return matchQ && matchC
  })

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
    setSubmitError(null)
    setThumbnail(null)
    setThumbUrl('')
    setUploadProgress(null)
    setShowModal(true)
  }

  const openEdit = (n) => {
    setEditing(n)
    setForm({
      titulo:      n.titulo,
      resumen:     n.resumen,
      contenido:   n.contenido ?? '',
      tag:         n.tag ?? TAGS[0],
      categoria:   n.categoria ?? CATEGORIES[0],
      autor:       n.autor ?? '',
      publicado:   n.publicado,
      visibilidad: n.visibilidad ?? 'publico',
    })
    setFormErrors({})
    setSubmitError(null)
    setThumbnail(null)
    setThumbUrl(n.thumbUrl || '')
    setUploadProgress(null)
    setShowModal(true)
  }

  const validate = () => {
    const e = {}
    if (!form.titulo.trim()) e.titulo = 'Requerido'
    if (!form.resumen.trim()) e.resumen = 'Requerido'
    return e
  }

  const handleSave = async (ev) => {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setFormErrors(e); return }
    setSubmitError(null)

    const payload = new FormData()
    payload.append('titulo',      form.titulo)
    payload.append('resumen',     form.resumen)
    payload.append('contenido',   form.contenido || '')
    payload.append('categoria',   form.categoria)
    payload.append('publicado',   String(form.publicado))
    payload.append('visibilidad', form.visibilidad)
    if (form.autor.trim()) payload.append('autor', form.autor)
    if (thumbnail) payload.append('imagen', thumbnail)

    const onUploadProgress = thumbnail
      ? (e) => setUploadProgress(Math.round((e.loaded * 100) / (e.total ?? e.loaded)))
      : undefined

    try {
      if (editing) {
        await updateNoticia.mutateAsync({ id: editing.id, data: payload, onUploadProgress })
        setToast(`Noticia "${form.titulo}" actualizada correctamente`)
      } else {
        await createNoticia.mutateAsync({ formData: payload, onUploadProgress })
        setToast(`Noticia "${form.titulo}" registrada correctamente`)
      }
      setShowModal(false)
    } catch (err) {
      setSubmitError(err?.response?.data?.error ?? err?.message ?? 'Error al guardar')
      setUploadProgress(null)
    }
  }

  const togglePublished = async (id) => {
    const n = noticias.find((x) => x.id === id)
    if (!n) return
    try {
      const fd = new FormData()
      fd.append('publicado', String(!n.publicado))
      await updateNoticia.mutateAsync({ id, data: fd })
    } catch { /* silent — toggles are best-effort */ }
  }

  const confirmDelete = async () => {
    await deleteNoticia.mutateAsync(deleteTarget.id)
    setToast(`Noticia "${deleteTarget.titulo}" eliminada`)
    setDeleteTarget(null)
  }

  const visMap = Object.fromEntries(VISIBILIDAD.map((v) => [v.value, v]))

  return (
    <div className="space-y-6">

      <AnimatePresence>
        {toast && <SavedToast message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>

      {/* Header */}
      <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[0.7rem] font-bold uppercase tracking-widest text-primary-700">Administración</span>
          <h1 className="font-display text-2xl font-bold text-text mt-0.5">Gestión de Noticias</h1>
          <p className="text-sm text-text-muted mt-1">
            {noticias.length} noticias registradas · {noticias.filter((n) => n.publicado).length} publicadas
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-800 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Publicar nueva noticia
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div {...fadeUp(0.08)} className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar por título o autor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
          />
        </div>
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="px-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 transition"
        >
          <option value="">Todas las categorías</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </motion.div>

      {/* Estado vacío */}
      {noticias.length === 0 && (
        <motion.div {...fadeUp(0.14)} className="flex flex-col items-center justify-center py-20 text-center bg-white border border-dashed border-border rounded-2xl">
          <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
            <Newspaper className="w-8 h-8 text-primary-400" />
          </div>
          <h3 className="text-base font-bold text-text mb-1">Aún no hay noticias publicadas</h3>
          <p className="text-sm text-text-muted mb-6 max-w-xs">Publica la primera noticia para que aparezca en el portal público de VIGIIAP.</p>
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-800 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" /> Publicar la primera noticia
          </button>
        </motion.div>
      )}

      {/* Cards grid */}
      {noticias.length > 0 && (
      <motion.div {...fadeUp(0.14)} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-2 py-12 text-center text-sm text-text-muted">No hay noticias que coincidan con la búsqueda</div>
        )}
        {filtered.map((n) => {
          const vis = visMap[n.visibilidad] ?? visMap.publico
          return (
            <div key={n.id} className="bg-white border border-border rounded-xl overflow-hidden">
              {n.thumbUrl && (
                <div className="h-32 w-full overflow-hidden">
                  <img src={n.thumbUrl} alt={n.titulo} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[0.6rem] font-bold uppercase tracking-wider bg-primary-100 text-primary-800 px-2 py-0.5 rounded-full">{n.tag}</span>
                      <span className="text-[0.6rem] text-text-muted">{n.categoria}</span>
                      {n.thumbUrl && <Image className="w-3 h-3 text-text-muted" title="Tiene imagen" />}
                      <span className={`inline-flex items-center gap-1 text-[0.6rem] font-semibold px-2 py-0.5 rounded-full ${vis.badge}`}>
                        <vis.Icon className="w-2.5 h-2.5" />
                        {vis.label}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-text line-clamp-2">{n.titulo}</p>
                    <p className="text-xs text-text-muted mt-0.5">{n.autor || 'IIAP'} · {n.date || n.time}</p>
                  </div>
                  <button
                    onClick={() => togglePublished(n.id)}
                    className={`shrink-0 p-1.5 rounded-lg transition-colors ${n.publicado ? 'text-green-600 hover:bg-green-50' : 'text-text-muted hover:bg-bg-alt'}`}
                    title={n.publicado ? 'Publicada — clic para despublicar' : 'No publicada — clic para publicar'}
                  >
                    {n.publicado ? <Globe className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-text-muted line-clamp-2">{n.resumen}</p>
                <div className="flex items-center gap-2 pt-1">
                  <span className={`inline-flex items-center gap-1 text-[0.6rem] font-semibold px-2 py-0.5 rounded-full ${n.publicado ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {n.publicado ? <><Globe className="w-2.5 h-2.5" /> Publicada</> : <><Clock className="w-2.5 h-2.5" /> Borrador</>}
                  </span>
                  <div className="ml-auto flex items-center gap-1">
                    <button
                      onClick={() => setPreview(n)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-primary-800 hover:bg-primary-50 transition-colors"
                      title="Vista previa"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEdit(n)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-primary-800 hover:bg-primary-50 transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(n)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </motion.div>
      )}

      {/* Create/Edit modal */}
      <AnimatePresence>
        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => { if (!isSubmitting && e.target === e.currentTarget) setShowModal(false) }}
          >
            <motion.div {...panelAnim} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-5 border-b border-border sticky top-0 bg-white z-10">
                <h3 className="text-base font-bold text-text">{editing ? 'Editar noticia' : 'Publicar nueva noticia'}</h3>
                <button
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                  className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-alt transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                {submitError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {submitError}
                  </div>
                )}

                {/* Tag + Categoría */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Etiqueta</label>
                    <select value={form.tag} onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))} className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition">
                      {TAGS.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Categoría</label>
                    <select value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))} className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition">
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Título */}
                <div>
                  <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    Título <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.titulo}
                    onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                    className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${formErrors.titulo ? 'border-red-400' : 'border-border focus:border-primary-800'}`}
                  />
                  {formErrors.titulo && <p className="text-xs text-red-500 mt-1">{formErrors.titulo}</p>}
                </div>

                {/* Resumen */}
                <div>
                  <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    Resumen <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.resumen}
                    onChange={(e) => setForm((f) => ({ ...f, resumen: e.target.value }))}
                    className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${formErrors.resumen ? 'border-red-400' : 'border-border focus:border-primary-800'}`}
                  />
                  {formErrors.resumen && <p className="text-xs text-red-500 mt-1">{formErrors.resumen}</p>}
                </div>

                {/* Autor */}
                <div>
                  <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    Autor <span className="text-text-muted font-normal normal-case">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.autor}
                    placeholder="IIAP"
                    onChange={(e) => setForm((f) => ({ ...f, autor: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition"
                  />
                </div>

                {/* Imagen de portada */}
                <div>
                  <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    Imagen de Portada <span className="text-text-muted font-normal normal-case">(opcional)</span>
                  </label>
                  <ThumbnailDropzone
                    file={thumbnail}
                    previewUrl={thumbUrl}
                    onChange={(f, url) => { setThumbnail(f); setThumbUrl(url) }}
                    onRemove={() => { setThumbnail(null); setThumbUrl(''); setThumbError(null) }}
                    onError={setThumbError}
                  />
                  {thumbError && <p className="text-xs text-red-500 mt-1">{thumbError}</p>}
                </div>

                <UploadProgress progress={uploadProgress} />

                {/* Contenido */}
                <div>
                  <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Contenido completo</label>
                  <textarea
                    rows={6}
                    value={form.contenido}
                    onChange={(e) => setForm((f) => ({ ...f, contenido: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition resize-none"
                  />
                </div>

                {/* Visibilidad */}
                <div>
                  <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-2">Nivel de acceso</label>
                  <VisibilidadSelector
                    value={form.visibilidad}
                    onChange={(v) => setForm((f) => ({ ...f, visibilidad: v }))}
                  />
                </div>

                {/* Publicar */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="publicado"
                    checked={form.publicado}
                    onChange={(e) => setForm((f) => ({ ...f, publicado: e.target.checked }))}
                    className="w-4 h-4 accent-primary-800"
                  />
                  <label htmlFor="publicado" className="text-sm font-medium text-text">Publicar inmediatamente</label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 hover:text-primary-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {isSubmitting ? 'Publicando...' : editing ? 'Guardar cambios' : 'Publicar noticia'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Preview modal */}
      <AnimatePresence>
        {preview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setPreview(null) }}>
            <motion.div {...panelAnim} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-white">
                <span className="text-sm font-bold text-text-muted">Vista Previa</span>
                <button onClick={() => setPreview(null)} className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-alt transition-colors"><X className="w-5 h-5" /></button>
              </div>
              {preview.thumbUrl && (
                <div className="h-48 w-full overflow-hidden">
                  <img src={preview.thumbUrl} alt={preview.titulo} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-6">
                <span className="text-[0.6rem] font-bold uppercase tracking-widest bg-primary-100 text-primary-800 px-2 py-0.5 rounded-full">{preview.tag}</span>
                <h2 className="font-display text-xl font-bold text-text mt-3 mb-2">{preview.titulo}</h2>
                <p className="text-xs text-text-muted mb-4">{preview.autor || 'IIAP'} · {preview.date}</p>
                <p className="text-sm text-text-muted leading-relaxed mb-4">{preview.resumen}</p>
                <hr className="border-border mb-4" />
                <p className="text-sm text-text leading-relaxed whitespace-pre-line">{preview.contenido}</p>
              </div>
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
              <h3 className="text-base font-bold text-text mb-2">Eliminar Noticia</h3>
              <p className="text-sm text-text-muted mb-6">
                ¿Seguro que deseas eliminar <strong className="text-text">"{deleteTarget.titulo?.slice(0, 40)}..."</strong>?
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
