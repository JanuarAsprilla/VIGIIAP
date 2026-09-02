import { useQuery } from '@tanstack/react-query'
import type { ApiMeta } from '@/types'
import api from '@/lib/api'
import { formatDate } from '@/lib/dateUtils'

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
}

function normalizeError(e: ErrorLogRaw) {
  return {
    id:          e.id,
    mensaje:     e.mensaje,
    stack:       e.stack ?? '',
    metodo:      e.metodo ?? '—',
    ruta:        e.ruta ?? '—',
    statusCode:  e.status_code ?? 500,
    ocurrencias: e.ocurrencias,
    primeraVez:  formatDate(e.primera_vez),
    ultimaVez:   formatDate(e.ultima_vez),
  }
}

export type ErrorLogData = ReturnType<typeof normalizeError>

export function useErrorLog(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['admin', 'errores', params],
    queryFn:  () => api.get('/admin/errores', { params }),
    select:   (res: ErrorLogRaw[] | { data?: ErrorLogRaw[]; meta?: ApiMeta }) => ({
      data: (Array.isArray(res) ? res : (res.data ?? [])).map(normalizeError),
      meta: Array.isArray(res) ? undefined : res.meta,
    }),
    staleTime: 30_000,
  })
}
