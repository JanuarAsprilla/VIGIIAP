import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, forwardRef, useImperativeHandle, type ReactNode } from 'react'
import Geovisor from '@/pages/Geovisor'

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

const fakeMap = {
  zoomIn: vi.fn(),
  zoomOut: vi.fn(),
  setView: vi.fn(),
  getZoom: vi.fn(() => 10),
}

vi.mock('react-leaflet', () => ({
  MapContainer: forwardRef(({ children }: { children: ReactNode }, ref: React.Ref<typeof fakeMap>) => {
    useImperativeHandle(ref, () => fakeMap)
    return <div data-testid="map-container">{children}</div>
  }),
  TileLayer: () => null,
  Polygon: () => null,
  useMapEvents: () => null,
}))

vi.mock('leaflet/dist/leaflet.css', () => ({}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Geovisor — controles de zoom', () => {
  test('Acercar llama a zoomIn en la instancia del mapa', async () => {
    const user = userEvent.setup()
    render(<Geovisor />)
    await user.click(screen.getByTitle('Acercar'))
    expect(fakeMap.zoomIn).toHaveBeenCalled()
  })

  test('Alejar llama a zoomOut', async () => {
    const user = userEvent.setup()
    render(<Geovisor />)
    await user.click(screen.getByTitle('Alejar'))
    expect(fakeMap.zoomOut).toHaveBeenCalled()
  })

  test('Vista inicial llama a setView con el centro y zoom por defecto', async () => {
    const user = userEvent.setup()
    render(<Geovisor />)
    await user.click(screen.getByTitle('Vista inicial'))
    expect(fakeMap.setView).toHaveBeenCalledWith([5.6878, -76.6581], 10)
  })
})

describe('Geovisor — geolocalización', () => {
  test('sin soporte de geolocalización, muestra un toast de error', async () => {
    const original = navigator.geolocation
    // @ts-expect-error - simular navegador sin soporte
    delete navigator.geolocation

    const user = userEvent.setup()
    render(<Geovisor />)
    await user.click(screen.getByTitle('Mi ubicación'))

    expect(await screen.findByText(/Geolocalización no disponible/i)).toBeInTheDocument()
    Object.defineProperty(navigator, 'geolocation', { value: original, configurable: true })
  })

  test('con ubicación encontrada, centra el mapa y muestra confirmación', async () => {
    const getCurrentPosition = vi.fn((success) => success({ coords: { latitude: 5.7, longitude: -76.6 } }))
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition }, configurable: true,
    })

    const user = userEvent.setup()
    render(<Geovisor />)
    await user.click(screen.getByTitle('Mi ubicación'))

    expect(fakeMap.setView).toHaveBeenCalledWith([5.7, -76.6], 13)
    expect(await screen.findByText('Ubicación encontrada')).toBeInTheDocument()
  })

  test('si el navegador niega el permiso, muestra un error sin romper la UI', async () => {
    const getCurrentPosition = vi.fn((_success, error) => error())
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition }, configurable: true,
    })

    const user = userEvent.setup()
    render(<Geovisor />)
    await user.click(screen.getByTitle('Mi ubicación'))

    expect(await screen.findByText('No se pudo obtener la ubicación')).toBeInTheDocument()
  })
})

describe('Geovisor — capas y basemap', () => {
  test('activar una capa incrementa el contador del badge', async () => {
    const user = userEvent.setup()
    render(<Geovisor />)
    // Por defecto: límites + ecosistemas activas (2)
    expect(screen.getByText('2')).toBeInTheDocument()

    await user.click(screen.getByText('Colectivos'))
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  test('cambiar de basemap marca el botón correspondiente como activo', async () => {
    const user = userEvent.setup()
    render(<Geovisor />)
    const oscuro = screen.getByTitle('Oscuro')
    await user.click(oscuro)
    expect(oscuro.className).toMatch(/border-primary-800/)
  })
})
