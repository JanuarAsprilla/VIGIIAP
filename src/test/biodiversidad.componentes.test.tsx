import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { UseQueryResult } from '@tanstack/react-query'
import type {
  EstadoBiodiversidad, MunicipioConteo, RegistroBiodiversidad, RespuestaMunicipios, RespuestaRegistros,
} from '@/components/herramientas/biodiversidad/types'

type Q = Partial<UseQueryResult<unknown>>
const estado: { q: Q } = { q: {} }
const munis: { q: Q } = { q: {} }
const regs: { q: Q } = { q: {} }
vi.mock('@/hooks/useBiodiversidad', () => ({
  useBiodiversidadEstado: () => estado.q,
  useBiodiversidadMunicipios: () => munis.q,
  useBiodiversidadRegistros: () => regs.q,
}))
vi.mock('@/components/herramientas/biodiversidad/mapa/PanelMapa', () => ({
  default: ({ onSeleccionar }: { onSeleccionar: (c: string) => void }) => (
    <button onClick={() => onSeleccionar('05837')}>Mapa simulado</button>
  ),
}))

import Biodiversidad from '@/components/herramientas/biodiversidad/Biodiversidad'
import TablaRegistros from '@/components/herramientas/biodiversidad/registros/TablaRegistros'
import RankingPanel from '@/components/herramientas/biodiversidad/RankingPanel'
import TablaMunicipios from '@/components/herramientas/biodiversidad/TablaMunicipios'
import AcercaDatos from '@/components/herramientas/biodiversidad/AcercaDatos'
import { PanelError } from '@/components/herramientas/biodiversidad/EstadoConsulta'

const M = (c: string, n: string, d: string, r: number, s = 0): MunicipioConteo => ({ codigo_municipal: c, municipio: n, departamento: d, registros: r, sin_especie: s })
const MUNIS = [M('05837', 'Turbo', 'Antioquia', 900, 90), M('27001', 'Quibdó', 'Chocó', 100, 0), M('27002', 'Atrato', 'Chocó', 0)]

const ESTADO: EstadoBiodiversidad = {
  grupos: [
    { grupo: 'anfibios', metodo: 'individual', desde: 2000, hasta: 2025, registros: 1000, fecha_fuente: '2026-10-19T20:10:35.214Z', doi: '10.15468/dl.abc123' },
    { grupo: 'aves', metodo: 'agregado', desde: 2000, hasta: 2025, registros: 2919072, fecha_fuente: null, doi: null },
  ],
  conservacion: { activa: true, actualizada_en: '2026-10-20T18:19:56.099Z' },
  aviso: 'Aviso tal cual: los conteos reflejan esfuerzo de muestreo.',
}

function reg(over: Partial<RegistroBiodiversidad> = {}): RegistroBiodiversidad {
  return {
    gbif_id: '123456', especie: 'Rhinella marina', especie_clave: 'K', anio: 2014, tipo_evidencia: 'HUMAN_OBSERVATION',
    licencia: 'http://creativecommons.org/licenses/by-nc/4.0/legalcode', latitud: 8.0882, longitud: -76.8368, incertidumbre_m: 20,
    coordenadas_ocultas: false, conjunto: 'Conjunto <b>X</b>', doi_conjunto: '10.15472/7okxxe', codigo_municipal: '05837',
    municipio: 'Turbo', departamento: 'Antioquia', ...over,
  }
}

function montar(ruta = '/herramientas?herramienta=biodiversidad&grupo=anfibios') {
  return render(<MemoryRouter initialEntries={[ruta]}><Biodiversidad /></MemoryRouter>)
}

beforeEach(() => {
  estado.q = { data: ESTADO, isPending: false, isError: false }
  const m: RespuestaMunicipios = { grupo: 'anfibios', metodo: 'individual', desde: 2000, hasta: 2025, municipios: MUNIS }
  munis.q = { data: m, isError: false, isPlaceholderData: false, refetch: vi.fn() as never }
  const r: RespuestaRegistros = { grupo: 'anfibios', desde: 2000, hasta: 2025, pagina: 1, tamano: 25, total: 2, registros: [reg(), reg({ gbif_id: '999', especie: null })] }
  regs.q = { data: r, isError: false, isPending: false, isFetching: false, refetch: vi.fn() as never }
})

describe('TablaRegistros: seguridad de ubicación y enlaces', () => {
  test('con coordenadas ocultas jamás se renderiza lat/lon, aunque lleguen en el objeto', () => {
    const { container } = render(<TablaRegistros registros={[reg({ coordenadas_ocultas: true, latitud: 8.0882, longitud: -76.8368 })]} />)
    expect(screen.getByText('Ubicación reservada')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/8[,.]0882|76[,.]8368/)
  })

  test('sin coordenadas y no reservado: texto neutro, sin punto', () => {
    render(<TablaRegistros registros={[reg({ latitud: null, longitud: null })]} />)
    expect(screen.getByText('Sin coordenadas')).toBeInTheDocument()
  })

  test('muestra coordenadas con incertidumbre cuando son públicas', () => {
    render(<TablaRegistros registros={[reg()]} />)
    expect(screen.getByText(/8,0882, -76,8368/)).toBeInTheDocument()
    expect(screen.getByText(/± 20 m/)).toBeInTheDocument()
  })

  test('enlaces externos solo con patrón válido y rel seguro', () => {
    render(<TablaRegistros registros={[reg(), reg({ gbif_id: 'javascript:1', doi_conjunto: 'https://evil.com', licencia: 'https://evil.example/x' })]} />)
    const gbif = screen.getAllByRole('link', { name: /Ver el registro/ })
    expect(gbif).toHaveLength(1)
    expect(gbif[0]).toHaveAttribute('href', 'https://www.gbif.org/occurrence/123456')
    expect(gbif[0]).toHaveAttribute('target', '_blank')
    expect(gbif[0]).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getAllByRole('link', { name: /DOI del conjunto/ })).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'CC BY-NC' })).toHaveAttribute('href', 'https://creativecommons.org/licenses/by-nc/4.0/deed.es')
    expect(screen.getByText('Licencia del conjunto')).toBeInTheDocument()
    const todos = screen.getAllByRole('link').map((a) => a.getAttribute('href') ?? '')
    expect(todos.every((h) => /^https:\/\/(www\.gbif\.org|doi\.org|creativecommons\.org)\//.test(h))).toBe(true)
  })

  test('texto de la API se renderiza como texto, no como HTML; especie en cursiva y evidencia traducida', () => {
    const { container } = render(<TablaRegistros registros={[reg()]} />)
    expect(container.querySelector('b')).toBeNull()
    expect(screen.getByText('Conjunto <b>X</b>')).toBeInTheDocument()
    expect(screen.getByText('Rhinella marina').tagName).toBe('I')
    expect(screen.getByText('Observación humana')).toBeInTheDocument()
  })

  test('especie nula se rotula como sin determinar', () => {
    render(<TablaRegistros registros={[reg({ especie: null })]} />)
    expect(screen.getByText('Sin especie determinada')).toBeInTheDocument()
  })
})

describe('PanelError', () => {
  test.each([[404, 'Sin datos'], [422, 'Consulta no válida'], [429, 'Demasiadas'], [503, 'tardó'], [undefined, 'conexión']])(
    'código %s con botón de reintento', async (status, texto) => {
      const onReintentar = vi.fn()
      render(<PanelError error={{ status }} onReintentar={onReintentar} />)
      expect(screen.getByRole('alert')).toHaveTextContent(new RegExp(texto))
      await userEvent.click(screen.getByRole('button', { name: /Reintentar/ }))
      expect(onReintentar).toHaveBeenCalledOnce()
    })
})

describe('RankingPanel', () => {
  test('lista top por registros y selecciona', async () => {
    const onMunicipio = vi.fn()
    render(<RankingPanel municipios={MUNIS} seleccionado="05837" departamento={null} onMunicipio={onMunicipio} onDepartamento={vi.fn()} />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(within(items[0]).getByText('Turbo')).toBeInTheDocument()
    expect(within(items[0]).getByRole('button')).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(within(items[1]).getByRole('button'))
    expect(onMunicipio).toHaveBeenCalledWith('27001')
  })

  test('alterna a departamentos', async () => {
    const onDepartamento = vi.fn()
    render(<RankingPanel municipios={MUNIS} seleccionado={null} departamento={null} onMunicipio={vi.fn()} onDepartamento={onDepartamento} />)
    await userEvent.click(screen.getByRole('button', { name: 'Departamentos' }))
    await userEvent.click(screen.getByRole('button', { name: /Antioquia/ }))
    expect(onDepartamento).toHaveBeenCalledWith('Antioquia')
  })
})

describe('TablaMunicipios', () => {
  test('ordena por columna y expone aria-sort', async () => {
    render(<TablaMunicipios municipios={MUNIS} seleccionado={null} onSeleccionar={vi.fn()} />)
    const cuerpo = () => screen.getAllByRole('row').slice(1).map((r) => within(r).getAllByRole('cell')[0].textContent)
    expect(cuerpo()).toEqual(['Turbo', 'Quibdó', 'Atrato'])
    await userEvent.click(screen.getByRole('button', { name: /^Municipio/ }))
    expect(cuerpo()).toEqual(['Atrato', 'Quibdó', 'Turbo'])
    expect(screen.getByRole('columnheader', { name: /^Municipio/ })).toHaveAttribute('aria-sort', 'ascending')
  })
})

describe('AcercaDatos', () => {
  test('muestra el aviso tal cual, conservación y fuentes por grupo', () => {
    render(<AcercaDatos estado={ESTADO} error={null} cargando={false} onReintentar={vi.fn()} />)
    expect(screen.getByText(ESTADO.aviso)).toBeInTheDocument()
    expect(screen.getByText(/Activo, actualizado el/)).toBeInTheDocument()
    expect(screen.getByText(/Resolución 0126 de 2024/)).toBeInTheDocument()
    expect(screen.getByText(/no abundancia/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /DOI 10\.15468/ })).toHaveAttribute('href', 'https://doi.org/10.15468/dl.abc123')
  })

  test('cruce inactivo y error del estado con reintento', async () => {
    const { rerender } = render(<AcercaDatos estado={{ ...ESTADO, conservacion: { activa: false, actualizada_en: null } }} error={null} cargando={false} onReintentar={vi.fn()} />)
    expect(screen.getByText(/Inactivo/)).toBeInTheDocument()
    const onReintentar = vi.fn()
    rerender(<AcercaDatos estado={undefined} error={{ status: 503 }} cargando={false} onReintentar={onReintentar} />)
    await userEvent.click(screen.getByRole('button', { name: /Reintentar/ }))
    expect(onReintentar).toHaveBeenCalled()
  })
})

describe('Biodiversidad (grupo individual)', () => {
  test('muestra indicadores, registros y pestañas', () => {
    montar()
    expect(screen.getByText('Registros individuales', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByText('Registros totales').nextElementSibling).toHaveTextContent('1.000')
    expect(screen.getByText('de 3 municipios')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Registros', selected: true })).toBeInTheDocument()
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Rhinella marina')
  })

  test('seleccionar desde el mapa actualiza la URL y el detalle', async () => {
    montar()
    await userEvent.click(screen.getByRole('button', { name: 'Mapa simulado' }))
    expect(screen.getByText('Municipio seleccionado')).toBeInTheDocument()
    expect(screen.getByText('#1')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Quitar selección' }))
    expect(screen.queryByText('Municipio seleccionado')).not.toBeInTheDocument()
  })

  test('cambiar de pestaña a la tabla de municipios', async () => {
    montar()
    await userEvent.click(screen.getByRole('tab', { name: 'Municipios' }))
    expect(screen.getByRole('tab', { name: 'Municipios', selected: true })).toBeInTheDocument()
    expect(screen.getByRole('table', { name: /Registros por municipio/ })).toBeInTheDocument()
  })

  test('error de registros 503 muestra mensaje y reintento', () => {
    regs.q = { data: undefined, isError: true, isPending: false, error: Object.assign(new Error('x'), { status: 503 }), refetch: vi.fn() as never }
    montar()
    expect(screen.getByRole('alert')).toHaveTextContent('La consulta tardó demasiado')
  })

  test('filtros inválidos en la URL se ignoran', () => {
    montar('/herramientas?herramienta=biodiversidad&grupo=zzz&municipio=abc&pagina=-3')
    expect(screen.getByText('Aves', { selector: 'p' })).toBeInTheDocument()
  })
})

describe('Biodiversidad (grupo agregado y errores)', () => {
  test('agregado: sin tabla de registros y con explicación', () => {
    munis.q = { data: { grupo: 'aves', metodo: 'agregado', desde: 2000, hasta: 2025, municipios: MUNIS }, isError: false, isPlaceholderData: false }
    montar('/herramientas?herramienta=biodiversidad&grupo=aves')
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.getByText(/solo el conteo por municipio/)).toBeInTheDocument()
    expect(screen.getByText(/inventario agregado: el servicio entrega solo el conteo/)).toBeInTheDocument()
  })

  test('error 404 de municipios reemplaza el contenido con reintento', () => {
    munis.q = { data: undefined, isError: true, error: Object.assign(new Error('x'), { status: 404 }), refetch: vi.fn() as never }
    montar()
    expect(screen.getAllByRole('alert')[0]).toHaveTextContent('Sin datos disponibles')
    expect(screen.getByRole('button', { name: /Reintentar/ })).toBeInTheDocument()
  })

  test('cargando: muestra esqueletos', () => {
    munis.q = { data: undefined, isError: false, isPlaceholderData: false }
    montar()
    expect(screen.getAllByRole('status', { name: /Cargando indicadores/ }).length).toBeGreaterThan(0)
  })

  test('grupo sin registros muestra estado vacío', () => {
    munis.q = { data: { grupo: 'hongos', metodo: 'individual', desde: 2000, hasta: 2025, municipios: [M('1', 'A', 'B', 0)] }, isError: false, isPlaceholderData: false }
    montar('/herramientas?herramienta=biodiversidad&grupo=hongos')
    expect(screen.getAllByText('Sin registros').length).toBeGreaterThan(0)
  })

  test('cambiar de grupo conserva la herramienta en la URL y limpia selección', async () => {
    montar('/herramientas?herramienta=biodiversidad&grupo=anfibios&municipio=05837')
    await userEvent.click(screen.getByRole('radio', { name: /Reptiles/ }))
    expect(screen.getByRole('radio', { name: /Reptiles/ })).toBeChecked()
    expect(screen.queryByText('Municipio seleccionado')).not.toBeInTheDocument()
  })
})
