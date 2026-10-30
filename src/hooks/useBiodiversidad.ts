import { keepPreviousData, useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  EstadoBiodiversidad, FiltrosRegistros, Grupo, RespuestaMunicipios, RespuestaRegistros,
} from '@/components/herramientas/biodiversidad/types'

const BASE = '/biodiversidad'
const CINCO_MIN = 5 * 60 * 1000

export const biodiversidadKeys = {
  estado: ['biodiversidad', 'estado'] as const,
  municipios: (grupo: Grupo) => ['biodiversidad', 'municipios', grupo] as const,
  registros: (f: FiltrosRegistros) => ['biodiversidad', 'registros', f] as const,
}

export function useBiodiversidadEstado() {
  return useQuery<EstadoBiodiversidad>({
    queryKey: biodiversidadKeys.estado,
    queryFn: () => api.get(`${BASE}/estado`),
    staleTime: CINCO_MIN,
    retry: false,
  })
}

export function useBiodiversidadMunicipios(grupo: Grupo) {
  return useQuery<RespuestaMunicipios>({
    queryKey: biodiversidadKeys.municipios(grupo),
    queryFn: () => api.get(`${BASE}/municipios`, { params: { grupo } }),
    staleTime: CINCO_MIN,
    retry: false,
    placeholderData: keepPreviousData,
  })
}

/** Solo grupos individuales: en los agregados el servidor responde 422, así que `habilitado` debe ser false. */
export function useBiodiversidadRegistros(filtros: FiltrosRegistros, habilitado: boolean) {
  const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== undefined && v !== null))
  return useQuery<RespuestaRegistros>({
    queryKey: biodiversidadKeys.registros(filtros),
    queryFn: () => api.get(`${BASE}/registros`, { params }),
    enabled: habilitado,
    staleTime: 60 * 1000,
    retry: false,
    placeholderData: keepPreviousData,
  })
}
