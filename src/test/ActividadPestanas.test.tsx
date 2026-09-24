import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
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

vi.mock('@/lib/api', () => ({ default: { get: vi.fn() } }))
import api from '@/lib/api'

vi.mock('@/lib/exportarActividadExcel', () => ({ exportarActividadExcel: vi.fn() }))

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><Actividad /></QueryClientProvider>)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url === '/admin/audit') return Promise.resolve({ data: [], meta: { total: 0 } })
    if (url === '/analitica/resumen') {
      return Promise.resolve({
        paginasVistas: { serie7: [1, 2, 3, 4, 5, 6, 7], semanaActual: 28, semanaAnterior: 20, deltaPct: 40 },
        visitantes: { serie7: [1, 1, 1, 1, 1, 1, 1], semanaActual: 7, semanaAnterior: 7, deltaPct: 0 },
        tasaRebotePct: 35, duracionPromedioSeg: 125,
      })
    }
    if (url === '/analitica/entrada-salida') return Promise.resolve({ entradas: [], salidas: [] })
    // /analitica/paginas-top, /analitica/dispositivos, /analitica/fuentes-trafico
    return Promise.resolve([])
  })
})

describe('Actividad — pestañas', () => {
  test('por defecto muestra la pestaña de Auditoría', async () => {
    renderPage()
    expect(await screen.findByText('Sin eventos registrados')).toBeInTheDocument()
  })

  test('cambiar a la pestaña Analítica muestra sus KPIs y oculta la tabla de auditoría', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Sin eventos registrados')

    await user.click(screen.getByRole('button', { name: 'Analítica de Uso' }))

    expect(await screen.findByText('Páginas Vistas')).toBeInTheDocument()
    expect(screen.getByText('Visitantes Únicos')).toBeInTheDocument()
    expect(screen.getByText('Tasa de Rebote')).toBeInTheDocument()
    expect(screen.getByText('35%')).toBeInTheDocument()
    expect(screen.queryByText('Sin eventos registrados')).not.toBeInTheDocument()
  })

  test('cambiar de pestaña reemplaza el contenido -- no quedan ambas montadas a la vez', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Sin eventos registrados')

    await user.click(screen.getByRole('button', { name: 'Analítica de Uso' }))

    expect(await screen.findByText('Páginas Vistas')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/Buscar por usuario/i)).not.toBeInTheDocument()
  })

  test('volver a la pestaña Auditoría restaura la tabla', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Sin eventos registrados')

    await user.click(screen.getByRole('button', { name: 'Analítica de Uso' }))
    await screen.findByText('Páginas Vistas')
    await user.click(screen.getByRole('button', { name: 'Registro de Auditoría' }))

    expect(await screen.findByText('Sin eventos registrados')).toBeInTheDocument()
  })
})
