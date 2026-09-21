/**
 * Smoke test del registro estático real (sin mockear nada) -- confirma que
 * cada entrada tiene un componente real importable y que las herramientas
 * "focusable" traen ícono y color (los requiere HerramientaLauncherCard).
 */
import { describe, test, expect } from 'vitest'
import { REGISTRO_HERRAMIENTAS } from '@/lib/herramientasRegistro'

describe('REGISTRO_HERRAMIENTAS', () => {
  test('incluye conversor y panel-choco con un componente real', () => {
    expect(REGISTRO_HERRAMIENTAS.conversor).toBeDefined()
    expect(typeof REGISTRO_HERRAMIENTAS.conversor.Component).toBe('function')
    expect(REGISTRO_HERRAMIENTAS['panel-choco']).toBeDefined()
    expect(typeof REGISTRO_HERRAMIENTAS['panel-choco'].Component).toBe('function')
  })

  test('panel-choco es focusable y trae icon/color para su tarjeta lanzadora', () => {
    const entrada = REGISTRO_HERRAMIENTAS['panel-choco']
    expect(entrada.focusable).toBe(true)
    expect(entrada.icon).toBeDefined()
    expect(entrada.color).toBe('gold')
  })

  test('conversor no es focusable (renderiza su propio ToolCard internamente)', () => {
    expect(REGISTRO_HERRAMIENTAS.conversor.focusable).toBeUndefined()
  })
})
