import { describe, test, expect } from 'vitest'
import { MODULOS_CATALOGO } from '@/lib/constants/modulos'
import { GRUPOS_MODULOS, iconoDeModulo } from '@/lib/constants/modulosAgrupados'

describe('GRUPOS_MODULOS', () => {
  // Regresión: GRUPOS_MODULOS se deriva de MODULOS_CATALOGO en vez de listar
  // las claves a mano -- si se agrega un módulo nuevo al catálogo sin
  // categorizarlo, antes desaparecía silenciosamente del modal de permisos
  // (sin switch para habilitarlo) mientras seguía contando para el total.
  test('incluye exactamente las mismas claves que MODULOS_CATALOGO, sin duplicados', () => {
    const clavesEsperadas = MODULOS_CATALOGO.map((m) => m.clave).sort()
    const clavesAgrupadas = GRUPOS_MODULOS.flatMap((g) => g.claves).sort()
    expect(clavesAgrupadas).toEqual(clavesEsperadas)
  })

  test('ningún grupo queda vacío', () => {
    for (const grupo of GRUPOS_MODULOS) {
      expect(grupo.claves.length).toBeGreaterThan(0)
    }
  })
})

describe('iconoDeModulo', () => {
  test('devuelve un ícono para cada módulo real del catálogo', () => {
    for (const { clave } of MODULOS_CATALOGO) {
      expect(iconoDeModulo(clave)).toBeDefined()
    }
  })

  test('devuelve un ícono de respaldo para una clave no mapeada, en vez de undefined', () => {
    // @ts-expect-error -- clave inexistente a propósito, para probar el respaldo
    expect(iconoDeModulo('modulo_futuro_sin_icono')).toBeDefined()
  })
})
