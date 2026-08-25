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
  CategoryCard: ({ category, onOpen }: { category: CategoryItem; onOpen: () => void }) => (
    <button onClick={onOpen}>{category.title} ({category.docs.length})</button>
  ),
}))
vi.mock('@/pages/documentos/CategoryModal', () => ({ CategoryModal: () => null }))
vi.mock('@/pages/documentos/PreviewModal', () => ({ PreviewModal: () => null }))
vi.mock('@/pages/documentos/SoporteModal', () => ({ SoporteDocumentalModal: () => null }))
vi.mock('@/pages/documentos/SupportCTA', () => ({ SupportCTA: () => null }))

vi.mock('@/hooks/useDocumentos', () => ({ useDocumentosList: vi.fn() }))
import { useDocumentosList } from '@/hooks/useDocumentos'

vi.mock('@/contexts/SearchContext', () => {
  let query = ''
  return {
    useSearch: () => ({
      query,
      setQuery: (v: string) => { query = v },
      debouncedQuery: query,
    }),
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
