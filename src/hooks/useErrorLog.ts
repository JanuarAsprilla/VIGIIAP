import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiMeta } from '@/types'
import api from '@/lib/api'
import { formatDate } from '@/lib/dateUtils'

export type EstadoError = 'pendiente' | 'revisando' | 'resuelto'

export interface ErrorLogRaw {
  id: number
  mensaje: string
  stack?: string | null
  metodo?: string | null
  ruta?: string | null
  status_code?: number | null
  ocurrencias: number
  primera_vez: string
  ultima_vez: string
  estado?: EstadoError
  estado_actualizado_en?: string | null
  estado_actualizado_por?: string | null
}

function normalizeError(e: ErrorLogRaw) {
  return {
    id:            e.id,
    mensaje:       e.mensaje,
    stack:         e.stack ?? '',
    metodo:        e.metodo ?? '—',
    ruta:          e.ruta ?? '—',
    statusCode:    e.status_code ?? 500,
    ocurrencias:   e.ocurrencias,
    primeraVez:    formatDate(e.primera_vez),
    ultimaVez:     formatDate(e.ultima_vez),
    ultimaVezIso:  e.ultima_vez,
    estado:        e.estado ?? 'pendiente',
    estadoActualizadoEn:  e.estado_actualizado_en ? formatDate(e.estado_actualizado_en) : null,
    estadoActualizadoPor: e.estado_actualizado_por ?? null,
  }
}

export type ErrorLogData = ReturnType<typeof normalizeError>

const ERRORES_KEY = ['admin', 'errores']

export function useErrorLog(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: [...ERRORES_KEY, params],
    queryFn:  () => api.get('/admin/errores', { params }),
    select:   (res: ErrorLogRaw[] | { data?: ErrorLogRaw[]; meta?: ApiMeta }) => ({
      data: (Array.isArray(res) ? res : (res.data ?? [])).map(normalizeError),
      meta: Array.isArray(res) ? undefined : res.meta,
    }),
    staleTime: 30_000,
  })
}

/** Cambia el seguimiento manual de un error (pendiente/revisando/resuelto) --
 *  ver admin.service.js#actualizarEstadoError en el backend para el porqué
 *  de que "resuelto" pueda volver a "pendiente" solo (no acá: eso lo decide
 *  el servidor cuando el error recurre, no el cliente). */
export function useActualizarEstadoError() {
  const qc = useQueryClient()
  return useMutation<void, Error, { id: number; estado: EstadoError }>({
    mutationFn: ({ id, estado }) => api.patch(`/admin/errores/${id}/estado`, { estado }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ERRORES_KEY }),
  })
}
