import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'

const enviarEventoBeacon = vi.fn()
vi.mock('@/lib/analyticsBeacon', () => ({ enviarEventoBeacon: (p: unknown) => enviarEventoBeacon(p) }))
vi.mock('@/lib/analyticsSession', () => ({ obtenerSessionId: () => '11111111-1111-4111-8111-111111111111' }))

import { registrarEvento, registrarDescargaDeUrl, RETRASO_EVENTO_MS } from '@/lib/analyticsEventos'

beforeEach(() => {
  vi.useFakeTimers()
  enviarEventoBeacon.mockClear()
  window.history.pushState({}, '', '/mapas')
})
afterEach(() => vi.useRealTimers())

describe('analyticsEventos → registrarEvento()', () => {
  test('envía el evento con sesión, recurso y ruta una vez pasado el retraso', () => {
    registrarEvento('abrir_geovisor', 'bosques')

    expect(enviarEventoBeacon).not.toHaveBeenCalled()
    vi.advanceTimersByTime(RETRASO_EVENTO_MS)

    expect(enviarEventoBeacon).toHaveBeenCalledWith({
      sessionId: '11111111-1111-4111-8111-111111111111',
      nombre: 'abrir_geovisor',
      recurso: 'bosques',
      ruta: '/mapas',
    })
  })

  test('el recurso es opcional y se envía como null', () => {
    registrarEvento('buscar')
    vi.advanceTimersByTime(RETRASO_EVENTO_MS)

    expect(enviarEventoBeacon).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'buscar', recurso: null }))
  })

  test('recorta un recurso demasiado largo al límite del backend', () => {
    registrarEvento('descarga_mapa', 'x'.repeat(500))
    vi.advanceTimersByTime(RETRASO_EVENTO_MS)

    const { recurso } = enviarEventoBeacon.mock.calls[0][0]
    expect(recurso).toHaveLength(200)
  })

  test('no registra nada desde el panel de administración', () => {
    window.history.pushState({}, '', '/admin/usuarios')

    registrarEvento('descarga_mapa', 'x')
    vi.advanceTimersByTime(RETRASO_EVENTO_MS)

    expect(enviarEventoBeacon).not.toHaveBeenCalled()
  })
})

describe('analyticsEventos → registrarDescargaDeUrl()', () => {
  test('una descarga de mapa se registra como descarga_mapa con el nombre del archivo', () => {
    registrarDescargaDeUrl('https://api.test/api/v1/descargar/mapa/abc-123?campo=archivo_pdf', 'Rio Atrato.pdf')
    vi.advanceTimersByTime(RETRASO_EVENTO_MS)

    expect(enviarEventoBeacon).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'descarga_mapa', recurso: 'Rio Atrato.pdf' }))
  })

  test('una descarga de documento usa el id si no hay nombre de archivo', () => {
    registrarDescargaDeUrl('https://api.test/api/v1/descargar/documento/doc-9')
    vi.advanceTimersByTime(RETRASO_EVENTO_MS)

    expect(enviarEventoBeacon).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'descarga_documento', recurso: 'doc-9' }))
  })

  test('ignora URLs que no son del endpoint de descargas', () => {
    registrarDescargaDeUrl('https://otro.test/archivo.pdf', 'archivo.pdf')
    vi.advanceTimersByTime(RETRASO_EVENTO_MS)

    expect(enviarEventoBeacon).not.toHaveBeenCalled()
  })
})
