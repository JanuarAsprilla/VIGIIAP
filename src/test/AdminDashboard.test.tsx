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

vi.mock('@/hooks/useSolicitudes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useSolicitudes')>()
  return { ...actual, useSolicitudesAdmin: vi.fn(), useUpdateEstadoSolicitud: vi.fn() }
})
import { useSolicitudesAdmin, useUpdateEstadoSolicitud } from '@/hooks/useSolicitudes'

vi.mock('@/hooks/useUsuarios', () => ({ useUsuariosList: vi.fn() }))
import { useUsuariosList } from '@/hooks/useUsuarios'

vi.mock('@/hooks/useMapas', () => ({ useMapasList: vi.fn() }))
import { useMapasList } from '@/hooks/useMapas'

vi.mock('@/hooks/useAuditLog', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useAuditLog')>()
  return { ...actual, useAuditLog: vi.fn() }
})
import { useAuditLog } from '@/hooks/useAuditLog'

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
  vi.mocked(useMapasList).mockReturnValue({
    data: { meta: { total: 12 } }, isLoading: false,
  } as unknown as ReturnType<typeof useMapasList>)
  vi.mocked(useAuditLog).mockReturnValue({
    data: { data: [] }, isLoading: false, isError: false, refetch: vi.fn(),
  } as unknown as ReturnType<typeof useAuditLog>)
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

  test('rechazar una solicitud pendiente llama a la mutación con estado Rechazado', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useUpdateEstadoSolicitud).mockReturnValue({
      mutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useUpdateEstadoSolicitud>)
    vi.mocked(useSolicitudesAdmin).mockReturnValue({
      data: { data: [makeSolicitud({ estado: 'Pendiente' })] },
    } as unknown as ReturnType<typeof useSolicitudesAdmin>)

    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByTitle('Rechazar'))
    expect(screen.getByText('¿Rechazar?')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Sí' }))

    expect(mutateAsync).toHaveBeenCalledWith({ id: 'mongo-1', estado: 'Rechazado' })
  })

  test('el botón "No" cancela la confirmación sin llamar a la mutación', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useUpdateEstadoSolicitud).mockReturnValue({
      mutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useUpdateEstadoSolicitud>)
    vi.mocked(useSolicitudesAdmin).mockReturnValue({
      data: { data: [makeSolicitud({ estado: 'Pendiente' })] },
    } as unknown as ReturnType<typeof useSolicitudesAdmin>)

    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByTitle('Aprobar'))
    await user.click(screen.getByRole('button', { name: 'No' }))

    expect(screen.queryByText('¿Aprobar?')).not.toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  test('mientras la mutación está pendiente, deshabilita los botones y muestra "…"', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useUpdateEstadoSolicitud).mockReturnValue({
      mutateAsync, isPending: true,
    } as unknown as ReturnType<typeof useUpdateEstadoSolicitud>)
    vi.mocked(useSolicitudesAdmin).mockReturnValue({
      data: { data: [makeSolicitud({ estado: 'Pendiente' })] },
    } as unknown as ReturnType<typeof useSolicitudesAdmin>)

    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByTitle('Aprobar'))

    expect(screen.getByText('…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'No' })).toBeDisabled()
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

  test('con una sola solicitud pendiente, usa el singular "solicitud pendiente"', async () => {
    vi.mocked(useSolicitudesAdmin).mockReturnValue({
      data: { data: [makeSolicitud({ estado: 'Pendiente' })] },
    } as unknown as ReturnType<typeof useSolicitudesAdmin>)

    renderPage()
    expect(await screen.findByText('1 solicitud pendiente de respuesta')).toBeInTheDocument()
  })
})

function makeLog(overrides: Record<string, unknown> = {}) {
  return {
    id: 'log-1', accion: 'update_documento', accionLabel: 'Editar documento', badge: 'bg-gold-500/12 text-gold-500',
    modulo: 'documentos', descripcion: 'Actualizó un documento', email: 'ana@example.com', fecha: '01/01/2026 00:00',
    creado_en: '2026-01-01T00:00:00Z', ...overrides,
  }
}

describe('Dashboard — Actividad Reciente', () => {
  test('sin actividad, muestra el mensaje vacío', async () => {
    renderPage()
    expect(await screen.findByText('Sin actividad registrada')).toBeInTheDocument()
  })

  test('lista los registros reales con iniciales, módulo conocido y descripción', async () => {
    vi.mocked(useAuditLog).mockReturnValue({
      data: { data: [makeLog()] }, isLoading: false, isError: false, refetch: vi.fn(),
    } as unknown as ReturnType<typeof useAuditLog>)

    renderPage()
    expect(await screen.findByText('Actualizó un documento')).toBeInTheDocument()
    expect(screen.getByText('AN')).toBeInTheDocument()
    expect(screen.getByText('documentos')).toBeInTheDocument()
    expect(screen.getByText(/ana@example.com/)).toBeInTheDocument()
  })

  test('con módulo desconocido usa el badge gris por defecto', async () => {
    vi.mocked(useAuditLog).mockReturnValue({
      data: { data: [makeLog({ id: 'log-2', modulo: 'modulo-inexistente', descripcion: 'Evento raro' })] },
      isLoading: false, isError: false, refetch: vi.fn(),
    } as unknown as ReturnType<typeof useAuditLog>)

    renderPage()
    const badge = await screen.findByText('modulo-inexistente')
    expect(badge).toHaveClass('bg-bg-alt', 'text-text-muted')
  })

  test('sin email ni descripción, usa los valores de respaldo', async () => {
    vi.mocked(useAuditLog).mockReturnValue({
      data: { data: [makeLog({ id: 'log-3', email: '—', descripcion: '', accionLabel: 'Acción de sistema', modulo: 'admin' })] },
      isLoading: false, isError: false, refetch: vi.fn(),
    } as unknown as ReturnType<typeof useAuditLog>)

    renderPage()
    const descripcion = await screen.findByText('Acción de sistema')
    expect(screen.getByText('?')).toBeInTheDocument()
    expect(descripcion.nextElementSibling).toHaveTextContent('—')
  })
})
