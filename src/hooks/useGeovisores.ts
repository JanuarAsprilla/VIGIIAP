import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { ApiListResponse, GeovisorRaw, GeovisorInput } from '@/types'

const KEYS = {
  all:  ['geovisores'],
  list: (params: Record<string, unknown>) => ['geovisores', 'list', params],
}

/** Vista admin: incluye geovisores inactivos y no filtra por visibilidad (admin=true, ver getAll en geovisores.service.js). */
export function useGeovisoresList(params: Record<string, unknown> = {}) {
  const adminParams = { admin: 'true', limit: 200, ...params }
  return useQuery<ApiListResponse<GeovisorRaw>>({
    queryKey: KEYS.list(adminParams),
    queryFn:  () => api.get('/geovisores', { params: adminParams }),
  })
}

export function useCreateGeovisor() {
  const qc = useQueryClient()
  return useMutation<GeovisorRaw, Error, GeovisorInput>({
    mutationFn: (data) => api.post('/geovisores', data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useUpdateGeovisor() {
  const qc = useQueryClient()
  return useMutation<GeovisorRaw, Error, { id: string; data: Partial<GeovisorInput> }>({
    mutationFn: ({ id, data }) => api.patch(`/geovisores/${id}`, data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useToggleGeovisorActivo() {
  const qc = useQueryClient()
  return useMutation<GeovisorRaw, Error, { id: string; activo: boolean }>({
    mutationFn: ({ id, activo }) => api.patch(`/geovisores/${id}/activo`, { activo }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useDeleteGeovisor() {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (id) => api.delete(`/geovisores/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}
