import { createRef } from 'react'
import { describe, expect, test, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const datos = vi.hoisted(() => ({
  municipios: { municipios: [] as unknown[] },
  registros: { registros: [] as unknown[], total: 0 },
}))
vi.mock('@/hooks/useBiodiversidad', () => ({
  useBiodiversidadMunicipios: () => ({ data: datos.municipios, isPending: false, isError: false }),
  useBiodiversidadRegistros: (_g: unknown, _p: unknown, habilitado: boolean) => ({ data: habilitado ? datos.registros : undefined, isPending: false, isError: false }),
  useBiodiversidadOpciones: () => ({ data: undefined, isFetching: false, isError: false }),
  useBiodiversidadSugerencias: () => ({ data: undefined, isFetching: false, isError: false }),
}))

import DetalleEspecie from '@/components/herramientas/biodiversidad/especies/DetalleEspecie'
import RankingPanel from '@/components/herramientas/biodiversidad/RankingPanel'
import PanelFiltros from '@/components/herramientas/biodiversidad/filtros/PanelFiltros'
import Combobox from '@/components/herramientas/biodiversidad/filtros/Combobox'
import { aplicabilidad } from '@/components/herramientas/biodiversidad/lib/aplicabilidad'
import { FILTROS_VACIOS, type Filtros } from '@/components/herramientas/biodiversidad/lib/filtros'
import { traducirMarcaLocal } from '@/components/herramientas/biodiversidad/lib/marcas'
import type { EspecieResumen, Foto, MunicipioConteo } from '@/components/herramientas/biodiversidad/types'

const IMG = 'https://api.gbif.org/v1/image/cache/400x/occurrence/4512345678/media/0123456789abcdef0123456789abcdef'
const foto: Foto = { imagen: IMG, autor: 'Ana Pérez', editor: null, licencia: 'http://creativecommons.org/licenses/by-nc/4.0/legalcode', referencia: 'https://www.inaturalist.org/photos/99' }
const esp = (over: Partial<EspecieResumen> = {}): EspecieResumen => ({
  especie: 'Atelopus spurrelli', especie_clave: 'E1', reino: 'Animalia', clase: 'Amphibia', orden: 'Anura', familia: 'Bufonidae', genero: 'Atelopus',
  registros: 120, municipios: 7, amenaza: 'CR', endemica_colombia: false, endemica_choco: true, introducida: false, invasora: false, foto, fotos_total: 3, ...over,
})
const mun = (codigo: string, municipio: string, departamento: string, registros: number): MunicipioConteo =>
  ({ codigo_municipal: codigo, municipio, departamento, registros, sin_especie: 0, especies: 1 })
const f = (c: Partial<Filtros> = {}): Filtros => ({ ...FILTROS_VACIOS, ...c })

describe('DetalleEspecie («Ver más» de toda tarjeta)', () => {
  const montar = (e: EspecieResumen, esIndividual: boolean) => {
    const props = { onCerrar: vi.fn(), onVerRegistros: vi.fn(), onVerMunicipios: vi.fn() }
    render(<DetalleEspecie e={e} grupo={esIndividual ? 'anfibios' : 'aves'} esIndividual={esIndividual} origen={createRef()} {...props} />)
    return props
  }
  test('muestra nombre, linaje completo, cifras y conservación; el velo deja pasar la rueda a Lenis', () => {
    datos.municipios = { municipios: [mun('1', 'Quibdó', 'Chocó', 80), mun('2', 'Atrato', 'Chocó', 40), mun('3', 'Turbo', 'Antioquia', 0)] }
    datos.registros = { registros: [], total: 0 }
    montar(esp(), true)
    const dialogo = screen.getByRole('dialog')
    expect(within(dialogo).getByRole('heading', { name: 'Atelopus spurrelli' }).tagName).toBe('H2')
    expect(within(dialogo).getByText('Animalia › Amphibia › Anura › Bufonidae › Atelopus')).toBeInTheDocument()
    expect(within(dialogo).getByText('120')).toBeInTheDocument()
    expect(within(dialogo).getByText('CR · En peligro crítico')).toBeInTheDocument()
    expect(dialogo.parentElement).toHaveAttribute('data-lenis-prevent')
  })
  test('«Dónde se registra»: municipios con registros, de más a menos, sin los de cero', () => {
    datos.municipios = { municipios: [mun('2', 'Atrato', 'Chocó', 40), mun('1', 'Quibdó', 'Chocó', 80), mun('3', 'Turbo', 'Antioquia', 0)] }
    montar(esp(), true)
    const items = within(screen.getByRole('list', { name: 'Municipios donde se registra' })).getAllByRole('listitem').map((l) => l.textContent)
    expect(items).toHaveLength(2)
    expect(items[0]).toContain('Quibdó')
    expect(items[1]).toContain('Atrato')
  })
  test('individual: fotografías con crédito; agregado: no hay sección de fotografías', () => {
    datos.municipios = { municipios: [] }
    datos.registros = { registros: [{ gbif_id: '9', foto, fotos_total: 1 }], total: 1 }
    const { unmount } = render(<DetalleEspecie e={esp()} grupo="anfibios" esIndividual origen={createRef()} onCerrar={vi.fn()} onVerRegistros={vi.fn()} />)
    expect(screen.getByText(/Foto: Ana Pérez/)).toBeInTheDocument()
    unmount()
    montar(esp({ foto: null }), false)
    expect(screen.queryByText(/Foto:/)).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Fotografías' })).not.toBeInTheDocument()
  })
  test('acciones: individual lleva a los registros; Escape cierra', async () => {
    const a = montar(esp(), true)
    await userEvent.click(screen.getByRole('button', { name: /Ver los registros/ }))
    expect(a.onVerRegistros).toHaveBeenCalledWith(expect.objectContaining({ especie_clave: 'E1' }))
    await userEvent.keyboard('{Escape}')
    expect(a.onCerrar).toHaveBeenCalled()
  })
  test('agregado: «Ver por municipio» en lugar de registros', async () => {
    const a = montar(esp({ foto: null }), false)
    expect(screen.queryByRole('button', { name: /Ver los registros/ })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Ver por municipio/ }))
    expect(a.onVerMunicipios).toHaveBeenCalled()
  })
})

describe('ranking con departamento elegido', () => {
  const MUNIS = [mun('1', 'Turbo', 'Antioquia', 900), mun('2', 'Quibdó', 'Chocó', 800), mun('3', 'Atrato', 'Chocó', 100), mun('4', 'Cali', 'Valle del Cauca', 700)]
  const montar = (departamento: string | null) =>
    render(<RankingPanel municipios={MUNIS} metrica="registros" seleccionado={null} departamento={departamento} onMunicipio={vi.fn()} onDepartamento={vi.fn()} />)
  test('sin departamento: todos los municipios', () => {
    montar(null)
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
  })
  test('con departamento: solo los municipios de ese departamento, y el título lo dice', () => {
    montar('Chocó')
    const filas = screen.getAllByRole('listitem').map((l) => l.textContent ?? '')
    expect(filas).toHaveLength(2)
    expect(filas[0]).toContain('Quibdó')
    expect(filas.join(' ')).not.toContain('Turbo')
    expect(screen.getByText(/en Chocó/)).toBeInTheDocument()
  })
})

describe('revisión de Vigía: una ausencia de dato no se presenta como alerta', () => {
  test('incertidumbre no informada es una nota neutra con texto claro', () => {
    const m = traducirMarcaLocal('incertidumbre_no_informada')
    expect(m.tono).toBe('info')
    expect(m.texto).toBe('El publicador no indicó la precisión de la coordenada')
  })
  test('las demás de precisión siguen siendo avisos', () => {
    expect(traducirMarcaLocal('incertidumbre_mayor_umbral').tono).toBe('aviso')
  })
})

describe('panel de filtros: lo que no aplica no estorba y el scroll suave no captura los desplazables', () => {
  const panel = (grupo: 'aves' | 'anfibios', metodo: 'agregado' | 'individual') => {
    const filtros = f()
    render(<PanelFiltros grupo={grupo} metodo={metodo} filtros={filtros} apl={aplicabilidad(metodo, filtros)} municipios={[]} paramsOpciones={{}}
      desde={2000} hasta={2025} resultado="x" idTitulo="t" onCambio={vi.fn()} onLimpiar={vi.fn()} />)
  }
  test('inventario agregado: sin secciones vacías; una sola nota explica por qué', () => {
    panel('aves', 'agregado')
    const titulos = [...document.querySelectorAll('.bio-seccion-titulo')].map((x) => x.textContent)
    expect(titulos).not.toContain('Tiempo y evidencia')
    expect(titulos).not.toContain('Calidad del dato')
    expect(screen.queryByText('No aplica')).not.toBeInTheDocument()
    expect(screen.getByText(/solo existen para mamíferos, anfibios, reptiles y hongos/)).toBeInTheDocument()
  })
  test('individual: conserva las seis secciones y el cuerpo desplazable lleva data-lenis-prevent', () => {
    panel('anfibios', 'individual')
    expect(document.querySelectorAll('.bio-seccion-titulo')).toHaveLength(6)
    expect(document.querySelector('.bio-filtros-cuerpo')).toHaveAttribute('data-lenis-prevent')
  })
  test('lista del combobox con data-lenis-prevent', async () => {
    render(<Combobox etiqueta="Orden" seleccion={null} opciones={[{ valor: 'a', etiqueta: 'Anura' }]} onElegir={vi.fn()} onLimpiar={vi.fn()} />)
    await userEvent.click(screen.getByRole('combobox', { name: 'Orden' }))
    expect(screen.getByRole('listbox', { name: 'Orden' })).toHaveAttribute('data-lenis-prevent')
  })
})
