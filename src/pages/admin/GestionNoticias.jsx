import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, X, Edit2, Trash2, Eye, EyeOff,
  Send, Globe, Clock, ImagePlus, Image,
} from 'lucide-react'
import { fadeUpSm, panelAnim } from '@/lib/animations'
import { useNoticiasList, useCreateNoticia, useUpdateNoticia, useDeleteNoticia } from '@/hooks/useNoticias'

const fadeUp = fadeUpSm

// Límite de thumbnail (Fase 2: validar también en backend)
const MAX_THUMBNAIL_BYTES = 2 * 1024 * 1024 // 2 MB

const CATEGORIES = ['Ambiente', 'Social', 'Tecnología', 'Capacitación', 'Investigación']
const TAGS = ['ACTUALIZACIÓN DE DATOS', 'EVENTO REGIONAL', 'TECNOLOGÍA', 'CAPACITACIÓN', 'INVESTIGACIÓN']
const EMPTY_FORM = { title: '', excerpt: '', content: '', tag: TAGS[0], category: CATEGORIES[0], author: '', date: '', published: true }

// ── Thumbnail Dropzone ──
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
        <span className="text-[0.65rem]">JPG, PNG, WEBP · máx. 5 MB</span>
      </p>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
    </div>
  )
}

export default function GestionNoticias() {
  const { data } = useNoticiasList({ limit: 200 })
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
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [preview, setPreview] = useState(null)
  const [thumbnail, setThumbnail] = useState(null)   // File object
  const [thumbUrl, setThumbUrl] = useState('')        // object URL for preview
  const [thumbError, setThumbError] = useState(null)

  const filtered = noticias.filter((n) => {
    const q = search.toLowerCase()
    const matchQ = !q || n.title.toLowerCase().includes(q) || n.author.toLowerCase().includes(q)
    const matchC = !filtroCategoria || n.category === filtroCategoria
    return matchQ && matchC
  })

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
    setThumbnail(null)
    setThumbUrl('')
    setShowModal(true)
  }

  const openEdit = (n) => {
    setEditing(n)
    setForm({ title: n.title, excerpt: n.excerpt, content: n.content, tag: n.tag, category: n.category, author: n.author, date: n.date, published: n.published })
    setFormErrors({})
    setThumbnail(null)
    setThumbUrl(n.thumbUrl || '')
    setShowModal(true)
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Requerido'
    if (!form.excerpt.trim()) e.excerpt = 'Requerido'
    if (!form.author.trim()) e.author = 'Requerido'
    return e
  }

  const handleSave = async (ev) => {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setFormErrors(e); return }

    const payload = new FormData()
    payload.append('titulo',    form.title)
    payload.append('resumen',   form.excerpt)
    payload.append('contenido', form.content || '')
    payload.append('categoria', form.category)
    payload.append('autor',     form.author)
    payload.append('publicado', String(form.published))
    if (thumbnail) payload.append('imagen', thumbnail)

    if (editing) {
      await updateNoticia.mutateAsync({ id: editing.id, data: payload })
    } else {
      await createNoticia.mutateAsync(payload)
    }
    setShowModal(false)
  }

  const togglePublished = async (id) => {
    const n = noticias.find((x) => x.id === id)
    if (!n) return
    await updateNoticia.mutateAsync({ id, data: { publicado: !n.published } })
  }

  const confirmDelete = async () => {
    await deleteNoticia.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[0.7rem] font-bold uppercase tracking-widest text-primary-700">Administración</span>
          <h1 className="font-display text-2xl font-bold text-text mt-0.5">Gestión de Noticias</h1>
          <p className="text-sm text-text-muted mt-1">{noticias.length} noticias · {noticias.filter((n) => n.published).length} publicadas</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-800 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nueva Noticia
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

      {/* Cards grid */}
      <motion.div {...fadeUp(0.14)} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-2 py-12 text-center text-sm text-text-muted">Sin resultados</div>
        )}
        {filtered.map((n) => (
          <div key={n.id} className="bg-white border border-border rounded-xl overflow-hidden">
            {n.thumbUrl && (
              <div className="h-32 w-full overflow-hidden">
                <img src={n.thumbUrl} alt={n.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className={`p-5 space-y-3 ${!n.thumbUrl ? '' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[0.6rem] font-bold uppercase tracking-wider bg-primary-100 text-primary-800 px-2 py-0.5 rounded-full">{n.tag}</span>
                  <span className="text-[0.6rem] text-text-muted">{n.category}</span>
                  {n.thumbUrl && <Image className="w-3 h-3 text-text-muted" title="Tiene imagen de portada" />}
                </div>
                <p className="text-sm font-bold text-text line-clamp-2">{n.title}</p>
                <p className="text-xs text-text-muted mt-0.5">{n.author} · {n.date || n.time}</p>
              </div>
              <button
                onClick={() => togglePublished(n.id)}
                className={`shrink-0 p-1.5 rounded-lg transition-colors ${n.published ? 'text-green-600 hover:bg-green-50' : 'text-text-muted hover:bg-bg-alt'}`}
                title={n.published ? 'Publicada — clic para despublicar' : 'No publicada — clic para publicar'}
              >
                {n.published ? <Globe className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-text-muted line-clamp-2">{n.excerpt}</p>
            <div className="flex items-center gap-2 pt-1">
              <span className={`inline-flex items-center gap-1 text-[0.6rem] font-semibold px-2 py-0.5 rounded-full ${n.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {n.published ? <><Globe className="w-2.5 h-2.5" /> Publicada</> : <><Clock className="w-2.5 h-2.5" /> Borrador</>}
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
            </div>{/* end p-5 */}
          </div>
        ))}
      </motion.div>

      {/* Create/Edit modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>
            <motion.div {...panelAnim} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-5 border-b border-border sticky top-0 bg-white z-10">
                <h3 className="text-base font-bold text-text">{editing ? 'Editar Noticia' : 'Nueva Noticia'}</h3>
                <button onClick={() => setShowModal(false)} className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-alt transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Etiqueta</label>
                    <select value={form.tag} onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))} className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition">
                      {TAGS.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Categoría</label>
                    <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition">
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {[
                  { key: 'title', label: 'Título', required: true },
                  { key: 'excerpt', label: 'Resumen', required: true },
                  { key: 'author', label: 'Autor', required: true },
                  { key: 'date', label: 'Fecha de publicación', required: false },
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
                  {thumbError && (
                    <p className="text-xs text-red-500 mt-1">{thumbError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Contenido completo</label>
                  <textarea
                    rows={6}
                    value={form.content}
                    onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition resize-none"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="published"
                    checked={form.published}
                    onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                    className="w-4 h-4 accent-primary-800"
                  />
                  <label htmlFor="published" className="text-sm font-medium text-text">Publicar inmediatamente</label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 hover:text-primary-800 transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">
                    <Send className="w-4 h-4" />
                    {editing ? 'Guardar Cambios' : 'Crear Noticia'}
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
                  <img src={preview.thumbUrl} alt={preview.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-6">
                <span className="text-[0.6rem] font-bold uppercase tracking-widest bg-primary-100 text-primary-800 px-2 py-0.5 rounded-full">{preview.tag}</span>
                <h2 className="font-display text-xl font-bold text-text mt-3 mb-2">{preview.title}</h2>
                <p className="text-xs text-text-muted mb-4">{preview.author} · {preview.date}</p>
                <p className="text-sm text-text-muted leading-relaxed mb-4">{preview.excerpt}</p>
                <hr className="border-border mb-4" />
                <p className="text-sm text-text leading-relaxed whitespace-pre-line">{preview.content}</p>
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
                ¿Seguro que deseas eliminar <strong className="text-text">"{deleteTarget.title.slice(0, 40)}..."</strong>?
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
