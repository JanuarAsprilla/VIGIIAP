/**
 * Contenido real (mapas, documentos, geovisores) para el Command Palette —
 * separado de las páginas que ya consultan estos mismos endpoints porque
 * usan parámetros de paginación/filtro propios que no comparten cache con
 * una búsqueda global. `enabled` evita disparar estas 3 consultas mientras
 * el palette nunca se abrió.
 */
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { ApiListResponse, GeovisorRaw } from '@/types'

interface MapaSearchItem {
  id: string
  slug?: string
  titulo: string
  categoria: string
  descripcion?: string | null
}

interface DocumentoSearchItem {
  id: string
  slug?: string
  titulo: string
  tipo: string
  categoria?: string | null
  resumen?: string | null
}

const KEYS = {
  mapas:       ['busqueda-global', 'mapas'],
  documentos:  ['busqueda-global', 'documentos'],
  geovisores:  ['busqueda-global', 'geovisores'],
}

export function useGlobalSearchContent(enabled: boolean) {
  const mapas = useQuery<ApiListResponse<MapaSearchItem>, Error, MapaSearchItem[]>({
    queryKey: KEYS.mapas,
    queryFn:  () => api.get('/mapas', { params: { limit: 100 } }),
    select:   (res) => res.data,
    enabled,
    staleTime: 60_000,
  })

  const documentos = useQuery<ApiListResponse<DocumentoSearchItem>, Error, DocumentoSearchItem[]>({
    queryKey: KEYS.documentos,
    queryFn:  () => api.get('/documentos', { params: { limit: 100 } }),
    select:   (res) => res.data,
    enabled,
    staleTime: 60_000,
  })

  const geovisores = useQuery<ApiListResponse<GeovisorRaw>, Error, GeovisorRaw[]>({
    queryKey: KEYS.geovisores,
    queryFn:  () => api.get('/geovisores', { params: { limit: 100 } }),
    select:   (res) => res.data,
    enabled,
    staleTime: 60_000,
  })

  return {
    mapas:      mapas.data ?? [],
    documentos: documentos.data ?? [],
    geovisores: geovisores.data ?? [],
  }
}
