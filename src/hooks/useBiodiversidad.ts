import { keepPreviousData, useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  CampoOpciones, EstadoBiodiversidad, Grupo, ParamsApi, RegistroDetalle, RespuestaEspecies, RespuestaMunicipios,
  RespuestaOpciones, RespuestaPuntos, RespuestaRegistros, RespuestaResumen, RespuestaSeries,
} from '@/components/herramientas/biodiversidad/types'

const BASE = '/biodiversidad'
const CINCO_MIN = 5 * 60 * 1000
const UN_MIN = 60 * 1000

export const biodiversidadKeys = {
  estado: ['biodiversidad', 'estado'] as const,
  municipios: (grupo: Grupo, p: ParamsApi) => ['biodiversidad', 'municipios', grupo, p] as const,
  registros: (grupo: Grupo, p: ParamsApi) => ['biodiversidad', 'registros', grupo, p] as const,
  resumen: (grupo: Grupo, p: ParamsApi) => ['biodiversidad', 'resumen', grupo, p] as const,
  series: (grupo: Grupo, p: ParamsApi) => ['biodiversidad', 'series', grupo, p] as const,
  especies: (grupo: Grupo, p: ParamsApi) => ['biodiversidad', 'especies', grupo, p] as const,
  opciones: (grupo: Grupo, campo: CampoOpciones, p: ParamsApi) => ['biodiversidad', 'opciones', grupo, campo, p] as const,
  puntos: (grupo: Grupo, p: ParamsApi) => ['biodiversidad', 'puntos', grupo, p] as const,
  detalle: (g: Grupo, id: string) => ['biodiversidad', 'registro', g, id] as const,
}

const SIN_PARAMS: ParamsApi = {}

export function useBiodiversidadEstado() {
  return useQuery<EstadoBiodiversidad>({
    queryKey: biodiversidadKeys.estado,
    queryFn: ({ signal }) => api.get(`${BASE}/estado`, { signal }),
    staleTime: CINCO_MIN,
    retry: false,
  })
}

/** Conteos por municipio. Con filtros devuelve todos los municipios (los que no coinciden, en 0). */
export function useBiodiversidadMunicipios(grupo: Grupo, filtros: ParamsApi = SIN_PARAMS) {
  return useQuery<RespuestaMunicipios>({
    queryKey: biodiversidadKeys.municipios(grupo, filtros),
    queryFn: ({ signal }) => api.get(`${BASE}/municipios`, { params: { grupo, ...filtros }, signal }),
    staleTime: CINCO_MIN,
    retry: false,
    placeholderData: keepPreviousData,
  })
}

/** Solo grupos individuales: en los agregados el servidor responde 422, así que `habilitado` debe ser false. */
export function useBiodiversidadRegistros(grupo: Grupo, params: ParamsApi, habilitado: boolean) {
  return useQuery<RespuestaRegistros>({
    queryKey: biodiversidadKeys.registros(grupo, params),
    queryFn: ({ signal }) => api.get(`${BASE}/registros`, { params: { grupo, ...params }, signal }),
    enabled: habilitado,
    staleTime: UN_MIN,
    retry: false,
    placeholderData: keepPreviousData,
  })
}

export function useBiodiversidadResumen(grupo: Grupo, params: ParamsApi = SIN_PARAMS) {
  return useQuery<RespuestaResumen>({
    queryKey: biodiversidadKeys.resumen(grupo, params),
    queryFn: ({ signal }) => api.get(`${BASE}/resumen`, { params: { grupo, ...params }, signal }),
    staleTime: CINCO_MIN,
    retry: false,
    placeholderData: keepPreviousData,
  })
}

export function useBiodiversidadSeries(grupo: Grupo, params: ParamsApi = SIN_PARAMS, habilitado = true) {
  return useQuery<RespuestaSeries>({
    queryKey: biodiversidadKeys.series(grupo, params),
    queryFn: ({ signal }) => api.get(`${BASE}/series`, { params: { grupo, ...params }, signal }),
    enabled: habilitado,
    staleTime: CINCO_MIN,
    retry: false,
    placeholderData: keepPreviousData,
  })
}

export function useBiodiversidadEspecies(grupo: Grupo, params: ParamsApi, habilitado = true) {
  return useQuery<RespuestaEspecies>({
    queryKey: biodiversidadKeys.especies(grupo, params),
    queryFn: ({ signal }) => api.get(`${BASE}/especies`, { params: { grupo, ...params }, signal }),
    enabled: habilitado,
    staleTime: UN_MIN,
    retry: false,
    placeholderData: keepPreviousData,
  })
}

/** Valores posibles de un campo dado el resto de filtros. Solo se consulta mientras el control está abierto (`habilitado`). */
export function useBiodiversidadOpciones(grupo: Grupo, campo: CampoOpciones, params: ParamsApi, habilitado: boolean) {
  return useQuery<RespuestaOpciones>({
    queryKey: biodiversidadKeys.opciones(grupo, campo, params),
    queryFn: ({ signal }) => api.get(`${BASE}/opciones`, { params: { grupo, campo, ...params }, signal }),
    enabled: habilitado,
    staleTime: CINCO_MIN,
    retry: false,
    placeholderData: keepPreviousData,
  })
}

/** Sugerencias de especie: una consulta corta de `/especies` mientras se escribe. */
export function useBiodiversidadSugerencias(grupo: Grupo, params: ParamsApi, habilitado: boolean) {
  return useQuery<RespuestaEspecies>({
    queryKey: ['biodiversidad', 'sugerencias', grupo, params] as const,
    queryFn: ({ signal }) => api.get(`${BASE}/especies`, { params: { grupo, ...params }, signal }),
    enabled: habilitado,
    staleTime: CINCO_MIN,
    retry: false,
    placeholderData: keepPreviousData,
  })
}

/** Ubicaciones públicas para dibujar en el mapa (solo grupos individuales). */
export function useBiodiversidadPuntos(grupo: Grupo, params: ParamsApi, habilitado: boolean) {
  return useQuery<RespuestaPuntos>({
    queryKey: biodiversidadKeys.puntos(grupo, params),
    queryFn: ({ signal }) => api.get(`${BASE}/puntos`, { params: { grupo, ...params }, signal }),
    enabled: habilitado,
    staleTime: UN_MIN,
    retry: false,
    placeholderData: keepPreviousData,
  })
}

export function useBiodiversidadRegistro(grupo: Grupo, gbifId: string | null) {
  return useQuery<RegistroDetalle>({
    queryKey: biodiversidadKeys.detalle(grupo, gbifId ?? ''),
    queryFn: ({ signal }) => api.get(`${BASE}/registros/${encodeURIComponent(gbifId ?? '')}`, { params: { grupo }, signal }),
    enabled: gbifId !== null,
    staleTime: CINCO_MIN,
    retry: false,
  })
}
