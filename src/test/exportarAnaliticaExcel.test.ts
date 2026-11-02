import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/api', () => ({ default: { get: vi.fn() } }))
import api from '@/lib/api'
import { exportarAnaliticaExcel } from '@/lib/exportarAnaliticaExcel'

const RANGO = { desde: '2026-01-08', hasta: '2026-01-15T23:59:59.999Z' }

const RESPUESTAS: Record<string, unknown> = {
  '/analitica/comparativa': {
    actual:   { desde: '2026-01-08T00:00:00.000Z', hasta: '2026-01-15T23:59:59.999Z', vistas: 150, sesiones: 60, acciones: 20, rebotePct: 60 },
    anterior: { desde: '2026-01-01T00:00:00.000Z', hasta: '2026-01-07T23:59:59.999Z', vistas: 100, sesiones: 80, acciones: 20, rebotePct: 40 },
    variacion: { vistas: 50, sesiones: -25, acciones: 0, rebotePuntos: 20 },
  },
  '/analitica/paginas-top': [{ ruta: '/mapas', vistas: 50, visitantes: 30 }],
  '/analitica/eventos-top': {
    eventos: [{ nombre: 'descarga_mapa', total: 12, sesiones: 9 }],
    recursos: [{ nombre: 'descarga_mapa', recurso: 'Río Atrato.pdf', total: 7 }],
  },
  '/analitica/embudos': [{
    id: 'mapas', titulo: 'De la portada a descargar un mapa',
    pasos: [
      { etiqueta: 'Visita la portada', sesiones: 200, pctDelAnterior: 100, pctDelInicio: 100 },
      { etiqueta: 'Entra a Mapas', sesiones: 100, pctDelAnterior: 50, pctDelInicio: 50 },
    ],
  }],
  '/analitica/flujo-navegacion': [{ desde: '/', hacia: '/mapas', veces: 40 }],
  '/analitica/dispositivos': [{ dispositivo: 'movil', sesiones: 7 }],
  '/analitica/fuentes-trafico': [{ fuente: 'Directo', sesiones: 4 }],
  '/analitica/ubicaciones': {
    paises: [{ pais: 'CO', sesiones: 10 }],
    departamentos: [{ departamento: 'Chocó', sesiones: 6 }],
    sinUbicacion: 1,
  },
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    blob: () => Promise.resolve(new Blob(['fake-png-bytes'], { type: 'image/png' })),
  }))
  vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn().mockReturnValue('blob:mock-url'), revokeObjectURL: vi.fn() })
  vi.mocked(api.get).mockImplementation((url: string) => Promise.resolve(RESPUESTAS[url]))
})

afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks() })

describe('exportarAnaliticaExcel', () => {
  test('pide al backend todas las secciones con el rango de la pantalla', async () => {
    await exportarAnaliticaExcel(RANGO)

    const urls = vi.mocked(api.get).mock.calls.map(([url]) => url)
    expect(urls.sort()).toEqual(Object.keys(RESPUESTAS).sort())
    for (const [, opciones] of vi.mocked(api.get).mock.calls) {
      expect(opciones).toEqual({ params: { desde: '2026-01-08', hasta: '2026-01-15T23:59:59.999Z' } })
    }
  })

  test('genera y descarga el libro sin lanzar errores', async () => {
    await expect(exportarAnaliticaExcel(RANGO)).resolves.toBeUndefined()
    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  test('funciona aunque no haya datos en el período', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => Promise.resolve(
      url === '/analitica/eventos-top' ? { eventos: [], recursos: [] }
        : url === '/analitica/ubicaciones' ? { paises: [], departamentos: [], sinUbicacion: 0 }
          : url === '/analitica/comparativa' ? RESPUESTAS[url] : [],
    ))
    await expect(exportarAnaliticaExcel(RANGO)).resolves.toBeUndefined()
  })

  test('si falla alguna consulta, no descarga un libro incompleto y propaga el error', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => (
      url === '/analitica/embudos' ? Promise.reject(new Error('500')) : Promise.resolve(RESPUESTAS[url])
    ))

    await expect(exportarAnaliticaExcel(RANGO)).rejects.toThrow('500')
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })
})
