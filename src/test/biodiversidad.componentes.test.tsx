import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { UseQueryResult } from '@tanstack/react-query'
import type {
  EstadoBiodiversidad, MunicipioConteo, RegistroBiodiversidad, RespuestaMunicipios, RespuestaRegistros, RespuestaResumen,
} from '@/components/herramientas/biodiversidad/types'

type Q = Partial<UseQueryResult<unknown>>
const estado: { q: Q } = { q: {} }
const munis: { q: Q } = { q: {} }
const regs: { q: Q } = { q: {} }
const resumen: { q: Q } = { q: {} }
const series: { q: Q } = { q: {} }
const especies: { q: Q } = { q: {} }
const detalle: { q: Q } = { q: {} }
vi.mock('@/hooks/useBiodiversidad', () => ({
  useBiodiversidadEstado: () => estado.q,
  useBiodiversidadMunicipios: () => munis.q,
  useBiodiversidadRegistros: () => regs.q,
  useBiodiversidadResumen: () => resumen.q,
  useBiodiversidadSeries: () => series.q,
  useBiodiversidadEspecies: () => especies.q,
  useBiodiversidadRegistro: () => detalle.q,
  useBiodiversidadSugerencias: () => ({ data: undefined, isFetching: false, isError: false }),
  useBiodiversidadOpciones: () => ({ data: { valores: [] }, isFetching: false, isError: false }),
  useBiodiversidadPuntos: () => ({ data: undefined, isFetching: false, isError: false, refetch: vi.fn() }),
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

const M = (c: string, n: string, d: string, r: number, s = 0): MunicipioConteo => ({ codigo_municipal: c, municipio: n, departamento: d, registros: r, sin_especie: s, especies: r > 0 ? 7 : 0 })
const MUNIS = [M('05837', 'Turbo', 'Antioquia', 900, 90), M('27001', 'Quibdó', 'Chocó', 100, 0), M('27002', 'Atrato', 'Chocó', 0)]

const ESTADO: EstadoBiodiversidad = {
  grupos: [
    { grupo: 'anfibios', metodo: 'individual', desde: 2000, hasta: 2025, registros: 1000, fecha_fuente: '2026-10-19T20:10:35.214Z', doi: '10.15468/dl.abc123' },
    { grupo: 'aves', metodo: 'agregado', desde: 2000, hasta: 2025, registros: 2919072, fecha_fuente: null, doi: null },
  ],
  conservacion: { activa: true, actualizada_en: '2026-10-20T18:19:56.099Z' },
  aviso: 'Aviso tal cual: los conteos reflejan esfuerzo de muestreo.',
}

const RESUMEN: RespuestaResumen = {
  grupo: 'anfibios', metodo: 'individual', alcance: { codigo_municipal: null, departamento: null }, registros: 1000, especies: 42, con_foto: 300,
  amenazadas: { CR: 1, EN: 2, VU: 3, total: 6 }, endemicas_colombia: 10, endemicas_choco: 4, introducidas: 1, invasoras: 0, anio_min: 2000, anio_max: 2025,
  entidades: 12, conjuntos: 20, con_ubicacion: 800,
}

function reg(over: Partial<RegistroBiodiversidad> = {}): RegistroBiodiversidad {
  return {
    gbif_id: '123456', especie: 'Rhinella marina', especie_clave: 'K', anio: 2014, tipo_evidencia: 'HUMAN_OBSERVATION',
    licencia: 'http://creativecommons.org/licenses/by-nc/4.0/legalcode', latitud: 8.0882, longitud: -76.8368, incertidumbre_m: 20,
    coordenadas_ocultas: false, conjunto: 'Conjunto <b>X</b>', doi_conjunto: '10.15472/7okxxe', codigo_municipal: '05837',
    municipio: 'Turbo', departamento: 'Antioquia', fecha_evento: null, registrado_por: null, identificado_por: null,
    foto: null, fotos_total: 0, amenaza: null, endemica_colombia: false, endemica_choco: false, introducida: false, invasora: false, ...over,
  }
}

function montar(ruta = '/herramientas?herramienta=biodiversidad&grupo=anfibios') {
  return render(<MemoryRouter initialEntries={[ruta]}><Biodiversidad /></MemoryRouter>)
}

beforeEach(() => {
  estado.q = { data: ESTADO, isPending: false, isError: false }
  const m: RespuestaMunicipios = { grupo: 'anfibios', metodo: 'individual', desde: 2000, hasta: 2025, municipios: MUNIS }
  munis.q = { data: m, isError: false, isPlaceholderData: false, refetch: vi.fn() as never }
  const r: RespuestaRegistros = { grupo: 'anfibios', desde: 2000, hasta: 2025, pagina: 1, tamano: 24, total: 2, registros: [reg(), reg({ gbif_id: '999', especie: null })] }
  regs.q = { data: r, isError: false, isPending: false, isFetching: false, refetch: vi.fn() as never }
  resumen.q = { data: RESUMEN, isError: false, isFetching: false, refetch: vi.fn() as never }
  series.q = { data: { grupo: 'anfibios', metodo: 'individual', por_anio: [{ anio: 2019, registros: 5 }, { anio: 2020, registros: 9 }], por_evidencia: [{ tipo: 'HUMAN_OBSERVATION', registros: 14 }] }, isError: false, refetch: vi.fn() as never }
  especies.q = { data: { grupo: 'anfibios', metodo: 'individual', pagina: 1, tamano: 20, total: 0, especies: [] }, isError: false, isFetching: false, isPending: false, refetch: vi.fn() as never }
  detalle.q = { data: undefined, isError: false, refetch: vi.fn() as never }
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
    render(<RankingPanel municipios={MUNIS} metrica="registros" seleccionado="05837" departamento={null} onMunicipio={onMunicipio} onDepartamento={vi.fn()} />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(within(items[0]).getByText('Turbo')).toBeInTheDocument()
    expect(within(items[0]).getByRole('button')).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(within(items[1]).getByRole('button'))
    expect(onMunicipio).toHaveBeenCalledWith('27001')
  })

  test('alterna a departamentos', async () => {
    const onDepartamento = vi.fn()
    render(<RankingPanel municipios={MUNIS} metrica="registros" seleccionado={null} departamento={null} onMunicipio={vi.fn()} onDepartamento={onDepartamento} />)
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
    expect(screen.getByText(/fotografías se cargan desde GBIF y pertenecen a sus autores/i)).toBeInTheDocument()
    expect(screen.getByText(/Solo existen listas nacionales de endemismo para aves, plantas y mamíferos/)).toBeInTheDocument()
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
  test('abre en Resumen con indicadores de /resumen y las cuatro pestañas', async () => {
    montar()
    expect(screen.getByText('Registros individuales', { selector: 'span' })).toBeInTheDocument()
    expect(await screen.findByText('Estado de conservación')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Resumen', selected: true })).toBeInTheDocument()
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Resumen', 'Registros', 'Especies', 'Municipios'])
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /En peligro crítico: 1 especie\. Ver la lista/ })).toBeInTheDocument()
  })

  test('la pestaña Registros muestra las tarjetas del grupo', async () => {
    montar('/herramientas?herramienta=biodiversidad&grupo=anfibios&vista=registros')
    expect(await screen.findByRole('button', { name: /Ver detalle del registro: Rhinella marina/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Registros', selected: true })).toBeInTheDocument()
  })

  test('seleccionar desde el mapa actualiza el detalle', async () => {
    montar()
    await userEvent.click(screen.getByRole('button', { name: 'Mapa simulado' }))
    expect(screen.getByText('Municipio seleccionado')).toBeInTheDocument()
    expect(screen.getByText('#1')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Quitar selección' }))
    expect(screen.queryByText('Municipio seleccionado')).not.toBeInTheDocument()
  })

  test('cambiar a la pestaña de municipios', async () => {
    montar()
    await userEvent.click(screen.getByRole('tab', { name: 'Municipios' }))
    expect(screen.getByRole('tab', { name: 'Municipios', selected: true })).toBeInTheDocument()
    expect(screen.getByRole('table', { name: /Registros y especies por municipio/ })).toBeInTheDocument()
  })

  test('error de registros 503 muestra mensaje y reintento', async () => {
    regs.q = { data: undefined, isError: true, isPending: false, error: Object.assign(new Error('x'), { status: 503 }), refetch: vi.fn() as never }
    montar('/herramientas?herramienta=biodiversidad&grupo=anfibios&vista=registros')
    expect(await screen.findByRole('alert')).toHaveTextContent('La consulta tardó demasiado')
  })

  test('filtros inválidos en la URL se ignoran', () => {
    montar('/herramientas?herramienta=biodiversidad&grupo=zzz&municipio=abc&pagina=-3&metrica=foo&conservacion=x')
    expect(screen.getByText('Aves', { selector: 'p' })).toBeInTheDocument()
  })
})

describe('Biodiversidad (grupo agregado y errores)', () => {
  test('agregado: sin tabla de registros y con explicación', () => {
    munis.q = { data: { grupo: 'aves', metodo: 'agregado', desde: 2000, hasta: 2025, municipios: MUNIS }, isError: false, isPlaceholderData: false }
    montar('/herramientas?herramienta=biodiversidad&grupo=aves')
    expect(screen.queryByRole('tab', { name: 'Registros' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Resumen', 'Especies', 'Municipios'])
    expect(screen.getByText(/Inventario agregado: el servicio entrega conteos/)).toBeInTheDocument()
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
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0)
  })

  test('grupo sin registros muestra estado vacío', () => {
    munis.q = { data: { grupo: 'hongos', metodo: 'individual', desde: 2000, hasta: 2025, municipios: [M('1', 'A', 'B', 0)] }, isError: false, isPlaceholderData: false }
    montar('/herramientas?herramienta=biodiversidad&grupo=hongos')
    expect(screen.getAllByText('Sin registros').length).toBeGreaterThan(0)
  })

  test('cambiar de grupo conserva territorio y conservación, quita la taxonomía y avisa', async () => {
    montar('/herramientas?herramienta=biodiversidad&grupo=anfibios&municipio=05837&familia=Hylidae&conservacion=amenazada')
    expect(screen.getByRole('button', { name: /Quitar el filtro Familia: Hylidae/ })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: /Reptiles/ }))
    expect(screen.getByRole('radio', { name: /Reptiles/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.queryByRole('button', { name: /Quitar el filtro Familia/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Quitar el filtro Municipio/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Quitar el filtro Conservación: Amenazadas/ })).toBeInTheDocument()
    expect(screen.getByText(/Al pasar a Reptiles se quitaron filtros/)).toBeInTheDocument()
    expect(screen.getByText(/Familia Hylidae/)).toBeInTheDocument()
  })
})
