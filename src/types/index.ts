// Tipos de autenticación → ver src/contexts/AuthContext.tsx (AuthUser, AuthContextValue)

// ─── API ──────────────────────────────────────────────────────────────────────

export interface ApiMeta {
  total: number
  page?: number
  limit?: number
  pages?: number
}

export interface ApiListResponse<T> {
  data: T[]
  meta: ApiMeta
}

// ─── Mapas ────────────────────────────────────────────────────────────────────

export type MapaFormato = 'PDF' | 'IMG' | 'GEOVISOR' | 'Geovisor'
export type MapaVisibilidad = 'publico' | 'usuarios' | 'acreditados'

export interface MapaRaw {
  id: string
  slug?: string
  titulo: string
  categoria: string
  anio?: number
  descripcion?: string | null
  thumbnail_url?: string | null
  archivo_pdf_url?: string | null
  archivo_img_url?: string | null
  geovisor_url?: string | null
  activo: boolean
  visibilidad?: MapaVisibilidad
  creado_en: string
  autor?: string | null
}

export interface Mapa {
  id: string
  nombre: string
  tematica: string
  formato: string
  visible: boolean
  visibilidad: MapaVisibilidad
  autor: string
  fecha: string
  descripcion: string
  thumbnail_url: string | null
  archivo_pdf_url: string | null
  archivo_img_url: string | null
  geovisor_url: string | null
  title: string
  category: string
  excerpt: string
  year: string
  formats: MapaFormato[]
  badge: string
  badgeColor: string
  geovisorLink: string
}

// ─── Documentos ───────────────────────────────────────────────────────────────

export type DocumentoFormato = 'PDF' | 'IMG' | 'ENLACE'

export interface Documento {
  id: string
  titulo: string
  descripcion: string
  categoria: string
  formato: DocumentoFormato
  url: string
  thumbnail_url: string | null
  publicado: boolean
  visibilidad: MapaVisibilidad
  creado_en: string
  fecha: string
  autor: string
}

// ─── Solicitudes ──────────────────────────────────────────────────────────────

export type SolicitudEstadoRaw =
  | 'pendiente'
  | 'en_revision'
  | 'aprobada'
  | 'rechazada'
  | 'resuelta'

export type SolicitudEstadoLabel =
  | 'Pendiente'
  | 'En Revisión'
  | 'Aprobado'
  | 'Rechazado'
  | 'Resuelta'
  | 'En Proceso'

export type SolicitudTipo =
  | 'uso-suelo'
  | 'linderos'
  | 'estudio-ambiental'
  | 'validacion'
  | 'aprovechamiento'
  | 'otro'

export interface SolicitudRaw {
  id: string
  tipo: SolicitudTipo | string
  descripcion?: string | null
  creado_en: string
  estado: SolicitudEstadoRaw | string
  solicitante?: string
  email?: string
  nota_admin?: string | null
  respondida_en?: string | null
  revisado_por_nombre?: string | null
  dias_pendiente?: number
}

export interface Solicitud {
  id: string
  _id: string
  tipo: string
  tipoRaw: string
  subtipo: string
  descripcion: string
  fecha: string
  creadoEn: string
  estado: SolicitudEstadoLabel
  estadoRaw: SolicitudEstadoRaw | string
  estadoColor: string
  solicitante: string
  email: string
  notas: string
  respondidaEn: string | null
  timeline: string[]
  revisor: string | null
  diasPendiente: number
  accionesValidas: SolicitudEstadoLabel[]
}

// ─── Usuarios ─────────────────────────────────────────────────────────────────

export type UserRole =
  | 'super_admin'
  | 'admin_sig'
  | 'investigador'
  | 'tecnico'
  | 'institucional'
  | 'publico'
  | 'visitante'

export interface Usuario {
  id: string
  nombre: string
  correo: string
  rol: UserRole
  rolBackend: string
  estado: 'Activo' | 'Inactivo'
  activo: boolean
  emailVerified: boolean
  motivoAcceso: string
  initials: string
  institucion: string
  ultimoAcceso: string
  creado_en: string
}

// ─── Geovisores ───────────────────────────────────────────────────────────────
// El backend responde `geovisores` en camelCase (mapeo hecho en filaAGeovisor,
// VIGIIAP-backend/src/modules/geovisores/geovisores.service.js) pero
// `conexiones_geoserver` se devuelve tal cual la columna SQL (snake_case) —
// ver COLUMNAS_PUBLICAS en conexionesGeoserver.service.js.

export interface CampoPopup {
  campo: string
  alias: string
}

export interface PresentacionGeovisor {
  mostrarMetricas: boolean
  mostrarImagenes: boolean
  campoImagenUrl?: string
  camposPopup: CampoPopup[]
}

export interface PresetArea {
  nombre: string
  geometria: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: unknown[]
  }
}

export interface GeovisorRaw {
  id: string
  slug: string
  titulo: string
  subtitulo: string | null
  descripcion: string | null
  cita: string | null
  categoria: string | null
  conexionGeoserverId: string
  workspacesGeoserver: string[]
  /** IDs de capa ("workspace:layername") elegidas sueltas, sin importar su workspace/tema — vacío = usar workspacesGeoserver completos (legado). */
  capasSeleccionadas: string[]
  colorPorTema: Record<string, string>
  centro: { lat: number; lng: number }
  zoomInicial: number
  basemapDefecto: string
  areaMaxHa: number | null
  presetsArea: PresetArea[]
  visibilidad: MapaVisibilidad
  presentacion: PresentacionGeovisor
  thumbnailUrl: string | null
  activo: boolean
  orden: number
  creadoEn: string
}

/** Payload de creación/edición — espejo de geovisores.schema.js (createGeovisorSchema). */
export interface GeovisorInput {
  titulo: string
  subtitulo?: string
  descripcion?: string
  cita?: string
  categoria?: string
  conexionGeoserverId: string
  workspacesGeoserver: string[]
  capasSeleccionadas: string[]
  colorPorTema: Record<string, string>
  centroLat: number
  centroLng: number
  zoomInicial: number
  basemapDefecto: string
  areaMaxHa?: number
  presetsArea: PresetArea[]
  visibilidad: MapaVisibilidad
  presentacion: PresentacionGeovisor
  thumbnailUrl?: string
}

export interface ConexionGeoserverRaw {
  id: string
  nombre: string
  url: string
  usuario_lectura: string
  timeout_ms: number
  activo: boolean
  creado_en: string
  actualizado_en: string
}

/** Payload de creación/edición — espejo de createConexionGeoserverSchema/updateConexionGeoserverSchema. */
export interface ConexionGeoserverInput {
  nombre: string
  url: string
  usuarioLectura: string
  password?: string
  timeoutMs?: number
  activo?: boolean
}

export interface WorkspaceOption {
  id: string
  nombre: string
  totalCapas: number
  capas: Array<{ id: string; nombre: string; tipo: 'vectorial' | 'raster'; bbox?: BboxGeografico }>
}

export interface BboxGeografico {
  norte: number
  sur: number
  este: number
  oeste: number
}

export interface CapaGeoserver {
  id: string
  nombre: string
  tipo: 'vectorial' | 'raster'
  bbox?: BboxGeografico
  tema: string
}

export interface TemaCapas {
  id: string
  nombre: string
  capas: CapaGeoserver[]
}

// ─── Categorías ───────────────────────────────────────────────────────────────

export interface Categoria {
  nombre: string
  descripcion?: string | null
  thumbnail_url?: string | null
  activo?: boolean
  // Conteo real por módulo, calculado en el servidor (ver categorias.service.js) --
  // ausente en respuestas antiguas que no vengan de GET /categorias (ej. el propio
  // POST/PATCH de creación/renombrado no lo devuelve), de ahí opcional.
  conteo?: { docs: number; mapas: number; geovisores: number }
}

// ─── Notificaciones ───────────────────────────────────────────────────────────

export interface Notificacion {
  id: string
  mensaje: string
  tipo?: string
  leido_en?: string | null
  creado_en?: string
  link?: string
}

// ─── Tipos de notificación (catálogo) y preferencias por usuario ──────────────
// Ver notificaciones.routes.js (backend) -- 'clave' de TipoNotificacion debe
// coincidir con el `tipo` usado al crear una Notificacion.

export type AplicaA = 'admin' | 'usuario' | 'ambos'

export interface TipoNotificacion {
  clave: string
  nombre: string
  icono: string
  color: string
  aplica_a: AplicaA
  activo: boolean
  orden: number
}

export interface NotificacionPref {
  clave: string
  nombre: string
  icono: string
  color: string
  en_pantalla: boolean
}

// ─── Stats / Dashboard ────────────────────────────────────────────────────────

export interface AdminStats {
  totalMapas: number
  totalDocumentos: number
  totalUsuarios: number
  solicitudesPendientes: number
  solicitudesHoy: number
  mapasActivos?: number
  documentosActivos?: number
}

// ─── Catalogue / Command Palette ──────────────────────────────────────────────

export interface CatalogueEntry {
  id: string
  group: string
  label: string
  keywords: string
  icon: React.ComponentType<{ className?: string }>
  to: string
  meta?: string
  // Mapas/documentos no tienen ruta de detalle propia -- al seleccionarlos
  // en el Command Palette, se navega a `to` y se precarga este valor en
  // SearchContext para que la página de destino llegue ya filtrada al ítem.
  presetQuery?: string
}

// ─── Web Vitals ───────────────────────────────────────────────────────────────

export type WebVitalRating = 'good' | 'needs-improvement' | 'poor'

export interface WebVitalMetric {
  name: string
  value: number
  rating: WebVitalRating
  delta: number
  id: string
}
