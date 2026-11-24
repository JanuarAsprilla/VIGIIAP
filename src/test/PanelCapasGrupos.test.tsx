import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PanelCapas from '@/components/geovisor-viewer/PanelCapas'
import type { CapaGeoserver, GrupoCapas, TemaCapas } from '@/types'

vi.mock('react-leaflet', () => ({
  useMap: () => ({ flyToBounds: vi.fn() }),
}))

const capaA: CapaGeoserver = { id: 'geo:a', nombre: 'a', titulo: 'Unidades', tipo: 'vectorial', tema: 'geo', resumen: 'Unidades litoestratigráficas', palabrasClave: ['geología', 'chocó'] }
const capaB: CapaGeoserver = { id: 'geo:b', nombre: 'b', tipo: 'vectorial', tema: 'geo' }
const capaC: CapaGeoserver = { id: 'geo:c', nombre: 'Suelta', tipo: 'raster', tema: 'geo' }

const temas: TemaCapas[] = [{ id: 'geo', nombre: 'Geología', capas: [capaA, capaB, capaC] }]

const grupo: GrupoCapas = {
  id: 'geo:base', nombre: 'base', titulo: 'Geología base', resumen: 'Capas de base geológica', tema: 'geo', capas: ['geo:a', 'geo:b'],
}

function renderPanel(opts: { grupos?: GrupoCapas[]; activas?: CapaGeoserver[]; temas?: TemaCapas[] } = {}) {
  const onToggleCapa = vi.fn()
  const view = render(
    <PanelCapas temas={opts.temas ?? temas} grupos={opts.grupos}
      capasActivas={(opts.activas ?? []).map((capa) => ({ capa, tema: 'geo' }))}
      colorPorTema={{}} apiBase="/api" slug="geo" onToggleCapa={onToggleCapa} onMoverCapa={vi.fn()} />,
  )
  return { ...view, onToggleCapa }
}

const abrirTema = () => userEvent.click(screen.getByRole('button', { name: /^Geología\d+$/ }))
const interruptor = () => screen.getByRole('checkbox', { name: /Todas las capas de Geología base/ })

describe('PanelCapas — grupos de capas', () => {
  it('muestra el grupo dentro de su tema con título y conteo, y deja fuera de la lista suelta a sus miembros', async () => {
    renderPanel({ grupos: [grupo] })
    await abrirTema()

    expect(screen.getByRole('button', { name: /Geología base/ })).toHaveTextContent('2 capas')
    expect(screen.getByRole('checkbox', { name: /^Suelta/ })).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: /^Unidades/ })).not.toBeInTheDocument()
  })

  it('el interruptor enciende todas las capas del grupo', async () => {
    const { onToggleCapa } = renderPanel({ grupos: [grupo] })
    await abrirTema()
    expect(interruptor()).toHaveAttribute('aria-checked', 'false')

    await userEvent.click(interruptor())

    expect(onToggleCapa.mock.calls.map(([capa, tema]) => [capa.id, tema])).toEqual([['geo:a', 'geo'], ['geo:b', 'geo']])
  })

  it('con solo algunas encendidas queda en estado parcial y al pulsar enciende las que faltan', async () => {
    const { onToggleCapa } = renderPanel({ grupos: [grupo], activas: [capaA] })
    await abrirTema()
    expect(interruptor()).toHaveAttribute('aria-checked', 'mixed')

    await userEvent.click(interruptor())

    expect(onToggleCapa).toHaveBeenCalledTimes(1)
    expect(onToggleCapa.mock.calls[0][0].id).toBe('geo:b')
  })

  it('con todas encendidas el interruptor las apaga todas', async () => {
    const { onToggleCapa } = renderPanel({ grupos: [grupo], activas: [capaA, capaB] })
    await abrirTema()
    expect(interruptor()).toHaveAttribute('aria-checked', 'true')

    await userEvent.click(interruptor())

    expect(onToggleCapa.mock.calls.map(([capa]) => capa.id)).toEqual(['geo:a', 'geo:b'])
  })

  it('al expandir muestra resumen, palabras clave y cada capa con su propio control', async () => {
    const { onToggleCapa } = renderPanel({ grupos: [grupo] })
    await abrirTema()
    const cabecera = screen.getByRole('button', { name: /Geología base/ })
    expect(cabecera).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(cabecera)

    expect(cabecera).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Capas de base geológica')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('checkbox', { name: /^Unidades/ }))
    expect(onToggleCapa).toHaveBeenCalledTimes(1)
    expect(onToggleCapa.mock.calls[0][0].id).toBe('geo:a')
    expect(screen.getByText('chocó')).toBeInTheDocument()
  })

  it('un grupo cuyo tema no está en el catálogo aparece en su propia sección', () => {
    renderPanel({ grupos: [{ ...grupo, tema: 'otro' }] })

    const seccion = screen.getByText('Grupos de capas').parentElement as HTMLElement
    expect(within(seccion).getByRole('button', { name: /Geología base/ })).toBeInTheDocument()
  })

  it('sin grupos el panel es idéntico al de siempre', async () => {
    const sin = renderPanel()
    await abrirTema()
    const base = sin.container.innerHTML
    sin.unmount()

    const vacio = renderPanel({ grupos: [] })
    await abrirTema()

    expect(vacio.container.innerHTML).toBe(base)
    expect(screen.queryByRole('checkbox', { name: /Todas las capas/ })).not.toBeInTheDocument()
    expect(screen.queryByText('Grupos de capas')).not.toBeInTheDocument()
  })
})

describe('PanelCapas — metadatos de GeoServer', () => {
  it('usa el título de la capa y lo ofrece como ayuda junto al resumen', async () => {
    renderPanel()
    await abrirTema()

    expect(screen.getByRole('checkbox', { name: /^Unidades/ }).closest('label')).toHaveAttribute('title', expect.stringContaining('Unidades litoestratigráficas'))
    expect(screen.getByRole('checkbox', { name: /^b/ })).toBeInTheDocument()
  })

  it('en la capa activa el detalle muestra resumen y palabras clave junto a la leyenda', async () => {
    renderPanel({ activas: [capaA] })

    await userEvent.click(screen.getByRole('button', { name: 'Leyenda' }))

    expect(screen.getByText('Unidades litoestratigráficas')).toBeInTheDocument()
    expect(screen.getByText('geología')).toBeInTheDocument()
    expect(screen.getByAltText('Leyenda de Unidades')).toBeInTheDocument()
  })
})
