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

vi.mock('@/components/topbar/SoportePanel', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div>Soporte Panel<button onClick={onClose}>Cerrar soporte</button></div>
  ),
}))
vi.mock('@/components/topbar/NotificacionesPanel', () => ({
  default: ({ items, onMarkRead, onMarkAllRead }: {
    items: { id: string }[]; onMarkRead: (id: string) => void; onMarkAllRead: () => void
  }) => (
    <div>
      Notificaciones Panel ({items.length})
      {items[0] && <button onClick={() => onMarkRead(items[0].id)}>Marcar primera leída</button>}
      <button onClick={onMarkAllRead}>Marcar todas leídas</button>
    </div>
  ),
}))
vi.mock('@/components/topbar/AjustesPanel', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div>Ajustes Panel<button onClick={onClose}>Cerrar ajustes</button></div>
  ),
}))
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
const toggleThemeSpy = vi.fn()
const themeMock = { isDark: false, toggleTheme: toggleThemeSpy }
vi.mock('@/contexts/ThemeContext', () => ({ useTheme: () => themeMock }))
const setQuerySpy = vi.fn()
vi.mock('@/contexts/SearchContext', () => ({ useSearch: () => ({ query: '', setQuery: setQuerySpy }) }))
const openPaletteSpy = vi.fn()
const uiMock = { openPalette: openPaletteSpy, notifications: true }
vi.mock('@/contexts/UIContext', () => ({ useUI: () => uiMock }))
const { useAdminNotificacionesMock } = vi.hoisted(() => ({ useAdminNotificacionesMock: vi.fn() }))
vi.mock('@/hooks/useNotificaciones', () => ({ useAdminNotificaciones: useAdminNotificacionesMock }))

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
  localStorage.clear()
  authMock.isAuthenticated = false
  authMock.user = null
  authMock.isAdmin = false
  uiMock.openPalette = openPaletteSpy
  uiMock.notifications = true
  themeMock.isDark = false
  useAdminNotificacionesMock.mockReturnValue({ data: [] })
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

describe('TopBar — búsqueda', () => {
  test('escribir en la búsqueda de escritorio llama a setQuery', async () => {
    const user = userEvent.setup()
    renderTopBar()
    await user.type(screen.getByPlaceholderText('Buscar módulos, documentos...'), 'a')
    expect(setQuerySpy).toHaveBeenCalledWith('a')
  })

  test('sin texto, el botón de búsqueda global abre la paleta de comandos', async () => {
    const user = userEvent.setup()
    renderTopBar()
    await user.click(screen.getByLabelText('Abrir búsqueda global (Cmd+K)'))
    expect(openPaletteSpy).toHaveBeenCalled()
  })

  test('el botón de búsqueda móvil despliega la fila de búsqueda para pantallas pequeñas', async () => {
    const user = userEvent.setup()
    renderTopBar()
    const mobileBtn = screen.getByLabelText('Buscar')
    expect(mobileBtn).toHaveAttribute('aria-expanded', 'false')

    await user.click(mobileBtn)
    expect(mobileBtn).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getAllByPlaceholderText('Buscar módulos, documentos...')).toHaveLength(2)
  })
})

describe('TopBar — tema visual', () => {
  test('el botón de tema llama a toggleTheme', async () => {
    const user = userEvent.setup()
    renderTopBar()
    await user.click(screen.getByLabelText('Cambiar a modo oscuro'))
    expect(toggleThemeSpy).toHaveBeenCalled()
  })

  test('en modo oscuro, el botón ofrece cambiar a modo claro', () => {
    themeMock.isDark = true
    renderTopBar()
    expect(screen.getByLabelText('Cambiar a modo claro')).toBeInTheDocument()
  })
})

describe('TopBar — paneles de usuario verificado', () => {
  beforeEach(() => {
    authMock.isAuthenticated = true
    authMock.user = { name: 'Ana Restrepo', role: 'Investigador', initials: 'AR' }
  })

  test('abrir y cerrar el panel de Soporte', async () => {
    const user = userEvent.setup()
    renderTopBar()
    const soporteBtn = screen.getByRole('button', { name: /Soporte/i })
    await user.click(soporteBtn)
    expect(screen.getByText('Soporte Panel')).toBeInTheDocument()
    expect(soporteBtn).toHaveAttribute('aria-expanded', 'true')

    await user.click(screen.getByText('Cerrar soporte'))
    expect(screen.queryByText('Soporte Panel')).not.toBeInTheDocument()
  })

  test('abrir y cerrar el panel de Ajustes', async () => {
    const user = userEvent.setup()
    renderTopBar()
    await user.click(screen.getByLabelText('Ajustes rápidos'))
    expect(screen.getByText('Ajustes Panel')).toBeInTheDocument()

    await user.click(screen.getByText('Cerrar ajustes'))
    expect(screen.queryByText('Ajustes Panel')).not.toBeInTheDocument()
  })

  test('abrir Notificaciones cierra el panel de Soporte previamente abierto', async () => {
    const user = userEvent.setup()
    renderTopBar()
    await user.click(screen.getByRole('button', { name: /Soporte/i }))
    expect(screen.getByText('Soporte Panel')).toBeInTheDocument()

    await user.click(screen.getByLabelText(/Notificaciones/i))
    expect(screen.queryByText('Soporte Panel')).not.toBeInTheDocument()
    expect(screen.getByText(/Notificaciones Panel/)).toBeInTheDocument()
  })

  test('el enlace de Ayuda apunta a la guía de usuario', () => {
    renderTopBar()
    expect(screen.getByRole('link', { name: /Ayuda/i })).toHaveAttribute('href', '/guia-usuario')
  })
})

describe('TopBar — notificaciones de administrador', () => {
  test('un usuario no admin nunca ve el conteo de notificaciones, aunque haya datos', () => {
    authMock.isAuthenticated = true
    authMock.user = { name: 'Ana Restrepo', role: 'Investigador', initials: 'AR' }
    authMock.isAdmin = false
    useAdminNotificacionesMock.mockReturnValue({ data: [{ id: 'n1' }] })

    renderTopBar()
    expect(screen.getByLabelText('Notificaciones')).toBeInTheDocument()
  })

  test('un admin con notificaciones no leídas ve el badge con el conteo', () => {
    authMock.isAuthenticated = true
    authMock.user = { name: 'Root', role: 'Administrador SIG', initials: 'RT' }
    authMock.isAdmin = true
    useAdminNotificacionesMock.mockReturnValue({ data: [{ id: 'n1' }, { id: 'n2' }] })

    renderTopBar()
    expect(screen.getByLabelText('Notificaciones, 2 sin leer')).toBeInTheDocument()
  })

  test('con notifications desactivadas en UIContext, no muestra el badge aunque haya no leídas', () => {
    authMock.isAuthenticated = true
    authMock.user = { name: 'Root', role: 'Administrador SIG', initials: 'RT' }
    authMock.isAdmin = true
    uiMock.notifications = false
    useAdminNotificacionesMock.mockReturnValue({ data: [{ id: 'n1' }] })

    renderTopBar()
    expect(screen.getByLabelText('Notificaciones')).toBeInTheDocument()
  })

  test('marcar una notificación como leída persiste en localStorage y baja el conteo', async () => {
    authMock.isAuthenticated = true
    authMock.user = { name: 'Root', role: 'Administrador SIG', initials: 'RT' }
    authMock.isAdmin = true
    useAdminNotificacionesMock.mockReturnValue({ data: [{ id: 'n1' }, { id: 'n2' }] })

    const user = userEvent.setup()
    renderTopBar()
    await user.click(screen.getByLabelText('Notificaciones, 2 sin leer'))
    await user.click(screen.getByText('Marcar primera leída'))

    expect(screen.getByLabelText('Notificaciones, 1 sin leer')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('vigiiap_notif_read') ?? '[]')).toContain('n1')
  })

  test('marcar todas como leídas deja el conteo en cero', async () => {
    authMock.isAuthenticated = true
    authMock.user = { name: 'Root', role: 'Administrador SIG', initials: 'RT' }
    authMock.isAdmin = true
    useAdminNotificacionesMock.mockReturnValue({ data: [{ id: 'n1' }, { id: 'n2' }] })

    const user = userEvent.setup()
    renderTopBar()
    await user.click(screen.getByLabelText('Notificaciones, 2 sin leer'))
    await user.click(screen.getByText('Marcar todas leídas'))

    expect(screen.getByLabelText('Notificaciones')).toBeInTheDocument()
    expect(screen.queryByLabelText(/sin leer/)).not.toBeInTheDocument()
  })

  test('el estado de leídas persiste entre renders (localStorage)', () => {
    localStorage.setItem('vigiiap_notif_read', JSON.stringify(['n1']))
    authMock.isAuthenticated = true
    authMock.user = { name: 'Root', role: 'Administrador SIG', initials: 'RT' }
    authMock.isAdmin = true
    useAdminNotificacionesMock.mockReturnValue({ data: [{ id: 'n1' }, { id: 'n2' }] })

    renderTopBar()
    expect(screen.getByLabelText('Notificaciones, 1 sin leer')).toBeInTheDocument()
  })
})
