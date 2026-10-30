import { describe, test, expect } from 'vitest'
import { fmtNum, fmtPct, fmtFecha } from '@/components/herramientas/biodiversidad/lib/format'
import { traducirEvidencia } from '@/components/herramientas/biodiversidad/lib/evidencia'
import { etiquetarLicencia } from '@/components/herramientas/biodiversidad/lib/licencia'
import { urlDoi, urlRegistroGbif } from '@/components/herramientas/biodiversidad/lib/enlaces'
import { calcularCortes, claseDe, tramosLeyenda } from '@/components/herramientas/biodiversidad/lib/escala'
import {
  calcularIndicadores, listarDepartamentos, ordenarMunicipios, resumenPorDepartamento, topMunicipios,
} from '@/components/herramientas/biodiversidad/lib/derivar'
import { describirError } from '@/components/herramientas/biodiversidad/lib/errores'
import { actualizarParametros, leerParametros } from '@/components/herramientas/biodiversidad/lib/parametros'
import type { MunicipioConteo } from '@/components/herramientas/biodiversidad/types'

const m = (c: string, municipio: string, departamento: string, registros: number, sin_especie = 0): MunicipioConteo => ({
  codigo_municipal: c, municipio, departamento, registros, sin_especie,
})
const MUNIS = [
  m('05837', 'Turbo', 'Antioquia', 1000, 100),
  m('05045', 'Apartadó', 'Antioquia', 200, 20),
  m('27001', 'Quibdó', 'Chocó', 500, 10),
  m('27002', 'Atrato', 'Chocó', 0, 0),
]

describe('formato es-CO', () => {
  test('agrupa miles con punto, también en 4 cifras', () => {
    expect(fmtNum(2919072)).toBe('2.919.072')
    expect(fmtNum(1234)).toBe('1.234')
  })
  test('porcentaje con coma decimal y 0 si no hay total', () => {
    expect(fmtPct(1, 8)).toContain('12,5')
    expect(fmtPct(3, 0)).toContain('0,0')
  })
  test('fecha legible o texto de respaldo', () => {
    expect(fmtFecha('2026-10-19T20:10:35.214Z')).toContain('2026')
    expect(fmtFecha(null)).toBe('Sin fecha')
    expect(fmtFecha('no-es-fecha')).toBe('Sin fecha')
  })
})

describe('tipo de evidencia', () => {
  test('traduce los tipos conocidos', () => {
    expect(traducirEvidencia('PRESERVED_SPECIMEN')).toBe('Espécimen preservado')
    expect(traducirEvidencia('human_observation')).toBe('Observación humana')
  })
  test('respaldo para nulo y desconocido sin mostrar texto crudo', () => {
    expect(traducirEvidencia(null)).toBe('Sin determinar')
    expect(traducirEvidencia('<img onerror=1>')).toBe('Otro tipo de evidencia')
  })
})

describe('licencia', () => {
  test.each([
    ['http://creativecommons.org/licenses/by-nc/4.0/legalcode', 'CC BY-NC'],
    ['https://creativecommons.org/licenses/by/4.0/', 'CC BY'],
    ['http://creativecommons.org/publicdomain/zero/1.0/legalcode', 'CC0'],
    ['http://creativecommons.org/licenses/by-sa/3.0/legalcode', 'CC BY-SA'],
  ])('reconoce %s', (url, etiqueta) => {
    const r = etiquetarLicencia(url)
    expect(r.etiqueta).toBe(etiqueta)
    expect(r.href).toMatch(/^https:\/\/creativecommons\.org\//)
  })
  test('URL desconocida o maliciosa no se enlaza', () => {
    for (const u of ['https://evil.example/licenses/by/4.0', 'javascript:alert(1)', 'http://creativecommons.org.evil.com/licenses/by/4.0', null, '']) {
      expect(etiquetarLicencia(u)).toEqual({ etiqueta: 'Licencia del conjunto', href: null })
    }
  })
  test('tipo CC fuera de la tabla cerrada no se reconoce', () => {
    expect(etiquetarLicencia('http://creativecommons.org/licenses/hack/4.0/').href).toBeNull()
  })
})

describe('enlaces externos', () => {
  test('GBIF solo con id numérico', () => {
    expect(urlRegistroGbif('1213678497')).toBe('https://www.gbif.org/occurrence/1213678497')
    for (const x of ['abc', '12/../3', '1 2', '', null, 'javascript:1']) expect(urlRegistroGbif(x)).toBeNull()
  })
  test('DOI válido se codifica por segmentos', () => {
    expect(urlDoi('10.15472/bz0iw2')).toBe('https://doi.org/10.15472/bz0iw2')
  })
  test('DOI inválido o con caracteres peligrosos se rechaza', () => {
    for (const x of ['11.1234/x', '10.1234/<script>', 'https://evil.com', '10.15472/a b', '', null, '10.15472/x"y']) {
      expect(urlDoi(x)).toBeNull()
    }
  })
})

describe('escala de color', () => {
  test('cortes por cuantiles sobre valores positivos', () => {
    const cortes = calcularCortes([0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(cortes.length).toBeGreaterThan(0)
    expect([...cortes].sort((a, b) => a - b)).toEqual(cortes)
  })
  test('sin datos positivos no hay cortes y todo es clase 0', () => {
    expect(calcularCortes([0, 0])).toEqual([])
    expect(claseDe(0, [])).toBe(0)
  })
  test('valores iguales no generan clases duplicadas', () => {
    expect(calcularCortes([5, 5, 5, 5])).toEqual([])
    expect(claseDe(5, [])).toBe(1)
  })
  test('claseDe asigna 0, intermedias y la última', () => {
    const cortes = [10, 100, 1000]
    expect(claseDe(0, cortes)).toBe(0)
    expect(claseDe(1, cortes)).toBe(1)
    expect(claseDe(10, cortes)).toBe(1)
    expect(claseDe(11, cortes)).toBe(2)
    expect(claseDe(5000, cortes)).toBe(4)
  })
  test('tramos de leyenda contiguos hasta el máximo', () => {
    expect(tramosLeyenda([10, 100], 1000)).toEqual([
      { clase: 1, desde: 1, hasta: 10 }, { clase: 2, desde: 11, hasta: 100 }, { clase: 3, desde: 101, hasta: 1000 },
    ])
    expect(tramosLeyenda([], 0)).toEqual([])
  })
})

describe('derivaciones', () => {
  test('indicadores', () => {
    expect(calcularIndicadores(MUNIS)).toEqual({
      registros: 1700, municipiosConRegistros: 3, totalMunicipios: 4, departamentos: 2, sinEspecie: 130,
    })
    expect(calcularIndicadores([]).registros).toBe(0)
  })
  test('top municipios ignora ceros y ordena', () => {
    expect(topMunicipios(MUNIS, 2).map((x) => x.municipio)).toEqual(['Turbo', 'Quibdó'])
    expect(topMunicipios(MUNIS, 10)).toHaveLength(3)
  })
  test('resumen por departamento', () => {
    const r = resumenPorDepartamento(MUNIS)
    expect(r[0]).toMatchObject({ departamento: 'Antioquia', registros: 1200, municipiosConRegistros: 2, totalMunicipios: 2 })
    expect(r[1]).toMatchObject({ departamento: 'Chocó', registros: 500, municipiosConRegistros: 1, totalMunicipios: 2 })
  })
  test('departamentos listados en orden', () => {
    expect(listarDepartamentos(MUNIS)).toEqual(['Antioquia', 'Chocó'])
  })
  test('ordena por columna sin mutar la entrada', () => {
    const copia = [...MUNIS]
    expect(ordenarMunicipios(MUNIS, 'registros', false)[0].municipio).toBe('Atrato')
    expect(ordenarMunicipios(MUNIS, 'municipio', false)[0].municipio).toBe('Apartadó')
    expect(ordenarMunicipios(MUNIS, 'departamento', true)[0].departamento).toBe('Chocó')
    expect(MUNIS).toEqual(copia)
  })
})

describe('errores por código', () => {
  test.each([[404, 'Sin datos'], [422, 'Consulta no válida'], [429, 'Demasiadas'], [503, 'tardó']])('%s', (status, texto) => {
    expect(describirError({ status }).titulo).toContain(texto)
  })
  test('red y otros', () => {
    expect(describirError(new Error('Network Error')).titulo).toContain('conexión')
    expect(describirError({ status: 500 }).titulo).toContain('No se pudo')
    expect(describirError(null).titulo).toContain('conexión')
  })
})

describe('parámetros de URL', () => {
  test('valores válidos', () => {
    const p = leerParametros(new URLSearchParams('grupo=anfibios&municipio=05837&departamento=Antioquia&pagina=3&anio_desde=2010&anio_hasta=2020&vista=registros'))
    expect(p).toEqual({ grupo: 'anfibios', municipio: '05837', departamento: 'Antioquia', pagina: 3, anioDesde: 2010, anioHasta: 2020, vista: 'registros' })
  })
  test('valores inválidos se descartan', () => {
    const p = leerParametros(new URLSearchParams('grupo=xx&municipio=abc&pagina=-1&anio_desde=foo&vista=otra'))
    expect(p).toMatchObject({ grupo: 'aves', municipio: null, pagina: 1, anioDesde: null, vista: null })
    expect(leerParametros(new URLSearchParams('pagina=99999')).pagina).toBe(1)
  })
  test('actualizar conserva claves ajenas y elimina vacías', () => {
    const r = actualizarParametros(new URLSearchParams('herramienta=biodiversidad&pagina=2'), { grupo: 'aves', pagina: null, municipio: '' })
    expect(r.get('herramienta')).toBe('biodiversidad')
    expect(r.get('grupo')).toBe('aves')
    expect(r.has('pagina')).toBe(false)
  })
})
