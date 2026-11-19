import { describe, test, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import type { MunicipioConteo, RespuestaResumen } from '@/components/herramientas/biodiversidad/types'

const q = vi.hoisted(() => ({
  estado: {} as Record<string, unknown>, munis: {} as Record<string, unknown>, resumen: {} as Record<string, unknown>,
  series: {} as Record<string, unknown>, especies: {} as Record<string, unknown>, opciones: vi.fn(), espArgs: vi.fn(),
}))
vi.mock('@/hooks/useBiodiversidad', () => ({
  useBiodiversidadEstado: () => q.estado,
  useBiodiversidadMunicipios: () => q.munis,
  useBiodiversidadRegistros: () => ({ data: undefined, isPending: true, refetch: vi.fn() }),
  useBiodiversidadResumen: () => q.resumen,
  useBiodiversidadSeries: () => q.series,
  useBiodiversidadEspecies: (...a: unknown[]) => { q.espArgs(...a); return q.especies },
  useBiodiversidadRegistro: () => ({ data: undefined }),
  useBiodiversidadSugerencias: () => ({ data: undefined, isFetching: false, isError: false }),
  useBiodiversidadOpciones: (...a: unknown[]) => q.opciones(...a),
  useBiodiversidadPuntos: () => ({ data: undefined, isFetching: false, isError: false, refetch: vi.fn() }),
}))
vi.mock('@/components/herramientas/biodiversidad/mapa/PanelMapa', () => ({ default: () => <div>Mapa simulado</div> }))
vi.mock('@/components/informes/BotonDescargarInforme', () => ({
  default: ({ bloqueado }: { bloqueado?: boolean }) => <span data-testid="informe" data-bloqueado={String(bloqueado)} />,
}))

import Biodiversidad from '@/components/herramientas/biodiversidad/Biodiversidad'
import Combobox from '@/components/herramientas/biodiversidad/filtros/Combobox'
import ComboOpciones from '@/components/herramientas/biodiversidad/filtros/ComboOpciones'
import PanelFiltros from '@/components/herramientas/biodiversidad/filtros/PanelFiltros'
import BarraFiltros from '@/components/herramientas/biodiversidad/filtros/BarraFiltros'
import PanelConservacion from '@/components/herramientas/biodiversidad/resumen/PanelConservacion'
import GraficoAnios from '@/components/herramientas/biodiversidad/resumen/GraficoAnios'
import { completarAnios } from '@/components/herramientas/biodiversidad/resumen/anios'
import BarrasEvidencia from '@/components/herramientas/biodiversidad/resumen/BarrasEvidencia'
import EspeciesDestacadas from '@/components/herramientas/biodiversidad/resumen/EspeciesDestacadas'
import { PanelError } from '@/components/herramientas/biodiversidad/EstadoConsulta'
import { describirError } from '@/components/herramientas/biodiversidad/lib/errores'
import { aplicabilidad } from '@/components/herramientas/biodiversidad/lib/aplicabilidad'
import { chipsActivos, recordarNombres, SIN_NOMBRES, soloNombresVerificados } from '@/components/herramientas/biodiversidad/lib/chips'
import { FILTROS_VACIOS, leerFiltros } from '@/components/herramientas/biodiversidad/lib/filtros'

const M = (c: string, n: string, d: string, r: number): MunicipioConteo => ({ codigo_municipal: c, municipio: n, departamento: d, registros: r, sin_especie: 0, especies: r > 0 ? 7 : 0 })
const MUNIS = [M('05837', 'Turbo', 'Antioquia', 900), M('27001', 'Quibdó', 'Chocó', 100), M('27002', 'Atrato', 'Chocó', 0)]
const RESUMEN: RespuestaResumen = {
  grupo: 'anfibios', metodo: 'individual', alcance: { codigo_municipal: null, departamento: null }, registros: 1000, especies: 42, con_foto: 300,
  amenazadas: { CR: 1, EN: 2, VU: 3, total: 6 }, endemicas_colombia: 10, endemicas_choco: 4, introducidas: 1, invasoras: 0, anio_min: 2000, anio_max: 2025,
  entidades: 12, conjuntos: 20, con_ubicacion: 800,
}
const UUID = '123e4567-e89b-42d3-a456-426614174000'

function Ruta() {
  const l = useLocation()
  return <output data-testid="ruta">{l.search}</output>
}
function montar(ruta: string) {
  return render(<MemoryRouter initialEntries={[ruta]}><Biodiversidad /><Ruta /></MemoryRouter>)
}

beforeEach(() => {
  vi.clearAllMocks()
  q.estado = {
    data: { grupos: [
      { grupo: 'anfibios', metodo: 'individual', desde: 2000, hasta: 2025, registros: 1000, fecha_fuente: null, doi: null },
      { grupo: 'aves', metodo: 'agregado', desde: 2000, hasta: 2025, registros: 2919072, fecha_fuente: null, doi: null },
    ], conservacion: { activa: true, actualizada_en: null }, aviso: 'Aviso.' },
    isPending: false, isError: false,
  }
  q.munis = { data: { grupo: 'anfibios', metodo: 'individual', desde: 2000, hasta: 2025, municipios: MUNIS }, isError: false, isPlaceholderData: false, refetch: vi.fn() }
  q.resumen = { data: RESUMEN, isError: false, isPlaceholderData: false, refetch: vi.fn() }
  q.series = { data: { grupo: 'anfibios', metodo: 'individual', por_anio: [], por_evidencia: [] }, isError: false, refetch: vi.fn() }
  q.especies = { data: { grupo: 'anfibios', metodo: 'individual', pagina: 1, tamano: 20, total: 0, especies: [] }, isError: false, isFetching: false, refetch: vi.fn() }
  q.opciones.mockReturnValue({ data: { valores: [] }, isFetching: false, isError: false })
})

describe('errores 422', () => {
  test('describirError marca la consulta no válida como sin remedio por reintento', () => {
    expect(describirError({ status: 422 }).requiereCambiarFiltros).toBe(true)
    expect(describirError({ status: 503 }).requiereCambiarFiltros).toBeUndefined()
  })
  test('con 422 y acción de limpieza se ofrece «Limpiar filtros» en vez de «Reintentar»', async () => {
    const limpiar = vi.fn()
    render(<PanelError error={{ status: 422 }} onReintentar={vi.fn()} onLimpiarFiltros={limpiar} />)
    await userEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(limpiar).toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: /Reintentar/ })).not.toBeInTheDocument()
  })
  test('sin acción de limpieza, o con otro código, sigue el reintento', () => {
    const { rerender } = render(<PanelError error={{ status: 422 }} onReintentar={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Reintentar/ })).toBeInTheDocument()
    rerender(<PanelError error={{ status: 503 }} onReintentar={vi.fn()} onLimpiarFiltros={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Reintentar/ })).toBeInTheDocument()
  })
  test('el tablero ofrece limpiar cuando los municipios fallan con 422', () => {
    q.munis = { data: undefined, isError: true, error: { status: 422 }, refetch: vi.fn() }
    montar('/herramientas?grupo=anfibios&familia=Hylidae')
    expect(screen.getByRole('button', { name: 'Limpiar filtros' })).toBeInTheDocument()
  })
})

describe('nombres de filtros que vienen de un enlace', () => {
  const f = leerFiltros(new URLSearchParams(`especie=K1&nombre_especie=Panthera%20leo&entidad=${UUID}&nombre_entidad=Falso`))
  test('un nombre que no se eligió en esta sesión se marca «sin verificar» en el chip', () => {
    const etiquetas = chipsActivos(f, null, SIN_NOMBRES).map((c) => c.etiqueta)
    expect(etiquetas).toContain('Especie: Panthera leo (sin verificar)')
    expect(etiquetas).toContain('Entidad: Falso (sin verificar)')
  })
  test('el nombre elegido en el combo sí queda verificado, y solo para esa clave', () => {
    const ok = recordarNombres(SIN_NOMBRES, { especie: 'K1', nombre_especie: 'Panthera leo' })
    expect(chipsActivos(f, null, ok).map((c) => c.etiqueta)).toContain('Especie: Panthera leo')
    expect(chipsActivos({ ...f, especie: 'K2' }, null, ok).map((c) => c.etiqueta)).toContain('Especie: Panthera leo (sin verificar)')
  })
  test('el texto resumen no usa nombres sin verificar', () => {
    expect(soloNombresVerificados(f, SIN_NOMBRES)).toMatchObject({ nombreEspecie: null, nombreEntidad: null })
    expect(soloNombresVerificados(FILTROS_VACIOS, SIN_NOMBRES)).toEqual(FILTROS_VACIOS)
  })
  test('el tablero rotula el chip de un enlace con nombre ajeno', () => {
    montar('/herramientas?grupo=anfibios&especie=K1&nombre_especie=Panthera%20leo')
    expect(screen.getByText('Especie: Panthera leo (sin verificar)')).toBeInTheDocument()
  })
})

describe('filtros que no aplican en agregados', () => {
  test('entidad + familia: se avisa y la entidad sale de la URL para que no reaparezca al quitar la familia', () => {
    montar(`/herramientas?grupo=aves&entidad=${UUID}&familia=Tyrannidae`)
    expect(screen.getByTestId('ruta').textContent).not.toContain('entidad')
    expect(screen.getByTestId('ruta').textContent).toContain('familia=Tyrannidae')
    expect(screen.getByText(/No aplican a Aves y se quitaron:/)).toBeInTheDocument()
  })
})

describe('cifras de cabecera', () => {
  test('con datos de la consulta anterior no se muestra la cifra: «—» y «Calculando…»', () => {
    q.resumen = { data: RESUMEN, isError: false, isPlaceholderData: true, refetch: vi.fn() }
    montar('/herramientas?grupo=anfibios')
    expect(within(screen.getByLabelText('Datos del grupo')).getByText('Registros').nextSibling).toHaveTextContent('—')
    expect(screen.getByText('Calculando…')).toBeInTheDocument()
  })
  test('si el resumen falla lo dice, sin caer en otra cifra', () => {
    q.resumen = { data: undefined, isError: true, error: { status: 503 }, refetch: vi.fn() }
    montar('/herramientas?grupo=anfibios')
    expect(within(screen.getByLabelText('Datos del grupo')).getByText('Registros').nextSibling).toHaveTextContent('—')
    expect(screen.getByText('No se pudo calcular')).toBeInTheDocument()
  })
  test('los municipios con datos indican que cuentan todo el Chocó', () => {
    montar('/herramientas?grupo=anfibios&departamento=Antioquia')
    expect(screen.getByText(/En todo el Chocó, sin acotar por territorio/)).toBeInTheDocument()
  })
  test('un territorio sin registros muestra el caso vacío aunque otros municipios tengan datos', () => {
    montar('/herramientas?grupo=anfibios&municipio=27002')
    expect(screen.getByText('Ningún registro cumple estos filtros')).toBeInTheDocument()
  })
  test('la descarga del informe queda bloqueada mientras el ranking es de filtros anteriores', () => {
    q.munis = { ...q.munis, isPlaceholderData: true }
    montar('/herramientas?grupo=anfibios')
    expect(screen.getByTestId('informe')).toHaveAttribute('data-bloqueado', 'true')
  })
})

describe('hoja modal de filtros y atajos', () => {
  const props = {
    grupo: 'anfibios' as const, metodo: 'individual' as const, filtros: FILTROS_VACIOS, apl: aplicabilidad('individual', FILTROS_VACIOS),
    municipios: MUNIS, paramsOpciones: {}, desde: 2000, hasta: 2025, resultado: 'Mostrando 1.000 registros', idTitulo: 't',
    onCambio: vi.fn(), onLimpiar: vi.fn(),
  }
  test('dentro del diálogo el resultado se anuncia (role status)', () => {
    render(<PanelFiltros {...props} onCerrar={vi.fn()} />)
    expect(screen.getByText('Mostrando 1.000 registros')).toHaveAttribute('role', 'status')
  })
  test('en el panel lateral no se duplica el anuncio de la barra', () => {
    render(<PanelFiltros {...props} />)
    expect(screen.getByText('Mostrando 1.000 registros')).toHaveAttribute('aria-hidden', 'true')
  })
  test('el botón de filtros no apunta a un id inexistente y los atajos deshabilitados explican su motivo', () => {
    const apl = aplicabilidad('agregado', { ...FILTROS_VACIOS, entidad: UUID })
    render(<BarraFiltros grupo="aves" metodo="agregado" filtros={{ ...FILTROS_VACIOS, entidad: UUID }} apl={apl} chips={[]} resumen="r" panelAbierto={false} botonPanel={{ current: null }} onTogglePanel={vi.fn()} onCambio={vi.fn()} onLimpiar={vi.fn()} />)
    const filtros = screen.getByRole('button', { name: /Filtros/ })
    expect(filtros).not.toHaveAttribute('aria-controls')
    const atajo = screen.getByRole('button', { name: /Amenazadas/ })
    expect(atajo).toBeDisabled()
    expect(atajo).toHaveAccessibleDescription(/no se puede combinar con la fuente/)
    expect(screen.getByRole('button', { name: /Con foto/ })).toHaveAccessibleDescription(/inventario agregado/)
  })
})

describe('Combobox', () => {
  const opciones = [{ valor: 'a', etiqueta: 'Alfa' }, { valor: 'b', etiqueta: 'Beta' }]
  test('Inicio y Fin quedan para el cursor del texto: no se capturan', async () => {
    render(<Combobox etiqueta="Campo" seleccion={null} opciones={opciones} onElegir={vi.fn()} onLimpiar={vi.fn()} />)
    const entrada = screen.getByRole('combobox')
    await userEvent.click(entrada)
    expect(fireEvent.keyDown(entrada, { key: 'Home' })).toBe(true)
    expect(fireEvent.keyDown(entrada, { key: 'End' })).toBe(true)
    expect(entrada).not.toHaveAttribute('aria-activedescendant')
  })
  test('pulsar la lista (la barra de desplazamiento) no quita el foco ni la cierra', async () => {
    render(<Combobox etiqueta="Campo" seleccion={null} opciones={opciones} onElegir={vi.fn()} onLimpiar={vi.fn()} />)
    const entrada = screen.getByRole('combobox')
    await userEvent.click(entrada)
    expect(fireEvent.mouseDown(screen.getByRole('listbox'))).toBe(false)
    expect(entrada).toHaveFocus()
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })
  test('al abrir con una selección, esta se ve atenuada como placeholder', async () => {
    render(<Combobox etiqueta="Campo" seleccion="Alfa" opciones={opciones} onElegir={vi.fn()} onLimpiar={vi.fn()} />)
    const entrada = screen.getByRole('combobox')
    expect(entrada).toHaveValue('Alfa')
    await userEvent.click(entrada)
    expect(entrada).toHaveValue('')
    expect(entrada).toHaveAttribute('placeholder', 'Alfa')
  })
})

describe('ComboOpciones', () => {
  const llamar = (etiquetar?: (o: { valor: string; nombre: string; registros: number }) => string) => render(
    <ComboOpciones grupo="anfibios" campo="tipo_evidencia" etiqueta="Evidencia" params={{ familia: 'X' }} seleccion={null} etiquetar={etiquetar} onElegir={vi.fn()} onLimpiar={vi.fn()} />,
  )
  test('con etiquetas traducidas el texto no viaja al servidor: filtra el combo sobre la etiqueta en español', async () => {
    q.opciones.mockReturnValue({ data: { valores: [{ valor: 'HUMAN_OBSERVATION', nombre: 'HUMAN_OBSERVATION', registros: 5 }, { valor: 'PRESERVED_SPECIMEN', nombre: 'PRESERVED_SPECIMEN', registros: 2 }] }, isFetching: false, isError: false })
    llamar((o) => (o.valor === 'HUMAN_OBSERVATION' ? 'Observación humana' : 'Espécimen preservado'))
    await userEvent.type(screen.getByRole('combobox'), 'observación')
    await new Promise((r) => setTimeout(r, 400))
    expect(screen.getByRole('option', { name: /Observación humana/ })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /Espécimen/ })).not.toBeInTheDocument()
    for (const llamada of q.opciones.mock.calls) expect(llamada[2]).not.toHaveProperty('buscar')
  })
  test('sin traducción el texto sí se envía al servidor', async () => {
    llamar()
    await userEvent.type(screen.getByRole('combobox'), 'abc')
    await new Promise((r) => setTimeout(r, 400))
    expect(q.opciones.mock.calls.some((c) => (c[2] as { buscar?: string }).buscar === 'abc')).toBe(true)
  })
  test('al llegar al tope de 100 avisa que son las de más registros', async () => {
    const valores = Array.from({ length: 100 }, (_, i) => ({ valor: `v${i}`, nombre: `Opción ${i}`, registros: 100 - i }))
    q.opciones.mockReturnValue({ data: { valores }, isFetching: false, isError: false })
    llamar()
    await userEvent.click(screen.getByRole('combobox'))
    expect(screen.getByText('Mostrando las 100 con más registros; escribe para acotar')).toBeInTheDocument()
  })
})

describe('resumen', () => {
  test('PanelConservacion muestra «—» donde la API devuelve null y aclara que las dos filas de endemismo abren la misma lista', () => {
    const r = { ...RESUMEN, amenazadas: { CR: null, EN: 2, VU: 3, total: 5 } }
    render(<PanelConservacion resumen={r} grupo="aves" puedeVerEspecies onFiltrar={vi.fn()} />)
    expect(screen.getByRole('group', { name: /En peligro crítico: sin dato/ })).toHaveTextContent('—')
    expect(screen.getAllByText('La lista incluye las endémicas de Colombia y del Chocó.')).toHaveLength(2)
  })
  test('GraficoAnios rellena con cero los años sin registros y rotula años múltiplos del paso', () => {
    expect(completarAnios([{ anio: 2003, registros: 4 }, { anio: 2000, registros: 1 }])).toEqual([
      { anio: 2000, registros: 1 }, { anio: 2001, registros: 0 }, { anio: 2002, registros: 0 }, { anio: 2003, registros: 4 },
    ])
    expect(completarAnios([])).toEqual([])
    const { container } = render(<GraficoAnios datos={[{ anio: 1990, registros: 3 }, { anio: 2020, registros: 9 }]} />)
    const etiquetas = [...container.querySelectorAll('text.bio-eje-texto')].map((t) => t.textContent)
    expect(etiquetas).toEqual(['1990', '1995', '2000', '2005', '2010', '2015', '2020'])
  })
  test('BarrasEvidencia avisa de los tipos que no caben', () => {
    const datos = Array.from({ length: 8 }, (_, i) => ({ tipo: `T${i}`, registros: 10 - i }))
    render(<BarrasEvidencia datos={datos} />)
    expect(screen.getByText('Y 2 tipos más con menos registros.')).toBeInTheDocument()
  })
  test('EspeciesDestacadas no pisa otro tipo de conservación elegido y respeta la categoría de amenaza', () => {
    q.especies = { data: { grupo: 'aves', metodo: 'individual', pagina: 1, tamano: 4, total: 0, especies: [] } }
    const { container } = render(<EspeciesDestacadas grupo="aves" params={{ conservacion: 'endemica' }} activo onVer={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
    expect(q.espArgs).toHaveBeenLastCalledWith('aves', expect.anything(), false)
    render(<EspeciesDestacadas grupo="aves" params={{ conservacion: 'amenazada', amenaza: 'CR' }} activo onVer={vi.fn()} />)
    expect(q.espArgs).toHaveBeenLastCalledWith('aves', expect.objectContaining({ conservacion: 'amenazada', amenaza: 'CR' }), true)
  })
})
