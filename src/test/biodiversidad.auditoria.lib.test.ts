import { describe, test, expect } from 'vitest'
import type { MunicipioConteo } from '@/components/herramientas/biodiversidad/types'
import { calcularIndicadores, ordenarMunicipios, resumenPorDepartamento } from '@/components/herramientas/biodiversidad/lib/derivar'
import { calcularCortes, etiquetaTramo, tramosLeyenda, valoresDeEscala } from '@/components/herramientas/biodiversidad/lib/escala'
import { rankingDepartamentos, rankingMunicipios } from '@/components/herramientas/biodiversidad/lib/ranking'
import { urlReferenciaValida } from '@/components/herramientas/biodiversidad/lib/foto'
import { urlDoi } from '@/components/herramientas/biodiversidad/lib/enlaces'
import { MENSAJE_RESERVADAS } from '@/components/herramientas/biodiversidad/lib/puntos'
import { arrastreMovil } from '@/components/herramientas/biodiversidad/lib/geometria'

const m = (c: string, depto: string, registros: number, sin: number | null, especies: number | null = 3): MunicipioConteo =>
  ({ codigo_municipal: c, municipio: `M${c}`, departamento: depto, registros, sin_especie: sin, especies })

describe('sin_especie nulo no cuenta como cero', () => {
  const datos = [m('1', 'A', 100, 10), m('2', 'A', 900, null)]
  test('calcularIndicadores excluye del denominador a los municipios sin dato', () => {
    const i = calcularIndicadores(datos)
    expect(i).toMatchObject({ registros: 1000, sinEspecie: 10, registrosConDato: 100 })
  })
  test('resumenPorDepartamento y rankingDepartamentos usan el mismo denominador', () => {
    const [a] = resumenPorDepartamento([m('1', 'A', 100, 10), m('2', 'A', 900, null), m('3', 'B', 100, 10)])
    expect(a.registrosConDato).toBe(100)
    const [fila] = rankingDepartamentos([{ ...a, registros: 1000, registrosConDato: 100 }], 'sin_especie', 5)
    expect(fila.texto).toBe('10,0 %')
  })
  test('un departamento sin ningún dato de sin_especie no entra al ranking porcentual', () => {
    const d = resumenPorDepartamento([m('1', 'A', 500, null)])
    expect(rankingDepartamentos(d, 'sin_especie', 5)).toEqual([])
  })
})

describe('escala de «% sin especie»', () => {
  const datos = [m('1', 'A', 1, 1), m('2', 'A', 29, 29), m('3', 'A', 30, 3), m('4', 'A', 100, 50), m('5', 'A', 100, null)]
  test('solo cuentan municipios con el mínimo de registros y con dato', () => {
    expect(valoresDeEscala(datos, 'sin_especie').sort((a, b) => a - b)).toEqual([10, 50])
  })
  test('registros y especies no se filtran por el mínimo', () => {
    expect(valoresDeEscala(datos, 'registros')).toHaveLength(5)
    expect(valoresDeEscala(datos, 'especies')).toHaveLength(5)
  })
  test('el ranking y la escala coinciden en quién entra', () => {
    expect(rankingMunicipios(datos, 'sin_especie', 10).map((f) => f.clave).sort()).toEqual(['3', '4'])
  })
})

describe('cortes y tramos con valores repetidos o porcentuales', () => {
  test('valores muy repetidos no producen cortes duplicados ni el máximo como corte', () => {
    const cortes = calcularCortes([1, 1, 1, 1, 1, 1, 2, 2, 2, 9])
    expect(new Set(cortes).size).toBe(cortes.length)
    expect(cortes.every((c) => c < 9)).toBe(true)
    expect([...cortes].sort((a, b) => a - b)).toEqual(cortes)
  })
  test('los tramos enteros no se solapan', () => {
    const t = tramosLeyenda(calcularCortes([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 10)
    for (let i = 1; i < t.length; i++) expect(t[i].desde).toBe(t[i - 1].hasta + 1)
  })
  test('en porcentajes los tramos superiores dicen «más de» para no repetir el valor del corte', () => {
    const t = tramosLeyenda([5, 20], 80, false)
    expect(etiquetaTramo(t[0], 'sin_especie')).toBe('0 – 5 %')
    expect(etiquetaTramo(t[1], 'sin_especie')).toBe('más de 5 hasta 20 %')
    expect(etiquetaTramo(t[2], 'sin_especie', true)).toBe('más de 20 %')
  })
})

describe('orden por «sin especie»', () => {
  test('ordena por porcentaje, no por conteo absoluto', () => {
    const d = [m('1', 'A', 1000, 100), m('2', 'A', 10, 5), m('3', 'A', 50, null)]
    expect(ordenarMunicipios(d, 'sin_especie', true).map((x) => x.codigo_municipal)).toEqual(['2', '1', '3'])
    expect(ordenarMunicipios(d, 'sin_especie', false).map((x) => x.codigo_municipal)).toEqual(['3', '1', '2'])
  })
})

describe('enlaces y fotos', () => {
  test.each(['https://192.168.0.1/foto', 'https://8.8.8.8/x', 'https://[::1]/x', 'https://[2001:db8::1]/a'])('rechaza hosts que son IP: %s', (u) => {
    expect(urlReferenciaValida(u)).toBeNull()
  })
  test('acepta un dominio normal', () => {
    expect(urlReferenciaValida('https://www.inaturalist.org/photos/1')).toBe('https://www.inaturalist.org/photos/1')
  })
  test('DOI con «..» se rechaza', () => {
    expect(urlDoi('10.1234/a/../b')).toBeNull()
    expect(urlDoi('10.1234/..')).toBeNull()
    expect(urlDoi('10.15468/dl.abc123')).toBe('https://doi.org/10.15468/dl.abc123')
  })
})

describe('privacidad del mensaje de reservadas', () => {
  test('el texto es fijo y no contiene cifras', () => {
    expect(MENSAJE_RESERVADAS).not.toMatch(/\d/)
    expect(MENSAJE_RESERVADAS).toMatch(/reservad/i)
  })
})

describe('arrastre con un dedo en móvil', () => {
  test('solo se permite cuando el zoom supera el de la vista completa', () => {
    expect(arrastreMovil(5, 5)).toBe(false)
    expect(arrastreMovil(5.2, 5)).toBe(false)
    expect(arrastreMovil(5.5, 5)).toBe(true)
    expect(arrastreMovil(8, Number.NaN)).toBe(false)
  })
})
