import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UseQueryResult } from '@tanstack/react-query'
import type { EspecieResumen, Foto, MunicipioConteo, RespuestaEspecies } from '@/components/herramientas/biodiversidad/types'

type Q = Partial<UseQueryResult<unknown>>
const especies: { q: Q; llamadas: unknown[][] } = { q: {}, llamadas: [] }
vi.mock('@/hooks/useBiodiversidad', () => ({
  useBiodiversidadEspecies: (...args: unknown[]) => { especies.llamadas.push(args); return especies.q },
}))

import ConmutadorVista from '@/components/herramientas/biodiversidad/ConmutadorVista'
import DetalleSeleccion from '@/components/herramientas/biodiversidad/DetalleSeleccion'
import GrupoIcono from '@/components/herramientas/biodiversidad/GrupoIcono'
import RankingPanel from '@/components/herramientas/biodiversidad/RankingPanel'
import SelectorGrupo from '@/components/herramientas/biodiversidad/SelectorGrupo'
import SeccionEspecies from '@/components/herramientas/biodiversidad/especies/SeccionEspecies'
import TablaEspecies from '@/components/herramientas/biodiversidad/especies/TablaEspecies'
import TarjetaEspecie from '@/components/herramientas/biodiversidad/especies/TarjetaEspecie'
import EspeciesDestacadas from '@/components/herramientas/biodiversidad/resumen/EspeciesDestacadas'
import { cuerpoSvgAElementos } from '@/components/herramientas/biodiversidad/lib/svgSeguro'
import { CONTORNO_SELECCION, RAMPAS, SIN_DATOS, SUPERFICIE, acentoDe, contraste, estiloGrupo, luminancia } from '@/components/herramientas/biodiversidad/lib/paleta'
import { leerParametros } from '@/components/herramientas/biodiversidad/lib/parametros'
import { MIN_REGISTROS_PORCENTAJE, admiteDepartamentos, rankingDepartamentos, rankingMunicipios } from '@/components/herramientas/biodiversidad/lib/ranking'
import { GRUPOS } from '@/components/herramientas/biodiversidad/types'

const IMG = 'https://api.gbif.org/v1/image/cache/400x/occurrence/4512345678/media/0123456789abcdef0123456789abcdef'
const foto = (over: Partial<Foto> = {}): Foto => ({
  imagen: IMG, autor: 'Ana Pérez', editor: null, licencia: 'http://creativecommons.org/licenses/by-nc/4.0/legalcode',
  referencia: 'https://www.inaturalist.org/photos/99', ...over,
})
const esp = (over: Partial<EspecieResumen> = {}): EspecieResumen => ({
  especie: 'Atelopus spurrelli', especie_clave: 'E1', reino: 'Animalia', clase: 'Amphibia', orden: 'Anura', familia: 'Bufonidae', genero: 'Atelopus',
  registros: 120, municipios: 7, amenaza: 'CR', endemica_colombia: false, endemica_choco: false, introducida: false, invasora: false,
  foto: foto(), fotos_total: 3, ...over,
})
const ultima = () => especies.llamadas[especies.llamadas.length - 1]
const mun = (codigo: string, nombre: string, depto: string, registros: number, sin: number, especiesN: number): MunicipioConteo => ({
  codigo_municipal: codigo, municipio: nombre, departamento: depto, registros, sin_especie: sin, especies: especiesN,
})

describe('paletas por grupo', () => {
  test.each(GRUPOS)('%s: cinco pasos, luminosidad monótona en claro (baja) y oscuro (sube)', (g) => {
    const { claro, oscuro } = RAMPAS[g]
    expect(claro).toHaveLength(5)
    expect(oscuro).toHaveLength(5)
    for (let i = 1; i < 5; i++) {
      expect(luminancia(claro[i])).toBeLessThan(luminancia(claro[i - 1]))
      expect(luminancia(oscuro[i])).toBeGreaterThan(luminancia(oscuro[i - 1]))
    }
  })
  test.each(GRUPOS)('%s: el extremo claro se separa >= 2:1 de la superficie y el acento supera 4,5:1', (g) => {
    for (const modo of ['claro', 'oscuro'] as const) {
      for (const c of RAMPAS[g][modo]) expect(contraste(c, SUPERFICIE[modo])).toBeGreaterThanOrEqual(1.95)
      expect(contraste(acentoDe(g, modo), SUPERFICIE[modo])).toBeGreaterThanOrEqual(4.5)
      expect(contraste(RAMPAS[g][modo][0], SIN_DATOS[modo])).toBeGreaterThan(1.15)
    }
  })
  test('la tarjeta activa (acento con texto blanco/oscuro) cumple AA', () => {
    for (const g of GRUPOS) {
      expect(contraste(acentoDe(g, 'claro'), '#ffffff')).toBeGreaterThanOrEqual(4.5)
      expect(contraste(acentoDe(g, 'oscuro'), '#06120d')).toBeGreaterThanOrEqual(4.5)
    }
  })
  test('el contorno doble (luz y sombra) cubre >= 3:1 cualquier paso de cualquier rampa', () => {
    const luz = '#ffffff'
    const sombra = CONTORNO_SELECCION.oscuro
    for (const g of GRUPOS) for (const modo of ['claro', 'oscuro'] as const) for (const c of RAMPAS[g][modo]) {
      expect(Math.max(contraste(c, luz), contraste(c, sombra))).toBeGreaterThanOrEqual(3)
    }
    expect(contraste(luz, sombra)).toBeGreaterThan(15)
  })
  test('cada grupo tiene un matiz propio (acentos distintos)', () => {
    const acentos = new Set(GRUPOS.map((g) => acentoDe(g, 'claro')))
    expect(acentos.size).toBe(GRUPOS.length)
  })
  test('estiloGrupo publica los diez pasos y los acentos como variables CSS', () => {
    const e = estiloGrupo('aves') as Record<string, string>
    expect(e['--bio-c1-l']).toBe(RAMPAS.aves.claro[0])
    expect(e['--bio-c5-d']).toBe(RAMPAS.aves.oscuro[4])
    expect(e['--bio-acento-l']).toBe(acentoDe('aves', 'claro'))
  })
})

describe('iconos de grupo', () => {
  test.each(GRUPOS)('%s dibuja formas SVG y es decorativo', (g) => {
    const { container } = render(<GrupoIcono grupo={g} />)
    const svg = container.querySelector('svg')!
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg.querySelectorAll('path, circle, rect').length).toBeGreaterThan(0)
  })
  test('el conversor descarta etiquetas y atributos no permitidos', () => {
    const { container } = render(
      <svg>{cuerpoSvgAElementos('<g stroke="currentColor" onclick="x()"><script>alert(1)</script><path d="M0 0" onload="y()"/><circle cx="1" cy="1" r="1"/></g>')}</svg>,
    )
    expect(container.querySelector('script')).toBeNull()
    expect(container.innerHTML).not.toContain('onclick')
    expect(container.innerHTML).not.toContain('onload')
    expect(container.querySelector('path')).toHaveAttribute('d', 'M0 0')
    expect(container.querySelector('g')).toHaveAttribute('stroke', 'currentColor')
  })
})

describe('SelectorGrupo con iconos y color', () => {
  test('siete opciones con icono, color propio y teclado', async () => {
    const onCambiar = vi.fn()
    render(<SelectorGrupo grupo="aves" grupos={undefined} onCambiar={onCambiar} />)
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(7)
    radios.forEach((r) => expect(r.querySelector('svg[data-grupo-icono]')).not.toBeNull())
    expect(radios[2].getAttribute('style')).toContain('--bio-acento-l')
    expect(radios[0].getAttribute('style')).not.toEqual(radios[1].getAttribute('style'))
    radios[0].focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(onCambiar).toHaveBeenLastCalledWith('mamiferos')
    await userEvent.keyboard('{End}')
    expect(onCambiar).toHaveBeenLastCalledWith('hongos')
  })
})

describe('TarjetaEspecie', () => {
  const props = { grupo: 'anfibios' as const, esIndividual: true, onVerRegistros: vi.fn() }
  test('con foto: imagen perezosa, sin referrer y crédito visible', () => {
    render(<TarjetaEspecie e={esp()} {...props} />)
    const img = screen.getByRole('img', { name: /Fotografía representativa de Atelopus spurrelli/ })
    expect(img).toHaveAttribute('loading', 'lazy')
    expect(img).toHaveAttribute('decoding', 'async')
    expect(img).toHaveAttribute('referrerpolicy', 'no-referrer')
    expect(img.getAttribute('src')).toMatch(/^https:\/\/api\.gbif\.org\/v1\/image\/cache\/480x\//)
    expect(screen.getByText(/Foto: Ana Pérez/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ver la fotografía en su fuente/ })).toHaveAttribute('href', 'https://www.inaturalist.org/photos/99')
    expect(screen.getByText('3 fotos')).toBeInTheDocument()
    expect(screen.getByText('Atelopus spurrelli').tagName).toBe('I')
    expect(screen.getByText('Anura · Bufonidae')).toBeInTheDocument()
  })
  test('sin foto: reemplazo con el icono del grupo, sin imagen ni crédito', () => {
    const { container } = render(<TarjetaEspecie e={esp({ foto: null, fotos_total: 0 })} {...props} />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(container.querySelector('.bio-foto-grupo svg[data-grupo-icono="anfibios"]')).not.toBeNull()
    expect(screen.getByText('Aún sin fotografía')).toBeInTheDocument()
    expect(screen.queryByText(/Foto:/)).not.toBeInTheDocument()
  })
  test('una foto fuera del patrón de la caché de GBIF NO se renderiza ni se acredita', () => {
    for (const imagen of ['https://evil.example/x.jpg', 'http://api.gbif.org/v1/image/cache/400x/occurrence/1/media/0123456789abcdef0123456789abcdef', 'javascript:alert(1)', `${IMG}?x=1`]) {
      const { container, unmount } = render(<TarjetaEspecie e={esp({ foto: foto({ imagen }) })} {...props} />)
      expect(container.querySelector('img')).toBeNull()
      expect(screen.queryByText(/Foto:/)).not.toBeInTheDocument()
      unmount()
    }
  })
  test('agregado: el reemplazo es solo el icono del grupo (sin rótulo repetido) y no ofrece registros', () => {
    const { container } = render(<TarjetaEspecie e={esp({ foto: null, fotos_total: undefined })} {...props} esIndividual={false} />)
    expect(container.querySelector('.bio-foto-grupo svg[data-grupo-icono="anfibios"]')).not.toBeNull()
    expect(screen.queryByText(/Aún sin fotografía/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Ver registros/ })).not.toBeInTheDocument()
  })
  test('«Ver registros» entrega la especie', async () => {
    const onVer = vi.fn()
    render(<TarjetaEspecie e={esp()} {...props} onVerRegistros={onVer} />)
    await userEvent.click(screen.getByRole('button', { name: /Ver registros/ }))
    expect(onVer).toHaveBeenCalledWith(expect.objectContaining({ especie_clave: 'E1' }))
  })
})

describe('Conmutador Tarjetas | Tabla y su estado en la URL', () => {
  test('marca la vista activa y emite el modo elegido', async () => {
    const onCambio = vi.fn()
    render(<ConmutadorVista etiqueta="Forma de ver" modo="tarjetas" onCambio={onCambio} />)
    expect(screen.getByRole('button', { name: 'Tarjetas' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Tabla detallada' }))
    expect(onCambio).toHaveBeenCalledWith('tabla')
  })
  test('el modo vive en la URL: tarjetas por omisión, tabla con ?modo=tabla y valores raros se descartan', () => {
    expect(leerParametros(new URLSearchParams('')).modo).toBe('tarjetas')
    expect(leerParametros(new URLSearchParams('modo=tabla')).modo).toBe('tabla')
    expect(leerParametros(new URLSearchParams('modo=<script>')).modo).toBe('tarjetas')
  })
})

describe('SeccionEspecies: tarjetas por omisión, tabla opcional y filtro de fotos', () => {
  const base = {
    grupo: 'anfibios' as const, esIndividual: true, params: {}, orden: 'registros' as const, modo: 'tarjetas' as const, pagina: 1, onVerRegistros: vi.fn(),
    ayuda: { chips: [], onCambio: vi.fn(), onLimpiar: vi.fn() },
  }
  beforeEach(() => {
    especies.llamadas = []
    const r: RespuestaEspecies = { grupo: 'anfibios', metodo: 'individual', pagina: 1, tamano: 20, total: 2, especies: [esp(), esp({ especie: 'Rana x', especie_clave: 'E2', foto: null, fotos_total: 0, amenaza: null })] }
    especies.q = { data: r, isError: false, isFetching: false, refetch: vi.fn() as never }
  })
  test('tarjetas: una por especie, sin tabla', () => {
    render(<SeccionEspecies {...base} onCambio={vi.fn()} />)
    expect(screen.getAllByRole('article')).toHaveLength(2)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
  test('modo tabla: tabla detallada con todas las columnas', () => {
    render(<SeccionEspecies {...base} modo="tabla" onCambio={vi.fn()} />)
    const tabla = screen.getByRole('table')
    for (const col of ['Especie', 'Clase', 'Orden', 'Familia', 'Registros', 'Municipios', 'Fotos', 'Conservación']) {
      expect(within(tabla).getByRole('columnheader', { name: new RegExp(col) })).toBeInTheDocument()
    }
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })
  test('el conmutador escribe modo=tabla y vuelve a tarjetas quitando el parámetro', async () => {
    const onCambio = vi.fn()
    const { rerender } = render(<SeccionEspecies {...base} onCambio={onCambio} />)
    await userEvent.click(screen.getByRole('button', { name: 'Tabla detallada' }))
    expect(onCambio).toHaveBeenLastCalledWith({ modo: 'tabla' })
    rerender(<SeccionEspecies {...base} modo="tabla" onCambio={onCambio} />)
    await userEvent.click(screen.getByRole('button', { name: 'Tarjetas' }))
    expect(onCambio).toHaveBeenLastCalledWith({ modo: null })
  })
  test('los filtros llegan al hook tal cual, con orden, página y tamaño', () => {
    render(<SeccionEspecies {...base} params={{ con_foto: 'true', familia: 'Hylidae' }} orden="municipios" onCambio={vi.fn()} />)
    expect(ultima()[0]).toBe('anfibios')
    expect(ultima()[1]).toMatchObject({ con_foto: 'true', familia: 'Hylidae', orden: 'municipios', pagina: 1, tamano: 20 })
  })
})

describe('TablaEspecies', () => {
  test('ordena en el servidor por especie o registros y marca aria-sort', async () => {
    const onOrden = vi.fn()
    render(<TablaEspecies especies={[esp(), esp({ especie_clave: 'E2', especie: 'Rana x', amenaza: null })]} esIndividual orden="registros" onOrden={onOrden} onVerRegistros={vi.fn()} />)
    expect(screen.getByRole('columnheader', { name: /Registros/ })).toHaveAttribute('aria-sort', 'descending')
    await userEvent.click(screen.getByRole('button', { name: /^Especie/ }))
    expect(onOrden).toHaveBeenCalledWith('nombre')
    await userEvent.click(screen.getByRole('button', { name: /^Municipios/ }))
    expect(onOrden).toHaveBeenLastCalledWith('municipios')
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })
})

describe('ranking que sigue la métrica del mapa', () => {
  const M = [
    mun('1', 'Alfa', 'Chocó', 1000, 100, 50),
    mun('2', 'Beta', 'Chocó', 500, 400, 90),
    mun('3', 'Gamma', 'Antioquia', 20, 15, 5),
    mun('4', 'Delta', 'Antioquia', 0, 0, 0),
  ]
  test('registros, especies y % sin especie ordenan distinto', () => {
    expect(rankingMunicipios(M, 'registros', 10).map((f) => f.nombre)).toEqual(['Alfa', 'Beta', 'Gamma'])
    expect(rankingMunicipios(M, 'especies', 10).map((f) => f.nombre)).toEqual(['Beta', 'Alfa', 'Gamma'])
    expect(rankingMunicipios(M, 'sin_especie', 10).map((f) => f.nombre)).toEqual(['Beta', 'Alfa'])
  })
  test('el porcentaje exige un mínimo de registros para no premiar el ruido', () => {
    expect(MIN_REGISTROS_PORCENTAJE).toBeGreaterThan(20)
    expect(rankingMunicipios(M, 'sin_especie', 10).some((f) => f.nombre === 'Gamma')).toBe(false)
  })
  test('formatea el valor con la unidad de la métrica', () => {
    expect(rankingMunicipios(M, 'registros', 1)[0].texto).toBe('1.000')
    expect(rankingMunicipios(M, 'sin_especie', 1)[0].texto).toBe('80,0 %')
  })
  test('por departamento no hay ranking de especies (no son sumables)', () => {
    const d = [{ departamento: 'Chocó', registros: 1500, sinEspecie: 500, municipiosConRegistros: 2, totalMunicipios: 3 }]
    expect(admiteDepartamentos('especies')).toBe(false)
    expect(rankingDepartamentos(d, 'especies', 5)).toEqual([])
    expect(rankingDepartamentos(d, 'registros', 5)[0].texto).toBe('1.500')
    expect(rankingDepartamentos(d, 'sin_especie', 5)[0].texto).toBe('33,3 %')
  })
  test('el panel cambia de título con la métrica y desactiva «Departamentos» con especies', () => {
    const { rerender } = render(<RankingPanel municipios={M} metrica="registros" seleccionado={null} departamento={null} onMunicipio={vi.fn()} onDepartamento={vi.fn()} />)
    expect(screen.getByText('Municipios con más registros')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Departamentos' })).toBeEnabled()
    rerender(<RankingPanel municipios={M} metrica="especies" seleccionado={null} departamento={null} onMunicipio={vi.fn()} onDepartamento={vi.fn()} />)
    expect(screen.getByText('Municipios con más especies')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Departamentos' })).toBeDisabled()
    expect(within(screen.getAllByRole('listitem')[0]).getByText('Beta')).toBeInTheDocument()
  })
})

describe('Selección: estado vacío con atajo', () => {
  test('ofrece el municipio con más registros y lo elige', async () => {
    const onElegir = vi.fn()
    render(<DetalleSeleccion municipio={null} puesto={null} totalGrupo={0} departamento={null} destacado={mun('27001', 'Quibdó', 'Chocó', 799, 0, 40)} onElegir={onElegir} onLimpiar={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /Quibdó/ }))
    expect(onElegir).toHaveBeenCalledWith('27001')
    expect(screen.getByText(/Con el teclado/)).toBeInTheDocument()
  })
})

describe('EspeciesDestacadas', () => {
  test('muestra solo especies con foto válida y respeta la visibilidad', () => {
    especies.q = { data: { grupo: 'anfibios', metodo: 'individual', pagina: 1, tamano: 4, total: 2, especies: [esp(), esp({ especie_clave: 'E2', especie: 'Mala foto', foto: foto({ imagen: 'https://evil.example/a.jpg' }) })] }, isError: false, refetch: vi.fn() as never }
    const { rerender } = render(<EspeciesDestacadas grupo="anfibios" params={{ departamento: 'Chocó' }} activo onVer={vi.fn()} />)
    expect(screen.getByText('Atelopus spurrelli')).toBeInTheDocument()
    expect(screen.queryByText('Mala foto')).not.toBeInTheDocument()
    rerender(<EspeciesDestacadas grupo="anfibios" params={{}} activo={false} onVer={vi.fn()} />)
    expect(screen.queryByText('Atelopus spurrelli')).not.toBeInTheDocument()
    expect(ultima()[2]).toBe(false)
  })
})
