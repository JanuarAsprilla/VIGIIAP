import { describe, test, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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
  ['00001', { codigo_municipal: '00001', municipio: 'Uno', departamento: 'Norte', registros: 10, sin_especie: 0 }],
  ['00002', { codigo_municipal: '00002', municipio: 'Dos', departamento: 'Sur', registros: 1000, sin_especie: 0 }],
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
    expect(screen.getByText('Sin registros')).toBeInTheDocument()
    expect(screen.getByText('11 – 1.000')).toBeInTheDocument()
    expect(screen.getByText('1.001 – 5.000')).toBeInTheDocument()
  })
})

describe('MapaMunicipios', () => {
  test('dibuja un polígono por municipio con clase por registros y marca la selección', () => {
    const { container } = render(
      <MapaMunicipios geo={GEO} datos={DATOS} cortes={[10]} seleccionado="00002" departamento={null} onSeleccionar={vi.fn()} />,
    )
    const rutas = container.querySelectorAll('path.bio-m')
    expect(rutas).toHaveLength(2)
    expect(rutas[0].getAttribute('class')).toContain('bio-c1')
    expect(rutas[1].getAttribute('class')).toContain('bio-c2')
    expect(rutas[1].getAttribute('class')).toContain('bio-sel')
  })

  test('atenúa los municipios fuera del departamento activo', () => {
    const { container } = render(
      <MapaMunicipios geo={GEO} datos={DATOS} cortes={[10]} seleccionado={null} departamento="Norte" onSeleccionar={vi.fn()} />,
    )
    const rutas = container.querySelectorAll('path.bio-m')
    expect(rutas[0].getAttribute('class')).not.toContain('bio-fuera')
    expect(rutas[1].getAttribute('class')).toContain('bio-fuera')
  })

  test('clic selecciona el municipio', () => {
    const onSeleccionar = vi.fn()
    const { container } = render(
      <MapaMunicipios geo={GEO} datos={DATOS} cortes={[10]} seleccionado={null} departamento={null} onSeleccionar={onSeleccionar} />,
    )
    fireEvent.click(container.querySelectorAll('path.bio-m')[0])
    expect(onSeleccionar).toHaveBeenCalledWith('00001')
  })

  test('flechas recorren, Enter selecciona y Escape limpia; se anuncia el foco', () => {
    const onSeleccionar = vi.fn()
    render(<MapaMunicipios geo={GEO} datos={DATOS} cortes={[10]} seleccionado={null} departamento={null} onSeleccionar={onSeleccionar} />)
    const mapa = screen.getByRole('group', { name: /Mapa de registros/ })
    fireEvent.keyDown(mapa, { key: 'ArrowRight' })
    expect(screen.getByText(/Dos\. Sur · 1\.000 registros/)).toBeInTheDocument()
    fireEvent.keyDown(mapa, { key: 'ArrowLeft' })
    expect(screen.getByText(/Uno\. Norte · 10 registros/)).toBeInTheDocument()
    fireEvent.keyDown(mapa, { key: 'Enter' })
    expect(onSeleccionar).toHaveBeenCalledWith('00001')
    fireEvent.keyDown(mapa, { key: 'Escape' })
    expect(onSeleccionar).toHaveBeenLastCalledWith(null)
  })

  test('el tooltip usa texto plano (sin HTML)', () => {
    const datos = new Map(DATOS)
    datos.set('00001', { ...DATOS.get('00001')!, municipio: '<img src=x onerror=alert(1)>' })
    const { container } = render(<MapaMunicipios geo={GEO} datos={datos} cortes={[10]} seleccionado={null} departamento={null} onSeleccionar={vi.fn()} />)
    expect(container.querySelector('img')).toBeNull()
  })
})
