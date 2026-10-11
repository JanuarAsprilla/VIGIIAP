import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import Card3D from '@/components/ui/Card3D'

function mockPrefersReducedMotion(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn(() => ({
      matches,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })),
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Card3D — prefers-reduced-motion', () => {
  test('con la preferencia activa, no registra el listener de tilt por mousemove', () => {
    mockPrefersReducedMotion(true)
    const { container } = render(<Card3D className="tarjeta">contenido</Card3D>)
    const el = container.querySelector<HTMLElement>('.tarjeta')!
    // Sin lanzar: mover el mouse no debe intentar leer boundingClientRect
    // vía el handler de tilt, porque en modo reducido se renderiza un
    // <div> plano sin onMouseMove.
    expect(() => fireEvent.mouseMove(el, { clientX: 50, clientY: 50 })).not.toThrow()
    expect(el.tagName).toBe('DIV')
    expect(el.style.transform).toBe('')
  })

  test('sin la preferencia activa, sí monta el wrapper interactivo (glare) por defecto', () => {
    mockPrefersReducedMotion(false)
    const { container } = render(<Card3D className="tarjeta">contenido</Card3D>)
    const el = container.querySelector('.tarjeta')!
    expect(el).toBeTruthy()
    expect(el.children.length).toBeGreaterThan(0)
  })

  test('disabled={true} explícito sigue funcionando aunque no haya preferencia de reducir movimiento', () => {
    mockPrefersReducedMotion(false)
    const { container } = render(<Card3D className="tarjeta" disabled>contenido</Card3D>)
    const el = container.querySelector('.tarjeta')!
    expect(el.textContent).toBe('contenido')
  })
})
