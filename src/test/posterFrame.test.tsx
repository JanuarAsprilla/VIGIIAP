import { describe, test, expect, vi, afterEach } from 'vitest'
import { generarPosterDeVideo } from '@/lib/video/posterFrame'

// jsdom no decodifica video real ni implementa un backend de Canvas -- se
// intercepta document.createElement para capturar el <video> que crea la
// función (nunca se agrega al DOM, así que no se puede buscar con
// querySelector) y así poder disparar sus eventos a mano, y se mockean
// getContext/toBlob del <canvas> real que jsdom sí crea.
function archivoVideo(): File {
  return new File(['contenido'], 'clip.mp4', { type: 'video/mp4' })
}

// getContext() está sobrecargado (2d/webgl/webgpu/...) -- mockReturnValue
// infiere el tipo de la ÚLTIMA sobrecarga (GPUCanvasContext) en vez de la de
// '2d', así que hace falta mockImplementation con el tipo completo del
// método real, casteado una sola vez acá.
function mockearGetContext2D(ctx: Pick<CanvasRenderingContext2D, 'drawImage'> | null) {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    ((contextId: string) => contextId === '2d' ? ctx : null) as HTMLCanvasElement['getContext'],
  )
}

function interceptarVideoCreado(): { video: () => HTMLVideoElement } {
  const original = document.createElement.bind(document)
  let capturado: HTMLVideoElement | null = null
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    const el = original(tag)
    if (tag === 'video') capturado = el as HTMLVideoElement
    return el
  })
  return { video: () => capturado! }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('generarPosterDeVideo', () => {
  test('extrae un frame tras "seeked" y lo entrega como File webp', async () => {
    const { video } = interceptarVideoCreado()
    mockearGetContext2D({ drawImage: vi.fn() })
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) => cb!(new Blob(['x'], { type: 'image/webp' })))
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake')
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    const promesa = generarPosterDeVideo(archivoVideo())
    Object.defineProperty(video(), 'duration', { value: 4, configurable: true })
    Object.defineProperty(video(), 'videoWidth', { value: 640, configurable: true })
    Object.defineProperty(video(), 'videoHeight', { value: 360, configurable: true })
    video().dispatchEvent(new Event('loadeddata'))
    video().dispatchEvent(new Event('seeked'))

    const resultado = await promesa
    expect(resultado.name).toBe('poster.webp')
    expect(resultado.type).toBe('image/webp')
    expect(revoke).toHaveBeenCalledWith('blob:fake')
  })

  test('un video de menos de 2s busca a la mitad de su duración, no a 1s fijo', async () => {
    const { video } = interceptarVideoCreado()
    mockearGetContext2D({ drawImage: vi.fn() })
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) => cb!(new Blob(['x'], { type: 'image/webp' })))
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    generarPosterDeVideo(archivoVideo())
    Object.defineProperty(video(), 'duration', { value: 0.8, configurable: true })
    video().dispatchEvent(new Event('loadeddata'))

    expect(video().currentTime).toBeCloseTo(0.4, 5)
  })

  test('sin backend de Canvas disponible (getContext null), rechaza con un mensaje claro', async () => {
    const { video } = interceptarVideoCreado()
    mockearGetContext2D(null)
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    const promesa = generarPosterDeVideo(archivoVideo())
    Object.defineProperty(video(), 'duration', { value: 4, configurable: true })
    video().dispatchEvent(new Event('loadeddata'))
    video().dispatchEvent(new Event('seeked'))

    await expect(promesa).rejects.toThrow('No se pudo generar el poster del video')
  })

  test('si el navegador no puede leer el archivo de video, rechaza con el mensaje correspondiente', async () => {
    const { video } = interceptarVideoCreado()
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    const promesa = generarPosterDeVideo(archivoVideo())
    video().dispatchEvent(new Event('error'))

    await expect(promesa).rejects.toThrow('No se pudo leer el video')
  })
})
