import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import FichaPuntoPanel from '@/components/geovisor-viewer/FichaPuntoPanel'
import type { FichaPunto, MedioFicha } from '@/types'

vi.mock('framer-motion', () => {
  const cache = new Map<string, (p: Record<string, unknown>) => ReactNode>()
  const motion = new Proxy({}, {
    get: (_t, tag: string) => {
      if (!cache.has(tag)) {
        cache.set(tag, ({ children, ...p }: Record<string, unknown>) => createElement(tag, p, children as ReactNode))
      }
      return cache.get(tag)
    },
  })
  return { motion, AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</> }
})

vi.mock('@/components/ui/Thumbnail', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img data-testid="thumb" src={src} alt={alt} />,
}))

// isTrustedUrl real depende del origen del navegador/entorno -- se mockea acá
// para controlar exactamente qué URL cuenta como confiable en cada test,
// independientemente de las variables de entorno del runner.
vi.mock('@/lib/trustedUrl', () => ({
  isTrustedUrl: (url: string) => !url.includes('sitio-ajeno'),
}))

function medio(overrides: Partial<MedioFicha> = {}): MedioFicha {
  return {
    id: 'm1', tipo: 'imagen', estado: 'listo', url: 'https://x.test/foto.jpg', miniaturaUrl: 'https://x.test/foto-thumb.jpg',
    ancho: 800, alto: 600, duracionS: null, leyenda: null, creditos: null, orden: 0,
    ...overrides,
  }
}

function ficha(overrides: Partial<FichaPunto> = {}): FichaPunto {
  return { id: 'f1', titulo: 'Estación río Atrato', descripcion: 'Monitorea el nivel del río.', medios: [], ...overrides }
}

describe('FichaPuntoPanel — visibilidad', () => {
  test('sin ficha (null), no renderiza nada', () => {
    render(<FichaPuntoPanel ficha={null} onClose={vi.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('con ficha, muestra el título y la descripción', () => {
    render(<FichaPuntoPanel ficha={ficha()} onClose={vi.fn()} />)
    expect(screen.getByRole('dialog', { name: 'Estación río Atrato' })).toBeInTheDocument()
    expect(screen.getByText('Monitorea el nivel del río.')).toBeInTheDocument()
  })

  test('el botón de cerrar llama a onClose', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<FichaPuntoPanel ficha={ficha()} onClose={onClose} />)

    await user.click(screen.getByLabelText('Cerrar ficha'))
    expect(onClose).toHaveBeenCalled()
  })
})

describe('FichaPuntoPanel — medios', () => {
  test('solo muestra medios en estado "listo" -- procesando y error quedan ocultos', () => {
    const f = ficha({
      medios: [
        medio({ id: 'a', estado: 'listo' }),
        medio({ id: 'b', estado: 'procesando' }),
        medio({ id: 'c', estado: 'error' }),
      ],
    })
    render(<FichaPuntoPanel ficha={f} onClose={vi.fn()} />)
    expect(screen.getAllByTestId('thumb')).toHaveLength(1)
  })

  test('un medio de video "listo" se renderiza como <video> con su poster', () => {
    const f = ficha({ medios: [medio({ id: 'v1', tipo: 'video', url: 'https://x.test/clip.mp4', miniaturaUrl: 'https://x.test/poster.webp' })] })
    const { container } = render(<FichaPuntoPanel ficha={f} onClose={vi.fn()} />)

    const video = container.querySelector('video')!
    expect(video).toHaveAttribute('poster', 'https://x.test/poster.webp')
    expect(container.querySelector('source')).toHaveAttribute('src', 'https://x.test/clip.mp4')
  })

  test('un medio con una URL no confiable no se renderiza', () => {
    const f = ficha({ medios: [medio({ url: 'https://sitio-ajeno-cualquiera.test/foto.jpg', miniaturaUrl: 'https://sitio-ajeno-cualquiera.test/foto.jpg' })] })
    render(<FichaPuntoPanel ficha={f} onClose={vi.fn()} />)
    expect(screen.queryByTestId('thumb')).not.toBeInTheDocument()
  })

  // Regresión: el render prefiere miniaturaUrl (Thumbnail, poster de video),
  // así que validar solo `url` contra isTrustedUrl dejaba pasar un
  // miniaturaUrl de origen no confiable sin filtrar -- un backend
  // comprometido o mal configurado podía inyectar un origen externo
  // arbitrario en <img src>/<video poster> del visor público.
  test('url confiable pero miniaturaUrl no confiable -- el medio tampoco se renderiza', () => {
    const f = ficha({ medios: [medio({ url: 'https://x.test/foto.jpg', miniaturaUrl: 'https://sitio-ajeno-cualquiera.test/foto.jpg' })] })
    render(<FichaPuntoPanel ficha={f} onClose={vi.fn()} />)
    expect(screen.queryByTestId('thumb')).not.toBeInTheDocument()
  })

  test('miniaturaUrl confiable pero url no confiable -- el medio tampoco se renderiza', () => {
    const f = ficha({ medios: [medio({ url: 'https://sitio-ajeno-cualquiera.test/foto.jpg', miniaturaUrl: 'https://x.test/foto-thumb.jpg' })] })
    render(<FichaPuntoPanel ficha={f} onClose={vi.fn()} />)
    expect(screen.queryByTestId('thumb')).not.toBeInTheDocument()
  })

  test('créditos de una foto se muestran en la sección de créditos', () => {
    const f = ficha({ medios: [medio({ creditos: 'Foto: IIAP' })] })
    render(<FichaPuntoPanel ficha={f} onClose={vi.fn()} />)
    expect(screen.getByText(/Foto: IIAP/)).toBeInTheDocument()
  })
})

describe('FichaPuntoPanel — descripción como texto plano', () => {
  test('una descripción con etiquetas HTML se muestra literal, nunca interpretada', () => {
    const f = ficha({ descripcion: 'Contiene <b>negrita</b> y <script>alert(1)</script> como texto.' })
    const { container } = render(<FichaPuntoPanel ficha={f} onClose={vi.fn()} />)

    expect(screen.getByText(/Contiene <b>negrita<\/b> y <script>alert\(1\)<\/script> como texto\./)).toBeInTheDocument()
    expect(container.querySelector('script')).not.toBeInTheDocument()
    expect(container.querySelector('b')).not.toBeInTheDocument()
  })
})

describe('FichaPuntoPanel — lightbox', () => {
  test('hacer clic en una foto abre la vista ampliada', async () => {
    const f = ficha({ medios: [medio()] })
    const user = userEvent.setup()
    render(<FichaPuntoPanel ficha={f} onClose={vi.fn()} />)

    await user.click(screen.getByLabelText('Ampliar foto 1'))
    expect(screen.getByLabelText('Cerrar imagen ampliada')).toBeInTheDocument()
  })

  test('con una sola foto, no muestra flechas de navegación', async () => {
    const f = ficha({ medios: [medio()] })
    const user = userEvent.setup()
    render(<FichaPuntoPanel ficha={f} onClose={vi.fn()} />)

    await user.click(screen.getByLabelText('Ampliar foto 1'))
    expect(screen.queryByLabelText('Foto siguiente')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Foto anterior')).not.toBeInTheDocument()
  })

  test('con varias fotos, "Foto siguiente" avanza el índice', async () => {
    const f = ficha({ medios: [medio({ id: 'a', url: 'https://x.test/a.jpg' }), medio({ id: 'b', url: 'https://x.test/b.jpg', orden: 1 })] })
    const user = userEvent.setup()
    const { container } = render(<FichaPuntoPanel ficha={f} onClose={vi.fn()} />)

    await user.click(screen.getByLabelText('Ampliar foto 1'))
    await user.click(screen.getByLabelText('Foto siguiente'))

    const imagenAmpliada = container.querySelector('.fixed img')!
    expect(imagenAmpliada).toHaveAttribute('src', 'https://x.test/b.jpg')
  })
})
