import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import FichasCapaModal from '@/components/admin/geovisores/fichas/FichasCapaModal'
import type { FeaturesFichaResponse } from '@/types'

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

vi.mock('@/components/admin/geovisores/fichas/FichaPuntoEditor', () => ({
  default: ({ feature, onGuardarYSiguiente }: { feature: { valor: string }; onGuardarYSiguiente: () => void }) => (
    <div data-testid="editor">
      <span data-testid="editor-valor">{feature.valor}</span>
      <button onClick={onGuardarYSiguiente}>siguiente-test</button>
    </div>
  ),
}))

vi.mock('@/components/admin/geovisores/fichas/ImportarFichasDialog', () => ({
  default: ({ capaNombre, features, onClose }: { capaNombre: string; features: unknown[]; onClose: () => void }) => (
    <div data-testid="dialogo-importar" data-capa={capaNombre} data-n-features={features.length}>
      <button onClick={onClose}>cerrar-importar-test</button>
    </div>
  ),
}))

vi.mock('@/hooks/useFichasPunto', () => ({
  useFeaturesFichas: vi.fn(),
  useDeleteFicha: vi.fn(() => ({ mutate: vi.fn() })),
}))
import { useFeaturesFichas, useDeleteFicha } from '@/hooks/useFichasPunto'

function respuesta(overrides: Partial<FeaturesFichaResponse> = {}): FeaturesFichaResponse {
  return {
    resumen: { totalFeatures: 3, completas: 1, incompletas: 2, sinIdentificador: 0, identificadoresDuplicados: 0, huerfanas: 0 },
    features: [
      { valor: 'EST-01', etiqueta: 'Quibdó', centroide: [-76.6, 5.6], nFeatures: 1, estado: 'completa', fichaId: 'f1', nImagenes: 2, nVideos: 0, tieneDescripcion: true, actualizadoEn: null },
      { valor: 'EST-02', etiqueta: 'Istmina', centroide: [-76.7, 5.1], nFeatures: 1, estado: 'incompleta', fichaId: 'f2', nImagenes: 0, nVideos: 0, tieneDescripcion: true, actualizadoEn: null },
      { valor: 'EST-03', etiqueta: 'Condoto', centroide: [-76.6, 5.0], nFeatures: 1, estado: 'sin_ficha', fichaId: null, nImagenes: 0, nVideos: 0, tieneDescripcion: false, actualizadoEn: null },
    ],
    sinIdentificador: [], huerfanas: [],
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useFeaturesFichas).mockReturnValue({ data: respuesta(), isLoading: false } as unknown as ReturnType<typeof useFeaturesFichas>)
  vi.mocked(useDeleteFicha).mockReturnValue({ mutate: vi.fn() } as unknown as ReturnType<typeof useDeleteFicha>)
})

describe('FichasCapaModal — carga y preselección', () => {
  test('muestra el resumen de completitud en el encabezado', () => {
    render(<FichasCapaModal configId="cfg1" capaNombre="Estaciones" onClose={vi.fn()} />)
    expect(screen.getByText('1/3 completas')).toBeInTheDocument()
  })

  test('preselecciona la primera pendiente al cargar (no la ya completa)', () => {
    render(<FichasCapaModal configId="cfg1" capaNombre="Estaciones" onClose={vi.fn()} />)
    expect(screen.getByTestId('editor-valor')).toHaveTextContent('EST-02')
  })

  test('muestra un spinner mientras carga', () => {
    vi.mocked(useFeaturesFichas).mockReturnValue({ data: undefined, isLoading: true } as unknown as ReturnType<typeof useFeaturesFichas>)
    render(<FichasCapaModal configId="cfg1" capaNombre="Estaciones" onClose={vi.fn()} />)
    expect(screen.queryByText(/completas/)).not.toBeInTheDocument()
  })
})

describe('FichasCapaModal — filtros y lista', () => {
  test('el filtro "Pendientes" muestra solo las incompletas y sin ficha', () => {
    render(<FichasCapaModal configId="cfg1" capaNombre="Estaciones" onClose={vi.fn()} />)
    expect(screen.getByText('Istmina')).toBeInTheDocument()
    expect(screen.getByText('Condoto')).toBeInTheDocument()
    expect(screen.queryByText('Quibdó')).not.toBeInTheDocument()
  })

  test('el filtro "Todas" muestra las tres, incluida la completa', async () => {
    const user = userEvent.setup()
    render(<FichasCapaModal configId="cfg1" capaNombre="Estaciones" onClose={vi.fn()} />)
    await user.click(screen.getByRole('tab', { name: /Todas/i }))

    expect(screen.getByText('Quibdó')).toBeInTheDocument()
    expect(screen.getByText('Istmina')).toBeInTheDocument()
    expect(screen.getByText('Condoto')).toBeInTheDocument()
  })

  test('el filtro "Completas" muestra solo la completa', async () => {
    const user = userEvent.setup()
    render(<FichasCapaModal configId="cfg1" capaNombre="Estaciones" onClose={vi.fn()} />)
    await user.click(screen.getByRole('tab', { name: /Completas/i }))

    expect(screen.getByText('Quibdó')).toBeInTheDocument()
    expect(screen.queryByText('Istmina')).not.toBeInTheDocument()
  })

  test('la búsqueda filtra por identificador o etiqueta', async () => {
    const user = userEvent.setup()
    render(<FichasCapaModal configId="cfg1" capaNombre="Estaciones" onClose={vi.fn()} />)
    await user.click(screen.getByRole('tab', { name: /Todas/i }))
    await user.type(screen.getByPlaceholderText(/Buscar por identificador/i), 'istmina')

    expect(screen.getByText('Istmina')).toBeInTheDocument()
    expect(screen.queryByText('Quibdó')).not.toBeInTheDocument()
    expect(screen.queryByText('Condoto')).not.toBeInTheDocument()
  })

  test('elegir una fila de la lista abre esa ficha en el editor', async () => {
    const user = userEvent.setup()
    render(<FichasCapaModal configId="cfg1" capaNombre="Estaciones" onClose={vi.fn()} />)
    await user.click(screen.getByRole('tab', { name: /Todas/i }))
    await user.click(screen.getByText('Quibdó'))

    expect(screen.getByTestId('editor-valor')).toHaveTextContent('EST-01')
  })
})

describe('FichasCapaModal — "guardar y siguiente pendiente"', () => {
  test('avanza a la siguiente pendiente después de la actual', async () => {
    const user = userEvent.setup()
    render(<FichasCapaModal configId="cfg1" capaNombre="Estaciones" onClose={vi.fn()} />)
    expect(screen.getByTestId('editor-valor')).toHaveTextContent('EST-02')

    await user.click(screen.getByText('siguiente-test'))

    expect(screen.getByTestId('editor-valor')).toHaveTextContent('EST-03')
  })

  test('al llegar a la última pendiente, "siguiente" da la vuelta a la primera en vez de dejar la selección vacía', async () => {
    vi.mocked(useFeaturesFichas).mockReturnValue({
      data: respuesta({
        features: [
          { valor: 'EST-01', etiqueta: 'Quibdó', centroide: [-76.6, 5.6], nFeatures: 1, estado: 'completa', fichaId: 'f1', nImagenes: 2, nVideos: 0, tieneDescripcion: true, actualizadoEn: null },
          { valor: 'EST-02', etiqueta: 'Istmina', centroide: [-76.7, 5.1], nFeatures: 1, estado: 'incompleta', fichaId: 'f2', nImagenes: 0, nVideos: 0, tieneDescripcion: true, actualizadoEn: null },
        ],
        resumen: { totalFeatures: 2, completas: 1, incompletas: 1, sinIdentificador: 0, identificadoresDuplicados: 0, huerfanas: 0 },
      }),
      isLoading: false,
    } as unknown as ReturnType<typeof useFeaturesFichas>)
    const user = userEvent.setup()
    render(<FichasCapaModal configId="cfg1" capaNombre="Estaciones" onClose={vi.fn()} />)
    expect(screen.getByTestId('editor-valor')).toHaveTextContent('EST-02')

    await user.click(screen.getByText('siguiente-test'))

    expect(screen.getByTestId('editor-valor')).toHaveTextContent('EST-02')
  })

  test('sin ninguna pendiente desde el inicio, muestra el mensaje de todo completo', () => {
    vi.mocked(useFeaturesFichas).mockReturnValue({
      data: respuesta({
        features: [
          { valor: 'EST-01', etiqueta: 'Quibdó', centroide: [-76.6, 5.6], nFeatures: 1, estado: 'completa', fichaId: 'f1', nImagenes: 2, nVideos: 0, tieneDescripcion: true, actualizadoEn: null },
        ],
        resumen: { totalFeatures: 1, completas: 1, incompletas: 0, sinIdentificador: 0, identificadoresDuplicados: 0, huerfanas: 0 },
      }),
      isLoading: false,
    } as unknown as ReturnType<typeof useFeaturesFichas>)
    render(<FichasCapaModal configId="cfg1" capaNombre="Estaciones" onClose={vi.fn()} />)

    expect(screen.getByText(/todas las fichas están completas/i)).toBeInTheDocument()
  })
})

describe('FichasCapaModal — huérfanas y sin identificador', () => {
  test('el tab "Huérfanas" lista las fichas sin feature correspondiente, con opción de eliminar', async () => {
    vi.mocked(useFeaturesFichas).mockReturnValue({
      data: respuesta({ huerfanas: [{ valor: 'EST-99', fichaId: 'f99', nMedios: 3 }] }),
      isLoading: false,
    } as unknown as ReturnType<typeof useFeaturesFichas>)
    const mutate = vi.fn()
    vi.mocked(useDeleteFicha).mockReturnValue({ mutate } as unknown as ReturnType<typeof useDeleteFicha>)
    const user = userEvent.setup()
    render(<FichasCapaModal configId="cfg1" capaNombre="Estaciones" onClose={vi.fn()} />)

    await user.click(screen.getByRole('tab', { name: /Huérfanas/i }))
    expect(screen.getByText('EST-99')).toBeInTheDocument()

    await user.click(screen.getByTitle('Eliminar ficha huérfana'))
    expect(mutate).toHaveBeenCalledWith('EST-99')
  })

  test('el tab "Sin identificador" lista las features sin valor válido, sin acción de edición', async () => {
    vi.mocked(useFeaturesFichas).mockReturnValue({
      data: respuesta({ sinIdentificador: [{ fid: 'estaciones.12', etiqueta: 'Sin código' }] }),
      isLoading: false,
    } as unknown as ReturnType<typeof useFeaturesFichas>)
    const user = userEvent.setup()
    render(<FichasCapaModal configId="cfg1" capaNombre="Estaciones" onClose={vi.fn()} />)

    await user.click(screen.getByRole('tab', { name: /Sin identificador/i }))
    expect(screen.getByText('Sin código')).toBeInTheDocument()
    expect(within(screen.getByText('Sin código').closest('li')!).queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('FichasCapaModal — importar desde Excel o CSV', () => {
  test('el botón abre el diálogo de importación con los puntos de la capa', async () => {
    const user = userEvent.setup()
    render(<FichasCapaModal configId="cfg1" capaNombre="Estaciones" onClose={vi.fn()} />)

    expect(screen.queryByTestId('dialogo-importar')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /importar desde excel o csv/i }))

    const dialogo = screen.getByTestId('dialogo-importar')
    expect(dialogo).toHaveAttribute('data-capa', 'Estaciones')
    expect(dialogo).toHaveAttribute('data-n-features', '3')
  })

  test('cerrar el diálogo de importación no cierra el modal de fichas', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<FichasCapaModal configId="cfg1" capaNombre="Estaciones" onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: /importar desde excel o csv/i }))
    await user.click(screen.getByRole('button', { name: 'cerrar-importar-test' }))

    expect(screen.queryByTestId('dialogo-importar')).not.toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  test('mientras carga la capa no se ofrece importar', () => {
    vi.mocked(useFeaturesFichas).mockReturnValue({ data: undefined, isLoading: true } as unknown as ReturnType<typeof useFeaturesFichas>)
    render(<FichasCapaModal configId="cfg1" capaNombre="Estaciones" onClose={vi.fn()} />)

    expect(screen.queryByRole('button', { name: /importar desde excel o csv/i })).not.toBeInTheDocument()
  })
})

describe('FichasCapaModal — cierre', () => {
  test('el botón de cerrar llama a onClose', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<FichasCapaModal configId="cfg1" capaNombre="Estaciones" onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(onClose).toHaveBeenCalled()
  })

  test('hacer clic en el fondo llama a onClose', () => {
    const onClose = vi.fn()
    const { container } = render(<FichasCapaModal configId="cfg1" capaNombre="Estaciones" onClose={onClose} />)
    fireEvent.click(container.firstElementChild as HTMLElement)
    expect(onClose).toHaveBeenCalled()
  })
})
