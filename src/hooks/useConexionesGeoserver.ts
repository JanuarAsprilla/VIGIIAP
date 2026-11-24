import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  ConexionGeoserverRaw, ConexionGeoserverInput, TipoConexionGeoserver, WorkspaceOption,
  InventarioGeoserver, ResultadoSincronizacion,
} from '@/types'

const KEYS = {
  inventario: (conexionId: string | null | undefined) => ['conexiones-geoserver', 'inventario', conexionId],
  all:        ['conexiones-geoserver'],
  list:       () => ['conexiones-geoserver', 'list'],
  seleccionables: () => ['conexiones-geoserver', 'seleccionables'],
  workspaces: (conexionId: string | null | undefined) => ['conexiones-geoserver', 'workspaces', conexionId],
}

export function useConexionesGeoserverList() {
  return useQuery<ConexionGeoserverRaw[]>({
    queryKey: KEYS.list(),
    queryFn:  () => api.get('/admin/conexiones-geoserver'),
  })
}

/** Lo mínimo para elegir una conexión al armar un geovisor (sin URL ni credenciales). */
export interface ConexionSeleccionable {
  id: string
  nombre: string
  tipo: TipoConexionGeoserver
  activo: boolean
  capas_nuevas_auto: boolean
}

/**
 * Conexiones que se pueden ELEGIR para un geovisor. Se pide con el permiso del módulo Geovisores:
 * quien no tiene Conexiones GeoServer puede usar las existentes sin verlas ni administrarlas
 * (useConexionesGeoserverList, que exige ese módulo, queda para su propia pantalla).
 */
export function useConexionesSeleccionables() {
  return useQuery<ConexionSeleccionable[]>({
    queryKey: KEYS.seleccionables(),
    queryFn:  () => api.get('/admin/conexiones-geoserver/seleccionables'),
  })
}

/** Workspaces publicados en una conexión -- para elegir `workspacesGeoserver` al crear/editar un geovisor. */
export function useWorkspacesDeConexion(conexionId: string | null | undefined) {
  return useQuery<WorkspaceOption[]>({
    queryKey: KEYS.workspaces(conexionId),
    queryFn:  () => api.get(`/admin/conexiones-geoserver/${conexionId}/workspaces`),
    enabled:  !!conexionId,
    staleTime: 30_000,
  })
}

/** Lo que GeoServer tiene publicado según la última sincronización (solo lectura; sin credenciales). */
export function useInventarioGeoserver(conexionId: string | null | undefined) {
  return useQuery<InventarioGeoserver>({
    queryKey: KEYS.inventario(conexionId),
    queryFn:  () => api.get(`/admin/conexiones-geoserver/${conexionId}/inventario`, { params: { incluirEliminados: 'true' } }),
    enabled:  !!conexionId,
  })
}

export const MENSAJE_LIMITE_SINCRONIZACION = 'Espera un minuto antes de volver a sincronizar.'
export const MENSAJE_SINCRONIZACION_EN_CURSO = 'Ya hay una sincronización en curso; espera a que termine.'

export function useSincronizarConexionGeoserver() {
  const qc = useQueryClient()
  return useMutation<ResultadoSincronizacion, Error & { status?: number }, string>({
    mutationFn: async (id) => {
      try {
        return await api.post(`/admin/conexiones-geoserver/${id}/sincronizar`)
      } catch (err) {
        const status = (err as { status?: number }).status
        if (status === 429) throw Object.assign(new Error(MENSAJE_LIMITE_SINCRONIZACION), { status })
        if (status === 409) throw Object.assign(new Error(MENSAJE_SINCRONIZACION_EN_CURSO), { status })
        throw err
      }
    },
    // Con 409 otra sincronización ya corre: se refresca para mostrar su estado en vez de quedar desfasado.
    onError: (err, id) => { if (err.status === 409) void qc.invalidateQueries({ queryKey: KEYS.inventario(id) }) },
    onSuccess: (_res, id) => Promise.all([
      qc.invalidateQueries({ queryKey: KEYS.inventario(id) }),
      // El catálogo público se arma con este inventario: que el visor lo vuelva a pedir.
      qc.invalidateQueries({ queryKey: ['geovisores', 'capas'] }),
    ]),
  })
}

export function useCreateConexionGeoserver() {
  const qc = useQueryClient()
  return useMutation<ConexionGeoserverRaw, Error, ConexionGeoserverInput>({
    mutationFn: (data) => api.post('/admin/conexiones-geoserver', data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useUpdateConexionGeoserver() {
  const qc = useQueryClient()
  return useMutation<ConexionGeoserverRaw, Error, { id: string; data: Partial<ConexionGeoserverInput> }>({
    mutationFn: ({ id, data }) => api.patch(`/admin/conexiones-geoserver/${id}`, data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

/** Endpoint estrecho: solo cambia esa opción; lo usan también quienes editan geovisores, no solo el super admin. */
export function useSetCapasNuevasConexionGeoserver() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, { id: string; capasNuevasAuto: boolean }>({
    mutationFn: ({ id, capasNuevasAuto }) => api.patch(`/admin/conexiones-geoserver/${id}/capas-nuevas`, { capasNuevasAuto }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useDeleteConexionGeoserver() {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (id) => api.delete(`/admin/conexiones-geoserver/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}
