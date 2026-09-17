import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import HerramientasDibujo from '@/components/geovisor-viewer/HerramientasDibujo'
import type { AreaInteresState } from '@/components/geovisor-viewer/ControlAreaInteres'
import type { PresetArea } from '@/types'

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

// Handlers de dibujo falsos -- las pruebas no necesitan un Leaflet.draw real interactivo, solo que
// iniciarDibujo() los pueda enable()/disable() para validar la exclusión mutua, y que el listener
// draw:created (capturado desde el mapa falso) se pueda disparar a mano con un layer falso.
// L.GeometryUtil se mantiene real (importOriginal) porque hectareasDeGeometria/distanciaMetros sí
// deben calcular sobre la implementación geodésica real, no una inventada para la prueba.
const instanciasCreadas: { enable: ReturnType<typeof vi.fn>; disable: ReturnType<typeof vi.fn> }[] = []

vi.mock('leaflet-draw', async (importOriginal) => {
  const mod = await importOriginal<typeof import('leaflet-draw')>()
  const L = await import('leaflet')
  class HandlerFalso {
    enable = vi.fn()
    disable = vi.fn()
    constructor() { instanciasCreadas.push(this) }
  }
  const LDraw = (L as any).Draw
  LDraw.Polygon = HandlerFalso
  LDraw.Rectangle = HandlerFalso
  LDraw.Polyline = HandlerFalso
  return mod
})

let onCreatedCapturado: ((e: unknown) => void) | null = null
const mapaFalso = {
  on: vi.fn((evento: string, cb: (e: unknown) => void) => {
    if (evento === 'draw:created') onCreatedCapturado = cb
  }),
  off: vi.fn(),
  fitBounds: vi.fn(),
}

vi.mock('react-leaflet', () => ({
  GeoJSON: ({ pathOptions }: { pathOptions: unknown }) => <div data-testid="geojson-shape">{JSON.stringify(pathOptions)}</div>,
  useMap: () => mapaFalso,
}))

const presetsFixture: PresetArea[] = [
  { nombre: 'Cuenca Atrato', geometria: { type: 'Polygon', coordinates: [[[-76.60, 5.55], [-76.59, 5.55], [-76.59, 5.56], [-76.60, 5.56], [-76.60, 5.55]]] } },
]

function makeLayerFalso(geometryType: 'Polygon' | 'LineString', coordinates: unknown) {
  return {
    toGeoJSON: () => ({ type: 'Feature', geometry: { type: geometryType, coordinates } }),
    getLatLngs: () => [{ lat: 5.55, lng: -76.60 }, { lat: 5.55, lng: -76.59 }].map((p) => Object.assign(p, {
      distanceTo: (o: { lat: number; lng: number }) => Math.hypot(p.lat - o.lat, p.lng - o.lng) * 111_320,
    })),
  }
}

function renderHerramientas(props: Partial<Parameters<typeof HerramientasDibujo>[0]> = {}) {
  const onCambiarArea = vi.fn()
  const utils = render(
    <HerramientasDibujo
      presetsArea={presetsFixture}
      areaMaxHa={undefined}
      areaActual={null}
      onCambiarArea={onCambiarArea}
      {...props}
    />,
  )
  return { ...utils, onCambiarArea }
}

beforeEach(() => {
  vi.clearAllMocks()
  onCreatedCapturado = null
  instanciasCreadas.length = 0
})

describe('HerramientasDibujo — exclusión mutua entre Área y Medición', () => {
  test('empezar a medir distancia desactiva el handler de área que estaba activo', async () => {
    const user = userEvent.setup()
    renderHerramientas()

    await user.click(screen.getByRole('button', { name: /Polígono/i }))
    expect(instanciasCreadas).toHaveLength(1)
    expect(instanciasCreadas[0].enable).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: /Distancia/i }))
    expect(instanciasCreadas).toHaveLength(2)
    // El handler de Área (instancia 0) se desactiva al iniciar Medición (instancia 1) -- así es
    // como se evita el bug real de producto6: dos handlers de dibujo activos a la vez corrompen
    // el estado del mapa y borran capas ya pintadas.
    expect(instanciasCreadas[0].disable).toHaveBeenCalledTimes(1)
    expect(instanciasCreadas[1].enable).toHaveBeenCalledTimes(1)
  })
})

describe('HerramientasDibujo — área de interés dibujada', () => {
  test('un polígono válido llama a onCambiarArea con las hectáreas calculadas', async () => {
    const user = userEvent.setup()
    const { onCambiarArea } = renderHerramientas()

    await user.click(screen.getByRole('button', { name: /Polígono/i }))
    expect(onCreatedCapturado).toBeTruthy()

    const layer = makeLayerFalso('Polygon', [[[-76.60, 5.55], [-76.59, 5.55], [-76.59, 5.56], [-76.60, 5.56], [-76.60, 5.55]]])
    onCreatedCapturado!({ layerType: 'polygon', layer })

    expect(onCambiarArea).toHaveBeenCalledTimes(1)
    const area = onCambiarArea.mock.calls[0][0] as AreaInteresState
    expect(area.nombre).toBe('Área dibujada')
    expect(area.hectareas).toBeGreaterThan(0)
  })

  test('un polígono que supera areaMaxHa muestra el error y no llama a onCambiarArea', async () => {
    const user = userEvent.setup()
    const { onCambiarArea } = renderHerramientas({ areaMaxHa: 1 })

    await user.click(screen.getByRole('button', { name: /Polígono/i }))
    const layer = makeLayerFalso('Polygon', [[[-76.60, 5.55], [-76.59, 5.55], [-76.59, 5.56], [-76.60, 5.56], [-76.60, 5.55]]])
    onCreatedCapturado!({ layerType: 'polygon', layer })

    expect(onCambiarArea).not.toHaveBeenCalled()
    expect(await screen.findByText(/supera el máximo permitido/i)).toBeInTheDocument()
  })

  test('aplicar un preset llama a onCambiarArea y centra el mapa', async () => {
    const user = userEvent.setup()
    const { onCambiarArea } = renderHerramientas()

    await user.click(screen.getByRole('button', { name: 'Cuenca Atrato' }))

    expect(onCambiarArea).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Cuenca Atrato' }))
    expect(mapaFalso.fitBounds).toHaveBeenCalled()
  })

  test('quitar el área activa llama a onCambiarArea(null)', async () => {
    const user = userEvent.setup()
    const areaActual: AreaInteresState = { nombre: 'Área dibujada', geometria: presetsFixture[0].geometria, hectareas: 10 }
    const { onCambiarArea } = renderHerramientas({ areaActual })

    await user.click(screen.getByTitle('Quitar área'))
    expect(onCambiarArea).toHaveBeenCalledWith(null)
  })
})

describe('HerramientasDibujo — medición', () => {
  test('medir distancia muestra el resultado sin llamar a onCambiarArea', async () => {
    const user = userEvent.setup()
    const { onCambiarArea } = renderHerramientas()

    await user.click(screen.getByRole('button', { name: /Distancia/i }))
    const layer = makeLayerFalso('LineString', [[-76.60, 5.55], [-76.59, 5.55]])
    onCreatedCapturado!({ layerType: 'polyline', layer })

    expect(await screen.findByText(/Distancia:/i)).toBeInTheDocument()
    expect(onCambiarArea).not.toHaveBeenCalled()
  })

  test('medir área muestra el resultado y no lo confunde con área de interés', async () => {
    const user = userEvent.setup()
    const { onCambiarArea } = renderHerramientas()

    await user.click(screen.getByRole('button', { name: /^Área$/i }))
    const layer = makeLayerFalso('Polygon', [[[-76.60, 5.55], [-76.59, 5.55], [-76.59, 5.56], [-76.60, 5.56], [-76.60, 5.55]]])
    onCreatedCapturado!({ layerType: 'polygon', layer })

    expect(await screen.findByText(/^Área:/i)).toBeInTheDocument()
    expect(onCambiarArea).not.toHaveBeenCalled()
  })

  test('limpiar la medición quita el resultado', async () => {
    const user = userEvent.setup()
    renderHerramientas()

    await user.click(screen.getByRole('button', { name: /Distancia/i }))
    const layer = makeLayerFalso('LineString', [[-76.60, 5.55], [-76.59, 5.55]])
    onCreatedCapturado!({ layerType: 'polyline', layer })
    expect(await screen.findByText(/Distancia:/i)).toBeInTheDocument()

    await user.click(screen.getByTitle('Limpiar medición'))
    expect(screen.queryByText(/Distancia:/i)).not.toBeInTheDocument()
  })
})
