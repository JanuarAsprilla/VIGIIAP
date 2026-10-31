import { describe, test, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import MapaMunicipios from '@/components/herramientas/biodiversidad/mapa/MapaMunicipios'
import LeyendaEscala from '@/components/herramientas/biodiversidad/mapa/LeyendaEscala'
import { siguienteEnDireccion } from '@/components/herramientas/biodiversidad/lib/navegacion'
import type { GeoMunicipios } from '@/components/herramientas/biodiversidad/mapa/geoMunicipios'
import type { MunicipioConteo } from '@/components/herramientas/biodiversidad/types'

const cuadro = (x: number, y: number) => [[[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1], [x, y]]]
const GEO: GeoMunicipios = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { c: '00001', n: 'Uno', d: 'Norte' }, geometry: { type: 'Polygon', coordinates: cuadro(0, 0) } },
    { type: 'Feature', properties: { c: '00002', n: 'Dos', d: 'Sur' }, geometry: { type: 'Polygon', coordinates: cuadro(2, 0) } },
  ],
}
const DATOS = new Map<string, MunicipioConteo>([
  ['00001', { codigo_municipal: '00001', municipio: 'Uno', departamento: 'Norte', registros: 10, sin_especie: 0, especies: 3 }],
  ['00002', { codigo_municipal: '00002', municipio: 'Dos', departamento: 'Sur', registros: 1000, sin_especie: 0, especies: 3 }],
])

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} unobserve() {} })
})

describe('navegación por teclado (pura)', () => {
  const pts = [{ id: 'a', x: 0, y: 0 }, { id: 'b', x: 2, y: 0.1 }, { id: 'c', x: 0, y: 2 }]
  test('elige el vecino más cercano en la dirección pedida', () => {
    expect(siguienteEnDireccion(pts[0], pts, 'derecha')).toBe('b')
    expect(siguienteEnDireccion(pts[0], pts, 'arriba')).toBe('c')
  })
  test('sin candidato en esa dirección devuelve null', () => {
    expect(siguienteEnDireccion(pts[0], pts, 'izquierda')).toBeNull()
    expect(siguienteEnDireccion(pts[0], pts, 'abajo')).toBeNull()
  })
})

describe('LeyendaEscala', () => {
  test('lista sin registros y los tramos con formato es-CO', () => {
    render(<LeyendaEscala cortes={[10, 1000]} maximo={5000} />)
    expect(screen.getByText('Sin datos')).toBeInTheDocument()
    expect(screen.getByText('11 – 1.000')).toBeInTheDocument()
    expect(screen.getByText('1.001 – 5.000')).toBeInTheDocument()
  })
})

describe('MapaMunicipios', () => {
  test('dibuja un polígono por municipio con clase por registros y marca la selección', () => {
    const { container } = render(
      <MapaMunicipios geo={GEO} metrica="registros" datos={DATOS} cortes={[10]} seleccionado="00002" departamento={null} onSeleccionar={vi.fn()} />,
    )
    const rutas = container.querySelectorAll('path.bio-m')
    expect(rutas).toHaveLength(2)
    expect(rutas[0].getAttribute('class')).toContain('bio-c1')
    expect(rutas[1].getAttribute('class')).toContain('bio-c2')
    expect(rutas[0].getAttribute('class')).toContain('bio-fuera')
    expect(rutas[1].getAttribute('class')).not.toContain('bio-fuera')
    expect(container.querySelector('path.bio-halo')).not.toBeNull()
    expect(container.querySelector('path.bio-sel')).not.toBeNull()
    expect(container.querySelector('.bio-etiqueta')?.textContent).toBe('Dos')
  })

  test('atenúa los municipios fuera del departamento activo', () => {
    const { container } = render(
      <MapaMunicipios geo={GEO} metrica="registros" datos={DATOS} cortes={[10]} seleccionado={null} departamento="Norte" onSeleccionar={vi.fn()} />,
    )
    const rutas = container.querySelectorAll('path.bio-m')
    expect(rutas[0].getAttribute('class')).not.toContain('bio-fuera')
    expect(rutas[1].getAttribute('class')).toContain('bio-fuera')
  })

  test('clic selecciona el municipio', () => {
    const onSeleccionar = vi.fn()
    const { container } = render(
      <MapaMunicipios geo={GEO} metrica="registros" datos={DATOS} cortes={[10]} seleccionado={null} departamento={null} onSeleccionar={onSeleccionar} />,
    )
    fireEvent.click(container.querySelectorAll('path.bio-m')[0])
    expect(onSeleccionar).toHaveBeenCalledWith('00001')
  })

  test('flechas recorren, Enter selecciona y Escape limpia; se anuncia el foco', () => {
    const onSeleccionar = vi.fn()
    render(<MapaMunicipios geo={GEO} metrica="registros" datos={DATOS} cortes={[10]} seleccionado={null} departamento={null} onSeleccionar={onSeleccionar} />)
    const mapa = screen.getByRole('group', { name: /^Mapa de municipios/ })
    fireEvent.keyDown(mapa, { key: 'ArrowRight' })
    expect(screen.getByText(/Dos\. Sur · 1\.000 registros · 3 especies/)).toBeInTheDocument()
    fireEvent.keyDown(mapa, { key: 'ArrowLeft' })
    expect(screen.getByText(/Uno\. Norte · 10 registros · 3 especies/)).toBeInTheDocument()
    fireEvent.keyDown(mapa, { key: 'Enter' })
    expect(onSeleccionar).toHaveBeenCalledWith('00001')
    fireEvent.keyDown(mapa, { key: 'Escape' })
    expect(onSeleccionar).toHaveBeenLastCalledWith(null)
  })

  test('el tooltip usa texto plano (sin HTML)', () => {
    const datos = new Map(DATOS)
    datos.set('00001', { ...DATOS.get('00001')!, municipio: '<img src=x onerror=alert(1)>' })
    const { container } = render(<MapaMunicipios geo={GEO} metrica="registros" datos={datos} cortes={[10]} seleccionado={null} departamento={null} onSeleccionar={vi.fn()} />)
    expect(container.querySelector('img')).toBeNull()
  })
})

describe('MapaMunicipios: métricas y navegación', () => {
  const montar = (extra: Partial<React.ComponentProps<typeof MapaMunicipios>> = {}) =>
    render(<MapaMunicipios geo={GEO} metrica="registros" datos={DATOS} cortes={[10]} seleccionado={null} departamento={null} onSeleccionar={vi.fn()} {...extra} />)

  test('la métrica de especies pinta con sus propios cortes', () => {
    const { container } = montar({ metrica: 'especies', cortes: [2] })
    const rutas = container.querySelectorAll('path.bio-m')
    expect(rutas[0].getAttribute('class')).toContain('bio-c2')
  })

  test('municipio sin datos usa la clase neutra', () => {
    const datos = new Map(DATOS)
    datos.set('00001', { ...DATOS.get('00001')!, registros: 0, especies: 0 })
    const { container } = montar({ datos })
    expect(container.querySelectorAll('path.bio-m')[0].getAttribute('class')).toContain('bio-c0')
  })

  test('controles de acercar, alejar y restablecer están etiquetados', () => {
    montar()
    for (const n of ['Acercar', 'Alejar', 'Restablecer la vista completa']) expect(screen.getByRole('button', { name: n })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Centrar en la selección' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Acercar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Alejar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Restablecer la vista completa' }))
  })

  test('con selección aparece «Centrar en la selección»', () => {
    montar({ seleccionado: '00001' })
    expect(screen.getByRole('button', { name: 'Centrar en la selección' })).toBeInTheDocument()
  })

  test('la rueda sin Ctrl no se captura y muestra la pista; con Ctrl sí', () => {
    vi.useFakeTimers()
    const { container } = montar()
    const mapa = container.querySelector('.bio-mapa')!
    const simple = new WheelEvent('wheel', { deltaY: 100, cancelable: true, bubbles: true })
    act(() => { mapa.dispatchEvent(simple) })
    expect(simple.defaultPrevented).toBe(false)
    expect(container.querySelector('.bio-pista')).toHaveClass('bio-pista-visible')
    act(() => { vi.advanceTimersByTime(2000) })
    expect(container.querySelector('.bio-pista')).not.toHaveClass('bio-pista-visible')
    const conCtrl = new WheelEvent('wheel', { deltaY: -100, ctrlKey: true, cancelable: true, bubbles: true })
    act(() => { mapa.dispatchEvent(conCtrl) })
    expect(conCtrl.defaultPrevented).toBe(true)
    vi.useRealTimers()
  })

  test('el tooltip rico lista municipio, departamento, registros y especies', () => {
    const { container } = montar({ metrica: 'especies' })
    fireEvent.mouseOver(container.querySelectorAll('path.bio-m')[1])
    const tip = document.querySelector('.bio-tip')
    expect(tip?.textContent).toContain('Dos')
    expect(tip?.textContent).toContain('Sur')
    expect(tip?.textContent).toContain('1.000')
    expect(tip?.querySelector('.bio-tip-activa')?.textContent).toContain('Especies')
  })

  test('+ y - del teclado no rompen el mapa', () => {
    montar()
    const grupo = screen.getByRole('group', { name: /^Mapa de municipios/ })
    fireEvent.keyDown(grupo, { key: '+' })
    fireEvent.keyDown(grupo, { key: '-' })
  })
})
