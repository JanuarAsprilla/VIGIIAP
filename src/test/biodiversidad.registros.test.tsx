import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import type { MunicipioConteo, RegistroBiodiversidad } from '@/components/herramientas/biodiversidad/types'

type Q = Partial<UseQueryResult<unknown>>
const regs: { q: Q; filtros: unknown[] } = { q: {}, filtros: [] }
const geo: { q: Q } = { q: {} }
const llamadas: Record<string, string | number | null>[] = []
const todas = () => JSON.stringify(llamadas)
vi.mock('@/hooks/useBiodiversidad', () => ({
  useBiodiversidadRegistros: (f: unknown) => { regs.filtros.push(f); return regs.q },
  useBiodiversidadRegistro: () => ({ data: undefined, isError: false }),
}))
vi.mock('@/components/herramientas/biodiversidad/mapa/geoMunicipios', () => ({ useGeoMunicipios: () => geo.q }))
vi.mock('@/components/herramientas/biodiversidad/mapa/MapaMunicipios', () => ({ default: () => <div>Mapa simulado</div> }))

import SeccionRegistros from '@/components/herramientas/biodiversidad/registros/SeccionRegistros'
import PanelMapa from '@/components/herramientas/biodiversidad/mapa/PanelMapa'
import Pestanas from '@/components/herramientas/biodiversidad/Pestanas'
import { etiquetaMetodo, metodosPorGrupo } from '@/components/herramientas/biodiversidad/lib/metodo'

const M = (c: string, n: string, d: string): MunicipioConteo => ({ codigo_municipal: c, municipio: n, departamento: d, registros: 5, sin_especie: 1, especies: 3 })
const MUNIS = [M('05837', 'Turbo', 'Antioquia'), M('27001', 'Quibdó', 'Chocó')]
const reg = (id: string): RegistroBiodiversidad => ({
  gbif_id: id, especie: 'Rhinella marina', especie_clave: 'K', anio: 2014, fecha_evento: null, tipo_evidencia: 'HUMAN_OBSERVATION', licencia: null,
  latitud: null, longitud: null, incertidumbre_m: null, coordenadas_ocultas: true, conjunto: 'C', doi_conjunto: null, codigo_municipal: '05837',
  municipio: 'Turbo', departamento: 'Antioquia', registrado_por: null, identificado_por: null, foto: null, fotos_total: 0,
  amenaza: null, endemica_colombia: false, endemica_choco: false, introducida: false, invasora: false,
})
const VALORES = {
  departamento: null, municipio: null, anioDesde: null, anioHasta: null, buscar: '', conFoto: false, conservacion: null, amenaza: null, especie: null, nombreEspecie: null,
}

function Contenedor({ inicial = {}, modo = 'tarjetas' as const, abierto = null as string | null }) {
  const [valores, setValores] = useState({ ...VALORES, ...inicial })
  return (
    <>
      <SeccionRegistros
        grupo="anfibios" municipios={MUNIS} valores={valores} pagina={1} modo={modo} abierto={abierto} desde={2000} hasta={2025}
        onCambio={(c) => { llamadas.push(c); if ('con_foto' in c) setValores((v) => ({ ...v, conFoto: c.con_foto === '1' })); if ('especie' in c) setValores((v) => ({ ...v, especie: null, nombreEspecie: null })) }}
        onLimpiar={() => setValores(VALORES)}
      />
    </>
  )
}

beforeEach(() => {
  llamadas.length = 0
  regs.filtros = []
  regs.q = { data: { grupo: 'anfibios', desde: 2000, hasta: 2025, pagina: 1, tamano: 24, total: 60, registros: [reg('1'), reg('2')] }, isError: false, isPending: false, isFetching: false, refetch: vi.fn() as never }
  geo.q = { data: { type: 'FeatureCollection', features: [] }, isError: false }
})

describe('SeccionRegistros', () => {
  test('arma la consulta con los filtros nuevos', () => {
    render(<Contenedor inicial={{ buscar: 'Rhi', conFoto: true, conservacion: 'amenazada', amenaza: 'CR', especie: 'K1', municipio: '05837', departamento: 'Antioquia' }} />)
    expect(regs.filtros[regs.filtros.length - 1]).toMatchObject({
      grupo: 'anfibios', pagina: 1, tamano: 24, codigo_municipal: '05837', departamento: undefined, buscar: 'Rhi', con_foto: 'true',
      conservacion: 'amenazada', amenaza: 'CR', especie_clave: 'K1',
    })
  })
  test('tarjetas por omisión, tabla al conmutar y estado en aria-pressed', async () => {
    const { container } = render(<Contenedor />)
    expect(container.querySelectorAll('.bio-tarjeta')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Tarjetas' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Tabla' }))
    expect(todas()).toContain('"modo":"tabla"')
    await userEvent.click(screen.getByRole('button', { name: 'Tarjetas' }))
    expect(todas()).toContain('"modo":null')
  })
  test('modo tabla muestra la tabla y las ubicaciones reservadas', () => {
    render(<Contenedor modo={'tabla' as never} />)
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getAllByText('Ubicación reservada').length).toBeGreaterThan(0)
  })
  test('el interruptor «Solo con foto» y limpiar filtros', async () => {
    render(<Contenedor />)
    const sw = screen.getByRole('switch', { name: 'Fotografías' })
    expect(sw).toHaveAttribute('aria-checked', 'false')
    await userEvent.click(sw)
    expect(screen.getByRole('switch', { name: 'Fotografías' })).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(screen.getByRole('switch', { name: 'Fotografías' })).toHaveAttribute('aria-checked', 'false')
  })
  test('la especie elegida aparece como filtro quitable', async () => {
    render(<Contenedor inicial={{ especie: 'K1', nombreEspecie: 'Atelopus spurrelli' }} />)
    expect(screen.getByText('Atelopus spurrelli')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Quitar el filtro de especie' }))
    expect(screen.queryByText('Atelopus spurrelli')).not.toBeInTheDocument()
  })
  test('departamento y municipio se encadenan; años como selectores', async () => {
    render(<Contenedor />)
    await userEvent.selectOptions(screen.getByLabelText('Municipio'), '27001')
    expect(todas()).toContain('"municipio":"27001"')
    expect(todas()).toContain('"departamento":"Chocó"')
    await userEvent.selectOptions(screen.getByLabelText('Departamento'), 'Antioquia')
    await userEvent.selectOptions(screen.getByLabelText('Año desde'), '2010')
    await userEvent.selectOptions(screen.getByLabelText('Año hasta'), '2020')
    expect(todas()).toContain('"anio_hasta":"2020"')
  })
  test('paginación y apertura del detalle', async () => {
    render(<Contenedor />)
    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Siguiente/ }))
    expect(todas()).toContain('"pagina":2')
    await userEvent.click(screen.getAllByRole('button', { name: /Ver detalle del registro/ })[0])
    expect(todas()).toContain('"registro":"1"')
  })
  test('vacío, carga y error', async () => {
    regs.q = { data: { grupo: 'anfibios', desde: 2000, hasta: 2025, pagina: 1, tamano: 24, total: 0, registros: [] }, isError: false, isFetching: false, refetch: vi.fn() as never }
    const { unmount } = render(<Contenedor />)
    expect(screen.getByText('Sin registros')).toBeInTheDocument()
    unmount()
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
  test('abre el diálogo cuando la URL trae un registro', () => {
    render(<Contenedor abierto="777" />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})

describe('PanelMapa', () => {
  const props = { datos: new Map(), metrica: 'registros' as const, cortes: [1], maximo: 5, seleccionado: null, departamento: null, cargandoDatos: false, onSeleccionar: vi.fn(), onMetrica: vi.fn() }
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
