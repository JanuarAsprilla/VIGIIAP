import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Dashboard from '@/pages/admin/Dashboard'

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
  return { motion }
})

vi.mock('@/components/ui/Card3D', () => ({
  default: ({ children, className }: { children: ReactNode; className?: string }) =>
    <div className={className}>{children}</div>,
}))

const authMock = { user: { name: 'Ana Restrepo' } }
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authMock }))

vi.mock('@/hooks/useStats', () => ({ useAdminStats: vi.fn() }))
import { useAdminStats } from '@/hooks/useStats'

vi.mock('@/hooks/useSolicitudes', () => ({
  useSolicitudesAdmin: vi.fn(),
  useUpdateEstadoSolicitud: vi.fn(),
}))
import { useSolicitudesAdmin, useUpdateEstadoSolicitud } from '@/hooks/useSolicitudes'

vi.mock('@/hooks/useUsuarios', () => ({ useUsuariosList: vi.fn() }))
import { useUsuariosList } from '@/hooks/useUsuarios'

vi.mock('@/lib/api', () => ({ default: { get: vi.fn().mockResolvedValue({ data: [] }) } }))

function makeSolicitud(overrides: Record<string, unknown> = {}) {
  return {
    id: 'SOL-001', _id: 'mongo-1', tipo: 'Certificación', subtipo: 'Uso de suelo',
    estado: 'Pendiente', fecha: '01/01/2025', creadoEn: '2025-01-01', ...overrides,
  }
}

function makeUsuario(rol: string) {
  return { rol }
}

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}><MemoryRouter><Dashboard /></MemoryRouter></QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useAdminStats).mockReturnValue({
    data: { usuarios: 50, solicitudesPendientes: 3, documentos: 20, visitantesUltimos30d: 10 },
    isLoading: false,
  } as unknown as ReturnType<typeof useAdminStats>)
  vi.mocked(useSolicitudesAdmin).mockReturnValue({
    data: { data: [] },
  } as unknown as ReturnType<typeof useSolicitudesAdmin>)
  vi.mocked(useUpdateEstadoSolicitud).mockReturnValue({
    mutateAsync: vi.fn(), isPending: false,
  } as unknown as ReturnType<typeof useUpdateEstadoSolicitud>)
  vi.mocked(useUsuariosList).mockReturnValue({
    data: { data: [] },
  } as unknown as ReturnType<typeof useUsuariosList>)
})

describe('Dashboard — Distribución de Roles (regresión del fix de Módulo 4)', () => {
  test('muestra los 5 roles reales, incluyendo Técnico e Institucional', async () => {
    vi.mocked(useUsuariosList).mockReturnValue({
      data: {
        data: [
          makeUsuario('Administrador SIG'), makeUsuario('Investigador'),
          makeUsuario('Técnico SIG'), makeUsuario('Funcionario Institucional'), makeUsuario('Público'),
        ],
      },
    } as unknown as ReturnType<typeof useUsuariosList>)

    renderPage()
    expect(await screen.findByText('Técnico SIG')).toBeInTheDocument()
    expect(screen.getByText('Funcionario Institucional')).toBeInTheDocument()
  })
})

describe('Dashboard — KPIs', () => {
  test('muestra los valores de stats cuando terminan de cargar', async () => {
    renderPage()
    expect(await screen.findByText('50')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })
})

describe('Dashboard — Solicitudes Pendientes', () => {
  test('aprobar una solicitud pendiente llama a la mutación con el estado correcto', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useUpdateEstadoSolicitud).mockReturnValue({
      mutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useUpdateEstadoSolicitud>)
    vi.mocked(useSolicitudesAdmin).mockReturnValue({
      data: { data: [makeSolicitud({ estado: 'Pendiente' })] },
    } as unknown as ReturnType<typeof useSolicitudesAdmin>)

    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByTitle('Aprobar'))
    await user.click(screen.getByRole('button', { name: 'Sí' }))

    expect(mutateAsync).toHaveBeenCalledWith({ id: 'mongo-1', estado: 'Aprobado' })
  })

  test('sin solicitudes pendientes muestra el mensaje vacío', async () => {
    renderPage()
    expect(await screen.findByText('Sin solicitudes pendientes')).toBeInTheDocument()
  })
})

describe('Dashboard — Alerta de solicitudes', () => {
  test('con solicitudes pendientes, muestra la alerta con el conteo correcto', async () => {
    vi.mocked(useSolicitudesAdmin).mockReturnValue({
      data: { data: [makeSolicitud({ estado: 'Pendiente' }), makeSolicitud({ estado: 'En Revisión' })] },
    } as unknown as ReturnType<typeof useSolicitudesAdmin>)

    renderPage()
    expect(await screen.findByText(/2 solicitudes pendientes de respuesta/i)).toBeInTheDocument()
  })

  test('sin solicitudes pendientes, no muestra la alerta', () => {
    renderPage()
    expect(screen.queryByText(/pendientes de respuesta/i)).not.toBeInTheDocument()
  })
})
