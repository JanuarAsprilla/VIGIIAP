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

interface MockUser {
  name: string
  rol?: string
  modulos?: { modulo: string; puede_ver: boolean; puede_editar: boolean }[]
}
const authMock: { user: MockUser } = { user: { name: 'Ana Restrepo' } }
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authMock }))

vi.mock('@/hooks/useStats', () => ({ useAdminStats: vi.fn(), useDashboardTendencias: vi.fn() }))
import { useAdminStats, useDashboardTendencias } from '@/hooks/useStats'

vi.mock('@/hooks/useSolicitudes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useSolicitudes')>()
  return { ...actual, useSolicitudesAdmin: vi.fn(), useUpdateEstadoSolicitud: vi.fn() }
})
import { useSolicitudesAdmin, useUpdateEstadoSolicitud } from '@/hooks/useSolicitudes'

vi.mock('@/hooks/useUsuarios', () => ({ useUsuariosList: vi.fn() }))
import { useUsuariosList } from '@/hooks/useUsuarios'

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
  authMock.user = { name: 'Ana Restrepo' }
  vi.mocked(useAdminStats).mockReturnValue({
    data: { usuarios: 50, solicitudesPendientes: 3, documentos: 20, mapasPublicados: 12, visitantesUltimos30d: 10 },
    isLoading: false,
  } as unknown as ReturnType<typeof useAdminStats>)
  vi.mocked(useDashboardTendencias).mockReturnValue({
    data: {
      usuarios:    { serie7: [1,2,1,3,2,4,5], semanaActual: 18, semanaAnterior: 12, deltaPct: 50 },
      solicitudes: { serie7: [0,1,0,1,1,0,1], semanaActual: 4,  semanaAnterior: 6,  deltaPct: -33 },
      documentos:  { serie7: [0,0,1,0,0,1,0], semanaActual: 2,  semanaAnterior: 2,  deltaPct: 0 },
      mapas:       { serie7: [0,0,0,0,0,0,1], semanaActual: 1,  semanaAnterior: 0,  deltaPct: 100 },
    },
    isLoading: false,
  } as unknown as ReturnType<typeof useDashboardTendencias>)
  vi.mocked(useSolicitudesAdmin).mockReturnValue({
    data: { data: [] },
  } as unknown as ReturnType<typeof useSolicitudesAdmin>)
  vi.mocked(useUpdateEstadoSolicitud).mockReturnValue({
    mutateAsync: vi.fn(), isPending: false,
  } as unknown as ReturnType<typeof useUpdateEstadoSolicitud>)
  vi.mocked(useUsuariosList).mockReturnValue({
    data: { data: [] },
  } as unknown as ReturnType<typeof useUsuariosList>)
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
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  test('muestra el delta real de tendencias, no una flecha fija', async () => {
    renderPage()
    expect(await screen.findByText('+50%')).toBeInTheDocument()
    expect(screen.getByText('-33%')).toBeInTheDocument()
    expect(screen.getByText('Sin cambios')).toBeInTheDocument()
    expect(screen.getByText('+100%')).toBeInTheDocument()
  })

  test('muestra la cifra de flujo semanal junto al valor total', async () => {
    renderPage()
    // El "18" vive en un <span> anidado dentro del texto "18 nuevos esta semana" —
    // se compara el textContent completo del contenedor en vez del nodo de texto suelto.
    const isFlowCaption = (text: string) => (_: string, el: Element | null) =>
      el?.tagName === 'SPAN' && el.textContent === text
    expect(await screen.findByText(isFlowCaption('18 nuevos esta semana'))).toBeInTheDocument()
    expect(screen.getByText(isFlowCaption('4 nuevas esta semana'))).toBeInTheDocument()
    expect(screen.getAllByText(/publicados esta semana/).length).toBe(2)
  })

  test('mientras cargan las tendencias, muestra un esqueleto en vez de datos a medias', async () => {
    vi.mocked(useDashboardTendencias).mockReturnValue({
      data: undefined, isLoading: true,
    } as unknown as ReturnType<typeof useDashboardTendencias>)
    renderPage()
    expect(await screen.findByText('50')).toBeInTheDocument()
    expect(screen.queryByText(/esta semana/)).not.toBeInTheDocument()
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

describe('Dashboard — personalización por permisos de módulo (admin_sig delegado)', () => {
  test('un admin_sig con permiso solo de solicitudes no ve el KPI ni el chart de usuarios', async () => {
    authMock.user = {
      name: 'Delegado', rol: 'admin_sig',
      modulos: [{ modulo: 'solicitudes', puede_ver: true, puede_editar: true }],
    }
    vi.mocked(useSolicitudesAdmin).mockReturnValue({
      data: { data: [makeSolicitud({ estado: 'Pendiente' })] },
    } as unknown as ReturnType<typeof useSolicitudesAdmin>)

    renderPage()

    // "Solicitudes Pendientes" aparece dos veces a propósito: la etiqueta del
    // KPI y el encabezado de la lista de solicitudes pendientes.
    expect(await screen.findAllByText('Solicitudes Pendientes')).toHaveLength(2)
    expect(screen.queryByText('Usuarios Registrados')).not.toBeInTheDocument()
    expect(screen.queryByText('Documentos Activos')).not.toBeInTheDocument()
    expect(screen.queryByText('Mapas Publicados')).not.toBeInTheDocument()
    expect(screen.queryByText('Distribución de Roles')).not.toBeInTheDocument()
    expect(screen.queryByText('Actividad Reciente')).not.toBeInTheDocument()
    expect(screen.queryByText('Nuevo Usuario')).not.toBeInTheDocument()
    expect(screen.getByText('Ver Solicitudes')).toBeInTheDocument()
  })

  test('no dispara las consultas de módulos sin permiso (evita 403 innecesarios)', async () => {
    authMock.user = {
      name: 'Delegado', rol: 'admin_sig',
      modulos: [{ modulo: 'actividad', puede_ver: true, puede_editar: false }],
    }
    renderPage()
    await screen.findByText('Actividad Reciente')

    expect(useSolicitudesAdmin).toHaveBeenCalledWith(expect.anything(), false)
    expect(useUsuariosList).toHaveBeenCalledWith(expect.anything(), false)
  })

  test('un admin_sig sin ningún módulo habilitado ve un aviso explícito en vez de una pantalla en blanco', async () => {
    authMock.user = { name: 'Delegado', rol: 'admin_sig', modulos: [] }
    renderPage()

    expect(await screen.findByText(/Acceso delegado a 0 módulos/)).toBeInTheDocument()
    expect(screen.getByText('Todavía no tienes ningún módulo asignado')).toBeInTheDocument()
    expect(screen.getByText(/no es un error/i)).toBeInTheDocument()
    expect(screen.queryByText('Solicitudes Pendientes')).not.toBeInTheDocument()
    expect(screen.queryByText('Distribución de Roles')).not.toBeInTheDocument()
    expect(screen.queryByText('Nuevo Usuario')).not.toBeInTheDocument()
    expect(screen.queryByText('Usuarios Registrados')).not.toBeInTheDocument()
  })

  test('un admin_sig CON al menos un módulo no ve el aviso de "sin módulos asignados"', async () => {
    authMock.user = {
      name: 'Delegado', rol: 'admin_sig',
      modulos: [{ modulo: 'actividad', puede_ver: true, puede_editar: false }],
    }
    renderPage()

    await screen.findByText('Actividad Reciente')
    expect(screen.queryByText('Todavía no tienes ningún módulo asignado')).not.toBeInTheDocument()
  })

  test('super_admin sigue viendo todo, sin el subtítulo de acceso delegado', async () => {
    authMock.user = { name: 'Root', rol: 'super_admin' }
    renderPage()

    expect(await screen.findByText('Usuarios Registrados')).toBeInTheDocument()
    expect(screen.getByText('Distribución de Roles')).toBeInTheDocument()
    expect(screen.queryByText(/Acceso delegado/)).not.toBeInTheDocument()
  })
})
