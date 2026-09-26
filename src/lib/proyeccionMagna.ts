/**
 * Proyección Transversa de Mercator — MAGNA-SIRGAS (las 4 zonas oficiales
 * IGAC) y WGS84 / UTM Zona 18N.
 *
 * Parámetros verificados contra el registro EPSG (epsg.io/3115, /3116,
 * /3117, /3118, /32618), no contra valores "redondos" de memoria -- el
 * código original usaba lon0=-77°/lat0=4° para Colombia Oeste en vez del
 * origen oficial exacto (-77°04'39.03"W, 4°35'46.32"N), desplazando cada
 * conversión varios kilómetros del valor real. Las 4 zonas MAGNA comparten
 * el mismo elipsoide, factor de escala, falso este/norte y latitud de
 * origen -- solo el meridiano central cambia, exactamente cada 3°.
 *
 * Módulo puro (sin dependencias React). Reemplazable por llamada a
 * /api/geodesia/convertir cuando el backend esté disponible.
 */

interface ParametrosTM {
  a: number    // semieje mayor del elipsoide (m)
  f: number    // achatamiento (1/f)
  k0: number   // factor de escala
  lon0: number // meridiano central (°)
  lat0: number // latitud de origen (°)
  FE: number   // falso este (m)
  FN: number   // falso norte (m)
}

/** Longitud de arco meridiano (serie de Helmert) */
function mArc(phi: number, e2: number, a: number): number {
  const e4 = e2 * e2
  const e6 = e2 * e4
  return a * (
    (1 - e2/4 - 3*e4/64 - 5*e6/256) * phi
    - (3*e2/8  + 3*e4/32  + 45*e6/1024) * Math.sin(2 * phi)
    + (15*e4/256 + 45*e6/1024)          * Math.sin(4 * phi)
    - (35*e6/3072)                       * Math.sin(6 * phi)
  )
}

/** Geográficas → planas, para cualquier variante de Transversa de Mercator. */
function proyectarTM(latD: number, lonD: number, p: ParametrosTM): { x: number; y: number } {
  const R   = Math.PI / 180
  const { a, f, k0, lon0, lat0, FE, FN } = p
  const e2  = 2*f - f*f
  const ep2 = e2 / (1 - e2)

  const lat = latD * R
  const lon = lonD * R
  const N   = a / Math.sqrt(1 - e2 * Math.sin(lat) ** 2)
  const T   = Math.tan(lat) ** 2
  const C   = ep2 * Math.cos(lat) ** 2
  const A   = (lon - lon0 * R) * Math.cos(lat)
  const M   = mArc(lat, e2, a)
  const M0  = mArc(lat0 * R, e2, a)

  const x = FE + k0 * N * (A + (1-T+C)*A**3/6 + (5-18*T+T**2+72*C-58*ep2)*A**5/120)
  const y = FN + k0 * (M - M0 + N*Math.tan(lat)*(A**2/2 + (5-T+9*C+4*C**2)*A**4/24 + (61-58*T+T**2+600*C-330*ep2)*A**6/720))

  return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 }
}

/** Planas → geográficas, inversa de proyectarTM(). */
function desproyectarTM(X: number, Y: number, p: ParametrosTM): { lat: number; lon: number } {
  const D   = 180 / Math.PI
  const R   = Math.PI / 180
  const { a, f, k0, lon0, lat0, FE, FN } = p
  const e2  = 2*f - f*f
  const e4  = e2 * e2
  const e6  = e2 * e4
  const ep2 = e2 / (1 - e2)

  const M0  = mArc(lat0 * R, e2, a)
  const M1  = M0 + (Y - FN) / k0
  const e1  = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2))
  const mu  = M1 / (a * (1 - e2/4 - 3*e4/64 - 5*e6/256))

  const lat1 = mu
    + (3*e1/2   - 27*e1**3/32)  * Math.sin(2 * mu)
    + (21*e1**2/16 - 55*e1**4/32) * Math.sin(4 * mu)
    + (151*e1**3/96)             * Math.sin(6 * mu)
    + (1097*e1**4/512)           * Math.sin(8 * mu)

  const N1 = a / Math.sqrt(1 - e2 * Math.sin(lat1) ** 2)
  const R1 = a * (1 - e2) / Math.pow(1 - e2 * Math.sin(lat1) ** 2, 1.5)
  const T1 = Math.tan(lat1) ** 2
  const C1 = ep2 * Math.cos(lat1) ** 2
  const Dd = (X - FE) / (N1 * k0)

  const lat = lat1 - (N1*Math.tan(lat1)/R1) * (Dd**2/2 - (5+3*T1+10*C1-4*C1**2-9*ep2)*Dd**4/24 + (61+90*T1+298*C1+45*T1**2-252*ep2-3*C1**2)*Dd**6/720)
  const lon = lon0*R + (Dd - (1+2*T1+C1)*Dd**3/6 + (5-2*C1+28*T1-3*C1**2+8*ep2+24*T1**2)*Dd**5/120) / Math.cos(lat1)

  return { lat: Math.round(lat * D * 1e6) / 1e6, lon: Math.round(lon * D * 1e6) / 1e6 }
}

// ── MAGNA-SIRGAS (elipsoide GRS 1980, datum oficial IGAC) ──────────────────
const GRS80 = Object.freeze({ a: 6_378_137.0, f: 1 / 298.257222101 })
// Las 4 zonas comparten esta latitud de origen exacta (4°35'46.32"N) --
// verificado en epsg.io/3115..3118, no es una coincidencia de redondeo.
const LAT0_MAGNA = 4.59620041666667

export type ZonaMagna = 'oeste' | 'bogota' | 'esteCentral' | 'este'

export const ZONAS_MAGNA: Record<ZonaMagna, { lon0: number; nombre: string; epsg: string }> = {
  oeste:       { lon0: -77.0775079166667, nombre: 'MAGNA-SIRGAS Oeste',        epsg: 'EPSG:3115' },
  bogota:      { lon0: -74.0775079166667, nombre: 'MAGNA-SIRGAS Bogotá',       epsg: 'EPSG:3116' },
  esteCentral: { lon0: -71.0775079166667, nombre: 'MAGNA-SIRGAS Este Central', epsg: 'EPSG:3117' },
  este:        { lon0: -68.0775079166667, nombre: 'MAGNA-SIRGAS Este',        epsg: 'EPSG:3118' },
}

function parametrosZonaMagna(zona: ZonaMagna): ParametrosTM {
  return { ...GRS80, k0: 1.0, lon0: ZONAS_MAGNA[zona].lon0, lat0: LAT0_MAGNA, FE: 1_000_000, FN: 1_000_000 }
}

/**
 * WGS84 (EPSG:4326) → MAGNA-SIRGAS, zona indicada (Oeste por defecto).
 * @param {number} latD  Latitud decimal (°N)
 * @param {number} lonD  Longitud decimal (°W, valor negativo)
 * @returns {{ x: number, y: number }}  Coordenadas planas en metros
 */
export function wgs84ToMagna(latD: number, lonD: number, zona: ZonaMagna = 'oeste'): { x: number; y: number } {
  return proyectarTM(latD, lonD, parametrosZonaMagna(zona))
}

/**
 * MAGNA-SIRGAS, zona indicada → WGS84 (EPSG:4326).
 * @param {number} X  Coordenada Este (m)
 * @param {number} Y  Coordenada Norte (m)
 * @returns {{ lat: number, lon: number }}  Coordenadas geográficas en grados decimales
 */
export function magnaToWgs84(X: number, Y: number, zona: ZonaMagna = 'oeste'): { lat: number; lon: number } {
  return desproyectarTM(X, Y, parametrosZonaMagna(zona))
}

// ── WGS84 / UTM Zona 18N (EPSG:32618) — cubre el Pacífico y Chocó ──────────
// Elipsoide WGS84 real (298.257223563), NO el GRS80 de MAGNA-SIRGAS -- son
// casi idénticos pero no el mismo valor, y esta herramienta ya demostró que
// "casi el mismo" no es aceptable en geodesia.
const WGS84_ELIPSOIDE = Object.freeze({ a: 6_378_137.0, f: 1 / 298.257223563 })
const UTM18N_PARAMS: ParametrosTM = { ...WGS84_ELIPSOIDE, k0: 0.9996, lon0: -75.0, lat0: 0.0, FE: 500_000, FN: 0 }

export function wgs84ToUtm18N(latD: number, lonD: number): { x: number; y: number } {
  return proyectarTM(latD, lonD, UTM18N_PARAMS)
}

export function utm18NToWgs84(X: number, Y: number): { lat: number; lon: number } {
  return desproyectarTM(X, Y, UTM18N_PARAMS)
}

// ── Grados-Minutos-Segundos ↔ decimal ──────────────────────────────────────
// No es una proyección -- es la misma coordenada geográfica escrita distinto
// (ej. 4°29'16.7"N ↔ 4.4879472). Vive acá porque el conversor de la UI trata
// "DMS" como un formato más de entrada/salida, igual que las zonas MAGNA/UTM.
const DMS_RE = /^(-?\d+(?:\.\d+)?)\s*[°d]?\s*(?:(\d+(?:\.\d+)?)\s*['m]?\s*(?:(\d+(?:\.\d+)?)\s*["s]?)?)?\s*([NSEWnsew])?$/

/** Convierte un string en formato DMS (o ya decimal) a grados decimales. null si no se pudo interpretar. */
export function dmsToDecimal(input: string): number | null {
  const limpio = input.trim()
  if (limpio === '') return null
  if (/^-?\d+(\.\d+)?$/.test(limpio)) return parseFloat(limpio)

  const m = limpio.match(DMS_RE)
  if (!m) return null
  const [, gradosStr, minutosStr, segundosStr, hemisferio] = m
  const grados = parseFloat(gradosStr)
  const minutos = minutosStr ? parseFloat(minutosStr) : 0
  const segundos = segundosStr ? parseFloat(segundosStr) : 0
  if (minutos >= 60 || segundos >= 60) return null

  let valor = Math.abs(grados) + minutos / 60 + segundos / 3600
  if (grados < 0) valor = -valor
  if (hemisferio && /[SWsw]/.test(hemisferio)) valor = -Math.abs(valor)
  return Math.round(valor * 1e8) / 1e8
}

/** Convierte grados decimales a un string DMS legible (ej. 4°29'16.70"N). */
export function decimalToDms(deg: number, tipo: 'lat' | 'lon'): string {
  const hemisferio = tipo === 'lat' ? (deg >= 0 ? 'N' : 'S') : (deg >= 0 ? 'E' : 'W')
  const abs = Math.abs(deg)
  const grados = Math.floor(abs)
  const minFloat = (abs - grados) * 60
  const minutos = Math.floor(minFloat)
  const segundos = (minFloat - minutos) * 60
  return `${grados}°${minutos}'${segundos.toFixed(2)}"${hemisferio}`
}
