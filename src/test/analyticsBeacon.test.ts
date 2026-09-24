import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { enviarPageviewBeacon, type PageviewPayload } from '@/lib/analyticsBeacon'

const PAYLOAD: PageviewPayload = {
  sessionId: '11111111-1111-1111-1111-111111111111',
  ruta: '/mapas', titulo: 'Mapas', dispositivo: 'escritorio',
  navegador: 'Chrome', sistemaOperativo: 'Windows', esAreaAdmin: false,
}

describe('analyticsBeacon → enviarPageviewBeacon()', () => {
  let fetchSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchSpy = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchSpy)
  })
  afterEach(() => vi.unstubAllGlobals())

  test('usa navigator.sendBeacon cuando está disponible y funciona', () => {
    const sendBeacon = vi.fn().mockReturnValue(true)
    vi.stubGlobal('navigator', { ...navigator, sendBeacon })

    enviarPageviewBeacon(PAYLOAD)

    expect(sendBeacon).toHaveBeenCalledTimes(1)
    const [url, blob] = sendBeacon.mock.calls[0]
    expect(url).toContain('/analitica/pageview')
    expect(blob).toBeInstanceOf(Blob)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  test('cae a fetch keepalive si sendBeacon retorna false', () => {
    const sendBeacon = vi.fn().mockReturnValue(false)
    vi.stubGlobal('navigator', { ...navigator, sendBeacon })

    enviarPageviewBeacon(PAYLOAD)

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, opts] = fetchSpy.mock.calls[0]
    expect(url).toContain('/analitica/pageview')
    expect(opts.method).toBe('POST')
    expect(opts.keepalive).toBe(true)
    expect(JSON.parse(opts.body)).toEqual(PAYLOAD)
  })

  test('cae a fetch si sendBeacon no existe en el navegador', () => {
    vi.stubGlobal('navigator', { ...navigator, sendBeacon: undefined })

    enviarPageviewBeacon(PAYLOAD)

    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  test('un fallo de fetch no lanza (fire-and-forget)', () => {
    vi.stubGlobal('navigator', { ...navigator, sendBeacon: undefined })
    fetchSpy.mockRejectedValue(new Error('network down'))

    expect(() => enviarPageviewBeacon(PAYLOAD)).not.toThrow()
  })
})
