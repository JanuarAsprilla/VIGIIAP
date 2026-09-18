import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DibujarPresetArea from '@/components/admin/geovisores/DibujarPresetArea'
import type { PresetArea } from '@/types'

const instanciasCreadas: { enable: ReturnType<typeof vi.fn>; disable: ReturnType<typeof vi.fn> }[] = []

vi.mock('leaflet-draw', async (importOriginal) => {
  const mod = await importOriginal<typeof import('leaflet-draw')>()
  const L = await import('leaflet')
  class HandlerFalso {
    enable = vi.fn()
    disable = vi.fn()
    constructor() { instanciasCreadas.push(this) }
  }
  ;(L as unknown as { Draw: { Polygon: unknown } }).Draw.Polygon = HandlerFalso
  return mod
})

let onCreatedCapturado: ((e: unknown) => void) | null = null
const mapaFalso = {
  on: vi.fn((evento: string, cb: (e: unknown) => void) => {
    if (evento === 'draw:created') onCreatedCapturado = cb
  }),
  off: vi.fn(),
}

vi.mock('react-leaflet', () => ({
  GeoJSON: ({ pathOptions }: { pathOptions: unknown }) => <div data-testid="geojson-shape">{JSON.stringify(pathOptions)}</div>,
  useMap: () => mapaFalso,
}))

function makeLayerFalso(coordinates: unknown) {
  return {
    toGeoJSON: () => ({ type: 'Feature', geometry: { type: 'Polygon', coordinates } }),
    addTo: vi.fn().mockReturnThis(),
    remove: vi.fn(),
  }
}

const POLIGONO = [[[-76.60, 5.55], [-76.59, 5.55], [-76.59, 5.56], [-76.60, 5.56], [-76.60, 5.55]]]

const presetsFixture: PresetArea[] = [
  { nombre: 'Cuenca Atrato', geometria: { type: 'Polygon', coordinates: POLIGONO } },
]

function renderComponente(props: Partial<Parameters<typeof DibujarPresetArea>[0]> = {}) {
  const onAgregar = vi.fn()
  const onEliminar = vi.fn()
  const utils = render(
    <DibujarPresetArea presets={[]} onAgregar={onAgregar} onEliminar={onEliminar} {...props} />,
  )
  return { ...utils, onAgregar, onEliminar }
}

beforeEach(() => {
  vi.clearAllMocks()
  onCreatedCapturado = null
  instanciasCreadas.length = 0
})

describe('DibujarPresetArea — dibujar y guardar', () => {
  test('dibujar un polígono muestra el formulario de nombre con las hectáreas calculadas', async () => {
    const user = userEvent.setup()
    renderComponente()

    await user.click(screen.getByRole('button', { name: /Dibujar preset de área/i }))
    expect(instanciasCreadas).toHaveLength(1)

    onCreatedCapturado!({ layer: makeLayerFalso(POLIGONO) })

    expect(await screen.findByLabelText('Nombre del preset')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Guardar/i })).toBeDisabled()
  })

  test('escribir un nombre y guardar llama a onAgregar con el preset completo', async () => {
    const user = userEvent.setup()
    const { onAgregar } = renderComponente()

    await user.click(screen.getByRole('button', { name: /Dibujar preset de área/i }))
    onCreatedCapturado!({ layer: makeLayerFalso(POLIGONO) })

    await user.type(await screen.findByLabelText('Nombre del preset'), 'Zona norte')
    await user.click(screen.getByRole('button', { name: /Guardar/i }))

    expect(onAgregar).toHaveBeenCalledWith({
      nombre: 'Zona norte',
      geometria: { type: 'Polygon', coordinates: POLIGONO },
    })
  })

  test('descartar oculta el formulario sin llamar a onAgregar', async () => {
    const user = userEvent.setup()
    const { onAgregar } = renderComponente()

    await user.click(screen.getByRole('button', { name: /Dibujar preset de área/i }))
    onCreatedCapturado!({ layer: makeLayerFalso(POLIGONO) })
    await user.type(await screen.findByLabelText('Nombre del preset'), 'Descartado')
    await user.click(screen.getByRole('button', { name: /Descartar/i }))

    expect(onAgregar).not.toHaveBeenCalled()
    expect(screen.queryByLabelText('Nombre del preset')).not.toBeInTheDocument()
  })
})

describe('DibujarPresetArea — lista de presets existentes', () => {
  test('lista los presets ya guardados y permite eliminarlos', async () => {
    const user = userEvent.setup()
    const { onEliminar } = renderComponente({ presets: presetsFixture })

    expect(screen.getByText('Cuenca Atrato')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Eliminar preset Cuenca Atrato/i }))
    expect(onEliminar).toHaveBeenCalledWith('Cuenca Atrato')
  })
})
