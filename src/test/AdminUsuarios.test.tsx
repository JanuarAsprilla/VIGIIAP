import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import Usuarios from '@/pages/admin/Usuarios'
import type { UsuarioData } from '@/hooks/useUsuarios'

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

vi.mock('@/components/ui/Card3D', () => ({
  default: ({ children, className }: { children: ReactNode; className?: string }) =>
    <div className={className}>{children}</div>,
}))

vi.mock('@/hooks/useUsuarios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useUsuarios')>()
  return {
    ...actual,
    useUsuariosList: vi.fn(),
    useCreateUsuario: vi.fn(),
    useUpdateUsuarioRol: vi.fn(),
    useToggleActivo: vi.fn(),
    useDeleteUsuario: vi.fn(),
  }
})
import {
  useUsuariosList, useCreateUsuario, useUpdateUsuarioRol, useToggleActivo, useDeleteUsuario,
} from '@/hooks/useUsuarios'

const authMock = {
  user: { id: 'me', role: 'Administrador SIG' },
  isSuperAdmin: false,
}
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authMock }))

function makeUser(overrides: Partial<UsuarioData> = {}): UsuarioData {
  return {
    id: 'u1', nombre: 'Ana Restrepo', correo: 'ana@iiap.gov.co',
    rol: 'Investigador', rolBackend: 'investigador', estado: 'Activo', activo: true,
    emailVerified: true, motivoAcceso: '', initials: 'AR', institucion: 'IIAP',
    ...overrides,
  } as UsuarioData
}

beforeEach(() => {
  vi.clearAllMocks()
  authMock.user = { id: 'me', role: 'Administrador SIG' }
  authMock.isSuperAdmin = false
  vi.mocked(useUsuariosList).mockReturnValue({
    data: { data: [], meta: { total: 0 } },
  } as unknown as ReturnType<typeof useUsuariosList>)
  vi.mocked(useCreateUsuario).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useCreateUsuario>)
  vi.mocked(useUpdateUsuarioRol).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useUpdateUsuarioRol>)
  vi.mocked(useToggleActivo).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useToggleActivo>)
  vi.mocked(useDeleteUsuario).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useDeleteUsuario>)
})

describe('Usuarios (admin) — canManageRow', () => {
  test('un admin_sig no puede gestionar a otro admin_sig', () => {
    vi.mocked(useUsuariosList).mockReturnValue({
      data: { data: [makeUser({ id: 'u2', nombre: 'Otro Admin', rolBackend: 'admin_sig', rol: 'Administrador SIG' })] },
    } as unknown as ReturnType<typeof useUsuariosList>)

    render(<Usuarios />)
    expect(screen.queryByRole('button', { name: /Editar rol de Otro Admin/i })).not.toBeInTheDocument()
  })

  test('un admin_sig sí puede gestionar a un investigador', () => {
    vi.mocked(useUsuariosList).mockReturnValue({
      data: { data: [makeUser({ id: 'u2', nombre: 'Ana Restrepo' })] },
    } as unknown as ReturnType<typeof useUsuariosList>)

    render(<Usuarios />)
    expect(screen.getByRole('button', { name: /Editar rol de Ana Restrepo/i })).toBeInTheDocument()
  })

  test('nadie puede gestionarse a sí mismo, ni siquiera el super_admin', () => {
    authMock.isSuperAdmin = true
    vi.mocked(useUsuariosList).mockReturnValue({
      data: { data: [makeUser({ id: 'me', nombre: 'Yo Mismo' })] },
    } as unknown as ReturnType<typeof useUsuariosList>)

    render(<Usuarios />)
    expect(screen.queryByRole('button', { name: /Editar rol de Yo Mismo/i })).not.toBeInTheDocument()
  })

  test('el super_admin sí puede gestionar a un admin_sig', () => {
    authMock.isSuperAdmin = true
    vi.mocked(useUsuariosList).mockReturnValue({
      data: { data: [makeUser({ id: 'u2', nombre: 'Otro Admin', rolBackend: 'admin_sig', rol: 'Administrador SIG' })] },
    } as unknown as ReturnType<typeof useUsuariosList>)

    render(<Usuarios />)
    expect(screen.getByRole('button', { name: /Editar rol de Otro Admin/i })).toBeInTheDocument()
  })
})

describe('Usuarios (admin) — cambio de rol', () => {
  test('un admin_sig no puede asignar el rol Administrador SIG', async () => {
    vi.mocked(useUsuariosList).mockReturnValue({
      data: { data: [makeUser({ id: 'u2', nombre: 'Ana Restrepo' })] },
    } as unknown as ReturnType<typeof useUsuariosList>)

    const user = userEvent.setup()
    render(<Usuarios />)
    await user.click(screen.getByRole('button', { name: /Editar rol de Ana Restrepo/i }))

    const options = Array.from(screen.getByLabelText('Rol').querySelectorAll('option')).map((o) => o.textContent)
    expect(options).not.toContain('Administrador SIG')
  })

  test('el super_admin sí puede asignar el rol Administrador SIG', async () => {
    authMock.isSuperAdmin = true
    vi.mocked(useUsuariosList).mockReturnValue({
      data: { data: [makeUser({ id: 'u2', nombre: 'Ana Restrepo' })] },
    } as unknown as ReturnType<typeof useUsuariosList>)

    const user = userEvent.setup()
    render(<Usuarios />)
    await user.click(screen.getByRole('button', { name: /Editar rol de Ana Restrepo/i }))

    const options = Array.from(screen.getByLabelText('Rol').querySelectorAll('option')).map((o) => o.textContent)
    expect(options).toContain('Administrador SIG')
  })

  test('guardar un cambio de rol llama a la mutación con el id y rol correctos', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useUpdateUsuarioRol).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useUpdateUsuarioRol>)
    vi.mocked(useUsuariosList).mockReturnValue({
      data: { data: [makeUser({ id: 'u2', nombre: 'Ana Restrepo', rol: 'Investigador' })] },
    } as unknown as ReturnType<typeof useUsuariosList>)

    const user = userEvent.setup()
    render(<Usuarios />)
    await user.click(screen.getByRole('button', { name: /Editar rol de Ana Restrepo/i }))
    await user.selectOptions(screen.getByLabelText('Rol'), 'Técnico SIG')
    await user.click(screen.getByRole('button', { name: /Guardar/i }))

    expect(mutateAsync).toHaveBeenCalledWith({ id: 'u2', rol: 'Técnico SIG' })
  })
})
