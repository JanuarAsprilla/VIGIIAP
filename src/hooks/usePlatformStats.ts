import { useMapasList } from '@/hooks/useMapas'
import { useDocumentosList } from '@/hooks/useDocumentos'

export interface PlatformStat {
  key: 'mapas' | 'documentos'
  value: number | undefined
  loading: boolean
}

/**
 * Conteos reales de la plataforma — GET /mapas y /documentos son públicos
 * (optionalAuthenticate en backend), así que se pueden pedir sin sesión.
 * No hay endpoint público de conteo de investigadores (listar usuarios es
 * admin-only, correctamente) — se omite en vez de simularlo.
 */
export function usePlatformStats(): PlatformStat[] {
  const mapas = useMapasList({ limit: 1 })
  const documentos = useDocumentosList({ limit: 1 })
  const stats: PlatformStat[] = [
    { key: 'mapas', value: mapas.data?.meta?.total, loading: mapas.isPending },
    { key: 'documentos', value: documentos.data?.meta?.total, loading: documentos.isPending },
  ]
  return stats.filter((s) => s.loading || typeof s.value === 'number')
}
