import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, useState } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import type {
  EspecieResumen, Foto, RegistroBiodiversidad, RegistroDetalle, RespuestaEspecies, RespuestaResumen,
} from '@/components/herramientas/biodiversidad/types'

type Q = Partial<UseQueryResult<unknown>>
const detalle: { q: Q } = { q: {} }
const especies: { q: Q } = { q: {} }
const resumen: { q: Q } = { q: {} }
const series: { q: Q } = { q: {} }
vi.mock('@/hooks/useBiodiversidad', () => ({
  useBiodiversidadRegistro: () => detalle.q,
  useBiodiversidadEspecies: () => especies.q,
  useBiodiversidadResumen: () => resumen.q,
  useBiodiversidadSeries: () => series.q,
}))

import SelectorGrupo from '@/components/herramientas/biodiversidad/SelectorGrupo'
import TarjetaRegistro from '@/components/herramientas/biodiversidad/registros/TarjetaRegistro'
import DetalleRegistro from '@/components/herramientas/biodiversidad/registros/DetalleRegistro'
import SeccionEspecies from '@/components/herramientas/biodiversidad/especies/SeccionEspecies'
import PanelResumen from '@/components/herramientas/biodiversidad/resumen/PanelResumen'
import GraficoAnios from '@/components/herramientas/biodiversidad/resumen/GraficoAnios'
import BarrasEvidencia from '@/components/herramientas/biodiversidad/resumen/BarrasEvidencia'
import FiltroConservacion from '@/components/herramientas/biodiversidad/FiltroConservacion'
import CampoBusqueda from '@/components/herramientas/biodiversidad/CampoBusqueda'
import Paginacion from '@/components/herramientas/biodiversidad/Paginacion'
import LeyendaEscala from '@/components/herramientas/biodiversidad/mapa/LeyendaEscala'
import InsigniasConservacion from '@/components/herramientas/biodiversidad/InsigniasConservacion'
import { GRUPOS, type GrupoEstado } from '@/components/herramientas/biodiversidad/types'

const IMG = 'https://api.gbif.org/v1/image/cache/400x/occurrence/4512345678/media/0123456789abcdef0123456789abcdef'
const foto = (over: Partial<Foto> = {}): Foto => ({
  imagen: IMG, autor: 'Ana Pérez', editor: null, licencia: 'http://creativecommons.org/licenses/by-nc/4.0/legalcode',
  referencia: 'https://www.inaturalist.org/photos/99', ...over,
})
const reg = (over: Partial<RegistroBiodiversidad> = {}): RegistroBiodiversidad => ({
  gbif_id: '123456', especie: 'Rhinella marina', especie_clave: 'K1', anio: 2014, fecha_evento: '2014-03-05', tipo_evidencia: 'HUMAN_OBSERVATION',
  licencia: 'http://creativecommons.org/licenses/by-nc/4.0/legalcode', latitud: 8.0882, longitud: -76.8368, incertidumbre_m: 20,
  coordenadas_ocultas: false, conjunto: 'Conjunto', doi_conjunto: '10.15472/7okxxe', codigo_municipal: '05837', municipio: 'Turbo',
  departamento: 'Antioquia', registrado_por: 'Observadora <b>Uno</b>', identificado_por: 'Ident Dos', foto: foto(), fotos_total: 1,
  amenaza: null, endemica_colombia: false, endemica_choco: false, introducida: false, invasora: false, ...over,
})
const det = (over: Partial<RegistroDetalle> = {}): RegistroDetalle => ({
  ...reg(), fotos: [foto(), foto({ imagen: IMG.replace('0123', '4567'), autor: null })], marcas_revision: ['incertidumbre_mayor_umbral;incertidumbre_no_informada', 'marca_nueva'], marcas_gbif: ['COORDINATE_ROUNDED', 'MARCA_RARA', 'TAXON_ID_NOT_FOUND'],
  institution_code: 'IAvH', collection_code: 'ANF', catalog_number: '77', occurrence_id: 'urn:1', nombre_original: 'Bufo marinus',
  taxonomia: { reino: 'Animalia', clase: 'Amphibia', orden: 'Anura', familia: 'Bufonidae', genero: 'Rhinella' }, ...over,
})
const esp = (over: Partial<EspecieResumen> = {}): EspecieResumen => ({
  especie: 'Atelopus spurrelli', especie_clave: 'E1', reino: 'Animalia', clase: 'Amphibia', orden: 'Anura', familia: 'Bufonidae', genero: 'Atelopus',
  registros: 120, municipios: 7, amenaza: 'CR', endemica_colombia: true, endemica_choco: false, introducida: false, invasora: false, ...over,
})

beforeEach(() => {
  detalle.q = { data: det(), isError: false, refetch: vi.fn() as never }
  const e: RespuestaEspecies = { grupo: 'anfibios', metodo: 'individual', pagina: 1, tamano: 20, total: 2, especies: [esp(), esp({ especie: 'Rana x', especie_clave: 'E2', amenaza: null, endemica_colombia: false })] }
  especies.q = { data: e, isError: false, isPending: false, isFetching: false, refetch: vi.fn() as never }
})
afterEach(() => vi.useRealTimers())

describe('SelectorGrupo', () => {
  const grupos: GrupoEstado[] = [
    { grupo: 'aves', metodo: 'agregado', desde: 2000, hasta: 2025, registros: 2919072, fecha_fuente: null, doi: null },
    { grupo: 'anfibios', metodo: 'individual', desde: 2000, hasta: 2025, registros: 18234, fecha_fuente: null, doi: null },
  ]
  test('radiogroup con los siete grupos, total es-CO y método', () => {
    render(<SelectorGrupo grupo="aves" grupos={grupos} onCambiar={vi.fn()} />)
    expect(screen.getByRole('radiogroup', { name: 'Grupo taxonómico' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(GRUPOS.length)
    expect(screen.getByRole('radio', { name: /Aves/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: /Aves/ })).toHaveTextContent('2.919.072')
    expect(screen.getByRole('radio', { name: /Aves/ })).toHaveTextContent('Agregado')
    expect(screen.getByRole('radio', { name: /Anfibios/ })).toHaveTextContent('Individuales')
  })
  test('solo el grupo activo está en el orden de tabulación', () => {
    render(<SelectorGrupo grupo="mamiferos" grupos={undefined} onCambiar={vi.fn()} />)
    const tabs = screen.getAllByRole('radio').map((r) => r.getAttribute('tabindex'))
    expect(tabs.filter((t) => t === '0')).toHaveLength(1)
    expect(screen.getByRole('radio', { name: /Mamíferos/ })).toHaveAttribute('tabindex', '0')
  })
  test('flechas, Inicio y Fin cambian de grupo y mueven el foco', async () => {
    const onCambiar = vi.fn()
    render(<SelectorGrupo grupo="aves" grupos={grupos} onCambiar={onCambiar} />)
    screen.getByRole('radio', { name: /Aves/ }).focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(onCambiar).toHaveBeenLastCalledWith('mamiferos')
    expect(screen.getByRole('radio', { name: /Mamíferos/ })).toHaveFocus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(onCambiar).toHaveBeenLastCalledWith('aves')
    await userEvent.keyboard('{End}')
    expect(onCambiar).toHaveBeenLastCalledWith('hongos')
    await userEvent.keyboard('{Home}')
    expect(onCambiar).toHaveBeenLastCalledWith('aves')
    await userEvent.keyboard('{ArrowLeft}')
    expect(onCambiar).toHaveBeenLastCalledWith('hongos')
  })
  test('clic elige el grupo', async () => {
    const onCambiar = vi.fn()
    render(<SelectorGrupo grupo="aves" grupos={grupos} onCambiar={onCambiar} />)
    await userEvent.click(screen.getByRole('radio', { name: /Plantas/ }))
    expect(onCambiar).toHaveBeenCalledWith('plantas')
  })
})

describe('TarjetaRegistro y fotografías', () => {
  test('foto válida: lazy, async, sin referrer, alt descriptivo y crédito con autor y licencia', () => {
    const { container } = render(<TarjetaRegistro r={reg()} onAbrir={vi.fn()} />)
    const img = container.querySelector('img')!
    expect(img).toHaveAttribute('src', IMG.replace('/400x/', '/480x/'))
    expect(img).toHaveAttribute('loading', 'lazy')
    expect(img).toHaveAttribute('decoding', 'async')
    expect(img).toHaveAttribute('referrerpolicy', 'no-referrer')
    expect(img.getAttribute('alt')).toBe('Fotografía de Rhinella marina registrada en Turbo en 2014')
    expect(screen.getByText(/Foto: Ana Pérez/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'CC BY-NC' })).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByRole('link', { name: /Ver la fotografía en su fuente/ })).toHaveAttribute('href', 'https://www.inaturalist.org/photos/99')
  })
  test('una foto con URL fuera del patrón NO se renderiza (ni la original de S3)', () => {
    const { container } = render(<TarjetaRegistro r={reg({ foto: foto({ imagen: 'https://s3.amazonaws.com/b/original.jpg' }) })} onAbrir={vi.fn()} />)
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText('Sin fotografía')).toBeInTheDocument()
  })
  test('sin foto: marcador y sin crédito', () => {
    const { container } = render(<TarjetaRegistro r={reg({ foto: null, fotos_total: 0 })} onAbrir={vi.fn()} />)
    expect(container.querySelector('img')).toBeNull()
    expect(screen.queryByText(/Foto:/)).not.toBeInTheDocument()
  })
  test('referencia insegura no genera enlace; autor ausente se dice', () => {
    render(<TarjetaRegistro r={reg({ foto: foto({ referencia: 'javascript:alert(1)', autor: null }) })} onAbrir={vi.fn()} />)
    expect(screen.getByText(/autor sin indicar/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Ver la fotografía/ })).not.toBeInTheDocument()
  })
  test('error de carga cambia al marcador', () => {
    const { container } = render(<TarjetaRegistro r={reg()} onAbrir={vi.fn()} />)
    fireEvent.error(container.querySelector('img')!)
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText('No se pudo cargar la fotografía')).toBeInTheDocument()
  })
  test('coordenadas ocultas: «Ubicación reservada» y nunca lat/lon', () => {
    const { container } = render(<TarjetaRegistro r={reg({ coordenadas_ocultas: true, latitud: 8.0882, longitud: -76.8368 })} onAbrir={vi.fn()} />)
    expect(screen.getByText('Ubicación reservada')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/8[,.]0882|76[,.]8368/)
  })
  test('especie en cursiva, evidencia traducida, insignias y abrir detalle', async () => {
    const onAbrir = vi.fn()
    render(<TarjetaRegistro r={reg({ amenaza: 'VU', endemica_choco: true, fotos_total: 3 })} onAbrir={onAbrir} />)
    expect(screen.getByText('Rhinella marina')).toHaveClass('italic')
    expect(screen.getByText('Observación humana')).toBeInTheDocument()
    expect(screen.getByText('3 fotos')).toBeInTheDocument()
    expect(screen.getByText('VU')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Ver detalle del registro/ }))
    expect(onAbrir).toHaveBeenCalledWith(expect.objectContaining({ gbif_id: '123456' }), expect.any(HTMLElement))
  })
})

describe('DetalleRegistro', () => {
  function abrir(onCerrar = vi.fn()) {
    const origen = createRef<HTMLElement>()
    const boton = document.createElement('button')
    document.body.appendChild(boton)
    ;(origen as { current: HTMLElement | null }).current = boton
    const r = render(<DetalleRegistro grupo="anfibios" gbifId="123456" origen={origen} onCerrar={onCerrar} />)
    return { ...r, onCerrar, boton }
  }
  test('diálogo modal con galería, autoría, taxonomía, observador como texto y enlaces seguros', () => {
    abrir()
    const container = document.body
    expect(screen.getByRole('dialog', { name: 'Rhinella marina' })).toHaveAttribute('aria-modal', 'true')
    expect(container.querySelectorAll('.bio-galeria img').length).toBeGreaterThan(0)
    expect(screen.getByText(/Animalia › Amphibia › Anura › Bufonidae › Rhinella/)).toBeInTheDocument()
    expect(screen.getByText('Observadora <b>Uno</b>')).toBeInTheDocument()
    expect(container.querySelector('dd b')).toBeNull()
    expect(screen.getByText('Ident Dos')).toBeInTheDocument()
    expect(screen.getByText('Bufo marinus')).toBeInTheDocument()
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href') ?? '')
    expect(hrefs.every((h) => /^https:\/\/(www\.gbif\.org\/occurrence\/\d+|doi\.org\/|creativecommons\.org\/|www\.inaturalist\.org\/)/.test(h))).toBe(true)
    screen.getAllByRole('link').forEach((a) => expect(a).toHaveAttribute('rel', 'noopener noreferrer'))
  })
  test('calidad del dato: marcas locales (separadas por «;») y de GBIF traducidas con su tono', () => {
    abrir()
    expect(screen.getByText('La incertidumbre de la coordenada es grande: la ubicación es aproximada').closest('li')).toHaveClass('bio-marca-aviso')
    expect(screen.getByText('El publicador no informó la incertidumbre de la coordenada')).toBeInTheDocument()
    expect(screen.getByText('Marca de revisión de la plataforma: marca_nueva')).toBeInTheDocument()
    expect(screen.getByText('Coordenadas redondeadas por el publicador')).toBeInTheDocument()
    expect(screen.getByText('Marca de calidad de GBIF: MARCA_RARA')).toBeInTheDocument()
    expect(screen.getByText('El identificador del taxón no se encontró en la fuente').closest('li')).toHaveClass('bio-marca-aviso')
    expect(screen.getByText('Coordenadas redondeadas por el publicador').closest('li')).toHaveClass('bio-marca-info')
  })
  test('miniaturas cambian la foto principal y cada una conserva crédito', async () => {
    abrir()
    expect(screen.getByText(/Foto: Ana Pérez/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Ver fotografía 2 de 2' }))
    expect(screen.getByText(/Foto: autor sin indicar/)).toBeInTheDocument()
  })
  test('coordenadas ocultas: jamás aparecen lat/lon', () => {
    detalle.q = { data: det({ coordenadas_ocultas: true, latitud: 8.0882, longitud: -76.8368 }), isError: false, refetch: vi.fn() as never }
    abrir()
    const container = document.body
    expect(screen.getByText('Ubicación reservada')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/8[,.]0882|76[,.]8368/)
  })
  test('sin marcas ni fotos: mensajes claros', () => {
    detalle.q = { data: det({ marcas_revision: [], marcas_gbif: undefined, fotos: [], doi_conjunto: 'no-doi' }), isError: false, refetch: vi.fn() as never }
    abrir()
    expect(screen.getByText(/GBIF no señaló observaciones/)).toBeInTheDocument()
    expect(screen.getByText(/No se detectaron observaciones en la revisión/)).toBeInTheDocument()
    expect(screen.getByText('Sin fotografía')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /DOI/ })).not.toBeInTheDocument()
  })
  test('Escape y el botón cerrar llaman a onCerrar; el foco se queda dentro con Tab', async () => {
    const { onCerrar } = abrir()
    const dialogo = screen.getByRole('dialog')
    expect(dialogo).toHaveFocus()
    const focalizables = within(dialogo).getAllByRole('button').concat(within(dialogo).getAllByRole('link'))
    const ultimo = focalizables[focalizables.length - 1]
    ultimo.focus()
    await userEvent.tab()
    expect(dialogo.contains(document.activeElement)).toBe(true)
    await userEvent.keyboard('{Escape}')
    expect(onCerrar).toHaveBeenCalledTimes(1)
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar el detalle del registro' }))
    expect(onCerrar).toHaveBeenCalledTimes(2)
  })
  test('devuelve el foco al elemento que lo abrió y restaura el desplazamiento', () => {
    const { unmount, boton } = abrir()
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(boton).toHaveFocus()
    expect(document.body.style.overflow).toBe('')
  })
  test('estado de carga y error con reintento', async () => {
    detalle.q = { data: undefined, isError: false, refetch: vi.fn() as never }
    const { unmount } = abrir()
    expect(screen.getByRole('status', { name: 'Cargando el registro' })).toBeInTheDocument()
    unmount()
    const refetch = vi.fn()
    detalle.q = { data: undefined, isError: true, error: { status: 404 } as never, refetch: refetch as never }
    abrir()
    await userEvent.click(screen.getByRole('button', { name: /Reintentar/ }))
    expect(refetch).toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Sin datos disponibles')
  })
})

describe('SeccionEspecies', () => {
  const props = {
    grupo: 'anfibios' as const, esIndividual: true, municipio: null, departamento: null, buscar: '', conservacion: null, amenaza: null,
    orden: 'registros' as const, pagina: 1, conFoto: false, modo: 'tarjetas' as const,
  }
  test('lista con taxonomía, insignias, cifras y acción para ver registros', async () => {
    const onVerRegistros = vi.fn()
    render(<SeccionEspecies {...props} onCambio={vi.fn()} onVerRegistros={onVerRegistros} />)
    expect(screen.getByText('2 especies')).toBeInTheDocument()
    expect(screen.getByText('Atelopus spurrelli').tagName).toBe('I')
    expect(screen.getAllByText('Anura · Bufonidae')).toHaveLength(2)
    expect(screen.getByText('CR · En peligro crítico')).toBeInTheDocument()
    expect(screen.getByText('Endémica de Colombia')).toBeInTheDocument()
    await userEvent.click(screen.getAllByRole('button', { name: /Ver registros/ })[0])
    expect(onVerRegistros).toHaveBeenCalledWith(expect.objectContaining({ especie_clave: 'E1' }))
  })
  test('grupo agregado: sin botón de registros y con aviso', () => {
    render(<SeccionEspecies {...props} esIndividual={false} onCambio={vi.fn()} onVerRegistros={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /Ver registros/ })).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Inventario agregado')
  })
  test('filtros y orden salen como cambios de URL', async () => {
    const onCambio = vi.fn()
    render(<SeccionEspecies {...props} onCambio={onCambio} onVerRegistros={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Amenazadas' }))
    expect(onCambio).toHaveBeenLastCalledWith({ conservacion: 'amenazada', amenaza: null })
    await userEvent.click(screen.getByRole('button', { name: 'Nombre' }))
    expect(onCambio).toHaveBeenLastCalledWith({ orden: 'nombre' })
  })
  test('vacío con filtros, error con reintento y carga', async () => {
    especies.q = { data: { grupo: 'anfibios', metodo: 'individual', pagina: 1, tamano: 20, total: 0, especies: [] }, isError: false, isFetching: false, refetch: vi.fn() as never }
    const { rerender } = render(<SeccionEspecies {...props} buscar="zzz" onCambio={vi.fn()} onVerRegistros={vi.fn()} />)
    expect(screen.getByText('Sin especies')).toBeInTheDocument()
    expect(screen.getByText(/Prueba con otro nombre/)).toBeInTheDocument()
    const refetch = vi.fn()
    especies.q = { data: undefined, isError: true, error: { status: 422 } as never, refetch: refetch as never }
    rerender(<SeccionEspecies {...props} onCambio={vi.fn()} onVerRegistros={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /Reintentar/ }))
    expect(refetch).toHaveBeenCalled()
    especies.q = { data: undefined, isError: false, isPending: true, refetch: vi.fn() as never }
    rerender(<SeccionEspecies {...props} onCambio={vi.fn()} onVerRegistros={vi.fn()} />)
    expect(screen.getByRole('status', { name: 'Cargando especies' })).toBeInTheDocument()
  })
  test('paginación cuando hay más de una página', async () => {
    const onCambio = vi.fn()
    especies.q = { data: { grupo: 'anfibios', metodo: 'individual', pagina: 1, tamano: 20, total: 95, especies: [esp()] }, isError: false, isFetching: false, refetch: vi.fn() as never }
    render(<SeccionEspecies {...props} onCambio={onCambio} onVerRegistros={vi.fn()} />)
    expect(screen.getByText('Página 1 de 5')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Siguiente/ }))
    expect(onCambio).toHaveBeenCalledWith({ pagina: 2 })
  })
})

describe('PanelResumen', () => {
  const R: RespuestaResumen = {
    grupo: 'aves', metodo: 'agregado', alcance: { codigo_municipal: null, departamento: null }, registros: 2919072, especies: 1500, con_foto: null,
    amenazadas: { CR: 0, EN: 4, VU: 9, total: 13 }, endemicas_colombia: 30, endemicas_choco: 12, introducidas: 2, invasoras: 1, anio_min: 2000, anio_max: 2025,
  }
  beforeEach(() => {
    resumen.q = { data: R, isError: false, isFetching: false, refetch: vi.fn() as never }
    series.q = { data: { grupo: 'aves', metodo: 'agregado', por_anio: [{ anio: 2000, registros: 10 }, { anio: 2001, registros: 30 }], por_evidencia: [{ tipo: 'HUMAN_OBSERVATION', registros: 30 }, { tipo: 'PRESERVED_SPECIMEN', registros: 10 }] }, isError: false, refetch: vi.fn() as never }
  })
  test('indicadores, conservación con colores UICN y evidencia traducida', () => {
    render(<PanelResumen grupo="aves" alcance={{}} nombreAlcance={null} esIndividual={false} onFiltrarEspecies={vi.fn()} onVerRegistros={vi.fn()} />)
    expect(screen.getByText('2.919.072')).toBeInTheDocument()
    expect(screen.getByText('el inventario agregado no las incluye')).toBeInTheDocument()
    expect(screen.getByText('2000–2025')).toBeInTheDocument()
    expect(screen.getByText('En peligro')).toBeInTheDocument()
    expect(screen.getByText('Vulnerable')).toBeInTheDocument()
    expect(screen.getByText(/13/)).toBeInTheDocument()
    expect(screen.getByText('Observación humana')).toBeInTheDocument()
    expect(screen.getByText(/Cifras de todo el Chocó biogeográfico\./)).toBeInTheDocument()
  })
  test('el alcance se nombra y las teselas con cero no son botones', async () => {
    const onFiltrar = vi.fn()
    render(<PanelResumen grupo="aves" alcance={{ departamento: 'Chocó' }} nombreAlcance="Chocó" esIndividual={false} onFiltrarEspecies={onFiltrar} onVerRegistros={vi.fn()} />)
    expect(screen.getByText('Chocó', { selector: 'b' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /En peligro crítico/ })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Vulnerable: 9 especies/ }))
    expect(onFiltrar).toHaveBeenCalledWith({ conservacion: 'amenazada', amenaza: 'VU' })
    await userEvent.click(screen.getByRole('button', { name: /Invasoras/ }))
    expect(onFiltrar).toHaveBeenLastCalledWith({ conservacion: 'invasora', amenaza: null })
  })
  test('cargando y error con reintento', async () => {
    resumen.q = { data: undefined, isError: false, isFetching: true, refetch: vi.fn() as never }
    const { rerender } = render(<PanelResumen grupo="aves" alcance={{}} nombreAlcance={null} esIndividual={false} onFiltrarEspecies={vi.fn()} onVerRegistros={vi.fn()} />)
    expect(screen.getAllByRole('status', { name: /Cargando indicadores/ }).length).toBe(4)
    const refetch = vi.fn()
    resumen.q = { data: undefined, isError: true, error: { status: 503 } as never, refetch: refetch as never }
    rerender(<PanelResumen grupo="aves" alcance={{}} nombreAlcance={null} esIndividual={false} onFiltrarEspecies={vi.fn()} onVerRegistros={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /Reintentar/ }))
    expect(refetch).toHaveBeenCalled()
  })
  test('grupos sin lista nacional de endemismo no muestran un cero engañoso', () => {
    render(<PanelResumen grupo="anfibios" alcance={{}} nombreAlcance={null} esIndividual onFiltrarEspecies={vi.fn()} onVerRegistros={vi.fn()} />)
    expect(screen.getByText('Sin lista nacional')).toBeInTheDocument()
    expect(screen.getByText(/Endémicas del Chocó, reportadas por el IIAP \(2011\)/)).toBeInTheDocument()
    expect(screen.getByText(/no implica que sea nativa ni que no esté amenazada/)).toBeInTheDocument()
  })
  test('aves sí muestran el conteo de endémicas de Colombia', () => {
    render(<PanelResumen grupo="aves" alcance={{}} nombreAlcance={null} esIndividual={false} onFiltrarEspecies={vi.fn()} onVerRegistros={vi.fn()} />)
    expect(screen.queryByText('Sin lista nacional')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Endémicas de Colombia/ })).toHaveTextContent('30')
  })
  test('con fotos se cuenta el porcentaje', () => {
    resumen.q = { data: { ...R, con_foto: 291907 }, isError: false, isFetching: false, refetch: vi.fn() as never }
    render(<PanelResumen grupo="aves" alcance={{}} nombreAlcance={null} esIndividual onFiltrarEspecies={vi.fn()} onVerRegistros={vi.fn()} />)
    expect(screen.getByText(/10,0\D+de los registros/)).toBeInTheDocument()
  })
})

describe('gráficos', () => {
  test('GraficoAnios: etiqueta accesible, lectura al pasar el ratón y tabla alterna', () => {
    const datos = Array.from({ length: 26 }, (_, i) => ({ anio: 2000 + i, registros: (i + 1) * 100 }))
    const { container } = render(<GraficoAnios datos={datos} />)
    expect(screen.getByRole('img', { name: /de 2000 a 2025\. El máximo es 2\.600 en 2025/ })).toBeInTheDocument()
    expect(screen.getByText(/Año con más registros/)).toBeInTheDocument()
    fireEvent.mouseEnter(container.querySelectorAll('svg g')[3])
    expect(screen.getByText(/2003/, { selector: 'b' })).toBeInTheDocument()
    fireEvent.mouseLeave(container.querySelector('svg')!)
    expect(screen.getByText(/Año con más registros/)).toBeInTheDocument()
    expect(screen.getByText('Ver como tabla')).toBeInTheDocument()
  })
  test('GraficoAnios vacío', () => {
    render(<GraficoAnios datos={[]} />)
    expect(screen.getByText(/Sin registros fechados/)).toBeInTheDocument()
  })
  test('BarrasEvidencia: traduce y muestra porcentaje; vacío', () => {
    const { rerender } = render(<BarrasEvidencia datos={[{ tipo: 'MACHINE_OBSERVATION', registros: 3 }, { tipo: 'X', registros: 1 }]} />)
    expect(screen.getByText('Observación automatizada')).toBeInTheDocument()
    expect(screen.getByText('Otro tipo de evidencia')).toBeInTheDocument()
    expect(screen.getByText(/75,0/)).toBeInTheDocument()
    rerender(<BarrasEvidencia datos={[]} />)
    expect(screen.getByText(/Sin información de evidencia/)).toBeInTheDocument()
  })
})

describe('controles reutilizables', () => {
  test('FiltroConservacion: alterna tipo y categorías de amenaza', async () => {
    const onCambio = vi.fn()
    const { rerender } = render(<FiltroConservacion conservacion={null} amenaza={null} onCambio={onCambio} />)
    expect(screen.getByRole('button', { name: 'Todas' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('group', { name: 'Categoría de amenaza' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Endémicas' }))
    expect(onCambio).toHaveBeenLastCalledWith('endemica', null)
    rerender(<FiltroConservacion conservacion="amenazada" amenaza="EN" onCambio={onCambio} />)
    expect(screen.getByRole('button', { name: /EN · En peligro/ })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: /EN · En peligro/ }))
    expect(onCambio).toHaveBeenLastCalledWith('amenazada', null)
    await userEvent.click(screen.getByRole('button', { name: /CR · En peligro crítico/ }))
    expect(onCambio).toHaveBeenLastCalledWith('amenazada', 'CR')
    await userEvent.click(screen.getByRole('button', { name: 'Amenazadas' }))
    expect(onCambio).toHaveBeenLastCalledWith(null, null)
  })

  test('CampoBusqueda espera, exige 2 letras y permite borrar', () => {
    vi.useFakeTimers()
    const onCambio = vi.fn()
    function Padre() {
      const [v, setV] = useState('')
      return <CampoBusqueda etiqueta="Buscar especie" placeholder="Nombre" valor={v} onCambio={(x) => { onCambio(x); setV(x) }} />
    }
    render(<Padre />)
    const campo = screen.getByLabelText('Buscar especie')
    fireEvent.change(campo, { target: { value: 'R' } })
    act(() => { vi.advanceTimersByTime(500) })
    expect(onCambio).not.toHaveBeenCalled()
    expect(screen.getByText('Escribe al menos 2 letras.')).toBeInTheDocument()
    fireEvent.change(campo, { target: { value: 'Rh' } })
    fireEvent.change(campo, { target: { value: 'Rhi' } })
    act(() => { vi.advanceTimersByTime(500) })
    expect(onCambio).toHaveBeenCalledTimes(1)
    expect(onCambio).toHaveBeenCalledWith('Rhi')
    fireEvent.click(screen.getByRole('button', { name: 'Borrar búsqueda' }))
    act(() => { vi.advanceTimersByTime(500) })
    expect(onCambio).toHaveBeenLastCalledWith('')
  })

  test('Paginacion: oculta con una página y navega', async () => {
    const onCambio = vi.fn()
    const { rerender, container } = render(<Paginacion etiqueta="Paginación" pagina={1} maxPaginas={1} onCambio={onCambio} />)
    expect(container).toBeEmptyDOMElement()
    rerender(<Paginacion etiqueta="Paginación" pagina={2} maxPaginas={3} onCambio={onCambio} nota="Tope" />)
    await userEvent.click(screen.getByRole('button', { name: /Anterior/ }))
    expect(onCambio).toHaveBeenCalledWith(1)
    expect(screen.getByText('Tope')).toBeInTheDocument()
    rerender(<Paginacion etiqueta="Paginación" pagina={3} maxPaginas={3} onCambio={onCambio} />)
    expect(screen.getByRole('button', { name: /Siguiente/ })).toBeDisabled()
  })

  test('LeyendaEscala por métrica', () => {
    const { rerender } = render(<LeyendaEscala cortes={[2, 10]} maximo={40} metrica="especies" />)
    expect(screen.getByRole('group', { name: /especies por municipio/ })).toBeInTheDocument()
    expect(screen.getByText('11 – 40')).toBeInTheDocument()
    rerender(<LeyendaEscala cortes={[5, 20]} maximo={80} metrica="sin_especie" />)
    expect(screen.getByText('0 – 5 %')).toBeInTheDocument()
    expect(screen.getByText('Sin datos')).toBeInTheDocument()
  })

  test('InsigniasConservacion no pinta nada sin datos', () => {
    const { container } = render(<InsigniasConservacion c={{ amenaza: null, endemica_colombia: false, endemica_choco: false, introducida: false, invasora: false }} />)
    expect(container).toBeEmptyDOMElement()
  })
})
