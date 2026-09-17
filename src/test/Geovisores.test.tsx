import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { createElement, type ReactNode } from 'react'
import Geovisores from '@/pages/Geovisores'
import type { GeovisorRaw } from '@/types'

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

vi.mock('@/components/ui/Card3D', () => ({
  default: ({ children, className }: { children: ReactNode; className?: string }) =>
    <div className={className}>{children}</div>,
}))

vi.mock('@/hooks/useGeovisores', () => ({ useGeovisoresPublico: vi.fn() }))
import { useGeovisoresPublico } from '@/hooks/useGeovisores'

const searchState = { query: '', setQuery: vi.fn() }
vi.mock('@/contexts/SearchContext', () => ({ useSearch: () => searchState }))

function makeGeovisor(overrides: Partial<GeovisorRaw> = {}): GeovisorRaw {
  return {
    id: '1', slug: 'geologia-choco', titulo: 'Geología del Chocó', subtitulo: null,
    descripcion: null, cita: null, categoria: 'Geología', conexionGeoserverId: 'c1',
    workspacesGeoserver: [], colorPorTema: {}, centro: { lat: 5.55, lng: -76.6 },
    zoomInicial: 8, basemapDefecto: 'calles', areaMaxHa: null, presetsArea: [],
    iaHabilitada: false, visibilidad: 'publico',
    presentacion: { mostrarMetricas: true, mostrarImagenes: false, camposPopup: [] },
    thumbnailUrl: null, activo: true, orden: 0, creadoEn: '2026-01-01', ...overrides,
  }
}

function renderPage() {
  return render(<MemoryRouter><Geovisores /></MemoryRouter>)
}

beforeEach(() => {
  vi.clearAllMocks()
  searchState.query = ''
})

describe('Geovisores — estado de carga y vacío', () => {
  test('muestra el spinner de carga', () => {
    vi.mocked(useGeovisoresPublico).mockReturnValue({
      data: undefined, isLoading: true, isError: false,
    } as unknown as ReturnType<typeof useGeovisoresPublico>)
    renderPage()
    expect(screen.getByText('Cargando geovisores…')).toBeInTheDocument()
  })

  test('sin geovisores publicados, muestra el estado vacío', () => {
    vi.mocked(useGeovisoresPublico).mockReturnValue({
      data: { data: [], meta: { total: 0 } }, isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useGeovisoresPublico>)
    renderPage()
    expect(screen.getByText('Aún no hay geovisores publicados')).toBeInTheDocument()
  })

  test('si la petición falla, muestra un mensaje de error', () => {
    vi.mocked(useGeovisoresPublico).mockReturnValue({
      data: undefined, isLoading: false, isError: true,
    } as unknown as ReturnType<typeof useGeovisoresPublico>)
    renderPage()
    expect(screen.getByText(/No se pudieron cargar los geovisores/i)).toBeInTheDocument()
  })
})

describe('Geovisores — agrupación por categoría', () => {
  test('agrupa los geovisores por categoría y enlaza a su slug', () => {
    vi.mocked(useGeovisoresPublico).mockReturnValue({
      data: {
        data: [
          makeGeovisor({ id: '1', titulo: 'Geología del Chocó', categoria: 'Geología', slug: 'geologia-choco' }),
          makeGeovisor({ id: '2', titulo: 'Cuencas hidrográficas', categoria: 'Hidrología', slug: 'cuencas' }),
        ],
        meta: { total: 2 },
      }, isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useGeovisoresPublico>)

    renderPage()
    expect(screen.getByRole('heading', { level: 2, name: /Geología/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /Hidrología/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Geología del Chocó/is })).toHaveAttribute('href', '/geovisores/geologia-choco')
  })

  test('un geovisor sin categoría cae en el grupo "General"', () => {
    vi.mocked(useGeovisoresPublico).mockReturnValue({
      data: { data: [makeGeovisor({ categoria: null as unknown as string })], meta: { total: 1 } },
      isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useGeovisoresPublico>)

    renderPage()
    expect(screen.getByText('General')).toBeInTheDocument()
  })

  test('un geovisor restringido a "acreditados" muestra la insignia correspondiente', () => {
    vi.mocked(useGeovisoresPublico).mockReturnValue({
      data: { data: [makeGeovisor({ visibilidad: 'acreditados' })], meta: { total: 1 } },
      isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useGeovisoresPublico>)

    renderPage()
    expect(screen.getByText('Acreditados')).toBeInTheDocument()
  })
})

describe('Geovisores — búsqueda', () => {
  test('filtra por el texto de búsqueda global y muestra el mensaje de "sin resultados"', () => {
    searchState.query = 'no existe'
    vi.mocked(useGeovisoresPublico).mockReturnValue({
      data: { data: [makeGeovisor()], meta: { total: 1 } }, isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useGeovisoresPublico>)

    renderPage()
    expect(screen.getByText(/Ningún geovisor coincide con/i)).toBeInTheDocument()
    expect(screen.queryByText('Geología del Chocó')).not.toBeInTheDocument()
  })
})
