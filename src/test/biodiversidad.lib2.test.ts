import { describe, test, expect } from 'vitest'
import { PALETA, contraste } from '@/components/herramientas/biodiversidad/lib/paleta'
import { separarMarcas, traducirMarca, traducirMarcaLocal } from '@/components/herramientas/biodiversidad/lib/marcas'
import { conAncho, urlImagenValida, urlReferenciaValida } from '@/components/herramientas/biodiversidad/lib/foto'
import { ETIQUETA_METRICA, esMetrica, fmtValorMetrica, valorMetrica } from '@/components/herramientas/biodiversidad/lib/metrica'
import { etiquetaTramo, tramosLeyenda, claseDe, calcularCortes } from '@/components/herramientas/biodiversidad/lib/escala'
import { insigniasDe, esAmenaza, esTipoConservacion, NOMBRE_AMENAZA } from '@/components/herramientas/biodiversidad/lib/conservacion'
import { etiquetarLicencia } from '@/components/herramientas/biodiversidad/lib/licencia'
import { leerParametros, sanearBusqueda, actualizarParametros } from '@/components/herramientas/biodiversidad/lib/parametros'
import { puntoInterior } from '@/components/herramientas/biodiversidad/lib/geometria'
import { ordenarMunicipios } from '@/components/herramientas/biodiversidad/lib/derivar'
import type { MunicipioConteo } from '@/components/herramientas/biodiversidad/types'

const FOTO = 'https://api.gbif.org/v1/image/cache/400x/occurrence/4512345678/media/0123456789abcdef0123456789abcdef'
const mun = (r: number, s: number, e: number): MunicipioConteo => ({ codigo_municipal: '05837', municipio: 'Turbo', departamento: 'Antioquia', registros: r, sin_especie: s, especies: e })

describe('paleta y contraste (AA)', () => {
  test.each(['claro', 'oscuro'] as const)('rampa %s: cada paso se distingue de la superficie (>= 2:1) y la mitad oscura llega a 4,5:1', (modo) => {
    const p = PALETA[modo]
    for (const c of p.rampa) expect(contraste(c, p.superficie)).toBeGreaterThanOrEqual(2)
    expect(contraste(p.rampa[2], p.superficie)).toBeGreaterThanOrEqual(4.5)
    expect(contraste(p.rampa[4], p.superficie)).toBeGreaterThanOrEqual(7)
  })
  test.each(['claro', 'oscuro'] as const)('%s: trazo municipal >= 4,5:1 y borde departamental >= 7:1 sobre la superficie', (modo) => {
    const p = PALETA[modo]
    expect(contraste(p.trazoMunicipio, p.superficie)).toBeGreaterThanOrEqual(4.5)
    expect(contraste(p.bordeDepartamento, p.superficie)).toBeGreaterThanOrEqual(7)
  })
  test.each(['claro', 'oscuro'] as const)('%s: la selección (línea sobre halo) contrasta >= 4,5:1 y «sin datos» se separa de la superficie', (modo) => {
    const p = PALETA[modo]
    expect(contraste(p.seleccion, p.halo)).toBeGreaterThanOrEqual(4.5)
    expect(contraste(p.seleccion, p.sinDatos)).toBeGreaterThanOrEqual(4.2)
    expect(contraste(p.sinDatos, p.rampa[0])).toBeGreaterThan(1.5)
  })
  test('el contraste es simétrico y 21:1 entre negro y blanco', () => {
    expect(contraste('#000000', '#ffffff')).toBeCloseTo(21, 0)
    expect(contraste('#ffffff', '#000000')).toBeCloseTo(21, 0)
  })
})

describe('marcas de calidad de GBIF', () => {
  test.each([
    ['COORDINATE_ROUNDED', 'Coordenadas redondeadas por el publicador', 'info'],
    ['GEODETIC_DATUM_ASSUMED_WGS84', 'El datum geodésico no se informó: se asumió WGS84', 'info'],
    ['TAXON_ID_NOT_FOUND', 'El identificador del taxón no se encontró en la fuente', 'aviso'],
    ['SCIENTIFIC_NAME_ID_NOT_FOUND', 'El identificador del nombre científico no se encontró', 'aviso'],
    ['INSTITUTION_MATCH_FUZZY', 'La institución se asoció de forma aproximada', 'info'],
    ['COLLECTION_MATCH_FUZZY', 'La colección se asoció de forma aproximada', 'info'],
    ['OCCURRENCE_STATUS_INFERRED_FROM_INDIVIDUAL_COUNT', 'La presencia se dedujo del número de individuos', 'info'],
    ['CONTINENT_DERIVED_FROM_COORDINATES', 'El continente se dedujo de las coordenadas', 'info'],
    ['SCIENTIFIC_NAME_AND_ID_INCONSISTENT', 'El nombre científico y su identificador no coinciden', 'aviso'],
  ])('traduce %s', (codigo, texto, tono) => {
    expect(traducirMarca(codigo)).toEqual({ codigo, texto, tono })
  })
  test('desconocidas se muestran como texto con el código, sin interpretar', () => {
    expect(traducirMarca('NUEVA_MARCA').texto).toBe('Marca de calidad de GBIF: NUEVA_MARCA')
    expect(traducirMarca('<img src=x onerror=1>').texto).toBe('Marca de calidad de GBIF: <img src=x onerror=1>')
    expect(traducirMarca('constructor').texto).toContain('constructor')
    expect(traducirMarca('x'.repeat(300)).codigo).toHaveLength(80)
  })
})

describe('validación de fotografías', () => {
  test('acepta solo la caché de imágenes de GBIF', () => {
    expect(urlImagenValida(FOTO)).toBe(FOTO)
    const malas = [
      'http://api.gbif.org/v1/image/cache/400x/occurrence/1/media/0123456789abcdef0123456789abcdef',
      'https://evil.example/v1/image/cache/400x/occurrence/1/media/0123456789abcdef0123456789abcdef',
      'https://api.gbif.org.evil.com/v1/image/cache/400x/occurrence/1/media/0123456789abcdef0123456789abcdef',
      'https://api.gbif.org/v1/image/cache/400x/occurrence/1/media/XYZ',
      'https://s3.amazonaws.com/bucket/foto.jpg',
      `${FOTO}?x=1`, `${FOTO}/`, 'javascript:alert(1)', '', null, undefined,
    ]
    for (const u of malas) expect(urlImagenValida(u)).toBeNull()
    expect(urlImagenValida(`${FOTO}${'a'.repeat(500)}`)).toBeNull()
  })
  test('cambia el ancho sin salir del patrón', () => {
    expect(urlImagenValida(conAncho(FOTO, 800))).toContain('/cache/800x/')
  })
  test('referencia: solo https sin credenciales', () => {
    expect(urlReferenciaValida('https://www.inaturalist.org/photos/1')).toBe('https://www.inaturalist.org/photos/1')
    for (const u of ['http://x.org/a', 'javascript:1', 'https://u:p@x.org/', 'https://localhost/a', 'no es url', '', null]) expect(urlReferenciaValida(u)).toBeNull()
  })
})

describe('métricas del mapa', () => {
  test('valor por métrica y null cuando no hay datos', () => {
    expect(valorMetrica(mun(200, 50, 12), 'registros')).toBe(200)
    expect(valorMetrica(mun(200, 50, 12), 'especies')).toBe(12)
    expect(valorMetrica(mun(200, 50, 12), 'sin_especie')).toBe(25)
    expect(valorMetrica(mun(0, 0, 0), 'registros')).toBeNull()
    expect(valorMetrica(mun(10, 0, 0), 'especies')).toBeNull()
    expect(valorMetrica(undefined, 'registros')).toBeNull()
    expect(valorMetrica(mun(10, 0, 3), 'sin_especie')).toBe(0)
  })
  test('formato y validación', () => {
    expect(fmtValorMetrica(1234, 'registros')).toBe('1.234')
    expect(fmtValorMetrica(12.5, 'sin_especie')).toBe('12,5 %')
    expect(fmtValorMetrica(null, 'especies')).toBe('Sin datos')
    expect(esMetrica('especies')).toBe(true)
    expect(esMetrica('otra')).toBe(false)
    expect(ETIQUETA_METRICA.sin_especie).toBe('% sin especie')
  })
  test('0 % sin especie con datos cae en la primera clase, no en «sin datos»', () => {
    expect(claseDe(0, [10, 20])).toBe(1)
    expect(claseDe(null, [10, 20])).toBe(0)
  })
  test('tramos y rótulos de porcentaje', () => {
    const t = tramosLeyenda([5, 20], 80, false)
    expect(t[0]).toEqual({ clase: 1, desde: 0, hasta: 5 })
    expect(t[1].desde).toBe(5)
    expect(etiquetaTramo(t[0], 'sin_especie')).toBe('0 – 5 %')
    expect(etiquetaTramo({ clase: 1, desde: 3, hasta: 3 }, 'registros')).toBe('3')
    expect(calcularCortes([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).length).toBeGreaterThan(2)
  })
})

describe('conservación', () => {
  const base = { amenaza: null, endemica_colombia: false, endemica_choco: false, introducida: false, invasora: false }
  test('insignias en orden de relevancia y con nombres en español', () => {
    const l = insigniasDe({ ...base, amenaza: 'EN', endemica_colombia: true, endemica_choco: true })
    expect(l.map((i) => i.texto)).toEqual(['EN · En peligro', 'Endémica de Colombia', 'Endémica del Chocó (IIAP, 2011)'])
    expect(NOMBRE_AMENAZA).toEqual({ CR: 'En peligro crítico', EN: 'En peligro', VU: 'Vulnerable' })
  })
  test('invasora prevalece sobre introducida y sin datos no hay insignias', () => {
    expect(insigniasDe({ ...base, introducida: true, invasora: true }).map((i) => i.texto)).toEqual(['Invasora'])
    expect(insigniasDe({ ...base, introducida: true }).map((i) => i.texto)).toEqual(['Introducida'])
    expect(insigniasDe(base)).toEqual([])
  })
  test('tipos válidos', () => {
    expect(esAmenaza('CR')).toBe(true)
    expect(esAmenaza('LC')).toBe(false)
    expect(esTipoConservacion('invasora')).toBe(true)
    expect(esTipoConservacion('x')).toBe(false)
  })
})

describe('licencias de fotos', () => {
  test('códigos de GBIF y texto alterno', () => {
    expect(etiquetarLicencia('CC_BY_NC_4_0').etiqueta).toBe('CC BY-NC')
    expect(etiquetarLicencia('CC BY 4.0').href).toBe('https://creativecommons.org/licenses/by/4.0/deed.es')
    expect(etiquetarLicencia('texto libre', { etiqueta: 'Licencia no indicada', href: null }).etiqueta).toBe('Licencia no indicada')
  })
})

describe('parámetros nuevos de URL', () => {
  test('lee y sanea todos los filtros', () => {
    const p = leerParametros(new URLSearchParams('metrica=especies&modo=tabla&buscar=%20Rhinella%20&con_foto=1&conservacion=amenazada&amenaza=CR&especie=ABC123&nombre_especie=Rhinella%20marina&registro=987&orden=nombre'))
    expect(p).toMatchObject({ metrica: 'especies', modo: 'tabla', buscar: 'Rhinella', conFoto: true, conservacion: 'amenazada', amenaza: 'CR', especie: 'ABC123', nombreEspecie: 'Rhinella marina', registro: '987', orden: 'nombre' })
  })
  test('descarta valores inválidos', () => {
    const p = leerParametros(new URLSearchParams('metrica=x&modo=y&buscar=a&con_foto=si&conservacion=z&amenaza=LC&especie=a/b&nombre_especie=zz&registro=12ab&orden=zz&vista=nada'))
    expect(p).toMatchObject({ metrica: 'registros', modo: 'tarjetas', buscar: '', conFoto: false, conservacion: null, amenaza: null, especie: null, nombreEspecie: null, registro: null, orden: 'registros', vista: null })
  })
  test('la búsqueda se limita a 60 caracteres y quita controles', () => {
    expect(sanearBusqueda('a'.repeat(100))).toHaveLength(60)
    expect(sanearBusqueda('ab\u0000c')).toBe('abc')
    expect(sanearBusqueda(null)).toBe('')
    expect(sanearBusqueda('x')).toBe('')
  })
  test('actualizar conserva la herramienta', () => {
    const r = actualizarParametros(new URLSearchParams('herramienta=biodiversidad'), { vista: 'especies', metrica: null })
    expect(r.toString()).toBe('herramienta=biodiversidad&vista=especies')
  })
})

describe('orden por especies', () => {
  test('ordena por la nueva columna', () => {
    const lista = [{ ...mun(1, 0, 5), municipio: 'A' }, { ...mun(2, 0, 9), municipio: 'B' }]
    expect(ordenarMunicipios(lista, 'especies', true)[0].municipio).toBe('B')
  })
})

describe('punto interior para etiquetas', () => {
  const cuadro = (x0: number, y0: number, x1: number, y1: number) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]
  test('en un cuadrado cae cerca del centro', () => {
    const p = puntoInterior('Polygon', [cuadro(0, 0, 10, 10)])!
    expect(Math.abs(p[0] - 5)).toBeLessThan(1)
    expect(Math.abs(p[1] - 5)).toBeLessThan(1)
  })
  test('si el centro es un hueco, el punto queda dentro del anillo', () => {
    const p = puntoInterior('Polygon', [cuadro(0, 0, 10, 10), cuadro(3, 3, 7, 7)])!
    const enHueco = p[0] > 3 && p[0] < 7 && p[1] > 3 && p[1] < 7
    expect(enHueco).toBe(false)
  })
  test('multipolígono usa la parte mayor y entradas vacías devuelven null', () => {
    const p = puntoInterior('MultiPolygon', [[cuadro(0, 0, 1, 1)], [cuadro(20, 20, 30, 30)]])!
    expect(p[0]).toBeGreaterThan(20)
    expect(puntoInterior('MultiPolygon', [])).toBeNull()
  })
})

describe('marcas locales de revisión', () => {
  test.each([
    ['incertidumbre_no_informada', 'aviso'], ['incertidumbre_mayor_umbral', 'aviso'],
    ['incertidumbre_alcanza_borde_regional', 'aviso'], ['incertidumbre_alcanza_borde_municipal', 'info'],
  ])('%s', (codigo, tono) => {
    expect(traducirMarcaLocal(codigo).tono).toBe(tono)
    expect(traducirMarcaLocal(codigo).texto).not.toContain(codigo)
  })
  test('desconocidas usan el texto genérico y no se confunden con códigos de GBIF', () => {
    expect(traducirMarcaLocal('otra').texto).toBe('Marca de revisión de la plataforma: otra')
    expect(traducirMarcaLocal('COORDINATE_ROUNDED').texto).toContain('plataforma')
    expect(traducirMarcaLocal('toString').texto).toContain('toString')
  })
  test('separa por «;», limpia y elimina repetidas', () => {
    expect(separarMarcas(['a;b', ' b ', '', 'c;'])).toEqual(['a', 'b', 'c'])
    expect(separarMarcas(undefined)).toEqual([])
  })
})
