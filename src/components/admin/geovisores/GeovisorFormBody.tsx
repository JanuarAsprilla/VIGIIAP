import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { X, Loader2, AlertCircle, ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { panelAnim } from '@/lib/animations'
import { getApiErrorMessage } from '@/lib/apiError'
import { useConexionesGeoserverList, useWorkspacesDeConexion } from '@/hooks/useConexionesGeoserver'
import { useCreateGeovisor, useUpdateGeovisor, useUploadGeovisorThumbnail } from '@/hooks/useGeovisores'
import { useCategoriasList } from '@/hooks/useCategorias'
import { useCapasSinConfigFichas } from '@/hooks/useFichasPunto'
import GeovisorMapaConstructor from './GeovisorMapaConstructor'
import PasosGeovisor, { type PasoInfo } from './PasosGeovisor'
import PasoInformacion from './pasos/PasoInformacion'
import PasoCapas from './pasos/PasoCapas'
import PasoFichas from './pasos/PasoFichas'
import PasoMapa from './pasos/PasoMapa'
import PasoPublicar from './pasos/PasoPublicar'
import {
  emptyForm, formFromGeovisor, pasoDeError, workspaceDeCapa,
  type CapaWorkspace, type FormState, type PasoId,
} from './formState'
import { tipoDeGeovisor, capasVectorialesSeleccionadas, type TipoGeovisor } from './tiposGeovisor'
import type { GeovisorRaw, GeovisorInput, PresetArea } from '@/types'
import type { FormErrors } from '@/types/forms'

const ORDEN_PASOS: readonly PasoId[] = ['informacion', 'capas', 'fichas', 'mapa', 'publicar']
const ETIQUETA_PASO: Record<PasoId, string> = {
  informacion: 'Información', capas: 'Capas', fichas: 'Fichas', mapa: 'Mapa', publicar: 'Publicar',
}

export default function GeovisorFormBody({ editing, onClose, onSaved }: {
  editing: GeovisorRaw | null
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const [form, setForm] = useState<FormState>(() => editing ? formFromGeovisor(editing) : emptyForm())
  const [errors, setErrors] = useState<FormErrors>({})
  const [tipo, setTipo] = useState<TipoGeovisor>(() => tipoDeGeovisor(editing?.capasConFicha ?? []))
  const [paso, setPaso] = useState<PasoId>('informacion')
  const [uploadedThumb, setUploadedThumb] = useState<File | null>(null)
  // Distingue "nunca se tocó la miniatura" de "se quitó explícitamente" --
  // ThumbnailDropzone llama onFile(null) solo desde el botón "Quitar", nunca
  // al montarse, así que cualquier onFile(null) es una remoción real.
  const [thumbRemoved, setThumbRemoved] = useState(false)
  const handleThumbChange = (f: File | null) => {
    setUploadedThumb(f)
    setThumbRemoved(f === null)
  }
  // Al editar, los temas con capas ya elegidas empiezan abiertos — si no, el
  // admin tendría que expandirlos a mano solo para ver su propia selección.
  const [temasExpandidos, setTemasExpandidos] = useState<Set<string>>(
    () => new Set(editing ? editing.capasSeleccionadas.map(workspaceDeCapa) : []),
  )
  const cuerpoRef = useRef<HTMLDivElement>(null)

  const { data: conexiones = [] } = useConexionesGeoserverList()
  const { data: workspaces = [], isFetching: loadingWorkspaces } = useWorkspacesDeConexion(form.conexionGeoserverId || null)
  // Categorías del módulo compartido — geovisores.categoria tiene FK a
  // categorias(nombre) en el backend. Solo se puede ELEGIR entre las ya
  // asignadas explícitamente al módulo "geovisores" desde Gestión de
  // Categorías (ver categorias.modulos, migración 048) -- este formulario no
  // crea categorías nuevas, y una asignada solo a Documentos o Mapas no debe
  // ofrecerse acá.
  const { data: categoriasCompartidas = [] } = useCategoriasList({ admin: 'true' })

  const createGeovisor = useCreateGeovisor()
  const updateGeovisor = useUpdateGeovisor()
  const uploadThumbnail = useUploadGeovisorThumbnail()
  const isSaving = createGeovisor.isPending || updateGeovisor.isPending || uploadThumbnail.isPending

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

  const catalogoCapas = useMemo(() => workspaces.flatMap((w) => w.capas), [workspaces])

  // Una capa con fichas sin su atributo identificador deja un geovisor que luego
  // no se puede publicar y sin pista de por qué: se detecta antes de guardar.
  const capasConFichaActivas = form.capasConFicha.filter((id) => form.capasSeleccionadas.includes(id))
  const capasSinConfigFichas = useCapasSinConfigFichas(form.conexionGeoserverId, capasConFichaActivas)

  // En el tipo "con fichas" toda capa vectorial que se marca exige fichas desde
  // ese mismo clic; el admin puede quitarla después capa por capa.
  const toggleCapa = (capa: CapaWorkspace) => {
    setForm((f) => {
      const yaMarcada = f.capasSeleccionadas.includes(capa.id)
      if (yaMarcada) {
        return {
          ...f,
          capasSeleccionadas: f.capasSeleccionadas.filter((c) => c !== capa.id),
          capasConFicha: f.capasConFicha.filter((c) => c !== capa.id),
        }
      }
      const exigeFicha = tipo === 'fichas' && capa.tipo === 'vectorial'
      return {
        ...f,
        capasSeleccionadas: [...f.capasSeleccionadas, capa.id],
        capasConFicha: exigeFicha ? [...f.capasConFicha, capa.id] : f.capasConFicha,
      }
    })
  }

  const cambiarTipo = (nuevo: TipoGeovisor) => {
    setTipo(nuevo)
    setForm((f) => ({
      ...f,
      capasConFicha: nuevo === 'fichas' ? capasVectorialesSeleccionadas(f.capasSeleccionadas, catalogoCapas) : [],
    }))
  }

  const toggleFicha = (id: string) => {
    setForm((f) => ({
      ...f,
      capasConFicha: f.capasConFicha.includes(id)
        ? f.capasConFicha.filter((c) => c !== id)
        : [...f.capasConFicha, id],
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

  // El paso "Fichas" solo existe en geovisores con fichas; si el admin cambia de
  // tipo estando en él, se vuelve a "Capas" en vez de quedar en un paso inexistente.
  const idsPasos = ORDEN_PASOS.filter((id) => id !== 'fichas' || tipo === 'fichas')
  const pasoActivo = idsPasos.includes(paso) ? paso : 'capas'
  const indicePaso = idsPasos.indexOf(pasoActivo)
  const esUltimoPaso = indicePaso === idsPasos.length - 1

  const pasosConError = new Set(Object.keys(errors).map(pasoDeError))
  const pasoCompleto: Record<PasoId, boolean> = {
    informacion: form.titulo.trim().length >= 3,
    capas: !!form.conexionGeoserverId,
    fichas: capasSinConfigFichas.length === 0,
    mapa: true,
    publicar: true,
  }
  const pasos: PasoInfo[] = idsPasos.map((id) => ({
    id, label: ETIQUETA_PASO[id], conError: pasosConError.has(id), completo: pasoCompleto[id],
  }))

  const irAPaso = (id: PasoId) => {
    setPaso(id)
    cuerpoRef.current?.scrollTo?.({ top: 0 })
  }
  const irSiguiente = () => irAPaso(idsPasos[Math.min(indicePaso + 1, idsPasos.length - 1)])
  const irAnterior = () => irAPaso(idsPasos[Math.max(indicePaso - 1, 0)])

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

    capasSinConfigFichas.forEach((id) => {
      e[`ficha-${id}`] = 'Elige el atributo identificador y pulsa «Habilitar» para poder guardar.'
    })
    if (capasSinConfigFichas.length > 0) {
      e._root = 'Hay capas con fichas por punto sin su atributo identificador. Configúralas en el paso «Fichas».'
    }

    setErrors(e)
    if (Object.keys(e).length) {
      // Lleva al admin al primer paso con un campo por corregir.
      const primero = ORDEN_PASOS.find((id) => Object.keys(e).some((k) => pasoDeError(k) === id))
      if (primero) irAPaso(primero)
      return null
    }

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
      capasConFicha: capasConFichaActivas,
      incluirCapasNuevas: form.incluirCapasNuevas,
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

  const guardar = async () => {
    const payload = validate()
    if (!payload) return
    try {
      const geovisorId = editing
        ? (await updateGeovisor.mutateAsync({ id: editing.id, data: payload })).id
        : (await createGeovisor.mutateAsync(payload)).id

      if (uploadedThumb) {
        await uploadThumbnail.mutateAsync({ id: geovisorId, file: uploadedThumb })
      } else if (thumbRemoved) {
        await uploadThumbnail.mutateAsync({ id: geovisorId, file: null })
      }

      onSaved(`Geovisor "${payload.titulo}" ${editing ? 'actualizado' : 'creado'}`)
    } catch (err) {
      setErrors((prev) => ({ ...prev, _root: getApiErrorMessage(err, 'No se pudo guardar el geovisor') }))
    }
  }

  // Enter dentro de un campo avanza al siguiente paso al crear; solo guarda en el
  // último paso, o en cualquiera al editar (donde ya hay un geovisor completo).
  const handleSubmit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    if (esUltimoPaso || editing) void guardar()
    else irSiguiente()
  }

  // Filtra también .capas a las marcadas — pasar el workspace completo aquí
  // dispararía un WMSTileLayer por cada capa publicada en ese tema (todas,
  // no solo la elegida), saturando GeoServer con peticiones de más.
  const workspacesSeleccionados = workspaces
    .filter((w) => temasSeleccionados.includes(w.id))
    .map((w) => ({ ...w, capas: w.capas.filter((c) => form.capasSeleccionadas.includes(c.id)) }))

  const capasFichaConNombre = capasConFichaActivas.map((id) => ({
    id, nombre: catalogoCapas.find((c) => c.id === id)?.nombre ?? id,
  }))

  // Todos los pasos quedan montados y solo se oculta el inactivo: así no se
  // pierde lo escrito ni se vuelven a pedir los datos al volver a un paso.
  const visiblePaso = (id: PasoId) => (pasoActivo === id ? '' : 'hidden')

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
        {/* ── Panel izquierdo: asistente ── */}
        <div className="flex flex-col min-h-0 lg:w-[30rem] lg:shrink-0 border-b lg:border-b-0 lg:border-r border-border">
          <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
            <div>
              <h3 className="text-base font-bold text-text">{editing ? 'Editar geovisor' : 'Nuevo geovisor'}</h3>
              <p className="text-xs text-text-muted mt-0.5">
                Paso {indicePaso + 1} de {idsPasos.length} — el mapa muestra el resultado en vivo.
              </p>
            </div>
            <button onClick={onClose} disabled={isSaving} aria-label="Cerrar"
              className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-alt transition-colors disabled:opacity-40">
              <X className="w-5 h-5" />
            </button>
          </div>

          <PasosGeovisor pasos={pasos} actual={pasoActivo} onIr={irAPaso} />

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
            <div ref={cuerpoRef} className="flex-1 overflow-y-auto p-6 space-y-4">
              {errors._root && (
                <p role="alert" className="flex items-center gap-2 text-xs text-red-600 bg-red/10 border border-red-300/40 rounded-lg px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />{errors._root}
                </p>
              )}

              <div className={visiblePaso('informacion')}>
                <PasoInformacion
                  form={form} setForm={setForm} errors={errors}
                  tipo={tipo} onCambiarTipo={cambiarTipo}
                  categorias={categoriasCompartidas.filter((c) => c.modulos?.includes('geovisores')).map((c) => c.nombre)}
                  onThumb={handleThumbChange} thumbRemoved={thumbRemoved}
                />
              </div>

              <div className={visiblePaso('capas')}>
                <PasoCapas
                  form={form} setForm={setForm} errors={errors} tipo={tipo}
                  conexiones={conexiones} workspaces={workspaces} cargando={loadingWorkspaces}
                  temasSeleccionados={temasSeleccionados} temasExpandidos={temasExpandidos}
                  onToggleTema={toggleTema} onToggleCapa={toggleCapa} onToggleFicha={toggleFicha} onSetColor={setColor}
                />
              </div>

              {tipo === 'fichas' && (
                <div className={visiblePaso('fichas')}>
                  <PasoFichas
                    conexionId={form.conexionGeoserverId} capas={capasFichaConNombre}
                    sinConfigurar={capasSinConfigFichas} errors={errors}
                  />
                </div>
              )}

              <div className={visiblePaso('mapa')}>
                <PasoMapa form={form} setForm={setForm} errors={errors} />
              </div>

              <div className={visiblePaso('publicar')}>
                <PasoPublicar form={form} setForm={setForm} errors={errors} totalTemas={temasSeleccionados.length} />
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 py-4 border-t border-border shrink-0">
              {indicePaso === 0 ? (
                <button type="button" onClick={onClose} disabled={isSaving}
                  className="px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 hover:text-primary-800 disabled:opacity-40 transition-colors">
                  Cancelar
                </button>
              ) : (
                <button type="button" onClick={irAnterior} disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 hover:text-primary-800 disabled:opacity-40 transition-colors">
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Atrás
                </button>
              )}

              <div className="flex-1" />

              {editing && !esUltimoPaso && (
                <button type="button" onClick={() => void guardar()} disabled={isSaving}
                  className="px-4 py-2.5 border border-primary-800 rounded-lg text-sm font-semibold text-primary-800 hover:bg-primary-800/5 disabled:opacity-40 transition-colors">
                  Guardar cambios
                </button>
              )}

              {esUltimoPaso ? (
                <button type="submit" disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" aria-hidden="true" />}
                  {isSaving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear geovisor'}
                </button>
              ) : (
                <button type="button" onClick={irSiguiente} disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors">
                  Siguiente <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ── Panel derecho: vista previa en vivo ── */}
        <div className={`flex-1 min-h-[200px] lg:min-h-0 relative lg:block ${pasoActivo === 'mapa' ? 'block' : 'hidden'}`}>
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
