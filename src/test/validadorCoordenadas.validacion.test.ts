import { describe, test, expect } from 'vitest'
import { MUNICIPIOS_CHOCO } from '@/components/herramientas/validador-coordenadas/data/municipiosChoco.generated'
import {
  precalcularCentroides, buscarMunicipio, procesarValidacion, validarUnPunto,
  detectarDuplicadas, esDuplicadaPendiente,
} from '@/components/herramientas/validador-coordenadas/lib/validacion'
import type { FilaExcel, FilaResultado } from '@/components/herramientas/validador-coordenadas/types'

precalcularCentroides(MUNICIPIOS_CHOCO.features)
const features = MUNICIPIOS_CHOCO.features

// Verificado contra los datos reales embebidos (no un supuesto): 5.6947,-76.6611 cae en Quibdó.
const QUIBDO = { lat: 5.6947, lon: -76.6611 }

describe('buscarMunicipio()', () => {
  test('un punto dentro de Quibdó retorna sus propiedades', () => {
    const props = buscarMunicipio(QUIBDO.lat, QUIBDO.lon, features)
    expect(props?.MPIO_CNMBRE).toBe('Quibdó')
    expect(props?.DPTO_CNMBRE).toBe('CHOCÓ')
  })
  test('un punto en medio del océano retorna null', () => {
    expect(buscarMunicipio(0, 0, features)).toBeNull()
  })
  test('un punto en Bogotá (fuera de los 93 municipios) retorna null', () => {
    expect(buscarMunicipio(4.71, -74.07, features)).toBeNull()
  })
})

describe('precalcularCentroides()', () => {
  test('memoiza el centroide en la propia feature, no lo recalcula dos veces', () => {
    const f = features.find((x) => x.properties.MPIO_CNMBRE === 'Quibdó')!
    const antes = f.properties._centroidLat
    precalcularCentroides(features)
    expect(f.properties._centroidLat).toBe(antes)
  })
})

function fila(lat: string | number | undefined, lon: string | number | undefined): FilaExcel {
  return { lat, lon }
}

describe('procesarValidacion() — validación básica', () => {
  test('ambas coordenadas vacías -> INVÁLIDA', () => {
    const [r] = procesarValidacion([fila('', '')], 'lat', 'lon', features)
    expect(r.estado).toBe('INVÁLIDA')
    expect(r.tipoError).toBe('Latitud y longitud vacías')
  })
  test('solo latitud vacía -> INVÁLIDA con mensaje específico', () => {
    const [r] = procesarValidacion([fila('', -76.66)], 'lat', 'lon', features)
    expect(r.tipoError).toBe('Latitud vacía o no numérica')
  })
  test('latitud fuera de rango (-90 a 90) -> INVÁLIDA', () => {
    const [r] = procesarValidacion([fila(200, -76.66)], 'lat', 'lon', features)
    expect(r.tipoError).toContain('Latitud fuera de rango')
  })
  test('longitud fuera de rango (-180 a 180) -> INVÁLIDA', () => {
    const [r] = procesarValidacion([fila(5.69, 400)], 'lat', 'lon', features)
    expect(r.tipoError).toContain('Longitud fuera de rango')
  })
  test('(0,0) es sospechosa de ser un dato faltante', () => {
    const [r] = procesarValidacion([fila(0, 0)], 'lat', 'lon', features)
    expect(r.tipoError).toContain('Coordenada (0,0) sospechosa')
  })
})

describe('procesarValidacion() — contra los 93 municipios', () => {
  test('un punto dentro de Quibdó -> VÁLIDA con depto/municipio/DIVIPOLA detectados', () => {
    const [r] = procesarValidacion([fila(QUIBDO.lat, QUIBDO.lon)], 'lat', 'lon', features)
    expect(r.estado).toBe('VÁLIDA')
    expect(r.muniDet).toBe('Quibdó')
    expect(r.depDet).toBe('CHOCÓ')
    expect(r.codigoDivipola).toBe('27001')
    expect(r.distCentroideKm).not.toBeNull()
  })
  test('un punto en rango válido pero fuera de los 93 municipios -> INVÁLIDA', () => {
    const [r] = procesarValidacion([fila(4.71, -74.07)], 'lat', 'lon', features)
    expect(r.estado).toBe('INVÁLIDA')
    expect(r.tipoError).toBe('Coordenada fuera de los 93 municipios objetivo')
  })
})

describe('procesarValidacion() — lat/lon intercambiadas', () => {
  test('detecta cuando invertir lat/lon cae dentro de un municipio objetivo', () => {
    // Quibdó real: lat=5.6947, lon=-76.6611. Si alguien cargó las columnas al
    // revés, la fila tendría lat=-76.6611 (inválida, fuera de rango -90..90
    // no aplica aquí porque -76 sí es válido como latitud) lon=5.6947.
    const [r] = procesarValidacion([fila(-76.6611, 5.6947)], 'lat', 'lon', features)
    expect(r.estado).toBe('SOSPECHOSA')
    expect(r.tipoError).toBe('Posible latitud y longitud intercambiadas')
    expect(r.latIntercambiada).toBe(true)
    expect(r.observacion).toContain('Quibdó')
  })
})

describe('procesarValidacion() — baja precisión decimal', () => {
  test('una coordenada válida con <=1 decimal en ambos ejes se marca sospechosa', () => {
    // 5.7,-76.7 -- 1 decimal cada uno, y cae dentro de un municipio objetivo.
    const [r] = procesarValidacion([fila(5.7, -76.7)], 'lat', 'lon', features)
    expect(r.estado).toBe('SOSPECHOSA')
    expect(r.tipoError).toBe('Baja precisión decimal')
  })
  test('una coordenada con precisión suficiente en al menos un eje no se marca', () => {
    const [r] = procesarValidacion([fila(QUIBDO.lat, QUIBDO.lon)], 'lat', 'lon', features)
    expect(r.estado).toBe('VÁLIDA')
  })
})

describe('procesarValidacion() — duplicadas', () => {
  test('dos filas con exactamente la misma coordenada válida se marcan sospechosas', () => {
    const rows = [fila(QUIBDO.lat, QUIBDO.lon), fila(QUIBDO.lat, QUIBDO.lon)]
    const results = procesarValidacion(rows, 'lat', 'lon', features)
    expect(results[0].estado).toBe('SOSPECHOSA')
    expect(results[0].tipoError).toBe('Coordenada repetida')
    expect(results[1].estado).toBe('SOSPECHOSA')
  })
  test('una fila ya confirmada manualmente no vuelve a marcarse como duplicada', () => {
    const rows = [fila(QUIBDO.lat, QUIBDO.lon), fila(QUIBDO.lat, QUIBDO.lon)]
    const previos: FilaResultado[] = [
      { estado: 'VÁLIDA', tipoError: '', observacion: '', depDet: '', muniDet: '', codigoDivipola: '', latIntercambiada: false, distCentroideKm: null, confirmadoManual: true },
      { estado: '', tipoError: '', observacion: '', depDet: '', muniDet: '', codigoDivipola: '', latIntercambiada: false, distCentroideKm: null },
    ]
    const results = procesarValidacion(rows, 'lat', 'lon', features, previos)
    expect(results[0].estado).toBe('VÁLIDA')
    expect(results[0].tipoError).toBe('')
  })
  test('esDuplicadaPendiente() identifica solo las repetidas sin confirmar', () => {
    const rows = [fila(QUIBDO.lat, QUIBDO.lon), fila(QUIBDO.lat, QUIBDO.lon)]
    const results = procesarValidacion(rows, 'lat', 'lon', features)
    expect(esDuplicadaPendiente(results[0])).toBe(true)
    expect(esDuplicadaPendiente({ ...results[0], confirmadoManual: true })).toBe(false)
  })
})

describe('procesarValidacion() — preserva flags administrativos entre pasadas', () => {
  test('mantiene filaExcel/manual/movido al revalidar con resultsPrevios', () => {
    const rows = [fila(QUIBDO.lat, QUIBDO.lon)]
    const previos: FilaResultado[] = [{
      estado: '', tipoError: '', observacion: '', depDet: '', muniDet: '', codigoDivipola: '',
      latIntercambiada: false, distCentroideKm: null, filaExcel: 7, manual: false, movido: true,
      latOriginalAntesDeMover: 1, lonOriginalAntesDeMover: 2,
    }]
    const [r] = procesarValidacion(rows, 'lat', 'lon', features, previos)
    expect(r.filaExcel).toBe(7)
    expect(r.movido).toBe(true)
    expect(r.latOriginalAntesDeMover).toBe(1)
  })
})

describe('validarUnPunto()', () => {
  test('revalida un solo punto contra los municipios -- mismo resultado que procesarValidacion', () => {
    const r = validarUnPunto(fila(QUIBDO.lat, QUIBDO.lon), 'lat', 'lon', features)
    expect(r.estado).toBe('VÁLIDA')
    expect(r.muniDet).toBe('Quibdó')
  })
  test('un punto fuera de rango retorna INVÁLIDA sin llegar a buscar municipio', () => {
    const r = validarUnPunto(fila(200, -76.66), 'lat', 'lon', features)
    expect(r.estado).toBe('INVÁLIDA')
    expect(r.tipoError).toContain('fuera de rango')
  })
})

describe('detectarDuplicadas()', () => {
  test('mutación in-place marca solo las VÁLIDAS repetidas', () => {
    const rows = [fila(QUIBDO.lat, QUIBDO.lon), fila(QUIBDO.lat, QUIBDO.lon), fila(1, 2)]
    const results: FilaResultado[] = [
      { estado: 'VÁLIDA', tipoError: '', observacion: '', depDet: '', muniDet: '', codigoDivipola: '', latIntercambiada: false, distCentroideKm: null },
      { estado: 'VÁLIDA', tipoError: '', observacion: '', depDet: '', muniDet: '', codigoDivipola: '', latIntercambiada: false, distCentroideKm: null },
      { estado: 'INVÁLIDA', tipoError: 'x', observacion: '', depDet: '', muniDet: '', codigoDivipola: '', latIntercambiada: false, distCentroideKm: null },
    ]
    detectarDuplicadas(rows, results, 'lat', 'lon')
    expect(results[0].estado).toBe('SOSPECHOSA')
    expect(results[1].estado).toBe('SOSPECHOSA')
    expect(results[2].estado).toBe('INVÁLIDA') // no era VÁLIDA, no se toca
  })
})
