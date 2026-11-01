import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { TendenciaKPI } from '@/hooks/useStats'

export interface ResumenAnalitica {
  paginasVistas: TendenciaKPI
  visitantes: TendenciaKPI
  tasaRebotePct: number
  duracionPromedioSeg: number
}

export interface RangoFechas {
  desde?: string
  hasta?: string
}

function paramsRango({ desde, hasta }: RangoFechas) {
  const params: Record<string, string> = {}
  if (desde) params.desde = desde
  if (hasta) params.hasta = hasta
  return params
}

/** KPIs principales de analítica con tendencia 14 días -- mismo shape que
 *  useDashboardTendencias, para reutilizar DeltaBadge/Sparkline tal cual. */
export function useAnaliticaResumen(enabled: boolean = true) {
  return useQuery<ResumenAnalitica>({
    queryKey: ['admin', 'analitica', 'resumen'],
    queryFn:  () => api.get('/analitica/resumen'),
    staleTime: 1000 * 60 * 2,
    enabled,
  })
}

export interface PaginaTop {
  ruta: string
  vistas: number
  visitantes: number
}

export function usePaginasTop(rango: RangoFechas = {}, enabled: boolean = true) {
  return useQuery<PaginaTop[]>({
    queryKey: ['admin', 'analitica', 'paginas-top', rango],
    queryFn:  () => api.get('/analitica/paginas-top', { params: paramsRango(rango) }),
    staleTime: 1000 * 60 * 2,
    enabled,
  })
}

export interface DispositivoStat {
  dispositivo: 'movil' | 'tablet' | 'escritorio'
  sesiones: number
}

export function useDispositivos(rango: RangoFechas = {}, enabled: boolean = true) {
  return useQuery<DispositivoStat[]>({
    queryKey: ['admin', 'analitica', 'dispositivos', rango],
    queryFn:  () => api.get('/analitica/dispositivos', { params: paramsRango(rango) }),
    staleTime: 1000 * 60 * 2,
    enabled,
  })
}

export interface FuenteTrafico {
  fuente: string
  sesiones: number
}

export function useFuentesTrafico(rango: RangoFechas = {}, enabled: boolean = true) {
  return useQuery<FuenteTrafico[]>({
    queryKey: ['admin', 'analitica', 'fuentes-trafico', rango],
    queryFn:  () => api.get('/analitica/fuentes-trafico', { params: paramsRango(rango) }),
    staleTime: 1000 * 60 * 2,
    enabled,
  })
}

export interface EventoStat {
  nombre: string
  total: number
  sesiones: number
}

export interface RecursoEvento {
  nombre: string
  recurso: string
  total: number
}

export interface EventosTop {
  eventos: EventoStat[]
  recursos: RecursoEvento[]
}

export function useEventosTop(rango: RangoFechas = {}, enabled: boolean = true) {
  return useQuery<EventosTop>({
    queryKey: ['admin', 'analitica', 'eventos-top', rango],
    queryFn:  () => api.get('/analitica/eventos-top', { params: paramsRango(rango) }),
    staleTime: 1000 * 60 * 2,
    enabled,
  })
}

export interface TiempoReal {
  ventanaMin: number
  visitantesActivos: number
  paginasActuales: { ruta: string; visitantes: number }[]
}

const REFRESCO_TIEMPO_REAL_MS = 30_000

export function useTiempoReal(enabled: boolean = true) {
  return useQuery<TiempoReal>({
    queryKey: ['admin', 'analitica', 'tiempo-real'],
    queryFn:  () => api.get('/analitica/tiempo-real'),
    refetchInterval: REFRESCO_TIEMPO_REAL_MS,
    enabled,
  })
}

export interface MetricasPeriodo {
  desde: string
  hasta: string
  vistas: number
  sesiones: number
  acciones: number
  rebotePct: number
}

export interface Comparativa {
  actual: MetricasPeriodo
  anterior: MetricasPeriodo
  variacion: { vistas: number; sesiones: number; acciones: number; rebotePuntos: number }
}

export function useComparativa(rango: RangoFechas = {}, enabled: boolean = true) {
  return useQuery<Comparativa>({
    queryKey: ['admin', 'analitica', 'comparativa', rango],
    queryFn:  () => api.get('/analitica/comparativa', { params: paramsRango(rango) }),
    staleTime: 1000 * 60 * 2,
    enabled,
  })
}

export interface PasoEmbudo {
  etiqueta: string
  sesiones: number
  pctDelAnterior: number
  pctDelInicio: number
}

export interface Embudo {
  id: string
  titulo: string
  pasos: PasoEmbudo[]
}

export function useEmbudos(rango: RangoFechas = {}, enabled: boolean = true) {
  return useQuery<Embudo[]>({
    queryKey: ['admin', 'analitica', 'embudos', rango],
    queryFn:  () => api.get('/analitica/embudos', { params: paramsRango(rango) }),
    staleTime: 1000 * 60 * 2,
    enabled,
  })
}

export interface TransicionPagina {
  desde: string
  hacia: string
  veces: number
}

export function useFlujoNavegacion(rango: RangoFechas = {}, enabled: boolean = true) {
  return useQuery<TransicionPagina[]>({
    queryKey: ['admin', 'analitica', 'flujo-navegacion', rango],
    queryFn:  () => api.get('/analitica/flujo-navegacion', { params: paramsRango(rango) }),
    staleTime: 1000 * 60 * 2,
    enabled,
  })
}

export interface EntradaSalida {
  entradas: { ruta: string; veces: number }[]
  salidas:  { ruta: string; veces: number }[]
}

export function useEntradaSalida(rango: RangoFechas = {}, enabled: boolean = true) {
  return useQuery<EntradaSalida>({
    queryKey: ['admin', 'analitica', 'entrada-salida', rango],
    queryFn:  () => api.get('/analitica/entrada-salida', { params: paramsRango(rango) }),
    staleTime: 1000 * 60 * 2,
    enabled,
  })
}

export interface UbicacionesAnalitica {
  paises: { pais: string; sesiones: number }[]
  departamentos: { departamento: string; sesiones: number }[]
  sinUbicacion: number
}

export function useUbicaciones(rango: RangoFechas = {}, enabled: boolean = true) {
  return useQuery<UbicacionesAnalitica>({
    queryKey: ['admin', 'analitica', 'ubicaciones', rango],
    queryFn:  () => api.get('/analitica/ubicaciones', { params: paramsRango(rango) }),
    staleTime: 1000 * 60 * 2,
    enabled,
  })
}

export interface SesionReciente {
  id: string
  primera_visita_en: string
  ip: string | null
  pais: string | null
  departamento: string | null
  ciudad: string | null
  dispositivo: 'movil' | 'tablet' | 'escritorio'
  navegador: string | null
  sistema_operativo: string | null
}

/** Últimas sesiones con su IP (se borra a los 90 días); el backend solo la entrega a administradores. */
export function useSesionesRecientes(enabled: boolean = true) {
  return useQuery<SesionReciente[]>({
    queryKey: ['admin', 'analitica', 'sesiones-recientes'],
    queryFn:  () => api.get('/analitica/sesiones-recientes'),
    staleTime: 1000 * 60,
    enabled,
  })
}
