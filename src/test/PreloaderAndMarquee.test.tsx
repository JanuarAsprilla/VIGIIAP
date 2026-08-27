import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import Preloader from '@/components/Preloader'
import MarqueeStrip from '@/components/MarqueeStrip'

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

vi.mock('@/hooks/useReducedMotion', () => ({ useReducedMotion: () => false }))

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Preloader', () => {
  test('el progreso avanza desde 0% y se estabiliza en 100%', () => {
    render(<Preloader />)
    expect(screen.getByText('0%')).toBeInTheDocument()

    act(() => { vi.advanceTimersByTime(3000) })
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  test('el progreso se estabiliza exactamente en 100%, incluso antes de ocultarse', () => {
    render(<Preloader />)
    act(() => { vi.advanceTimersByTime(3000) })
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.queryByText(/^10[1-9]%|^1[1-9]\d%/)).not.toBeInTheDocument()
  })

  test('desaparece automáticamente después de 3.2s', () => {
    const { container } = render(<Preloader />)
    expect(container.firstChild).not.toBeNull()

    act(() => { vi.advanceTimersByTime(3200) })
    expect(container.firstChild).toBeNull()
  })
})

describe('MarqueeStrip', () => {
  test('duplica los elementos para el efecto de scroll continuo', () => {
    render(<MarqueeStrip />)
    expect(screen.getAllByText('Biogeografía')).toHaveLength(2)
    expect(screen.getAllByText('Gestión Territorial')).toHaveLength(2)
  })

  test('es puramente decorativo (oculto a lectores de pantalla)', () => {
    const { container } = render(<MarqueeStrip />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })
})
