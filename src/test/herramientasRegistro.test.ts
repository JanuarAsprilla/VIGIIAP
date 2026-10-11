/**
 * Smoke test del registro estático real (sin mockear nada) -- confirma que
 * cada entrada tiene un componente real importable y trae ícono y color
 * (los requiere HerramientaLauncherCard).
 */
import { describe, test, expect } from 'vitest'
import { REGISTRO_HERRAMIENTAS } from '@/lib/herramientasRegistro'

describe('REGISTRO_HERRAMIENTAS', () => {
  test('incluye panel-choco y validador-coordenadas con un componente real', () => {
    for (const clave of ['panel-choco', 'validador-coordenadas']) {
      expect(REGISTRO_HERRAMIENTAS[clave], clave).toBeDefined()
      expect(['function', 'object']).toContain(typeof REGISTRO_HERRAMIENTAS[clave].Component)
    }
  })

  test('el conversor de coordenadas ya no está: lo reemplaza el validador', () => {
    expect(REGISTRO_HERRAMIENTAS.conversor).toBeUndefined()
  })

  test('toda herramienta trae icon y color para su tarjeta', () => {
    for (const [clave, entrada] of Object.entries(REGISTRO_HERRAMIENTAS)) {
      expect(entrada.icon, clave).toBeDefined()
      expect(['primary', 'orange', 'gold', 'green'], clave).toContain(entrada.color)
    }
  })

  test('panel-choco usa el color dorado', () => {
    expect(REGISTRO_HERRAMIENTAS['panel-choco'].color).toBe('gold')
  })
})
