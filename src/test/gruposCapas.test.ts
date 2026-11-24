import { describe, test, expect } from 'vitest'
import { prepararGrupos, estadoDeGrupo } from '@/lib/geovisores/grupos'
import type { GrupoCapas, TemaCapas } from '@/types'

const temas: TemaCapas[] = [
  { id: 'geo', nombre: 'Geología', capas: [
    { id: 'geo:a', nombre: 'A', tipo: 'vectorial', tema: 'geo' },
    { id: 'geo:b', nombre: 'B', tipo: 'vectorial', tema: 'geo' },
    { id: 'geo:c', nombre: 'C', tipo: 'raster', tema: 'geo' },
  ] },
  { id: 'bio', nombre: 'Biodiversidad', capas: [{ id: 'bio:x', nombre: 'X', tipo: 'vectorial', tema: 'bio' }] },
]

const grupo = (o: Partial<GrupoCapas>): GrupoCapas => ({ id: 'geo:g', nombre: 'g', tema: 'geo', capas: ['geo:a', 'geo:b'], ...o })

describe('prepararGrupos', () => {
  test('sin grupos no devuelve nada', () => {
    expect(prepararGrupos(temas, undefined)).toEqual({ porTema: {}, sinTema: [], agrupadasPorTema: {} })
  })

  test('resuelve los miembros en el orden del grupo y ubica el grupo en su tema', () => {
    const r = prepararGrupos(temas, [grupo({ capas: ['geo:b', 'geo:a'] })])
    expect(r.porTema.geo).toHaveLength(1)
    expect(r.porTema.geo[0].miembros.map((m) => m.capa.id)).toEqual(['geo:b', 'geo:a'])
    expect(r.porTema.geo[0].miembros[0].tema).toBe('geo')
    expect(r.agrupadasPorTema.geo.has('geo:a')).toBe(true)
    expect(r.agrupadasPorTema.geo.has('geo:c')).toBe(false)
  })

  test('ignora ids que no están en el catálogo y descarta grupos sin miembros visibles', () => {
    const r = prepararGrupos(temas, [
      grupo({ id: 'g1', capas: ['geo:a', 'no:existe'] }),
      grupo({ id: 'g2', capas: ['no:existe'] }),
    ])
    expect(r.porTema.geo.map((g) => g.grupo.id)).toEqual(['g1'])
    expect(r.porTema.geo[0].miembros).toHaveLength(1)
  })

  test('un grupo cuyo tema no está en el catálogo queda en sinTema', () => {
    const r = prepararGrupos(temas, [grupo({ tema: 'otro', capas: ['bio:x'] })])
    expect(r.sinTema).toHaveLength(1)
    expect(r.porTema.otro).toBeUndefined()
  })
})

describe('estadoDeGrupo', () => {
  const miembros = prepararGrupos(temas, [grupo({})]).porTema.geo[0].miembros

  test('ninguna', () => expect(estadoDeGrupo(miembros, new Set())).toBe('ninguna'))
  test('algunas', () => expect(estadoDeGrupo(miembros, new Set(['geo:a']))).toBe('algunas'))
  test('todas', () => expect(estadoDeGrupo(miembros, new Set(['geo:a', 'geo:b', 'otra']))).toBe('todas'))
})
