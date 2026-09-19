import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { NotificacionPref } from '@/types'
import api from '@/lib/api'

const KEY = ['notificacion-prefs']

/** Preferencias del usuario autenticado -- solo tipos aplicables a su rol (ver prefs.service.js). */
export function useNotificacionPrefs(enabled = true) {
  return useQuery<{ data: NotificacionPref[] }, Error, NotificacionPref[]>({
    queryKey: KEY,
    queryFn:  () => api.get('/notificaciones/prefs') as Promise<{ data: NotificacionPref[] }>,
    select:   (res) => res.data ?? [],
    enabled,
  })
}

export function useUpdateNotificacionPref() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, { clave: string; enPantalla: boolean }>({
    mutationFn: ({ clave, enPantalla }) => api.patch(`/notificaciones/prefs/${clave}`, { enPantalla }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
