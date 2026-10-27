import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { ConexionGeoserverRaw, ConexionGeoserverInput, TipoConexionGeoserver, WorkspaceOption } from '@/types'

const KEYS = {
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

export function useDeleteConexionGeoserver() {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (id) => api.delete(`/admin/conexiones-geoserver/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}
