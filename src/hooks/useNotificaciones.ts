import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Notificacion } from '@/types'

type NotificacionesResponse = Notificacion[] | { data: Notificacion[] }

export function useAdminNotificaciones(enabled = false) {
  return useQuery<NotificacionesResponse, Error, Notificacion[]>({
    queryKey: ['admin', 'notificaciones'],
    queryFn:  () => api.get('/admin/notificaciones') as Promise<NotificacionesResponse>,
    select:   (res) => ('data' in res ? res.data : res) ?? [],
    enabled,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}
