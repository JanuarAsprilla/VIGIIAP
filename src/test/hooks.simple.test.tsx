import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

// ─── matchMedia mock (jsdom no lo incluye) ────────────────────────────────────
function makeMq(initialMatches) {
  const listeners = []
  const mq = {
    matches: initialMatches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener:    (_, fn) => listeners.push(fn),
    removeEventListener: (_, fn) => {
      const i = listeners.indexOf(fn)
      if (i !== -1) listeners.splice(i, 1)
    },
    dispatchEvent: () => true,
    _fire(newMatches) {
      mq.matches = newMatches
      listeners.forEach((fn) => fn({ matches: newMatches, media: mq.media }))
    },
    _listenerCount: () => listeners.length,
  }
  return mq
}

// ─── useReducedMotion ─────────────────────────────────────────────────────────
describe('useReducedMotion', () => {
  let mq

  beforeEach(() => {
    mq = makeMq(false)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn(() => mq),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('returns false when prefers-reduced-motion is not set', () => {
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
  })

  test('returns true when prefers-reduced-motion is set at mount', () => {
    mq.matches = true
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(true)
  })

  test('updates when the media query fires true', () => {
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)

    act(() => mq._fire(true))
    expect(result.current).toBe(true)
  })

  test('updates when the media query fires back to false', () => {
    mq.matches = true
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(true)

    act(() => mq._fire(false))
    expect(result.current).toBe(false)
  })

  test('removes the event listener on unmount', () => {
    const { unmount } = renderHook(() => useReducedMotion())
    // Listener was added on mount
    expect(mq._listenerCount()).toBe(1)
    unmount()
    expect(mq._listenerCount()).toBe(0)
  })
})
