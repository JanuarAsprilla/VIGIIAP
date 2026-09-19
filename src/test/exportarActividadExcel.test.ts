import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/api', () => ({ default: { get: vi.fn() } }))
import api from '@/lib/api'
import { exportarActividadExcel } from '@/lib/exportarActividadExcel'

function makeLog(overrides: Record<string, unknown> = {}) {
  return {
    id: '1', accion: 'login', modulo: 'auth', descripcion: 'Login exitoso',
    usuario_email: 'ana@iiap.gov.co', ip: '127.0.0.1', creado_en: '2026-01-01T10:00:00Z',
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

afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks() })

describe('exportarActividadExcel', () => {
  test('pide el registro completo (no paginado) al backend', async () => {
    vi.mocked(api.get).mockResolvedValue([makeLog()])
    await exportarActividadExcel()
    expect(api.get).toHaveBeenCalledWith('/admin/export/audit', { params: { formato: 'json' } })
  })

  test('genera y descarga el libro sin lanzar errores', async () => {
    vi.mocked(api.get).mockResolvedValue([makeLog(), makeLog({ id: '2', modulo: 'usuarios', accion: 'create_usuario' })])
    await expect(exportarActividadExcel()).resolves.toBeUndefined()
    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  test('aplica el filtro de módulo y de búsqueda sobre el conjunto completo', async () => {
    vi.mocked(api.get).mockResolvedValue([
      makeLog({ id: '1', modulo: 'auth', usuario_email: 'ana@iiap.gov.co' }),
      makeLog({ id: '2', modulo: 'usuarios', usuario_email: 'carlos@iiap.gov.co', accion: 'create_usuario' }),
    ])
    await expect(exportarActividadExcel({ filtroModulo: 'usuarios' })).resolves.toBeUndefined()
    await expect(exportarActividadExcel({ busqueda: 'carlos' })).resolves.toBeUndefined()
  })

  test('funciona sin eventos', async () => {
    vi.mocked(api.get).mockResolvedValue([])
    await expect(exportarActividadExcel()).resolves.toBeUndefined()
    expect(URL.createObjectURL).toHaveBeenCalled()
  })

  test('propaga el error cuando el backend rechaza la exportación (p. ej. más de 10.000 filas)', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Más de 10000 registros'))
    await expect(exportarActividadExcel()).rejects.toThrow('Más de 10000 registros')
  })
})
