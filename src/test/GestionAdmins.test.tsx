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
        : Promise.resolve({ usuarios: [] }),
    ),
    post: vi.fn(),
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
            usuarios: [
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
