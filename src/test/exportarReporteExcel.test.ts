import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ReporteData } from '@/hooks/useReportes'
import { exportarReporteExcel } from '@/lib/exportarReporteExcel'

function makeReporte(overrides: Partial<ReporteData> = {}): ReporteData {
  return {
    periodo: 'semana', desde: '2026-08-25', hasta: '2026-09-01',
    usuarios: { nuevos: 7, creadosPorAdmin: 1 },
    solicitudes: { nuevas: 5, resueltas: 2, pendientes: 3 },
    documentos: { creados: 4, publicados: 2 },
    mapas: { creados: 1, publicados: 1 },
    logins: { exitosos: 20, fallidos: 2 },
    actividadPorModulo: [{ modulo: 'auth', total: 3 }, { modulo: 'solicitudes', total: 15 }],
    ...overrides,
  }
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    blob: () => Promise.resolve(new Blob(['fake-png-bytes'], { type: 'image/png' })),
  }))
  vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn().mockReturnValue('blob:mock-url'), revokeObjectURL: vi.fn() })
})

afterEach(() => { vi.unstubAllGlobals() })

describe('exportarReporteExcel', () => {
  test('genera el libro y dispara la descarga sin lanzar errores', async () => {
    await expect(exportarReporteExcel(makeReporte())).resolves.toBeUndefined()
    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  test('funciona aunque el logo institucional no se pueda cargar', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    await expect(exportarReporteExcel(makeReporte())).resolves.toBeUndefined()
    expect(URL.createObjectURL).toHaveBeenCalled()
  })

  test('funciona sin actividad por módulo (sin filas para la barra de datos)', async () => {
    await expect(exportarReporteExcel(makeReporte({ actividadPorModulo: [] }))).resolves.toBeUndefined()
    expect(URL.createObjectURL).toHaveBeenCalled()
  })
})
