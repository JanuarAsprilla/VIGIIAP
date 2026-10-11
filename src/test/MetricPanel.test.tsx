import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Users } from 'lucide-react'
import MetricPanel from '@/components/ui/MetricPanel'

describe('MetricPanel', () => {
  test('muestra el valor y la etiqueta de cada métrica', () => {
    render(<MetricPanel metrics={[{ label: 'Usuarios nuevos', value: 7 }, { label: 'Solicitudes', value: 3 }]} />)
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('Usuarios nuevos')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Solicitudes')).toBeInTheDocument()
  })

  test('muestra el badge de variación solo cuando se pasa deltaPct', () => {
    render(<MetricPanel metrics={[
      { label: 'Con variación', value: 10, deltaPct: 20 },
      { label: 'Sin variación', value: 5 },
    ]} />)
    expect(screen.getByText('+20%')).toBeInTheDocument()
    const tarjetaSinVariacion = screen.getByText('Sin variación').closest('div')
    expect(tarjetaSinVariacion?.textContent).not.toMatch(/%/)
  })

  test('muestra un esqueleto de carga en vez del valor cuando loading es true', () => {
    const { container } = render(<MetricPanel metrics={[{ label: 'Cargando', value: 0, loading: true }]} />)
    expect(screen.queryByText('0')).not.toBeInTheDocument()
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })

  test('renderiza el ícono cuando se provee', () => {
    const { container } = render(<MetricPanel metrics={[{ label: 'Con ícono', value: 1, icon: Users }]} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  test('renderiza el sparkline solo cuando la métrica trae serie', () => {
    const { container } = render(<MetricPanel metrics={[
      { label: 'Con serie', value: 1, sparkline: [1, 2, 3] },
      { label: 'Sin serie', value: 2 },
    ]} />)
    // Sparkline dibuja un <svg role="img"> -- solo debe existir una gráfica.
    expect(container.querySelectorAll('svg[role="img"]')).toHaveLength(1)
  })
})
