import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Loader2, AlertCircle, Plus, Trash2, Globe, Users, ShieldCheck,
  Layers, Map as MapIcon, Palette, Eye, Search, MapPinned,
} from 'lucide-react'
import { panelAnim } from '@/lib/animations'
import { getApiErrorMessage } from '@/lib/apiError'
import { useConexionesGeoserverList, useWorkspacesDeConexion } from '@/hooks/useConexionesGeoserver'
import { useCreateGeovisor, useUpdateGeovisor } from '@/hooks/useGeovisores'
import type { GeovisorRaw, GeovisorInput, MapaVisibilidad, CapaWorkspace } from '@/types'
import type { FormErrors } from '@/types/forms'

const BASEMAPS = [
  { id: 'calles', label: 'Calles' },
  { id: 'claro', label: 'Claro' },
  { id: 'oscuro', label: 'Oscuro' },
  { id: 'satelite', label: 'Satélite' },
  { id: 'hibrido', label: 'Híbrido' },
  { id: 'topografico', label: 'Topográfico' },
  { id: 'relieve', label: 'Relieve' },
]

const VISIBILIDAD = [
  { value: 'publico', label: 'Público', desc: 'Visible para todos', Icon: Globe, border: 'border-primary-600', bg: 'bg-primary-600/8', text: 'text-primary-700' },
  { value: 'usuarios', label: 'Usuarios', desc: 'Solo usuarios registrados', Icon: Users, border: 'border-gold-400', bg: 'bg-gold-400/10', text: 'text-gold-400' },
  { value: 'acreditados', label: 'Acreditados', desc: 'Investigadores y admins', Icon: ShieldCheck, border: 'border-magenta', bg: 'bg-magenta/10', text: 'text-magenta' },
] as const

const PALETA_AUTO = ['#1B4332', '#B08D57', '#C0357C', '#2563EB', '#B45309', '#0F766E', '#7C3AED', '#DC2626']

type PresetForm = { nombre: string; geometriaJson: string }
type CampoPopupForm = { campo: string; alias: string }

interface FormState {
  titulo: string
  subtitulo: string
  descripcion: string
  cita: string
  categoria: string
  conexionGeoserverId: string
  /** IDs de capa ("workspace:layername") — pueden venir de distintos workspaces/temas. */
  capasSeleccionadas: string[]
  colorPorTema: Record<string, string>
  centroLat: string
  centroLng: string
  zoomInicial: string
  basemapDefecto: string
  areaMaxHa: string
  presetsArea: PresetForm[]
  visibilidad: MapaVisibilidad
  thumbnailUrl: string
  mostrarMetricas: boolean
  mostrarImagenes: boolean
  campoImagenUrl: string
  camposPopup: CampoPopupForm[]
}

function emptyForm(): FormState {
  return {
    titulo: '', subtitulo: '', descripcion: '', cita: '', categoria: '',
    conexionGeoserverId: '', capasSeleccionadas: [], colorPorTema: {},
    centroLat: '5.55', centroLng: '-76.6', zoomInicial: '8', basemapDefecto: 'calles',
    areaMaxHa: '', presetsArea: [], visibilidad: 'publico',
    thumbnailUrl: '', mostrarMetricas: true, mostrarImagenes: false, campoImagenUrl: '',
    camposPopup: [],
  }
}

function formFromGeovisor(g: GeovisorRaw): FormState {
  return {
    titulo: g.titulo, subtitulo: g.subtitulo ?? '', descripcion: g.descripcion ?? '',
    cita: g.cita ?? '', categoria: g.categoria ?? '',
    conexionGeoserverId: g.conexionGeoserverId, capasSeleccionadas: g.capasSeleccionadas,
    colorPorTema: g.colorPorTema, centroLat: String(g.centro.lat), centroLng: String(g.centro.lng),
    zoomInicial: String(g.zoomInicial), basemapDefecto: g.basemapDefecto,
    areaMaxHa: g.areaMaxHa != null ? String(g.areaMaxHa) : '',
    presetsArea: g.presetsArea.map((p) => ({ nombre: p.nombre, geometriaJson: JSON.stringify(p.geometria, null, 2) })),
    visibilidad: g.visibilidad, thumbnailUrl: g.thumbnailUrl ?? '',
    mostrarMetricas: g.presentacion.mostrarMetricas, mostrarImagenes: g.presentacion.mostrarImagenes,
    campoImagenUrl: g.presentacion.campoImagenUrl ?? '', camposPopup: g.presentacion.camposPopup,
  }
}

/** Workspace ("tema") al que pertenece una capa, a partir de su id "workspace:layername". */
function workspaceDeCapa(capaId: string): string {
  return capaId.split(':')[0] ?? capaId
}

function Section({ n, title, hint, icon: Icon, children }: {
  n: number
  title: string
  hint: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-start gap-2.5">
        <div className="w-6 h-6 rounded-full bg-primary-800 text-white text-[0.65rem] font-bold flex items-center justify-center shrink-0 mt-0.5">
          {n}
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-text flex items-center gap-1.5">
            <Icon className="w-3.5 h-3.5 text-primary-700 shrink-0" aria-hidden="true" />
            {title}
          </h4>
          <p className="text-xs text-text-muted mt-0.5">{hint}</p>
        </div>
      </div>
      <div className="pl-8.5 space-y-3">{children}</div>
    </section>
  )
}

const inputCls = (invalid?: boolean) =>
  `w-full px-3 py-2.5 bg-[var(--card-bg)] border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${
    invalid ? 'border-red-400' : 'border-border focus:border-primary-800'
  }`
const labelCls = 'block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5'

export default function GeovisorFormModal({ open, editing, onClose, onSaved }: {
  open: boolean
  editing: GeovisorRaw | null
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const { data: conexiones = [] } = useConexionesGeoserverList()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [filtroCapa, setFiltroCapa] = useState('')

  const { data: workspaces = [], isFetching: loadingWorkspaces } = useWorkspacesDeConexion(form.conexionGeoserverId || null)

  const createGeovisor = useCreateGeovisor()
  const updateGeovisor  = useUpdateGeovisor()
  const isSaving = createGeovisor.isPending || updateGeovisor.isPending

  useEffect(() => {
    if (!open) return
    setForm(editing ? formFromGeovisor(editing) : emptyForm())
    setErrors({})
    setFiltroCapa('')
  }, [open, editing])

  // Geovisores creados antes del picker de capas sueltas solo guardan
  // workspacesGeoserver (todo-o-nada por tema) — al editarlos, en cuanto carga
  // el catálogo de la conexión, se preseleccionan las capas equivalentes para
  // que el picker refleje fielmente la configuración actual en vez de verse
  // vacío. Guardar sin tocar nada convierte esa selección a capasSeleccionadas
  // explícitas (deja de seguir automáticamente capas nuevas que se agreguen
  // luego a ese workspace) — comportamiento intencional del nuevo modelo, no
  // un bug: es lo que dice el aviso junto al picker.
  useEffect(() => {
    if (!open || !editing) return
    if (editing.capasSeleccionadas.length > 0) return
    if (workspaces.length === 0) return
    const workspacesLegado = editing.workspacesGeoserver
    const capasLegado = workspaces
      .filter((w) => workspacesLegado.length === 0 || workspacesLegado.includes(w.id))
      .flatMap((w) => w.capas.map((c) => c.id))
    if (capasLegado.length === 0) return
    setForm((f) => (f.capasSeleccionadas.length > 0 ? f : { ...f, capasSeleccionadas: capasLegado }))
  }, [open, editing, workspaces])

  const capasPorId = useMemo(() => {
    const mapa = new Map<string, CapaWorkspace & { workspaceId: string; workspaceNombre: string }>()
    for (const w of workspaces) {
      for (const c of w.capas) mapa.set(c.id, { ...c, workspaceId: w.id, workspaceNombre: w.nombre })
    }
    return mapa
  }, [workspaces])

  const gruposFiltrados = useMemo(() => {
    const q = filtroCapa.trim().toLowerCase()
    return workspaces
      .map((w) => ({
        ...w,
        capas: q ? w.capas.filter((c) => c.nombre.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)) : w.capas,
      }))
      .filter((w) => w.capas.length > 0)
  }, [workspaces, filtroCapa])

  const toggleCapa = (id: string) => {
    setForm((f) => ({
      ...f,
      capasSeleccionadas: f.capasSeleccionadas.includes(id)
        ? f.capasSeleccionadas.filter((c) => c !== id)
        : [...f.capasSeleccionadas, id],
    }))
  }

  // Temas representados por la selección actual — de aquí sale la lista de la
  // sección "Color por tema" (antes salía de workspacesGeoserver directo).
  const temasSeleccionados = useMemo(
    () => [...new Set(form.capasSeleccionadas.map((id) => capasPorId.get(id)?.workspaceId ?? workspaceDeCapa(id)))],
    [form.capasSeleccionadas, capasPorId],
  )

  const setColor = (workspaceId: string, color: string) => {
    setForm((f) => ({ ...f, colorPorTema: { ...f.colorPorTema, [workspaceId]: color } }))
  }

  const addPreset = () => setForm((f) => ({
    ...f, presetsArea: [...f.presetsArea, { nombre: '', geometriaJson: '' }],
  }))
  const updatePreset = (i: number, patch: Partial<PresetForm>) => setForm((f) => ({
    ...f, presetsArea: f.presetsArea.map((p, idx) => idx === i ? { ...p, ...patch } : p),
  }))
  const removePreset = (i: number) => setForm((f) => ({
    ...f, presetsArea: f.presetsArea.filter((_, idx) => idx !== i),
  }))

  const addCampoPopup = () => setForm((f) => ({
    ...f, camposPopup: [...f.camposPopup, { campo: '', alias: '' }],
  }))
  const updateCampoPopup = (i: number, patch: Partial<CampoPopupForm>) => setForm((f) => ({
    ...f, camposPopup: f.camposPopup.map((c, idx) => idx === i ? { ...c, ...patch } : c),
  }))
  const removeCampoPopup = (i: number) => setForm((f) => ({
    ...f, camposPopup: f.camposPopup.filter((_, idx) => idx !== i),
  }))

  function validate(): GeovisorInput | null {
    const e: FormErrors = {}
    if (form.titulo.trim().length < 3) e.titulo = 'Mínimo 3 caracteres'
    if (!form.conexionGeoserverId) e.conexionGeoserverId = 'Elige una conexión GeoServer'

    const centroLat = Number(form.centroLat)
    const centroLng = Number(form.centroLng)
    if (!Number.isFinite(centroLat) || centroLat < -90 || centroLat > 90) e.centroLat = 'Latitud inválida (-90 a 90)'
    if (!Number.isFinite(centroLng) || centroLng < -180 || centroLng > 180) e.centroLng = 'Longitud inválida (-180 a 180)'

    const zoomInicial = Number(form.zoomInicial)
    if (!Number.isInteger(zoomInicial) || zoomInicial < 0 || zoomInicial > 22) e.zoomInicial = 'Zoom entre 0 y 22'

    let areaMaxHa: number | undefined
    if (form.areaMaxHa.trim()) {
      areaMaxHa = Number(form.areaMaxHa)
      if (!Number.isFinite(areaMaxHa) || areaMaxHa <= 0) e.areaMaxHa = 'Debe ser un número positivo'
    }

    const presetsArea: GeovisorInput['presetsArea'] = []
    form.presetsArea.forEach((p, i) => {
      if (!p.nombre.trim()) { e[`preset-${i}`] = 'El preset necesita un nombre'; return }
      try {
        const geometria = JSON.parse(p.geometriaJson)
        if (geometria?.type !== 'Polygon' && geometria?.type !== 'MultiPolygon') {
          e[`preset-${i}`] = 'La geometría debe ser Polygon o MultiPolygon (GeoJSON)'
          return
        }
        if (!Array.isArray(geometria.coordinates)) {
          e[`preset-${i}`] = 'La geometría debe tener "coordinates"'
          return
        }
        presetsArea.push({ nombre: p.nombre.trim(), geometria })
      } catch {
        e[`preset-${i}`] = 'JSON de geometría inválido'
      }
    })

    const camposPopup: GeovisorInput['presentacion']['camposPopup'] = []
    form.camposPopup.forEach((c, i) => {
      if (!c.campo.trim() || !c.alias.trim()) {
        e[`campo-${i}`] = 'Completa el campo y su alias (o elimina la fila)'
        return
      }
      camposPopup.push({ campo: c.campo.trim(), alias: c.alias.trim() })
    })

    if (form.mostrarImagenes && !form.campoImagenUrl.trim()) {
      e.campoImagenUrl = 'Indica qué atributo trae la URL de la imagen'
    }

    setErrors(e)
    if (Object.keys(e).length) return null

    return {
      titulo: form.titulo.trim(),
      subtitulo: form.subtitulo.trim() || undefined,
      descripcion: form.descripcion.trim() || undefined,
      cita: form.cita.trim() || undefined,
      categoria: form.categoria.trim() || undefined,
      conexionGeoserverId: form.conexionGeoserverId,
      // workspacesGeoserver queda como derivado informativo/de compatibilidad —
      // capasSeleccionadas es la fuente de verdad real desde este formulario
      // (ver capaPermitidaEnGeovisor() en el backend).
      workspacesGeoserver: temasSeleccionados,
      capasSeleccionadas: form.capasSeleccionadas,
      colorPorTema: Object.fromEntries(
        Object.entries(form.colorPorTema).filter(([id]) => temasSeleccionados.includes(id)),
      ),
      centroLat, centroLng, zoomInicial,
      basemapDefecto: form.basemapDefecto,
      areaMaxHa,
      presetsArea,
      visibilidad: form.visibilidad,
      thumbnailUrl: form.thumbnailUrl.trim() || undefined,
      presentacion: {
        mostrarMetricas: form.mostrarMetricas,
        mostrarImagenes: form.mostrarImagenes,
        campoImagenUrl: form.mostrarImagenes ? form.campoImagenUrl.trim() : undefined,
        camposPopup,
      },
    }
  }

  const handleSubmit = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    const payload = validate()
    if (!payload) return
    try {
      if (editing) {
        await updateGeovisor.mutateAsync({ id: editing.id, data: payload })
        onSaved(`Geovisor "${payload.titulo}" actualizado`)
      } else {
        await createGeovisor.mutateAsync(payload)
        onSaved(`Geovisor "${payload.titulo}" creado`)
      }
    } catch (err) {
      setErrors((prev) => ({ ...prev, _root: getApiErrorMessage(err, 'No se pudo guardar el geovisor') }))
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget && !isSaving) onClose() }}
        >
          <motion.div {...panelAnim} className="bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-3xl my-8">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border sticky top-0 bg-[var(--card-bg)] rounded-t-2xl z-10">
              <div>
                <h3 className="text-base font-bold text-text">{editing ? 'Editar geovisor' : 'Nuevo geovisor'}</h3>
                <p className="text-xs text-text-muted mt-0.5">Configura la plantilla — sin tocar código.</p>
              </div>
              <button onClick={onClose} disabled={isSaving}
                className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-alt transition-colors disabled:opacity-40">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-7">
              {errors._root && (
                <p className="flex items-center gap-2 text-xs text-red-600 bg-red/10 border border-red-300/40 rounded-lg px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />{errors._root}
                </p>
              )}

              {/* ── 1. Información general ── */}
              <Section n={1} title="Información general" hint="Cómo se presenta este geovisor en el portal público" icon={Layers}>
                <div>
                  <label htmlFor="gv-titulo" className={labelCls}>Título <span className="text-orange-500" aria-hidden="true">*</span></label>
                  <input id="gv-titulo" type="text" value={form.titulo} autoFocus placeholder="Ej: Geología del Chocó"
                    onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                    className={inputCls(!!errors.titulo)} />
                  {errors.titulo && <p className="text-xs text-red-500 mt-1">{errors.titulo}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="gv-subtitulo" className={labelCls}>Subtítulo</label>
                    <input id="gv-subtitulo" type="text" value={form.subtitulo}
                      onChange={(e) => setForm((f) => ({ ...f, subtitulo: e.target.value }))} className={inputCls()} />
                  </div>
                  <div>
                    <label htmlFor="gv-categoria" className={labelCls}>Categoría</label>
                    <input id="gv-categoria" type="text" value={form.categoria} placeholder="Ej: Geología"
                      onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))} className={inputCls()} />
                  </div>
                </div>
                <div>
                  <label htmlFor="gv-descripcion" className={labelCls}>Descripción</label>
                  <textarea id="gv-descripcion" rows={2} value={form.descripcion}
                    onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} className={inputCls()} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="gv-cita" className={labelCls}>Cita sugerida</label>
                    <input id="gv-cita" type="text" value={form.cita}
                      onChange={(e) => setForm((f) => ({ ...f, cita: e.target.value }))} className={inputCls()} />
                  </div>
                  <div>
                    <label htmlFor="gv-thumb" className={labelCls}>URL de portada</label>
                    <input id="gv-thumb" type="text" value={form.thumbnailUrl}
                      onChange={(e) => setForm((f) => ({ ...f, thumbnailUrl: e.target.value }))} className={inputCls()} />
                  </div>
                </div>
              </Section>

              {/* ── 2. Conexión + capas ── */}
              <Section n={2} title="Conexión GeoServer y capas" hint="De aquí se descubren en vivo las capas disponibles" icon={Globe}>
                <div>
                  <label htmlFor="gv-conexion" className={labelCls}>Conexión <span className="text-orange-500" aria-hidden="true">*</span></label>
                  <select id="gv-conexion" value={form.conexionGeoserverId}
                    onChange={(e) => setForm((f) => ({ ...f, conexionGeoserverId: e.target.value, capasSeleccionadas: [], colorPorTema: {} }))}
                    className={inputCls(!!errors.conexionGeoserverId)}>
                    <option value="">Selecciona una conexión…</option>
                    {conexiones.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                  {errors.conexionGeoserverId && <p className="text-xs text-red-500 mt-1">{errors.conexionGeoserverId}</p>}
                </div>

                {!form.conexionGeoserverId ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-8 px-4 border border-dashed border-border rounded-xl text-center">
                    <MapPinned className="w-6 h-6 text-text-faint" aria-hidden="true" />
                    <p className="text-sm text-text-muted">Elige una conexión GeoServer para ver la vista previa en vivo de sus capas.</p>
                  </div>
                ) : (
                  <div>
                    <label className={labelCls}>
                      Capas <span className="font-normal normal-case tracking-normal text-text-muted">(ninguna seleccionada = todas las capas de la conexión)</span>
                    </label>
                    {loadingWorkspaces ? (
                      <p className="text-xs text-text-muted flex items-center gap-2 py-4"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Descubriendo capas…</p>
                    ) : workspaces.length === 0 ? (
                      <p className="text-xs text-text-muted py-4">Esta conexión no publica capas todavía.</p>
                    ) : (
                      <>
                        <div className="relative mb-2">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-faint" aria-hidden="true" />
                          <input type="text" value={filtroCapa} onChange={(e) => setFiltroCapa(e.target.value)}
                            placeholder="Buscar capa por nombre…"
                            className="w-full pl-8 pr-3 py-2 bg-[var(--card-bg)] border border-border rounded-lg text-xs focus:outline-none focus:border-primary-800 transition" />
                        </div>
                        {gruposFiltrados.length === 0 ? (
                          <p className="text-xs text-text-muted py-3 text-center">Ninguna capa coincide con "{filtroCapa}".</p>
                        ) : (
                          <div className="max-h-64 overflow-y-auto pr-1 space-y-3">
                            {gruposFiltrados.map((w) => (
                              <div key={w.id}>
                                <p className="text-[0.62rem] font-bold uppercase tracking-wider text-text-faint mb-1 px-0.5">{w.nombre}</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                  {w.capas.map((c) => {
                                    const checked = form.capasSeleccionadas.includes(c.id)
                                    return (
                                      <label key={c.id}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                                          checked ? 'border-primary-600 bg-primary-600/8 text-primary-800' : 'border-border hover:bg-bg-alt text-text'
                                        }`}>
                                        <input type="checkbox" checked={checked} onChange={() => toggleCapa(c.id)}
                                          className="w-3.5 h-3.5 rounded border-border text-primary-800 focus:ring-primary-800/30 shrink-0" />
                                        <span className="truncate flex-1">{c.nombre}</span>
                                        <span className={`text-[0.58rem] font-semibold uppercase px-1.5 py-0.5 rounded-full shrink-0 ${
                                          c.tipo === 'raster' ? 'bg-gold-500/12 text-gold-500' : 'bg-primary-500/12 text-primary-500'
                                        }`}>{c.tipo === 'raster' ? 'raster' : 'vector'}</span>
                                      </label>
                                    )
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-[0.65rem] text-text-muted mt-2">
                          {form.capasSeleccionadas.length === 0
                            ? 'Sin selección — el geovisor mostrará todas las capas de esta conexión.'
                            : `${form.capasSeleccionadas.length} capa${form.capasSeleccionadas.length === 1 ? '' : 's'} seleccionada${form.capasSeleccionadas.length === 1 ? '' : 's'}, de ${temasSeleccionados.length} tema${temasSeleccionados.length === 1 ? '' : 's'} distinto${temasSeleccionados.length === 1 ? '' : 's'}.`}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </Section>

              {/* ── 3. Mapa ── */}
              <Section n={3} title="Mapa" hint="Vista inicial al abrir el geovisor" icon={MapIcon}>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="gv-lat" className={labelCls}>Latitud centro</label>
                    <input id="gv-lat" type="number" step="any" value={form.centroLat}
                      onChange={(e) => setForm((f) => ({ ...f, centroLat: e.target.value }))} className={inputCls(!!errors.centroLat)} />
                    {errors.centroLat && <p className="text-xs text-red-500 mt-1">{errors.centroLat}</p>}
                  </div>
                  <div>
                    <label htmlFor="gv-lng" className={labelCls}>Longitud centro</label>
                    <input id="gv-lng" type="number" step="any" value={form.centroLng}
                      onChange={(e) => setForm((f) => ({ ...f, centroLng: e.target.value }))} className={inputCls(!!errors.centroLng)} />
                    {errors.centroLng && <p className="text-xs text-red-500 mt-1">{errors.centroLng}</p>}
                  </div>
                  <div>
                    <label htmlFor="gv-zoom" className={labelCls}>Zoom inicial</label>
                    <input id="gv-zoom" type="number" min={0} max={22} value={form.zoomInicial}
                      onChange={(e) => setForm((f) => ({ ...f, zoomInicial: e.target.value }))} className={inputCls(!!errors.zoomInicial)} />
                    {errors.zoomInicial && <p className="text-xs text-red-500 mt-1">{errors.zoomInicial}</p>}
                  </div>
                </div>
                <div>
                  <label htmlFor="gv-basemap" className={labelCls}>Mapa base por defecto</label>
                  <select id="gv-basemap" value={form.basemapDefecto}
                    onChange={(e) => setForm((f) => ({ ...f, basemapDefecto: e.target.value }))} className={inputCls()}>
                    {BASEMAPS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
                  </select>
                </div>
              </Section>

              {/* ── 4. Área de interés ── */}
              <Section n={4} title="Área de interés" hint="Límite opcional de tamaño y atajos de zona predefinidos" icon={MapIcon}>
                <div>
                  <label htmlFor="gv-area-max" className={labelCls}>
                    Área máxima <span className="font-normal normal-case tracking-normal text-text-muted">(hectáreas, opcional)</span>
                  </label>
                  <input id="gv-area-max" type="number" min={0} step="any" value={form.areaMaxHa}
                    onChange={(e) => setForm((f) => ({ ...f, areaMaxHa: e.target.value }))} className={inputCls(!!errors.areaMaxHa)} />
                  {errors.areaMaxHa && <p className="text-xs text-red-500 mt-1">{errors.areaMaxHa}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={labelCls}>Presets de área (GeoJSON)</label>
                    <button type="button" onClick={addPreset}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary-800 hover:text-primary-700">
                      <Plus className="w-3.5 h-3.5" /> Agregar preset
                    </button>
                  </div>
                  {form.presetsArea.map((p, i) => (
                    <div key={i} className="border border-border rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <input type="text" value={p.nombre} placeholder="Nombre del preset"
                          onChange={(e) => updatePreset(i, { nombre: e.target.value })}
                          className={inputCls()} />
                        <button type="button" onClick={() => removePreset(i)} title="Eliminar preset"
                          className="p-2 rounded-lg text-text-muted hover:text-red-dark hover:bg-red/10 transition-colors shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <textarea rows={3} value={p.geometriaJson} placeholder='{"type":"Polygon","coordinates":[[[...]]]}'
                        onChange={(e) => updatePreset(i, { geometriaJson: e.target.value })}
                        className={`${inputCls()} font-mono text-xs`} />
                      {errors[`preset-${i}`] && <p className="text-xs text-red-500">{errors[`preset-${i}`]}</p>}
                    </div>
                  ))}
                </div>
              </Section>

              {/* ── 5. Colores por tema ── */}
              <Section n={5} title="Color por tema" hint="Identifica cada workspace en leyendas y tarjetas de capa" icon={Palette}>
                {temasSeleccionados.length === 0 ? (
                  <p className="text-xs text-text-muted">Selecciona una o más capas en la sección 2 para asignarles color por tema.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {temasSeleccionados.map((id, i) => {
                      const nombre = workspaces.find((w) => w.id === id)?.nombre ?? id
                      const color = form.colorPorTema[id] ?? PALETA_AUTO[i % PALETA_AUTO.length]
                      return (
                        <div key={id} className="flex items-center gap-2.5 px-3 py-2 border border-border rounded-lg">
                          <input type="color" value={color} onChange={(e) => setColor(id, e.target.value)}
                            className="w-7 h-7 rounded-md border border-border cursor-pointer shrink-0" />
                          <span className="text-xs text-text truncate flex-1">{nombre}</span>
                          <span className="text-[0.6rem] text-text-muted font-mono shrink-0">{color}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Section>

              {/* ── 6. Visibilidad + presentación ── */}
              <Section n={6} title="Visibilidad y presentación" hint="Quién lo ve, y cómo se muestra la información de cada capa" icon={Eye}>
                <div>
                  <label className={labelCls}>Visibilidad</label>
                  <div className="grid grid-cols-3 gap-2">
                    {VISIBILIDAD.map(({ value, label, desc, Icon, border, bg, text }) => {
                      const active = form.visibilidad === value
                      return (
                        <button key={value} type="button" onClick={() => setForm((f) => ({ ...f, visibilidad: value }))}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${active ? `${border} ${bg}` : 'border-border bg-[var(--card-bg)] hover:bg-bg-alt'}`}>
                          <Icon className={`w-4 h-4 ${active ? text : 'text-text-muted'}`} />
                          <span className={`text-[0.65rem] font-bold uppercase tracking-wide ${active ? text : 'text-text-muted'}`}>{label}</span>
                          <span className="text-[0.6rem] text-text-muted leading-tight hidden sm:block">{desc}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <label className="flex items-center gap-2.5 text-sm text-text cursor-pointer select-none">
                  <input type="checkbox" checked={form.mostrarMetricas}
                    onChange={(e) => setForm((f) => ({ ...f, mostrarMetricas: e.target.checked }))}
                    className="w-4 h-4 rounded border-border text-primary-800 focus:ring-primary-800/30" />
                  Mostrar métricas (área, conteo de elementos) al medir o consultar una capa
                </label>

                <label className="flex items-center gap-2.5 text-sm text-text cursor-pointer select-none">
                  <input type="checkbox" checked={form.mostrarImagenes}
                    onChange={(e) => setForm((f) => ({ ...f, mostrarImagenes: e.target.checked }))}
                    className="w-4 h-4 rounded border-border text-primary-800 focus:ring-primary-800/30" />
                  Mostrar imágenes en el popup (solo si las capas traen un atributo con URL de foto)
                </label>
                {form.mostrarImagenes && (
                  <div>
                    <label htmlFor="gv-campo-img" className={labelCls}>Atributo con la URL de la imagen</label>
                    <input id="gv-campo-img" type="text" value={form.campoImagenUrl} placeholder="Ej: foto_url"
                      onChange={(e) => setForm((f) => ({ ...f, campoImagenUrl: e.target.value }))}
                      className={inputCls(!!errors.campoImagenUrl)} />
                    {errors.campoImagenUrl && <p className="text-xs text-red-500 mt-1">{errors.campoImagenUrl}</p>}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={labelCls}>
                      Atributos a mostrar en el popup <span className="font-normal normal-case tracking-normal text-text-muted">(vacío = mostrar todos los atributos crudos)</span>
                    </label>
                    <button type="button" onClick={addCampoPopup}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary-800 hover:text-primary-700">
                      <Plus className="w-3.5 h-3.5" /> Agregar atributo
                    </button>
                  </div>
                  {form.camposPopup.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="text" value={c.campo} placeholder="Atributo (ej: MGUCR_SIMBL)"
                        onChange={(e) => updateCampoPopup(i, { campo: e.target.value })} className={inputCls()} />
                      <input type="text" value={c.alias} placeholder="Nombre legible (ej: Símbolo cronoestratigráfico)"
                        onChange={(e) => updateCampoPopup(i, { alias: e.target.value })} className={inputCls()} />
                      <button type="button" onClick={() => removeCampoPopup(i)} title="Eliminar"
                        className="p-2 rounded-lg text-text-muted hover:text-red-dark hover:bg-red/10 transition-colors shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {errors[`campo-${i}`] && <p className="text-xs text-red-500 col-span-2">{errors[`campo-${i}`]}</p>}
                    </div>
                  ))}
                </div>
              </Section>

              <div className="flex gap-3 pt-2 sticky bottom-0 bg-[var(--card-bg)] pb-1 -mb-1">
                <button type="button" onClick={onClose} disabled={isSaving}
                  className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 hover:text-primary-800 disabled:opacity-40 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {isSaving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear geovisor'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
