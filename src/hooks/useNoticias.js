import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatDate, timeAgo } from '@/lib/dateUtils'

// ─── Normalizar ───────────────────────────────────────────────────────────────
function normalizeNoticia(n) {
  return {
    id:        n.id,
    slug:      n.slug,
    // Campos para página pública
    title:     n.titulo,
    excerpt:   n.resumen ?? '',
    content:   n.contenido ?? '',
    tag:       n.categoria?.toUpperCase() ?? 'NOTICIAS',
    tagColor:  'primary',
    category:  n.categoria ?? '',
    author:    n.autor ?? 'IIAP',
    date:      formatDate(n.publicado_en ?? n.creado_en),
    time:      timeAgo(n.publicado_en ?? n.creado_en),
    // Campos para panel admin
    published: n.publicado,
    thumbUrl:  n.imagen_url ?? '',
    // Campos backend raw (para edición)
    titulo:    n.titulo,
    resumen:   n.resumen ?? '',
    contenido: n.contenido ?? '',
    categoria: n.categoria ?? '',
    imagen_url: n.imagen_url ?? '',
    publicado: n.publicado,
  }
}

// ─── Keys ─────────────────────────────────────────────────────────────────────
export const NOTICIAS_KEYS = {
  all:    ['noticias'],
  list:   (params) => ['noticias', 'list', params],
  detail: (slug)   => ['noticias', 'detail', slug],
}

// ─── Queries ──────────────────────────────────────────────────────────────────
export function useNoticiasList(params = {}) {
  return useQuery({
    queryKey: NOTICIAS_KEYS.list(params),
    queryFn:  () => api.get('/noticias', { params }),
    select:   (res) => ({
      data: res.data.map(normalizeNoticia),
      meta: res.meta,
    }),
  })
}

export function useNoticiaBySlug(slug) {
  return useQuery({
    queryKey: NOTICIAS_KEYS.detail(slug),
    queryFn:  () => api.get(`/noticias/${slug}`),
    select:   normalizeNoticia,
    enabled:  !!slug,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────
export function useCreateNoticia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData) => api.post('/noticias', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTICIAS_KEYS.all }),
  })
}

export function useUpdateNoticia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/noticias/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTICIAS_KEYS.all }),
  })
}

export function useDeleteNoticia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/noticias/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTICIAS_KEYS.all }),
  })
}
