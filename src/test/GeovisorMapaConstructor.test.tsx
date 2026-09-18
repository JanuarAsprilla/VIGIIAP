import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import GeovisorMapaConstructor from '@/components/admin/geovisores/GeovisorMapaConstructor'
import type { WorkspaceOption } from '@/types'

let onMoveEndCapturado: ((e: unknown) => void) | null = null

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="mapa">{children}</div>,
  WMSTileLayer: ({ url, params }: { url: string; params: Record<string, unknown> }) => (
    <div data-testid="wms-layer" data-url={url} data-layers={params.layers as string} />
  ),
  useMapEvents: (handlers: { moveend: (e: unknown) => void }) => {
    onMoveEndCapturado = handlers.moveend
    return null
  },
}))

vi.mock('@/components/geovisor-viewer/BasemapCapas', () => ({
  default: ({ basemapId }: { basemapId: string }) => <div data-testid="basemap">{basemapId}</div>,
}))

vi.mock('@/components/admin/geovisores/DibujarPresetArea', () => ({
  default: ({ presets }: { presets: { nombre: string }[] }) => (
    <div data-testid="dibujar-preset">{presets.map((p) => p.nombre).join(',')}</div>
  ),
}))

const workspacesFixture: WorkspaceOption[] = [
  { id: 't_15_geologia', nombre: 'Geologia', totalCapas: 2, capas: [
    { id: 't_15_geologia:fallas', nombre: 'Fallas', tipo: 'vectorial' },
    { id: 't_15_geologia:unidades', nombre: 'Unidades', tipo: 'vectorial' },
  ] },
  { id: 't_20_hidrologia', nombre: 'Hidrologia', totalCapas: 1, capas: [
    { id: 't_20_hidrologia:rios', nombre: 'Ríos', tipo: 'vectorial' },
  ] },
]

function baseProps(overrides: Partial<Parameters<typeof GeovisorMapaConstructor>[0]> = {}) {
  return {
    conexionId: 'c1',
    workspacesSeleccionados: [],
    centroLat: 5.55,
    centroLng: -76.6,
    zoomInicial: 8,
    basemap: 'calles',
    presetsArea: [],
    onMoverMapa: vi.fn(),
    onAgregarPreset: vi.fn(),
    onEliminarPreset: vi.fn(),
    ...overrides,
  }
}

describe('GeovisorMapaConstructor — sin conexión', () => {
  test('muestra el mensaje de "elige una conexión" en vez del mapa', () => {
    render(<GeovisorMapaConstructor {...baseProps({ conexionId: null })} />)
    expect(screen.getByText(/Elige una conexión GeoServer/i)).toBeInTheDocument()
    expect(screen.queryByTestId('mapa')).not.toBeInTheDocument()
  })
})

describe('GeovisorMapaConstructor — capas en vivo', () => {
  test('sin workspaces seleccionados no pinta ninguna capa WMS', () => {
    render(<GeovisorMapaConstructor {...baseProps()} />)
    expect(screen.queryAllByTestId('wms-layer')).toHaveLength(0)
  })

  test('pinta una capa WMS por cada capa de los workspaces seleccionados, apuntando a la conexión', () => {
    render(<GeovisorMapaConstructor {...baseProps({ workspacesSeleccionados: workspacesFixture })} />)
    const capas = screen.getAllByTestId('wms-layer')
    expect(capas).toHaveLength(3)
    expect(capas[0]).toHaveAttribute('data-layers', 't_15_geologia:fallas')
    expect(capas.every((c) => c.getAttribute('data-url')?.includes('/admin/conexiones-geoserver/c1/wms'))).toBe(true)
  })

  test('pasa el basemap elegido a BasemapCapas', () => {
    render(<GeovisorMapaConstructor {...baseProps({ basemap: 'satelite' })} />)
    expect(screen.getByTestId('basemap')).toHaveTextContent('satelite')
  })
})

describe('GeovisorMapaConstructor — sincronización de vista', () => {
  test('moveend del mapa llama a onMoverMapa con lat/lng/zoom redondeados', () => {
    const onMoverMapa = vi.fn()
    render(<GeovisorMapaConstructor {...baseProps({ onMoverMapa })} />)

    expect(onMoveEndCapturado).toBeTruthy()
    const eventoFalso = {
      target: {
        getCenter: () => ({ lat: 6.123456789, lng: -77.987654321 }),
        getZoom: () => 11,
      },
    }
    onMoveEndCapturado!(eventoFalso)

    expect(onMoverMapa).toHaveBeenCalledWith(6.123457, -77.987654, 11)
  })
})

describe('GeovisorMapaConstructor — presets de área', () => {
  test('pasa los presets actuales a DibujarPresetArea', () => {
    render(<GeovisorMapaConstructor {...baseProps({ presetsArea: [{ nombre: 'Zona norte', geometria: { type: 'Polygon', coordinates: [] } }] })} />)
    expect(screen.getByTestId('dibujar-preset')).toHaveTextContent('Zona norte')
  })
})
