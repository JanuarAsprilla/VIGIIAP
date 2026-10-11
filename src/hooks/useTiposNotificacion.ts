import { useQuery } from '@tanstack/react-query'
import type { TipoNotificacion } from '@/types'
import api from '@/lib/api'

const KEY = ['tipos-notificacion']

/** Catálogo de tipos activos -- alimenta NotificacionesPanel (ícono/color/etiqueta reales). */
export function useTiposNotificacionList() {
  return useQuery<{ data: TipoNotificacion[] }, Error, TipoNotificacion[]>({
    queryKey: KEY,
    queryFn:  () => api.get('/notificaciones/tipos') as Promise<{ data: TipoNotificacion[] }>,
    select:   (res) => res.data ?? [],
    staleTime: 5 * 60 * 1000,
  })
}
