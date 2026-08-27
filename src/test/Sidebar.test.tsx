import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import { ROLES } from '@/lib/constants/roles'

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

vi.mock('@/components/NuevoAnalisisModal', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div>
      <span>Modal Nuevo Análisis</span>
      <button onClick={onClose}>Cerrar modal análisis</button>
    </div>
  ),
}))

type MockUser = { name: string; role: string; initials: string; isVisitante?: boolean }
const authMock: { isAuthenticated: boolean; user: MockUser | null; logout: () => void } = {
  isAuthenticated: false,
  user: null,
  logout: vi.fn(),
}
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authMock }))

function renderSidebar(mobileOpen = false, onClose = vi.fn()) {
  return { onClose, ...render(<MemoryRouter><Sidebar mobileOpen={mobileOpen} onClose={onClose} /></MemoryRouter>) }
}

beforeEach(() => {
  vi.clearAllMocks()
  authMock.isAuthenticated = false
  authMock.user = null
})

describe('Sidebar — visitante sin sesión', () => {
  test('los módulos restringidos aparecen bloqueados, sin enlace real', () => {
    renderSidebar()
    expect(screen.queryByRole('link', { name: /Geovisor/i })).not.toBeInTheDocument()
    expect(screen.getByText('Geovisor')).toBeInTheDocument()
  })

  test('los módulos públicos sí son enlaces reales', () => {
    renderSidebar()
    expect(screen.getByRole('link', { name: /Mapas/i })).toHaveAttribute('href', '/mapas')
  })

  test('muestra "Iniciar sesión" y no muestra "Cerrar Sesión"', () => {
    renderSidebar()
    expect(screen.getByText('Iniciar sesión')).toBeInTheDocument()
    expect(screen.queryByText('Cerrar Sesión')).not.toBeInTheDocument()
  })
})

describe('Sidebar — visitante autenticado (no verificado)', () => {
  test('los módulos restringidos siguen bloqueados y se ofrece solicitar acceso', () => {
    authMock.isAuthenticated = true
    authMock.user = { name: 'Invitado', role: ROLES.VISITANTE, initials: 'V', isVisitante: true }
    renderSidebar()
    expect(screen.queryByRole('link', { name: /Solicitudes/i })).not.toBeInTheDocument()
    expect(screen.getByText('Solicitar acceso')).toBeInTheDocument()
    expect(screen.queryByText('Nuevo Análisis')).not.toBeInTheDocument()
  })
})

describe('Sidebar — usuario verificado', () => {
  test('desbloquea los módulos restringidos y ofrece "Nuevo Análisis"', () => {
    authMock.isAuthenticated = true
    authMock.user = { name: 'Ana Restrepo', role: ROLES.INVESTIGADOR, initials: 'AR' }
    renderSidebar()
    expect(screen.getByRole('link', { name: /Geovisor/i })).toHaveAttribute('href', '/geovisor')
    expect(screen.getByText('Nuevo Análisis')).toBeInTheDocument()
    expect(screen.queryByText('Panel Admin')).not.toBeInTheDocument()
  })

  test('un admin_sig ve el acceso directo al Panel Admin', () => {
    authMock.isAuthenticated = true
    authMock.user = { name: 'Root', role: ROLES.ADMIN, initials: 'RT' }
    renderSidebar()
    expect(screen.getByText('Panel Admin')).toBeInTheDocument()
  })

  test('"Nuevo Análisis" abre el modal correspondiente', async () => {
    authMock.isAuthenticated = true
    authMock.user = { name: 'Ana Restrepo', role: ROLES.INVESTIGADOR, initials: 'AR' }
    const user = userEvent.setup()
    renderSidebar()
    await user.click(screen.getByText('Nuevo Análisis'))
    expect(screen.getByText('Modal Nuevo Análisis')).toBeInTheDocument()
  })

  test('cerrar sesión llama a logout() y a onClose()', async () => {
    authMock.isAuthenticated = true
    authMock.user = { name: 'Ana Restrepo', role: ROLES.INVESTIGADOR, initials: 'AR' }
    const user = userEvent.setup()
    const { onClose } = renderSidebar()
    await user.click(screen.getByText('Cerrar Sesión'))
    expect(authMock.logout).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })
})

describe('Sidebar — drawer móvil', () => {
  test('clic en el overlay llama a onClose', async () => {
    const user = userEvent.setup()
    const { onClose, container } = renderSidebar(true)
    const overlay = container.querySelector('.fixed.inset-0.z-50.backdrop-blur-\\[3px\\]')
    expect(overlay).not.toBeNull()
    await user.click(overlay as Element)
    expect(onClose).toHaveBeenCalled()
  })
})
