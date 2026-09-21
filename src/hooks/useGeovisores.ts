import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { ApiListResponse, GeovisorRaw, GeovisorInput, TemaCapas } from '@/types'

const KEYS = {
  all:     ['geovisores'],
  list:    (params: Record<string, unknown>) => ['geovisores', 'list', params],
  detail:  (slug: string | null | undefined) => ['geovisores', 'detail', slug],
  capas:   (slug: string | null | undefined) => ['geovisores', 'capas', slug],
}

const PAGE_LIMIT   = 100 // techo real del backend (ver paginate.js) -- pedir más no sirve, se recorta igual
const MAX_PAGINAS  = 20  // salvaguarda (2000 geovisores) contra un loop descontrolado

/**
 * El backend recorta `limit` a un máximo de 100 por página (paginate.js) sin
 * avisar al cliente -- pedir limit:200 antes se recortaba en silencio y, con
 * más de 100 geovisores, algunos simplemente desaparecían de toda vista
 * (admin y portal) sin ningún indicio visual de que había más páginas. Como
 * el catálogo de geovisores es curado (no crece sin límite como un log de
 * auditoría), se trae todo el listado automáticamente en vez de exponer
 * paginación al usuario.
 */
async function fetchTodosLosGeovisores(params: Record<string, unknown>): Promise<ApiListResponse<GeovisorRaw>> {
  let pagina = 1
  let acumulado: GeovisorRaw[] = []
  let ultimoMeta: ApiListResponse<GeovisorRaw>['meta'] = { total: 0 }
  while (pagina <= MAX_PAGINAS) {
    const res = await api.get('/geovisores', { params: { ...params, limit: PAGE_LIMIT, page: pagina } }) as ApiListResponse<GeovisorRaw>
    acumulado = acumulado.concat(res.data)
    ultimoMeta = res.meta
    if (!res.meta || res.data.length < PAGE_LIMIT) break
    pagina++
  }
  return { data: acumulado, meta: { ...ultimoMeta, total: acumulado.length } }
}

/** Vista admin: incluye geovisores inactivos y no filtra por visibilidad (admin=true, ver getAll en geovisores.service.js). */
export function useGeovisoresList(params: Record<string, unknown> = {}) {
  const adminParams = { admin: 'true', ...params }
  return useQuery<ApiListResponse<GeovisorRaw>>({
    queryKey: KEYS.list(adminParams),
    queryFn:  () => fetchTodosLosGeovisores(adminParams),
  })
}

/** Vista pública: solo geovisores activos, filtrados por visibilidad según la sesión (o falta de ella) -- ver getAll en geovisores.service.js. */
export function useGeovisoresPublico(params: Record<string, unknown> = {}) {
  return useQuery<ApiListResponse<GeovisorRaw>>({
    queryKey: KEYS.list(params),
    queryFn:  () => fetchTodosLosGeovisores(params),
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

export function useUploadGeovisorThumbnail() {
  const qc = useQueryClient()
  // file null = quitar la miniatura -- se envía el multipart sin el campo
  // "thumbnail", que el backend interpreta como orden de borrarla (ver
  // uploadThumbnail() en geovisores.controller.js).
  return useMutation<GeovisorRaw, Error, { id: string; file: File | null; onUploadProgress?: (e: import('axios').AxiosProgressEvent) => void }>({
    mutationFn: ({ id, file, onUploadProgress }) => {
      const fd = new FormData()
      if (file) fd.append('thumbnail', file)
      return api.post(`/geovisores/${id}/thumbnail`, fd, { onUploadProgress })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
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
