import { useState, useRef, useCallback, useEffect, type FormEvent } from 'react'
import { getApiErrorMessage } from '@/lib/apiError'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, Upload, X, CheckCircle,
  AlertCircle, Loader2, Tag, ImageOff, FolderOpen,
} from 'lucide-react'
import { fadeUpSm, panelAnim, staggerContainer } from '@/lib/animations'
import Card3D from '@/components/ui/Card3D'
import {
  useCategoriasList,
  useCreateCategoria,
  useUploadCategoriaThumbnail,
  useDeleteCategoria,
} from '@/hooks/useCategorias'
import { useDocumentosList } from '@/hooks/useDocumentos'

const fadeUp = fadeUpSm

// ── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useState(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t) })
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-3 px-5 py-3 bg-green-700 text-white rounded-2xl shadow-xl"
    >
      <CheckCircle className="w-5 h-5 shrink-0" />
      <span className="text-sm font-semibold">{message}</span>
    </motion.div>
  )
}

// ── ImageDropzone ─────────────────────────────────────────────────────────────
function ImageDropzone({ onFile, currentFile, existingUrl, compact = false }: { onFile: (f: File | null) => void; currentFile: File | null; existingUrl?: string | null; compact?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deriva la preview URL del File recibido
    if (!currentFile) { setObjectUrl(null); return }
    const url = URL.createObjectURL(currentFile)
    setObjectUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [currentFile])

  const accept = useCallback((file: File | null | undefined) => {
    if (!file || !file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) return
    onFile(file)
  }, [onFile])

  const preview = objectUrl ?? existingUrl ?? null

  if (preview) {
    return (
      <div className="relative group rounded-xl overflow-hidden border border-border aspect-video w-full">
        <img src={preview} alt="Portada" className="w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button type="button" onClick={() => inputRef.current?.click()}
            className="px-3 py-1.5 bg-[var(--card-bg)] text-text text-xs font-semibold rounded-lg hover:bg-bg-alt transition-colors">
            Cambiar imagen
          </button>
          {currentFile && (
            <button type="button" onClick={() => onFile(null)}
              className="p-1.5 bg-[var(--card-bg)] text-red-500 rounded-lg hover:bg-red/10 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*"
          onChange={(e) => { accept(e.target.files?.[0]); e.target.value = '' }}
          className="sr-only" />
      </div>
    )
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); accept(e.dataTransfer.files[0]) }}
      onClick={() => inputRef.current?.click()}
      className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl cursor-pointer transition-all
        ${compact ? 'py-5' : 'py-10'}
        ${dragging ? 'border-primary-600 bg-primary-500/10' : 'border-border hover:border-primary-400 hover:bg-bg-alt/60'}`}
    >
      <Upload className={`w-6 h-6 ${dragging ? 'text-primary-600' : 'text-text-muted'}`} />
      <p className="text-xs text-text-muted text-center px-3">
        {dragging ? 'Suelta aquí' : 'Haz clic o arrastra una imagen'}
      </p>
      <p className="text-[0.6rem] text-text-muted">JPG, PNG, WebP · máx. 5 MB</p>
      <input ref={inputRef} type="file" accept="image/*"
        onChange={(e) => { accept(e.target.files?.[0]); e.target.value = '' }}
        className="sr-only" />
    </div>
  )
}

// ── Tarjeta de categoría ──────────────────────────────────────────────────────
function CategoriaCard({ cat, docCount, onDelete, onThumbnailSaved, uploadThumbnail }: { cat: { nombre: string; descripcion?: string | null; thumbnail_url?: string | null; activo?: boolean }; docCount: number; onDelete: (target: { nombre: string }) => void; onThumbnailSaved: (nombre: string) => void; uploadThumbnail: ReturnType<typeof import('@/hooks/useCategorias').useUploadCategoriaThumbnail> }) {
  const [file, setFile]         = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState(0)
  const [error, setError]         = useState<string | null>(null)
  const [fileObjectUrl, setFileObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deriva la preview URL del File recibido
    if (!file) { setFileObjectUrl(null); return }
    const url = URL.createObjectURL(file)
    setFileObjectUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const handleUpload = async () => {
    if (!file) return
    setUploading(true); setError(null)
    try {
      await uploadThumbnail.mutateAsync({
        nombre: cat.nombre,
        file,
        onUploadProgress: (ev) =>
          setProgress(ev.total ? Math.round((ev.loaded / ev.total) * 100) : 50),
      })
      setFile(null)
      onThumbnailSaved(cat.nombre)
    } catch {
      setError('No se pudo subir la imagen. Intenta de nuevo.')
    } finally {
      setUploading(false); setProgress(0)
    }
  }

  const currentPreview = fileObjectUrl ?? cat.thumbnail_url ?? null

  return (
    <Card3D
      layout
      initial={{ opacity: 0, y: 16, rotateX: 5, scale: 0.97 }}
      animate={{ opacity: 1, y: 0,  rotateX: 0, scale: 1    }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }}
      glow="rgba(26,86,50,0.16)"
      intensity={5}
      className="bg-[var(--card-bg)] border border-border/70 rounded-2xl overflow-hidden flex flex-col"
      whileHover={{ y: -4 }}
    >
      {/* Imagen */}
      <div className="relative aspect-video bg-bg-alt">
        {currentPreview ? (
          <img src={currentPreview} alt={cat.nombre} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-text-muted/40">
            <ImageOff className="w-8 h-8" />
            <span className="text-[0.65rem]">Sin imagen</span>
          </div>
        )}

        {/* Badge doc count */}
        <span className="absolute top-2 right-2 bg-black/60 text-white text-[0.6rem] font-bold px-2 py-0.5 rounded-full">
          {docCount} doc{docCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Info + acciones */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-text leading-snug">{cat.nombre}</h3>
          <button
            onClick={() => onDelete(cat)}
            className="p-1.5 rounded-lg text-text-muted hover:text-red-dark hover:bg-red/10 transition-colors shrink-0"
            title="Eliminar categoría"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Dropzone compacto */}
        <ImageDropzone
          onFile={setFile}
          currentFile={file}
          existingUrl={cat.thumbnail_url}
          compact
        />

        {error && (
          <p className="text-[0.65rem] text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" />{error}
          </p>
        )}

        {file && (
          <>
            {uploading && (
              <div className="space-y-1">
                <div className="h-1.5 bg-bg-alt rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary-800 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.15 }}
                  />
                </div>
                <p className="text-[0.6rem] text-text-muted text-right">{progress}%</p>
              </div>
            )}
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 py-2 bg-primary-800 text-white text-xs font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-60 transition-colors"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading ? 'Subiendo…' : 'Guardar imagen'}
            </button>
          </>
        )}
      </div>
    </Card3D>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function GestionCategorias() {
  const { data: categorias = [], isLoading } = useCategoriasList()
  const { data: docsData }                   = useDocumentosList({ limit: 500, admin: 'true' })
  const docs = docsData?.data ?? []

  const createCategoria   = useCreateCategoria()
  const uploadThumbnail   = useUploadCategoriaThumbnail()
  const deleteCategoria   = useDeleteCategoria()

  const [showNew, setShowNew]         = useState(false)
  const [newName, setNewName]         = useState('')
  const [newFile, setNewFile]         = useState<File | null>(null)
  const [newError, setNewError]       = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ nombre: string } | null>(null)
  const [toast, setToast]             = useState<string | null>(null)

  const docCountByCategoria = docs.reduce((acc, d) => {
    const cat = d.categoria || d.tipo
    if (cat) acc[cat] = (acc[cat] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!newName.trim()) { setNewError('El nombre es obligatorio'); return }
    setNewError(null)
    try {
      const created = await createCategoria.mutateAsync(newName.trim())
      if (newFile) {
        await uploadThumbnail.mutateAsync({ nombre: created.nombre, file: newFile })
      }
      setToast(`Categoría "${created.nombre}" creada`)
      setShowNew(false); setNewName(''); setNewFile(null)
    } catch (err) {
      setNewError(getApiErrorMessage(err, 'No se pudo crear la categoría'))
    }
  }

  const confirmDelete = async () => {
    try {
      if (!deleteTarget) return
    await deleteCategoria.mutateAsync(deleteTarget.nombre)
      setToast(`Categoría "${deleteTarget.nombre}" eliminada`)
    } catch {
      setToast('No se pudo eliminar la categoría')
    }
    setDeleteTarget(null)
  }

  const isSaving = createCategoria.isPending || uploadThumbnail.isPending

  return (
    <div className="space-y-6">

      <AnimatePresence>
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>

      {/* Header */}
      <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[0.7rem] font-bold uppercase tracking-widest text-primary-700">Administración</span>
          <h1 className="font-display text-2xl font-bold text-text mt-0.5">Gestión de Categorías</h1>
          <p className="text-sm text-text-muted mt-1">
            {isLoading ? 'Cargando…' : `${categorias.length} categorías registradas`}
          </p>
        </div>
        <button
          onClick={() => { setShowNew(true); setNewName(''); setNewFile(null); setNewError(null) }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-800 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> Nueva categoría
        </button>
      </motion.div>

      {/* Explicación */}
      <motion.div {...fadeUp(0.04)} className="flex items-start gap-3 p-4 bg-primary-500/10 border border-primary-500/25 rounded-xl">
        <Tag className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
        <p className="text-xs text-primary-600">
          Cada categoría agrupa documentos del mismo tema. La imagen de portada aparece como fondo de la tarjeta en el portal público de Documentos.
          Las categorías sin imagen muestran un fondo con degradado de color.
        </p>
      </motion.div>

      {/* Estado vacío */}
      {!isLoading && categorias.length === 0 && (
        <motion.div {...fadeUp(0.08)} className="flex flex-col items-center justify-center py-20 text-center bg-[var(--card-bg)] border border-dashed border-border rounded-2xl">
          <div className="w-16 h-16 bg-primary-500/12 rounded-2xl flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-primary-400" />
          </div>
          <h3 className="text-base font-bold text-text mb-1">No hay categorías</h3>
          <p className="text-sm text-text-muted mb-6 max-w-xs">Crea la primera categoría para organizar los documentos.</p>
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-800 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Crear primera categoría
          </button>
        </motion.div>
      )}

      {/* Grid de tarjetas */}
      {categorias.length > 0 && (
        <motion.div
          variants={staggerContainer(0.07, 0.08)}
          initial="initial" animate="animate"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {categorias.map((cat) => (
              <CategoriaCard
                key={cat.nombre}
                cat={cat}
                docCount={docCountByCategoria[cat.nombre] ?? 0}
                onDelete={setDeleteTarget}
                onThumbnailSaved={(nombre) => setToast(`Imagen de "${nombre}" actualizada`)}
                uploadThumbnail={uploadThumbnail}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modal nueva categoría */}
      <AnimatePresence>
        {showNew && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget && !isSaving) setShowNew(false) }}
          >
            <motion.div {...panelAnim} className="bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <div>
                  <h3 className="text-base font-bold text-text">Nueva categoría</h3>
                  <p className="text-xs text-text-muted mt-0.5">Dale un nombre e imagen de portada</p>
                </div>
                <button onClick={() => setShowNew(false)} disabled={isSaving}
                  className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-alt transition-colors disabled:opacity-40">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div>
                  <label htmlFor="gc-nombre" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    Nombre <span className="text-orange-500" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="gc-nombre"
                    type="text"
                    value={newName}
                    placeholder="Ej: Estudios Socioeconómicos"
                    autoFocus
                    onChange={(e) => { setNewName(e.target.value); setNewError(null) }}
                    className={`w-full px-3 py-2.5 bg-[var(--card-bg)] border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${newError ? 'border-red-400' : 'border-border focus:border-primary-800'}`}
                  />
                  {newError && <p className="text-xs text-red-500 mt-1">{newError}</p>}
                </div>

                <div>
                  <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    Imagen de portada <span className="font-normal normal-case tracking-normal text-text-muted">(opcional)</span>
                  </label>
                  <ImageDropzone onFile={setNewFile} currentFile={newFile} existingUrl={null} compact />
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowNew(false)} disabled={isSaving}
                    className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 hover:text-primary-800 disabled:opacity-40 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSaving}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {isSaving ? 'Guardando…' : 'Crear categoría'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal confirmar eliminación */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div {...panelAnim} className="bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
              <div className="w-12 h-12 bg-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-5 h-5 text-red-dark" />
              </div>
              <h3 className="text-base font-bold text-text mb-2">Eliminar categoría</h3>
              <p className="text-sm text-text-muted mb-1">
                ¿Seguro que deseas eliminar <strong className="text-text">"{deleteTarget.nombre}"</strong>?
              </p>
              <p className="text-xs text-text-muted mb-6">
                Los documentos asociados <strong>no se eliminarán</strong>, solo la categoría y su imagen de portada.
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
