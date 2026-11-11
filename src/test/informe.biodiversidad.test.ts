import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('@/lib/api', () => ({ default: { get: vi.fn() } }))

import api from '@/lib/api'
import {
  construirInforme, ESPECIES_MAXIMAS_POR_INFORME, reunirInforme, type ContextoConsulta, type EntradaInforme,
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

describe('reunirInforme', () => {
  const contexto = (extra: Partial<ContextoConsulta> = {}): ContextoConsulta => ({
    grupo: 'aves', metodo: 'individual', info, aviso: undefined, filtros: [], ranking: [municipio(1, 5)],
    paramsResumen: { familia: 'Tyrannidae' }, paramsEspecies: { familia: 'Tyrannidae', orden: 'nombre', pagina: 9, tamano: 5 }, ...extra,
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

  test('un fallo de la API llega a quien llama, sin dejar promesas sueltas', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('sin conexión'))
    await expect(reunirInforme(contexto(), 100, senal)).rejects.toThrow('sin conexión')
  })
})
