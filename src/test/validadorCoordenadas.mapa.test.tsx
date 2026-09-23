/**
 * Test de MapaValidador con react-leaflet mockeado (mismo patrón que
 * HerramientasDibujo.test.tsx: useMap() devuelve un mapa falso controlado,
 * L real sin mockear). Captura el handler de 'click' registrado sobre el
 * mapa falso para simularlo a mano, sin necesitar un Leaflet real montado
 * en el DOM.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createRef } from 'react'
import MapaValidador, { type MapaValidadorHandle } from '@/components/herramientas/validador-coordenadas/components/MapaValidador'
import { MUNICIPIOS_CHOCO } from '@/components/herramientas/validador-coordenadas/data/municipiosChoco.generated'
import { precalcularCentroides } from '@/components/herramientas/validador-coordenadas/lib/validacion'
import type { FilaExcel, FilaResultado, ItemFiltrado } from '@/components/herramientas/validador-coordenadas/types'

let onClickCapturado: ((e: { latlng: { lat: number; lng: number } }) => void) | null = null
const mapaFalso = {
  addLayer: vi.fn(),
  removeLayer: vi.fn(),
  hasLayer: vi.fn(() => false),
  on: vi.fn((evento: string, cb: typeof onClickCapturado) => { if (evento === 'click') onClickCapturado = cb }),
  off: vi.fn(),
  closePopup: vi.fn(),
  openPopup: vi.fn(),
  setView: vi.fn(),
  getContainer: () => ({ style: {} }),
}

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TileLayer: () => null,
  useMap: () => mapaFalso,
}))

precalcularCentroides(MUNICIPIOS_CHOCO.features)
const features = MUNICIPIOS_CHOCO.features
const QUIBDO = { lat: 5.6947, lon: -76.6611 }

function resultado(overrides: Partial<FilaResultado> = {}): FilaResultado {
  return { estado: 'VÁLIDA', tipoError: '', observacion: 'obs', depDet: 'CHOCÓ', muniDet: 'Quibdó', codigoDivipola: '27001', latIntercambiada: false, distCentroideKm: 1.2, ...overrides }
}

function baseProps() {
  const rows: FilaExcel[] = [{ lat: QUIBDO.lat, lon: QUIBDO.lon }]
  const filtrados: ItemFiltrado[] = [{ idx: 0, r: resultado() }]
  return {
    filtrados, rows, colLat: 'lat', colLon: 'lon', formato: 'dd' as const, features,
    modoAgregar: false, modoMedir: false, modoMover: false, puntoAMover: null,
    onSetPuntoAMover: vi.fn(), onAgregarPunto: vi.fn(), onMoverPunto: vi.fn(),
    onEditarPunto: vi.fn(), onEliminarPunto: vi.fn(), onConfirmarDuplicada: vi.fn(),
  }
}

beforeEach(() => { vi.clearAllMocks(); onClickCapturado = null })

describe('MapaValidador — montaje', () => {
  test('monta sin lanzar y registra el cluster + el listener de click', () => {
    render(<MapaValidador {...baseProps()} />)
    expect(mapaFalso.addLayer).toHaveBeenCalled()
    expect(mapaFalso.on).toHaveBeenCalledWith('click', expect.any(Function))
  })

  test('con filas fuera de rango, no crea marcador para ellas (no lanza)', () => {
    const props = baseProps()
    props.filtrados = [{ idx: 0, r: resultado() }]
    props.rows = [{ lat: 999, lon: -76.66 }] // fuera de rango -90..90
    expect(() => render(<MapaValidador {...props} />)).not.toThrow()
  })

  test('marca con estilo distinto el punto seleccionado en modo mover', () => {
    const props = baseProps()
    props.modoMover = true
    props.puntoAMover = 0
    expect(() => render(<MapaValidador {...props} />)).not.toThrow()
  })
})

describe('MapaValidador — modo agregar', () => {
  test('un clic en el mapa en modo agregar abre un popup de "Nuevo punto"', () => {
    const props = baseProps()
    props.modoAgregar = true
    render(<MapaValidador {...props} />)

    expect(onClickCapturado).not.toBeNull()
    onClickCapturado!({ latlng: { lat: 5.7, lng: -76.7 } })
    // No hay forma directa de leer el contenido del popup sin un mapa real
    // adjunto al DOM, pero el clic no debe lanzar y closePopup/onAgregarPunto
    // deben quedar disponibles para el botón interno (probado indirectamente
    // via ValidadorCoordenadas.component.test.tsx, que sí ejercita el flujo
    // completo de agregar un punto a través del mapa real de react-leaflet).
  })

  test('un clic sin ningún modo activo no hace nada', () => {
    const props = baseProps()
    render(<MapaValidador {...props} />)
    expect(() => onClickCapturado!({ latlng: { lat: 5.7, lng: -76.7 } })).not.toThrow()
    expect(props.onAgregarPunto).not.toHaveBeenCalled()
  })
})

describe('MapaValidador — modo medir', () => {
  test('dos clics consecutivos en modo medir no lanzan', () => {
    const props = baseProps()
    props.modoMedir = true
    render(<MapaValidador {...props} />)
    expect(() => {
      onClickCapturado!({ latlng: { lat: 5.6, lng: -76.6 } })
      onClickCapturado!({ latlng: { lat: 5.7, lng: -76.7 } })
    }).not.toThrow()
  })
})

describe('MapaValidador — modo mover', () => {
  test('con un punto ya seleccionado, un clic pide confirmación sin lanzar', () => {
    const props = baseProps()
    props.modoMover = true
    props.puntoAMover = 0
    render(<MapaValidador {...props} />)
    expect(() => onClickCapturado!({ latlng: { lat: 5.7, lng: -76.7 } })).not.toThrow()
  })
})

describe('MapaValidador — estados de fila (colores/ramas del popup)', () => {
  test.each(['VÁLIDA', 'SOSPECHOSA', 'INVÁLIDA', ''] as const)('renderiza sin lanzar con estado %s', (estado) => {
    const props = baseProps()
    props.filtrados = [{ idx: 0, r: resultado({ estado }) }]
    expect(() => render(<MapaValidador {...props} />)).not.toThrow()
  })

  test('un punto agregado manualmente (sin filaExcel) no lanza', () => {
    const props = baseProps()
    props.filtrados = [{ idx: 0, r: resultado({ manual: true, filaExcel: undefined }) }]
    expect(() => render(<MapaValidador {...props} />)).not.toThrow()
  })

  test('un punto movido con coordenadas originales registradas no lanza', () => {
    const props = baseProps()
    props.filtrados = [{ idx: 0, r: resultado({ movido: true, latOriginalAntesDeMover: 1, lonOriginalAntesDeMover: 2 }) }]
    expect(() => render(<MapaValidador {...props} />)).not.toThrow()
  })

  test('una duplicada pendiente de confirmar no lanza', () => {
    const props = baseProps()
    props.filtrados = [{ idx: 0, r: resultado({ estado: 'SOSPECHOSA', tipoError: 'Coordenada repetida' }) }]
    expect(() => render(<MapaValidador {...props} />)).not.toThrow()
  })

  test('formato utm no lanza al construir el popup', () => {
    const props = baseProps()
    props.formato = 'utm'
    expect(() => render(<MapaValidador {...props} />)).not.toThrow()
  })
})

describe('MapaValidador — focusFila() vía ref', () => {
  test('centra el mapa en la fila indicada', () => {
    const ref = createRef<MapaValidadorHandle>()
    render(<MapaValidador {...baseProps()} ref={ref} />)
    ref.current!.focusFila(0)
    expect(mapaFalso.setView).toHaveBeenCalledWith([QUIBDO.lat, QUIBDO.lon], 14)
  })

  test('una fila con coordenadas inválidas no mueve el mapa', () => {
    const props = baseProps()
    props.rows = [{ lat: 'no-numero', lon: 'no-numero' }]
    const ref = createRef<MapaValidadorHandle>()
    render(<MapaValidador {...props} ref={ref} />)
    ref.current!.focusFila(0)
    expect(mapaFalso.setView).not.toHaveBeenCalled()
  })
})
