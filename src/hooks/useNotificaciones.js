import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export function useAdminNotificaciones(enabled = false) {
  return useQuery({
    queryKey: ['admin', 'notificaciones'],
    queryFn:  () => api.get('/admin/notificaciones'),
    select:   (res) => res.data ?? res ?? [],
    enabled,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}
