import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export function useAdminStats(enabled: boolean = true) {
  return useQuery<{ documentos: number; solicitudesPendientes: number; [key: string]: unknown }>({
    queryKey: ['admin', 'stats'],
    queryFn:  () => api.get('/admin/stats'),
    staleTime: 1000 * 60 * 2,  // 2 min — dashboard se refresca frecuente
    enabled,
  })
}
