import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'

export type ProblemaIntegridad = 'contenido_alterado' | 'evento_faltante' | 'cadena_rota'

export interface ResultadoIntegridad {
  integra: boolean
  verificados: number
  desde: string | null
  hasta: string | null
  problemas: { id: string; secuencia: string; creado_en: string; problema: ProblemaIntegridad }[]
}

/** Recorre la cadena de hashes del registro de auditoría (solo super_admin). */
export function useVerificarIntegridad() {
  return useMutation<ResultadoIntegridad>({
    mutationFn: () => api.get('/admin/audit/integridad'),
  })
}
