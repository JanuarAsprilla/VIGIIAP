import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { SolicitudRaw } from '@/types'
import api from '@/lib/api'
import { formatDate } from '@/lib/dateUtils'
import type { ApiMeta } from '@/types'

const TIPO_LABEL: Record<string, string> = {
  'uso-suelo':         'Certificado de Uso de Suelo',
  'linderos':          'Consulta de Linderos',
  'estudio-ambiental': 'Estudio Técnico Ambiental',
  'validacion':        'Validación Cartográfica',
  'aprovechamiento':   'Permiso de Aprovechamiento Forestal',
  'otro':              'Otro',
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente:   'Pendiente',
  en_revision: 'En Revisión',
  aprobada:    'Aprobado',
  rechazada:   'Rechazado',
  resuelta:    'Resuelta',
}
const ESTADO_COLOR: Record<string, string> = {
  'Pendiente':   'orange',
  'En Revisión': 'blue',
  'Aprobado':    'green',
  'Rechazado':   'red',
  'Resuelta':    'teal',
}
export const ESTADO_API: Record<string, string> = {
  'Pendiente':   'pendiente',
  'En Revisión': 'en_revision',
  'Aprobado':    'aprobada',
  'Rechazado':   'rechazada',
  'Resuelta':    'resuelta',
}

// Transiciones válidas por estado — espejo de la máquina del backend
export const TRANSICIONES_VALIDAS: Record<string, string[]> = {
  pendiente:   ['En Revisión', 'Aprobado', 'Rechazado'],
  en_revision: ['Pendiente', 'Aprobado', 'Rechazado', 'Resuelta'],
  aprobada:    ['Resuelta', 'En Revisión'],
  rechazada:   ['En Revisión', 'Aprobado'],
  resuelta:    [], // estado final
}

function buildTimeline(estadoRaw: string): string[] {
  if (estadoRaw === 'resuelta')    return ['Recibida', 'Pendiente', 'En Revisión', 'Resuelta']
  if (estadoRaw === 'aprobada')    return ['Recibida', 'Pendiente', 'En Revisión', 'Aprobado']
  if (estadoRaw === 'rechazada')   return ['Recibida', 'Pendiente', 'En Revisión', 'Rechazado']
  if (estadoRaw === 'en_revision') return ['Recibida', 'Pendiente', 'En Revisión']
  return ['Recibida', 'Pendiente']
}

function normalizeSolicitud(s: SolicitudRaw) {
  const estadoLabel = ESTADO_LABEL[s.estado] ?? 'En Proceso'
  return {
    id:             `#${s.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`,
    _id:            s.id,
    tipo:           TIPO_LABEL[s.tipo] ?? s.tipo,
    tipoRaw:        s.tipo,
    subtipo:        s.descripcion?.slice(0, 60) ?? '',
    descripcion:    s.descripcion ?? '',
    fecha:          formatDate(s.creado_en),
    creadoEn:       s.creado_en,
    estado:         estadoLabel,
    estadoRaw:      s.estado,
    estadoColor:    ESTADO_COLOR[estadoLabel] ?? 'yellow',
    solicitante:    s.solicitante ?? '',
    email:          s.email ?? '',
    notas:          s.nota_admin ?? '',
    respondidaEn:   s.respondida_en ?? null,
    timeline:       buildTimeline(s.estado),
    revisor:        s.revisado_por_nombre ?? null,
    diasPendiente:  s.dias_pendiente ?? Math.floor(
      (Date.now() - new Date(s.creado_en).getTime()) / 86_400_000
    ),
    accionesValidas: TRANSICIONES_VALIDAS[s.estado] ?? [],
  }
}

// ─── Tipos derivados ──────────────────────────────────────────────────────────
export type SolicitudData = ReturnType<typeof normalizeSolicitud>
export type SolicitudListResult = { data: SolicitudData[]; meta: ApiMeta }

export const SOL_KEYS = {
  all:    ['solicitudes'],
  list:   (params: Record<string, unknown>) => ['solicitudes', 'list', params],
  mine:   (params: Record<string, unknown>) => ['solicitudes', 'mine', params],
  detail: (id: string | null | undefined)   => ['solicitudes', 'detail', id],
}

type SolicitudRawListResult = { data: SolicitudRaw[]; meta: ApiMeta }

export function useSolicitudesAdmin(params: Record<string, unknown> = {}) {
  return useQuery<SolicitudRawListResult, Error, SolicitudListResult>({
    queryKey: SOL_KEYS.list(params),
    queryFn:  () => api.get('/solicitudes', { params }) as Promise<SolicitudRawListResult>,
    select:   (res) => ({
      data: res.data.map(normalizeSolicitud),
      meta: res.meta,
    }),
  })
}

export function useMisSolicitudes(params: Record<string, unknown> = {}) {
  return useQuery<SolicitudRawListResult, Error, SolicitudListResult>({
    queryKey: SOL_KEYS.mine(params),
    queryFn:  () => api.get('/solicitudes/mis-solicitudes', { params }) as Promise<SolicitudRawListResult>,
    select:   (res) => ({
      data: res.data.map(normalizeSolicitud),
      meta: res.meta,
    }),
  })
}

export function useSolicitudById(id: string | null | undefined) {
  return useQuery<SolicitudRaw, Error, SolicitudData>({
    queryKey: SOL_KEYS.detail(id),
    queryFn:  () => api.get(`/solicitudes/${id}`) as Promise<SolicitudRaw>,
    enabled:  !!id,
    select:   normalizeSolicitud,
  })
}

export function useCreateSolicitud() {
  const qc = useQueryClient()
  return useMutation<void, Error, Record<string, unknown>>({
    mutationFn: (data) => api.post('/solicitudes', data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: SOL_KEYS.all }),
  })
}

export function useUpdateEstadoSolicitud() {
  const qc = useQueryClient()
  return useMutation<void, Error, { id: string; estado: string; nota?: string }>({
    mutationFn: ({ id, estado, nota }) =>
      api.patch(`/solicitudes/${id}/estado`, {
        estado: ESTADO_API[estado as keyof typeof ESTADO_API] ?? estado,
        nota,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SOL_KEYS.all }),
  })
}

export function useResponderSolicitud() {
  const qc = useQueryClient()
  return useMutation<void, Error, { id: string; respuesta: string }>({
    mutationFn: ({ id, respuesta }) =>
      api.post(`/solicitudes/${id}/responder`, { respuesta }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SOL_KEYS.all }),
  })
}

export interface ArchivoSolicitud {
  id: string
  nombre: string
  tamano_bytes?: number
  url?: string
  tipo?: string
}

export function useSolicitudArchivos(solicitudId: string | null | undefined) {
  return useQuery<ArchivoSolicitud[]>({
    queryKey: [...SOL_KEYS.all, solicitudId, 'archivos'],
    queryFn:  () => api.get(`/solicitudes/${solicitudId}/archivos`),
    enabled:  !!solicitudId,
  })
}

export function useUploadSolicitudArchivo() {
  const qc = useQueryClient()
  return useMutation<void, Error, { solicitudId: string; file: File }>({
    mutationFn: ({ solicitudId, file }) => {
      const fd = new FormData()
      fd.append('archivo', file)
      return api.post(`/solicitudes/${solicitudId}/archivos`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: (_data, { solicitudId }) => {
      qc.invalidateQueries({ queryKey: [...SOL_KEYS.all, solicitudId, 'archivos'] })
    },
  })
}

export function useDeleteSolicitudArchivo() {
  const qc = useQueryClient()
  return useMutation<void, Error, { solicitudId: string; archivoId: string }>({
    mutationFn: ({ solicitudId, archivoId }) =>
      api.delete(`/solicitudes/${solicitudId}/archivos/${archivoId}`),
    onSuccess: (_data, { solicitudId }) => {
      qc.invalidateQueries({ queryKey: [...SOL_KEYS.all, solicitudId, 'archivos'] })
    },
  })
}

export function useDownloadSolicitudArchivo() {
  return useMutation<{ url: string }, Error, { solicitudId: string; archivoId: string }>({
    mutationFn: ({ solicitudId, archivoId }) =>
      api.get(`/solicitudes/${solicitudId}/archivos/${archivoId}/download`),
  })
}
