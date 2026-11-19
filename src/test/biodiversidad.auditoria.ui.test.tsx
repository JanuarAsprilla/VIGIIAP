import { describe, test, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest'
import { render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import L from 'leaflet'
import 'leaflet.markercluster'
import type { MunicipioConteo, RespuestaPuntos } from '@/components/herramientas/biodiversidad/types'

const puntos = vi.hoisted(() => ({ q: {} as Record<string, unknown> }))
vi.mock('@/hooks/useBiodiversidad', () => ({ useBiodiversidadPuntos: () => puntos.q }))

import CapaPuntos from '@/components/herramientas/biodiversidad/mapa/CapaPuntos'
import MapaMunicipios from '@/components/herramientas/biodiversidad/mapa/MapaMunicipios'
import { MensajesPuntos } from '@/components/herramientas/biodiversidad/mapa/ControlPuntos'
import { INFO_INICIAL, type InfoPuntos } from '@/components/herramientas/biodiversidad/mapa/tiposPuntos'
import RankingPanel from '@/components/herramientas/biodiversidad/RankingPanel'
import TablaMunicipios from '@/components/herramientas/biodiversidad/TablaMunicipios'
import { useDialogoModal } from '@/hooks/useDialogoModal'
import type { GeoMunicipios } from '@/components/herramientas/biodiversidad/mapa/geoMunicipios'
import { MENSAJE_RESERVADAS } from '@/components/herramientas/biodiversidad/lib/puntos'

const resp = (): RespuestaPuntos => ({
  grupo: 'anfibios', total: 2, mostrados: 2, ocultos: 77, muestreado: false, puntos: [
    { id: '1', lat: 5.5, lon: -76.6, e: 'Rhinella marina', ek: 'K', a: null },
    { id: '2', lat: 5.6, lon: -76.7, e: null, ek: null, a: null },
  ],
})

function montarMapa(conVista = true) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const mapa = L.map(el, { minZoom: 3, maxZoom: 13 })
  if (conVista) mapa.setView([5.5, -76.6], 8, { animate: false })
  return mapa
}
const racimos = (mapa: L.Map) => { const r: L.MarkerClusterGroup[] = []; mapa.eachLayer((l) => { if (l instanceof L.MarkerClusterGroup) r.push(l) }); return r }

beforeAll(() => { vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} unobserve() {} }) })
beforeEach(() => { puntos.q = { data: resp(), isFetching: false, isError: false, error: null, refetch: vi.fn() } })
afterEach(() => { document.body.innerHTML = '' })

describe('CapaPuntos (auditoría)', () => {
  test('con error y datos previos reporta el error y conserva los puntos como desactualizados', async () => {
    puntos.q = { ...puntos.q, isError: true, error: { status: 500 } }
    const mapa = montarMapa()
    const onInfo = vi.fn()
    render(<CapaPuntos mapa={mapa} grupo="anfibios" params={{}} enfoque={null} onAbrir={vi.fn()} onInfo={onInfo} />)
    await waitFor(() => expect(racimos(mapa)[0]?.getLayers()).toHaveLength(2))
    const ultima = onInfo.mock.calls[onInfo.mock.calls.length - 1][0] as InfoPuntos
    expect(ultima).toMatchObject({ listo: true, error: { status: 500 } })
  })
  test('no entrega el conteo de ocultos del recuadro', async () => {
    const onInfo = vi.fn()
    render(<CapaPuntos mapa={montarMapa()} grupo="anfibios" params={{}} enfoque={null} onAbrir={vi.fn()} onInfo={onInfo} />)
    await waitFor(() => expect(onInfo).toHaveBeenCalled())
    for (const [info] of onInfo.mock.calls) expect(info).not.toHaveProperty('ocultos')
  })
  test('los popups se construyen solo al abrirse', async () => {
    const mapa = montarMapa()
    render(<CapaPuntos mapa={mapa} grupo="anfibios" params={{}} enfoque={null} onAbrir={vi.fn()} onInfo={vi.fn()} />)
    await waitFor(() => expect(racimos(mapa)[0]?.getLayers()).toHaveLength(2))
    expect(document.querySelector('.bio-popup')).toBeNull()
    const marcador = racimos(mapa)[0].getLayers()[0] as L.CircleMarker
    const contenido = marcador.getPopup()?.getContent()
    expect(typeof contenido).toBe('function')
    const nodo = (contenido as (l: L.Layer) => HTMLElement)(marcador)
    expect(nodo.querySelector('button')?.textContent).toBe('Ver detalle')
  })
  test('desmontar tras mapa.remove() no lanza y quita la capa', async () => {
    const mapa = montarMapa()
    const { unmount } = render(<CapaPuntos mapa={mapa} grupo="anfibios" params={{}} enfoque={{ id: '1', lat: 5.5, lon: -76.6, vez: 1 }} onAbrir={vi.fn()} onInfo={vi.fn()} />)
    await waitFor(() => expect(racimos(mapa)[0]?.getLayers()).toHaveLength(2))
    mapa.remove()
    expect(() => unmount()).not.toThrow()
  })
  test('un mapa sin vista inicial no rompe el montaje', () => {
    const mapa = montarMapa(false)
    expect(() => render(<CapaPuntos mapa={mapa} grupo="anfibios" params={{}} enfoque={null} onAbrir={vi.fn()} onInfo={vi.fn()} />)).not.toThrow()
  })
})

describe('MensajesPuntos (auditoría)', () => {
  const info = (c: Partial<InfoPuntos> = {}): InfoPuntos => ({ ...INFO_INICIAL, listo: true, cargando: false, total: 10, mostrados: 10, ...c })
  test('error con datos previos: alerta con «Reintentar» y aviso de puntos desactualizados', async () => {
    const reintentar = vi.fn()
    render(<MensajesPuntos info={info({ error: { status: 500 }, reintentar })} onReintentar={reintentar} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/pueden estar desactualizados/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Reintentar/ }))
    expect(reintentar).toHaveBeenCalled()
  })
  test('mientras llega la respuesta nueva: aria-busy y «Actualizando…» en lugar del conteo viejo', () => {
    const { container } = render(<MensajesPuntos info={info({ cargando: true })} onReintentar={vi.fn()} />)
    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Actualizando…')).toBeInTheDocument()
    expect(screen.queryByText(/puntos en pantalla/)).not.toBeInTheDocument()
  })
  test('el mensaje de reservadas es fijo y no muestra cifras del recuadro', () => {
    const { container } = render(<MensajesPuntos info={info()} onReintentar={vi.fn()} />)
    expect(screen.getByText(MENSAJE_RESERVADAS)).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/\b77\b/)
  })
  test('con la capa activa ofrece la alternativa textual: ver los registros en lista', async () => {
    const onVerLista = vi.fn()
    render(<MensajesPuntos info={info()} onReintentar={vi.fn()} onVerLista={onVerLista} />)
    await userEvent.click(screen.getByRole('button', { name: 'Ver los registros en lista' }))
    expect(onVerLista).toHaveBeenCalled()
  })
})

describe('MapaMunicipios (accesibilidad y movimiento)', () => {
  const geo: GeoMunicipios = {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', properties: { c: '1', n: 'Uno', d: 'N' }, geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] } }],
  }
  const datos = new Map<string, MunicipioConteo>([['1', { codigo_municipal: '1', municipio: 'Uno', departamento: 'N', registros: 5, sin_especie: 0, especies: 1 }]])
  test('el contenedor no se oculta (popups y clústeres son interactivos); solo lo decorativo', () => {
    const { container } = render(<MapaMunicipios geo={geo} datos={datos} metrica="registros" cortes={[]} seleccionado={null} departamento={null} onSeleccionar={vi.fn()} />)
    expect(container.querySelector('.bio-mapa')).not.toHaveAttribute('aria-hidden')
    expect(container.querySelector('.leaflet-overlay-pane')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('.leaflet-popup-pane')).not.toHaveAttribute('aria-hidden')
  })
  test('con movimiento reducido el mapa no anima el zoom', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }))
    const espiado: L.Map[] = []
    const original = L.map
    const crear = vi.spyOn(L, 'map').mockImplementation((...a: Parameters<typeof L.map>) => { const m = original(...a); espiado.push(m); return m })
    render(<MapaMunicipios geo={geo} datos={datos} metrica="registros" cortes={[]} seleccionado={null} departamento={null} onSeleccionar={vi.fn()} />)
    expect(espiado[0].options.zoomAnimation).toBe(false)
    crear.mockRestore()
    vi.unstubAllGlobals()
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} unobserve() {} })
  })
})

describe('foco del diálogo', () => {
  test('si el origen ya no está en el documento, el foco va al respaldo', () => {
    const origen = document.createElement('button')
    const respaldo = document.createElement('button')
    document.body.append(origen, respaldo)
    const { unmount } = renderHook(() => useDialogoModal({ current: origen }, vi.fn(), () => respaldo))
    origen.remove()
    unmount()
    expect(document.activeElement).toBe(respaldo)
  })
  test('si el origen sigue en el documento, recupera el foco', () => {
    const origen = document.createElement('button')
    const respaldo = document.createElement('button')
    document.body.append(origen, respaldo)
    const { unmount } = renderHook(() => useDialogoModal({ current: origen }, vi.fn(), () => respaldo))
    unmount()
    expect(document.activeElement).toBe(origen)
  })
})

describe('sin_especie nulo en ranking y tabla', () => {
  const M = (c: string, n: string, d: string, r: number, s: number | null): MunicipioConteo => ({ codigo_municipal: c, municipio: n, departamento: d, registros: r, sin_especie: s, especies: 4 })
  const MUNIS = [M('1', 'Alfa', 'X', 1000, null), M('2', 'Beta', 'X', 100, 40), M('3', 'Gama', 'X', 60, 6)]
  test('el ranking porcentual de municipios omite los nulos y no los muestra como 0 %', () => {
    render(<RankingPanel municipios={MUNIS} metrica="sin_especie" seleccionado={null} departamento={null} onMunicipio={vi.fn()} onDepartamento={vi.fn()} />)
    expect(screen.queryByText('Alfa')).not.toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })
  test('el ranking por departamento usa solo los registros con dato', async () => {
    render(<RankingPanel municipios={MUNIS} metrica="sin_especie" seleccionado={null} departamento={null} onMunicipio={vi.fn()} onDepartamento={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Departamentos' }))
    expect(screen.getByText('28,8 %')).toBeInTheDocument()
  })
  test('la tabla muestra raya para nulos y ordena «Sin especie» por porcentaje', async () => {
    render(<TablaMunicipios municipios={MUNIS} seleccionado={null} onSeleccionar={vi.fn()} />)
    const nombres = () => screen.getAllByRole('row').slice(1).map((r) => r.querySelector('td')?.textContent)
    await userEvent.click(screen.getByRole('button', { name: /^Sin especie/ }))
    expect(nombres()).toEqual(['Beta', 'Gama', 'Alfa'])
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })
})
