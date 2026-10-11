import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Notificacion } from '@/types'

const KEY = ['notificaciones']

/**
 * Notificaciones del usuario autenticado -- cualquier rol con cuenta real
 * (no solo administradores), leídas desde una tabla real en vez de la
 * papelera de eventos sintetizados que había antes. El estado de lectura
 * (leido_en) vive en el servidor, por cuenta, no en localStorage del
 * navegador.
 */
export function useNotificaciones(enabled = false) {
  return useQuery<{ data: Notificacion[] }, Error, Notificacion[]>({
    queryKey: KEY,
    queryFn:  () => api.get('/notificaciones') as Promise<{ data: Notificacion[] }>,
    select:   (res) => res.data ?? [],
    enabled,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}

export function useMarcarNotificacionLeida() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, string>({
    mutationFn: (id) => api.patch(`/notificaciones/${id}/leida`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useMarcarTodasNotificacionesLeidas() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, void>({
    mutationFn: () => api.patch('/notificaciones/leer-todas'),
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
