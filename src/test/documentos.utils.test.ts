import { describe, test, expect, vi, beforeEach } from 'vitest'
import { descargarUrl, forceDownload } from '@/pages/documentos/documentos.utils'

describe('descargarUrl', () => {
  test('construye la URL sin campo extra', () => {
    expect(descargarUrl('documento', 'abc')).toMatch(/\/descargar\/documento\/abc$/)
  })

  test('agrega el query param campo cuando se pasa', () => {
    expect(descargarUrl('mapa', '1', 'archivo_pdf')).toMatch(/\/descargar\/mapa\/1\?campo=archivo_pdf$/)
  })
})

describe('forceDownload', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    URL.revokeObjectURL  = vi.fn()
  })

  test('descarga una URL relativa (VITE_API_URL sin setear) sin bloquearla', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue({
      blob: () => Promise.resolve(new Blob(['x'])),
    } as Response)

    await forceDownload(descargarUrl('documento', 'abc'), 'doc.pdf')

    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  test('no hace fetch si la url es null/undefined', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch')
    await forceDownload(null)
    await forceDownload(undefined)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  test('bloquea un origen externo sin llegar a hacer fetch', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch')
    await forceDownload('https://evil.example.com/x.pdf')
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
