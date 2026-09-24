import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Actividad from '@/pages/admin/Actividad'

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

vi.mock('react-chartjs-2', () => ({ Line: () => <div data-testid="line-chart" /> }))

vi.mock('@/lib/api', () => ({ default: { get: vi.fn() } }))
import api from '@/lib/api'

vi.mock('@/lib/exportarActividadExcel', () => ({ exportarActividadExcel: vi.fn() }))
vi.mock('@/lib/exportarReporteExcel', () => ({ exportarReporteExcel: vi.fn() }))

interface MockUser { rol: string; modulos?: { modulo: string; puede_ver: boolean; puede_editar: boolean }[] }
const authMock: { user: MockUser | null } = { user: { rol: 'super_admin' } }
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authMock }))

function renderPage(initialPath = '/admin/actividad') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <QueryClientProvider client={qc}><Actividad /></QueryClientProvider>
    </MemoryRouter>,
  )
}

const RESUMEN_VACIO = {
  paginasVistas: { serie7: [1, 2, 3, 4, 5, 6, 7], semanaActual: 28, semanaAnterior: 20, deltaPct: 40 },
  visitantes: { serie7: [1, 1, 1, 1, 1, 1, 1], semanaActual: 7, semanaAnterior: 7, deltaPct: 0 },
  tasaRebotePct: 35, duracionPromedioSeg: 125,
}
const REPORTE_VACIO = {
  periodo: 'semana', desde: '2026-08-25', hasta: '2026-09-01',
  usuarios: { nuevos: 0, creadosPorAdmin: 0 },
  solicitudes: { nuevas: 0, resueltas: 0, pendientes: 0 },
  documentos: { creados: 0, publicados: 0 },
  mapas: { creados: 0, publicados: 0 },
  logins: { exitosos: 0, fallidos: 0 },
  actividadPorModulo: [],
  serieTiempo: { granularidad: 'dia', serie: [] },
}

beforeEach(() => {
  vi.clearAllMocks()
  authMock.user = { rol: 'super_admin' }
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url === '/admin/audit') return Promise.resolve({ data: [], meta: { total: 0 } })
    if (url === '/admin/reportes') return Promise.resolve(REPORTE_VACIO)
    if (url === '/analitica/resumen') return Promise.resolve(RESUMEN_VACIO)
    if (url === '/analitica/entrada-salida') return Promise.resolve({ entradas: [], salidas: [] })
    return Promise.resolve([])
  })
})

describe('Actividad — pestañas (super_admin ve las 3)', () => {
  test('por defecto muestra la pestaña de Auditoría', async () => {
    renderPage()
    expect(await screen.findByText('Sin eventos registrados')).toBeInTheDocument()
  })

  test('cambiar a Reportes muestra el reporte por período', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Sin eventos registrados')

    await user.click(screen.getByRole('button', { name: 'Reportes' }))

    expect(await screen.findByText('Del 2026-08-25 al 2026-09-01')).toBeInTheDocument()
    expect(screen.queryByText('Sin eventos registrados')).not.toBeInTheDocument()
  })

  test('cambiar a Analítica de Uso muestra sus KPIs', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Sin eventos registrados')

    await user.click(screen.getByRole('button', { name: 'Analítica de Uso' }))

    expect(await screen.findByText('Páginas Vistas')).toBeInTheDocument()
    expect(screen.getByText('35%')).toBeInTheDocument()
  })

  test('el selector de rango global (a nivel Actividad) solo aparece en la pestaña Analítica', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Sin eventos registrados')
    // Solo el "Desde" propio de AuditoriaTab en este punto.
    expect(screen.getAllByLabelText('Desde')).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Analítica de Uso' }))
    await screen.findByText('Páginas Vistas')
    // El de Analítica se suma al de la barra de pestañas -- sigue siendo 1
    // porque AuditoriaTab (con su propio "Desde") ya no está montada.
    expect(screen.getAllByLabelText('Desde')).toHaveLength(1)
  })

  test('abrir con ?tab=reportes directamente muestra esa pestaña', async () => {
    renderPage('/admin/actividad?tab=reportes')
    expect(await screen.findByText('Del 2026-08-25 al 2026-09-01')).toBeInTheDocument()
  })

  test('abrir con ?tab=analitica directamente muestra esa pestaña', async () => {
    renderPage('/admin/actividad?tab=analitica')
    expect(await screen.findByText('Páginas Vistas')).toBeInTheDocument()
  })
})

describe('Actividad — pestañas filtradas por permisos (admin_sig delegado)', () => {
  test('admin_sig con solo el módulo "reportes" ve únicamente esa pestaña', async () => {
    authMock.user = {
      rol: 'admin_sig',
      modulos: [{ modulo: 'reportes', puede_ver: true, puede_editar: false }],
    }
    renderPage()

    expect(await screen.findByText('Del 2026-08-25 al 2026-09-01')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Registro de Auditoría' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Analítica de Uso' })).not.toBeInTheDocument()
  })

  test('admin_sig con solo el módulo "actividad" ve Auditoría y Analítica, no Reportes', async () => {
    authMock.user = {
      rol: 'admin_sig',
      modulos: [{ modulo: 'actividad', puede_ver: true, puede_editar: false }],
    }
    renderPage()

    expect(await screen.findByText('Sin eventos registrados')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Analítica de Uso' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reportes' })).not.toBeInTheDocument()
  })

  test('admin_sig sin ningún módulo habilitado ve el mensaje de sin acceso', async () => {
    authMock.user = { rol: 'admin_sig', modulos: [] }
    renderPage()

    expect(await screen.findByText('No tienes acceso a ninguna sección de esta pantalla.')).toBeInTheDocument()
  })

  test('?tab= a una pestaña sin permiso cae a la primera pestaña visible', async () => {
    authMock.user = {
      rol: 'admin_sig',
      modulos: [{ modulo: 'reportes', puede_ver: true, puede_editar: false }],
    }
    renderPage('/admin/actividad?tab=analitica')

    expect(await screen.findByText('Del 2026-08-25 al 2026-09-01')).toBeInTheDocument()
  })
})
