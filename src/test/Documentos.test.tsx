import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import Documentos from '@/pages/Documentos'
import type { CategoryItem } from '@/pages/documentos/documentos.utils'

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
  return {
    motion,
    AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  }
})

vi.mock('@/pages/documentos/CategoryCard', () => ({
  CategoryCard: ({ category, onOpen, filteredCount }: { category: CategoryItem; onOpen: () => void; filteredCount: number | null }) => (
    <button onClick={onOpen}>{category.title} ({filteredCount ?? category.docs.length})</button>
  ),
}))
vi.mock('@/pages/documentos/CategoryModal', () => ({
  CategoryModal: ({ category, onClose, onPreview, onDownload }: {
    category: CategoryItem; onClose: () => void
    onPreview: (doc: CategoryItem['docs'][number], title: string) => void
    onDownload: (doc: CategoryItem['docs'][number]) => void
  }) => (
    <div>
      <span>Modal: {category.title}</span>
      <button onClick={onClose}>Cerrar modal categoría</button>
      {category.docs[0] && (
        <>
          <button onClick={() => onPreview(category.docs[0], category.title)}>Previsualizar primero</button>
          <button onClick={() => onDownload(category.docs[0])}>Descargar primero</button>
        </>
      )}
    </div>
  ),
}))
vi.mock('@/pages/documentos/PreviewModal', () => ({
  PreviewModal: ({ doc, categoryTitle, onClose }: { doc: CategoryItem['docs'][number]; categoryTitle: string; onClose: () => void }) => (
    <div>
      <span>Preview: {doc.name} ({categoryTitle})</span>
      <button onClick={onClose}>Cerrar preview</button>
    </div>
  ),
}))
vi.mock('@/pages/documentos/SoporteModal', () => ({
  SoporteDocumentalModal: ({ onClose }: { onClose: () => void }) => (
    <div>
      <span>Modal Soporte</span>
      <button onClick={onClose}>Cerrar soporte</button>
    </div>
  ),
}))
vi.mock('@/pages/documentos/SupportCTA', () => ({
  SupportCTA: ({ onContactar }: { onContactar: () => void }) => (
    <button onClick={onContactar}>Contactar Soporte</button>
  ),
}))

const { forceDownloadSpy } = vi.hoisted(() => ({ forceDownloadSpy: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/pages/documentos/documentos.utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/pages/documentos/documentos.utils')>()
  return { ...actual, forceDownload: forceDownloadSpy }
})

vi.mock('@/hooks/useDocumentos', () => ({ useDocumentosList: vi.fn() }))
import { useDocumentosList } from '@/hooks/useDocumentos'

vi.mock('@/contexts/SearchContext', async () => {
  const React = await import('react')
  return {
    useSearch: () => {
      const [query, setQuery] = React.useState('')
      return { query, setQuery, debouncedQuery: query }
    },
  }
})

function makeDoc(overrides: Record<string, unknown> = {}) {
  return {
    id: '1', nombre: 'Protocolo de muestreo', categoria: 'Protocolos',
    type: 'pdf', tamano: '1 MB', fecha: '01/01/2025', creado_en: '2025-01-01',
    categoria_thumbnail_url: null, url: 'https://r2.example.com/doc.pdf',
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Documentos — agrupación por categoría', () => {
  test('agrupa documentos por categoria y cuenta correctamente', () => {
    vi.mocked(useDocumentosList).mockReturnValue({
      data: {
        data: [
          makeDoc({ id: '1', categoria: 'Protocolos' }),
          makeDoc({ id: '2', categoria: 'Protocolos' }),
          makeDoc({ id: '3', categoria: 'Informes' }),
        ],
      },
      isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useDocumentosList>)

    render(<Documentos />)

    expect(screen.getByRole('button', { name: 'Protocolos (2)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Informes (1)' })).toBeInTheDocument()
  })

  test('un documento sin categoria cae en "General"', () => {
    vi.mocked(useDocumentosList).mockReturnValue({
      data: { data: [makeDoc({ categoria: '' })] },
      isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useDocumentosList>)

    render(<Documentos />)
    expect(screen.getByRole('button', { name: 'General (1)' })).toBeInTheDocument()
  })
})

describe('Documentos — filtro por tipo de archivo', () => {
  test('filtrar por xlsx oculta categorías sin documentos de ese tipo', async () => {
    vi.mocked(useDocumentosList).mockReturnValue({
      data: {
        data: [
          makeDoc({ id: '1', categoria: 'Protocolos', type: 'pdf' }),
          makeDoc({ id: '2', categoria: 'Informes', type: 'xlsx' }),
        ],
      },
      isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useDocumentosList>)

    const user = userEvent.setup()
    render(<Documentos />)

    await user.click(screen.getByRole('button', { name: /Filtros/i }))
    await user.click(screen.getByRole('button', { name: 'Excel (XLSX)' }))

    expect(screen.queryByRole('button', { name: /Protocolos/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Informes (1)' })).toBeInTheDocument()
  })
})

describe('Documentos — estados de carga y error', () => {
  test('muestra spinner mientras isLoading es true', () => {
    vi.mocked(useDocumentosList).mockReturnValue({
      data: undefined, isLoading: true, isError: false,
    } as unknown as ReturnType<typeof useDocumentosList>)

    render(<Documentos />)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  test('muestra un error explícito cuando isError es true', () => {
    vi.mocked(useDocumentosList).mockReturnValue({
      data: undefined, isLoading: false, isError: true,
    } as unknown as ReturnType<typeof useDocumentosList>)

    render(<Documentos />)
    expect(screen.getByText('Error al cargar documentos')).toBeInTheDocument()
  })

  test('sin documentos muestra el estado vacío, no un catálogo en blanco silencioso', () => {
    vi.mocked(useDocumentosList).mockReturnValue({
      data: { data: [] }, isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useDocumentosList>)

    render(<Documentos />)
    expect(screen.getByText('No hay documentos disponibles')).toBeInTheDocument()
  })
})

describe('Documentos — múltiples filtros de tipo', () => {
  test('acumula varios tipos y "Limpiar filtros" los quita todos', async () => {
    vi.mocked(useDocumentosList).mockReturnValue({
      data: {
        data: [
          makeDoc({ id: '1', categoria: 'Protocolos', type: 'pdf' }),
          makeDoc({ id: '2', categoria: 'Informes', type: 'xlsx' }),
          makeDoc({ id: '3', categoria: 'Formatos', type: 'docx' }),
        ],
      },
      isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useDocumentosList>)

    const user = userEvent.setup()
    render(<Documentos />)
    await user.click(screen.getByRole('button', { name: /Filtros/i }))
    await user.click(screen.getByRole('button', { name: 'PDF' }))
    await user.click(screen.getByRole('button', { name: 'Word (DOCX)' }))

    expect(screen.getByRole('button', { name: 'Protocolos (1)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Formatos (1)' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Informes/i })).not.toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()

    await user.click(screen.getByText('Limpiar filtros'))
    expect(screen.getByRole('button', { name: /Informes/i })).toBeInTheDocument()
  })

  test('sin resultados tras filtrar, ofrece limpiar los filtros desde el estado vacío', async () => {
    vi.mocked(useDocumentosList).mockReturnValue({
      data: { data: [makeDoc({ categoria: 'Protocolos', type: 'pdf' })] },
      isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useDocumentosList>)

    const user = userEvent.setup()
    render(<Documentos />)
    await user.click(screen.getByRole('button', { name: /Filtros/i }))
    await user.click(screen.getByRole('button', { name: 'Excel (XLSX)' }))

    expect(screen.queryByRole('button', { name: /Protocolos/i })).not.toBeInTheDocument()
    const [, clearBtn] = screen.getAllByText('Limpiar filtros')
    await user.click(clearBtn)
    expect(screen.getByRole('button', { name: /Protocolos/i })).toBeInTheDocument()
  })
})

describe('Documentos — abrir categoría, previsualizar y descargar', () => {
  test('abrir una categoría muestra el modal correspondiente', async () => {
    vi.mocked(useDocumentosList).mockReturnValue({
      data: { data: [makeDoc({ categoria: 'Protocolos' })] },
      isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useDocumentosList>)

    const user = userEvent.setup()
    render(<Documentos />)
    await user.click(screen.getByRole('button', { name: /Protocolos/i }))

    expect(screen.getByText('Modal: Protocolos')).toBeInTheDocument()
    await user.click(screen.getByText('Cerrar modal categoría'))
    expect(screen.queryByText('Modal: Protocolos')).not.toBeInTheDocument()
  })

  test('previsualizar un documento desde el modal de categoría abre el PreviewModal', async () => {
    vi.mocked(useDocumentosList).mockReturnValue({
      data: { data: [makeDoc({ categoria: 'Protocolos', nombre: 'Manual técnico' })] },
      isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useDocumentosList>)

    const user = userEvent.setup()
    render(<Documentos />)
    await user.click(screen.getByRole('button', { name: /Protocolos/i }))
    await user.click(screen.getByText('Previsualizar primero'))

    expect(screen.getByText('Preview: Manual técnico (Protocolos)')).toBeInTheDocument()
    await user.click(screen.getByText('Cerrar preview'))
    expect(screen.queryByText('Preview: Manual técnico (Protocolos)')).not.toBeInTheDocument()
  })

  test('descargar desde el modal de categoría llama a forceDownload y notifica', async () => {
    vi.mocked(useDocumentosList).mockReturnValue({
      data: { data: [makeDoc({ id: 'd1', categoria: 'Protocolos', nombre: 'Manual técnico', type: 'pdf' })] },
      isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useDocumentosList>)

    const user = userEvent.setup()
    render(<Documentos />)
    await user.click(screen.getByRole('button', { name: /Protocolos/i }))
    await user.click(screen.getByText('Descargar primero'))

    expect(forceDownloadSpy).toHaveBeenCalledWith(expect.stringContaining('/descargar/documento/d1'), 'Manual técnico.pdf')
    expect(await screen.findByText('Descargando "Manual técnico"')).toBeInTheDocument()
  })
})

describe('Documentos — soporte', () => {
  test('"Contactar Soporte" abre el modal de soporte documental', async () => {
    vi.mocked(useDocumentosList).mockReturnValue({
      data: { data: [] }, isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useDocumentosList>)

    const user = userEvent.setup()
    render(<Documentos />)
    await user.click(screen.getByText('Contactar Soporte'))

    expect(screen.getByText('Modal Soporte')).toBeInTheDocument()
    await user.click(screen.getByText('Cerrar soporte'))
    expect(screen.queryByText('Modal Soporte')).not.toBeInTheDocument()
  })
})

describe('Documentos — búsqueda por texto', () => {
  test('escribir en el buscador filtra las categorías mostradas', async () => {
    vi.mocked(useDocumentosList).mockReturnValue({
      data: {
        data: [
          makeDoc({ id: '1', categoria: 'Protocolos', nombre: 'Manual de muestreo' }),
          makeDoc({ id: '2', categoria: 'Informes', nombre: 'Reporte anual' }),
        ],
      },
      isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useDocumentosList>)

    const user = userEvent.setup()
    render(<Documentos />)
    await user.type(screen.getByPlaceholderText(/Buscar por nombre/i), 'reporte')

    expect(screen.getByRole('button', { name: /Informes/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Protocolos/i })).not.toBeInTheDocument()
  })

  test('el botón de limpiar búsqueda restablece el listado completo', async () => {
    vi.mocked(useDocumentosList).mockReturnValue({
      data: {
        data: [
          makeDoc({ id: '1', categoria: 'Protocolos', nombre: 'Manual de muestreo' }),
          makeDoc({ id: '2', categoria: 'Informes', nombre: 'Reporte anual' }),
        ],
      },
      isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useDocumentosList>)

    const user = userEvent.setup()
    const { container } = render(<Documentos />)
    const input = screen.getByPlaceholderText(/Buscar por nombre/i)
    await user.type(input, 'reporte')
    expect(screen.queryByRole('button', { name: /Protocolos/i })).not.toBeInTheDocument()

    const clearBtn = container.querySelector('.lucide-x')!.closest('button')!
    await user.click(clearBtn)

    expect(screen.getByRole('button', { name: /Protocolos/i })).toBeInTheDocument()
  })
})
