import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export type TareaActualizacion = 'fotos' | 'frescura' | 'datos'
export type EstadoEjecucion = 'solicitada' | 'en_curso' | 'ok' | 'error' | 'omitida'
export type ModoActualizacion = 'publico' | 'cuenta'

export interface AjustesActualizacion {
  modo: ModoActualizacion
  activa: boolean
  frecuencia_dias: number
  credencial_usuario_id: string | null
  credencial_nombre: string | null
  actualizado_en: string
}

/** Lo que se conoce de una cuenta de GBIF guardada: nunca incluye la clave. */
export interface CredencialResumen {
  usuario_id: string
  nombre: string
  email: string
  gbif_usuario: string
  gbif_correo: string
  actualizado_en: string
}

export interface EjecucionActualizacion {
  id: number | string
  tarea: TareaActualizacion
  disparador: 'programada' | 'manual'
  estado: EstadoEjecucion
  resumen: Record<string, unknown>
  creado_en: string
  inicio: string | null
  fin: string | null
  solicitado_por?: string | null
}

export interface CorteActual {
  grupo: string
  desde: number
  hasta: number
  fecha_fuente: string | null
  registros: number
}

export interface EstadoActualizacion {
  ajustes: AjustesActualizacion
  cifrado_disponible: boolean
  credenciales: CredencialResumen[]
  ultimas_ejecuciones: EjecucionActualizacion[]
  cortes: CorteActual[]
}

export interface CambioAjustes {
  modo?: ModoActualizacion
  activa?: boolean
  frecuencia_dias?: number
  credencial_usuario_id?: string | null
}

export interface DatosCredencial {
  gbif_usuario: string
  gbif_correo: string
  clave: string
  usuario_id?: string
}

const BASE = '/admin/biodiversidad-datos'
const KEYS = {
  estado: ['biodiversidad-actualizacion', 'estado'] as const,
  ejecuciones: ['biodiversidad-actualizacion', 'ejecuciones'] as const,
}

export function useEstadoActualizacion() {
  return useQuery<EstadoActualizacion>({ queryKey: KEYS.estado, queryFn: () => api.get(BASE), staleTime: 15_000 })
}

export function useEjecucionesActualizacion() {
  return useQuery<{ ejecuciones: EjecucionActualizacion[] }>({
    queryKey: KEYS.ejecuciones, queryFn: () => api.get(`${BASE}/ejecuciones`, { params: { limite: 15 } }), staleTime: 15_000,
  })
}

function useRefrescar() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['biodiversidad-actualizacion'] })
}

export function useCambiarAjustes() {
  const refrescar = useRefrescar()
  return useMutation<unknown, Error, CambioAjustes>({ mutationFn: (d) => api.put(`${BASE}/ajustes`, d), onSuccess: refrescar })
}

export function useGuardarCredencial() {
  const refrescar = useRefrescar()
  return useMutation<unknown, Error, DatosCredencial>({ mutationFn: (d) => api.put(`${BASE}/credencial`, d), onSuccess: refrescar })
}

export function useBorrarCredencial() {
  const refrescar = useRefrescar()
  return useMutation<unknown, Error, string | undefined>({
    mutationFn: (usuarioId) => api.delete(`${BASE}/credencial`, { params: usuarioId ? { usuario_id: usuarioId } : undefined }),
    onSuccess: refrescar,
  })
}

export function useSolicitarActualizacion() {
  const refrescar = useRefrescar()
  return useMutation<unknown, Error, TareaActualizacion>({ mutationFn: (tarea) => api.post(`${BASE}/ejecuciones`, { tarea }), onSuccess: refrescar })
}
