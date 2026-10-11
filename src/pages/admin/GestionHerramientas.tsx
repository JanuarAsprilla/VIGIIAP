import { useState, type FormEvent } from 'react'
import { getApiErrorMessage } from '@/lib/apiError'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, Pencil, X, CheckCircle, ArrowUp, ArrowDown,
  Loader2, Wrench, Eye, EyeOff, AlertCircle, Globe, Users, Search,
} from 'lucide-react'
import { fadeUpSm, panelAnim, staggerContainer } from '@/lib/animations'
import Card3D from '@/components/ui/Card3D'
import {
  useHerramientasList, useCrearHerramienta, useActualizarHerramienta,
  useReordenarHerramientas, useEliminarHerramienta, type CrearHerramientaInput,
} from '@/hooks/useHerramientas'
import { REGISTRO_HERRAMIENTAS } from '@/lib/herramientasRegistro'
import type { Herramienta, VisibilidadHerramienta } from '@/types'

const VISIBILIDAD_META: Record<VisibilidadHerramienta, { label: string; icon: typeof Globe }> = {
  publico:  { label: 'Público',  icon: Globe },
  usuarios: { label: 'Usuarios de la plataforma', icon: Users },
}

const fadeUp = fadeUpSm

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useState(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t) })
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-3 px-5 py-3 bg-green-700 text-white rounded-2xl shadow-xl"
    >
      <CheckCircle className="w-5 h-5 shrink-0" />
      <span className="text-sm font-semibold">{message}</span>
    </motion.div>
  )
}

interface HerramientaCardProps {
  h: Herramienta
  esPrimera: boolean
  esUltima: boolean
  onEditar: (h: Herramienta) => void
  onEliminar: (h: Herramienta) => void
  onMover: (h: Herramienta, direccion: 'arriba' | 'abajo') => void
  onToggleActiva: (h: Herramienta) => void
  moviendose: boolean
}

function HerramientaCard({ h, esPrimera, esUltima, onEditar, onEliminar, onMover, onToggleActiva, moviendose }: HerramientaCardProps) {
  const tieneComponente = h.clave in REGISTRO_HERRAMIENTAS
  const visMeta = VISIBILIDAD_META[h.visibilidad]
  const VisIcon = visMeta.icon

  return (
    <Card3D
      disabled
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
      className="bg-[var(--card-bg)] border border-border/70 rounded-xl p-4 flex items-start gap-4"
    >
      <div className="flex flex-col gap-1 shrink-0">
        <button
          onClick={() => onMover(h, 'arriba')}
          disabled={esPrimera || moviendose}
          className="p-1 rounded-lg text-text-muted hover:text-primary-800 hover:bg-primary-500/10 disabled:opacity-25 disabled:hover:bg-transparent transition-colors"
          aria-label={`Subir ${h.titulo}`}
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onMover(h, 'abajo')}
          disabled={esUltima || moviendose}
          className="p-1 rounded-lg text-text-muted hover:text-primary-800 hover:bg-primary-500/10 disabled:opacity-25 disabled:hover:bg-transparent transition-colors"
          aria-label={`Bajar ${h.titulo}`}
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[0.6rem] font-bold uppercase tracking-widest text-text-muted">{h.tag}</span>
              <code className="text-[0.6rem] text-text-muted bg-bg-alt px-1.5 py-0.5 rounded">{h.clave}</code>
              <span
                className={`inline-flex items-center gap-1 text-[0.6rem] font-bold px-2 py-0.5 rounded-full border ${
                  h.visibilidad === 'publico'
                    ? 'text-primary-700 bg-primary-500/10 border-primary-500/25'
                    : 'text-gold-600 bg-gold-300/10 border-gold-300/40'
                }`}
                title={h.visibilidad === 'publico' ? 'Visible para cualquiera, incluido visitante sin sesión' : 'Visible solo para usuarios con sesión iniciada'}
              >
                <VisIcon className="w-3 h-3" /> {visMeta.label}
              </span>
              {!tieneComponente && (
                <span className="inline-flex items-center gap-1 text-[0.6rem] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  <AlertCircle className="w-3 h-3" /> Sin componente
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-text mt-0.5 truncate">{h.titulo}</h3>
            {h.descripcion && <p className="text-xs text-text-muted mt-1 line-clamp-2">{h.descripcion}</p>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onToggleActiva(h)}
              className={`p-1.5 rounded-lg transition-colors ${h.activa ? 'text-primary-700 hover:bg-primary-500/10' : 'text-text-muted hover:bg-bg-alt'}`}
              title={h.activa ? 'Activa — clic para ocultar' : 'Oculta — clic para activar'}
              aria-label={h.activa ? `Ocultar ${h.titulo}` : `Activar ${h.titulo}`}
            >
              {h.activa ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => onEditar(h)}
              className="p-1.5 rounded-lg text-text-muted hover:text-primary-800 hover:bg-primary-500/10 transition-colors"
              title="Editar" aria-label={`Editar ${h.titulo}`}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onEliminar(h)}
              className="p-1.5 rounded-lg text-text-muted hover:text-red-dark hover:bg-red/10 transition-colors"
              title="Eliminar" aria-label={`Eliminar ${h.titulo}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </Card3D>
  )
}

interface FormularioHerramientaState {
  clave: string
  titulo: string
  descripcion: string
  tag: string
  visibilidad: VisibilidadHerramienta
}

const FORM_VACIO: FormularioHerramientaState = { clave: '', titulo: '', descripcion: '', tag: '', visibilidad: 'publico' }

export default function GestionHerramientas() {
  const { data: herramientas = [], isLoading } = useHerramientasList(true)
  const crear       = useCrearHerramienta()
  const actualizar  = useActualizarHerramienta()
  const reordenar   = useReordenarHerramientas()
  const eliminar    = useEliminarHerramienta()

  const [showNew, setShowNew]           = useState(false)
  const [form, setForm]                 = useState<FormularioHerramientaState>(FORM_VACIO)
  const [formError, setFormError]       = useState<string | null>(null)
  const [editTarget, setEditTarget]     = useState<Herramienta | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Herramienta | null>(null)
  const [toast, setToast]               = useState<string | null>(null)
  const [busqueda, setBusqueda]         = useState('')

  const clavesPublicadas = new Set(herramientas.map((h) => h.clave))
  const clavesDisponibles = Object.keys(REGISTRO_HERRAMIENTAS).filter((c) => !clavesPublicadas.has(c))

  const isSaving = crear.isPending || actualizar.isPending

  const abrirCrear = () => {
    setForm({ ...FORM_VACIO, clave: clavesDisponibles[0] ?? '' })
    setFormError(null)
    setShowNew(true)
  }

  const abrirEditar = (h: Herramienta) => {
    setEditTarget(h)
    setForm({ clave: h.clave, titulo: h.titulo, descripcion: h.descripcion ?? '', tag: h.tag, visibilidad: h.visibilidad })
    setFormError(null)
  }

  const handleCrear = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!form.clave)  { setFormError('Selecciona una clave'); return }
    if (!form.titulo.trim()) { setFormError('El título es obligatorio'); return }
    if (!form.tag.trim())    { setFormError('El tag es obligatorio'); return }
    setFormError(null)
    try {
      const datos: CrearHerramientaInput = {
        clave: form.clave, titulo: form.titulo.trim(), tag: form.tag.trim(),
        descripcion: form.descripcion.trim() || null, visibilidad: form.visibilidad,
      }
      await crear.mutateAsync(datos)
      setToast(`Herramienta "${datos.titulo}" publicada`)
      setShowNew(false); setForm(FORM_VACIO)
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'No se pudo crear la herramienta'))
    }
  }

  const handleEditar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editTarget) return
    if (!form.titulo.trim()) { setFormError('El título es obligatorio'); return }
    if (!form.tag.trim())    { setFormError('El tag es obligatorio'); return }
    try {
      await actualizar.mutateAsync({
        clave: editTarget.clave,
        cambios: {
          titulo: form.titulo.trim(), tag: form.tag.trim(),
          descripcion: form.descripcion.trim() || null, visibilidad: form.visibilidad,
        },
      })
      setToast(`Herramienta "${form.titulo.trim()}" actualizada`)
      setEditTarget(null)
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'No se pudo actualizar la herramienta'))
    }
  }

  const handleToggleActiva = async (h: Herramienta) => {
    try {
      await actualizar.mutateAsync({ clave: h.clave, cambios: { activa: !h.activa } })
      setToast(h.activa ? `"${h.titulo}" ahora está oculta` : `"${h.titulo}" ahora está activa`)
    } catch {
      setToast('No se pudo cambiar la visibilidad')
    }
  }

  // Mover arriba/abajo opera DENTRO del grupo de su propio tag, no sobre el
  // orden global -- con las tarjetas agrupadas visualmente por tag, mover
  // "arriba" y que la tarjeta salte a otra sección se sentiría roto.
  const handleMover = async (h: Herramienta, direccion: 'arriba' | 'abajo') => {
    const delGrupo = herramientas.filter((x) => x.tag === h.tag).sort((a, b) => a.orden - b.orden)
    const idx = delGrupo.findIndex((x) => x.clave === h.clave)
    const otroIdx = direccion === 'arriba' ? idx - 1 : idx + 1
    if (otroIdx < 0 || otroIdx >= delGrupo.length) return
    const otro = delGrupo[otroIdx]
    try {
      await reordenar.mutateAsync([{ clave: h.clave, orden: otro.orden }, { clave: otro.clave, orden: h.orden }])
    } catch {
      setToast('No se pudo reordenar')
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await eliminar.mutateAsync(deleteTarget.clave)
      setToast(`Herramienta "${deleteTarget.titulo}" eliminada`)
    } catch {
      setToast('No se pudo eliminar la herramienta')
    }
    setDeleteTarget(null)
  }

  const ordenadas = [...herramientas].sort((a, b) => a.orden - b.orden)

  const q = busqueda.trim().toLowerCase()
  const filtradas = !q
    ? ordenadas
    : ordenadas.filter((h) =>
        h.titulo.toLowerCase().includes(q) || h.tag.toLowerCase().includes(q) || h.clave.toLowerCase().includes(q))

  // Agrupadas por tag (orden alfabético de sección) -- con "muchas más"
  // herramientas viniendo, una sola lista plana deja de tener jerarquía; el
  // tag ya es un dato real de cada herramienta, no uno nuevo que inventar.
  const porTag = new Map<string, Herramienta[]>()
  filtradas.forEach((h) => {
    const lista = porTag.get(h.tag) ?? []
    lista.push(h)
    porTag.set(h.tag, lista)
  })
  const grupos = Array.from(porTag.entries()).sort((a, b) => a[0].localeCompare(b[0], 'es'))

  return (
    <div className="space-y-6">
      <AnimatePresence>{toast && <Toast message={toast} onDone={() => setToast(null)} />}</AnimatePresence>

      <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[0.7rem] font-bold uppercase tracking-widest" style={{ color: 'var(--hero-eyebrow-text)' }}>Administración</span>
          <h1 className="font-display text-2xl font-bold text-text mt-0.5">Gestión de Herramientas</h1>
          <p className="text-sm text-text-muted mt-1">
            {isLoading ? 'Cargando…' : `${herramientas.length} herramientas registradas`}
          </p>
        </div>
        <button
          onClick={abrirCrear}
          disabled={clavesDisponibles.length === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-800 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> Publicar herramienta
        </button>
      </motion.div>

      <motion.div {...fadeUp(0.04)} className="flex items-start gap-3 p-4 bg-primary-500/10 border border-primary-500/25 rounded-xl">
        <Wrench className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
        <p className="text-xs text-primary-600">
          Aquí controlas si una herramienta aparece en <strong>/herramientas</strong>, su orden, su descripción y
          quién puede verla — sin necesidad de un despliegue. "Público" la muestra a cualquiera, incluido un
          visitante sin sesión; "Usuarios de la plataforma" la oculta a quien no tenga sesión iniciada. El
          componente que la ejecuta sigue siendo código: solo puedes publicar claves que un desarrollador ya haya
          integrado (columna "Sin componente" marca las que faltan). Para las herramientas con navegación propia
          (como el Panel Chocó), título y descripción se ven en su tarjeta pública; para herramientas simples,
          solo activar/ocultar, visibilidad y el orden tienen efecto visible ahí.
        </p>
      </motion.div>

      {!isLoading && ordenadas.length === 0 && (
        <motion.div {...fadeUp(0.08)} className="flex flex-col items-center justify-center py-20 text-center bg-[var(--card-bg)] border border-dashed border-border rounded-2xl">
          <div className="w-16 h-16 bg-primary-500/12 rounded-2xl flex items-center justify-center mb-4">
            <Wrench className="w-8 h-8 text-primary-400" />
          </div>
          <h3 className="text-base font-bold text-text mb-1">No hay herramientas publicadas</h3>
          <p className="text-sm text-text-muted mb-6 max-w-xs">Publica la primera herramienta disponible.</p>
        </motion.div>
      )}

      {ordenadas.length > 0 && (
        <motion.div {...fadeUp(0.06)} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" aria-hidden="true" />
          <input
            type="text"
            aria-label="Buscar herramienta"
            placeholder="Buscar por título, tag o clave…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
          />
        </motion.div>
      )}

      {ordenadas.length > 0 && filtradas.length === 0 && (
        <p className="text-sm text-text-muted text-center py-10">Ninguna herramienta coincide con "{busqueda}"</p>
      )}

      {grupos.map(([tag, delTag]) => (
        <div key={tag} className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="section-title">{tag}</h2>
            <span className="data-label">{delTag.length}</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <motion.div
            variants={staggerContainer(0.05, 0.05)} initial="initial" animate="animate"
            className="grid grid-cols-1 lg:grid-cols-2 gap-3"
          >
            <AnimatePresence mode="popLayout">
              {delTag.map((h, i) => (
                <HerramientaCard
                  key={h.clave}
                  h={h}
                  esPrimera={i === 0}
                  esUltima={i === delTag.length - 1}
                  onEditar={abrirEditar}
                  onEliminar={setDeleteTarget}
                  onMover={handleMover}
                  onToggleActiva={handleToggleActiva}
                  moviendose={reordenar.isPending}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      ))}

      {/* Modal crear */}
      <AnimatePresence>
        {showNew && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget && !isSaving) setShowNew(false) }}>
            <motion.div {...panelAnim} className="bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <div>
                  <h3 className="text-base font-bold text-text">Publicar herramienta</h3>
                  <p className="text-xs text-text-muted mt-0.5">Elige una clave ya integrada por desarrollo</p>
                </div>
                <button onClick={() => setShowNew(false)} disabled={isSaving}
                  className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-alt transition-colors disabled:opacity-40">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCrear} className="p-6 space-y-4">
                <div>
                  <label htmlFor="gh-clave" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    Clave <span className="text-orange-500" aria-hidden="true">*</span>
                  </label>
                  {clavesDisponibles.length === 0 ? (
                    <p className="text-xs text-text-muted">No hay claves nuevas disponibles — todas las integradas ya están publicadas.</p>
                  ) : (
                    <select id="gh-clave" value={form.clave}
                      onChange={(e) => setForm((f) => ({ ...f, clave: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800/10 focus:border-primary-800 transition">
                      {clavesDisponibles.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  )}
                </div>
                <div>
                  <label htmlFor="gh-titulo" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    Título <span className="text-orange-500" aria-hidden="true">*</span>
                  </label>
                  <input id="gh-titulo" type="text" value={form.titulo}
                    onChange={(e) => { setForm((f) => ({ ...f, titulo: e.target.value })); setFormError(null) }}
                    className="w-full px-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800/10 focus:border-primary-800 transition" />
                </div>
                <div>
                  <label htmlFor="gh-tag" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    Tag <span className="text-orange-500" aria-hidden="true">*</span>
                  </label>
                  <input id="gh-tag" type="text" value={form.tag} placeholder="Ej: Reportes"
                    onChange={(e) => { setForm((f) => ({ ...f, tag: e.target.value })); setFormError(null) }}
                    className="w-full px-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800/10 focus:border-primary-800 transition" />
                </div>
                <div>
                  <label htmlFor="gh-vis" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Visibilidad</label>
                  <select id="gh-vis" value={form.visibilidad}
                    onChange={(e) => setForm((f) => ({ ...f, visibilidad: e.target.value as VisibilidadHerramienta }))}
                    className="w-full px-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800/10 focus:border-primary-800 transition">
                    <option value="publico">Público — cualquiera, incluido visitante sin sesión</option>
                    <option value="usuarios">Usuarios de la plataforma — requiere sesión iniciada</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="gh-desc" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    Descripción <span className="font-normal normal-case tracking-normal text-text-muted">(opcional)</span>
                  </label>
                  <textarea id="gh-desc" rows={3} value={form.descripcion}
                    onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800/10 focus:border-primary-800 transition resize-none" />
                </div>
                {formError && <p className="text-xs text-red-500">{formError}</p>}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowNew(false)} disabled={isSaving}
                    className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 hover:text-primary-800 disabled:opacity-40 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSaving || clavesDisponibles.length === 0}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {isSaving ? 'Guardando…' : 'Publicar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal editar */}
      <AnimatePresence>
        {editTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget && !isSaving) setEditTarget(null) }}>
            <motion.div {...panelAnim} className="bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <div>
                  <h3 className="text-base font-bold text-text">Editar herramienta</h3>
                  <p className="text-xs text-text-muted mt-0.5"><code className="bg-bg-alt px-1.5 py-0.5 rounded">{editTarget.clave}</code></p>
                </div>
                <button onClick={() => setEditTarget(null)} disabled={isSaving}
                  className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-alt transition-colors disabled:opacity-40">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleEditar} className="p-6 space-y-4">
                <div>
                  <label htmlFor="gh-e-titulo" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Título</label>
                  <input id="gh-e-titulo" type="text" value={form.titulo}
                    onChange={(e) => { setForm((f) => ({ ...f, titulo: e.target.value })); setFormError(null) }}
                    className="w-full px-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800/10 focus:border-primary-800 transition" />
                </div>
                <div>
                  <label htmlFor="gh-e-tag" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Tag</label>
                  <input id="gh-e-tag" type="text" value={form.tag}
                    onChange={(e) => { setForm((f) => ({ ...f, tag: e.target.value })); setFormError(null) }}
                    className="w-full px-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800/10 focus:border-primary-800 transition" />
                </div>
                <div>
                  <label htmlFor="gh-e-vis" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Visibilidad</label>
                  <select id="gh-e-vis" value={form.visibilidad}
                    onChange={(e) => setForm((f) => ({ ...f, visibilidad: e.target.value as VisibilidadHerramienta }))}
                    className="w-full px-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800/10 focus:border-primary-800 transition">
                    <option value="publico">Público — cualquiera, incluido visitante sin sesión</option>
                    <option value="usuarios">Usuarios de la plataforma — requiere sesión iniciada</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="gh-e-desc" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Descripción</label>
                  <textarea id="gh-e-desc" rows={3} value={form.descripcion}
                    onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800/10 focus:border-primary-800 transition resize-none" />
                </div>
                {formError && <p className="text-xs text-red-500">{formError}</p>}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setEditTarget(null)} disabled={isSaving}
                    className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 hover:text-primary-800 disabled:opacity-40 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSaving}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
                    {isSaving ? 'Guardando…' : 'Guardar cambios'}
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
              <h3 className="text-base font-bold text-text mb-2">Eliminar herramienta</h3>
              <p className="text-sm text-text-muted mb-6">
                ¿Seguro que deseas eliminar <strong className="text-text">"{deleteTarget.titulo}"</strong> de /herramientas?
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
