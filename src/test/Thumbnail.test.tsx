import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import Thumbnail from '@/components/ui/Thumbnail'

afterEach(() => {
  vi.useRealTimers()
})

describe('Thumbnail — estado de carga', () => {
  test('muestra la imagen en opacity-0 y un skeleton mientras carga', () => {
    const { container } = render(<Thumbnail src="https://x.test/a.jpg" alt="" />)
    const img = container.querySelector('img')!
    expect(img.className).toContain('opacity-0')
    expect(container.querySelector('[aria-hidden="true"]')?.className).toContain('animate-pulse')
  })

  test('al terminar de cargar, la imagen pasa a opacity-100 y el skeleton desaparece', () => {
    const { container } = render(<Thumbnail src="https://x.test/a.jpg" alt="" />)
    fireEvent.load(container.querySelector('img')!)

    expect(container.querySelector('img')!.className).toContain('opacity-100')
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument()
  })
})

describe('Thumbnail — reintento ante fallo de red', () => {
  test('un primer fallo no rinde el ícono de error todavía -- reintenta primero', () => {
    const { container } = render(<Thumbnail src="https://x.test/a.jpg" alt="" />)
    fireEvent.error(container.querySelector('img')!)

    // Sigue mostrando la imagen (en opacity-0, esperando el reintento), no el ícono de error.
    expect(container.querySelector('img')).toBeInTheDocument()
    expect(container.querySelector('svg')).not.toBeInTheDocument()
  })

  test('tras agotar los reintentos, muestra el ícono de imagen rota y ya no la <img>', () => {
    vi.useFakeTimers()
    const { container } = render(<Thumbnail src="https://x.test/a.jpg" alt="" />)

    // Intento inicial falla -> agenda reintento 1 (1200ms)
    fireEvent.error(container.querySelector('img')!)
    act(() => { vi.advanceTimersByTime(1200) })
    expect(container.querySelector('img')!.src).toContain('retry=1')

    // Reintento 1 falla -> agenda reintento 2 (2400ms)
    fireEvent.error(container.querySelector('img')!)
    act(() => { vi.advanceTimersByTime(2400) })
    expect(container.querySelector('img')!.src).toContain('retry=2')

    // Reintento 2 (el último permitido) también falla -> se rinde
    fireEvent.error(container.querySelector('img')!)

    expect(container.querySelector('img')).not.toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  test('el cache-busting de reintento respeta un src que ya trae query string', () => {
    vi.useFakeTimers()
    const { container } = render(<Thumbnail src="https://x.test/a.jpg?v=2" alt="" />)
    fireEvent.error(container.querySelector('img')!)
    act(() => { vi.advanceTimersByTime(1200) })

    expect(container.querySelector('img')!.src).toContain('https://x.test/a.jpg?v=2&retry=1')
  })
})

describe('Thumbnail — cambio de miniatura', () => {
  test('cambiar el src reinicia el ciclo de carga (vuelve a mostrar el skeleton)', () => {
    const { container, rerender } = render(<Thumbnail src="https://x.test/a.jpg" alt="" />)
    fireEvent.load(container.querySelector('img')!)
    expect(container.querySelector('img')!.className).toContain('opacity-100')

    rerender(<Thumbnail src="https://x.test/b.jpg" alt="" />)

    expect(container.querySelector('img')!.className).toContain('opacity-0')
    expect(container.querySelector('[aria-hidden="true"]')?.className).toContain('animate-pulse')
  })
})
