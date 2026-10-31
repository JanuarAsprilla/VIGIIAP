import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import L from 'leaflet'
import 'leaflet.markercluster'
import type { RegistroBiodiversidad, RespuestaPuntos } from '@/components/herramientas/biodiversidad/types'

const puntos = vi.hoisted(() => ({ llamadas: [] as unknown[][], q: {} as Record<string, unknown> }))
vi.mock('@/hooks/useBiodiversidad', () => ({
  useBiodiversidadPuntos: (...a: unknown[]) => { puntos.llamadas.push(a); return puntos.q },
}))
vi.mock('@/components/herramientas/biodiversidad/mapa/geoMunicipios', () => ({ useGeoMunicipios: () => ({ data: undefined }) }))
vi.mock('@/components/herramientas/biodiversidad/mapa/MiniMapa', () => ({
  default: (p: { descripcion: string; lat: number; lon: number }) => <div data-testid="minimapa" role="img" aria-label={p.descripcion} />,
}))

import CapaPuntos from '@/components/herramientas/biodiversidad/mapa/CapaPuntos'
import { InterruptorPuntos, MensajesPuntos } from '@/components/herramientas/biodiversidad/mapa/ControlPuntos'
import { INFO_INICIAL, type InfoPuntos } from '@/components/herramientas/biodiversidad/mapa/tiposPuntos'
import UbicacionDetalle from '@/components/herramientas/biodiversidad/registros/UbicacionDetalle'

const resp = (over: Partial<RespuestaPuntos> = {}): RespuestaPuntos => ({
  grupo: 'anfibios', total: 3, mostrados: 3, ocultos: 5079, muestreado: false, puntos: [
    { id: '1', lat: 5.5, lon: -76.6, e: 'Rhinella marina', ek: 'K', a: null },
    { id: '2', lat: 5.6, lon: -76.7, e: null, ek: null, a: null },
    { id: '3', lat: 5.7, lon: -76.8, e: 'Boana pugnax<img src=x onerror=1>', ek: 'K3', a: null },
  ], ...over,
})

function montarMapa() {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const mapa = L.map(el, { center: [5.5, -76.6], zoom: 8, minZoom: 3, maxZoom: 13 })
  return { mapa, el }
}
const racimos = (mapa: L.Map) => { const r: L.MarkerClusterGroup[] = []; mapa.eachLayer((l) => { if (l instanceof L.MarkerClusterGroup) r.push(l) }); return r }

beforeEach(() => {
  puntos.llamadas = []
  puntos.q = { data: resp(), isFetching: false, isError: false, error: null, refetch: vi.fn() }
})
afterEach(() => { vi.useRealTimers(); document.body.innerHTML = '' })

describe('CapaPuntos', () => {
  test('dibuja un marcador por punto válido y reporta total, ocultos y muestreo', async () => {
    const { mapa } = montarMapa()
    const onInfo = vi.fn()
    render(<CapaPuntos mapa={mapa} grupo="anfibios" params={{ familia: 'Hylidae' }} enfoque={null} onAbrir={vi.fn()} onInfo={onInfo} />)
    await waitFor(() => expect(racimos(mapa)[0]?.getLayers()).toHaveLength(3))
    const ultima = onInfo.mock.calls[onInfo.mock.calls.length - 1][0] as InfoPuntos
    expect(ultima).toMatchObject({ total: 3, mostrados: 3, ocultos: 5079, muestreado: false, listo: true })
  })
  test('pide /puntos con los filtros y el recuadro redondeado, y nunca dibuja puntos marcados como ocultos', async () => {
    puntos.q = { ...puntos.q, data: resp({ puntos: [
      { id: '1', lat: 5.5, lon: -76.6, e: 'x', ek: 'K', a: null },
      { id: '9', lat: 5.5, lon: -76.6, e: 'oculto', ek: 'K', a: null, coordenadas_ocultas: true } as never,
      { id: '8', lat: 99, lon: -76.6, e: 'fuera', ek: 'K', a: null },
    ] }) }
    const { mapa } = montarMapa()
    render(<CapaPuntos mapa={mapa} grupo="anfibios" params={{ familia: 'Hylidae' }} enfoque={null} onAbrir={vi.fn()} onInfo={vi.fn()} />)
    await waitFor(() => expect(racimos(mapa)[0]?.getLayers()).toHaveLength(1))
    const ultima = puntos.llamadas[puntos.llamadas.length - 1]
    expect(ultima[0]).toBe('anfibios')
    expect(ultima[1]).toMatchObject({ familia: 'Hylidae', bbox: expect.stringMatching(/^-?[\d.]+,-?[\d.]+,-?[\d.]+,-?[\d.]+$/) })
    expect(ultima[2]).toBe(true)
  })
  test('el popup muestra el nombre como texto (sin HTML) y «Ver detalle» abre el registro', async () => {
    const { mapa } = montarMapa()
    const onAbrir = vi.fn()
    render(<CapaPuntos mapa={mapa} grupo="anfibios" params={{}} enfoque={null} onAbrir={onAbrir} onInfo={vi.fn()} />)
    await waitFor(() => expect(racimos(mapa)[0]?.getLayers()).toHaveLength(3))
    const marcador = racimos(mapa)[0].getLayers().find((l) => (l as L.CircleMarker).getLatLng().lat === 5.7) as L.CircleMarker
    const contenido = marcador.getPopup()?.getContent() as HTMLElement
    expect(contenido.querySelector('img')).toBeNull()
    expect(contenido.textContent).toContain('Boana pugnax<img src=x onerror=1>')
    act(() => { (contenido.querySelector('button') as HTMLButtonElement).click() })
    expect(onAbrir).toHaveBeenCalledWith('3', expect.any(HTMLElement))
  })
  test('enfocar un registro público centra el mapa y dibuja el anillo; sin enfoque lo retira', async () => {
    const { mapa } = montarMapa()
    const { rerender } = render(<CapaPuntos mapa={mapa} grupo="anfibios" params={{}} enfoque={{ id: '1', lat: 6.1, lon: -77.2, vez: 1 }} onAbrir={vi.fn()} onInfo={vi.fn()} />)
    expect(mapa.getCenter().lat).toBeCloseTo(6.1, 1)
    expect(mapa.getZoom()).toBeGreaterThanOrEqual(11)
    expect(document.querySelector('.bio-punto-foco')).not.toBeNull()
    rerender(<CapaPuntos mapa={mapa} grupo="anfibios" params={{}} enfoque={null} onAbrir={vi.fn()} onInfo={vi.fn()} />)
    expect(document.querySelector('.bio-punto-foco')).toBeNull()
  })
  test('mover el mapa solo actualiza el recuadro tras la espera (una consulta, no una por movimiento)', () => {
    vi.useFakeTimers()
    const { mapa } = montarMapa()
    render(<CapaPuntos mapa={mapa} grupo="anfibios" params={{}} enfoque={null} onAbrir={vi.fn()} onInfo={vi.fn()} />)
    const bbox = () => new Set(puntos.llamadas.filter((l) => l[2] === true).map((l) => (l[1] as { bbox: string }).bbox))
    const inicial = [...bbox()]
    act(() => { mapa.setView([4.0, -75.0], 8, { animate: false }); mapa.setView([3.0, -74.0], 8, { animate: false }) })
    act(() => { vi.advanceTimersByTime(200) })
    expect(bbox().size).toBe(inicial.length)
    act(() => { vi.advanceTimersByTime(400) })
    expect(bbox().size).toBe(inicial.length + 1)
  })
})

describe('mensajes de la capa', () => {
  const info = (c: Partial<InfoPuntos> = {}): InfoPuntos => ({ ...INFO_INICIAL, listo: true, cargando: false, total: 4194, mostrados: 1500, ocultos: 5079, muestreado: true, ...c })
  test('ubicaciones reservadas y muestra: mensajes persistentes y claros', () => {
    render(<MensajesPuntos info={info()} onReintentar={vi.fn()} />)
    expect(screen.getByText('5.079 registros de especies amenazadas o sin determinar no muestran su ubicación para protegerlas.')).toBeInTheDocument()
    expect(screen.getByText(/Mostrando una muestra de 1\.500 de 4\.194 registros/)).toBeInTheDocument()
    expect(screen.getByText(/1\.500 puntos en pantalla/)).toBeInTheDocument()
  })
  test('sin muestreo ni ocultos solo informa los puntos; vacío y cargando tienen su texto', () => {
    const { rerender } = render(<MensajesPuntos info={info({ muestreado: false, ocultos: 0, mostrados: 3, total: 3 })} onReintentar={vi.fn()} />)
    expect(screen.queryByText(/muestra de/)).not.toBeInTheDocument()
    expect(screen.queryByText(/no muestran su ubicación/)).not.toBeInTheDocument()
    rerender(<MensajesPuntos info={info({ total: 0, mostrados: 0, ocultos: 12 })} onReintentar={vi.fn()} />)
    expect(screen.getByText(/No hay ubicaciones visibles en esta zona/)).toBeInTheDocument()
    expect(screen.getByText(/12 registros .* no muestran/)).toBeInTheDocument()
    rerender(<MensajesPuntos info={INFO_INICIAL} onReintentar={vi.fn()} />)
    expect(screen.getByText('Cargando ubicaciones…')).toBeInTheDocument()
  })
  test('error con reintento', async () => {
    const reintentar = vi.fn()
    render(<MensajesPuntos info={{ ...INFO_INICIAL, cargando: false, error: { status: 429 }, reintentar }} onReintentar={reintentar} />)
    await userEvent.click(screen.getByRole('button', { name: /Reintentar/ }))
    expect(reintentar).toHaveBeenCalled()
  })
  test('interruptor: conmuta y se deshabilita en grupos agregados', async () => {
    const onCambio = vi.fn()
    const { rerender } = render(<InterruptorPuntos activo={false} disponible onCambio={onCambio} />)
    await userEvent.click(screen.getByRole('switch', { name: 'Puntos de registros' }))
    expect(onCambio).toHaveBeenCalledWith(true)
    rerender(<InterruptorPuntos activo disponible={false} onCambio={onCambio} />)
    expect(screen.getByRole('switch', { name: 'Puntos de registros' })).toBeDisabled()
  })
})

describe('UbicacionDetalle', () => {
  const r = (c: Partial<RegistroBiodiversidad> = {}) => ({
    gbif_id: '1', especie: 'Rhinella marina', municipio: 'Turbo', departamento: 'Antioquia', codigo_municipal: '05837',
    latitud: 8.0882, longitud: -76.8368, incertidumbre_m: 20, coordenadas_ocultas: false, ...c,
  }) as RegistroBiodiversidad
  test('pública: mini-mapa descrito, coordenadas, incertidumbre y botón copiar', async () => {
    const copiar = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: copiar }, configurable: true })
    render(<UbicacionDetalle r={r()} />)
    expect(await screen.findByTestId('minimapa')).toHaveAccessibleName(/Turbo, Antioquia.*8,08820, -76,83680 ± 20 m/)
    expect(screen.getByText(/8,08820, -76,83680 ± 20 m/, { selector: 'p' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Copiar coordenadas/ }))
    expect(copiar).toHaveBeenCalledWith('8.0882, -76.8368')
    expect(await screen.findByText('Coordenadas copiadas')).toBeInTheDocument()
  })
  test('copiar falla con aviso claro cuando el navegador no lo permite', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockRejectedValue(new Error('no')) }, configurable: true })
    render(<UbicacionDetalle r={r()} />)
    await userEvent.click(screen.getByRole('button', { name: /Copiar coordenadas/ }))
    expect(await screen.findByText(/No se pudo copiar/)).toBeInTheDocument()
  })
  test('reservada: panel explicativo, sin mini-mapa ni coordenadas, aunque lleguen en el objeto', () => {
    const { container } = render(<UbicacionDetalle r={r({ coordenadas_ocultas: true })} onVerEnMapa={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Ubicación reservada' })).toBeInTheDocument()
    expect(screen.getByText(/no muestran su ubicación para evitar daños/)).toBeInTheDocument()
    expect(screen.queryByTestId('minimapa')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Copiar|mapa general/ })).not.toBeInTheDocument()
    expect(container.textContent).not.toMatch(/8[,.]0882|76[,.]8368/)
  })
  test('sin coordenadas y no reservado: explica que el publicador no las entregó', () => {
    render(<UbicacionDetalle r={r({ latitud: null, longitud: null })} />)
    expect(screen.getByText(/El publicador no entregó coordenadas/)).toBeInTheDocument()
  })
  test('«Ver en el mapa general» solo con ubicación pública', async () => {
    const onVer = vi.fn()
    render(<UbicacionDetalle r={r()} onVerEnMapa={onVer} />)
    await userEvent.click(screen.getByRole('button', { name: /Ver en el mapa general/ }))
    expect(onVer).toHaveBeenCalled()
  })
})
