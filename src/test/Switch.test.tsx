import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import Switch from '@/components/ui/Switch'

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
  return { motion }
})

describe('Switch', () => {
  test('refleja el estado checked vía aria-checked', () => {
    render(<Switch checked onChange={vi.fn()} label="Mapas" />)
    expect(screen.getByRole('switch', { name: 'Mapas' })).toHaveAttribute('aria-checked', 'true')
  })

  test('clic invierte el estado actual', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Switch checked={false} onChange={onChange} label="Mapas" />)
    await user.click(screen.getByRole('switch', { name: 'Mapas' }))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  test('deshabilitado no dispara onChange', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Switch checked={false} onChange={onChange} label="Mapas" disabled />)
    await user.click(screen.getByRole('switch', { name: 'Mapas' }))
    expect(onChange).not.toHaveBeenCalled()
  })
})
