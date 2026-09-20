import { useState, useRef, useCallback, useEffect, type FormEvent } from 'react'
import { getApiErrorMessage } from '@/lib/apiError'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, Pencil, Upload, X, CheckCircle,
  Loader2, Tag, ImageOff, FolderOpen,
} from 'lucide-react'
import { fadeUpSm, panelAnim, staggerContainer } from '@/lib/animations'
import Card3D from '@/components/ui/Card3D'
import type { ModuloCategoria } from '@/types'
import {
  useCategoriasList,
  useCreateCategoria,
  useUploadCategoriaThumbnail,
  useRenameCategoria,
  useDeleteCategoria,
  useUpdateModulosCategoria,
} from '@/hooks/useCategorias'

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
        <img src={preview} alt="Portada" className="w-full h-full object-cover" loading="lazy" />
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
interface ConteoCategoria { docs: number; mapas: number; geovisores: number }

// A qué módulos PERTENECE la categoría (declarado al crearla/editarla) --
// misma fuente para el filtro de arriba, las tarjetas y los formularios de
// crear/editar, así "Filtrar por módulo" siempre coincide con lo que dice
// cada tarjeta (antes el filtro miraba el conteo de uso real, no la
// asignación, así que una categoría recién creada sin uso todavía
// "desaparecía" del filtro aunque sí estuviera asignada a ese módulo).
const MODULOS_CATEGORIA: { key: ModuloCategoria; label: string }[] = [
  { key: 'documentos', label: 'Documentos' },
  { key: 'mapas', label: 'Mapas' },
  { key: 'geovisores', label: 'Geovisores' },
]

/** Checkboxes verticales -- más claro que pills clicables para un formulario. */
function ModulosCheckboxList({ modulos, onToggle, disabled }: { modulos: ModuloCategoria[]; onToggle: (m: ModuloCategoria) => void; disabled?: boolean }) {
  return (
    <div className="space-y-2.5">
      {MODULOS_CATEGORIA.map(({ key, label }) => (
        <label key={key} className={`flex items-center gap-2.5 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
          <input
            type="checkbox"
            checked={modulos.includes(key)}
            onChange={() => onToggle(key)}
            disabled={disabled}
            className="w-4 h-4 accent-primary-700"
          />
          <span className="text-sm text-text">{label}</span>
        </label>
      ))}
    </div>
  )
}

/** Badges de solo lectura en la tarjeta -- editar los módulos se hace desde "Editar categoría", no aquí. */
function ModulosBadges({ modulos }: { modulos: ModuloCategoria[] }) {
  if (modulos.length === 0) {
    return <span className="text-[0.65rem] text-text-muted italic">Sin módulo asignado</span>
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {MODULOS_CATEGORIA.filter(({ key }) => modulos.includes(key)).map(({ key, label }) => (
        <span key={key} className="text-[0.65rem] font-semibold px-2.5 py-1 rounded-full bg-primary-500/12 text-primary-700 border border-primary-500/30">
          {label}
        </span>
      ))}
    </div>
  )
}

/** "3 docs · 2 mapas · 1 geovisor" -- omite los tipos en cero, salvo si todo está en cero. */
function resumenConteo({ docs, mapas, geovisores }: ConteoCategoria): string {
  const partes = [
    docs       > 0 ? `${docs} doc${docs !== 1 ? 's' : ''}` : null,
    mapas      > 0 ? `${mapas} mapa${mapas !== 1 ? 's' : ''}` : null,
    geovisores > 0 ? `${geovisores} geovisor${geovisores !== 1 ? 'es' : ''}` : null,
  ].filter(Boolean)
  return partes.length > 0 ? partes.join(' · ') : '0 elementos'
}

function CategoriaCard({ cat, conteo, onEdit, onDelete }: {
  cat: { nombre: string; descripcion?: string | null; thumbnail_url?: string | null; activo?: boolean; modulos?: ModuloCategoria[] }
  conteo: ConteoCategoria
  onEdit: (target: { nombre: string; modulos: ModuloCategoria[]; thumbnail_url: string | null }) => void
  onDelete: (target: { nombre: string }) => void
}) {
  return (
    <Card3D
      disabled
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
        {cat.thumbnail_url ? (
          <img src={cat.thumbnail_url} alt={cat.nombre} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-text-muted/40">
            <ImageOff className="w-8 h-8" />
            <span className="text-[0.65rem]">Sin imagen</span>
          </div>
        )}

        {/* Badge de conteo -- desglosado por tipo, no solo documentos */}
        <span className="absolute top-2 right-2 bg-black/60 text-white text-[0.6rem] font-bold px-2 py-0.5 rounded-full">
          {resumenConteo(conteo)}
        </span>
      </div>

      {/* Info + acciones */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-text leading-snug">{cat.nombre}</h3>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onEdit({ nombre: cat.nombre, modulos: cat.modulos ?? [], thumbnail_url: cat.thumbnail_url ?? null })}
              className="p-1.5 rounded-lg text-text-muted hover:text-primary-800 hover:bg-primary-500/10 transition-colors"
              title="Editar categoría"
              aria-label={`Editar categoría ${cat.nombre}`}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(cat)}
              className="p-1.5 rounded-lg text-text-muted hover:text-red-dark hover:bg-red/10 transition-colors"
              title="Eliminar categoría"
              aria-label={`Eliminar categoría ${cat.nombre}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Módulos a los que pertenece -- solo lectura, se edita desde "Editar categoría" */}
        <ModulosBadges modulos={cat.modulos ?? []} />
      </div>
    </Card3D>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function GestionCategorias() {
  const { data: categorias = [], isLoading } = useCategoriasList({ admin: 'true' })

  const createCategoria   = useCreateCategoria()
  const uploadThumbnail   = useUploadCategoriaThumbnail()
  const renameCategoria   = useRenameCategoria()
  const deleteCategoria   = useDeleteCategoria()
  const updateModulos     = useUpdateModulosCategoria()

  const [showNew, setShowNew]         = useState(false)
  const [newName, setNewName]         = useState('')
  const [newModulos, setNewModulos]   = useState<ModuloCategoria[]>(['documentos', 'mapas', 'geovisores'])
  const [newFile, setNewFile]         = useState<File | null>(null)
  const [newError, setNewError]       = useState<string | null>(null)
  const [editTarget, setEditTarget]   = useState<{ nombre: string; modulos: ModuloCategoria[]; thumbnail_url: string | null } | null>(null)
  const [editNombre, setEditNombre]   = useState('')
  const [editModulos, setEditModulos] = useState<ModuloCategoria[]>([])
  const [editFile, setEditFile]       = useState<File | null>(null)
  const [editError, setEditError]     = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ nombre: string } | null>(null)
  const [toast, setToast]             = useState<string | null>(null)
  const [filtroModulo, setFiltroModulo] = useState<ModuloCategoria | ''>('')

  const CONTEO_VACIO: ConteoCategoria = { docs: 0, mapas: 0, geovisores: 0 }

  // Filtro por módulo -- a qué módulo está ASIGNADA cada categoría (mismo
  // campo que se edita en el formulario), no cuántos elementos ya tiene
  // cargados -- así una categoría recién creada sin uso todavía sí aparece
  // al filtrar por su módulo, en vez de "desaparecer" hasta que alguien la use.
  const categoriasFiltradas = !filtroModulo
    ? categorias
    : categorias.filter((cat) => cat.modulos?.includes(filtroModulo))

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!newName.trim()) { setNewError('El nombre es obligatorio'); return }
    if (newModulos.length === 0) { setNewError('Selecciona a qué módulo(s) pertenece'); return }
    setNewError(null)
    try {
      const created = await createCategoria.mutateAsync({ nombre: newName.trim(), modulos: newModulos })
      if (newFile) {
        await uploadThumbnail.mutateAsync({ nombre: created.nombre, file: newFile })
      }
      setToast(`Categoría "${created.nombre}" creada`)
      setShowNew(false); setNewName(''); setNewModulos(['documentos', 'mapas', 'geovisores']); setNewFile(null)
    } catch (err) {
      setNewError(getApiErrorMessage(err, 'No se pudo crear la categoría'))
    }
  }

  const toggleNewModulo = (m: ModuloCategoria) => {
    setNewModulos((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]))
    setNewError(null)
  }

  const openEdit = (target: { nombre: string; modulos: ModuloCategoria[]; thumbnail_url: string | null }) => {
    setEditTarget(target); setEditNombre(target.nombre); setEditModulos(target.modulos)
    setEditFile(null); setEditError(null)
  }

  const toggleEditModulo = (m: ModuloCategoria) => {
    setEditModulos((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]))
    setEditError(null)
  }

  // Un solo formulario para nombre, módulos e imagen -- antes eran acciones
  // sueltas en distintos lugares (renombrar en un modal aparte, módulos en
  // pills sobre la tarjeta, imagen en un dropzone también sobre la tarjeta)
  // sin ningún formulario real donde verlas y cambiarlas juntas. Si el
  // nombre cambia, el rename va primero (cambia la clave primaria) y el
  // resto de mutaciones usan el nombre nuevo.
  const confirmEdit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editTarget) return
    const nuevoNombre = editNombre.trim()
    if (!nuevoNombre) { setEditError('El nombre es obligatorio'); return }
    if (editModulos.length === 0) { setEditError('Selecciona al menos un módulo'); return }
    try {
      if (nuevoNombre !== editTarget.nombre) {
        await renameCategoria.mutateAsync({ nombre: editTarget.nombre, nuevoNombre })
      }
      const mismosModulos = editModulos.length === editTarget.modulos.length &&
        editModulos.every((m) => editTarget.modulos.includes(m))
      if (!mismosModulos) {
        await updateModulos.mutateAsync({ nombre: nuevoNombre, modulos: editModulos })
      }
      if (editFile) {
        await uploadThumbnail.mutateAsync({ nombre: nuevoNombre, file: editFile })
      }
      setToast(`Categoría "${nuevoNombre}" actualizada`)
      setEditTarget(null)
    } catch (err) {
      setEditError(getApiErrorMessage(err, 'No se pudo actualizar la categoría'))
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
  const isEditing = renameCategoria.isPending || updateModulos.isPending || uploadThumbnail.isPending

  return (
    <div className="space-y-6">

      <AnimatePresence>
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>

      {/* Header */}
      <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[0.7rem] font-bold uppercase tracking-widest" style={{ color: 'var(--hero-eyebrow-text)' }}>Administración</span>
          <h1 className="font-display text-2xl font-bold text-text mt-0.5">Gestión de Categorías</h1>
          <p className="text-sm text-text-muted mt-1">
            {isLoading
              ? 'Cargando…'
              : filtroModulo
                ? `${categoriasFiltradas.length} de ${categorias.length} categorías asignadas a ${MODULOS_CATEGORIA.find((m) => m.key === filtroModulo)?.label}`
                : `${categorias.length} categorías registradas`}
          </p>
        </div>
        <button
          onClick={() => { setShowNew(true); setNewName(''); setNewModulos(['documentos', 'mapas', 'geovisores']); setNewFile(null); setNewError(null) }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-800 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> Nueva categoría
        </button>
      </motion.div>

      {/* Explicación */}
      <motion.div {...fadeUp(0.04)} className="flex items-start gap-3 p-4 bg-primary-500/10 border border-primary-500/25 rounded-xl">
        <Tag className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
        <p className="text-xs text-primary-600">
          Cada categoría agrupa documentos, mapas y geovisores del mismo tema. La imagen de portada aparece como fondo de la tarjeta en el portal público de Documentos.
          Las categorías sin imagen muestran un fondo con degradado de color.
        </p>
      </motion.div>

      {/* Filtro por módulo -- ¿qué categorías están asignadas a cada módulo? */}
      {!isLoading && categorias.length > 0 && (
        <motion.div {...fadeUp(0.02)} className="flex flex-wrap items-center gap-2">
          <span className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mr-1">Filtrar por módulo</span>
          <button
            onClick={() => setFiltroModulo('')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              !filtroModulo
                ? 'bg-primary-800 text-white border-primary-800'
                : 'bg-[var(--card-bg)] text-text-muted border-border hover:border-primary-800 hover:text-primary-800'
            }`}
          >
            Todas
          </button>
          {MODULOS_CATEGORIA.map(({ key, label }) => (
            <button key={key}
              onClick={() => setFiltroModulo(filtroModulo === key ? '' : key)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                filtroModulo === key
                  ? 'bg-primary-800 text-white border-primary-800'
                  : 'bg-[var(--card-bg)] text-text-muted border-border hover:border-primary-800 hover:text-primary-800'
              }`}
            >
              {label}
            </button>
          ))}
        </motion.div>
      )}

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

      {/* Sin resultados para el módulo elegido -- distinto del estado "no hay categorías" */}
      {!isLoading && categorias.length > 0 && categoriasFiltradas.length === 0 && (
        <div className="py-12 text-center text-sm text-text-muted">
          Ninguna categoría está asignada a {MODULOS_CATEGORIA.find((m) => m.key === filtroModulo)?.label} todavía.
        </div>
      )}

      {/* Grid de tarjetas */}
      {categoriasFiltradas.length > 0 && (
        <motion.div
          variants={staggerContainer(0.07, 0.08)}
          initial="initial" animate="animate"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {categoriasFiltradas.map((cat) => (
              <CategoriaCard
                key={cat.nombre}
                cat={cat}
                conteo={cat.conteo ?? CONTEO_VACIO}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
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
                    ¿En qué módulo(s) va a aparecer? <span className="text-orange-500" aria-hidden="true">*</span>
                  </label>
                  <p className="text-xs text-text-muted mb-2">
                    Define en qué formularios (Documentos, Mapas, Geovisores) va a poder elegirse esta categoría.
                  </p>
                  <ModulosCheckboxList modulos={newModulos} onToggle={toggleNewModulo} />
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

      {/* Modal editar categoría -- nombre y módulos juntos en el mismo formulario */}
      <AnimatePresence>
        {editTarget && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget && !isEditing) setEditTarget(null) }}
          >
            <motion.div {...panelAnim} className="bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <div>
                  <h3 className="text-base font-bold text-text">Editar categoría</h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    El nombre se actualiza en Mapas, Documentos y Geovisores que la usen.
                  </p>
                </div>
                <button onClick={() => setEditTarget(null)} disabled={isEditing}
                  className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-alt transition-colors disabled:opacity-40">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={confirmEdit} className="p-6 space-y-4">
                <div>
                  <label htmlFor="gc-edit-nombre" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    Nombre <span className="text-orange-500" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="gc-edit-nombre"
                    type="text"
                    value={editNombre}
                    autoFocus
                    onChange={(e) => { setEditNombre(e.target.value); setEditError(null) }}
                    className={`w-full px-3 py-2.5 bg-[var(--card-bg)] border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${editError ? 'border-red-400' : 'border-border focus:border-primary-800'}`}
                  />
                </div>

                <div>
                  <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    ¿En qué módulo(s) va a aparecer? <span className="text-orange-500" aria-hidden="true">*</span>
                  </label>
                  <ModulosCheckboxList modulos={editModulos} onToggle={toggleEditModulo} disabled={isEditing} />
                </div>

                <div>
                  <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    Imagen de portada <span className="font-normal normal-case tracking-normal text-text-muted">(opcional)</span>
                  </label>
                  <ImageDropzone
                    onFile={setEditFile}
                    currentFile={editFile}
                    existingUrl={editTarget?.thumbnail_url ?? null}
                    compact
                  />
                </div>

                {editError && <p className="text-xs text-red-500">{editError}</p>}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setEditTarget(null)} disabled={isEditing}
                    className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 hover:text-primary-800 disabled:opacity-40 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isEditing}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors">
                    {isEditing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
                    {isEditing ? 'Guardando…' : 'Guardar cambios'}
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
