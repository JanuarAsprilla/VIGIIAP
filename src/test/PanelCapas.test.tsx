import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PanelCapas from '@/components/geovisor-viewer/PanelCapas'
import type { TemaCapas } from '@/types'

vi.mock('react-leaflet', () => ({
  useMap: () => ({ flyToBounds: vi.fn() }),
}))

function temas(nuevas: Record<string, boolean>): TemaCapas[] {
  return [{
    id: 't_15_geologia',
    nombre: 'Geología',
    capas: [
      { id: 't_15_geologia:unidades', nombre: 'Unidades', tipo: 'vectorial', tema: 't_15_geologia', nueva: nuevas.unidades },
      { id: 't_15_geologia:fallas', nombre: 'Fallas', tipo: 'vectorial', tema: 't_15_geologia', nueva: nuevas.fallas },
    ],
  }]
}

function renderPanel(t: TemaCapas[]) {
  return render(
    <PanelCapas temas={t} capasActivas={[]} colorPorTema={{}} apiBase="/api" slug="geo"
      onToggleCapa={vi.fn()} onMoverCapa={vi.fn()} />,
  )
}

describe('PanelCapas — capas nuevas', () => {
  it('sin capas nuevas no muestra ninguna insignia', async () => {
    renderPanel(temas({}))
    await userEvent.click(screen.getByRole('button', { name: /Geología/ }))

    expect(screen.queryByText(/\d+ nuevas?$/)).not.toBeInTheDocument()
    expect(screen.queryByText('Nueva')).not.toBeInTheDocument()
  })

  it('avisa en la cabecera y en el tema cuando hay una capa nueva', () => {
    renderPanel(temas({ fallas: true }))

    expect(screen.getAllByText('1 nueva')).toHaveLength(2)
  })

  it('marca "Nueva" solo la capa nueva al abrir el tema', async () => {
    renderPanel(temas({ fallas: true }))
    await userEvent.click(screen.getByRole('button', { name: /Geología/ }))

    expect(screen.getAllByText('Nueva')).toHaveLength(1)
    expect(screen.getByText('Fallas').parentElement).toHaveTextContent('Nueva')
    expect(screen.getByText('Unidades').parentElement).not.toHaveTextContent('Nueva')
  })

  it('usa plural cuando hay varias nuevas', () => {
    renderPanel(temas({ unidades: true, fallas: true }))

    expect(screen.getAllByText('2 nuevas')).toHaveLength(2)
  })
})
