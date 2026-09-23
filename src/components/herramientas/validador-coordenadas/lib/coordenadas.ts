import type { FormatoCoordenadas, UtmCoord } from '../types'

/** Limpia una coordenada tal como vino del Excel (coma decimal, espacios) y la
 *  convierte a número. Verbatim de validador_coordenadas_IIAP.html -- la
 *  validación siempre corre en decimal. */
export function limpiarCoord(v: unknown): number {
  if (v === undefined || v === null || v === '') return NaN
  const t = String(v).trim().replace(',', '.').replace(/\s+/g, '')
  const n = parseFloat(t)
  return isNaN(n) ? NaN : n
}

export function ddToDms(dec: number, esLat: boolean): string {
  if (isNaN(dec)) return ''
  const hemi = esLat ? (dec >= 0 ? 'N' : 'S') : (dec >= 0 ? 'E' : 'O')
  const abs = Math.abs(dec)
  const g = Math.floor(abs)
  const minFloat = (abs - g) * 60
  const m = Math.floor(minFloat)
  const s = ((minFloat - m) * 60).toFixed(1)
  return `${g}°${m}'${s}"${hemi}`
}

/** Convierte grados decimales a UTM (WGS84). Verbatim de la herramienta original. */
export function ddToUtm(lat: number, lon: number): UtmCoord | null {
  if (isNaN(lat) || isNaN(lon)) return null
  const a = 6378137.0, f = 1 / 298.257223563
  const k0 = 0.9996, e = Math.sqrt(f * (2 - f))
  const zone = Math.floor((lon + 180) / 6) + 1
  const lon0 = (zone - 1) * 6 - 180 + 3
  const latR = lat * Math.PI / 180, lonR = lon * Math.PI / 180, lon0R = lon0 * Math.PI / 180
  const ep2 = (e * e) / (1 - e * e)
  const N = a / Math.sqrt(1 - e * e * Math.sin(latR) * Math.sin(latR))
  const T = Math.tan(latR) * Math.tan(latR)
  const C = ep2 * Math.cos(latR) * Math.cos(latR)
  const A = Math.cos(latR) * (lonR - lon0R)
  const M = a * (
    (1 - e * e / 4 - 3 * e ** 4 / 64 - 5 * e ** 6 / 256) * latR
    - (3 * e * e / 8 + 3 * e ** 4 / 32 + 45 * e ** 6 / 1024) * Math.sin(2 * latR)
    + (15 * e ** 4 / 256 + 45 * e ** 6 / 1024) * Math.sin(4 * latR)
    - (35 * e ** 6 / 3072) * Math.sin(6 * latR)
  )
  const easting = k0 * N * (A + (1 - T + C) * A ** 3 / 6 + (5 - 18 * T + T * T + 72 * C - 58 * ep2) * A ** 5 / 120) + 500000
  let northing = k0 * (M + N * Math.tan(latR) * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A ** 4 / 24 + (61 - 58 * T + T * T + 600 * C - 330 * ep2) * A ** 6 / 720))
  if (lat < 0) northing += 10000000
  const banda: 'N' | 'S' = lat >= 0 ? 'N' : 'S'
  return { zone, banda, easting: Math.round(easting), northing: Math.round(northing) }
}

export function formatearLat(lat: number, formato: FormatoCoordenadas): string {
  if (isNaN(lat)) return ''
  if (formato === 'dd') return lat.toFixed(6)
  if (formato === 'dms') return ddToDms(lat, true)
  return ''
}

export function formatearLon(lon: number, formato: FormatoCoordenadas): string {
  if (isNaN(lon)) return ''
  if (formato === 'dd') return lon.toFixed(6)
  if (formato === 'dms') return ddToDms(lon, false)
  return ''
}

export function formatearUtm(lat: number, lon: number): string {
  const u = ddToUtm(lat, lon)
  if (!u) return ''
  return `${u.zone}${u.banda}  ${u.easting}E  ${u.northing}N`
}

export function cantidadDecimales(v: unknown): number {
  const n = limpiarCoord(v)
  if (isNaN(n)) return 0
  const s = String(n)
  return s.includes('.') ? s.split('.')[1].length : 0
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number | null {
  if ([lat1, lon1, lat2, lon2].some((v) => isNaN(v))) return null
  const R = 6371
  const toRad = (x: number) => x * Math.PI / 180
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
