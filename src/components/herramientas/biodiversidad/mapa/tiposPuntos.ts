import type { Ubicacion } from '../lib/puntos'

export interface InfoPuntos {
  cargando: boolean
  error: unknown
  total: number
  mostrados: number
  ocultos: number
  muestreado: boolean
  /** Hay una respuesta (aunque esté vacía). */
  listo: boolean
  reintentar: () => void
}

export interface Enfoque extends Ubicacion {
  id: string
  /** Cambia en cada petición para volver a centrar aunque se repita el mismo registro. */
  vez: number
}

export const INFO_INICIAL: InfoPuntos = { cargando: true, error: null, total: 0, mostrados: 0, ocultos: 0, muestreado: false, listo: false, reintentar: () => undefined }
