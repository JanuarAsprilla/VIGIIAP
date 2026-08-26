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

vi.mock('@/hooks/useUsuarios', () => ({
  useUpdatePerfil: vi.fn(),
  useUpdatePassword: vi.fn(),
}))
import { useUpdatePerfil, useUpdatePassword } from '@/hooks/useUsuarios'

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
  vi.mocked(useUpdatePerfil).mockReturnValue({
    mutateAsync: vi.fn(), isPending: false,
  } as unknown as ReturnType<typeof useUpdatePerfil>)
  vi.mocked(useUpdatePassword).mockReturnValue({
    mutateAsync: vi.fn(), isPending: false,
  } as unknown as ReturnType<typeof useUpdatePassword>)
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
