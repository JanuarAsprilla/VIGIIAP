import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import TopBar from '@/components/TopBar'
import { __resetPendingLoginRedirectForTests } from '@/components/topbar/pendingLoginRedirect'

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
vi.mock('@/components/topbar/LoginPanel', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div role="dialog" aria-label="Iniciar sesión">Login Panel<button onClick={onClose}>Cerrar login</button></div>
  ),
}))
vi.mock('@/components/topbar/WelcomePanel', () => ({
  default: ({ onClose, onIniciarSesion }: { onClose: () => void; onIniciarSesion: () => void }) => (
    <div role="dialog" aria-label="Bienvenido">
      Welcome Panel
      <button onClick={onClose}>Cerrar bienvenida</button>
      <button onClick={onIniciarSesion}>Ir a iniciar sesión</button>
    </div>
  ),
}))

const authMock = {
  isAuthenticated: false,
  initializing: false,
  user: null as { name: string; role: string; initials: string; isVisitante?: boolean } | null,
  logout: vi.fn(),
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
const { useNotificacionesMock, marcarLeidaMutate, marcarTodasLeidasMutate } = vi.hoisted(() => ({
  useNotificacionesMock: vi.fn(),
  marcarLeidaMutate: vi.fn(),
  marcarTodasLeidasMutate: vi.fn(),
}))
vi.mock('@/hooks/useNotificaciones', () => ({
  useNotificaciones: useNotificacionesMock,
  useMarcarNotificacionLeida: () => ({ mutate: marcarLeidaMutate }),
  useMarcarTodasNotificacionesLeidas: () => ({ mutate: marcarTodasLeidasMutate }),
}))
const { updatePerfilMutate } = vi.hoisted(() => ({ updatePerfilMutate: vi.fn() }))
vi.mock('@/hooks/useUsuarios', () => ({
  useUpdatePerfil: () => ({ mutate: updatePerfilMutate }),
}))

const navigateSpy = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => navigateSpy }
})

function renderTopBar(initialEntries?: { pathname: string; state?: unknown }[]) {
  return render(<TopBar onMenuToggle={vi.fn()} />, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={initialEntries ?? ['/']}>{children}</MemoryRouter>
    ),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  __resetPendingLoginRedirectForTests()
  authMock.isAuthenticated = false
  authMock.initializing = false
  authMock.user = null
  uiMock.openPalette = openPaletteSpy
  uiMock.notifications = true
  themeMock.isDark = false
  useNotificacionesMock.mockReturnValue({ data: [] })
})

describe('TopBar — usuario anónimo', () => {
  test('muestra "Ingresar" y ningún otro panel', () => {
    renderTopBar()
    expect(screen.getByRole('button', { name: /Ingresar/i })).toBeInTheDocument()
    expect(screen.queryByLabelText('Notificaciones')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Ajustes rápidos')).not.toBeInTheDocument()
  })

  test('clic en "Ingresar" reabre el panel de bienvenida tras cerrarlo', async () => {
    const user = userEvent.setup()
    renderTopBar()
    // El panel ya se abrió solo (ver describe de abajo) — se cierra primero
    // para probar que el botón "Ingresar" también lo abre por su cuenta.
    await user.click(await screen.findByText('Cerrar bienvenida'))
    expect(screen.queryByRole('dialog', { name: /Bienvenido/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Ingresar/i }))
    expect(await screen.findByRole('dialog', { name: /Bienvenido/i })).toBeInTheDocument()
  })

  test('location.state.openLogin (reenviado desde /login) abre LoginPanel directo, sin pasar por la bienvenida', async () => {
    renderTopBar([{ pathname: '/', state: { openLogin: true, from: { pathname: '/mapas' } } }])
    expect(await screen.findByRole('dialog', { name: /Iniciar sesión/i })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: /Bienvenido/i })).not.toBeInTheDocument()
  })

  // Regresión: en la app real, <ErrorBoundary key={location.key}> (ver
  // App.tsx) remonta TopBar entero en CADA navigate(), incluido el propio
  // navigate() con el que este mismo efecto limpia location.state después de
  // leer openLogin — la instancia fresca que nace de ese remount ve
  // location.state ya vacío. Se simula acá desmontando y volviendo a montar
  // TopBar con el state ya limpio, tal como lo vería esa instancia fresca.
  test('sobrevive al remount que dispara su propio navigate() de limpieza de location.state', async () => {
    const { unmount } = renderTopBar([{ pathname: '/', state: { openLogin: true, from: { pathname: '/mapas' } } }])
    await screen.findByRole('dialog', { name: /Iniciar sesión/i })
    unmount()

    renderTopBar([{ pathname: '/', state: {} }])
    expect(await screen.findByRole('dialog', { name: /Iniciar sesión/i })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: /Bienvenido/i })).not.toBeInTheDocument()
  })
})

describe('TopBar — panel de bienvenida se abre solo (reemplaza al antiguo WelcomeGate)', () => {
  test('se abre solo, sin clic ni redirect, para quien no tiene sesión', async () => {
    renderTopBar()
    expect(await screen.findByRole('dialog', { name: /Bienvenido/i })).toBeInTheDocument()
  })

  test('no se abre solo si ya hay sesión iniciada', () => {
    authMock.isAuthenticated = true
    authMock.user = { name: 'Root', role: 'Investigador', initials: 'RT' }
    renderTopBar()
    expect(screen.queryByRole('dialog', { name: /Bienvenido/i })).not.toBeInTheDocument()
  })

  test('no se abre solo mientras la sesión todavía se está verificando', () => {
    authMock.initializing = true
    renderTopBar()
    expect(screen.queryByRole('dialog', { name: /Bienvenido/i })).not.toBeInTheDocument()
  })

  test('si la persona lo cierra, no se vuelve a abrir solo en ese mismo montaje', async () => {
    const user = userEvent.setup()
    renderTopBar()
    expect(await screen.findByRole('dialog', { name: /Bienvenido/i })).toBeInTheDocument()
    await user.click(screen.getByText('Cerrar bienvenida'))
    expect(screen.queryByRole('dialog', { name: /Bienvenido/i })).not.toBeInTheDocument()
  })

  test('"Iniciar sesión" desde la bienvenida cambia a LoginPanel (paneles aparte, no un paso interno)', async () => {
    const user = userEvent.setup()
    renderTopBar()
    expect(await screen.findByRole('dialog', { name: /Bienvenido/i })).toBeInTheDocument()
    await user.click(screen.getByText('Ir a iniciar sesión'))
    expect(screen.queryByRole('dialog', { name: /Bienvenido/i })).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: /Iniciar sesión/i })).toBeInTheDocument()
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
  test('muestra Notificaciones y Ajustes, con el nombre del usuario (el rol vive en el dropdown, no duplicado en el trigger)', () => {
    authMock.isAuthenticated = true
    authMock.user = { name: 'Ana Restrepo', role: 'Investigador', initials: 'AR' }

    renderTopBar()
    expect(screen.getByLabelText(/Notificaciones/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Ajustes rápidos')).toBeInTheDocument()
    expect(screen.getByText('Ana Restrepo')).toBeInTheDocument()
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

  test('sin sesión, el botón de tema no persiste preferencia en el servidor', async () => {
    const user = userEvent.setup()
    renderTopBar()
    await user.click(screen.getByLabelText('Cambiar a modo oscuro'))
    expect(updatePerfilMutate).not.toHaveBeenCalled()
  })

  test('con sesión, el botón de tema persiste el tema opuesto al actual', async () => {
    authMock.isAuthenticated = true
    authMock.user = { name: 'Ana Restrepo', role: 'Investigador', initials: 'AR' }
    themeMock.isDark = false
    const user = userEvent.setup()
    renderTopBar()
    await user.click(screen.getByLabelText('Cambiar a modo oscuro'))
    expect(updatePerfilMutate).toHaveBeenCalledWith({ tema: 'dark' })
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

describe('TopBar — notificaciones', () => {
  // Ya no es exclusivo de admins -- cualquier cuenta real (no visitante/público
  // sin verificar) recibe notificaciones, ver useNotificaciones.ts.
  test('un usuario investigador (no admin) sí ve el conteo de notificaciones', () => {
    authMock.isAuthenticated = true
    authMock.user = { name: 'Ana Restrepo', role: 'Investigador', initials: 'AR' }
    useNotificacionesMock.mockReturnValue({ data: [{ id: 'n1', leido_en: null }, { id: 'n2', leido_en: null }] })

    renderTopBar()
    expect(screen.getByLabelText('Notificaciones, 2 sin leer')).toBeInTheDocument()
  })

  test('un admin con notificaciones no leídas ve el badge con el conteo', () => {
    authMock.isAuthenticated = true
    authMock.user = { name: 'Root', role: 'Administrador SIG', initials: 'RT' }
    useNotificacionesMock.mockReturnValue({ data: [{ id: 'n1', leido_en: null }, { id: 'n2', leido_en: null }] })

    renderTopBar()
    expect(screen.getByLabelText('Notificaciones, 2 sin leer')).toBeInTheDocument()
  })

  test('con notifications desactivadas en UIContext, no muestra el badge aunque haya no leídas', () => {
    authMock.isAuthenticated = true
    authMock.user = { name: 'Root', role: 'Administrador SIG', initials: 'RT' }
    uiMock.notifications = false
    useNotificacionesMock.mockReturnValue({ data: [{ id: 'n1', leido_en: null }] })

    renderTopBar()
    expect(screen.getByLabelText('Notificaciones')).toBeInTheDocument()
  })

  test('marcar una notificación como leída llama a la mutación con su id', async () => {
    authMock.isAuthenticated = true
    authMock.user = { name: 'Root', role: 'Administrador SIG', initials: 'RT' }
    useNotificacionesMock.mockReturnValue({ data: [{ id: 'n1', leido_en: null }, { id: 'n2', leido_en: null }] })

    const user = userEvent.setup()
    renderTopBar()
    await user.click(screen.getByLabelText('Notificaciones, 2 sin leer'))
    await user.click(screen.getByText('Marcar primera leída'))

    expect(marcarLeidaMutate).toHaveBeenCalledWith('n1')
  })

  test('marcar todas como leídas llama a la mutación correspondiente', async () => {
    authMock.isAuthenticated = true
    authMock.user = { name: 'Root', role: 'Administrador SIG', initials: 'RT' }
    useNotificacionesMock.mockReturnValue({ data: [{ id: 'n1', leido_en: null }, { id: 'n2', leido_en: null }] })

    const user = userEvent.setup()
    renderTopBar()
    await user.click(screen.getByLabelText('Notificaciones, 2 sin leer'))
    await user.click(screen.getByText('Marcar todas leídas'))

    expect(marcarTodasLeidasMutate).toHaveBeenCalled()
  })

  test('una notificación ya leída no cuenta en el badge', () => {
    authMock.isAuthenticated = true
    authMock.user = { name: 'Root', role: 'Administrador SIG', initials: 'RT' }
    useNotificacionesMock.mockReturnValue({
      data: [{ id: 'n1', leido_en: new Date().toISOString() }, { id: 'n2', leido_en: null }],
    })

    renderTopBar()
    expect(screen.getByLabelText('Notificaciones, 1 sin leer')).toBeInTheDocument()
  })
})
