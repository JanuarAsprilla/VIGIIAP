import { useQuery } from '@tanstack/react-query'
import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson'

export interface PropiedadesMunicipio {
  c: string
  n: string
  d: string
}

export type GeoMunicipios = FeatureCollection<Polygon | MultiPolygon, PropiedadesMunicipio>

/** Carga perezosa del activo propio de 92 municipios: no engorda el chunk compartido. */
export function useGeoMunicipios() {
  return useQuery<GeoMunicipios>({
    queryKey: ['biodiversidad', 'geo-municipios'],
    queryFn: async () => (await import('../data/municipios.geo.json')).default as unknown as GeoMunicipios,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  })
}
