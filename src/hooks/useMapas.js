import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatDate } from '@/lib/dateUtils'

// ─── Normalizar respuesta de backend → shape que usan las pages ───────────────
function deriveFormats(m) {
  const fmts = []
  if (m.archivo_pdf_url) fmts.push('PDF')
  if (m.archivo_img_url) fmts.push('IMG')
  if (m.geovisor_url)    fmts.push('GEOVISOR')
  return fmts.length ? fmts : ['PDF']
}

function normalizeMap(m) {
  const formats = deriveFormats(m)
  const primaryFmt = formats[0]
  return {
    // ── campos compartidos ──
    id:            m.id,
    slug:          m.slug,
    titulo:        m.titulo,
    categoria:     m.categoria,
    anio:          m.anio,
    descripcion:   m.descripcion ?? '',
    thumbnail_url: m.thumbnail_url ?? null,
    archivo_pdf_url: m.archivo_pdf_url ?? null,
    archivo_img_url: m.archivo_img_url ?? null,
    geovisor_url:  m.geovisor_url ?? null,
    activo:        m.activo,
    creado_en:     m.creado_en,
    // ── campos para página pública (Mapas.jsx) ──
    title:        m.titulo,
    category:     m.categoria,
    categoryKey:  m.categoria?.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-') ?? '',
    excerpt:      m.descripcion ?? '',
    year:         m.anio?.toString() ?? '',
    formats,
    badge:        primaryFmt === 'GEOVISOR' ? 'Geovisor' : primaryFmt,
    badgeColor:   'primary',
    geovisorLink: m.geovisor_url ?? '/geovisor',
    department:   '',  // no está en el schema actual
    // ── campos para panel admin (GestionMapas.jsx) ──
    nombre:    m.titulo,
    tematica:  m.categoria,
    escala:    '1:100.000',
    autor:     m.autor ?? '',
    fecha:     formatDate(m.creado_en),
    visible:   m.activo,
    formato:   primaryFmt === 'GEOVISOR' ? 'Geovisor' : primaryFmt,
    url:       m.geovisor_url ?? '',
    consultas: 0,
  }
}

// ─── Keys ─────────────────────────────────────────────────────────────────────
export const MAPAS_KEYS = {
  all:    ['mapas'],
  list:   (params) => ['mapas', 'list', params],
  detail: (slug)   => ['mapas', 'detail', slug],
}

// ─── Queries ──────────────────────────────────────────────────────────────────
export function useMapasList(params = {}) {
  return useQuery({
    queryKey:  MAPAS_KEYS.list(params),
    queryFn:   () => api.get('/mapas', { params }),
    select:    (res) => ({
      data: res.data.map(normalizeMap),
      meta: res.meta,
    }),
  })
}

export function useMapaBySlug(slug) {
  return useQuery({
    queryKey: MAPAS_KEYS.detail(slug),
    queryFn:  () => api.get(`/mapas/${slug}`),
    select:   normalizeMap,
    enabled:  !!slug,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────
export function useCreateMapa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ formData, onUploadProgress }) =>
      api.post('/mapas', formData, { onUploadProgress }),
    onSuccess: () => qc.invalidateQueries({ queryKey: MAPAS_KEYS.all }),
  })
}

export function useUpdateMapa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, formData, onUploadProgress }) =>
      api.put(`/mapas/${id}`, formData, { onUploadProgress }),
    onSuccess: () => qc.invalidateQueries({ queryKey: MAPAS_KEYS.all }),
  })
}

export function useToggleMapaActivo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, activo }) => api.patch(`/mapas/${id}/activo`, { activo }),
    onSuccess: () => qc.invalidateQueries({ queryKey: MAPAS_KEYS.all }),
  })
}

export function useDeleteMapa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/mapas/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: MAPAS_KEYS.all }),
  })
}
