import { keepPreviousData, useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  AlcanceTerritorial, EstadoBiodiversidad, FiltrosEspecies, FiltrosRegistros, Grupo, RegistroDetalle,
  RespuestaEspecies, RespuestaMunicipios, RespuestaRegistros, RespuestaResumen, RespuestaSeries,
} from '@/components/herramientas/biodiversidad/types'

const BASE = '/biodiversidad'
const CINCO_MIN = 5 * 60 * 1000

export const biodiversidadKeys = {
  estado: ['biodiversidad', 'estado'] as const,
  municipios: (grupo: Grupo) => ['biodiversidad', 'municipios', grupo] as const,
  registros: (f: FiltrosRegistros) => ['biodiversidad', 'registros', f] as const,
  resumen: (g: Grupo, a: AlcanceTerritorial) => ['biodiversidad', 'resumen', g, a] as const,
  series: (g: Grupo, a: AlcanceTerritorial) => ['biodiversidad', 'series', g, a] as const,
  especies: (f: FiltrosEspecies) => ['biodiversidad', 'especies', f] as const,
  detalle: (g: Grupo, id: string) => ['biodiversidad', 'registro', g, id] as const,
}

function limpiar<T extends object>(filtros: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== undefined && v !== null && v !== ''))
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
  return useQuery<RespuestaRegistros>({
    queryKey: biodiversidadKeys.registros(filtros),
    queryFn: () => api.get(`${BASE}/registros`, { params: limpiar(filtros) }),
    enabled: habilitado,
    staleTime: 60 * 1000,
    retry: false,
    placeholderData: keepPreviousData,
  })
}

export function useBiodiversidadResumen(grupo: Grupo, alcance: AlcanceTerritorial) {
  return useQuery<RespuestaResumen>({
    queryKey: biodiversidadKeys.resumen(grupo, alcance),
    queryFn: () => api.get(`${BASE}/resumen`, { params: { grupo, ...limpiar(alcance) } }),
    staleTime: CINCO_MIN,
    retry: false,
    placeholderData: keepPreviousData,
  })
}

export function useBiodiversidadSeries(grupo: Grupo, alcance: AlcanceTerritorial, habilitado = true) {
  return useQuery<RespuestaSeries>({
    queryKey: biodiversidadKeys.series(grupo, alcance),
    queryFn: () => api.get(`${BASE}/series`, { params: { grupo, ...limpiar(alcance) } }),
    enabled: habilitado,
    staleTime: CINCO_MIN,
    retry: false,
    placeholderData: keepPreviousData,
  })
}

export function useBiodiversidadEspecies(filtros: FiltrosEspecies, habilitado = true) {
  return useQuery<RespuestaEspecies>({
    queryKey: biodiversidadKeys.especies(filtros),
    queryFn: () => api.get(`${BASE}/especies`, { params: limpiar(filtros) }),
    enabled: habilitado,
    staleTime: 60 * 1000,
    retry: false,
    placeholderData: keepPreviousData,
  })
}

export function useBiodiversidadRegistro(grupo: Grupo, gbifId: string | null) {
  return useQuery<RegistroDetalle>({
    queryKey: biodiversidadKeys.detalle(grupo, gbifId ?? ''),
    queryFn: () => api.get(`${BASE}/registros/${encodeURIComponent(gbifId ?? '')}`, { params: { grupo } }),
    enabled: gbifId !== null,
    staleTime: CINCO_MIN,
    retry: false,
  })
}
