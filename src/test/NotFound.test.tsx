import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import NotFound from '@/pages/NotFound'

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

vi.mock('@/components/ui/Card3D', () => ({
  default: ({ children, className }: { children: ReactNode; className?: string }) =>
    <div className={className}>{children}</div>,
}))

const navigateSpy = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => navigateSpy }
})

beforeEach(() => { vi.clearAllMocks() })

describe('NotFound', () => {
  test('"Volver atrás" navega hacia atrás en el historial', async () => {
    const user = userEvent.setup()
    render(<NotFound />, { wrapper: MemoryRouter })
    await user.click(screen.getByRole('button', { name: /Volver atrás/i }))
    expect(navigateSpy).toHaveBeenCalledWith(-1)
  })

  test('los accesos rápidos apuntan a las rutas correctas', () => {
    render(<NotFound />, { wrapper: MemoryRouter })
    expect(screen.getByRole('link', { name: /^Ir al inicio$/i })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Mapas' })).toHaveAttribute('href', '/mapas')
    expect(screen.getByRole('link', { name: 'Documentos' })).toHaveAttribute('href', '/documentos')
  })
})
