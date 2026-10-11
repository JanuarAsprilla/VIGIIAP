import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export interface AdminStats {
  usuarios: number
  solicitudesPendientes: number
  documentos: number
  mapasPublicados: number
  visitantesUltimos30d: number
}

export function useAdminStats(enabled: boolean = true) {
  return useQuery<AdminStats>({
    queryKey: ['admin', 'stats'],
    queryFn:  () => api.get('/admin/stats'),
    staleTime: 1000 * 60 * 2,  // 2 min — dashboard se refresca frecuente
    enabled,
  })
}

export interface TendenciaKPI {
  /** Conteo diario de los últimos 7 días, del más viejo al más nuevo (índice 6 = hoy). */
  serie7: number[]
  semanaActual: number
  semanaAnterior: number
  deltaPct: number
}

export interface DashboardTendencias {
  usuarios: TendenciaKPI
  solicitudes: TendenciaKPI
  documentos: TendenciaKPI
  mapas: TendenciaKPI
}

/** Deltas semana-vs-anterior + sparkline de 7 días por KPI, para el dashboard admin. */
export function useDashboardTendencias(enabled: boolean = true) {
  return useQuery<DashboardTendencias>({
    queryKey: ['admin', 'dashboard', 'tendencias'],
    queryFn:  () => api.get('/admin/dashboard/tendencias'),
    staleTime: 1000 * 60 * 2,
    enabled,
  })
}
