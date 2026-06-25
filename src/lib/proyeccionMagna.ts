/**
 * Proyección Transversa de Mercator — MAGNA-SIRGAS / Colombia Oeste (EPSG:3115)
 *
 * Parámetros oficiales IGACː
 *   Meridiano central : −77°
 *   Latitud origen    : 4°
 *   Falso Este        : 1 000 000 m
 *   Falso Norte       : 1 000 000 m
 *   Factor escala     : 1.0
 *   Elipsoide         : GRS 1980 (a = 6 378 137 m, 1/f = 298.257222101)
 *
 * Módulo puro (sin dependencias React). Reemplazable por llamada a
 * /api/geodesia/convertir cuando el backend esté disponible.
 */

const TM = Object.freeze({
  a:    6_378_137.0,
  f:    1 / 298.257222101,
  k0:   1.0,
  lon0: -77.0,
  lat0: 4.0,
  FE:   1_000_000,
  FN:   1_000_000,
})

/** Longitud de arco meridiano (serie de Helmert) */
function mArc(phi, e2) {
  const e4 = e2 * e2
  const e6 = e2 * e4
  return TM.a * (
    (1 - e2/4 - 3*e4/64 - 5*e6/256) * phi
    - (3*e2/8  + 3*e4/32  + 45*e6/1024) * Math.sin(2 * phi)
    + (15*e4/256 + 45*e6/1024)          * Math.sin(4 * phi)
    - (35*e6/3072)                       * Math.sin(6 * phi)
  )
}

/**
 * WGS84 (EPSG:4326) → MAGNA-SIRGAS Colombia Oeste (EPSG:3115)
 * @param {number} latD  Latitud decimal (°N)
 * @param {number} lonD  Longitud decimal (°W, valor negativo)
 * @returns {{ x: number, y: number }}  Coordenadas planas en metros
 */
export function wgs84ToMagna(latD, lonD) {
  const R   = Math.PI / 180
  const { a, f, k0, lon0, lat0, FE, FN } = TM
  const e2  = 2*f - f*f
  const ep2 = e2 / (1 - e2)

  const lat = latD * R
  const lon = lonD * R
  const N   = a / Math.sqrt(1 - e2 * Math.sin(lat) ** 2)
  const T   = Math.tan(lat) ** 2
  const C   = ep2 * Math.cos(lat) ** 2
  const A   = (lon - lon0 * R) * Math.cos(lat)
  const M   = mArc(lat, e2)
  const M0  = mArc(lat0 * R, e2)

  const x = FE + k0 * N * (A + (1-T+C)*A**3/6 + (5-18*T+T**2+72*C-58*ep2)*A**5/120)
  const y = FN + k0 * (M - M0 + N*Math.tan(lat)*(A**2/2 + (5-T+9*C+4*C**2)*A**4/24 + (61-58*T+T**2+600*C-330*ep2)*A**6/720))

  return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 }
}

/**
 * MAGNA-SIRGAS Colombia Oeste (EPSG:3115) → WGS84 (EPSG:4326)
 * @param {number} X  Coordenada Este (m)
 * @param {number} Y  Coordenada Norte (m)
 * @returns {{ lat: number, lon: number }}  Coordenadas geográficas en grados decimales
 */
export function magnaToWgs84(X, Y) {
  const D   = 180 / Math.PI
  const R   = Math.PI / 180
  const { a, f, k0, lon0, lat0, FE, FN } = TM
  const e2  = 2*f - f*f
  const e4  = e2 * e2
  const e6  = e2 * e4
  const ep2 = e2 / (1 - e2)

  const M0  = mArc(lat0 * R, e2)
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
