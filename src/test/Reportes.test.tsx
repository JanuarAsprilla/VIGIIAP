import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Reportes from '@/pages/admin/Reportes'

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

vi.mock('@/lib/api', () => ({ default: { get: vi.fn() } }))
import api from '@/lib/api'

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><Reportes /></QueryClientProvider>)
}

function makeReporte(overrides: Record<string, unknown> = {}) {
  return {
    periodo: 'semana', desde: '2026-08-25', hasta: '2026-09-01',
    usuarios: { nuevos: 7, creadosPorAdmin: 1 },
    solicitudes: { nuevas: 5, resueltas: 2, pendientes: 3 },
    documentos: { creados: 4, publicados: 2 },
    mapas: { creados: 1, publicados: 1 },
    logins: { exitosos: 20, fallidos: 2 },
    actividadPorModulo: [{ modulo: 'solicitudes', total: 8 }, { modulo: 'auth', total: 22 }],
    ...overrides,
  }
}

beforeEach(() => { vi.clearAllMocks() })

describe('Reportes — carga por período', () => {
  test('pide el reporte de la semana por defecto', async () => {
    vi.mocked(api.get).mockResolvedValue(makeReporte())
    renderPage()
    await screen.findByText('Del 2026-08-25 al 2026-09-01')
    expect(api.get).toHaveBeenCalledWith('/admin/reportes', { params: { periodo: 'semana' } })
  })

  test('cambiar a "Este mes" vuelve a pedir el reporte con ese período', async () => {
    vi.mocked(api.get).mockResolvedValue(makeReporte({ periodo: 'mes' }))
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Del 2026-08-25 al 2026-09-01')

    await user.click(screen.getByRole('button', { name: 'Este mes' }))

    await waitFor(() =>
      expect(api.get).toHaveBeenLastCalledWith('/admin/reportes', { params: { periodo: 'mes' } }),
    )
  })

  test('el rango personalizado no consulta hasta que ambas fechas estén completas', async () => {
    vi.mocked(api.get).mockResolvedValue(makeReporte())
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Del 2026-08-25 al 2026-09-01')
    vi.mocked(api.get).mockClear()

    await user.click(screen.getByRole('button', { name: 'Rango personalizado' }))
    expect(api.get).not.toHaveBeenCalled()

    await user.type(screen.getByLabelText('Desde'), '2026-08-01')
    expect(api.get).not.toHaveBeenCalled()

    await user.type(screen.getByLabelText('Hasta'), '2026-08-31')
    await waitFor(() => expect(api.get).toHaveBeenCalled())
  })
})

describe('Reportes — métricas', () => {
  test('muestra las métricas devueltas por el backend', async () => {
    vi.mocked(api.get).mockResolvedValue(makeReporte())
    renderPage()

    expect(await screen.findByText('7')).toBeInTheDocument() // usuarios nuevos
    expect(screen.getByText('5')).toBeInTheDocument() // solicitudes nuevas
    expect(screen.getByText('solicitudes')).toBeInTheDocument()
    expect(screen.getByText('auth')).toBeInTheDocument()
  })

  test('un error de carga muestra el mensaje y permite reintentar', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('fail'))
    renderPage()
    expect(await screen.findByText('No se pudo generar el reporte.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})

describe('Reportes — exportar CSV', () => {
  test('el botón de exportar está deshabilitado hasta que haya datos', async () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByRole('button', { name: /Exportar CSV/i })).toBeDisabled()
  })

  test('genera y libera un Object URL al exportar', async () => {
    vi.mocked(api.get).mockResolvedValue(makeReporte())
    const createObjectURL = vi.fn().mockReturnValue('blob:mock-url')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })

    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Del 2026-08-25 al 2026-09-01')
    await user.click(screen.getByRole('button', { name: /Exportar CSV/i }))

    expect(createObjectURL).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    vi.unstubAllGlobals()
  })
})
