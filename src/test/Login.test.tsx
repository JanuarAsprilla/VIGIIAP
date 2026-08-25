import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import Login from '@/pages/auth/Login'

function renderLogin() {
  return render(<Login />, { wrapper: MemoryRouter })
}

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
  return {
    motion,
    AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  }
})

const navigateSpy = vi.fn()
let locationState: unknown = undefined
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => navigateSpy,
    useLocation: () => ({ state: locationState }),
  }
})

const authMock = {
  login: vi.fn(),
  loginVisitante: vi.fn(),
  loading: false,
}
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authMock }))

beforeEach(() => {
  vi.clearAllMocks()
  locationState = undefined
  authMock.loading = false
})

async function fillLogin(email: string, password: string) {
  const user = userEvent.setup()
  renderLogin()
  if (email)    await user.type(screen.getByLabelText(/Correo Electrónico/i), email)
  if (password) await user.type(screen.getByLabelText(/^Contraseña$/i), password)
  await user.click(screen.getByRole('button', { name: /Iniciar Sesión/i }))
  return user
}

describe('Login — protección contra open redirect (C-02)', () => {
  test('un from con protocolo-relativo (//evil.com) no se usa, cae a "/"', async () => {
    locationState = { from: { pathname: '//evil.com' } }
    authMock.login.mockResolvedValue({ id: '1', role: 'Investigador' })

    await fillLogin('user@iiap.gov.co', 'secret123')

    await waitFor(() => expect(navigateSpy).toHaveBeenCalledWith('/', { replace: true }))
  })

  test('un from absoluto externo no se usa, cae a "/"', async () => {
    locationState = { from: { pathname: 'https://evil.com/phish' } }
    authMock.login.mockResolvedValue({ id: '1', role: 'Investigador' })

    await fillLogin('user@iiap.gov.co', 'secret123')

    await waitFor(() => expect(navigateSpy).toHaveBeenCalledWith('/', { replace: true }))
  })

  test('un from interno normal sí se respeta para un usuario no-admin', async () => {
    locationState = { from: { pathname: '/perfil' } }
    authMock.login.mockResolvedValue({ id: '1', role: 'Investigador' })

    await fillLogin('user@iiap.gov.co', 'secret123')

    await waitFor(() => expect(navigateSpy).toHaveBeenCalledWith('/perfil', { replace: true }))
  })

  test('un usuario no-admin con from="/admin" es redirigido a "/" en vez de al panel', async () => {
    locationState = { from: { pathname: '/admin' } }
    authMock.login.mockResolvedValue({ id: '1', role: 'Investigador' })

    await fillLogin('user@iiap.gov.co', 'secret123')

    await waitFor(() => expect(navigateSpy).toHaveBeenCalledWith('/', { replace: true }))
  })

  test('un admin siempre entra directo a /admin, sin importar el from', async () => {
    locationState = { from: { pathname: '/perfil' } }
    authMock.login.mockResolvedValue({ id: '1', role: 'Administrador SIG' })

    await fillLogin('admin@iiap.gov.co', 'secret123')

    await waitFor(() => expect(navigateSpy).toHaveBeenCalledWith('/admin', { replace: true }))
  })
})

describe('Login — validación', () => {
  test('no llama a login() con email/contraseña vacíos', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByRole('button', { name: /Iniciar Sesión/i }))

    expect(await screen.findAllByRole('alert')).not.toHaveLength(0)
    expect(authMock.login).not.toHaveBeenCalled()
  })
})

describe('Login — resultados especiales', () => {
  test('passwordExpired redirige a /cambiar-password-expirada', async () => {
    authMock.login.mockResolvedValue({ passwordExpired: true })
    await fillLogin('user@iiap.gov.co', 'secret123')
    await waitFor(() => expect(navigateSpy).toHaveBeenCalledWith('/cambiar-password-expirada', { replace: true }))
  })

  test('requiresTwoFactor redirige a /verificar-2fa', async () => {
    authMock.login.mockResolvedValue({ requiresTwoFactor: true })
    await fillLogin('user@iiap.gov.co', 'secret123')
    await waitFor(() => expect(navigateSpy).toHaveBeenCalledWith('/verificar-2fa', { replace: true }))
  })

  test('un login fallido muestra el mensaje de error del servidor', async () => {
    authMock.login.mockRejectedValue(new Error('Credenciales incorrectas'))
    await fillLogin('user@iiap.gov.co', 'wrongpass')
    expect(await screen.findByText('Credenciales incorrectas')).toBeInTheDocument()
  })
})

describe('Login — modo visitante', () => {
  test('accede sin credenciales y respeta el from si no es /admin', async () => {
    locationState = { from: { pathname: '/mapas' } }
    authMock.loginVisitante.mockResolvedValue({ id: 'v1', role: 'Visitante' })

    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByRole('button', { name: /Solo quiero consultar información/i }))
    await user.click(screen.getByRole('button', { name: /Acceder como visitante/i }))

    expect(authMock.loginVisitante).toHaveBeenCalled()
    await waitFor(() => expect(navigateSpy).toHaveBeenCalledWith('/mapas', { replace: true }))
  })
})
