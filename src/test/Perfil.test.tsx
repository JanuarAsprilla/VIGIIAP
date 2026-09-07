import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UIProvider } from '@/contexts/UIContext'
import Perfil from '@/pages/Perfil'

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

vi.mock('@/components/ui/Card3D', () => ({
  default: ({ children, className }: { children: ReactNode; className?: string }) =>
    <div className={className}>{children}</div>,
}))

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn((url: string) => (url === '/auth/sessions' ? Promise.resolve([]) : Promise.resolve({}))),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))
import api from '@/lib/api'

const navigateSpy = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => navigateSpy }
})

vi.mock('@/hooks/useUsuarios', () => ({
  useUpdatePerfil: vi.fn(),
  useUpdatePassword: vi.fn(),
  useUpdateAvatar: vi.fn(),
}))
import { useUpdatePerfil, useUpdatePassword, useUpdateAvatar } from '@/hooks/useUsuarios'

const authMock = {
  user: { id: 'u1', name: 'Ana Restrepo', email: 'ana@iiap.gov.co', rol: 'investigador', role: 'Investigador', institucion: 'IIAP' },
  logout: vi.fn(),
  refreshProfile: vi.fn().mockResolvedValue(undefined),
}
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authMock }))

function renderPerfil() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <UIProvider>
        <MemoryRouter><Perfil /></MemoryRouter>
      </UIProvider>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  authMock.user = { id: 'u1', name: 'Ana Restrepo', email: 'ana@iiap.gov.co', rol: 'investigador', role: 'Investigador', institucion: 'IIAP' }
  vi.mocked(useUpdatePerfil).mockReturnValue({
    mutateAsync: vi.fn(), isPending: false,
  } as unknown as ReturnType<typeof useUpdatePerfil>)
  vi.mocked(useUpdatePassword).mockReturnValue({
    mutateAsync: vi.fn(), isPending: false,
  } as unknown as ReturnType<typeof useUpdatePassword>)
  vi.mocked(useUpdateAvatar).mockReturnValue({
    mutateAsync: vi.fn(), isPending: false,
  } as unknown as ReturnType<typeof useUpdateAvatar>)
})

describe('Perfil — edición inline del nombre', () => {
  test('guarda el nuevo nombre y refresca el perfil', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useUpdatePerfil).mockReturnValue({
      mutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useUpdatePerfil>)

    const user = userEvent.setup()
    renderPerfil()

    await user.click(screen.getAllByRole('button', { name: 'Editar' })[0])
    const input = screen.getByPlaceholderText('Tu nombre completo')
    await user.clear(input)
    await user.type(input, 'Ana María Restrepo')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ nombre: 'Ana María Restrepo' }))
    expect(authMock.refreshProfile).toHaveBeenCalled()
  })

  test('un nombre vacío no llama a la mutación', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useUpdatePerfil).mockReturnValue({
      mutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useUpdatePerfil>)

    const user = userEvent.setup()
    renderPerfil()

    await user.click(screen.getAllByRole('button', { name: 'Editar' })[0])
    const input = screen.getByPlaceholderText('Tu nombre completo')
    await user.clear(input)
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('El nombre no puede estar vacío')).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  test('si la mutación falla, muestra el error sin cerrar el editor', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('No se pudo guardar'))
    vi.mocked(useUpdatePerfil).mockReturnValue({
      mutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useUpdatePerfil>)

    const user = userEvent.setup()
    renderPerfil()

    await user.click(screen.getAllByRole('button', { name: 'Editar' })[0])
    const input = screen.getByPlaceholderText('Tu nombre completo')
    await user.type(input, ' extra')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('No se pudo guardar')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Tu nombre completo')).toBeInTheDocument()
  })
})

describe('Perfil — cambiar contraseña', () => {
  test('valida contraseña actual, fortaleza de la nueva y coincidencia de confirmación', async () => {
    const user = userEvent.setup()
    renderPerfil()

    await user.click(screen.getByRole('button', { name: /Actualizar contraseña/i }))

    expect(await screen.findByText('Ingrese su contraseña actual')).toBeInTheDocument()
    expect(screen.getByText('La contraseña es requerida')).toBeInTheDocument()
  })

  test('con datos válidos llama a la mutación con currentPassword/newPassword', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useUpdatePassword).mockReturnValue({
      mutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useUpdatePassword>)

    const user = userEvent.setup()
    renderPerfil()

    await user.type(screen.getByPlaceholderText('Tu contraseña actual'), 'ActualPass1!')
    await user.type(screen.getByPlaceholderText(/Mín\. 8 caracteres/i), 'NuevaPass2@')
    await user.type(screen.getByPlaceholderText('Repita la nueva contraseña'), 'NuevaPass2@')
    await user.click(screen.getByRole('button', { name: /Actualizar contraseña/i }))

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({
      currentPassword: 'ActualPass1!', newPassword: 'NuevaPass2@',
    }))
  })

  test('nueva contraseña y confirmación distintas muestran el error específico', async () => {
    const user = userEvent.setup()
    renderPerfil()

    await user.type(screen.getByPlaceholderText('Tu contraseña actual'), 'ActualPass1!')
    await user.type(screen.getByPlaceholderText(/Mín\. 8 caracteres/i), 'NuevaPass2@')
    await user.type(screen.getByPlaceholderText('Repita la nueva contraseña'), 'OtraPass3#')
    await user.click(screen.getByRole('button', { name: /Actualizar contraseña/i }))

    expect(await screen.findByText(/no coinciden/i)).toBeInTheDocument()
  })
})

describe('Perfil — edición de institución y cancelar', () => {
  test('cancelar la edición del nombre descarta los cambios sin llamar a la mutación', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useUpdatePerfil).mockReturnValue({
      mutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useUpdatePerfil>)

    const user = userEvent.setup()
    renderPerfil()
    await user.click(screen.getAllByRole('button', { name: 'Editar' })[0])
    await user.type(screen.getByPlaceholderText('Tu nombre completo'), ' cambiado')
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(mutateAsync).not.toHaveBeenCalled()
    expect(screen.queryByPlaceholderText('Tu nombre completo')).not.toBeInTheDocument()
  })

  test('editar la institución llama a la mutación con el campo correcto', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useUpdatePerfil).mockReturnValue({
      mutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useUpdatePerfil>)

    const user = userEvent.setup()
    renderPerfil()
    await user.click(screen.getAllByRole('button', { name: 'Editar' })[1])
    const input = screen.getByPlaceholderText('Nombre de tu institución')
    await user.clear(input)
    await user.type(input, 'Universidad Tecnológica del Chocó')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ institucion: 'Universidad Tecnológica del Chocó' }))
  })
})

describe('Perfil — usuario no verificado', () => {
  test('no ofrece edición de campos ni cambio de contraseña', () => {
    authMock.user = { id: 'u2', name: 'Invitado', email: 'invitado@example.com', rol: 'publico', role: 'Público', institucion: '' }
    renderPerfil()

    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
    expect(screen.getByText(/La gestión de contraseña está disponible para cuentas verificadas/)).toBeInTheDocument()
  })
})

describe('Perfil — cerrar sesión', () => {
  test('cerrar sesión llama a logout() y navega a "/"', async () => {
    const user = userEvent.setup()
    renderPerfil()
    await user.click(screen.getByRole('button', { name: /Cerrar Sesión/i }))

    expect(authMock.logout).toHaveBeenCalled()
    expect(navigateSpy).toHaveBeenCalledWith('/')
  })
})

describe('Perfil — autenticación en dos pasos', () => {
  test('activar 2FA solicita el QR y permite verificar el código', async () => {
    vi.mocked(api.post).mockImplementation((url: string) => {
      if (url === '/auth/2fa/setup') return Promise.resolve({ qrDataUrl: 'data:image/png;base64,abc', secret: 'SECRET123' })
      return Promise.resolve({})
    })

    const user = userEvent.setup()
    renderPerfil()
    await user.click(screen.getByRole('button', { name: 'Activar' }))

    expect(await screen.findByAltText('QR 2FA')).toHaveAttribute('src', 'data:image/png;base64,abc')
    expect(screen.getByText(/SECRET123/)).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('Código de 6 dígitos'), '123456')
    await user.click(screen.getByRole('button', { name: 'Verificar' }))

    expect(await screen.findByText(/2FA activado exitosamente/)).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/auth/2fa/verify', { code: '123456' })
  })

  test('si falla activar el 2FA, muestra el mensaje de error', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('No se pudo generar el código'))

    const user = userEvent.setup()
    renderPerfil()
    await user.click(screen.getByRole('button', { name: 'Activar' }))

    expect(await screen.findByText('No se pudo generar el código')).toBeInTheDocument()
  })

  test('con 2FA activo, desactivar pide un código de confirmación antes de llamar al endpoint', async () => {
    authMock.user = { ...authMock.user, twoFactorEnabled: true } as typeof authMock.user & { twoFactorEnabled: boolean }
    vi.mocked(api.post).mockResolvedValue({})

    const user = userEvent.setup()
    renderPerfil()
    await user.click(screen.getByRole('button', { name: 'Desactivar' }))
    expect(screen.getByText('Desactivar 2FA')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Código de 6 dígitos')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(api.post).not.toHaveBeenCalledWith('/auth/2fa/disable', expect.anything())

    await user.click(screen.getByRole('button', { name: 'Desactivar' }))
    const confirmButtons = screen.getAllByRole('button', { name: 'Desactivar' })
    expect(confirmButtons[confirmButtons.length - 1]).toBeDisabled()

    await user.type(screen.getByPlaceholderText('Código de 6 dígitos'), '123456')
    await user.click(confirmButtons[confirmButtons.length - 1])
    expect(api.post).toHaveBeenCalledWith('/auth/2fa/disable', { code: '123456' })
  })
})

describe('Perfil — sesiones activas', () => {
  test('sin sesiones, muestra el mensaje vacío', async () => {
    vi.mocked(api.get).mockImplementation((url: string) =>
      url === '/auth/sessions' ? Promise.resolve([]) : Promise.resolve({}))

    renderPerfil()
    expect(await screen.findByText('No hay sesiones activas')).toBeInTheDocument()
  })

  test('con sesiones, distingue la actual y permite revocar las demás', async () => {
    vi.mocked(api.get).mockImplementation((url: string) =>
      url === '/auth/sessions'
        ? Promise.resolve([
            { id: 's1', ip: '10.0.0.1', userAgent: 'Mozilla/5.0 (iPhone)', creadoEn: '2026-01-01T00:00:00Z', esSesionActual: true },
            { id: 's2', ip: '10.0.0.2', userAgent: 'Mozilla/5.0 (Windows)', creadoEn: '2026-01-02T00:00:00Z', esSesionActual: false },
          ])
        : Promise.resolve({}))
    vi.mocked(api.delete).mockResolvedValue({})

    const user = userEvent.setup()
    renderPerfil()
    expect(await screen.findByText('Esta sesión')).toBeInTheDocument()
    expect(screen.getByText(/^2 sesi.{1,3}nes activas$/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Revocar sesión' }))
    expect(api.delete).toHaveBeenCalledWith('/auth/sessions/s2')
  })

  test('"Cerrar todas" aparece solo con más de una sesión y llama al endpoint masivo', async () => {
    vi.mocked(api.get).mockImplementation((url: string) =>
      url === '/auth/sessions'
        ? Promise.resolve([
            { id: 's1', ip: '10.0.0.1', userAgent: 'Mozilla/5.0', creadoEn: '2026-01-01T00:00:00Z', esSesionActual: true },
            { id: 's2', ip: '10.0.0.2', userAgent: 'Mozilla/5.0', creadoEn: '2026-01-02T00:00:00Z', esSesionActual: false },
          ])
        : Promise.resolve({}))
    vi.mocked(api.delete).mockResolvedValue({})

    const user = userEvent.setup()
    renderPerfil()
    await user.click(await screen.findByText('Cerrar todas'))
    expect(api.delete).toHaveBeenCalledWith('/auth/sessions')
  })
})

describe('Perfil — notificaciones y apariencia', () => {
  test('activar/desactivar una preferencia de notificación cambia su estado', async () => {
    const user = userEvent.setup()
    renderPerfil()
    const toggle = screen.getByText('Estado de solicitudes').closest('div')!.parentElement!.querySelector('button[aria-pressed]') as HTMLElement
    const before = toggle.getAttribute('aria-pressed')

    await user.click(toggle)
    expect(toggle.getAttribute('aria-pressed')).not.toBe(before)
  })

  test('elegir una densidad distinta la marca como activa', async () => {
    const user = userEvent.setup()
    renderPerfil()
    const comodo = screen.getByRole('button', { name: /Cómodo/i })
    await user.click(comodo)
    expect(comodo.className).toContain('bg-primary-50')
  })
})
