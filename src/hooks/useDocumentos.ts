import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatDate } from '@/lib/dateUtils'
import type { ApiMeta } from '@/types'

function formatBytes(bytes) {
  if (!bytes) return null
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const EXT_TYPE = { doc: 'docx', xls: 'xlsx' }

function normalizeDoc(d) {
  const rawExt = d.archivo_url?.split('?')[0].split('.').pop()?.toLowerCase() ?? 'pdf'
  const type   = EXT_TYPE[rawExt] ?? rawExt
  return {
    id:          d.id,
    slug:        d.slug,
    titulo:      d.titulo,
    tipo:        d.tipo,
    anio:        d.anio,
    autores:     d.autores ?? '',
    resumen:     d.resumen ?? '',
    archivo_url: d.archivo_url ?? null,
    visibilidad: d.visibilidad ?? 'publico',
    activo:      d.activo,
    creado_en:   d.creado_en,
    // Alias para página pública y admin
    nombre:      d.titulo,
    categoria:   d.categoria ?? d.tipo,
    categoria_thumbnail_url: d.categoria_thumbnail_url ?? null,
    fecha:       formatDate(d.creado_en),
    type,
    url:         d.archivo_url ?? null,
    tamano:      formatBytes(d.tamano_bytes) ?? '—',
    descargas:   0,
  }
}

export type DocumentoData = ReturnType<typeof normalizeDoc>
export type DocumentoListResult = { data: DocumentoData[]; meta: ApiMeta }

export const DOCS_KEYS = {
  all:    ['documentos'],
  list:   (params) => ['documentos', 'list', params],
  detail: (slug)   => ['documentos', 'detail', slug],
}

export function useDocumentosList(params: Record<string, unknown> = {}) {
  return useQuery<DocumentoListResult>({
    queryKey: DOCS_KEYS.list(params),
    queryFn:  () => api.get('/documentos', { params }),
    select:   (res) => ({
      data: res.data.map(normalizeDoc),
      meta: res.meta,
    }),
  })
}

export function useDocumentoBySlug(slug) {
  return useQuery({
    queryKey: DOCS_KEYS.detail(slug),
    queryFn:  () => api.get(`/documentos/${slug}`),
    select:   normalizeDoc,
    enabled:  !!slug,
  })
}

export function useCreateDocumento() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, { formData: FormData; onUploadProgress?: (e: import('axios').AxiosProgressEvent) => void }>({
    mutationFn: ({ formData, onUploadProgress }) =>
      api.post('/documentos', formData, { onUploadProgress }),
    onSuccess: () => qc.invalidateQueries({ queryKey: DOCS_KEYS.all }),
  })
}

export function useUpdateDocumento() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, { id: string; formData: FormData; onUploadProgress?: (e: import('axios').AxiosProgressEvent) => void }>({
    mutationFn: ({ id, formData, onUploadProgress }) =>
      api.put(`/documentos/${id}`, formData, { onUploadProgress }),
    onSuccess: () => qc.invalidateQueries({ queryKey: DOCS_KEYS.all }),
  })
}

export function useDeleteDocumento() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, string>({
    mutationFn: (id) => api.delete(`/documentos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: DOCS_KEYS.all }),
  })
}

export function useToggleActivoDocumento() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, { id: string; activo: boolean }>({
    mutationFn: ({ id, activo }) => api.patch(`/documentos/${id}/activo`, { activo }),
    onSuccess: () => qc.invalidateQueries({ queryKey: DOCS_KEYS.all }),
  })
}
