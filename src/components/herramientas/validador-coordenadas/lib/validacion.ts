/**
 * Pipeline de validación -- puerto verbatim de la lógica de
 * validador_coordenadas_IIAP.html (Eddy Chaverra, IIAP). Los umbrales, el
 * orden de los pasos y los mensajes de error/observación NO deben cambiar
 * sin verificar contra la fuente original; solo se adaptó el estado mutable
 * global (ROWS/RESULTS) a funciones que reciben y devuelven datos, para que
 * React pueda tratar el resultado como un solo setState en vez de mutaciones
 * dispersas sobre el DOM.
 */
import center from '@turf/centroid'
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import { point } from '@turf/helpers'
import type { Feature, Polygon, MultiPolygon } from 'geojson'
import type { MunicipioProps } from '../data/municipiosChoco.generated'
import type { FilaExcel, FilaResultado } from '../types'
import { limpiarCoord, cantidadDecimales, haversineKm } from './coordenadas'

export type MunicipioFeature = Feature<Polygon | MultiPolygon, MunicipioProps>

function filaVacia(overrides: Partial<FilaResultado> = {}): FilaResultado {
  return {
    estado: '', tipoError: '', observacion: '', depDet: '', muniDet: '', codigoDivipola: '',
    latIntercambiada: false, distCentroideKm: null, ...overrides,
  }
}

/** Centroide de cada municipio, memoizado en la propia feature (igual que el original). */
export function precalcularCentroides(features: MunicipioFeature[]): void {
  for (const f of features) {
    if (f.properties._centroidLat !== undefined) continue
    try {
      const c = center(f)
      f.properties._centroidLat = c.geometry.coordinates[1]
      f.properties._centroidLon = c.geometry.coordinates[0]
    } catch { /* geometría inválida, se ignora -- igual que el original */ }
  }
}

/** Punto en polígono contra los municipios objetivo (turf), recorriendo en orden. */
export function buscarMunicipio(lat: number, lon: number, features: MunicipioFeature[]): MunicipioProps | null {
  const pt = point([lon, lat])
  for (const f of features) {
    try {
      if (booleanPointInPolygon(pt, f)) return f.properties
    } catch { /* geometría inválida, se ignora */ }
  }
  return null
}

/** Validación de rango/vacías/(0,0) -- primer paso, igual que el original. */
function validarBasicoFila(row: FilaExcel, colLat: string, colLon: string): FilaResultado {
  const lat = limpiarCoord(row[colLat])
  const lon = limpiarCoord(row[colLon])
  const errores: string[] = []
  if (isNaN(lat) && isNaN(lon)) errores.push('Latitud y longitud vacías')
  else if (isNaN(lat)) errores.push('Latitud vacía o no numérica')
  else if (isNaN(lon)) errores.push('Longitud vacía o no numérica')
  if (!isNaN(lat) && (lat < -90 || lat > 90)) errores.push('Latitud fuera de rango (-90 a 90)')
  if (!isNaN(lon) && (lon < -180 || lon > 180)) errores.push('Longitud fuera de rango (-180 a 180)')
  if (!isNaN(lat) && !isNaN(lon) && lat === 0 && lon === 0) errores.push('Coordenada (0,0) sospechosa')
  if (errores.length > 0) {
    return filaVacia({ estado: 'INVÁLIDA', tipoError: errores.join('; '), observacion: 'La coordenada requiere revisión.' })
  }
  return filaVacia()
}

/** Revalida una sola fila -- usado al mover/editar/agregar un punto en el mapa. */
export function validarUnPunto(row: FilaExcel, colLat: string, colLon: string, features: MunicipioFeature[]): FilaResultado {
  const r = validarBasicoFila(row, colLat, colLon)
  if (r.estado === 'INVÁLIDA') return r

  const lat = limpiarCoord(row[colLat])
  const lon = limpiarCoord(row[colLon])
  const props = buscarMunicipio(lat, lon, features)
  if (props) {
    const distCentroideKm = haversineKm(lat, lon, props._centroidLat ?? NaN, props._centroidLon ?? NaN)
    const base = filaVacia({
      depDet: props.DPTO_CNMBRE || '', muniDet: props.MPIO_CNMBRE || '', codigoDivipola: props.MPIO_CDPMP || '',
      distCentroideKm, estado: 'VÁLIDA', observacion: 'Coordenada ubicada dentro de uno de los 93 municipios objetivo.',
    })
    const dLat = cantidadDecimales(row[colLat]), dLon = cantidadDecimales(row[colLon])
    if (dLat <= 1 && dLon <= 1) {
      return { ...base, estado: 'SOSPECHOSA', tipoError: 'Baja precisión decimal', observacion: 'La coordenada se encuentra dentro de un municipio objetivo, pero presenta poca precisión decimal.' }
    }
    return base
  }

  const invalida = filaVacia({
    estado: 'INVÁLIDA', tipoError: 'Coordenada fuera de los 93 municipios objetivo',
    observacion: 'La coordenada tiene formato y rango válidos, pero se encuentra fuera del territorio geográfico definido.',
  })
  const latI = lon, lonI = lat
  if (latI >= -90 && latI <= 90 && lonI >= -180 && lonI <= 180) {
    const props2 = buscarMunicipio(latI, lonI, features)
    if (props2) {
      return {
        ...invalida, latIntercambiada: true, estado: 'SOSPECHOSA', tipoError: 'Posible latitud y longitud intercambiadas',
        observacion: `Al intercambiar latitud y longitud, la coordenada cae en ${props2.MPIO_CNMBRE}, ${props2.DPTO_CNMBRE}.`,
      }
    }
  }
  return invalida
}

function detectarIntercambiadas(rows: FilaExcel[], results: FilaResultado[], colLat: string, colLon: string, features: MunicipioFeature[]): void {
  for (let i = 0; i < rows.length; i++) {
    const r = results[i]
    if (r.muniDet !== '') continue
    const lat = limpiarCoord(rows[i][colLat])
    const lon = limpiarCoord(rows[i][colLon])
    if (isNaN(lat) || isNaN(lon)) continue
    const latI = lon, lonI = lat
    if (!(latI >= -90 && latI <= 90 && lonI >= -180 && lonI <= 180)) continue
    const props = buscarMunicipio(latI, lonI, features)
    if (props) {
      r.latIntercambiada = true
      r.estado = 'SOSPECHOSA'
      r.tipoError = 'Posible latitud y longitud intercambiadas'
      r.observacion = `Al intercambiar latitud y longitud, la coordenada cae en ${props.MPIO_CNMBRE}, ${props.DPTO_CNMBRE}.`
    }
  }
}

function detectarPrecision(rows: FilaExcel[], results: FilaResultado[], colLat: string, colLon: string): void {
  for (let i = 0; i < rows.length; i++) {
    const r = results[i]
    if (r.estado !== 'VÁLIDA') continue
    const dLat = cantidadDecimales(rows[i][colLat])
    const dLon = cantidadDecimales(rows[i][colLon])
    if (dLat <= 1 && dLon <= 1) {
      r.estado = 'SOSPECHOSA'
      r.tipoError = 'Baja precisión decimal'
      r.observacion = 'La coordenada se encuentra dentro de un municipio objetivo, pero presenta poca precisión decimal.'
    }
  }
}

/** Marca repetidas como sospechosas, salvo las que el usuario ya confirmó manualmente. */
export function detectarDuplicadas(rows: FilaExcel[], results: FilaResultado[], colLat: string, colLon: string): void {
  const cont: Record<string, number> = {}
  const keys = rows.map((row) => {
    const lat = limpiarCoord(row[colLat]), lon = limpiarCoord(row[colLon])
    const k = isNaN(lat) || isNaN(lon) ? null : `${lat},${lon}`
    if (k) cont[k] = (cont[k] || 0) + 1
    return k
  })
  for (let i = 0; i < rows.length; i++) {
    const k = keys[i]
    if (results[i].confirmadoManual) continue
    if (k && cont[k] > 1 && results[i].estado === 'VÁLIDA') {
      results[i].estado = 'SOSPECHOSA'
      results[i].tipoError = 'Coordenada repetida'
      results[i].observacion = 'La misma combinación de latitud y longitud aparece en más de un registro. Puede ser correcto si varios registros corresponden al mismo sitio.'
    }
  }
}

export function esDuplicadaPendiente(r: FilaResultado): boolean {
  return r.estado === 'SOSPECHOSA' && r.tipoError === 'Coordenada repetida' && !r.confirmadoManual
}

/**
 * Corre el pipeline completo sobre todas las filas: básico → contra
 * municipios (+ intercambiadas) → precisión → duplicadas. Mismo orden que
 * el original. Preserva los flags manuales/de movimiento/confirmación de
 * `resultsPrevios` cuando existen (re-validación tras editar/mover un punto).
 */
export function procesarValidacion(
  rows: FilaExcel[], colLat: string, colLon: string, features: MunicipioFeature[],
  resultsPrevios?: FilaResultado[],
): FilaResultado[] {
  const results: FilaResultado[] = rows.map((row, i) => {
    const previo = resultsPrevios?.[i]
    const base = validarBasicoFila(row, colLat, colLon)
    return {
      ...base,
      filaExcel: previo?.filaExcel,
      manual: previo?.manual,
      movido: previo?.movido,
      latOriginalAntesDeMover: previo?.latOriginalAntesDeMover,
      lonOriginalAntesDeMover: previo?.lonOriginalAntesDeMover,
      confirmadoManual: previo?.confirmadoManual,
    }
  })

  for (let i = 0; i < rows.length; i++) {
    const r = results[i]
    if (r.estado === 'INVÁLIDA' && r.tipoError.indexOf('vacías') >= 0) continue
    const lat = limpiarCoord(rows[i][colLat])
    const lon = limpiarCoord(rows[i][colLon])
    if (isNaN(lat) || isNaN(lon)) continue
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) continue

    const props = buscarMunicipio(lat, lon, features)
    if (props) {
      r.depDet = props.DPTO_CNMBRE || ''
      r.muniDet = props.MPIO_CNMBRE || ''
      r.codigoDivipola = props.MPIO_CDPMP || ''
      r.distCentroideKm = haversineKm(lat, lon, props._centroidLat ?? NaN, props._centroidLon ?? NaN)
      if (r.estado === '') { r.estado = 'VÁLIDA'; r.observacion = 'Coordenada ubicada dentro de uno de los 93 municipios objetivo.' }
    } else if (r.estado === '') {
      r.estado = 'INVÁLIDA'
      r.tipoError = 'Coordenada fuera de los 93 municipios objetivo'
      r.observacion = 'La coordenada tiene formato y rango válidos, pero se encuentra fuera del territorio geográfico definido.'
    }
  }

  detectarIntercambiadas(rows, results, colLat, colLon, features)
  detectarPrecision(rows, results, colLat, colLon)
  detectarDuplicadas(rows, results, colLat, colLon)
  return results
}
