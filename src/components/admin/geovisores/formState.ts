import { Globe, Users, ShieldCheck } from 'lucide-react'
import type { GeovisorRaw, MapaVisibilidad, PresetArea, WorkspaceOption } from '@/types'

export type CapaWorkspace = WorkspaceOption['capas'][number]

/** Workspace ("tema") al que pertenece una capa, a partir de su id "workspace:layername". */
export function workspaceDeCapa(capaId: string): string {
  return capaId.split(':')[0] ?? capaId
}

export const BASEMAPS = [
  { id: 'calles', label: 'Calles' },
  { id: 'claro', label: 'Claro' },
  { id: 'oscuro', label: 'Oscuro' },
  { id: 'satelite', label: 'Satélite' },
  { id: 'hibrido', label: 'Híbrido' },
  { id: 'topografico', label: 'Topográfico' },
  { id: 'relieve', label: 'Relieve' },
]

export const VISIBILIDAD = [
  { value: 'publico', label: 'Público', desc: 'Visible para todos', Icon: Globe, border: 'border-primary-600', bg: 'bg-primary-600/8', text: 'text-primary-700' },
  { value: 'usuarios', label: 'Usuarios', desc: 'Solo usuarios registrados', Icon: Users, border: 'border-gold-400', bg: 'bg-gold-400/10', text: 'text-gold-400' },
  { value: 'acreditados', label: 'Acreditados', desc: 'Investigadores y admins', Icon: ShieldCheck, border: 'border-magenta', bg: 'bg-magenta/10', text: 'text-magenta' },
] as const

export const PALETA_AUTO = ['#1B4332', '#B08D57', '#C0357C', '#2563EB', '#B45309', '#0F766E', '#7C3AED', '#DC2626']

export type CampoPopupForm = { campo: string; alias: string }

export interface FormState {
  titulo: string
  subtitulo: string
  descripcion: string
  cita: string
  categoria: string
  conexionGeoserverId: string
  /** IDs de capa ("workspace:layername") — pueden venir de distintos workspaces/temas. */
  capasSeleccionadas: string[]
  /** Subconjunto de capasSeleccionadas con "fichas por punto" habilitado. */
  capasConFicha: string[]
  /** Mostrar solas las capas nuevas que se publiquen en GeoServer dentro de los temas usados. */
  incluirCapasNuevas: boolean
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

export function emptyForm(): FormState {
  return {
    titulo: '', subtitulo: '', descripcion: '', cita: '', categoria: '',
    conexionGeoserverId: '', capasSeleccionadas: [], capasConFicha: [], incluirCapasNuevas: true, colorPorTema: {},
    centroLat: 5.55, centroLng: -76.6, zoomInicial: 8, basemapDefecto: 'calles',
    areaMaxHa: '', presetsArea: [], visibilidad: 'publico',
    thumbnailUrl: '', mostrarMetricas: true, mostrarImagenes: false, campoImagenUrl: '',
    camposPopup: [],
  }
}

export function formFromGeovisor(g: GeovisorRaw): FormState {
  return {
    titulo: g.titulo, subtitulo: g.subtitulo ?? '', descripcion: g.descripcion ?? '',
    cita: g.cita ?? '', categoria: g.categoria ?? '',
    conexionGeoserverId: g.conexionGeoserverId, capasSeleccionadas: g.capasSeleccionadas,
    capasConFicha: g.capasConFicha, incluirCapasNuevas: g.incluirCapasNuevas,
    colorPorTema: g.colorPorTema, centroLat: g.centro.lat, centroLng: g.centro.lng,
    zoomInicial: g.zoomInicial, basemapDefecto: g.basemapDefecto,
    areaMaxHa: g.areaMaxHa != null ? String(g.areaMaxHa) : '',
    presetsArea: g.presetsArea,
    visibilidad: g.visibilidad, thumbnailUrl: g.thumbnailUrl ?? '',
    mostrarMetricas: g.presentacion.mostrarMetricas, mostrarImagenes: g.presentacion.mostrarImagenes,
    campoImagenUrl: g.presentacion.campoImagenUrl ?? '', camposPopup: g.presentacion.camposPopup,
  }
}

export const inputCls = (invalid?: boolean) =>
  `w-full px-3 py-2.5 bg-[var(--card-bg)] border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-800/10 transition ${
    invalid ? 'border-red-400' : 'border-border focus:border-primary-800'
  }`
export const labelCls = 'block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5'

export type PasoId = 'informacion' | 'capas' | 'fichas' | 'mapa' | 'publicar'

/** Paso del asistente al que pertenece cada clave de error, para llevar al admin al campo que falló. */
export function pasoDeError(clave: string): PasoId | null {
  if (clave === 'titulo') return 'informacion'
  if (clave === 'conexionGeoserverId') return 'capas'
  if (clave.startsWith('ficha-')) return 'fichas'
  if (clave === 'areaMaxHa') return 'mapa'
  if (clave === 'campoImagenUrl' || clave.startsWith('campo-')) return 'publicar'
  return null
}
