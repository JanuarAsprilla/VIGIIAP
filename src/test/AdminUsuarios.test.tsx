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

describe('Usuarios (admin) — invitar usuario', () => {
  test('un correo con formato inválido muestra el mensaje de validación en vez de bloquearse en silencio', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useCreateUsuario).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCreateUsuario>)

    const user = userEvent.setup()
    render(<Usuarios />)
    await user.click(screen.getByRole('button', { name: /Crear Usuario/i }))
    await user.type(screen.getByPlaceholderText('Ej. María García'), 'Ana Restrepo')
    await user.type(screen.getByPlaceholderText('usuario@iiap.org.co'), 'correo-invalido')
    const crearButtons = screen.getAllByRole('button', { name: /Crear Usuario/i })
    await user.click(crearButtons[crearButtons.length - 1])

    expect(screen.getByText('Nombre y correo válido son requeridos')).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  test('con datos válidos, invita al usuario con los datos del formulario', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useCreateUsuario).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCreateUsuario>)

    const user = userEvent.setup()
    render(<Usuarios />)
    await user.click(screen.getByRole('button', { name: /Crear Usuario/i }))
    await user.type(screen.getByPlaceholderText('Ej. María García'), 'Ana Restrepo')
    await user.type(screen.getByPlaceholderText('usuario@iiap.org.co'), 'ana@iiap.org.co')
    const crearButtons = screen.getAllByRole('button', { name: /Crear Usuario/i })
    await user.click(crearButtons[crearButtons.length - 1])

    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Ana Restrepo', email: 'ana@iiap.org.co' }))
  })

  test('tras crear el usuario, muestra la pantalla de confirmación con el correo y rol', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useCreateUsuario).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCreateUsuario>)

    const user = userEvent.setup()
    render(<Usuarios />)
    await user.click(screen.getByRole('button', { name: /Crear Usuario/i }))
    await user.type(screen.getByPlaceholderText('Ej. María García'), 'Ana Restrepo')
    await user.type(screen.getByPlaceholderText('usuario@iiap.org.co'), 'ana@iiap.org.co')
    const crearButtons = screen.getAllByRole('button', { name: /Crear Usuario/i })
    await user.click(crearButtons[crearButtons.length - 1])

    expect(await screen.findByText('¡Usuario creado!')).toBeInTheDocument()
    expect(screen.getByText('ana@iiap.org.co')).toBeInTheDocument()
  })
})

describe('Usuarios (admin) — activar/desactivar', () => {
  test('desactivar un usuario activo llama a la mutación con el estado invertido', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useToggleActivo).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useToggleActivo>)
    vi.mocked(useUsuariosList).mockReturnValue({
      data: { data: [makeUser({ id: 'u2', nombre: 'Ana Restrepo', activo: true, estado: 'Activo' })] },
    } as unknown as ReturnType<typeof useUsuariosList>)

    const user = userEvent.setup()
    render(<Usuarios />)
    await user.click(screen.getByTitle('Clic para desactivar'))

    expect(mutateAsync).toHaveBeenCalledWith({ id: 'u2', activo: false })
    expect(await screen.findByText('Ana Restrepo desactivado')).toBeInTheDocument()
  })

  test('si falla el cambio de estado, muestra un toast de error', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('fail'))
    vi.mocked(useToggleActivo).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useToggleActivo>)
    vi.mocked(useUsuariosList).mockReturnValue({
      data: { data: [makeUser({ id: 'u2', nombre: 'Ana Restrepo', activo: true, estado: 'Activo' })] },
    } as unknown as ReturnType<typeof useUsuariosList>)

    const user = userEvent.setup()
    render(<Usuarios />)
    await user.click(screen.getByTitle('Clic para desactivar'))

    expect(await screen.findByText('Error al cambiar el estado')).toBeInTheDocument()
  })

  test('un usuario protegido (no manejable) muestra su estado sin botón de acción', () => {
    vi.mocked(useUsuariosList).mockReturnValue({
      data: { data: [makeUser({ id: 'me', nombre: 'Yo Mismo', activo: true, estado: 'Activo' })] },
    } as unknown as ReturnType<typeof useUsuariosList>)

    render(<Usuarios />)
    expect(screen.queryByTitle('Clic para desactivar')).not.toBeInTheDocument()
    expect(screen.getByText('Protegido')).toBeInTheDocument()
  })
})

describe('Usuarios (admin) — eliminar usuario', () => {
  test('confirmar la eliminación llama a la mutación y notifica', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useDeleteUsuario).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useDeleteUsuario>)
    vi.mocked(useUsuariosList).mockReturnValue({
      data: { data: [makeUser({ id: 'u2', nombre: 'Ana Restrepo' })] },
    } as unknown as ReturnType<typeof useUsuariosList>)

    const user = userEvent.setup()
    render(<Usuarios />)
    await user.click(screen.getByRole('button', { name: /Eliminar usuario Ana Restrepo/i }))
    await user.click(screen.getByRole('button', { name: /^Eliminar$/i }))

    expect(mutateAsync).toHaveBeenCalledWith('u2')
    expect(await screen.findByText('Ana Restrepo eliminado correctamente')).toBeInTheDocument()
  })

  test('cancelar la eliminación no llama a la mutación', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useDeleteUsuario).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useDeleteUsuario>)
    vi.mocked(useUsuariosList).mockReturnValue({
      data: { data: [makeUser({ id: 'u2', nombre: 'Ana Restrepo' })] },
    } as unknown as ReturnType<typeof useUsuariosList>)

    const user = userEvent.setup()
    render(<Usuarios />)
    await user.click(screen.getByRole('button', { name: /Eliminar usuario Ana Restrepo/i }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(mutateAsync).not.toHaveBeenCalled()
  })

  test('si falla la eliminación, muestra un toast de error', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('fail'))
    vi.mocked(useDeleteUsuario).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useDeleteUsuario>)
    vi.mocked(useUsuariosList).mockReturnValue({
      data: { data: [makeUser({ id: 'u2', nombre: 'Ana Restrepo' })] },
    } as unknown as ReturnType<typeof useUsuariosList>)

    const user = userEvent.setup()
    render(<Usuarios />)
    await user.click(screen.getByRole('button', { name: /Eliminar usuario Ana Restrepo/i }))
    await user.click(screen.getByRole('button', { name: /^Eliminar$/i }))

    expect(await screen.findByText('Error al eliminar el usuario')).toBeInTheDocument()
  })
})

describe('Usuarios (admin) — cambio de rol: errores y cierre', () => {
  test('si falla la mutación de rol, muestra un toast de error y no cierra el modal', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('fail'))
    vi.mocked(useUpdateUsuarioRol).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useUpdateUsuarioRol>)
    vi.mocked(useUsuariosList).mockReturnValue({
      data: { data: [makeUser({ id: 'u2', nombre: 'Ana Restrepo' })] },
    } as unknown as ReturnType<typeof useUsuariosList>)

    const user = userEvent.setup()
    render(<Usuarios />)
    await user.click(screen.getByRole('button', { name: /Editar rol de Ana Restrepo/i }))
    await user.click(screen.getByRole('button', { name: /Guardar/i }))

    expect(await screen.findByText('Error al actualizar el rol')).toBeInTheDocument()
  })

  test('cancelar el modal de rol no llama a la mutación', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useUpdateUsuarioRol).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useUpdateUsuarioRol>)
    vi.mocked(useUsuariosList).mockReturnValue({
      data: { data: [makeUser({ id: 'u2', nombre: 'Ana Restrepo' })] },
    } as unknown as ReturnType<typeof useUsuariosList>)

    const user = userEvent.setup()
    render(<Usuarios />)
    await user.click(screen.getByRole('button', { name: /Editar rol de Ana Restrepo/i }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(mutateAsync).not.toHaveBeenCalled()
  })
})

describe('Usuarios (admin) — panel de detalle', () => {
  test('abrir el detalle muestra el correo, rol y estado del usuario', async () => {
    vi.mocked(useUsuariosList).mockReturnValue({
      data: { data: [makeUser({ id: 'u2', nombre: 'Ana Restrepo', correo: 'ana@iiap.gov.co' })] },
    } as unknown as ReturnType<typeof useUsuariosList>)

    const user = userEvent.setup()
    render(<Usuarios />)
    await user.click(screen.getByText('Ana Restrepo'))

    expect(screen.getAllByText('ana@iiap.gov.co').length).toBeGreaterThan(0)
  })

  test('un investigador ve sus permisos y que no tiene acceso al panel admin', async () => {
    vi.mocked(useUsuariosList).mockReturnValue({
      data: { data: [makeUser({ id: 'u2', nombre: 'Ana Restrepo', rol: 'Investigador' })] },
    } as unknown as ReturnType<typeof useUsuariosList>)

    const user = userEvent.setup()
    render(<Usuarios />)
    await user.click(screen.getByText('Ana Restrepo'))

    expect(screen.getByText('Geovisor')).toBeInTheDocument()
    expect(screen.getByText('Panel de Administración')).toBeInTheDocument()
  })

  test('un usuario Público ve la nota de cuenta no verificada', async () => {
    vi.mocked(useUsuariosList).mockReturnValue({
      data: { data: [makeUser({ id: 'u2', nombre: 'Visitante X', rol: 'Público' })] },
    } as unknown as ReturnType<typeof useUsuariosList>)

    const user = userEvent.setup()
    render(<Usuarios />)
    await user.click(screen.getByText('Visitante X'))

    expect(screen.getByText(/Cuenta no verificada/)).toBeInTheDocument()
  })

  test('cerrar el detalle con la X lo oculta', async () => {
    vi.mocked(useUsuariosList).mockReturnValue({
      data: { data: [makeUser({ id: 'u2', nombre: 'Ana Restrepo', correo: 'ana@iiap.gov.co' })] },
    } as unknown as ReturnType<typeof useUsuariosList>)

    const user = userEvent.setup()
    render(<Usuarios />)
    await user.click(screen.getByText('Ana Restrepo'))
    expect(screen.getAllByText('ana@iiap.gov.co')).toHaveLength(2)

    const closeButtons = screen.getAllByRole('button').filter((b) => b.querySelector('.lucide-x'))
    await user.click(closeButtons[0])
    expect(screen.getAllByText('ana@iiap.gov.co')).toHaveLength(1)
  })
})

describe('Usuarios (admin) — listado y filtros', () => {
  test('sin usuarios, muestra "Sin resultados"', () => {
    vi.mocked(useUsuariosList).mockReturnValue({
      data: { data: [] },
    } as unknown as ReturnType<typeof useUsuariosList>)

    render(<Usuarios />)
    expect(screen.getByText('Sin resultados')).toBeInTheDocument()
  })

  test('un usuario no verificado por correo muestra la etiqueta "Pendiente"', () => {
    vi.mocked(useUsuariosList).mockReturnValue({
      data: { data: [makeUser({ id: 'u2', nombre: 'Ana Restrepo', emailVerified: false })] },
    } as unknown as ReturnType<typeof useUsuariosList>)

    render(<Usuarios />)
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
  })

  test('el buscador actualiza el input controlado', async () => {
    const user = userEvent.setup()
    render(<Usuarios />)
    const input = screen.getByPlaceholderText('Buscar por nombre o correo...')
    await user.type(input, 'ana')
    expect(input).toHaveValue('ana')
  })

  test('escribir en el buscador envía "q" al hook de listado', async () => {
    const user = userEvent.setup()
    render(<Usuarios />)
    await user.type(screen.getByPlaceholderText('Buscar por nombre o correo...'), 'ana')
    expect(useUsuariosList).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'ana' }))
  })

  test('filtrar por rol envía el rol mapeado al backend', async () => {
    const user = userEvent.setup()
    render(<Usuarios />)
    await user.selectOptions(screen.getByDisplayValue('Todos los roles'), 'Técnico SIG')
    expect(useUsuariosList).toHaveBeenLastCalledWith(expect.objectContaining({ rol: 'tecnico' }))
  })

  test('filtrar por estado Activo envía activo="true"', async () => {
    const user = userEvent.setup()
    render(<Usuarios />)
    await user.selectOptions(screen.getByDisplayValue('Todos los estados'), 'Activo')
    expect(useUsuariosList).toHaveBeenLastCalledWith(expect.objectContaining({ activo: 'true' }))
  })

  test('filtrar por estado Inactivo envía activo="false"', async () => {
    const user = userEvent.setup()
    render(<Usuarios />)
    await user.selectOptions(screen.getByDisplayValue('Todos los estados'), 'Inactivo')
    expect(useUsuariosList).toHaveBeenLastCalledWith(expect.objectContaining({ activo: 'false' }))
  })
})

describe('Usuarios (admin) — panel de detalle: ramas adicionales', () => {
  test('un usuario inactivo muestra el badge rojo "Inactivo" en el detalle', async () => {
    vi.mocked(useUsuariosList).mockReturnValue({
      data: { data: [makeUser({ id: 'u2', nombre: 'Ana Restrepo', activo: false, estado: 'Inactivo' })] },
    } as unknown as ReturnType<typeof useUsuariosList>)

    const user = userEvent.setup()
    render(<Usuarios />)
    await user.click(screen.getByText('Ana Restrepo'))

    const badges = screen.getAllByText('Inactivo')
    expect(badges.some((b) => b.className.includes('bg-red/10'))).toBe(true)
  })

  test('con motivo de acceso, lo muestra en el detalle', async () => {
    vi.mocked(useUsuariosList).mockReturnValue({
      data: { data: [makeUser({ id: 'u2', nombre: 'Ana Restrepo', motivoAcceso: 'Investigación de biodiversidad' })] },
    } as unknown as ReturnType<typeof useUsuariosList>)

    const user = userEvent.setup()
    render(<Usuarios />)
    await user.click(screen.getByText('Ana Restrepo'))

    expect(screen.getByText('Investigación de biodiversidad')).toBeInTheDocument()
  })

  test('sin institución, no muestra la sección de institución', async () => {
    vi.mocked(useUsuariosList).mockReturnValue({
      data: { data: [makeUser({ id: 'u2', nombre: 'Ana Restrepo', institucion: '' })] },
    } as unknown as ReturnType<typeof useUsuariosList>)

    const user = userEvent.setup()
    render(<Usuarios />)
    await user.click(screen.getByText('Ana Restrepo'))

    expect(screen.queryByText('Institución')).not.toBeInTheDocument()
  })
})

describe('Usuarios (admin) — invitar usuario: ramas adicionales', () => {
  test('el clic en el fondo cierra el modal de invitación', async () => {
    const user = userEvent.setup()
    render(<Usuarios />)
    await user.click(screen.getByRole('button', { name: /Crear Usuario/i }))
    expect(screen.getByPlaceholderText('Ej. María García')).toBeInTheDocument()

    const backdrop = screen.getByText('El usuario recibirá un correo con sus credenciales de acceso.').closest('form')!.parentElement!.parentElement!
    await user.click(backdrop)
    expect(screen.queryByPlaceholderText('Ej. María García')).not.toBeInTheDocument()
  })

  test('si la creación falla, muestra el mensaje de error de la API', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('El correo ya está registrado'))
    vi.mocked(useCreateUsuario).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCreateUsuario>)

    const user = userEvent.setup()
    render(<Usuarios />)
    await user.click(screen.getByRole('button', { name: /Crear Usuario/i }))
    await user.type(screen.getByPlaceholderText('Ej. María García'), 'Ana Restrepo')
    await user.type(screen.getByPlaceholderText('usuario@iiap.org.co'), 'ana@iiap.org.co')
    const crearButtons = screen.getAllByRole('button', { name: /Crear Usuario/i })
    await user.click(crearButtons[crearButtons.length - 1])

    expect(await screen.findByText('El correo ya está registrado')).toBeInTheDocument()
  })

  test('mientras se crea el usuario, el botón queda deshabilitado y muestra "Creando..."', async () => {
    vi.mocked(useCreateUsuario).mockReturnValue({ mutateAsync: vi.fn(), isPending: true } as unknown as ReturnType<typeof useCreateUsuario>)

    const user = userEvent.setup()
    render(<Usuarios />)
    await user.click(screen.getByRole('button', { name: /Crear Usuario/i }))

    expect(screen.getByRole('button', { name: /Creando.../i })).toBeDisabled()
  })
})

describe('Usuarios (admin) — activar/desactivar: ramas adicionales', () => {
  test('activar un usuario inactivo llama a la mutación con activo=true', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useToggleActivo).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useToggleActivo>)
    vi.mocked(useUsuariosList).mockReturnValue({
      data: { data: [makeUser({ id: 'u2', nombre: 'Ana Restrepo', activo: false, estado: 'Inactivo' })] },
    } as unknown as ReturnType<typeof useUsuariosList>)

    const user = userEvent.setup()
    render(<Usuarios />)
    await user.click(screen.getByTitle('Clic para activar'))

    expect(mutateAsync).toHaveBeenCalledWith({ id: 'u2', activo: true })
    expect(await screen.findByText('Ana Restrepo activado')).toBeInTheDocument()
  })

  test('mientras cambia el estado, el botón de estado se deshabilita', () => {
    vi.mocked(useToggleActivo).mockReturnValue({ mutateAsync: vi.fn(), isPending: true } as unknown as ReturnType<typeof useToggleActivo>)
    vi.mocked(useUsuariosList).mockReturnValue({
      data: { data: [makeUser({ id: 'u2', nombre: 'Ana Restrepo', activo: true, estado: 'Activo' })] },
    } as unknown as ReturnType<typeof useUsuariosList>)

    render(<Usuarios />)
    expect(screen.getByTitle('Clic para desactivar')).toBeDisabled()
  })

  test('un usuario protegido e inactivo muestra el badge rojo sin botón de acción', () => {
    vi.mocked(useUsuariosList).mockReturnValue({
      data: { data: [makeUser({ id: 'me', nombre: 'Yo Mismo', activo: false, estado: 'Inactivo' })] },
    } as unknown as ReturnType<typeof useUsuariosList>)

    render(<Usuarios />)
    const badges = screen.getAllByText('Inactivo').filter((b) => b.tagName === 'SPAN')
    expect(badges.some((b) => b.className.includes('bg-red/10'))).toBe(true)
    expect(screen.queryByTitle('Clic para activar')).not.toBeInTheDocument()
  })
})

describe('Usuarios (admin) — eliminar usuario: ramas adicionales', () => {
  test('mientras se elimina, el botón de esa fila se deshabilita', () => {
    vi.mocked(useDeleteUsuario).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useDeleteUsuario>)
    vi.mocked(useUsuariosList).mockReturnValue({
      data: { data: [makeUser({ id: 'u2', nombre: 'Ana Restrepo' })] },
    } as unknown as ReturnType<typeof useUsuariosList>)

    render(<Usuarios />)
    expect(screen.getByRole('button', { name: /Eliminar usuario Ana Restrepo/i })).not.toBeDisabled()
  })

  test('mientras confirma la eliminación, el diálogo muestra "Eliminando..." y deshabilita los botones', async () => {
    vi.mocked(useDeleteUsuario).mockReturnValue({ mutateAsync: vi.fn(), isPending: true } as unknown as ReturnType<typeof useDeleteUsuario>)
    vi.mocked(useUsuariosList).mockReturnValue({
      data: { data: [makeUser({ id: 'u2', nombre: 'Ana Restrepo' })] },
    } as unknown as ReturnType<typeof useUsuariosList>)

    const user = userEvent.setup()
    render(<Usuarios />)
    await user.click(screen.getByRole('button', { name: /Eliminar usuario Ana Restrepo/i }))

    expect(screen.getByText('Eliminando...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  })
})

describe('Usuarios (admin) — cambio de rol: ramas adicionales', () => {
  test('el clic en el fondo del modal de rol lo cierra', async () => {
    vi.mocked(useUsuariosList).mockReturnValue({
      data: { data: [makeUser({ id: 'u2', nombre: 'Ana Restrepo' })] },
    } as unknown as ReturnType<typeof useUsuariosList>)

    const user = userEvent.setup()
    render(<Usuarios />)
    await user.click(screen.getByRole('button', { name: /Editar rol de Ana Restrepo/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(screen.getByRole('dialog'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('mientras se guarda el rol, el botón muestra "Guardando…" y se deshabilita', async () => {
    vi.mocked(useUpdateUsuarioRol).mockReturnValue({ mutateAsync: vi.fn(), isPending: true } as unknown as ReturnType<typeof useUpdateUsuarioRol>)
    vi.mocked(useUsuariosList).mockReturnValue({
      data: { data: [makeUser({ id: 'u2', nombre: 'Ana Restrepo' })] },
    } as unknown as ReturnType<typeof useUsuariosList>)

    const user = userEvent.setup()
    render(<Usuarios />)
    await user.click(screen.getByRole('button', { name: /Editar rol de Ana Restrepo/i }))

    expect(screen.getByRole('button', { name: /Guardando…/i })).toBeDisabled()
  })
})
