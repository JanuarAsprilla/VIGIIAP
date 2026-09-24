import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AnaliticaTab from '@/pages/admin/AnaliticaTab'

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

function renderTab(desde = '2026-01-01', hasta = '2026-01-15') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <AnaliticaTab desde={desde} hasta={hasta} />
    </QueryClientProvider>,
  )
}

beforeEach(() => vi.clearAllMocks())

describe('AnaliticaTab — con datos reales en cada sección', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/analitica/resumen') {
        return Promise.resolve({
          paginasVistas: { serie7: [1, 2, 3, 4, 5, 6, 7], semanaActual: 28, semanaAnterior: 20, deltaPct: 40 },
          visitantes: { serie7: [1, 1, 1, 1, 1, 1, 1], semanaActual: 7, semanaAnterior: 7, deltaPct: 0 },
          tasaRebotePct: 35, duracionPromedioSeg: 125,
        })
      }
      if (url === '/analitica/paginas-top') {
        return Promise.resolve([{ ruta: '/', vistas: 50, visitantes: 30 }, { ruta: '/mapas', vistas: 20, visitantes: 15 }])
      }
      if (url === '/analitica/dispositivos') {
        return Promise.resolve([{ dispositivo: 'movil', sesiones: 6 }, { dispositivo: 'escritorio', sesiones: 4 }])
      }
      if (url === '/analitica/fuentes-trafico') {
        return Promise.resolve([{ fuente: 'Directo', sesiones: 7 }, { fuente: 'Buscadores', sesiones: 3 }])
      }
      if (url === '/analitica/entrada-salida') {
        return Promise.resolve({ entradas: [{ ruta: '/', veces: 12 }], salidas: [{ ruta: '/mapas', veces: 5 }] })
      }
      return Promise.resolve([])
    })
  })

  test('muestra las páginas más visitadas con sus conteos', async () => {
    renderTab()
    expect(await screen.findByText('50')).toBeInTheDocument()
    // '/' aparece también en Entrada y Salida -- solo se verifica que exista al menos una vez.
    expect(screen.getAllByText('/').length).toBeGreaterThan(0)
    expect(screen.getAllByText('/mapas').length).toBeGreaterThan(0)
  })

  test('muestra el desglose de dispositivos con porcentajes', async () => {
    renderTab()
    expect(await screen.findByText('6 (60%)')).toBeInTheDocument()
    expect(screen.getByText('4 (40%)')).toBeInTheDocument()
    expect(screen.getByText('Móvil')).toBeInTheDocument()
    expect(screen.getByText('Escritorio')).toBeInTheDocument()
  })

  test('muestra las fuentes de tráfico con porcentajes', async () => {
    renderTab()
    expect(await screen.findByText('7 (70%)')).toBeInTheDocument()
    expect(screen.getByText('Directo')).toBeInTheDocument()
    expect(screen.getByText('Buscadores')).toBeInTheDocument()
  })

  test('muestra páginas de entrada y salida', async () => {
    renderTab()
    expect(await screen.findByText('Entradas')).toBeInTheDocument()
    expect(screen.getByText('Salidas')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  test('la tasa de rebote y duración promedio se formatean correctamente', async () => {
    renderTab()
    expect(await screen.findByText('35%')).toBeInTheDocument()
    expect(screen.getByText('2m 05s')).toBeInTheDocument()
  })
})

describe('AnaliticaTab — estados vacíos y de error', () => {
  test('sin datos en el período, muestra el mensaje vacío en cada sección', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/analitica/resumen') {
        return Promise.resolve({
          paginasVistas: { serie7: [0, 0, 0, 0, 0, 0, 0], semanaActual: 0, semanaAnterior: 0, deltaPct: 0 },
          visitantes: { serie7: [0, 0, 0, 0, 0, 0, 0], semanaActual: 0, semanaAnterior: 0, deltaPct: 0 },
          tasaRebotePct: 0, duracionPromedioSeg: 0,
        })
      }
      if (url === '/analitica/entrada-salida') return Promise.resolve({ entradas: [], salidas: [] })
      return Promise.resolve([])
    })
    renderTab()
    const mensajesVacios = await screen.findAllByText('Sin datos en el período seleccionado')
    expect(mensajesVacios.length).toBeGreaterThan(0)
    expect(await screen.findAllByText('Sin datos')).toHaveLength(2) // entradas y salidas
  })

  test('un fallo en páginas-top muestra el mensaje de error de esa sección sin romper las demás', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/analitica/paginas-top') return Promise.reject(new Error('fail'))
      if (url === '/analitica/resumen') {
        return Promise.resolve({
          paginasVistas: { serie7: [1], semanaActual: 1, semanaAnterior: 1, deltaPct: 0 },
          visitantes: { serie7: [1], semanaActual: 1, semanaAnterior: 1, deltaPct: 0 },
          tasaRebotePct: 0, duracionPromedioSeg: 0,
        })
      }
      if (url === '/analitica/entrada-salida') return Promise.resolve({ entradas: [], salidas: [] })
      return Promise.resolve([])
    })
    renderTab()
    expect(await screen.findByText('No se pudo cargar')).toBeInTheDocument()
    expect(screen.getByText('Dispositivos')).toBeInTheDocument()
  })
})
