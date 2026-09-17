import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { createElement, type ReactNode, type PropsWithChildren } from 'react'
import GeovisorViewer from '@/pages/GeovisorViewer'
import type { GeovisorRaw, TemaCapas } from '@/types'

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

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children, center, zoom }: PropsWithChildren<{ center: [number, number]; zoom: number }>) => (
    <div data-testid="map-container" data-center={JSON.stringify(center)} data-zoom={zoom}>{children}</div>
  ),
  TileLayer: () => null,
  WMSTileLayer: ({ layers }: { layers: string }) => <div data-testid="wms-layer">{layers}</div>,
  ScaleControl: () => null,
  useMap: () => ({ flyToBounds: vi.fn() }),
}))

vi.mock('@/hooks/useGeovisores', () => ({
  useGeovisorPorSlug: vi.fn(),
  useCapasDeGeovisor: vi.fn(),
}))
import { useGeovisorPorSlug, useCapasDeGeovisor } from '@/hooks/useGeovisores'

function makeGeovisor(overrides: Partial<GeovisorRaw> = {}): GeovisorRaw {
  return {
    id: '1', slug: 'geologia-choco', titulo: 'Geología del Chocó', subtitulo: 'Unidades litoestratigráficas',
    descripcion: null, cita: null, categoria: 'Geología', conexionGeoserverId: 'c1',
    workspacesGeoserver: [], colorPorTema: { geologia: '#1B4332' }, centro: { lat: 5.55, lng: -76.6 },
    zoomInicial: 9, basemapDefecto: 'calles', areaMaxHa: null, presetsArea: [],
    iaHabilitada: false, visibilidad: 'publico',
    presentacion: { mostrarMetricas: true, mostrarImagenes: false, camposPopup: [] },
    thumbnailUrl: null, activo: true, orden: 0, creadoEn: '2026-01-01', ...overrides,
  }
}

const temasFixture: TemaCapas[] = [
  {
    id: 'geologia', nombre: 'Geología', capas: [
      { id: 'geologia:unidades', nombre: 'Unidades geológicas', tipo: 'vectorial', tema: 'geologia', bbox: { norte: 6, sur: 5, este: -76, oeste: -77 } },
    ],
  },
]

function renderViewer(slug = 'geologia-choco') {
  return render(
    <MemoryRouter initialEntries={[`/geovisores/${slug}`]}>
      <Routes>
        <Route path="/geovisores/:slug" element={<GeovisorViewer />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GeovisorViewer — estados de carga y error', () => {
  test('muestra un spinner mientras carga el geovisor', () => {
    vi.mocked(useGeovisorPorSlug).mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null } as unknown as ReturnType<typeof useGeovisorPorSlug>)
    vi.mocked(useCapasDeGeovisor).mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<typeof useCapasDeGeovisor>)
    renderViewer()
    expect(screen.queryByTestId('map-container')).not.toBeInTheDocument()
  })

  test('geovisor inexistente o sin permiso muestra un mensaje y un enlace de vuelta', () => {
    vi.mocked(useGeovisorPorSlug).mockReturnValue({
      data: undefined, isLoading: false, isError: true, error: new Error('Geovisor no encontrado'),
    } as unknown as ReturnType<typeof useGeovisorPorSlug>)
    vi.mocked(useCapasDeGeovisor).mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<typeof useCapasDeGeovisor>)
    renderViewer('no-existe')

    expect(screen.getByText('Geovisor no encontrado')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Volver al portal de geovisores/i })).toHaveAttribute('href', '/geovisores')
  })
})

describe('GeovisorViewer — mapa y catálogo de capas', () => {
  beforeEach(() => {
    vi.mocked(useGeovisorPorSlug).mockReturnValue({
      data: makeGeovisor(), isLoading: false, isError: false, error: null,
    } as unknown as ReturnType<typeof useGeovisorPorSlug>)
    vi.mocked(useCapasDeGeovisor).mockReturnValue({
      data: temasFixture, isLoading: false,
    } as unknown as ReturnType<typeof useCapasDeGeovisor>)
  })

  test('centra el mapa en las coordenadas y zoom del geovisor', () => {
    renderViewer()
    const map = screen.getByTestId('map-container')
    expect(map).toHaveAttribute('data-center', JSON.stringify([5.55, -76.6]))
    expect(map).toHaveAttribute('data-zoom', '9')
  })

  test('muestra el título y subtítulo del geovisor', () => {
    renderViewer()
    expect(screen.getByRole('heading', { name: 'Geología del Chocó' })).toBeInTheDocument()
    expect(screen.getByText('Unidades litoestratigráficas')).toBeInTheDocument()
  })

  test('activar una capa del catálogo la agrega al mapa como WMSTileLayer', async () => {
    const user = userEvent.setup()
    renderViewer()

    expect(screen.queryByTestId('wms-layer')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Geología/i }))
    await user.click(screen.getByRole('checkbox', { name: /Unidades geológicas/i }))

    const capa = screen.getByTestId('wms-layer')
    expect(capa).toBeInTheDocument()
    expect(capa).toHaveTextContent('geologia:unidades')
  })

  test('desactivar una capa activa la quita del mapa', async () => {
    const user = userEvent.setup()
    renderViewer()

    await user.click(screen.getByRole('button', { name: /Geología/i }))
    await user.click(screen.getByRole('checkbox', { name: /Unidades geológicas/i }))
    expect(screen.getByTestId('wms-layer')).toBeInTheDocument()

    await user.click(screen.getByTitle('Quitar capa'))
    expect(screen.queryByTestId('wms-layer')).not.toBeInTheDocument()
  })
})
