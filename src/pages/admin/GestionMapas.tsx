import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import type { MapaData } from '@/hooks/useMapas'
import { getApiErrorMessage } from '@/lib/apiError'
import type { FormErrors } from '@/types/forms'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, X, Edit2, Trash2, Eye, EyeOff,
  Layers, Send, Upload, CheckCircle, AlertCircle,
  FileText, Image, Link as LinkIcon, Loader2, MapPin,
  ExternalLink, Globe, Users, ShieldCheck,
  Rows, Columns2, Columns3, ChevronDown, Compass,
} from 'lucide-react'
import { fadeUpSm, panelAnim } from '@/lib/animations'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import CategoryCombobox from '@/components/admin/CategoryCombobox'
import ThumbnailDropzone from '@/components/ui/ThumbnailDropzone'
import { useMapasList, useCreateMapa, useUpdateMapa, useToggleMapaActivo, useDeleteMapa } from '@/hooks/useMapas'
import { useCategoriasList } from '@/hooks/useCategorias'
import { isTrustedUrl } from '@/lib/trustedUrl'

const fadeUp = fadeUpSm

const FORMATOS  = ['PDF', 'IMG', 'Geovisor']

const ACCEPT: Record<string, string | null> = {
  PDF:      '.pdf,application/pdf',
  IMG:      '.jpg,.jpeg,.png,.webp,image/*',
  Geovisor: null,
}
const MAX_SIZE_BYTES: Record<string, number> = {
  PDF: 20 * 1024 * 1024,
  IMG: 25 * 1024 * 1024,
}

const VISIBILIDAD = [
  { value: 'publico',     label: 'Público',      desc: 'Visible para todos',             Icon: Globe,       border: 'border-primary-600', bg: 'bg-primary-600/8',  text: 'text-primary-700', pill: 'bg-primary-700/10 text-primary-700' },
  { value: 'usuarios',    label: 'Usuarios',     desc: 'Solo usuarios registrados',      Icon: Users,       border: 'border-gold-400',    bg: 'bg-gold-400/10',    text: 'text-gold-400',    pill: 'bg-gold-400/12 text-gold-400' },
  { value: 'acreditados', label: 'Acreditados',  desc: 'Investigadores y admins',        Icon: ShieldCheck, border: 'border-magenta',     bg: 'bg-magenta/10',     text: 'text-magenta',     pill: 'bg-magenta/12 text-magenta' },
]
const visMap = Object.fromEntries(VISIBILIDAD.map((v) => [v.value, v]))

// Opciones de sistema de coordenadas en lenguaje llano -- nadie fuera del
// equipo SIG memoriza códigos EPSG de memoria. "otro" revela un campo numérico.
const EPSG_OPCIONES = [
  { value: '', label: 'No especificado' },
  { value: '4326', label: 'Coordenadas GPS estándar (WGS 84)' },
  { value: '9377', label: 'Coordenadas oficiales de Colombia (MAGNA-SIRGAS)' },
  { value: 'otro', label: 'Otro (indicar código EPSG)' },
]

const EMPTY_FORM = {
  nombre: '', tematica: '',
  descripcion: '', anio: String(new Date().getFullYear()),
  visible: true, formato: 'PDF', url: '', visibilidad: 'publico',
  // Metadatos técnicos opcionales (ISO 19115 / IGAC) -- nunca bloquean el
  // guardado, son campos de texto/número libres que viajan tal cual.
  epsgOpcion: '', epsgOtro: '', escala: '', fuente: '',
  bboxNorte: '', bboxSur: '', bboxEste: '', bboxOeste: '',
}

function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// ── Toast de éxito ────────────────────────────────────────────────────────────
function SavedToast({ message, onDone }: { message: string; onDone: () => void }) {
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
function VisibilidadSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {VISIBILIDAD.map(({ value: v, label, desc, Icon, border, bg, text }) => {
        const active = value === v
        return (
          <button key={v} type="button" onClick={() => onChange(v)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${active ? `${border} ${bg}` : 'border-border bg-[var(--card-bg)] hover:bg-bg-alt'}`}>
            <Icon className={`w-4 h-4 ${active ? text : 'text-text-muted'}`} />
            <span className={`text-[0.65rem] font-bold uppercase tracking-wide ${active ? text : 'text-text-muted'}`}>{label}</span>
            <span className="text-[0.6rem] text-text-muted leading-tight hidden sm:block">{desc}</span>
          </button>
        )
      })}
    </div>
  )
}

function FileDropzone({ formato, onFile, onFormatDetect, currentFile, editing, onError }: { formato: string; onFile: (f: File | null) => void; onFormatDetect: (fmt: string) => void; currentFile: File | null; editing: MapaData | null; onError: (msg: string | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const accept = ACCEPT[formato]

  const validateAndAccept = useCallback((file: File | null | undefined) => {
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

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
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
          className="flex items-center gap-3 px-4 py-3 bg-primary-500/10 border border-primary-500/25 rounded-xl"
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
              ? 'border-primary-600 bg-primary-500/10 scale-[1.01]'
              : 'border-border hover:border-primary-400 hover:bg-bg-alt/60'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${dragging ? 'bg-primary-500/12' : 'bg-bg-alt'}`}>
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
            onChange={(e) => { validateAndAccept(e.target.files?.[0]); e.target.value = '' }}
            className="sr-only"
          />
        </div>
      )}
    </div>
  )
}

// ── Tarjeta de mapa — imagen de fondo con hover-reveal, clic para ver info y acciones ──
function MapaCard({
  m, expanded, onToggleExpand, onToggleVisible, onView, onEdit, onDelete,
}: {
  m: MapaData
  expanded: boolean
  onToggleExpand: () => void
  onToggleVisible: () => void
  onView: (() => void) | null
  onEdit: () => void
  onDelete: () => void
}) {
  const vis = visMap[m.visibilidad] ?? visMap.publico

  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      aria-label={`${m.nombre}, ${m.tematica}. Clic para ver detalles y acciones.`}
      onClick={onToggleExpand}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleExpand() } }}
      className={`group/card relative h-64 rounded-xl overflow-hidden cursor-pointer border transition-all duration-500 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ring-offset-background ${
        m.visible ? 'border-border/70' : 'border-border/50'
      } group-hover:scale-[0.98] group-hover:opacity-60 group-hover:blur-[1.5px] hover:!scale-100 hover:!opacity-100 hover:!blur-none focus-visible:!scale-100 focus-visible:!opacity-100 focus-visible:!blur-none`}
    >
      {/* Fondo — miniatura o gradiente de respaldo */}
      {m.thumbnail_url ? (
        <img
          src={m.thumbnail_url}
          alt=""
          loading="lazy"
          className={`absolute inset-0 w-full h-full object-contain bg-bg-alt transition-transform duration-500 ${!m.visible ? 'grayscale-[0.5]' : ''} group-hover/card:scale-105`}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-800 to-primary-950">
          <MapPin className="w-10 h-10 text-white/25" aria-hidden="true" />
        </div>
      )}

      {/* Overlay degradado permanente — legibilidad del texto */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10 pointer-events-none" />

      {/* Badges superiores */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className="text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white bg-black/40 backdrop-blur-sm">{m.tematica}</span>
          <span className="text-[0.6rem] font-semibold px-1.5 py-0.5 rounded border border-white/30 text-white bg-black/30 backdrop-blur-sm">{m.formato}</span>
          {!m.visible && (
            <span className="text-[0.6rem] font-semibold px-1.5 py-0.5 rounded bg-white/90 text-text-muted">Oculto</span>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleVisible() }}
          className="shrink-0 p-1.5 rounded-lg bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors"
          title={m.visible ? 'Visible — clic para ocultar' : 'Oculto — clic para publicar'}
        >
          {m.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Título / subtítulo — siempre visibles */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-sm font-bold text-white leading-tight line-clamp-2">{m.nombre}</p>
        <p className="text-xs text-white/70 mt-1">{m.autor || 'IIAP'} · {m.fecha}</p>
      </div>

      {/* Panel de detalle y acciones — revelado al hacer clic */}
      <div
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col justify-end p-4 transition-opacity duration-250 ${
          expanded ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleExpand() }}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Cerrar detalle"
        >
          <X className="w-4 h-4" />
        </button>

        <span className={`self-start text-[0.6rem] font-semibold px-1.5 py-0.5 rounded mb-2 ${vis.pill}`}>{vis.label}</span>
        <p className="text-sm font-bold text-white leading-tight">{m.nombre}</p>
        <p className="text-xs text-white/60 mt-0.5">{m.autor || 'IIAP'} · {m.fecha}</p>
        {m.descripcion && (
          <p className="text-xs text-white/75 mt-2 line-clamp-3">{m.descripcion}</p>
        )}

        <div className="flex items-center gap-2 mt-3">
          {onView && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onView() }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Ver archivo
            </button>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit() }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" /> Editar
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600/80 text-white hover:bg-red-600 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function GestionMapas() {
  const { data, isLoading, isError, refetch } = useMapasList({ limit: 100, admin: 'true' })
  const mapas = data?.data ?? []
  const createMapa = useCreateMapa()
  const updateMapa = useUpdateMapa()
  const toggleActivo = useToggleMapaActivo()
  const deleteMapa = useDeleteMapa()

  const [search, setSearch] = useState('')
  const [filtroTematica, setFiltroTematica] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<MapaData | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedThumb, setUploadedThumb] = useState<File | null>(null)
  // Distingue "el usuario nunca tocó la miniatura" (uploadedThumb null desde el
  // montaje -- no enviar nada, deja la que ya había) de "el usuario le dio
  // Quitar explícitamente" (sí hay que decirle al backend que la borre).
  const [thumbRemoved, setThumbRemoved] = useState(false)
  // Colapsado por defecto -- son datos de respaldo cartográfico (ISO 19115 /
  // IGAC), nadie los necesita para simplemente publicar un mapa, así que no
  // deben alargar ni intimidar el flujo simple por defecto.
  const [showMetadatos, setShowMetadatos] = useState(false)
  const handleThumbChange = (f: File | null) => {
    setUploadedThumb(f)
    setThumbRemoved(f === null)
  }
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MapaData | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const isSubmitting = createMapa.isPending || updateMapa.isPending

  // Todas las temáticas: las ya usadas en mapas cargados (por si una quedó
  // huérfana tras borrarse de la tabla categorias) + las asignadas
  // explícitamente al módulo "mapas" (ver categorias.modulos, migración 048)
  // -- una categoría asignada solo a Documentos o Geovisores no debe
  // ofrecerse acá.
  const { data: categoriasCompartidas = [] } = useCategoriasList({ admin: 'true' })
  const allTematicas = [...new Set([
    ...mapas.map((m) => m.tematica).filter(Boolean),
    ...categoriasCompartidas.filter((c) => c.modulos?.includes('mapas')).map((c) => c.nombre),
  ])].sort((a, b) => a.localeCompare(b))

  const filtered = mapas.filter((m) => {
    const q = search.toLowerCase()
    const matchQ = !q || m.nombre?.toLowerCase().includes(q) || (m.autor ?? '').toLowerCase().includes(q)
    const matchT = !filtroTematica || m.tematica === filtroTematica
    return matchQ && matchT
  })

  const listRef = useRef<HTMLDivElement>(null)

  // Columnas: el usuario elige 1/2/3 (se guarda por navegador), pero nunca se
  // fuerzan más columnas de las que la pantalla actual puede mostrar bien --
  // en un celular, aunque haya elegido "3", igual se ve en 1 columna.
  const COLS_STORAGE_KEY = 'vigiiap:admin-mapas-cols'
  const [preferredCols, setPreferredCols] = useState<1 | 2 | 3>(() => {
    if (typeof window === 'undefined') return 2
    const raw = Number(window.localStorage.getItem(COLS_STORAGE_KEY))
    return raw === 1 || raw === 2 || raw === 3 ? raw : 2
  })
  const [viewportMaxCols, setViewportMaxCols] = useState<1 | 2 | 3>(() => {
    if (typeof window === 'undefined') return 2
    if (window.innerWidth >= 1280) return 3
    if (window.innerWidth >= 1024) return 2
    return 1
  })

  useEffect(() => {
    const mqXl = window.matchMedia('(min-width: 1280px)')
    const mqLg = window.matchMedia('(min-width: 1024px)')
    const update = () => setViewportMaxCols(mqXl.matches ? 3 : mqLg.matches ? 2 : 1)
    mqXl.addEventListener('change', update)
    mqLg.addEventListener('change', update)
    return () => { mqXl.removeEventListener('change', update); mqLg.removeEventListener('change', update) }
  }, [])

  const cols = Math.min(preferredCols, viewportMaxCols) as 1 | 2 | 3
  const changeCols = (n: 1 | 2 | 3) => {
    setPreferredCols(n)
    try { window.localStorage.setItem(COLS_STORAGE_KEY, String(n)) } catch { /* localStorage no disponible */ }
  }

  const rows = useMemo(() => {
    const result: MapaData[][] = []
    for (let i = 0; i < filtered.length; i += cols) {
      result.push(filtered.slice(i, i + cols))
    }
    return result
  }, [filtered, cols])

  // Patrón documentado de @tanstack/react-virtual — lectura de ref para scroll math
  /* eslint-disable react-hooks/refs */
  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => 272,
    overscan: 4,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  })
  /* eslint-enable react-hooks/refs */

  const openCreate = () => {
    setEditing(null); setForm(EMPTY_FORM); setFormErrors({})
    setUploadedFile(null); setUploadedThumb(null); setThumbRemoved(false); setUploadError(null); setSubmitError(null)
    setUploadProgress(null); setShowMetadatos(false); setShowModal(true)
  }

  const openEdit = (m: MapaData) => {
    setEditing(m)
    const epsgStr = m.epsg != null ? String(m.epsg) : ''
    const epsgEsPreset = EPSG_OPCIONES.some((o) => o.value === epsgStr)
    setForm({
      nombre:      m.nombre,
      tematica:    m.tematica,
      descripcion: m.descripcion || '',
      anio:        String(m.anio || new Date().getFullYear()),
      visible:     m.visible,
      formato:     m.formato ?? 'PDF',
      url:         m.url || '',
      visibilidad: m.visibilidad ?? 'publico',
      epsgOpcion:  !epsgStr ? '' : epsgEsPreset ? epsgStr : 'otro',
      epsgOtro:    !epsgStr || epsgEsPreset ? '' : epsgStr,
      escala:      m.escala != null ? String(m.escala) : '',
      fuente:      m.fuente ?? '',
      bboxNorte:   m.bboxNorte != null ? String(m.bboxNorte) : '',
      bboxSur:     m.bboxSur != null ? String(m.bboxSur) : '',
      bboxEste:    m.bboxEste != null ? String(m.bboxEste) : '',
      bboxOeste:   m.bboxOeste != null ? String(m.bboxOeste) : '',
    })
    setFormErrors({}); setUploadedFile(null); setUploadedThumb(null); setThumbRemoved(false); setUploadError(null)
    setSubmitError(null); setUploadProgress(null)
    // Si ya tiene algún metadato técnico cargado, se muestra abierto para
    // que se vea de una vez -- si no, se deja colapsado como en creación.
    setShowMetadatos(!!(m.epsg || m.escala || m.fuente || m.bboxNorte || m.bboxSur || m.bboxEste || m.bboxOeste))
    setShowModal(true)
  }

  const validate = () => {
    const e: FormErrors = {}
    if (!form.nombre.trim()) e.nombre = 'El nombre del mapa es obligatorio'
    if (!form.tematica.trim()) e.tematica = 'Selecciona una categoría'
    if (form.formato !== 'Geovisor' && !editing && !uploadedFile)
      e.archivo = 'Debes seleccionar el archivo del mapa para continuar'
    if (form.formato === 'Geovisor' && !form.url.trim()) {
      e.url = 'Debes ingresar la URL del Geovisor'
    } else if (form.formato === 'Geovisor' && form.url.trim()) {
      try {
        const scheme = new URL(form.url.trim(), window.location.origin).protocol
        if (scheme !== 'http:' && scheme !== 'https:') {
          e.url = 'La URL del Geovisor debe usar http:// o https://'
        }
      } catch {
        e.url = 'La URL del Geovisor no es válida'
      }
    }
    if (form.epsgOpcion === 'otro' && !form.epsgOtro.trim()) {
      e.epsgOtro = 'Indica el código EPSG'
    }
    // Mismo criterio que el backend (createMapaSchema): si se dan ambos
    // límites de un eje, el mayor debe ir primero -- error de mecanografía
    // común al copiar coordenadas.
    if (form.bboxNorte && form.bboxSur && Number(form.bboxNorte) <= Number(form.bboxSur)) {
      e.bboxNorte = 'El límite norte debe ser mayor que el límite sur'
    }
    if (form.bboxEste && form.bboxOeste && Number(form.bboxEste) <= Number(form.bboxOeste)) {
      e.bboxEste = 'El límite este debe ser mayor que el límite oeste'
    }
    return e
  }

  const handleSave = async (ev: React.FormEvent<HTMLFormElement>) => {
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

    // Metadatos técnicos -- todos opcionales, se omiten del payload si están
    // vacíos (el PATCH solo toca los campos presentes, ver update() en
    // mapas.service.js). Al editar, borrar el valor de un campo lo limpia
    // enviando '' explícito -- el backend lo coerciona a null.
    const epsgFinal = form.epsgOpcion === 'otro' ? form.epsgOtro.trim() : form.epsgOpcion
    if (epsgFinal || editing) payload.append('epsg', epsgFinal)
    if (form.escala.trim() || editing) payload.append('escala', form.escala.trim())
    if (form.fuente.trim() || editing) payload.append('fuente', form.fuente.trim())
    if (form.bboxNorte.trim() || editing) payload.append('bbox_norte', form.bboxNorte.trim())
    if (form.bboxSur.trim() || editing) payload.append('bbox_sur', form.bboxSur.trim())
    if (form.bboxEste.trim() || editing) payload.append('bbox_este', form.bboxEste.trim())
    if (form.bboxOeste.trim() || editing) payload.append('bbox_oeste', form.bboxOeste.trim())
    if (uploadedThumb) payload.append('thumbnail', uploadedThumb)
    else if (thumbRemoved) payload.append('thumbnail_url', '')

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

    const onUploadProgress = (uploadedFile || uploadedThumb)
      ? (e: import('axios').AxiosProgressEvent) => setUploadProgress(Math.round((e.loaded * 100) / (e.total ?? e.loaded)))
      : undefined

    try {
      if (editing) {
        await updateMapa.mutateAsync({ id: editing.id, formData: payload, onUploadProgress })
        // "Publicar en el portal público" es un campo aparte (activo), no lo
        // cubre el PATCH de arriba -- si cambió, se aplica con el mismo
        // endpoint que usa el ícono de ojo en la tarjeta.
        if (form.visible !== editing.visible) {
          await toggleActivo.mutateAsync({ id: editing.id, activo: form.visible })
        }
        setToast(`Mapa "${form.nombre}" actualizado correctamente`)
      } else {
        const nuevo = await createMapa.mutateAsync({ formData: payload, onUploadProgress })
        // Un mapa nuevo siempre se crea publicado (activo=true) -- si el
        // usuario destildó "Publicar en el portal público", se despublica
        // justo después de crearlo.
        if (!form.visible) {
          await toggleActivo.mutateAsync({ id: nuevo.id, activo: false })
        }
        setToast(`Mapa "${form.nombre}" registrado correctamente`)
      }
      setShowModal(false)
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, 'No se pudo guardar. Verifica la conexión e intenta de nuevo.'))
      setUploadProgress(null)
    }
  }

  const toggleVisible = async (id: string) => {
    const m = mapas.find((x) => x.id === id)
    if (!m) return
    try {
      await toggleActivo.mutateAsync({ id, activo: !m.visible })
    } catch (err) {
      setToast(getApiErrorMessage(err, 'No se pudo cambiar la visibilidad del mapa.'))
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMapa.mutateAsync(deleteTarget.id)
      setToast(`Mapa "${deleteTarget.nombre}" eliminado`)
      setDeleteTarget(null)
    } catch (err) {
      setToast(getApiErrorMessage(err, 'No se pudo eliminar el mapa. Intenta de nuevo.'))
    }
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
          <span className="text-[0.7rem] font-bold uppercase tracking-widest" style={{ color: 'var(--hero-eyebrow-text)' }}>Administración</span>
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

      {/* Thematic pills — solo las que tienen mapas */}
      <motion.div {...fadeUp(0.06)} className="flex flex-wrap gap-2">
        {allTematicas.filter((t) => mapas.some((m) => m.tematica === t)).map((t) => (
          <button key={t}
            onClick={() => setFiltroTematica(filtroTematica === t ? '' : t)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              filtroTematica === t
                ? 'bg-primary-800 text-white border-primary-800'
                : 'bg-[var(--card-bg)] text-text-muted border-border hover:border-primary-800 hover:text-primary-800'
            }`}
          >
            {t}
          </button>
        ))}
      </motion.div>

      {/* Search + columnas */}
      <motion.div {...fadeUp(0.1)} className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input type="text" aria-label="Buscar mapas por nombre o autor" placeholder="Buscar mapa por nombre o autor…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
          />
        </div>
        <div role="group" aria-label="Columnas de la lista" className="flex items-center gap-1 p-1 bg-[var(--card-bg)] border border-border rounded-xl shrink-0">
          {([
            { n: 1 as const, Icon: Rows,     label: '1 columna' },
            { n: 2 as const, Icon: Columns2, label: '2 columnas' },
            { n: 3 as const, Icon: Columns3, label: '3 columnas' },
          ]).map(({ n, Icon, label }) => (
            <button key={n} type="button" onClick={() => changeCols(n)} title={label} aria-label={label}
              aria-pressed={preferredCols === n}
              className={`p-2 rounded-lg transition-colors ${
                preferredCols === n ? 'bg-primary-800 text-white' : 'text-text-muted hover:bg-bg-alt hover:text-text'
              }`}>
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </motion.div>

      {/* Error state */}
      {isError && (
        <motion.div {...fadeUp(0.14)} className="flex flex-col items-center justify-center py-20 text-center bg-red/10 border border-red/25 rounded-2xl">
          <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
          <h3 className="text-base font-bold text-red-700 mb-1">Error al cargar los mapas</h3>
          <p className="text-sm text-red-500 mb-5">No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.</p>
          <button onClick={() => refetch()} className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors">
            Reintentar
          </button>
        </motion.div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && mapas.length === 0 && (
        <motion.div {...fadeUp(0.14)} className="flex flex-col items-center justify-center py-20 text-center bg-[var(--card-bg)] border border-dashed border-border rounded-2xl">
          <div className="w-16 h-16 bg-primary-500/12 rounded-2xl flex items-center justify-center mb-4">
            <MapPin className="w-8 h-8 text-primary-400" />
          </div>
          <h3 className="text-base font-bold text-text mb-1">Aún no hay mapas registrados</h3>
          <p className="text-sm text-text-muted mb-6 max-w-xs">Ingresa el primer mapa para que aparezca en el portal público de VIGIA-IIAP.</p>
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-800 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" /> Ingresar el primer mapa
          </button>
        </motion.div>
      )}

      {/* Cards — virtualized with @tanstack/react-virtual */}
      {mapas.length > 0 && filtered.length === 0 && (
        <div className="py-12 text-center text-sm text-text-muted">
          No hay mapas que coincidan con la búsqueda
        </div>
      )}
      {mapas.length > 0 && filtered.length > 0 && (
        <div ref={listRef} className="group" role="list">
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map((vRow) => {
              const rowItems = rows[vRow.index]
              return (
                <div
                  key={vRow.key}
                  data-index={vRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${vRow.start - virtualizer.options.scrollMargin}px)`,
                  }}
                  className={`grid gap-4 pb-4 ${cols === 3 ? 'grid-cols-3' : cols === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}
                >
                  {rowItems.map((m) => (
                    <motion.div key={m.id} {...fadeUpSm()}>
                      <MapaCard
                        m={m}
                        expanded={expandedId === m.id}
                        onToggleExpand={() => setExpandedId((id) => (id === m.id ? null : m.id))}
                        onToggleVisible={() => toggleVisible(m.id)}
                        onView={(() => {
                          const target = m.archivo_img_url || m.archivo_pdf_url || m.geovisor_url
                          return target && isTrustedUrl(target)
                            ? () => window.open(target, '_blank', 'noopener,noreferrer')
                            : null
                        })()}
                        onEdit={() => openEdit(m)}
                        onDelete={() => setDeleteTarget(m)}
                      />
                    </motion.div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal ingresar / editar mapa */}
      <AnimatePresence>
        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => { if (!isSubmitting && e.target === e.currentTarget) setShowModal(false) }}
          >
            <motion.div {...panelAnim} className="bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

              {/* Header modal */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-border sticky top-0 bg-[var(--card-bg)] z-10">
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

              <form onSubmit={handleSave} noValidate className="p-6 space-y-5">

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
                            : 'bg-[var(--card-bg)] text-text-muted border-border hover:border-primary-400'
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
                  currentFile={uploadedFile} editing={editing} onError={setUploadError}
                />
                {uploadError && (
                  <div className="flex items-center gap-2 text-red-500 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />{uploadError}
                  </div>
                )}
                {formErrors.archivo && (
                  <div className="flex items-center gap-2 p-3 bg-red/10 border border-red/25 rounded-xl text-red-dark text-xs">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />{formErrors.archivo}
                  </div>
                )}

                {/* URL Geovisor */}
                {form.formato === 'Geovisor' && (
                  <div>
                    <label htmlFor="gm-url" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5 flex items-center gap-1">
                      <LinkIcon className="w-3 h-3" aria-hidden="true" /> URL del Geovisor <span className="text-orange-500" aria-hidden="true">*</span>
                    </label>
                    <input id="gm-url" type="url" value={form.url}
                      onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                      placeholder="https://geovisor.iiap.gov.co/mapa/... o /geovisores"
                      className={`w-full px-3 py-2.5 bg-[var(--card-bg)] border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${formErrors.url ? 'border-red-400' : 'border-border focus:border-primary-800'}`}
                    />
                    {formErrors.url && <p className="text-xs text-red-500 mt-1">{formErrors.url}</p>}
                  </div>
                )}

                {/* Thumbnail opcional */}
                <ThumbnailDropzone onFile={handleThumbChange} existing={thumbRemoved ? null : (editing?.thumbnail_url ?? null)} />

                {/* Nombre del mapa */}
                <div>
                  <label htmlFor="gm-nombre" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    Nombre del mapa <span className="text-orange-500" aria-hidden="true">*</span>
                  </label>
                  <input id="gm-nombre" type="text" value={form.nombre}
                    placeholder="Ej: Mapa de cuencas hidrográficas del Chocó — 2024"
                    onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                    className={`w-full px-3 py-2.5 bg-[var(--card-bg)] border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${formErrors.nombre ? 'border-red-400' : 'border-border focus:border-primary-800'}`}
                  />
                  {formErrors.nombre && <p className="text-xs text-red-500 mt-1">{formErrors.nombre}</p>}
                </div>

                {/* Descripción */}
                <div>
                  <label htmlFor="gm-desc" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    Descripción <span className="text-text-muted font-normal normal-case tracking-normal">(opcional)</span>
                  </label>
                  <textarea id="gm-desc" rows={2} value={form.descripcion}
                    placeholder="Breve descripción del contenido y alcance del mapa…"
                    onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition resize-none"
                  />
                </div>

                {/* Año · Temática */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="gm-anio" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Año</label>
                    <input id="gm-anio" type="number" min="1900" max="2100" value={form.anio}
                      onChange={(e) => setForm((f) => ({ ...f, anio: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                      Categoría <span className="text-orange-500">*</span>
                    </label>
                    <CategoryCombobox
                      value={form.tematica}
                      onChange={(t) => setForm((f) => ({ ...f, tematica: t }))}
                      options={allTematicas}
                    />
                    {formErrors.tematica && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.tematica}</p>
                    )}
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

                {/* Metadatos técnicos -- colapsado por defecto, nada aquí es
                    obligatorio ni afecta si el mapa se ve o se descarga bien.
                    Es información de respaldo (de dónde salió el mapa, a qué
                    escala, en qué sistema de coordenadas) útil si el IIAP
                    necesita sustentarlo ante otra entidad. */}
                <div className="border border-border rounded-lg overflow-hidden">
                  <button type="button" onClick={() => setShowMetadatos((v) => !v)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-bg-alt transition-colors">
                    <span className="flex items-center gap-2 text-sm font-medium text-text">
                      <Compass className="w-4 h-4 text-text-muted" aria-hidden="true" />
                      Metadatos técnicos <span className="text-text-muted font-normal">(opcional)</span>
                    </span>
                    <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${showMetadatos ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>
                  {showMetadatos && (
                    <div className="p-3 pt-1 space-y-3 border-t border-border">
                      <p className="text-xs text-text-muted leading-relaxed">
                        Información de respaldo sobre cómo se hizo este mapa — de dónde salieron los
                        datos, a qué escala y en qué sistema de coordenadas. Nada de esto es obligatorio.
                      </p>

                      <div>
                        <label htmlFor="gm-epsg" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                          Sistema de coordenadas
                        </label>
                        <select id="gm-epsg" value={form.epsgOpcion}
                          onChange={(e) => setForm((f) => ({ ...f, epsgOpcion: e.target.value }))}
                          className="w-full px-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition">
                          {EPSG_OPCIONES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        {form.epsgOpcion === 'otro' && (
                          <input type="number" min={1} value={form.epsgOtro}
                            placeholder="Ej: 3116"
                            onChange={(e) => setForm((f) => ({ ...f, epsgOtro: e.target.value }))}
                            className={`w-full mt-2 px-3 py-2.5 bg-[var(--card-bg)] border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${formErrors.epsgOtro ? 'border-red-400' : 'border-border focus:border-primary-800'}`}
                          />
                        )}
                        {formErrors.epsgOtro && <p className="text-xs text-red-500 mt-1">{formErrors.epsgOtro}</p>}
                      </div>

                      <div>
                        <label htmlFor="gm-escala" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                          Escala <span className="text-text-muted font-normal normal-case tracking-normal">(el número después de "1:")</span>
                        </label>
                        <input id="gm-escala" type="number" min={500} max={5000000} value={form.escala}
                          placeholder="Ej: 100000 (para un mapa a escala 1:100.000)"
                          onChange={(e) => setForm((f) => ({ ...f, escala: e.target.value }))}
                          className="w-full px-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
                        />
                        {form.escala && Number(form.escala) > 0 && (
                          <p className="text-[0.65rem] text-text-muted mt-1">Se guardará como 1:{Number(form.escala).toLocaleString('es-CO')}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="gm-fuente" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                          Fuente de los datos
                        </label>
                        <input id="gm-fuente" type="text" value={form.fuente}
                          placeholder="Ej: Imágenes satelitales Sentinel-2 (2025), levantamiento propio IIAP…"
                          onChange={(e) => setForm((f) => ({ ...f, fuente: e.target.value }))}
                          className="w-full px-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                          Área que cubre el mapa
                        </label>
                        <p className="text-[0.65rem] text-text-muted mb-2 leading-relaxed">
                          Las coordenadas de las 4 esquinas. Consejo: haz clic derecho sobre el punto en
                          Google Maps y copia los números que aparecen arriba.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label htmlFor="gm-bbox-norte" className="block text-[0.6rem] font-semibold text-text-muted mb-1">Norte</label>
                            <input id="gm-bbox-norte" type="number" step="any" min={-90} max={90} value={form.bboxNorte}
                              placeholder="Ej: 5.55"
                              onChange={(e) => setForm((f) => ({ ...f, bboxNorte: e.target.value }))}
                              className={`w-full px-3 py-2 bg-[var(--card-bg)] border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${formErrors.bboxNorte ? 'border-red-400' : 'border-border focus:border-primary-800'}`}
                            />
                          </div>
                          <div>
                            <label htmlFor="gm-bbox-sur" className="block text-[0.6rem] font-semibold text-text-muted mb-1">Sur</label>
                            <input id="gm-bbox-sur" type="number" step="any" min={-90} max={90} value={form.bboxSur}
                              placeholder="Ej: 4.00"
                              onChange={(e) => setForm((f) => ({ ...f, bboxSur: e.target.value }))}
                              className="w-full px-3 py-2 bg-[var(--card-bg)] border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
                            />
                          </div>
                          <div>
                            <label htmlFor="gm-bbox-este" className="block text-[0.6rem] font-semibold text-text-muted mb-1">Este</label>
                            <input id="gm-bbox-este" type="number" step="any" min={-180} max={180} value={form.bboxEste}
                              placeholder="Ej: -76.00"
                              onChange={(e) => setForm((f) => ({ ...f, bboxEste: e.target.value }))}
                              className={`w-full px-3 py-2 bg-[var(--card-bg)] border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${formErrors.bboxEste ? 'border-red-400' : 'border-border focus:border-primary-800'}`}
                            />
                          </div>
                          <div>
                            <label htmlFor="gm-bbox-oeste" className="block text-[0.6rem] font-semibold text-text-muted mb-1">Oeste</label>
                            <input id="gm-bbox-oeste" type="number" step="any" min={-180} max={180} value={form.bboxOeste}
                              placeholder="Ej: -77.50"
                              onChange={(e) => setForm((f) => ({ ...f, bboxOeste: e.target.value }))}
                              className="w-full px-3 py-2 bg-[var(--card-bg)] border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
                            />
                          </div>
                        </div>
                        {formErrors.bboxNorte && <p className="text-xs text-red-500 mt-1">{formErrors.bboxNorte}</p>}
                        {formErrors.bboxEste && <p className="text-xs text-red-500 mt-1">{formErrors.bboxEste}</p>}
                      </div>
                    </div>
                  )}
                </div>

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
                  <div className="flex items-start gap-2 p-3 bg-red/10 border border-red/25 rounded-xl text-red-dark text-sm">
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
            <motion.div {...panelAnim} className="bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
              <div className="w-12 h-12 bg-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-5 h-5 text-red-dark" />
              </div>
              <h3 className="text-base font-bold text-text mb-2">Eliminar mapa</h3>
              <p className="text-sm text-text-muted mb-6">
                ¿Seguro que deseas eliminar <strong className="text-text">"{deleteTarget.nombre}"</strong>?<br />
                <span className="text-xs">Esta acción no se puede deshacer.</span>
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} disabled={deleteMapa.isPending}
                  className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 transition-colors disabled:opacity-50">
                  Cancelar
                </button>
                <button onClick={confirmDelete} disabled={deleteMapa.isPending}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50">
                  {deleteMapa.isPending ? 'Eliminando…' : 'Sí, eliminar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
