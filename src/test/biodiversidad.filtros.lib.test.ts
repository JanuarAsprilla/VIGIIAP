import { describe, test, expect } from 'vitest'
import {
  FILTROS_VACIOS, QUITAR_TODOS, cambiosConservacion, cambiosEntidad, cambiosTaxon, contarFiltros, leerFiltros, type Filtros,
} from '@/components/herramientas/biodiversidad/lib/filtros'
import { alCambiarGrupo, aplicabilidad, reconciliar } from '@/components/herramientas/biodiversidad/lib/aplicabilidad'
import { paramsApi, paramsSugerencias } from '@/components/herramientas/biodiversidad/lib/paramsApi'
import { chipsActivos, textoResumen } from '@/components/herramientas/biodiversidad/lib/chips'
import { actualizarParametros } from '@/components/herramientas/biodiversidad/lib/parametros'
import {
  bboxATexto, mensajeMuestra, mensajeOcultos, puntosDibujables, redondearBbox, ubicacionPublica,
} from '@/components/herramientas/biodiversidad/lib/puntos'
import { ordenEspecies, ordenRegistros } from '@/components/herramientas/biodiversidad/lib/orden'
import { fmtNum } from '@/components/herramientas/biodiversidad/lib/format'

const f = (c: Partial<Filtros> = {}): Filtros => ({ ...FILTROS_VACIOS, ...c })
const UUID = 'e1050db2-9faf-4d72-b860-295debaf9d2a'

describe('estado de filtros en la URL', () => {
  test('ida y vuelta: lo que se escribe es lo que se lee', () => {
    const url = actualizarParametros(new URLSearchParams('herramienta=biodiversidad'), {
      ...cambiosTaxon('familia', 'Hylidae'), ...cambiosEntidad(UUID, 'IIAP'), ...cambiosConservacion('amenazada', 'CR'),
      anio_desde: 2010, evidencia: 'HUMAN_OBSERVATION', con_foto: '1', con_ubicacion: '1', departamento: 'Chocó',
    })
    expect(leerFiltros(url)).toMatchObject({
      familia: 'Hylidae', entidad: UUID, nombreEntidad: 'IIAP', conservacion: 'amenazada', amenaza: 'CR', anioDesde: 2010,
      evidencia: 'HUMAN_OBSERVATION', conFoto: true, conUbicacion: true, departamento: 'Chocó',
    })
    expect(url.get('herramienta')).toBe('biodiversidad')
  })
  test('valores inválidos se descartan', () => {
    const p = new URLSearchParams({
      clase: '<script>', familia: 'A', genero: 'x;DROP', entidad: 'no-uuid', conjunto: '123', evidencia: 'human', anio_desde: '1800',
      anio_hasta: '9999', municipio: '5', especie: 'a/b', conservacion: 'z', amenaza: 'LC', nombre_entidad: 'solo con uuid',
    })
    expect(leerFiltros(p)).toEqual(f())
  })
  test('acepta nombres taxonómicos con acentos, espacios y apóstrofes', () => {
    expect(leerFiltros(new URLSearchParams("genero=Pristimantis&reino=Plantae&division=Magnoliophyta&orden_taxon=Anura&clase=O'Brien%20(sp.)")).clase).toBe("O'Brien (sp.)")
  })
  test('cascada: elegir un nivel limpia los inferiores y la especie; los superiores se mantienen', () => {
    const base = new URLSearchParams('reino=Animalia&clase=Amphibia&orden_taxon=Anura&familia=Hylidae&genero=Boana&especie=K1&nombre_especie=Boana%20x')
    const r = leerFiltros(actualizarParametros(base, cambiosTaxon('orden_taxon', 'Caudata')))
    expect(r).toMatchObject({ reino: 'Animalia', clase: 'Amphibia', orden_taxon: 'Caudata', familia: null, genero: null, especie: null })
    const q = leerFiltros(actualizarParametros(base, cambiosTaxon('clase', null)))
    expect(q).toMatchObject({ reino: 'Animalia', clase: null, orden_taxon: null, familia: null, genero: null, especie: null })
  })
  test('amenaza solo vive con «amenazadas»; entidad nueva limpia el conjunto', () => {
    expect(cambiosConservacion('endemica', 'CR')).toEqual({ conservacion: 'endemica', amenaza: null })
    expect(cambiosEntidad(UUID, 'X')).toMatchObject({ conjunto: null, nombre_conjunto: null })
  })
  test('limpiar todo elimina cada clave de filtro y cuenta los activos (territorio cuenta una vez)', () => {
    const url = actualizarParametros(new URLSearchParams('grupo=aves&familia=X1&municipio=05837&departamento=Antioquia'), QUITAR_TODOS)
    expect([...url.keys()]).toEqual(['grupo'])
    expect(contarFiltros(f({ municipio: '05837', departamento: 'Antioquia', familia: 'Hylidae', conFoto: true }))).toBe(3)
  })
})

describe('aplicabilidad por tipo de grupo', () => {
  test('individual: todo disponible', () => {
    const a = aplicabilidad('individual', f({ familia: 'Hylidae', entidad: UUID }))
    expect(a).toMatchObject({ taxonomia: true, conservacion: true, fuente: true, tiempo: true, calidad: true })
  })
  test('agregado: año, evidencia, foto y ubicación no aplican, con explicación', () => {
    const a = aplicabilidad('agregado', f())
    expect(a).toMatchObject({ tiempo: false, evidencia: false, calidad: false, taxonomia: true, fuente: true })
    expect(a.motivoRegistro).toMatch(/inventario agregado/)
  })
  test('agregado: fuente y taxonomía son excluyentes', () => {
    expect(aplicabilidad('agregado', f({ familia: 'Tyrannidae' }))).toMatchObject({ fuente: false, taxonomia: true })
    expect(aplicabilidad('agregado', f({ familia: 'Tyrannidae' })).motivoFuente).toMatch(/no se combina/)
    expect(aplicabilidad('agregado', f({ conservacion: 'invasora' })).fuente).toBe(false)
    const conFuente = aplicabilidad('agregado', f({ entidad: UUID }))
    expect(conFuente).toMatchObject({ taxonomia: false, conservacion: false })
    expect(conFuente.motivoTaxonomia).toBeTruthy()
  })
  test('reconciliar quita lo inaplicable sin tocar el original y nombra lo descartado', () => {
    const original = f({ anioDesde: 2010, evidencia: 'HUMAN_OBSERVATION', conFoto: true, conUbicacion: true, familia: 'Tyrannidae', entidad: UUID })
    const r = reconciliar(original, 'agregado')
    expect(r.efectivos).toMatchObject({ anioDesde: null, evidencia: null, conFoto: false, conUbicacion: false, entidad: null, familia: 'Tyrannidae' })
    expect(r.descartados).toEqual(['Años', 'Tipo de evidencia', 'Solo con foto', 'Solo con ubicación visible', 'Fuente de datos'])
    expect(original.conFoto).toBe(true)
    expect(reconciliar(original, 'individual').descartados).toEqual([])
  })
  test('al cambiar de grupo se conservan territorio, conservación y años; la taxonomía se quita y se avisa', () => {
    const r = alCambiarGrupo(f({ municipio: '05837', conservacion: 'amenazada', anioDesde: 2010, familia: 'Hylidae', especie: 'K1', nombreEspecie: 'Boana x', buscar: 'bo' }), 'individual')
    expect(r.efectivos).toMatchObject({ municipio: '05837', conservacion: 'amenazada', anioDesde: 2010, familia: null, especie: null, buscar: '' })
    expect(r.descartados).toEqual(['Familia Hylidae', 'Especie Boana x', 'Búsqueda «bo»'])
    expect(r.limpieza).toMatchObject({ familia: null, especie: null, buscar: null })
    const agregado = alCambiarGrupo(f({ anioDesde: 2010, conservacion: 'amenazada' }), 'agregado')
    expect(agregado.efectivos).toMatchObject({ anioDesde: null, conservacion: 'amenazada' })
    expect(agregado.descartados).toContain('Años')
  })
})

describe('parámetros de la API (nunca un 422 evitable)', () => {
  const todo = f({
    departamento: 'Chocó', reino: 'Animalia', clase: 'Amphibia', orden_taxon: 'Anura', familia: 'Hylidae', especie: 'K1', buscar: 'bo',
    conservacion: 'amenazada', amenaza: 'EN', entidad: UUID, conjunto: UUID, anioDesde: 2010, anioHasta: 2020, evidencia: 'HUMAN_OBSERVATION',
    conFoto: true, conUbicacion: true,
  })
  test('individual: todos los filtros; el orden taxonómico viaja como orden_taxon', () => {
    const p = paramsApi('registros', todo, 'individual')
    expect(p).toMatchObject({
      departamento: 'Chocó', reino: 'Animalia', clase: 'Amphibia', orden_taxon: 'Anura', familia: 'Hylidae', especie_clave: 'K1', buscar: 'bo',
      conservacion: 'amenazada', amenaza: 'EN', entidad_clave: UUID, dataset_key: UUID, anio_desde: 2010, anio_hasta: 2020,
      tipo_evidencia: 'HUMAN_OBSERVATION', con_foto: 'true', con_ubicacion: 'true',
    })
    expect(p).not.toHaveProperty('orden')
  })
  test('municipios no envía el territorio (el mapa debe mostrar todos los municipios); municipio gana sobre departamento', () => {
    expect(paramsApi('municipios', todo, 'individual')).not.toHaveProperty('departamento')
    const p = paramsApi('resumen', f({ municipio: '05837', departamento: 'Antioquia' }), 'individual')
    expect(p).toEqual({ codigo_municipal: '05837' })
  })
  test('agregado: sin año/evidencia/foto/ubicación; series solo con territorio; fuente solo sola y solo en municipios/resumen', () => {
    const tax = f({ departamento: 'Chocó', familia: 'Tyrannidae', conservacion: 'invasora', anioDesde: 2010, conFoto: true })
    expect(paramsApi('especies', tax, 'agregado')).toEqual({ departamento: 'Chocó', familia: 'Tyrannidae', conservacion: 'invasora' })
    expect(paramsApi('series', tax, 'agregado')).toEqual({ departamento: 'Chocó' })
    const fuente = f({ entidad: UUID, conjunto: UUID })
    expect(paramsApi('municipios', fuente, 'agregado')).toEqual({ entidad_clave: UUID, dataset_key: UUID })
    expect(paramsApi('resumen', fuente, 'agregado')).toEqual({ entidad_clave: UUID, dataset_key: UUID })
    expect(paramsApi('especies', fuente, 'agregado')).toEqual({})
    expect(paramsApi('series', fuente, 'agregado')).toEqual({})
  })
  test('los valores son datos, no se concatenan: un valor con símbolos queda íntegro en un par clave/valor', () => {
    expect(paramsApi('especies', f({ buscar: 'a&b=1' }), 'individual').buscar).toBe('a&b=1')
  })
  test('sugerencias: quitan especie y texto previos y piden pocas filas', () => {
    expect(paramsSugerencias(f({ especie: 'K1', buscar: 'x', familia: 'Hylidae' }), 'individual', 'bo'))
      .toEqual({ familia: 'Hylidae', buscar: 'bo', tamano: 6, orden: 'registros' })
  })
})

describe('chips y resumen', () => {
  test('un chip por filtro, en orden de lectura, con la acción que lo quita', () => {
    const chips = chipsActivos(f({ municipio: '05837', departamento: 'Antioquia', clase: 'Amphibia', familia: 'Hylidae', conservacion: 'amenazada', amenaza: 'CR', anioDesde: 2010, conFoto: true }), 'Turbo')
    expect(chips.map((c) => c.etiqueta)).toEqual([
      'Municipio: Turbo', 'Clase: Amphibia', 'Familia: Hylidae', 'Amenazadas: CR · En peligro crítico', 'Años: desde 2010', 'Solo con foto',
    ])
    expect(chips[1].quitar).toMatchObject({ clase: null, orden_taxon: null, familia: null, genero: null, especie: null })
    expect(chips[0].quitarEtiqueta).toBe('Quitar el filtro Municipio: Turbo')
  })
  test('texto resumen con «de N» solo cuando hay filtros que reducen', () => {
    expect(textoResumen(f({ clase: 'Amphibia', familia: 'Hylidae' }), 'Anfibios', 'Chocó', 1234, 28856, fmtNum))
      .toBe('Mostrando 1.234 de 28.856 registros · Anfibios · Hylidae · Chocó')
    expect(textoResumen(f(), 'Anfibios', null, 28856, 28856, fmtNum)).toBe('Mostrando 28.856 registros · Anfibios · Chocó')
    expect(textoResumen(f(), 'Aves', null, null, null, fmtNum)).toMatch(/^Calculando/)
  })
})

describe('ubicación y puntos: nunca se dibuja lo reservado', () => {
  const r = (c: object) => ({ coordenadas_ocultas: false, latitud: 5.5, longitud: -76.6, ...c })
  test('ubicacionPublica', () => {
    expect(ubicacionPublica(r({}))).toEqual({ lat: 5.5, lon: -76.6 })
    expect(ubicacionPublica(r({ coordenadas_ocultas: true }))).toBeNull()
    expect(ubicacionPublica(r({ coordenadas_ocultas: undefined }))).toBeNull()
    expect(ubicacionPublica(r({ latitud: null }))).toBeNull()
    expect(ubicacionPublica(r({ latitud: 95 }))).toBeNull()
    expect(ubicacionPublica(r({ longitud: Number.NaN }))).toBeNull()
  })
  test('puntosDibujables descarta fuera de rango, ids raros y cualquier marca de oculto', () => {
    const base = { e: 'x', ek: 'K', a: null }
    const lista = puntosDibujables([
      { id: '1', lat: 5.5, lon: -76.6, ...base },
      { id: '2', lat: 5.5, lon: -76.6, ...base, coordenadas_ocultas: true } as never,
      { id: 'x<1', lat: 5.5, lon: -76.6, ...base },
      { id: '3', lat: 0, lon: 0, ...base },
      { id: '4', lat: Number.NaN, lon: -76, ...base },
    ])
    expect(lista.map((p) => p.id)).toEqual(['1'])
  })
  test('el recuadro se redondea hacia afuera para reutilizar consultas', () => {
    const b = redondearBbox(-77.13, 5.02, -76.01, 6.3)
    expect(b).toEqual([-77.25, 5, -76, 6.5])
    expect(bboxATexto(b)).toBe('-77.25,5,-76,6.5')
    expect(redondearBbox(-77.2, 5.1, -76.1, 6.2)).toEqual(redondearBbox(-77.24, 5.01, -76.01, 6.24))
  })
  test('mensajes de ocultos y de muestra', () => {
    expect(mensajeOcultos(0)).toBeNull()
    expect(mensajeOcultos(5079)).toBe('5.079 registros de especies amenazadas o sin determinar no muestran su ubicación para protegerlas.')
    expect(mensajeOcultos(1)).toMatch(/^1 registro .* no muestra su ubicación/)
    expect(mensajeMuestra(1500, 4194)).toMatch(/muestra de 1\.500 de 4\.194/)
  })
})

describe('orden', () => {
  test('valores válidos por sección y respaldo al inicial', () => {
    expect(ordenEspecies('municipios')).toBe('municipios')
    expect(ordenEspecies('anio_asc')).toBe('registros')
    expect(ordenEspecies(null)).toBe('registros')
    expect(ordenRegistros('especie')).toBe('especie')
    expect(ordenRegistros('nombre')).toBe('anio_desc')
  })
})
