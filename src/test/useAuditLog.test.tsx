import { describe, test, expect } from 'vitest'
import { MODULO_STYLES } from '@/hooks/useAuditLog'

const MODULOS_ESPERADOS = ['auth', 'usuarios', 'admin', 'solicitudes', 'mapas', 'documentos']

describe('MODULO_STYLES', () => {
  test('define un estilo para cada módulo real del sistema', () => {
    for (const modulo of MODULOS_ESPERADOS) {
      expect(MODULO_STYLES).toHaveProperty(modulo)
    }
  })

  test('ningún módulo comparte clase con otro — cada uno debe ser distinguible por color', () => {
    // Regresión: admin y mapas llegaron a compartir literalmente el mismo valor
    // ('bg-primary-700/10 text-primary-700'), haciéndolos indistinguibles por color
    // en Actividad Reciente (Dashboard) y en el Registro de Actividad.
    const valores = Object.values(MODULO_STYLES)
    const unicos = new Set(valores)
    expect(unicos.size).toBe(valores.length)
  })
})
