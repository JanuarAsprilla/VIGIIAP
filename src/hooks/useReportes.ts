import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export type PeriodoReporte = 'dia' | 'semana' | 'mes' | 'anio' | 'custom'

export interface ReporteParams {
  periodo: PeriodoReporte
  desde?: string
  hasta?: string
}

export interface ReporteModuloConteo {
  modulo: string
  total: number
}

export interface ReporteData {
  periodo: PeriodoReporte
  desde: string
  hasta: string
  usuarios: { nuevos: number; creadosPorAdmin: number }
  solicitudes: { nuevas: number; resueltas: number; pendientes: number }
  documentos: { creados: number; publicados: number }
  mapas: { creados: number; publicados: number }
  logins: { exitosos: number; fallidos: number }
  actividadPorModulo: ReporteModuloConteo[]
}

// El backend solo debe recibir 'desde'/'hasta' cuando periodo === 'custom' —
// para el resto de períodos el rango se calcula server-side a partir de 'periodo'.
export function useReporte({ periodo, desde, hasta }: ReporteParams, enabled = true) {
  const params: Record<string, string> = { periodo }
  if (periodo === 'custom') {
    if (desde) params.desde = desde
    if (hasta) params.hasta = hasta
  }

  return useQuery<ReporteData>({
    queryKey: ['admin', 'reportes', params],
    queryFn:  () => api.get('/admin/reportes', { params }) as Promise<ReporteData>,
    enabled:  enabled && (periodo !== 'custom' || Boolean(desde && hasta)),
    staleTime: 30_000,
  })
}
