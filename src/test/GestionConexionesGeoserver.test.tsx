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
    usuario_lectura: 'lector', timeout_ms: 20000, activo: true,
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
})
