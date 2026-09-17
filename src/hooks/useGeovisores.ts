import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { ApiListResponse, GeovisorRaw, GeovisorInput, TemaCapas } from '@/types'

const KEYS = {
  all:     ['geovisores'],
  list:    (params: Record<string, unknown>) => ['geovisores', 'list', params],
  detail:  (slug: string | null | undefined) => ['geovisores', 'detail', slug],
  capas:   (slug: string | null | undefined) => ['geovisores', 'capas', slug],
}

/** Vista admin: incluye geovisores inactivos y no filtra por visibilidad (admin=true, ver getAll en geovisores.service.js). */
export function useGeovisoresList(params: Record<string, unknown> = {}) {
  const adminParams = { admin: 'true', limit: 200, ...params }
  return useQuery<ApiListResponse<GeovisorRaw>>({
    queryKey: KEYS.list(adminParams),
    queryFn:  () => api.get('/geovisores', { params: adminParams }),
  })
}

/** Vista pública: solo geovisores activos, filtrados por visibilidad según la sesión (o falta de ella) -- ver getAll en geovisores.service.js. */
export function useGeovisoresPublico(params: Record<string, unknown> = {}) {
  return useQuery<ApiListResponse<GeovisorRaw>>({
    queryKey: KEYS.list({ limit: 200, ...params }),
    queryFn:  () => api.get('/geovisores', { params: { limit: 200, ...params } }),
    staleTime: 60_000,
  })
}

export function useGeovisorPorSlug(slug: string | null | undefined) {
  return useQuery<GeovisorRaw>({
    queryKey: KEYS.detail(slug),
    queryFn:  () => api.get(`/geovisores/${slug}`) as Promise<GeovisorRaw>,
    enabled:  !!slug,
    staleTime: 60_000,
  })
}

/** Catálogo de capas de un geovisor, agrupado por tema -- descubierto en vivo contra GeoServer. */
export function useCapasDeGeovisor(slug: string | null | undefined) {
  return useQuery<{ temas: TemaCapas[] }, Error, TemaCapas[]>({
    queryKey: KEYS.capas(slug),
    queryFn:  () => api.get(`/geovisores/${slug}/capas`) as Promise<{ temas: TemaCapas[] }>,
    select:   (res) => res.temas,
    enabled:  !!slug,
    staleTime: 60_000,
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
