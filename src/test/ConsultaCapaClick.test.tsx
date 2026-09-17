import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { act } from 'react'
import ConsultaCapaClick from '@/components/geovisor-viewer/ConsultaCapaClick'
import type { CapaGeoserver, PresentacionGeovisor } from '@/types'

type ManejadoresClick = { click: (e: { latlng: { lat: number; lng: number }; target: unknown }) => void }
let manejadores: ManejadoresClick | null = null

vi.mock('react-leaflet', () => ({
  useMapEvents: (handlers: ManejadoresClick) => { manejadores = handlers; return {} },
  Popup: ({ children, eventHandlers }: { children: React.ReactNode; eventHandlers?: { remove?: () => void } }) => (
    <div data-testid="popup">
      <button onClick={() => eventHandlers?.remove?.()}>Cerrar</button>
      {children}
    </div>
  ),
}))

vi.mock('@/lib/geo/clickBuffer', () => ({
  bufferClicEnPixeles: vi.fn(() => ({ type: 'Polygon', coordinates: [[[0, 0]]] })),
}))

vi.mock('@/lib/api', () => ({ default: { get: vi.fn() } }))
import api from '@/lib/api'

vi.mock('@/components/geovisor-viewer/PopupCapaContenido', () => ({
  default: ({ resultados, cargando }: { resultados: unknown[] | null; cargando: boolean }) => (
    <div data-testid="contenido">
      {cargando ? 'cargando' : JSON.stringify(resultados)}
    </div>
  ),
}))

const capaUnidades: CapaGeoserver = { id: 't_15_geologia:unidades', nombre: 'Unidades geológicas', tipo: 'vectorial', tema: 'geologia' }
const capaFallas: CapaGeoserver = { id: 't_15_geologia:fallas', nombre: 'Fallas geológicas', tipo: 'vectorial', tema: 'geologia' }

function presentacion(): PresentacionGeovisor {
  return { mostrarMetricas: false, mostrarImagenes: false, camposPopup: [] }
}

const clickFalso = { latlng: { lat: 5.55, lng: -76.6 }, target: { latLngToContainerPoint: vi.fn(), containerPointToLatLng: vi.fn() } }

beforeEach(() => {
  vi.clearAllMocks()
  manejadores = null
})

describe('ConsultaCapaClick — sin capas activas', () => {
  test('un clic sin capas activas no abre el popup ni llama a la API', async () => {
    render(<ConsultaCapaClick slug="geologia-choco" capasActivas={[]} colorPorTema={{}} presentacion={presentacion()} />)

    await act(async () => { manejadores!.click(clickFalso) })

    expect(screen.queryByTestId('popup')).not.toBeInTheDocument()
    expect(api.get).not.toHaveBeenCalled()
  })
})

describe('ConsultaCapaClick — consulta al hacer clic', () => {
  test('consulta cada capa activa y muestra los resultados', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: { a: 1 } }] })
      .mockResolvedValueOnce({ type: 'FeatureCollection', features: [] })

    render(
      <ConsultaCapaClick
        slug="geologia-choco"
        capasActivas={[{ capa: capaUnidades, tema: 'geologia' }, { capa: capaFallas, tema: 'geologia' }]}
        colorPorTema={{ geologia: '#1B4332' }}
        presentacion={presentacion()}
      />,
    )

    await act(async () => { manejadores!.click(clickFalso) })

    expect(api.get).toHaveBeenCalledWith(
      '/geovisores/geologia-choco/capas/t_15_geologia%3Aunidades/consulta',
      expect.objectContaining({ params: { geometria: expect.any(String) } }),
    )
    expect(api.get).toHaveBeenCalledWith(
      '/geovisores/geologia-choco/capas/t_15_geologia%3Afallas/consulta',
      expect.objectContaining({ params: { geometria: expect.any(String) } }),
    )

    await waitFor(() => {
      const contenido = screen.getByTestId('contenido').textContent ?? ''
      expect(contenido).toContain('Unidades geológicas')
    })
  })

  test('si una capa falla, se marca con error y no rompe el resto', async () => {
    vi.mocked(api.get)
      .mockRejectedValueOnce(new Error('500'))
      .mockResolvedValueOnce({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: {} }] })

    render(
      <ConsultaCapaClick
        slug="geologia-choco"
        capasActivas={[{ capa: capaUnidades, tema: 'geologia' }, { capa: capaFallas, tema: 'geologia' }]}
        colorPorTema={{ geologia: '#1B4332' }}
        presentacion={presentacion()}
      />,
    )

    await act(async () => { manejadores!.click(clickFalso) })

    await waitFor(() => {
      const contenido = screen.getByTestId('contenido').textContent ?? ''
      expect(contenido).toContain('Fallas geológicas')
    })
  })

  test('cerrar el popup limpia el estado', async () => {
    vi.mocked(api.get).mockResolvedValue({ type: 'FeatureCollection', features: [] })

    render(
      <ConsultaCapaClick slug="geologia-choco" capasActivas={[{ capa: capaUnidades, tema: 'geologia' }]}
        colorPorTema={{}} presentacion={presentacion()} />,
    )

    await act(async () => { manejadores!.click(clickFalso) })
    expect(screen.getByTestId('popup')).toBeInTheDocument()

    screen.getByRole('button', { name: 'Cerrar' }).click()
    await waitFor(() => expect(screen.queryByTestId('popup')).not.toBeInTheDocument())
  })
})
