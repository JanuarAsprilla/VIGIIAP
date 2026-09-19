import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import {
  X, Loader2, AlertCircle, Plus, Trash2, Globe, Users, ShieldCheck,
  Layers, Map as MapIcon, Eye, Search, MapPinned, ChevronRight,
} from 'lucide-react'
import { panelAnim } from '@/lib/animations'
import { getApiErrorMessage } from '@/lib/apiError'
import { useConexionesGeoserverList, useWorkspacesDeConexion } from '@/hooks/useConexionesGeoserver'
import { useCreateGeovisor, useUpdateGeovisor } from '@/hooks/useGeovisores'
import { useCategoriasList, useCreateCategoria } from '@/hooks/useCategorias'
import Switch from '@/components/ui/Switch'
import AccordionSection from './AccordionSection'
import GeovisorMapaConstructor from './GeovisorMapaConstructor'
import CategoryCombobox from '@/components/admin/CategoryCombobox'
import type { GeovisorRaw, GeovisorInput, MapaVisibilidad, PresetArea, WorkspaceOption } from '@/types'
import type { FormErrors } from '@/types/forms'

type CapaWorkspace = WorkspaceOption['capas'][number]

/** Workspace ("tema") al que pertenece una capa, a partir de su id "workspace:layername". */
function workspaceDeCapa(capaId: string): string {
  return capaId.split(':')[0] ?? capaId
}

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
  centroLat: number
  centroLng: number
  zoomInicial: number
  basemapDefecto: string
  areaMaxHa: string
  presetsArea: PresetArea[]
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
    centroLat: 5.55, centroLng: -76.6, zoomInicial: 8, basemapDefecto: 'calles',
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
    colorPorTema: g.colorPorTema, centroLat: g.centro.lat, centroLng: g.centro.lng,
    zoomInicial: g.zoomInicial, basemapDefecto: g.basemapDefecto,
    areaMaxHa: g.areaMaxHa != null ? String(g.areaMaxHa) : '',
    presetsArea: g.presetsArea,
    visibilidad: g.visibilidad, thumbnailUrl: g.thumbnailUrl ?? '',
    mostrarMetricas: g.presentacion.mostrarMetricas, mostrarImagenes: g.presentacion.mostrarImagenes,
    campoImagenUrl: g.presentacion.campoImagenUrl ?? '', camposPopup: g.presentacion.camposPopup,
  }
}

const inputCls = (invalid?: boolean) =>
  `w-full px-3 py-2.5 bg-[var(--card-bg)] border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${
    invalid ? 'border-red-400' : 'border-border focus:border-primary-800'
  }`
const labelCls = 'block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5'

export default function GeovisorFormBody({ editing, onClose, onSaved }: {
  editing: GeovisorRaw | null
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const [form, setForm] = useState<FormState>(() => editing ? formFromGeovisor(editing) : emptyForm())
  const [errors, setErrors] = useState<FormErrors>({})
  const [filtroCapa, setFiltroCapa] = useState('')
  // Al editar, los temas con capas ya elegidas empiezan abiertos — si no, el
  // admin tendría que expandirlos a mano solo para ver su propia selección.
  const [temasExpandidos, setTemasExpandidos] = useState<Set<string>>(
    () => new Set(editing ? editing.capasSeleccionadas.map(workspaceDeCapa) : []),
  )

  const { data: conexiones = [] } = useConexionesGeoserverList()
  const { data: workspaces = [], isFetching: loadingWorkspaces } = useWorkspacesDeConexion(form.conexionGeoserverId || null)
  // Categorías del módulo compartido — geovisores.categoria tiene FK a
  // categorias(nombre) en el backend, así que solo se puede elegir entre
  // estas o crear una nueva explícitamente (ver handleSubmit).
  const { data: categoriasCompartidas = [] } = useCategoriasList()
  const createCategoria = useCreateCategoria()

  const createGeovisor = useCreateGeovisor()
  const updateGeovisor = useUpdateGeovisor()
  const isSaving = createGeovisor.isPending || updateGeovisor.isPending

  // Geovisores creados antes del picker de capas sueltas solo guardan
  // workspacesGeoserver (todo-o-nada por tema) — al editarlos, en cuanto carga
  // el catálogo de la conexión, se preseleccionan las capas equivalentes para
  // que el picker refleje fielmente la configuración actual en vez de verse
  // vacío. Guardar sin tocar nada convierte esa selección a capasSeleccionadas
  // explícitas (deja de seguir automáticamente capas nuevas que se agreguen
  // luego a ese workspace) — comportamiento intencional del nuevo modelo.
  useEffect(() => {
    if (!editing) return
    if (editing.capasSeleccionadas.length > 0) return
    if (workspaces.length === 0) return
    const workspacesLegado = editing.workspacesGeoserver
    const capasLegado = workspaces
      .filter((w) => workspacesLegado.length === 0 || workspacesLegado.includes(w.id))
      .flatMap((w) => w.capas.map((c) => c.id))
    if (capasLegado.length === 0) return
    setForm((f) => (f.capasSeleccionadas.length > 0 ? f : { ...f, capasSeleccionadas: capasLegado }))
    setTemasExpandidos((prev) => new Set([...prev, ...capasLegado.map(workspaceDeCapa)]))
  }, [editing, workspaces])

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

  const toggleTema = (id: string) => setTemasExpandidos((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  // Temas representados por la selección actual — de aquí sale tanto la lista
  // de "Color por tema" como los workspaces que se le pasan al mapa en vivo.
  const temasSeleccionados = useMemo(
    () => [...new Set(form.capasSeleccionadas.map(workspaceDeCapa))],
    [form.capasSeleccionadas],
  )

  const setColor = (workspaceId: string, color: string) => {
    setForm((f) => ({ ...f, colorPorTema: { ...f.colorPorTema, [workspaceId]: color } }))
  }

  const agregarPreset = (preset: PresetArea) => setForm((f) => ({ ...f, presetsArea: [...f.presetsArea, preset] }))
  const eliminarPreset = (nombre: string) => setForm((f) => ({ ...f, presetsArea: f.presetsArea.filter((p) => p.nombre !== nombre) }))

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

    let areaMaxHa: number | undefined
    if (form.areaMaxHa.trim()) {
      areaMaxHa = Number(form.areaMaxHa)
      if (!Number.isFinite(areaMaxHa) || areaMaxHa <= 0) e.areaMaxHa = 'Debe ser un número positivo'
    }

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
      centroLat: form.centroLat, centroLng: form.centroLng, zoomInicial: form.zoomInicial,
      basemapDefecto: form.basemapDefecto,
      areaMaxHa,
      presetsArea: form.presetsArea,
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
      // Si la categoría escrita en el combobox no existe todavía en la tabla
      // compartida, se crea antes de guardar — de lo contrario la FK de
      // geovisores.categoria hace fallar el guardado con un error crudo de
      // Postgres en vez de uno claro.
      if (payload.categoria && !categoriasCompartidas.some(
        (c) => c.nombre.toLowerCase() === payload.categoria!.toLowerCase(),
      )) {
        await createCategoria.mutateAsync(payload.categoria)
      }
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

  // Filtra también .capas a las marcadas — pasar el workspace completo aquí
  // dispararía un WMSTileLayer por cada capa publicada en ese tema (todas,
  // no solo la elegida), saturando GeoServer con peticiones de más.
  const workspacesSeleccionados = workspaces
    .filter((w) => temasSeleccionados.includes(w.id))
    .map((w) => ({ ...w, capas: w.capas.filter((c) => form.capasSeleccionadas.includes(c.id)) }))

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget && !isSaving) onClose() }}
    >
      <motion.div
        {...panelAnim}
        className="bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-6xl my-8 flex flex-col lg:flex-row overflow-hidden"
        style={{ maxHeight: '90vh' }}
      >
        {/* ── Panel izquierdo: configuración ── */}
        <div className="flex flex-col min-h-0 lg:w-[26rem] lg:shrink-0 border-b lg:border-b-0 lg:border-r border-border">
          <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
            <div>
              <h3 className="text-base font-bold text-text">{editing ? 'Editar geovisor' : 'Nuevo geovisor'}</h3>
              <p className="text-xs text-text-muted mt-0.5">Configura la plantilla — mira el resultado en vivo a la derecha.</p>
            </div>
            <button onClick={onClose} disabled={isSaving}
              className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-alt transition-colors disabled:opacity-40">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3">
            {errors._root && (
              <p className="flex items-center gap-2 text-xs text-red-600 bg-red/10 border border-red-300/40 rounded-lg px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />{errors._root}
              </p>
            )}

            <AccordionSection n={1} title="Información general" hint="Cómo se presenta en el portal público" icon={Layers} defaultOpen>
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
                  <CategoryCombobox
                    id="gv-categoria"
                    value={form.categoria}
                    onChange={(cat) => setForm((f) => ({ ...f, categoria: cat }))}
                    options={categoriasCompartidas.map((c) => c.nombre)}
                  />
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
            </AccordionSection>

            <AccordionSection n={2} title="Conexión y capas" hint="Elige de dónde vienen los datos y qué mostrar" icon={Globe} defaultOpen>
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
              ) : loadingWorkspaces ? (
                <p className="text-xs text-text-muted flex items-center gap-2 py-4"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Descubriendo capas…</p>
              ) : workspaces.length === 0 ? (
                <p className="text-xs text-text-muted py-4">Esta conexión no publica capas todavía.</p>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-faint" aria-hidden="true" />
                    <input type="text" value={filtroCapa} onChange={(e) => setFiltroCapa(e.target.value)}
                      placeholder="Buscar capa por nombre…"
                      className="w-full pl-8 pr-3 py-2 bg-[var(--card-bg)] border border-border rounded-lg text-xs focus:outline-none focus:border-primary-800 transition" />
                  </div>
                  {gruposFiltrados.length === 0 ? (
                    <p className="text-xs text-text-muted py-3 text-center">Ninguna capa coincide con "{filtroCapa}".</p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {gruposFiltrados.map((w, i) => {
                        const activo = temasSeleccionados.includes(w.id)
                        const color = form.colorPorTema[w.id] ?? PALETA_AUTO[i % PALETA_AUTO.length]
                        // Con filtro de búsqueda activo se fuerza abierto para que los
                        // resultados sean visibles de inmediato, sin un clic extra.
                        const abierto = filtroCapa.trim() !== '' || temasExpandidos.has(w.id)
                        return (
                          <div key={w.id} className={`border rounded-lg overflow-hidden transition-colors ${activo ? 'border-primary-600 bg-primary-600/5' : 'border-border'}`}>
                            <div
                              role="button" tabIndex={0} aria-expanded={abierto}
                              onClick={() => toggleTema(w.id)}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTema(w.id) } }}
                              className="flex items-center gap-2.5 p-2.5 cursor-pointer select-none">
                              <ChevronRight aria-hidden="true"
                                className={`w-3.5 h-3.5 text-text-faint shrink-0 transition-transform ${abierto ? 'rotate-90' : ''}`} />
                              <span className="text-[0.62rem] font-bold uppercase tracking-wider text-text-faint flex-1 truncate">{w.nombre}</span>
                              <span className="text-[0.58rem] text-text-muted shrink-0">
                                {w.capas.length} capa{w.capas.length === 1 ? '' : 's'}
                              </span>
                              {activo && (
                                <>
                                  <input type="color" value={color} onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => setColor(w.id, e.target.value)}
                                    aria-label={`Color de ${w.nombre}`}
                                    className="w-5 h-5 rounded-md border border-border cursor-pointer shrink-0" />
                                  <span className="text-[0.58rem] text-text-muted font-mono shrink-0">{color}</span>
                                </>
                              )}
                            </div>
                            {abierto && (
                              <div className="space-y-1 px-2.5 pb-2.5">
                                {w.capas.map((c: CapaWorkspace) => {
                                  const checked = form.capasSeleccionadas.includes(c.id)
                                  return (
                                    <label key={c.id}
                                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                                        checked ? 'bg-primary-600/8 text-primary-800' : 'hover:bg-bg-alt text-text'
                                      }`}>
                                      <input type="checkbox" checked={checked} onChange={() => toggleCapa(c.id)}
                                        className="w-3.5 h-3.5 rounded border-border text-primary-800 focus:ring-primary-800/30 shrink-0" />
                                      <span className="truncate flex-1">{c.nombre}</span>
                                      <span className={`text-[0.55rem] font-semibold uppercase px-1.5 py-0.5 rounded-full shrink-0 ${
                                        c.tipo === 'raster' ? 'bg-gold-500/12 text-gold-500' : 'bg-primary-500/12 text-primary-500'
                                      }`}>{c.tipo === 'raster' ? 'raster' : 'vector'}</span>
                                    </label>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <p className="text-[0.65rem] text-text-muted">
                    {form.capasSeleccionadas.length === 0
                      ? 'Sin selección — el geovisor mostrará todas las capas de esta conexión.'
                      : `${form.capasSeleccionadas.length} capa${form.capasSeleccionadas.length === 1 ? '' : 's'} seleccionada${form.capasSeleccionadas.length === 1 ? '' : 's'}, de ${temasSeleccionados.length} tema${temasSeleccionados.length === 1 ? '' : 's'} distinto${temasSeleccionados.length === 1 ? '' : 's'}.`}
                  </p>
                </>
              )}
            </AccordionSection>

            <AccordionSection n={3} title="Mapa y área" hint="El mapa de la derecha ES el control — arrastra y haz zoom ahí" icon={MapIcon}>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div><span className="text-text-muted">Lat </span><span className="font-mono text-text">{form.centroLat}</span></div>
                <div><span className="text-text-muted">Lng </span><span className="font-mono text-text">{form.centroLng}</span></div>
                <div><span className="text-text-muted">Zoom </span><span className="font-mono text-text">{form.zoomInicial}</span></div>
              </div>
              <div>
                <label htmlFor="gv-basemap" className={labelCls}>Mapa base por defecto</label>
                <select id="gv-basemap" value={form.basemapDefecto}
                  onChange={(e) => setForm((f) => ({ ...f, basemapDefecto: e.target.value }))} className={inputCls()}>
                  {BASEMAPS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="gv-area-max" className={labelCls}>
                  Área máxima <span className="font-normal normal-case tracking-normal text-text-muted">(hectáreas, opcional)</span>
                </label>
                <input id="gv-area-max" type="number" min={0} step="any" value={form.areaMaxHa}
                  onChange={(e) => setForm((f) => ({ ...f, areaMaxHa: e.target.value }))} className={inputCls(!!errors.areaMaxHa)} />
                {errors.areaMaxHa && <p className="text-xs text-red-500 mt-1">{errors.areaMaxHa}</p>}
              </div>
              <p className="text-[0.65rem] text-text-muted leading-relaxed">
                {form.presetsArea.length > 0
                  ? `${form.presetsArea.length} preset${form.presetsArea.length === 1 ? '' : 's'} de área: ${form.presetsArea.map((p) => p.nombre).join(', ')}.`
                  : 'Dibuja presets de área directamente en el mapa con el botón "Dibujar preset de área".'}
              </p>
            </AccordionSection>

            <AccordionSection n={4} title="Visibilidad y presentación" hint="Quién lo ve, y cómo se muestra la información de cada capa" icon={Eye}>
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

              <div className="flex items-center justify-between">
                <span className="text-sm text-text">Mostrar métricas al medir o consultar una capa</span>
                <Switch checked={form.mostrarMetricas} onChange={(v) => setForm((f) => ({ ...f, mostrarMetricas: v }))} label="Mostrar métricas" />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-text">Mostrar imágenes en el popup</span>
                <Switch checked={form.mostrarImagenes} onChange={(v) => setForm((f) => ({ ...f, mostrarImagenes: v }))} label="Mostrar imágenes en el popup" />
              </div>
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
                    Atributos a mostrar en el popup <span className="font-normal normal-case tracking-normal text-text-muted">(vacío = todos)</span>
                  </label>
                  <button type="button" onClick={addCampoPopup}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary-800 hover:text-primary-700">
                    <Plus className="w-3.5 h-3.5" /> Agregar
                  </button>
                </div>
                {form.camposPopup.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="text" value={c.campo} placeholder="Atributo"
                      onChange={(e) => updateCampoPopup(i, { campo: e.target.value })} className={inputCls()} />
                    <input type="text" value={c.alias} placeholder="Nombre legible"
                      onChange={(e) => updateCampoPopup(i, { alias: e.target.value })} className={inputCls()} />
                    <button type="button" onClick={() => removeCampoPopup(i)} title="Eliminar" aria-label={`Eliminar atributo ${i + 1}`}
                      className="p-2 rounded-lg text-text-muted hover:text-red-dark hover:bg-red/10 transition-colors shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {errors[`campo-${i}`] && <p className="text-xs text-red-500 col-span-2">{errors[`campo-${i}`]}</p>}
                  </div>
                ))}
              </div>
            </AccordionSection>

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
        </div>

        {/* ── Panel derecho: vista previa en vivo ── */}
        <div className="flex-1 min-h-[320px] lg:min-h-0 relative">
          <GeovisorMapaConstructor
            conexionId={form.conexionGeoserverId || null}
            workspacesSeleccionados={workspacesSeleccionados}
            centroLat={form.centroLat}
            centroLng={form.centroLng}
            zoomInicial={form.zoomInicial}
            basemap={form.basemapDefecto}
            presetsArea={form.presetsArea}
            onMoverMapa={(lat, lng, zoom) => setForm((f) => ({ ...f, centroLat: lat, centroLng: lng, zoomInicial: zoom }))}
            onAgregarPreset={agregarPreset}
            onEliminarPreset={eliminarPreset}
          />
        </div>
      </motion.div>
    </div>
  )
}
