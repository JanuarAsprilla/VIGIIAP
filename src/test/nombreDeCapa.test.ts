import { describe, test, expect } from 'vitest'
import { nombreLegibleDeCapa } from '@/lib/nombreDeCapa'

describe('nombreLegibleDeCapa', () => {
  test('usa el nombre que ya viene legible', () => {
    expect(nombreLegibleDeCapa({ capaId: 't_19_clima:estaciones', nombre: 'Estaciones climáticas' })).toBe('Estaciones climáticas')
  })

  test('si el nombre es el propio id, deja solo la capa y cambia los guiones bajos por espacios', () => {
    expect(nombreLegibleDeCapa({ capaId: 't_19_clima:Estaciones_clima_IDEAM_2017', nombre: 't_19_clima:Estaciones_clima_IDEAM_2017' }))
      .toBe('Estaciones clima IDEAM 2017')
  })

  test('si el nombre viene vacío, también se deduce del id', () => {
    expect(nombreLegibleDeCapa({ capaId: 'bio:trampas_camara', nombre: '' })).toBe('trampas camara')
  })

  test('un id sin workspace se conserva tal cual', () => {
    expect(nombreLegibleDeCapa({ capaId: 'capa_suelta', nombre: 'capa_suelta' })).toBe('capa suelta')
  })
})
