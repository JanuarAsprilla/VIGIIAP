import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'

const opciones = vi.hoisted(() => ({ llamadas: [] as unknown[][], datos: { valores: [{ valor: 'Hylidae', nombre: 'Hylidae', registros: 5513 }, { valor: 'Bufonidae', nombre: 'Bufonidae', registros: 900 }] } as unknown }))
const sugerencias = vi.hoisted(() => ({ llamadas: [] as unknown[][], datos: undefined as unknown }))
vi.mock('@/hooks/useBiodiversidad', () => ({
  useBiodiversidadOpciones: (...a: unknown[]) => { opciones.llamadas.push(a); return { data: a[3] ? opciones.datos : undefined, isFetching: false, isError: false } },
  useBiodiversidadSugerencias: (...a: unknown[]) => { sugerencias.llamadas.push(a); return { data: a[2] ? sugerencias.datos : undefined, isFetching: false, isError: false } },
}))

import Combobox from '@/components/herramientas/biodiversidad/filtros/Combobox'
import ComboOpciones from '@/components/herramientas/biodiversidad/filtros/ComboOpciones'
import PanelFiltros from '@/components/herramientas/biodiversidad/filtros/PanelFiltros'
import BarraFiltros from '@/components/herramientas/biodiversidad/filtros/BarraFiltros'
import SelectorEspecie from '@/components/herramientas/biodiversidad/filtros/SelectorEspecie'
import AvisoFiltros from '@/components/herramientas/biodiversidad/filtros/AvisoFiltros'
import SeccionTaxonomia from '@/components/herramientas/biodiversidad/filtros/SeccionTaxonomia'
import ContenedorFiltros from '@/components/herramientas/biodiversidad/filtros/ContenedorFiltros'
import { aplicabilidad } from '@/components/herramientas/biodiversidad/lib/aplicabilidad'
import { chipsActivos } from '@/components/herramientas/biodiversidad/lib/chips'
import { FILTROS_VACIOS, type Filtros } from '@/components/herramientas/biodiversidad/lib/filtros'
import type { MunicipioConteo } from '@/components/herramientas/biodiversidad/types'
import { createRef } from 'react'

const f = (c: Partial<Filtros> = {}): Filtros => ({ ...FILTROS_VACIOS, ...c })
const M = (c: string, n: string, d: string): MunicipioConteo => ({ codigo_municipal: c, municipio: n, departamento: d, registros: 5, sin_especie: 1, especies: 3 })
const MUNIS = [M('05837', 'Turbo', 'Antioquia'), M('27001', 'Quibdó', 'Chocó'), M('27002', 'Atrato', 'Chocó')]

beforeEach(() => { opciones.llamadas = []; sugerencias.llamadas = []; vi.useRealTimers() })
afterEach(() => vi.useRealTimers())

describe('Combobox accesible', () => {
  const ops = [{ valor: 'a', etiqueta: 'Anura', detalle: '10' }, { valor: 'b', etiqueta: 'Caudata', detalle: '2' }, { valor: 'c', etiqueta: 'Gymnophiona' }]
  function Caja({ onElegir = vi.fn() }) {
    return <Combobox etiqueta="Orden" seleccion={null} opciones={ops} onElegir={onElegir} onLimpiar={vi.fn()} />
  }
  test('roles, apertura, flechas, Enter y Escape', async () => {
    const onElegir = vi.fn()
    render(<Caja onElegir={onElegir} />)
    const caja = screen.getByRole('combobox', { name: 'Orden' })
    expect(caja).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(caja)
    expect(caja).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('listbox', { name: 'Orden' })).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(3)
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    expect(caja.getAttribute('aria-activedescendant')).toBe(screen.getAllByRole('option')[1].id)
    await userEvent.keyboard('{Enter}')
    expect(onElegir).toHaveBeenCalledWith(ops[1])
    expect(caja).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(caja)
    await userEvent.keyboard('{Escape}')
    expect(caja).toHaveAttribute('aria-expanded', 'false')
  })
  test('escribir filtra en el cliente sin acentos y anuncia cuando no hay coincidencias', async () => {
    render(<Caja />)
    await userEvent.type(screen.getByRole('combobox'), 'gym')
    expect(screen.getAllByRole('option')).toHaveLength(1)
    await userEvent.type(screen.getByRole('combobox'), 'zzz')
    expect(screen.queryAllByRole('option')).toHaveLength(0)
    expect(screen.getAllByText('Sin coincidencias').length).toBeGreaterThan(0)
  })
  test('con selección muestra el valor y un botón para quitarlo; deshabilitado explica el motivo', async () => {
    const onLimpiar = vi.fn()
    const { rerender } = render(<Combobox etiqueta="Clase" seleccion="Amphibia" opciones={[]} onElegir={vi.fn()} onLimpiar={onLimpiar} />)
    expect(screen.getByRole('combobox', { name: 'Clase' })).toHaveValue('Amphibia')
    await userEvent.click(screen.getByRole('button', { name: 'Quitar Clase' }))
    expect(onLimpiar).toHaveBeenCalled()
    rerender(<Combobox etiqueta="Clase" seleccion={null} opciones={[]} deshabilitado motivo="No aplica" onElegir={vi.fn()} onLimpiar={vi.fn()} />)
    expect(screen.getByRole('combobox', { name: 'Clase' })).toBeDisabled()
    expect(screen.getByRole('combobox', { name: 'Clase' })).toHaveAccessibleDescription('No aplica')
  })
})

describe('frugalidad: solo se piden opciones al abrir y con espera al escribir', () => {
  const props = { grupo: 'anfibios' as const, campo: 'familia' as const, etiqueta: 'Familia', params: { clase: 'Amphibia' }, seleccion: null, onElegir: vi.fn(), onLimpiar: vi.fn() }
  test('no consulta mientras está cerrado; al abrir consulta el campo con los filtros actuales', async () => {
    render(<ComboOpciones {...props} />)
    expect(opciones.llamadas.every((l) => l[3] === false)).toBe(true)
    await userEvent.click(screen.getByRole('combobox', { name: 'Familia' }))
    const ultima = opciones.llamadas[opciones.llamadas.length - 1]
    expect(ultima.slice(0, 3)).toEqual(['anfibios', 'familia', { clase: 'Amphibia' }])
    expect(ultima[3]).toBe(true)
    expect(screen.getByRole('option', { name: /Hylidae/ })).toHaveTextContent('5.513')
  })
  test('al teclear, el texto llega al servidor solo tras 300 ms y con una sola consulta final', () => {
    vi.useFakeTimers()
    render(<ComboOpciones {...props} />)
    const caja = screen.getByRole('combobox', { name: 'Familia' })
    fireEvent.focus(caja)
    for (const t of ['h', 'hy', 'hyl']) fireEvent.change(caja, { target: { value: t } })
    const conBuscar = () => opciones.llamadas.filter((l) => (l[2] as { buscar?: string }).buscar)
    expect(conBuscar()).toHaveLength(0)
    act(() => { vi.advanceTimersByTime(299) })
    expect(conBuscar()).toHaveLength(0)
    act(() => { vi.advanceTimersByTime(2) })
    const buscados = new Set(conBuscar().map((l) => (l[2] as { buscar: string }).buscar))
    expect([...buscados]).toEqual(['hyl'])
  })
  test('el texto se limpia a letras (nada de símbolos hacia el servidor)', () => {
    vi.useFakeTimers()
    render(<ComboOpciones {...props} />)
    const caja = screen.getByRole('combobox', { name: 'Familia' })
    fireEvent.focus(caja)
    fireEvent.change(caja, { target: { value: "hy%_;'lid" } })
    act(() => { vi.advanceTimersByTime(400) })
    expect(opciones.llamadas.some((l) => (l[2] as { buscar?: string }).buscar === 'hylid')).toBe(true)
  })
  test('sugerencias de especie: sin consulta bajo 2 letras, una consulta tras la espera', () => {
    vi.useFakeTimers()
    sugerencias.datos = { especies: [{ especie: 'Boana pugnax', especie_clave: 'K9', registros: 40 }] }
    render(<SelectorEspecie grupo="anfibios" metodo="individual" filtros={f({ clase: 'Amphibia' })} etiqueta="Buscar" onEspecie={vi.fn()} onLimpiar={vi.fn()} />)
    const caja = screen.getByRole('combobox', { name: 'Buscar' })
    fireEvent.focus(caja)
    fireEvent.change(caja, { target: { value: 'b' } })
    act(() => { vi.advanceTimersByTime(500) })
    expect(sugerencias.llamadas.every((l) => l[2] === false)).toBe(true)
    fireEvent.change(caja, { target: { value: 'boa' } })
    act(() => { vi.advanceTimersByTime(350) })
    const ultima = sugerencias.llamadas[sugerencias.llamadas.length - 1]
    expect(ultima[2]).toBe(true)
    expect(ultima[1]).toEqual({ clase: 'Amphibia', buscar: 'boa', tamano: 6, orden: 'registros' })
  })
})

describe('cascada de taxonomía', () => {
  function Cascada() {
    const [cambios, setCambios] = useState<unknown[]>([])
    return (
      <>
        <SeccionTaxonomia grupo="anfibios" metodo="individual" filtros={f({ clase: 'Amphibia', orden_taxon: 'Anura', familia: 'Hylidae' })} params={{ clase: 'Amphibia', orden_taxon: 'Anura' }} motivo={null}
          onCambio={(c) => setCambios((x) => [...x, c])} />
        <output data-testid="cambios">{JSON.stringify(cambios)}</output>
      </>
    )
  }
  test('siete niveles etiquetados, de lo general a lo específico', () => {
    render(<Cascada />)
    const nombres = screen.getAllByRole('combobox').map((c) => c.getAttribute('id') && (document.querySelector(`label[for="${c.id}"]`)?.textContent))
    expect(nombres).toEqual(['Reino', 'Filo', 'Clase', 'Orden', 'Familia', 'Género', 'Especie'])
  })
  test('quitar el orden limpia familia, género y especie; la clase se conserva', async () => {
    render(<Cascada />)
    await userEvent.click(screen.getByRole('button', { name: 'Quitar Orden' }))
    const cambios = JSON.parse(screen.getByTestId('cambios').textContent ?? '[]')[0]
    expect(cambios).toMatchObject({ orden_taxon: null, familia: null, genero: null, especie: null })
    expect(cambios).not.toHaveProperty('clase')
  })
  test('elegir una opción fija el nivel con el valor del servidor', async () => {
    render(<Cascada />)
    await userEvent.click(screen.getByRole('combobox', { name: 'Género' }))
    await userEvent.click(screen.getAllByRole('option')[0])
    const cambios = JSON.parse(screen.getByTestId('cambios').textContent ?? '[]')[0]
    expect(cambios).toMatchObject({ genero: 'Hylidae', especie: null })
  })
})

describe('panel de filtros y grupos agregados', () => {
  const montar = (filtros: Filtros, metodo: 'individual' | 'agregado', extra: object = {}) => {
    const onCambio = vi.fn()
    const onLimpiar = vi.fn()
    render(<PanelFiltros grupo={metodo === 'agregado' ? 'aves' : 'anfibios'} metodo={metodo} filtros={filtros} apl={aplicabilidad(metodo, filtros)} municipios={MUNIS}
      paramsOpciones={{}} desde={2000} hasta={2025} resultado="Mostrando 5 registros" idTitulo="t" onCambio={onCambio} onLimpiar={onLimpiar} {...extra} />)
    return { onCambio, onLimpiar }
  }
  test('individual: seis secciones, departamento y municipio se encadenan, años acotados entre sí', async () => {
    const { onCambio } = montar(f({ anioHasta: 2015 }), 'individual')
    const titulos = [...document.querySelectorAll('.bio-seccion-titulo')].map((x) => x.textContent)
    expect(titulos).toEqual(['Territorio', 'Taxonomía', 'Conservación', 'Fuente de datos', 'Tiempo y evidencia', 'Calidad del dato'])
    await userEvent.click(screen.getByRole('combobox', { name: 'Municipio' }))
    await userEvent.click(screen.getByRole('option', { name: /Quibdó/ }))
    expect(onCambio).toHaveBeenLastCalledWith({ municipio: '27001', departamento: 'Chocó' })
    await userEvent.click(screen.getByRole('combobox', { name: 'Departamento' }))
    await userEvent.click(screen.getByRole('option', { name: /Antioquia/ }))
    expect(onCambio).toHaveBeenLastCalledWith({ departamento: 'Antioquia', municipio: null })
    const desde = screen.getByLabelText('Desde') as HTMLSelectElement
    expect([...desde.options].map((o) => o.value).filter(Boolean).pop()).toBe('2015')
  })
  test('territorio: con departamento elegido solo se ofrecen sus municipios; quitar el municipio conserva el departamento', async () => {
    const { onCambio } = montar(f({ departamento: 'Chocó', municipio: '27001' }), 'individual')
    await userEvent.click(screen.getByRole('combobox', { name: 'Municipio' }))
    const lista = within(screen.getByRole('listbox', { name: 'Municipio' }))
    expect(lista.getAllByRole('option').map((o) => o.textContent)).toEqual([expect.stringContaining('Atrato'), expect.stringContaining('Quibdó')])
    await userEvent.keyboard('{Escape}')
    await userEvent.click(screen.getByRole('button', { name: 'Quitar Municipio' }))
    expect(onCambio).toHaveBeenLastCalledWith({ municipio: null })
    await userEvent.click(screen.getByRole('button', { name: 'Quitar Departamento' }))
    expect(onCambio).toHaveBeenLastCalledWith({ departamento: null, municipio: null })
  })
  test('territorio: sin departamento, elegir municipio fija también su departamento', async () => {
    const { onCambio } = montar(f(), 'individual')
    await userEvent.click(screen.getByRole('combobox', { name: 'Municipio' }))
    const lista = within(screen.getByRole('listbox', { name: 'Municipio' }))
    expect(lista.getAllByRole('option')).toHaveLength(3)
    await userEvent.click(lista.getByRole('option', { name: /Turbo/ }))
    expect(onCambio).toHaveBeenLastCalledWith({ municipio: '05837', departamento: 'Antioquia' })
  })
  test('«Limpiar todo» está deshabilitado sin filtros y funciona con filtros', async () => {
    const a = montar(f(), 'individual')
    expect(screen.getByRole('button', { name: 'Limpiar todo' })).toBeDisabled()
    expect(a.onLimpiar).not.toHaveBeenCalled()
  })
  test('limpiar todo', async () => {
    const { onLimpiar } = montar(f({ conFoto: true }), 'individual')
    await userEvent.click(screen.getByRole('button', { name: 'Limpiar todo' }))
    expect(onLimpiar).toHaveBeenCalled()
  })
  test('agregado: tiempo, evidencia y calidad deshabilitados con explicación; sin controles', () => {
    montar(f(), 'agregado')
    expect(screen.getAllByText('No aplica')).toHaveLength(2)
    expect(screen.getAllByText(/inventario agregado/).length).toBeGreaterThan(0)
    expect(screen.queryByRole('switch', { name: /Solo con foto/ })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Desde')).not.toBeInTheDocument()
  })
  test('agregado con taxonomía: la fuente se bloquea y lo explica; con fuente, la taxonomía se deshabilita', () => {
    const { unmount } = render(<div />)
    unmount()
    montar(f({ familia: 'Tyrannidae' }), 'agregado')
    expect(screen.getAllByText('No aplica')).toHaveLength(3)
    expect(screen.getByText(/La fuente no se combina|la fuente no se combina|no se combina con taxonomía/i)).toBeInTheDocument()
  })
  test('agregado con fuente: los niveles de taxonomía quedan deshabilitados', () => {
    montar(f({ entidad: 'e1050db2-9faf-4d72-b860-295debaf9d2a', nombreEntidad: 'IIAP' }), 'agregado')
    expect(screen.getByRole('combobox', { name: 'Clase' })).toBeDisabled()
    expect(screen.getByRole('combobox', { name: 'Especie' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Amenazadas' })).toBeDisabled()
  })
  test('en la hoja móvil el pie ofrece «Ver resultados» y cerrar', async () => {
    const onCerrar = vi.fn()
    montar(f(), 'individual', { onCerrar })
    await userEvent.click(screen.getByRole('button', { name: 'Ver resultados' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar los filtros' }))
    expect(onCerrar).toHaveBeenCalledTimes(2)
  })
})

describe('barra de filtros: atajos, chips, resumen', () => {
  const montar = (filtros: Filtros, metodo: 'individual' | 'agregado' = 'individual') => {
    const onCambio = vi.fn()
    const onLimpiar = vi.fn()
    const onToggle = vi.fn()
    render(<BarraFiltros grupo="anfibios" metodo={metodo} filtros={filtros} apl={aplicabilidad(metodo, filtros)} chips={chipsActivos(filtros, null)}
      resumen="Mostrando 5 registros · Anfibios · Chocó" panelAbierto={false} botonPanel={createRef()} onTogglePanel={onToggle} onCambio={onCambio} onLimpiar={onLimpiar} />)
    return { onCambio, onLimpiar, onToggle }
  }
  test('atajos de un clic: alternan conservación y foto con aria-pressed', async () => {
    const { onCambio } = montar(f())
    await userEvent.click(screen.getByRole('button', { name: 'Amenazadas' }))
    expect(onCambio).toHaveBeenLastCalledWith({ conservacion: 'amenazada', amenaza: null })
    await userEvent.click(screen.getByRole('button', { name: 'Endémicas' }))
    expect(onCambio).toHaveBeenLastCalledWith({ conservacion: 'endemica', amenaza: null })
    await userEvent.click(screen.getByRole('button', { name: 'Invasoras' }))
    expect(onCambio).toHaveBeenLastCalledWith({ conservacion: 'invasora', amenaza: null })
    await userEvent.click(screen.getByRole('button', { name: 'Con foto' }))
    expect(onCambio).toHaveBeenLastCalledWith({ con_foto: '1' })
  })
  test('atajo activo se puede apagar', async () => {
    const { onCambio } = montar(f({ conservacion: 'endemica', conFoto: true }))
    expect(screen.getByRole('button', { name: 'Endémicas' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Endémicas' }))
    expect(onCambio).toHaveBeenLastCalledWith({ conservacion: null, amenaza: null })
    await userEvent.click(screen.getByRole('button', { name: 'Con foto' }))
    expect(onCambio).toHaveBeenLastCalledWith({ con_foto: null })
  })
  test('agregado: «Con foto» deshabilitado', () => {
    montar(f(), 'agregado')
    expect(screen.getByRole('button', { name: 'Con foto' })).toBeDisabled()
  })
  test('chips quitables, «Limpiar todo», contador y resumen anunciado', async () => {
    const { onCambio, onLimpiar, onToggle } = montar(f({ clase: 'Amphibia', familia: 'Hylidae', conFoto: true }))
    expect(screen.getByText('Mostrando 5 registros · Anfibios · Chocó')).toBeInTheDocument()
    const lista = screen.getByRole('list', { name: 'Filtros activos' })
    expect(within(lista).getAllByRole('listitem')).toHaveLength(4)
    await userEvent.click(screen.getByRole('button', { name: 'Quitar el filtro Familia: Hylidae' }))
    expect(onCambio).toHaveBeenLastCalledWith(expect.objectContaining({ familia: null }))
    await userEvent.click(screen.getByRole('button', { name: 'Limpiar todo' }))
    expect(onLimpiar).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /Filtros/ })).toHaveTextContent('3')
    await userEvent.click(screen.getByRole('button', { name: /Filtros/ }))
    expect(onToggle).toHaveBeenCalled()
  })
  test('elegir una sugerencia de especie la fija como filtro; Enter con texto libre filtra por nombre', async () => {
    sugerencias.datos = { especies: [{ especie: 'Boana pugnax', especie_clave: 'K9', registros: 40 }] }
    const { onCambio } = montar(f())
    const caja = screen.getByRole('combobox', { name: 'Buscar una especie' })
    await userEvent.click(caja)
    await userEvent.type(caja, 'boa')
    await act(async () => { await new Promise((r) => setTimeout(r, 400)) })
    await userEvent.click(await screen.findByRole('option', { name: /Boana pugnax/ }))
    expect(onCambio).toHaveBeenLastCalledWith({ especie: 'K9', nombre_especie: 'Boana pugnax', buscar: null })
    await userEvent.type(caja, 'rhin{Enter}')
    expect(onCambio).toHaveBeenLastCalledWith({ buscar: 'rhin', especie: null, nombre_especie: null })
  })
})

describe('avisos y contenedor', () => {
  test('aviso descartable con la lista de lo quitado y vacío sin elementos', async () => {
    const onCerrar = vi.fn()
    const { rerender, container } = render(<AvisoFiltros titulo="Se quitaron:" elementos={['Familia Hylidae', 'Años']} onCerrar={onCerrar} />)
    expect(screen.getByRole('status')).toHaveTextContent('Se quitaron: Familia Hylidae · Años')
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar el aviso' }))
    expect(onCerrar).toHaveBeenCalled()
    rerender(<AvisoFiltros titulo="x" elementos={[]} onCerrar={onCerrar} />)
    expect(container).toBeEmptyDOMElement()
  })
  test('escritorio: columna lateral; móvil: diálogo modal que cierra con Escape; cerrado: nada', async () => {
    const onCerrar = vi.fn()
    const hijo = (id: string) => <h2 id={id}>Filtros</h2>
    const { rerender } = render(<ContenedorFiltros ancho abierto origen={createRef()} onCerrar={onCerrar}>{hijo}</ContenedorFiltros>)
    expect(screen.getByRole('complementary')).toBeInTheDocument()
    rerender(<ContenedorFiltros ancho={false} abierto origen={createRef()} onCerrar={onCerrar}>{hijo}</ContenedorFiltros>)
    expect(screen.getByRole('dialog', { name: 'Filtros' })).toHaveAttribute('aria-modal', 'true')
    await userEvent.keyboard('{Escape}')
    expect(onCerrar).toHaveBeenCalled()
    rerender(<ContenedorFiltros ancho abierto={false} origen={createRef()} onCerrar={onCerrar}>{hijo}</ContenedorFiltros>)
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
