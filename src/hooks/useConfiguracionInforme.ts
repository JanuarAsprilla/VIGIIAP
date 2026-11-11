import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import type { FormatoDescarga, PlantillaInforme } from '@/lib/generarInforme'

/** Lo que el servidor decide para el botón «Descargar informe» de una herramienta, según quién pregunta. */
export interface ConfiguracionInforme {
  habilitado: boolean
  puedeDescargar: boolean
  requiereSesion: boolean
  formatos: FormatoDescarga[]
  maxFilas: number
  plantilla: PlantillaInforme
}

/** La respuesta depende de la sesión: la clave incluye a la persona para que al entrar o salir se consulte de nuevo. */
export function useConfiguracionInforme(herramienta: string) {
  const { user } = useAuth()
  return useQuery<ConfiguracionInforme>({
    queryKey: ['informes', 'configuracion', herramienta, user?.id ?? 'anonimo'],
    queryFn: ({ signal }) => api.get(`/informes/configuracion/${encodeURIComponent(herramienta)}`, { signal }),
    staleTime: 60_000,
    retry: false,
  })
}
