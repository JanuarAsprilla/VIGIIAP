import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import ResumenActividad from '@/components/herramientas/ResumenActividad'

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

const { authMock } = vi.hoisted(() => ({ authMock: { user: null as { rol: string } | null } }))
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authMock }))
vi.mock('@/hooks/useStats', () => ({ useAdminStats: vi.fn() }))
import { useAdminStats } from '@/hooks/useStats'

describe('ResumenActividad', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.user = null
    vi.mocked(useAdminStats).mockReturnValue({
      data: { documentos: 42, solicitudesPendientes: 5 },
      isLoading: false,
    } as unknown as ReturnType<typeof useAdminStats>)
  })

  test('mientras carga, muestra el spinner', () => {
    vi.mocked(useAdminStats).mockReturnValue({ data: undefined, isLoading: true } as unknown as ReturnType<typeof useAdminStats>)
    authMock.user = { rol: 'admin_sig' }

    const { container } = render(<ResumenActividad />)
    expect(container.querySelector('.animate-spin')).not.toBeNull()
  })

  test('un usuario no-admin ve el mensaje de estadísticas restringidas, no las cifras', () => {
    authMock.user = { rol: 'investigador' }
    render(<ResumenActividad />)
    expect(screen.getByText('Estadísticas disponibles para administradores.')).toBeInTheDocument()
    expect(screen.queryByText('42')).not.toBeInTheDocument()
  })

  test('un admin_sig ve las cifras reales de documentos y solicitudes', () => {
    authMock.user = { rol: 'admin_sig' }
    render(<ResumenActividad />)
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  test('un super_admin también ve las cifras reales, igual que admin_sig', () => {
    authMock.user = { rol: 'super_admin' }
    render(<ResumenActividad />)
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })
})
