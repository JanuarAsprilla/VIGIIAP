import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { useToast, ToastContainer } from '@/components/Toast'

vi.mock('framer-motion', () => {
  const cache = new Map<string, (p: Record<string, unknown>) => ReactNode>()
  const motion = new Proxy({}, {
    get: (_t, tag: string) => {
      if (!cache.has(tag)) {
        cache.set(tag, ({ children, ...p }: Record<string, unknown>) => createElement(tag, p, children as ReactNode))
      }
      return cache.get(tag)
    },
  })
  return { motion, AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</> }
})

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useToast', () => {
  test('agrega un toast con tipo por defecto "success" y lo expira tras 3s', () => {
    const { result } = renderHook(() => useToast())
    act(() => { result.current.toast('Guardado correctamente') })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0]).toMatchObject({ message: 'Guardado correctamente', type: 'success' })

    act(() => { vi.advanceTimersByTime(3000) })
    expect(result.current.toasts).toHaveLength(0)
  })

  test('respeta una duración personalizada', () => {
    const { result } = renderHook(() => useToast())
    act(() => { result.current.toast('Espera especial', 'info', 5000) })

    act(() => { vi.advanceTimersByTime(3000) })
    expect(result.current.toasts).toHaveLength(1)

    act(() => { vi.advanceTimersByTime(2000) })
    expect(result.current.toasts).toHaveLength(0)
  })

  test('varios toasts activos se acumulan y expiran de forma independiente', () => {
    const { result } = renderHook(() => useToast())
    act(() => { result.current.toast('Primero', 'success', 2000) })
    act(() => { vi.advanceTimersByTime(1000) })
    act(() => { result.current.toast('Segundo', 'error', 2000) })

    expect(result.current.toasts).toHaveLength(2)
    act(() => { vi.advanceTimersByTime(1000) })
    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].message).toBe('Segundo')
  })

  test('dismiss() elimina un toast específico antes de que expire', () => {
    const { result } = renderHook(() => useToast())
    act(() => { result.current.toast('A'); result.current.toast('B') })
    const idToRemove = result.current.toasts[0].id

    act(() => { result.current.dismiss(idToRemove) })
    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].message).toBe('B')
  })
})

describe('ToastContainer', () => {
  test('renderiza el ícono y estilo correctos para success, error e info', () => {
    const dismiss = vi.fn()
    render(
      <ToastContainer
        toasts={[
          { id: 1, message: 'Ok', type: 'success' },
          { id: 2, message: 'Falló', type: 'error' },
          { id: 3, message: 'FYI', type: 'info' },
        ]}
        dismiss={dismiss}
      />,
    )

    expect(screen.getByText('Ok').closest('div')).toHaveClass('bg-green-600')
    expect(screen.getByText('Falló').closest('div')).toHaveClass('bg-red-600')
    expect(screen.getByText('FYI').closest('div')).toHaveClass('bg-primary-800')
  })

  test('clic en el botón de cerrar llama a dismiss con el id correcto', () => {
    const dismiss = vi.fn()
    render(<ToastContainer toasts={[{ id: 42, message: 'Cerrar esto', type: 'success' }]} dismiss={dismiss} />)

    fireEvent.click(screen.getByRole('button'))
    expect(dismiss).toHaveBeenCalledWith(42)
  })

  test('sin toasts, no renderiza ningún mensaje', () => {
    render(<ToastContainer toasts={[]} dismiss={vi.fn()} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
