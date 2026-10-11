import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import DeferUntilVisible from '@/components/ui/DeferUntilVisible'

type IOCallback = (entries: Array<{ isIntersecting: boolean }>) => void

let capturedCallback: IOCallback | null = null
let disconnectSpy: ReturnType<typeof vi.fn>
let observeSpy: ReturnType<typeof vi.fn>

function makeMockIO() {
  return class {
    constructor(cb: IOCallback) {
      capturedCallback = cb
    }
    observe = observeSpy
    disconnect = disconnectSpy
    unobserve = vi.fn()
  }
}

beforeEach(() => {
  capturedCallback = null
  disconnectSpy = vi.fn()
  observeSpy = vi.fn()
  vi.stubGlobal('IntersectionObserver', makeMockIO())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('DeferUntilVisible', () => {
  test('no monta children hasta que el observer reporta intersección', () => {
    render(
      <DeferUntilVisible>
        <div>contenido real pesado</div>
      </DeferUntilVisible>
    )
    expect(screen.queryByText('contenido real pesado')).not.toBeInTheDocument()
    expect(observeSpy).toHaveBeenCalled()
  })

  test('monta children y desconecta el observer una vez que intersecta', () => {
    render(
      <DeferUntilVisible>
        <div>contenido real pesado</div>
      </DeferUntilVisible>
    )
    act(() => { capturedCallback!([{ isIntersecting: true }]) })
    expect(screen.getByText('contenido real pesado')).toBeInTheDocument()
    expect(disconnectSpy).toHaveBeenCalled()
  })

  test('el placeholder usa placeholderHeight para evitar salto de layout', () => {
    const { container } = render(
      <DeferUntilVisible placeholderHeight="300vh">
        <div>contenido real pesado</div>
      </DeferUntilVisible>
    )
    const placeholder = container.firstElementChild as HTMLElement
    expect(placeholder.style.height).toBe('300vh')
    expect(placeholder).toHaveAttribute('aria-hidden', 'true')
  })

  test('respeta un rootMargin custom al crear el observer', () => {
    const IOSpy = vi.fn(makeMockIO())
    vi.stubGlobal('IntersectionObserver', IOSpy)
    render(
      <DeferUntilVisible rootMargin="200px">
        <div>contenido</div>
      </DeferUntilVisible>
    )
    expect(IOSpy).toHaveBeenCalledWith(expect.any(Function), { rootMargin: '200px' })
  })
})
