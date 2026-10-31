import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UseQueryResult } from '@tanstack/react-query'
import type { RegistroBiodiversidad } from '@/components/herramientas/biodiversidad/types'

type Q = Partial<UseQueryResult<unknown>>
const regs: { q: Q; filtros: unknown[] } = { q: {}, filtros: [] }
const geo: { q: Q } = { q: {} }
const llamadas: Record<string, string | number | null>[] = []
const todas = () => JSON.stringify(llamadas)
vi.mock('@/hooks/useBiodiversidad', () => ({
  useBiodiversidadRegistros: (g: string, f: unknown) => { regs.filtros.push({ grupo: g, ...(f as object) }); return regs.q },
  useBiodiversidadRegistro: () => ({ data: undefined, isError: false }),
  useBiodiversidadPuntos: () => ({ data: undefined, isFetching: false, isError: false, refetch: vi.fn() }),
}))
vi.mock('@/components/herramientas/biodiversidad/mapa/geoMunicipios', () => ({ useGeoMunicipios: () => geo.q }))
vi.mock('@/components/herramientas/biodiversidad/mapa/MapaMunicipios', () => ({ default: () => <div>Mapa simulado</div> }))

import SeccionRegistros from '@/components/herramientas/biodiversidad/registros/SeccionRegistros'
import PanelMapa from '@/components/herramientas/biodiversidad/mapa/PanelMapa'
import Pestanas from '@/components/herramientas/biodiversidad/Pestanas'
import { etiquetaMetodo, metodosPorGrupo } from '@/components/herramientas/biodiversidad/lib/metodo'

const reg = (id: string): RegistroBiodiversidad => ({
  gbif_id: id, especie: 'Rhinella marina', especie_clave: 'K', anio: 2014, fecha_evento: null, tipo_evidencia: 'HUMAN_OBSERVATION', licencia: null,
  latitud: null, longitud: null, incertidumbre_m: null, coordenadas_ocultas: true, conjunto: 'C', doi_conjunto: null, codigo_municipal: '05837',
  municipio: 'Turbo', departamento: 'Antioquia', registrado_por: null, identificado_por: null, foto: null, fotos_total: 0,
  amenaza: null, endemica_colombia: false, endemica_choco: false, introducida: false, invasora: false,
})
const AYUDA = { chips: [{ clave: 'con_foto', etiqueta: 'Solo con foto', quitarEtiqueta: 'Quitar el filtro Solo con foto', quitar: { con_foto: null } }], onCambio: vi.fn(), onLimpiar: vi.fn() }

function Contenedor({ params = {}, modo = 'tarjetas' as const, orden = 'anio_desc' as 'anio_desc' | 'anio_asc' | 'especie' }) {
  return (
    <SeccionRegistros
      grupo="anfibios" params={params} orden={orden} pagina={1} modo={modo} ayuda={AYUDA}
      onCambio={(c) => { llamadas.push(c) }} onAbrir={(r) => { llamadas.push({ registro: r.gbif_id }) }} onVerEnMapa={(r) => { llamadas.push({ mapa: r.gbif_id }) }}
    />
  )
}

beforeEach(() => {
  llamadas.length = 0
  regs.filtros = []
  regs.q = { data: { grupo: 'anfibios', desde: 2000, hasta: 2025, pagina: 1, tamano: 24, total: 60, registros: [reg('1'), reg('2')] }, isError: false, isPending: false, isFetching: false, refetch: vi.fn() as never }
  geo.q = { data: { type: 'FeatureCollection', features: [] }, isError: false }
})

describe('SeccionRegistros', () => {
  test('pide los registros con los filtros recibidos, el orden y el tamaño de página', () => {
    render(<Contenedor params={{ codigo_municipal: '05837', buscar: 'Rhi', con_foto: 'true' }} orden="anio_asc" />)
    expect(regs.filtros[regs.filtros.length - 1]).toMatchObject({
      grupo: 'anfibios', pagina: 1, tamano: 24, orden: 'anio_asc', codigo_municipal: '05837', buscar: 'Rhi', con_foto: 'true',
    })
  })
  test('el selector de orden envía el cambio y vuelve a null con el orden inicial', async () => {
    render(<Contenedor />)
    await userEvent.selectOptions(screen.getByLabelText('Ordenar por'), 'especie')
    expect(todas()).toContain('"ordenar":"especie"')
    await userEvent.selectOptions(screen.getByLabelText('Ordenar por'), 'anio_desc')
    expect(todas()).toContain('"ordenar":null')
  })
  test('tarjetas por omisión, tabla al conmutar y estado en aria-pressed', async () => {
    const { container } = render(<Contenedor />)
    expect(container.querySelectorAll('.bio-tarjeta')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Tarjetas' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Tabla detallada' }))
    expect(todas()).toContain('"modo":"tabla"')
    await userEvent.click(screen.getByRole('button', { name: 'Tarjetas' }))
    expect(todas()).toContain('"modo":null')
  })
  test('modo tabla muestra la tabla y las ubicaciones reservadas', () => {
    render(<Contenedor modo={'tabla' as never} />)
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getAllByText('Ubicación reservada').length).toBeGreaterThan(0)
  })
  test('«Ver en el mapa» solo existe con ubicación pública', async () => {
    regs.q = { data: { grupo: 'anfibios', desde: 2000, hasta: 2025, pagina: 1, tamano: 24, total: 2, registros: [
      { ...reg('1'), coordenadas_ocultas: false, latitud: 5.5, longitud: -76.6 }, reg('2'),
    ] }, isError: false, isPending: false, isFetching: false, refetch: vi.fn() as never }
    render(<Contenedor />)
    const botones = screen.getAllByRole('button', { name: /Ver en el mapa/ })
    expect(botones).toHaveLength(1)
    await userEvent.click(botones[0])
    expect(todas()).toContain('"mapa":"1"')
  })
  test('«Ver en el mapa» no aparece si llegan coordenadas con coordenadas_ocultas=true', () => {
    regs.q = { data: { grupo: 'anfibios', desde: 2000, hasta: 2025, pagina: 1, tamano: 24, total: 1, registros: [
      { ...reg('1'), coordenadas_ocultas: true, latitud: 5.5, longitud: -76.6 },
    ] }, isError: false, isPending: false, isFetching: false, refetch: vi.fn() as never }
    const { container } = render(<Contenedor />)
    expect(screen.queryByRole('button', { name: /Ver en el mapa/ })).not.toBeInTheDocument()
    expect(container.textContent).not.toMatch(/5[,.]5|76[,.]6/)
  })
  test('muestra observador, identificador y conjunto con DOI válido', () => {
    regs.q = { data: { grupo: 'anfibios', desde: 2000, hasta: 2025, pagina: 1, tamano: 24, total: 1, registros: [
      { ...reg('1'), registrado_por: 'Ana Pérez', identificado_por: 'Luis Gómez', conjunto: 'Colección <i>X</i>', doi_conjunto: '10.15472/abc123' },
    ] }, isError: false, isPending: false, isFetching: false, refetch: vi.fn() as never }
    const { container } = render(<Contenedor />)
    expect(screen.getByText('Observó: Ana Pérez')).toBeInTheDocument()
    expect(screen.getByText('Identificó: Luis Gómez')).toBeInTheDocument()
    expect(screen.getByText('Colección <i>X</i>')).toBeInTheDocument()
    expect(container.querySelector('i')).toBeNull()
    expect(screen.getByRole('link', { name: /DOI del conjunto/ })).toHaveAttribute('href', 'https://doi.org/10.15472/abc123')
  })
  test('paginación y apertura del detalle', async () => {
    render(<Contenedor />)
    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Siguiente/ }))
    expect(todas()).toContain('"pagina":2')
    await userEvent.click(screen.getAllByRole('button', { name: /Ver detalle del registro/ })[0])
    expect(todas()).toContain('"registro":"1"')
  })
  test('sin resultados sugiere qué filtro quitar', async () => {
    regs.q = { data: { grupo: 'anfibios', desde: 2000, hasta: 2025, pagina: 1, tamano: 24, total: 0, registros: [] }, isError: false, isFetching: false, refetch: vi.fn() as never }
    render(<Contenedor />)
    expect(screen.getByText('Sin registros')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Quitar el filtro Solo con foto' }))
    expect(AYUDA.onCambio).toHaveBeenCalledWith({ con_foto: null })
  })
  test('carga y error con reintento', async () => {
    regs.q = { data: undefined, isError: false, isPending: true, refetch: vi.fn() as never }
    const r2 = render(<Contenedor />)
    expect(screen.getByRole('status', { name: 'Cargando registros' })).toBeInTheDocument()
    r2.unmount()
    const refetch = vi.fn()
    regs.q = { data: undefined, isError: true, error: { status: 429 } as never, refetch: refetch as never }
    render(<Contenedor />)
    await userEvent.click(screen.getByRole('button', { name: /Reintentar/ }))
    expect(refetch).toHaveBeenCalled()
  })
})

describe('PanelMapa', () => {
  const props = { grupo: 'anfibios' as const, puntosDisponibles: true, puntosActivos: false, paramsPuntos: {}, enfoque: null, onPuntos: vi.fn(), onAbrirRegistro: vi.fn(), datos: new Map(), metrica: 'registros' as const, cortes: [1], maximo: 5, seleccionado: null, departamento: null, cargandoDatos: false, onSeleccionar: vi.fn(), onMetrica: vi.fn() }
  test('selector de métrica como radiogroup y leyenda integrada', async () => {
    const onMetrica = vi.fn()
    render(<PanelMapa {...props} onMetrica={onMetrica} />)
    expect(screen.getByRole('radiogroup', { name: 'Qué pintar en el mapa' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Registros' })).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(screen.getByRole('radio', { name: '% sin especie' }))
    expect(onMetrica).toHaveBeenCalledWith('sin_especie')
    expect(await screen.findByText('Mapa simulado')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /Leyenda/ })).toBeInTheDocument()
  })
  test('sin leyenda mientras carga y error del GeoJSON con reintento', async () => {
    const { rerender } = render(<PanelMapa {...props} cargandoDatos />)
    expect(screen.queryByRole('group', { name: /Leyenda/ })).not.toBeInTheDocument()
    const refetch = vi.fn()
    geo.q = { data: undefined, isError: true, error: { status: 500 } as never, refetch: refetch as never }
    rerender(<PanelMapa {...props} />)
    await userEvent.click(screen.getByRole('button', { name: /Reintentar/ }))
    expect(refetch).toHaveBeenCalled()
    geo.q = { data: undefined, isError: false }
    rerender(<PanelMapa {...props} />)
    expect(screen.getByRole('status', { name: 'Cargando mapa' })).toBeInTheDocument()
  })
})

describe('Pestanas y método', () => {
  test('flechas, Inicio y Fin cambian de pestaña', async () => {
    const onCambiar = vi.fn()
    render(<Pestanas etiqueta="x" activa="a" onCambiar={onCambiar} pestanas={[
      { id: 'a', titulo: 'A', contenido: <p>pa</p> }, { id: 'b', titulo: 'B', contenido: <p>pb</p> }, { id: 'c', titulo: 'C', contenido: <p>pc</p> },
    ]} />)
    screen.getByRole('tab', { name: 'A' }).focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(onCambiar).toHaveBeenLastCalledWith('b')
    await userEvent.keyboard('{End}')
    expect(onCambiar).toHaveBeenLastCalledWith('c')
    await userEvent.keyboard('{Home}')
    expect(onCambiar).toHaveBeenLastCalledWith('a')
    await userEvent.keyboard('{ArrowLeft}')
    expect(onCambiar).toHaveBeenLastCalledWith('c')
    expect(screen.getByText('pa')).toBeInTheDocument()
  })
  test('rótulos de método', () => {
    expect(etiquetaMetodo('individual')).toBe('Registros individuales')
    expect(etiquetaMetodo('agregado')).toBe('Inventario agregado')
    expect(etiquetaMetodo(undefined)).toBe('Método por confirmar')
    expect(metodosPorGrupo([{ grupo: 'aves', metodo: 'agregado', desde: 1, hasta: 2, registros: 1, fecha_fuente: null, doi: null }])).toEqual({ aves: 'agregado' })
    expect(metodosPorGrupo(undefined)).toEqual({})
  })
})
