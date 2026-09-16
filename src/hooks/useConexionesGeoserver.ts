import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { ConexionGeoserverRaw, ConexionGeoserverInput, WorkspaceOption } from '@/types'

const KEYS = {
  all:        ['conexiones-geoserver'],
  list:       () => ['conexiones-geoserver', 'list'],
  workspaces: (conexionId: string | null | undefined) => ['conexiones-geoserver', 'workspaces', conexionId],
}

export function useConexionesGeoserverList() {
  return useQuery<ConexionGeoserverRaw[]>({
    queryKey: KEYS.list(),
    queryFn:  () => api.get('/admin/conexiones-geoserver'),
  })
}

/** Workspaces publicados en una conexión -- para elegir `workspacesGeoserver` al crear/editar un geovisor. */
export function useWorkspacesDeConexion(conexionId: string | null | undefined) {
  return useQuery<WorkspaceOption[]>({
    queryKey: KEYS.workspaces(conexionId),
    queryFn:  () => api.get(`/admin/conexiones-geoserver/${conexionId}/workspaces`),
    enabled:  !!conexionId,
    staleTime: 60_000,
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
