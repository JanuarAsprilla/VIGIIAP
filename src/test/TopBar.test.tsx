import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import TopBar from '@/components/TopBar'

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

vi.mock('@/components/topbar/SoportePanel', () => ({ default: () => <div>Soporte Panel</div> }))
vi.mock('@/components/topbar/NotificacionesPanel', () => ({ default: () => <div>Notificaciones Panel</div> }))
vi.mock('@/components/topbar/AjustesPanel', () => ({ default: () => <div>Ajustes Panel</div> }))
vi.mock('@/components/topbar/ProfileDropdown', () => ({
  default: ({ onLogout }: { onLogout: () => void }) => (
    <div><button onClick={onLogout}>Cerrar sesión</button></div>
  ),
}))

const authMock = {
  isAuthenticated: false,
  user: null as { name: string; role: string; initials: string; isVisitante?: boolean } | null,
  logout: vi.fn(),
  isAdmin: false,
}
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authMock }))
vi.mock('@/contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false, toggleTheme: vi.fn() }) }))
const setQuerySpy = vi.fn()
vi.mock('@/contexts/SearchContext', () => ({ useSearch: () => ({ query: '', setQuery: setQuerySpy }) }))
vi.mock('@/contexts/UIContext', () => ({ useUI: () => ({ openPalette: vi.fn(), notifications: true }) }))
vi.mock('@/hooks/useNotificaciones', () => ({ useAdminNotificaciones: () => ({ data: [] }) }))

const navigateSpy = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => navigateSpy }
})

function renderTopBar() {
  return render(<TopBar onMenuToggle={vi.fn()} />, { wrapper: MemoryRouter })
}

beforeEach(() => {
  vi.clearAllMocks()
  authMock.isAuthenticated = false
  authMock.user = null
  authMock.isAdmin = false
})

describe('TopBar — usuario anónimo', () => {
  test('muestra "Ingresar" y ningún panel de sesión', () => {
    renderTopBar()
    expect(screen.getByRole('link', { name: /Ingresar/i })).toBeInTheDocument()
    expect(screen.queryByLabelText('Notificaciones')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Ajustes rápidos')).not.toBeInTheDocument()
  })
})

describe('TopBar — usuario no verificado (visitante/público)', () => {
  test('oculta Soporte, Notificaciones y Ajustes aunque haya sesión', () => {
    authMock.isAuthenticated = true
    authMock.user = { name: 'Invitado', role: 'Visitante', initials: 'V', isVisitante: true }

    renderTopBar()
    expect(screen.queryByLabelText(/Notificaciones/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Ajustes rápidos')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Menú de perfil')).toBeInTheDocument()
  })
})

describe('TopBar — usuario verificado', () => {
  test('muestra Notificaciones y Ajustes, con el nombre y rol del usuario', () => {
    authMock.isAuthenticated = true
    authMock.user = { name: 'Ana Restrepo', role: 'Investigador', initials: 'AR' }

    renderTopBar()
    expect(screen.getByLabelText(/Notificaciones/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Ajustes rápidos')).toBeInTheDocument()
    expect(screen.getByText('Ana Restrepo')).toBeInTheDocument()
    expect(screen.getByText('Investigador')).toBeInTheDocument()
  })

  test('cerrar sesión desde el dropdown llama a logout() y navega a "/"', async () => {
    authMock.isAuthenticated = true
    authMock.user = { name: 'Ana Restrepo', role: 'Investigador', initials: 'AR' }

    const user = userEvent.setup()
    renderTopBar()
    await user.click(screen.getByLabelText('Menú de perfil'))
    await user.click(screen.getByRole('button', { name: /Cerrar sesión/i }))

    expect(authMock.logout).toHaveBeenCalled()
    expect(navigateSpy).toHaveBeenCalledWith('/')
  })
})
