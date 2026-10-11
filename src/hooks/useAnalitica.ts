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
