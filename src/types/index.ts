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

// ─── Categorías ───────────────────────────────────────────────────────────────

export interface Categoria {
  nombre: string
  descripcion?: string | null
  thumbnail_url?: string | null
  activo?: boolean
}

// ─── Notificaciones ───────────────────────────────────────────────────────────

export interface Notificacion {
  id: string
  mensaje: string
  tipo?: string
  leida?: boolean
  creado_en?: string
  link?: string
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
