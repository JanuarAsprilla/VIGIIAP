import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import GestionConexionesGeoserver from '@/pages/admin/GestionConexionesGeoserver'

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

const authMock: { isSuperAdmin: boolean } = { isSuperAdmin: true }
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authMock }))

vi.mock('@/hooks/useConexionesGeoserver', () => ({
  useConexionesGeoserverList: vi.fn(),
  useCreateConexionGeoserver: vi.fn(),
  useUpdateConexionGeoserver: vi.fn(),
  useDeleteConexionGeoserver: vi.fn(),
}))
import {
  useConexionesGeoserverList, useCreateConexionGeoserver, useUpdateConexionGeoserver, useDeleteConexionGeoserver,
} from '@/hooks/useConexionesGeoserver'

function makeConexion(overrides: Record<string, unknown> = {}) {
  return {
    id: 'conexion-1', nombre: 'GeoServer institucional', url: 'https://geoserver.iiap.org.co/geoserver',
    tipo: 'propio', usuario_lectura: 'lector', timeout_ms: 20000, activo: true,
    creado_en: '2026-01-01', actualizado_en: '2026-01-01', ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  authMock.isSuperAdmin = true
  vi.mocked(useConexionesGeoserverList).mockReturnValue({
    data: [makeConexion()], isLoading: false,
  } as unknown as ReturnType<typeof useConexionesGeoserverList>)
  vi.mocked(useCreateConexionGeoserver).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useCreateConexionGeoserver>)
  vi.mocked(useUpdateConexionGeoserver).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useUpdateConexionGeoserver>)
  vi.mocked(useDeleteConexionGeoserver).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useDeleteConexionGeoserver>)
})

describe('GestionConexionesGeoserver — permisos', () => {
  test('un admin_sig (no super admin) no ve el botón de nueva conexión ni acciones de editar/eliminar', () => {
    authMock.isSuperAdmin = false
    render(<GestionConexionesGeoserver />)

    expect(screen.queryByRole('button', { name: /Nueva conexión/i })).not.toBeInTheDocument()
    expect(screen.queryByTitle('Editar')).not.toBeInTheDocument()
    expect(screen.getByText(/Solo puedes consultar las conexiones/i)).toBeInTheDocument()
  })

  test('un super admin sí ve el botón de nueva conexión', () => {
    render(<GestionConexionesGeoserver />)
    expect(screen.getByRole('button', { name: /Nueva conexión/i })).toBeInTheDocument()
  })
})

describe('GestionConexionesGeoserver — crear conexión', () => {
  test('valida campos obligatorios antes de llamar a la mutación', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useCreateConexionGeoserver).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCreateConexionGeoserver>)

    const user = userEvent.setup()
    render(<GestionConexionesGeoserver />)
    await user.click(screen.getByRole('button', { name: /Nueva conexión/i }))
    await user.click(screen.getByRole('button', { name: /Crear conexión/i }))

    expect(await screen.findByText('El nombre es obligatorio')).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  test('con datos válidos llama a la mutación con la contraseña incluida', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(makeConexion())
    vi.mocked(useCreateConexionGeoserver).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCreateConexionGeoserver>)

    const user = userEvent.setup()
    render(<GestionConexionesGeoserver />)
    await user.click(screen.getByRole('button', { name: /Nueva conexión/i }))
    await user.type(screen.getByLabelText(/^Nombre/i), 'GeoServer IIAP')
    await user.type(screen.getByLabelText(/URL base/i), 'https://geoserver.iiap.org.co/geoserver')
    await user.type(screen.getByLabelText(/Usuario de lectura/i), 'lector')
    await user.type(screen.getByLabelText(/^Contraseña/i), 'super-secreta')
    await user.click(screen.getByRole('button', { name: /Crear conexión/i }))

    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
      nombre: 'GeoServer IIAP', usuarioLectura: 'lector', password: 'super-secreta',
    }))
  })
})

describe('GestionConexionesGeoserver — conexión externa (WMS/GeoServer de terceros)', () => {
  test('tipo "Externo" no exige usuario ni contraseña para crear', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(makeConexion({ tipo: 'externo' }))
    vi.mocked(useCreateConexionGeoserver).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCreateConexionGeoserver>)

    const user = userEvent.setup()
    render(<GestionConexionesGeoserver />)
    await user.click(screen.getByRole('button', { name: /Nueva conexión/i }))
    await user.type(screen.getByLabelText(/^Nombre/i), 'WMS Externo')
    await user.type(screen.getByLabelText(/URL base/i), 'https://wms.otrainstitucion.gov.co')
    await user.click(screen.getByRole('button', { name: /^Externo/i }))
    await user.click(screen.getByRole('button', { name: /Crear conexión/i }))

    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'externo' }))
    const [payload] = mutateAsync.mock.calls[0]
    expect(payload.usuarioLectura).toBeUndefined()
    expect(payload.password).toBeUndefined()
  })

  test('cambiar a "Externo" después de haber marcado error de usuario obligatorio permite enviar sin él', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(makeConexion({ tipo: 'externo' }))
    vi.mocked(useCreateConexionGeoserver).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCreateConexionGeoserver>)

    const user = userEvent.setup()
    render(<GestionConexionesGeoserver />)
    await user.click(screen.getByRole('button', { name: /Nueva conexión/i }))
    await user.type(screen.getByLabelText(/^Nombre/i), 'WMS Externo')
    await user.type(screen.getByLabelText(/URL base/i), 'https://wms.otrainstitucion.gov.co')
    // propio por defecto: enviar sin credenciales primero muestra el error
    await user.click(screen.getByRole('button', { name: /Crear conexión/i }))
    expect(await screen.findByText('El usuario de lectura es obligatorio para una conexión propia')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^Externo/i }))
    await user.click(screen.getByRole('button', { name: /Crear conexión/i }))

    expect(mutateAsync).toHaveBeenCalled()
  })

  test('la tarjeta de una conexión externa sin credenciales muestra el aviso correspondiente', () => {
    vi.mocked(useConexionesGeoserverList).mockReturnValue({
      data: [makeConexion({ tipo: 'externo', usuario_lectura: null })], isLoading: false,
    } as unknown as ReturnType<typeof useConexionesGeoserverList>)

    render(<GestionConexionesGeoserver />)

    expect(screen.getByText('Externo')).toBeInTheDocument()
    expect(screen.getByText('Sin credenciales (conexión externa)')).toBeInTheDocument()
  })

  test('la tarjeta de una conexión propia muestra el badge "Propio"', () => {
    render(<GestionConexionesGeoserver />)
    expect(screen.getByText('Propio')).toBeInTheDocument()
  })
})

describe('GestionConexionesGeoserver — editar conexión', () => {
  test('la contraseña vacía al editar no rompe la validación (no es obligatoria)', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(makeConexion())
    vi.mocked(useUpdateConexionGeoserver).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useUpdateConexionGeoserver>)

    const user = userEvent.setup()
    render(<GestionConexionesGeoserver />)
    await user.click(screen.getByTitle('Editar'))
    await user.click(screen.getByRole('button', { name: /Guardar cambios/i }))

    expect(mutateAsync).toHaveBeenCalledWith({
      id: 'conexion-1',
      data: expect.not.objectContaining({ password: expect.anything() }),
    })
  })
})

describe('GestionConexionesGeoserver — eliminar conexión', () => {
  test('confirmar elimina la conexión seleccionada', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useDeleteConexionGeoserver).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useDeleteConexionGeoserver>)

    const user = userEvent.setup()
    render(<GestionConexionesGeoserver />)
    await user.click(screen.getByTitle('Eliminar'))
    await user.click(screen.getByRole('button', { name: /Sí, eliminar/i }))

    expect(mutateAsync).toHaveBeenCalledWith('conexion-1')
  })

  test('cancelar en el modal de confirmación no llama a la mutación', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useDeleteConexionGeoserver).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useDeleteConexionGeoserver>)

    const user = userEvent.setup()
    render(<GestionConexionesGeoserver />)
    await user.click(screen.getByTitle('Eliminar'))
    await user.click(screen.getByRole('button', { name: /Cancelar/i }))

    expect(mutateAsync).not.toHaveBeenCalled()
  })
})

describe('GestionConexionesGeoserver — editar conexión, campos adicionales', () => {
  test('el botón X cierra el formulario', async () => {
    const user = userEvent.setup()
    render(<GestionConexionesGeoserver />)
    await user.click(screen.getByRole('button', { name: /Nueva conexión/i }))
    expect(screen.getByLabelText(/^Nombre/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '' }))
    expect(screen.queryByLabelText(/^Nombre/i)).not.toBeInTheDocument()
  })

  test('cambiar el timeout y desactivar la conexión se incluyen en la actualización', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useUpdateConexionGeoserver).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useUpdateConexionGeoserver>)

    const user = userEvent.setup()
    render(<GestionConexionesGeoserver />)
    await user.click(screen.getByTitle('Editar'))

    const timeoutInput = screen.getByLabelText(/Timeout/i)
    await user.clear(timeoutInput)
    await user.type(timeoutInput, '30000')
    await user.click(screen.getByLabelText(/Conexión activa/i))
    await user.click(screen.getByRole('button', { name: /Guardar cambios/i }))

    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
      id: 'conexion-1',
      data: expect.objectContaining({ timeoutMs: 30000, activo: false }),
    }))
  })
})
