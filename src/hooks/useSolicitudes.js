import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatDate } from '@/lib/dateUtils'

// ─── Mapeo de estados backend → UI ────────────────────────────────────────────
const ESTADO_LABEL = {
  pendiente:   'Pendiente',
  en_revision: 'En Revisión',
  aprobada:    'Aprobado',
  rechazada:   'Rechazado',
}
const ESTADO_COLOR = {
  'Pendiente':   'orange',
  'En Revisión': 'blue',
  'Aprobado':    'green',
  'Rechazado':   'red',
}
const ESTADO_API = {
  'Pendiente':   'pendiente',
  'En Revisión': 'en_revision',
  'Aprobado':    'aprobada',
  'Rechazado':   'rechazada',
}

function buildTimeline(estadoRaw) {
  if (estadoRaw === 'aprobada')    return ['Recibida', 'Pendiente', 'En Revisión', 'Aprobado']
  if (estadoRaw === 'rechazada')   return ['Recibida', 'Pendiente', 'En Revisión', 'Rechazado']
  if (estadoRaw === 'en_revision') return ['Recibida', 'Pendiente', 'En Revisión']
  return ['Recibida', 'Pendiente']
}

function normalizeSolicitud(s) {
  const estadoLabel = ESTADO_LABEL[s.estado] ?? 'En Proceso'
  return {
    // UI id: primeros 8 chars del UUID en mayúsculas (legible)
    id:         `#${s.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`,
    _id:        s.id,   // UUID real para llamadas a la API
    tipo:       s.tipo,
    subtipo:    s.descripcion?.slice(0, 60) ?? '',
    descripcion: s.descripcion ?? '',
    fecha:      formatDate(s.creado_en),
    creadoEn:   s.creado_en,
    estado:     estadoLabel,
    estadoColor: ESTADO_COLOR[estadoLabel] ?? 'yellow',
    solicitante: s.solicitante ?? '',
    email:      s.email ?? '',
    notas:      s.nota_admin ?? '',
    timeline:   buildTimeline(s.estado),
    revisor:    'Sin asignar',
  }
}

// ─── Keys ─────────────────────────────────────────────────────────────────────
export const SOL_KEYS = {
  all:  ['solicitudes'],
  list: (params) => ['solicitudes', 'list', params],
  mine: (params) => ['solicitudes', 'mine', params],
}

// ─── Queries ──────────────────────────────────────────────────────────────────
export function useSolicitudesAdmin(params = {}) {
  return useQuery({
    queryKey: SOL_KEYS.list(params),
    queryFn:  () => api.get('/solicitudes', { params }),
    select:   (res) => ({
      data: res.data.map(normalizeSolicitud),
      meta: res.meta,
    }),
  })
}

export function useMisSolicitudes(params = {}) {
  return useQuery({
    queryKey: SOL_KEYS.mine(params),
    queryFn:  () => api.get('/solicitudes/mis-solicitudes', { params }),
    select:   (res) => ({
      data: res.data.map(normalizeSolicitud),
      meta: res.meta,
    }),
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────
export function useCreateSolicitud() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/solicitudes', data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: SOL_KEYS.all }),
  })
}

export function useUpdateEstadoSolicitud() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, estado, nota }) =>
      api.patch(`/solicitudes/${id}/estado`, {
        estado: ESTADO_API[estado] ?? estado,
        nota,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SOL_KEYS.all }),
  })
}

// Exportar el mapa para uso en páginas
export { ESTADO_API }
