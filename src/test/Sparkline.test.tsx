import { describe, test, expect } from 'vitest'
import { render } from '@testing-library/react'
import Sparkline from '@/components/ui/Sparkline'

describe('Sparkline', () => {
  test('no renderiza nada con una serie vacía', () => {
    const { container } = render(<Sparkline data={[]} endColor="red" />)
    expect(container.querySelector('svg')).not.toBeInTheDocument()
  })

  test('dibuja un punto por valor de la serie, con la línea y el punto final', () => {
    const { container } = render(<Sparkline data={[1, 3, 2, 5]} endColor="#009846" />)
    const polyline = container.querySelector('polyline')
    expect(polyline?.getAttribute('points')?.split(' ')).toHaveLength(4)
    const dot = container.querySelector('circle')
    expect(dot).toHaveAttribute('fill', '#009846')
  })

  test('el punto final se posiciona en el último valor de la serie', () => {
    // Serie constante: el punto final debe quedar en el mismo y que el resto de la línea.
    const { container } = render(<Sparkline data={[4, 4, 4]} endColor="#009846" />)
    const dot = container.querySelector('circle')
    const points = container.querySelector('polyline')!.getAttribute('points')!.split(' ')
    const lastPoint = points[points.length - 1].split(',')
    expect(Number(dot!.getAttribute('cy'))).toBeCloseTo(Number(lastPoint[1]))
  })

  test('no revienta con un solo punto', () => {
    const { container } = render(<Sparkline data={[7]} endColor="#009846" />)
    expect(container.querySelector('circle')).toBeInTheDocument()
  })

  test('expone un aria-label legible con los valores de la serie', () => {
    const { getByRole } = render(<Sparkline data={[1, 2, 3]} endColor="#009846" />)
    expect(getByRole('img')).toHaveAttribute('aria-label', expect.stringContaining('1, 2, 3'))
  })
})
