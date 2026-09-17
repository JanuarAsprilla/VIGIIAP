import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import GestionAdmins from '@/pages/admin/GestionAdmins'

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

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn((url: string) =>
      url.includes('super/stats')
        ? Promise.resolve({ total_usuarios: 10, admins: 2, activos: 8, pendientes_verificacion: 1 })
        : Promise.resolve({ data: [] }),
    ),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
  },
}))
import api from '@/lib/api'

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><GestionAdmins /></QueryClientProvider>)
}

beforeEach(() => { vi.clearAllMocks() })

describe('GestionAdmins — flujo de confirmación en dos pasos', () => {
  test('el primer envío muestra la confirmación en vez de crear el admin de una vez', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: /Nuevo Admin/i }))

    await user.type(screen.getByLabelText('Nombre completo'), 'María García')
    await user.type(screen.getByLabelText('Correo electrónico'), 'maria@iiap.gov.co')
    await user.type(screen.getByLabelText('Institución'), 'IIAP')
    await user.click(screen.getByRole('button', { name: /Revisar datos/i }))

    expect(await screen.findByText(/¿Confirmar\?/i)).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Nombre completo')).toBeDisabled()
  })

  test('confirmar sí llama a la API con los datos del formulario', async () => {
    vi.mocked(api.post).mockResolvedValue({})
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: /Nuevo Admin/i }))

    await user.type(screen.getByLabelText('Nombre completo'), 'María García')
    await user.type(screen.getByLabelText('Correo electrónico'), 'maria@iiap.gov.co')
    await user.type(screen.getByLabelText('Institución'), 'IIAP')
    await user.click(screen.getByRole('button', { name: /Revisar datos/i }))
    await user.click(screen.getByRole('button', { name: /Confirmar y crear/i }))

    expect(api.post).toHaveBeenCalledWith('/admin/super/crear-admin', {
      nombre: 'María García', email: 'maria@iiap.gov.co', institucion: 'IIAP',
    })
  })

  test('"Editar datos" regresa al formulario editable sin haber llamado a la API', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: /Nuevo Admin/i }))
    await user.type(screen.getByLabelText('Nombre completo'), 'María García')
    await user.type(screen.getByLabelText('Correo electrónico'), 'maria@iiap.gov.co')
    await user.type(screen.getByLabelText('Institución'), 'IIAP')
    await user.click(screen.getByRole('button', { name: /Revisar datos/i }))

    await user.click(screen.getByRole('button', { name: /Editar datos/i }))

    expect(screen.getByLabelText('Nombre completo')).not.toBeDisabled()
    expect(api.post).not.toHaveBeenCalled()
  })

  test('un error del servidor se muestra y el modal permanece abierto', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('El correo ya está en uso'))
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: /Nuevo Admin/i }))
    await user.type(screen.getByLabelText('Nombre completo'), 'María García')
    await user.type(screen.getByLabelText('Correo electrónico'), 'maria@iiap.gov.co')
    await user.type(screen.getByLabelText('Institución'), 'IIAP')
    await user.click(screen.getByRole('button', { name: /Revisar datos/i }))
    await user.click(screen.getByRole('button', { name: /Confirmar y crear/i }))

    expect(await screen.findByText('El correo ya está en uso')).toBeInTheDocument()
    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument()
  })
})

describe('GestionAdmins — estadísticas', () => {
  test('muestra las estadísticas del super admin', async () => {
    renderPage()
    expect(await screen.findByText('10')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })
})

describe('GestionAdmins — tabla de administradores', () => {
  test('lista los admin_sig existentes con institución y estado activo/inactivo', async () => {
    vi.mocked(api.get).mockImplementation((url: string) =>
      url.includes('super/stats')
        ? Promise.resolve({ total_usuarios: 10, admins: 2, activos: 8, pendientes_verificacion: 1 })
        : Promise.resolve({
            data: [
              { id: 'a1', nombre: 'Ana Restrepo', email: 'ana@iiap.gov.co', institucion: 'IIAP', activo: true },
              { id: 'a2', nombre: 'Carlos Mena', email: 'carlos@iiap.gov.co', institucion: null, activo: false },
            ],
          }),
    )

    renderPage()
    expect(await screen.findByText('Ana Restrepo')).toBeInTheDocument()
    expect(screen.getByText('Carlos Mena')).toBeInTheDocument()
    expect(screen.getByText('IIAP')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText('Activo')).toBeInTheDocument()
    expect(screen.getByText('Inactivo')).toBeInTheDocument()
  })
})

describe('GestionAdmins — permisos por módulo', () => {
  const admin = {
    id: 'a1', nombre: 'Ana Restrepo', email: 'ana@iiap.gov.co', institucion: 'IIAP', activo: true,
    permisos: [{ modulo: 'mapas', puede_ver: true, puede_editar: false }],
  }

  beforeEach(() => {
    vi.mocked(api.get).mockImplementation((url: string) =>
      url.includes('super/stats')
        ? Promise.resolve({ total_usuarios: 10, admins: 1, activos: 1, pendientes_verificacion: 0 })
        : Promise.resolve({ data: [admin] }),
    )
  })

  test('abrir "Editar módulos" muestra el catálogo con el estado actual de permisos', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: /Editar módulos de Ana Restrepo/i }))

    expect(screen.getByText('Módulos habilitados')).toBeInTheDocument()
    expect(screen.getByLabelText('Ver Mapas')).toBeChecked()
    expect(screen.getByLabelText('Editar Mapas')).not.toBeChecked()
    expect(screen.getByLabelText('Ver Usuarios')).not.toBeChecked()
  })

  test('marcar "Editar" en un módulo también marca "Ver" automáticamente', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: /Editar módulos de Ana Restrepo/i }))
    await user.click(screen.getByLabelText('Editar Usuarios'))

    expect(screen.getByLabelText('Ver Usuarios')).toBeChecked()
    expect(screen.getByLabelText('Editar Usuarios')).toBeChecked()
  })

  test('guardar permisos llama a PUT con el payload completo del catálogo', async () => {
    vi.mocked(api.put).mockResolvedValue({ data: [] })
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: /Editar módulos de Ana Restrepo/i }))
    await user.click(screen.getByRole('button', { name: /Guardar permisos/i }))

    expect(api.put).toHaveBeenCalledWith(
      '/admin/administradores/a1/permisos',
      { permisos: expect.arrayContaining([expect.objectContaining({ modulo: 'mapas', puede_ver: true, puede_editar: false })]) },
    )
  })
})

describe('GestionAdmins — activar/desactivar y eliminar', () => {
  const admin = { id: 'a1', nombre: 'Ana Restrepo', email: 'ana@iiap.gov.co', institucion: 'IIAP', activo: true }

  beforeEach(() => {
    vi.mocked(api.get).mockImplementation((url: string) =>
      url.includes('super/stats')
        ? Promise.resolve({ total_usuarios: 10, admins: 1, activos: 1, pendientes_verificacion: 0 })
        : Promise.resolve({ data: [admin] }),
    )
  })

  test('desactivar un admin llama a PATCH con activo=false', async () => {
    vi.mocked(api.patch).mockResolvedValue({})
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: /Desactivar a Ana Restrepo/i }))

    expect(api.patch).toHaveBeenCalledWith('/admin/usuarios/a1', { activo: false })
  })

  test('eliminar un admin pide confirmación y luego llama a DELETE', async () => {
    vi.mocked(api.delete).mockResolvedValue({})
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: /Eliminar administrador Ana Restrepo/i }))
    expect(api.delete).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: /^Eliminar$/i }))
    expect(api.delete).toHaveBeenCalledWith('/admin/usuarios/a1')
  })
})
