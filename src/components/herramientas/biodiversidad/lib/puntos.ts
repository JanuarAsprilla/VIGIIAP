import type { PuntoMapa, RegistroBiodiversidad } from '../types'
import { fmtNum } from './format'

/** Recuadro aproximado del Chocó biogeográfico y alrededores: descarta coordenadas absurdas. */
const LIMITES = { minLat: -5, maxLat: 14, minLon: -83, maxLon: -66 }

export interface Ubicacion { lat: number; lon: number }

function dentro(lat: unknown, lon: unknown): lat is number {
  return typeof lat === 'number' && typeof lon === 'number' && Number.isFinite(lat) && Number.isFinite(lon)
    && lat >= LIMITES.minLat && lat <= LIMITES.maxLat && lon >= LIMITES.minLon && lon <= LIMITES.maxLon
}

/** Única puerta para dibujar o centrar un registro: si el servidor lo marca como reservado devuelve null, aunque traiga números. */
export function ubicacionPublica(
  r: Pick<RegistroBiodiversidad, 'coordenadas_ocultas' | 'latitud' | 'longitud'>,
): Ubicacion | null {
  if (r.coordenadas_ocultas !== false) return null
  return dentro(r.latitud, r.longitud) ? { lat: r.latitud as number, lon: r.longitud as number } : null
}

/** Puntos aptos para dibujarse: coordenadas válidas, id numérico y nada marcado como oculto. */
export function puntosDibujables(puntos: PuntoMapa[]): PuntoMapa[] {
  return puntos.filter((p) => dentro(p.lat, p.lon) && /^\d{1,20}$/.test(p.id)
    && (p as { coordenadas_ocultas?: boolean }).coordenadas_ocultas !== true)
}

export type Bbox = [number, number, number, number]

const PASO_BBOX = 0.25

/** Redondea el recuadro hacia afuera a una malla de 0,25°: mover un poco el mapa no dispara otra consulta. */
export function redondearBbox(oeste: number, sur: number, este: number, norte: number): Bbox {
  const abajo = (v: number) => Math.floor(v / PASO_BBOX) * PASO_BBOX
  const arriba = (v: number) => Math.ceil(v / PASO_BBOX) * PASO_BBOX
  return [abajo(oeste), abajo(sur), arriba(este), arriba(norte)].map((v) => Math.max(-180, Math.min(180, v))) as Bbox
}

export function bboxATexto(b: Bbox): string {
  return b.join(',')
}

export function mensajeOcultos(n: number): string | null {
  if (n <= 0) return null
  return `${fmtNum(n)} ${n === 1 ? 'registro' : 'registros'} de especies amenazadas o sin determinar no ${n === 1 ? 'muestra' : 'muestran'} su ubicación para protegerlas.`
}

export function mensajeMuestra(mostrados: number, total: number): string {
  return `Mostrando una muestra de ${fmtNum(mostrados)} de ${fmtNum(total)} registros con ubicación visible. Acerca el mapa o añade filtros para ver el resto.`
}
