import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MediosFichaGrid from '@/components/admin/geovisores/fichas/MediosFichaGrid'
import type { MedioFicha } from '@/types'

vi.mock('@/lib/video/posterFrame', () => ({
  generarPosterDeVideo: vi.fn().mockResolvedValue(new File(['p'], 'poster.webp', { type: 'image/webp' })),
}))
import { generarPosterDeVideo } from '@/lib/video/posterFrame'

vi.mock('@/components/ui/Thumbnail', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img data-testid="thumb" src={src} alt={alt} />,
}))

vi.mock('@/hooks/useFichasPunto', () => ({
  useSubirMedioFicha: vi.fn(),
  useActualizarMedio: vi.fn(),
  useReordenarMedios: vi.fn(),
  useEliminarMedio: vi.fn(),
}))
import {
  useSubirMedioFicha, useActualizarMedio, useReordenarMedios, useEliminarMedio,
} from '@/hooks/useFichasPunto'

function medio(overrides: Partial<MedioFicha> = {}): MedioFicha {
  return {
    id: 'm1', tipo: 'imagen', estado: 'listo', url: 'https://x.test/foto.jpg', miniaturaUrl: 'https://x.test/foto-thumb.jpg',
    ancho: 800, alto: 600, duracionS: null, leyenda: null, creditos: null, orden: 0,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useSubirMedioFicha).mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue({}) } as unknown as ReturnType<typeof useSubirMedioFicha>)
  vi.mocked(useActualizarMedio).mockReturnValue({ mutate: vi.fn() } as unknown as ReturnType<typeof useActualizarMedio>)
  vi.mocked(useReordenarMedios).mockReturnValue({ mutate: vi.fn() } as unknown as ReturnType<typeof useReordenarMedios>)
  vi.mocked(useEliminarMedio).mockReturnValue({ mutate: vi.fn() } as unknown as ReturnType<typeof useEliminarMedio>)
})

describe('MediosFichaGrid — medios existentes', () => {
  test('sin medios ni subidas en curso, no muestra grilla', () => {
    render(<MediosFichaGrid configId="cfg1" valor="EST-01" medios={[]} />)
    expect(screen.queryByTestId('thumb')).not.toBeInTheDocument()
  })

  test('un medio listo muestra su miniatura', () => {
    render(<MediosFichaGrid configId="cfg1" valor="EST-01" medios={[medio()]} />)
    expect(screen.getByTestId('thumb')).toHaveAttribute('src', 'https://x.test/foto-thumb.jpg')
  })

  test('un medio en estado "procesando" muestra el aviso en vez de la miniatura', () => {
    render(<MediosFichaGrid configId="cfg1" valor="EST-01" medios={[medio({ estado: 'procesando', tipo: 'video', url: null, miniaturaUrl: null })]} />)
    expect(screen.getByText('Procesando video…')).toBeInTheDocument()
    expect(screen.queryByTestId('thumb')).not.toBeInTheDocument()
  })

  test('un medio en estado "error" muestra el aviso de fallo', () => {
    render(<MediosFichaGrid configId="cfg1" valor="EST-01" medios={[medio({ estado: 'error', url: null, miniaturaUrl: null })]} />)
    expect(screen.getByText('No se pudo procesar')).toBeInTheDocument()
  })
})

describe('MediosFichaGrid — subida', () => {
  test('subir una imagen llama a la mutación con el archivo, sin generar poster', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({})
    vi.mocked(useSubirMedioFicha).mockReturnValue({ mutateAsync } as unknown as ReturnType<typeof useSubirMedioFicha>)
    const user = userEvent.setup()
    render(<MediosFichaGrid configId="cfg1" valor="EST-01" medios={[]} />)

    const f = new File(['x'], 'foto.jpg', { type: 'image/jpeg' })
    await user.upload(screen.getByLabelText(/Subir fotos o video/i), f)

    await waitFor(() => expect(mutateAsync).toHaveBeenCalled())
    expect(mutateAsync.mock.calls[0][0]).toMatchObject({ valor: 'EST-01', archivo: f, poster: undefined })
    expect(generarPosterDeVideo).not.toHaveBeenCalled()
  })

  test('subir un video genera el poster primero y lo manda junto al archivo', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({})
    vi.mocked(useSubirMedioFicha).mockReturnValue({ mutateAsync } as unknown as ReturnType<typeof useSubirMedioFicha>)
    const user = userEvent.setup()
    render(<MediosFichaGrid configId="cfg1" valor="EST-01" medios={[]} />)

    const f = new File(['x'], 'clip.mp4', { type: 'video/mp4' })
    await user.upload(screen.getByLabelText(/Subir fotos o video/i), f)

    await waitFor(() => expect(mutateAsync).toHaveBeenCalled())
    expect(generarPosterDeVideo).toHaveBeenCalledWith(f)
    expect(mutateAsync.mock.calls[0][0].poster).toBeInstanceOf(File)
  })

  test('un error al subir se muestra en la tarjeta, con opción de quitarla', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('Falló la subida'))
    vi.mocked(useSubirMedioFicha).mockReturnValue({ mutateAsync } as unknown as ReturnType<typeof useSubirMedioFicha>)
    const user = userEvent.setup()
    render(<MediosFichaGrid configId="cfg1" valor="EST-01" medios={[]} />)

    const f = new File(['x'], 'foto.jpg', { type: 'image/jpeg' })
    await user.upload(screen.getByLabelText(/Subir fotos o video/i), f)

    expect(await screen.findByText('Falló la subida')).toBeInTheDocument()
    await user.click(screen.getByText('Quitar'))
    expect(screen.queryByText('Falló la subida')).not.toBeInTheDocument()
  })

  test('el dropzone se deshabilita al llegar a los topes de imágenes y videos', () => {
    const docenaImagenes = Array.from({ length: 12 }, (_, i) => medio({ id: `img-${i}`, orden: i }))
    const tresVideos = Array.from({ length: 3 }, (_, i) => medio({ id: `vid-${i}`, tipo: 'video', orden: 12 + i }))
    render(<MediosFichaGrid configId="cfg1" valor="EST-01" medios={[...docenaImagenes, ...tresVideos]} />)

    expect(screen.getByLabelText(/Subir fotos o video/i)).toBeDisabled()
  })
})

describe('MediosFichaGrid — edición y borrado', () => {
  test('cambiar la leyenda y salir del campo llama a actualizar el medio', async () => {
    const mutate = vi.fn()
    vi.mocked(useActualizarMedio).mockReturnValue({ mutate } as unknown as ReturnType<typeof useActualizarMedio>)
    const user = userEvent.setup()
    render(<MediosFichaGrid configId="cfg1" valor="EST-01" medios={[medio()]} />)

    const campo = screen.getByPlaceholderText('Leyenda (opcional)')
    await user.type(campo, 'Vista frontal')
    await user.tab()

    expect(mutate).toHaveBeenCalledWith({ medioId: 'm1', leyenda: 'Vista frontal' })
  })

  test('eliminar un medio llama a la mutación de borrado con su id', async () => {
    const mutate = vi.fn()
    vi.mocked(useEliminarMedio).mockReturnValue({ mutate } as unknown as ReturnType<typeof useEliminarMedio>)
    const user = userEvent.setup()
    render(<MediosFichaGrid configId="cfg1" valor="EST-01" medios={[medio()]} />)

    await user.click(screen.getByTitle('Eliminar'))
    expect(mutate).toHaveBeenCalledWith('m1')
  })

  test('mover el segundo medio "antes" reordena y llama a la mutación con el nuevo orden', async () => {
    const mutate = vi.fn()
    vi.mocked(useReordenarMedios).mockReturnValue({ mutate } as unknown as ReturnType<typeof useReordenarMedios>)
    const user = userEvent.setup()
    render(<MediosFichaGrid configId="cfg1" valor="EST-01" medios={[medio({ id: 'a', orden: 0 }), medio({ id: 'b', orden: 1 })]} />)

    const botones = screen.getAllByTitle('Mover antes')
    await user.click(botones[1])

    expect(mutate).toHaveBeenCalledWith({ valor: 'EST-01', ids: ['b', 'a'] })
  })

  test('el primer medio no puede moverse "antes" (deshabilitado)', () => {
    render(<MediosFichaGrid configId="cfg1" valor="EST-01" medios={[medio({ id: 'a', orden: 0 }), medio({ id: 'b', orden: 1 })]} />)
    expect(screen.getAllByTitle('Mover antes')[0]).toBeDisabled()
  })
})
