import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('@/lib/api', () => ({ default: { get: vi.fn() } }))

import api from '@/lib/api'
import {
  construirInforme, ESPECIES_MAXIMAS_POR_INFORME, reunirInforme,
  type ContextoConsulta, type EntradaInforme, type RegistroExportado, type RespuestaExportacion,
} from '@/components/herramientas/biodiversidad/informe/informe'
import type { EspecieResumen, GrupoEstado, MunicipioConteo, RespuestaResumen } from '@/components/herramientas/biodiversidad/types'

const resumen = (extra: Partial<RespuestaResumen> = {}): RespuestaResumen => ({
  grupo: 'aves', metodo: 'individual', alcance: { codigo_municipal: null, departamento: null }, registros: 2919072, especies: 1480,
  con_foto: 812400, amenazadas: { CR: 8, EN: 31, VU: 57, total: 96 }, endemicas_colombia: 120, endemicas_choco: 54, introducidas: 3, invasoras: 1,
  anio_min: 2000, anio_max: 2025, entidades: 40, conjuntos: 75, con_ubicacion: 2000000, ...extra,
})

const especie = (n: number, extra: Partial<EspecieResumen> = {}): EspecieResumen => ({
  especie: `Especie ${n}`, especie_clave: `k${n}`, reino: 'Animalia', clase: 'Aves', orden: 'Passeriformes', familia: 'Tyrannidae', genero: 'Genero',
  registros: 1000 - n, municipios: n, amenaza: null, endemica_colombia: false, endemica_choco: false, introducida: false, invasora: false, ...extra,
})

const municipio = (n: number, registros: number, especies: number | null = 10): MunicipioConteo => ({
  codigo_municipal: `27${n}`, municipio: `Municipio ${n}`, departamento: 'Chocó', registros, sin_especie: 0, especies,
})

const info: GrupoEstado = { grupo: 'aves', metodo: 'individual', desde: 2000, hasta: 2025, registros: 2919072, fecha_fuente: '2026-10-20T00:00:00Z', doi: '10.15468/dl.abc' }

const entrada = (extra: Partial<EntradaInforme> = {}): EntradaInforme => ({
  grupo: 'aves', metodo: 'individual', info, aviso: undefined, filtros: ['Familia: Tyrannidae'], ranking: [municipio(1, 500), municipio(2, 0), municipio(3, 300, null)],
  resumen: resumen(), especies: [especie(1), especie(2, { amenaza: 'EN', endemica_choco: true, endemica_colombia: true })], totalEspecies: 2, maxFilas: 5000,
  generadoEn: new Date('2026-11-11T15:00:00Z'), ...extra,
})

const registroExportado = (n: number, extra: Partial<RegistroExportado> = {}): RegistroExportado => ({
  gbif_id: `g${n}`, especie: `Especie ${n}`, anio: 2020, fecha_evento: '2020-05-01', tipo_evidencia: 'HUMAN_OBSERVATION', licencia: 'CC_BY_4_0',
  latitud: '5.69', longitud: -76.65, incertidumbre_m: 30, coordenadas_ocultas: false, conjunto: 'Conjunto de prueba', doi_conjunto: '10.1234/ds1',
  municipio: 'Quibdó', departamento: 'Chocó', registrado_por: 'Ana', identificado_por: null,
  amenaza: null, endemica_colombia: false, endemica_choco: false, introducida: false, invasora: false, ...extra,
})
const exportacion = (registros: RegistroExportado[], extra: Partial<RespuestaExportacion> = {}): RespuestaExportacion => ({
  grupo: 'aves', desde: 2000, hasta: 2025, limite: 5000, truncado: false, registros, ...extra,
})

const cifra = (d: ReturnType<typeof construirInforme>, etiqueta: string) => d.secciones[0].cifras!.find((c) => c.etiqueta === etiqueta)

describe('construirInforme', () => {
  test('título, filtros, nombre de archivo y secciones', () => {
    const d = construirInforme(entrada())
    expect(d.titulo).toBe('Observatorio de Biodiversidad - Aves')
    expect(d.subtitulo).toBe('Registros de ocurrencia por municipio')
    expect(d.filtros).toEqual(['Grupo: Aves', 'Familia: Tyrannidae'])
    expect(d.nombreArchivo).toBe('informe-biodiversidad-aves-2026-11-11')
    expect(d.secciones.map((s) => s.titulo)).toEqual(['Cifras clave', 'Territorio', 'Especies'])
  })

  test('las cifras salen formateadas y las que no se calculan lo dicen', () => {
    const d = construirInforme(entrada())
    expect(cifra(d, 'Registros')?.valor).toBe('2.919.072')
    expect(cifra(d, 'Especies amenazadas')).toEqual({ etiqueta: 'Especies amenazadas', valor: '96', nota: 'CR 8 · EN 31 · VU 57' })
    expect(cifra(d, 'Periodo de los registros')?.valor).toBe('2000-2025')

    const sin = construirInforme(entrada({ resumen: resumen({ especies: null, amenazadas: { CR: null, EN: null, VU: null, total: null }, con_foto: null, invasoras: null, anio_min: null, anio_max: null }) }))
    expect(cifra(sin, 'Especies')).toMatchObject({ valor: '—', nota: 'No se calcula con este filtro' })
    expect(cifra(sin, 'Especies amenazadas')).toMatchObject({ valor: '—', nota: 'No se calcula con este filtro' })
    expect(cifra(sin, 'Registros con foto')).toBeUndefined()
    expect(cifra(sin, 'Invasoras')).toBeUndefined()
    expect(cifra(sin, 'Periodo de los registros')?.valor).toBe('2000-2025')
  })

  test('la tabla de municipios deja fuera los que no tienen registros y respeta el tope', () => {
    const ranking = [municipio(1, 500), municipio(2, 0), municipio(3, 300, null), municipio(4, 100)]
    const t = construirInforme(entrada({ ranking, maxFilas: 100 })).secciones[1].tablas![0]
    expect(t.columnas).toEqual(['Municipio', 'Departamento', 'Registros', 'Especies'])
    expect(t.filas).toEqual([['Municipio 1', 'Chocó', 500, 10], ['Municipio 3', 'Chocó', 300, null], ['Municipio 4', 'Chocó', 100, 10]])
    expect(t.nota).toBeUndefined()
    const corta = construirInforme(entrada({ ranking, maxFilas: 2 })).secciones[1].tablas![0]
    expect(corta.filas).toHaveLength(2)
    expect(corta.nota).toBe('Se muestran los 2 municipios con más registros de 3.')
  })

  test('la tabla de especies resume la conservación y es la principal', () => {
    const t = construirInforme(entrada()).secciones[2].tablas![0]
    expect(t.principal).toBe(true)
    expect(t.filas[0]).toEqual(['Especie 1', 'Tyrannidae', 'Passeriformes', 999, 1, null])
    expect(t.filas[1][5]).toBe('Amenazada (EN), Endémica del Chocó')
    const todas = construirInforme(entrada({ especies: [especie(1, { endemica_colombia: true, introducida: true, invasora: true })] })).secciones[2].tablas![0]
    expect(todas.filas[0][5]).toBe('Endémica de Colombia, Introducida, Invasora')
    expect(construirInforme(entrada({ totalEspecies: 1480 })).secciones[2].tablas![0].nota).toBe('Se incluyen las 2 especies con más registros de 1.480.')
  })

  test('la fuente cita GBIF, el corte, el DOI, la licencia y el aviso del servicio', () => {
    const f = construirInforme(entrada({ aviso: 'Aviso del servicio.' })).fuente
    expect(f[0]).toContain('GBIF')
    expect(f).toContain('Corte de datos: 20 de octubre de 2026.')
    expect(f).toContain('Periodo del corte: 2000-2025. Registros del corte: 2.919.072.')
    expect(f).toContain('DOI del corte: https://doi.org/10.15468/dl.abc')
    expect(f).toContain('Consulta realizada el 11 de noviembre de 2026.')
    expect(f.some((l) => /conserva su licencia original/.test(l))).toBe(true)
    expect(f.some((l) => /no dónde hay más vida/.test(l))).toBe(true)
    expect(f[f.length - 1]).toBe('Aviso del servicio.')
  })

  test('un DOI que ya es un enlace se respeta, y sin corte no inventa nada', () => {
    expect(construirInforme(entrada({ info: { ...info, doi: 'https://doi.org/10.1/x' } })).fuente).toContain('DOI del corte: https://doi.org/10.1/x')
    const sin = construirInforme(entrada({ info: undefined })).fuente.join('\n')
    expect(sin).not.toMatch(/Corte de datos|DOI del corte|Periodo del corte/)
  })

  test('el inventario agregado lo aclara en el subtítulo y en la fuente', () => {
    const d = construirInforme(entrada({ grupo: 'plantas', metodo: 'agregado' }))
    expect(d.subtitulo).toBe('Inventario agregado por municipio')
    expect(d.fuente.some((l) => /Inventario agregado/.test(l))).toBe(true)
    expect(d.titulo).toBe('Observatorio de Biodiversidad - Plantas')
  })
})

describe('construirInforme con registros individuales', () => {
  const sec = (d: ReturnType<typeof construirInforme>, titulo: string) => d.secciones.find((s) => s.titulo === titulo)

  test('suma la hoja de registros, que pasa a ser la tabla principal (la del CSV)', () => {
    const d = construirInforme(entrada({ registros: exportacion([registroExportado(1)]) }))
    expect(d.secciones.map((s) => s.titulo)).toEqual(['Cifras clave', 'Territorio', 'Especies', 'Registros individuales'])
    const t = sec(d, 'Registros individuales')!.tablas![0]
    expect(t.titulo).toBe('Registros')
    expect(t.principal).toBe(true)
    expect(sec(d, 'Especies')!.tablas![0].principal).toBe(false)
    expect(t.columnas).toHaveLength(17)
    expect(t.columnas.slice(0, 3)).toEqual(['ID GBIF', 'Especie', 'Año'])
  })

  test('los registros mantienen su orden, los números salen como números y no llevan formato de miles', () => {
    const t = sec(construirInforme(entrada({ registros: exportacion([registroExportado(1), registroExportado(2, { latitud: null, longitud: null, incertidumbre_m: '' })]) })), 'Registros individuales')!.tablas![0]
    expect(t.numericas).toBeUndefined()
    expect(t.filas[0]).toEqual(['g1', 'Especie 1', 2020, '2020-05-01', 'HUMAN_OBSERVATION', 'CC_BY_4_0', 'Quibdó', 'Chocó', 5.69, -76.65, 30, 'Visible',
      'Conjunto de prueba', '10.1234/ds1', 'Ana', null, null])
    expect(t.filas[1].slice(8, 12)).toEqual([null, null, null, 'Sin coordenadas'])
  })

  test('las ubicaciones ocultas lo dicen y la conservación se resume', () => {
    const t = sec(construirInforme(entrada({
      registros: exportacion([registroExportado(1, { coordenadas_ocultas: true, latitud: null, longitud: null, amenaza: 'CR', endemica_choco: true })]),
    })), 'Registros individuales')!.tablas![0]
    expect(t.filas[0][11]).toBe('Generalizada u oculta')
    expect(t.filas[0][16]).toBe('Amenazada (CR), Endémica del Chocó')
  })

  test('si el servidor recortó, la nota dice cuántos entraron de cuántos hay; si no, no hay nota', () => {
    const recortada = sec(construirInforme(entrada({ registros: exportacion([registroExportado(1), registroExportado(2)], { truncado: true, limite: 2 }) })), 'Registros individuales')!.tablas![0]
    expect(recortada.nota).toBe('Se incluyen los 2 registros más recientes de 2.919.072 que cumplen los filtros (tope de la descarga: 2).')
    expect(sec(construirInforme(entrada({ registros: exportacion([registroExportado(1)]) })), 'Registros individuales')!.tablas![0].nota).toBeUndefined()
  })

  test('la fuente aclara las ubicaciones generalizadas solo cuando hay registros', () => {
    const con = construirInforme(entrada({ registros: exportacion([registroExportado(1)]) })).fuente
    expect(con.some((l) => /generalizadas u ocultas/.test(l))).toBe(true)
    expect(construirInforme(entrada()).fuente.some((l) => /generalizadas u ocultas/.test(l))).toBe(false)
  })

  test('sin registros el informe es el de siempre: la tabla de especies sigue siendo la principal', () => {
    const d = construirInforme(entrada())
    expect(d.secciones.map((s) => s.titulo)).toEqual(['Cifras clave', 'Territorio', 'Especies'])
    expect(d.secciones[2].tablas![0].principal).toBe(true)
  })
})

describe('reunirInforme', () => {
  const contexto = (extra: Partial<ContextoConsulta> = {}): ContextoConsulta => ({
    grupo: 'aves', metodo: 'individual', info, aviso: undefined, filtros: [], ranking: [municipio(1, 5)],
    paramsResumen: { familia: 'Tyrannidae' }, paramsEspecies: { familia: 'Tyrannidae', orden: 'nombre', pagina: 9, tamano: 5 },
    paramsRegistros: { familia: 'Tyrannidae', orden: 'especie', pagina: 3, tamano: 25 }, ...extra,
  })
  const pagina = (desde: number, cuantas: number, total: number) => ({ total, especies: Array.from({ length: cuantas }, (_, i) => especie(desde + i)) })
  const senal = new AbortController().signal
  const pedidasDeEspecies = () => vi.mocked(api.get).mock.calls.filter(([u]) => String(u).endsWith('/especies'))
  const paginaPedida = (opciones?: { params?: unknown }) => Number((opciones?.params as { pagina?: number } | undefined)?.pagina)

  beforeEach(() => vi.clearAllMocks())

  test('pide el resumen y las especies de 100 en 100, ordenadas por registros, y recorta al tope', async () => {
    vi.mocked(api.get).mockImplementation(async (url: string, opciones?: { params?: unknown }) => {
      if (url.endsWith('/resumen')) return resumen()
      return pagina((paginaPedida(opciones) - 1) * 100 + 1, 100, 1480)
    })
    const d = await reunirInforme(contexto(), 150, senal)
    const llamadas = vi.mocked(api.get).mock.calls
    expect(llamadas[0][0]).toBe('/biodiversidad/resumen')
    expect(llamadas[0][1]).toMatchObject({ params: { grupo: 'aves', familia: 'Tyrannidae' }, signal: senal })
    expect(pedidasDeEspecies()).toHaveLength(2)
    expect(pedidasDeEspecies()[0][1]).toMatchObject({ params: { grupo: 'aves', familia: 'Tyrannidae', orden: 'registros', pagina: 1, tamano: 100 } })
    expect(pedidasDeEspecies()[1][1]).toMatchObject({ params: { pagina: 2, tamano: 100 } })
    expect(d.secciones[2].tablas![0].filas).toHaveLength(150)
    expect(d.secciones[2].tablas![0].nota).toBe('Se incluyen las 150 especies con más registros de 1.480.')
  })

  test('nunca pasa del máximo de especies por informe aunque el tope configurado sea mayor', async () => {
    vi.mocked(api.get).mockImplementation(async (url: string, opciones?: { params?: unknown }) =>
      (url.endsWith('/resumen') ? resumen() : pagina((paginaPedida(opciones) - 1) * 100 + 1, 100, 5000)))
    const d = await reunirInforme(contexto(), 50000, senal)
    expect(pedidasDeEspecies()).toHaveLength(ESPECIES_MAXIMAS_POR_INFORME / 100)
    expect(d.secciones[2].tablas![0].filas).toHaveLength(ESPECIES_MAXIMAS_POR_INFORME)
  })

  test('se detiene cuando ya no hay más especies', async () => {
    vi.mocked(api.get).mockImplementation(async (url: string) => (url.endsWith('/resumen') ? resumen() : pagina(1, 37, 37)))
    const d = await reunirInforme(contexto(), 5000, senal)
    expect(pedidasDeEspecies()).toHaveLength(1)
    expect(d.secciones[2].tablas![0].filas).toHaveLength(37)
    expect(d.secciones[2].tablas![0].nota).toBeUndefined()
  })

  describe('según el formato', () => {
    const responder = (extra: { registros?: unknown } = {}) => vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url.endsWith('/resumen')) return resumen()
      if (url.endsWith('/especies')) return pagina(1, 10, 10)
      return extra.registros ?? exportacion([registroExportado(1)])
    })
    const pedidasDeRegistros = () => vi.mocked(api.get).mock.calls.filter(([u]) => String(u).endsWith('/informes/biodiversidad/registros'))

    for (const formato of ['xlsx', 'csv'] as const) {
      test(`en ${formato} pide los registros en una sola petición, sin los parámetros de listado, y los suma al informe`, async () => {
        responder()
        const d = await reunirInforme(contexto(), 5000, senal, formato)
        expect(pedidasDeRegistros()).toHaveLength(1)
        expect(pedidasDeRegistros()[0][1]).toMatchObject({ params: { grupo: 'aves', familia: 'Tyrannidae' }, signal: senal, timeout: 60_000 })
        const params = (pedidasDeRegistros()[0][1] as { params: Record<string, unknown> }).params
        expect(Object.keys(params).sort()).toEqual(['familia', 'grupo'])
        expect(d.secciones.map((s) => s.titulo)).toContain('Registros individuales')
      })
    }

    test('el PDF es un resumen: no pide registros', async () => {
      responder()
      const d = await reunirInforme(contexto(), 5000, senal, 'pdf')
      expect(pedidasDeRegistros()).toHaveLength(0)
      expect(d.secciones.map((s) => s.titulo)).not.toContain('Registros individuales')
      const sinFormato = await reunirInforme(contexto(), 5000, senal)
      expect(sinFormato.secciones).toHaveLength(3)
      expect(pedidasDeRegistros()).toHaveLength(0)
    })

    test('un grupo con inventario agregado no tiene registros que pedir', async () => {
      responder()
      await reunirInforme(contexto({ grupo: 'plantas', metodo: 'agregado' }), 5000, senal, 'xlsx')
      expect(pedidasDeRegistros()).toHaveLength(0)
    })

    test('si el servidor niega la descarga (sin sesión o sin permiso), el error llega a quien llama', async () => {
      vi.mocked(api.get).mockImplementation(async (url: string) => {
        if (url.endsWith('/resumen')) return resumen()
        if (url.endsWith('/especies')) return pagina(1, 10, 10)
        throw new Error('Inicia sesión para descargar informes.')
      })
      await expect(reunirInforme(contexto(), 5000, senal, 'xlsx')).rejects.toThrow('Inicia sesión para descargar informes.')
    })
  })

  test('un fallo de la API llega a quien llama, sin dejar promesas sueltas', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('sin conexión'))
    await expect(reunirInforme(contexto(), 100, senal)).rejects.toThrow('sin conexión')
  })
})
