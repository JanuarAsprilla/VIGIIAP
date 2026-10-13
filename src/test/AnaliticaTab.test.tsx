import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
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

// react-chartjs-2 renderiza sobre <canvas>, que jsdom no soporta de verdad
// (getContext devuelve null) -- se mockea igual que en ReportesTab.test.tsx.
vi.mock('react-chartjs-2', () => ({
  Line: (props: { data: { labels: string[]; datasets: { label: string; data: number[] }[] } }) => (
    <div data-testid="line-chart" data-labels={JSON.stringify(props.data.labels)} data-datasets={JSON.stringify(props.data.datasets.map((d) => d.label))} />
  ),
}))

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

  test('la gráfica de tendencia recibe las series de páginas vistas y visitantes', async () => {
    renderTab()
    const chart = await screen.findByTestId('line-chart')

    expect(JSON.parse(chart.getAttribute('data-datasets')!)).toEqual(['Páginas vistas', 'Visitantes únicos'])
    const labels = JSON.parse(chart.getAttribute('data-labels')!)
    expect(labels).toHaveLength(7)
  })
})

describe('AnaliticaTab — ubicación de las visitas', () => {
  const sesion = {
    id: 's1', primera_visita_en: '2026-01-10T15:00:00Z', ip: '181.49.10.10', pais: 'CO', departamento: 'Chocó',
    ciudad: 'Quibdó', dispositivo: 'movil', navegador: 'Chrome', sistema_operativo: 'Android',
  }

  function conUbicaciones(extra: Record<string, unknown> = {}) {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/analitica/ubicaciones') {
        return Promise.resolve({
          paises: [{ pais: 'CO', sesiones: 8 }, { pais: 'US', sesiones: 2 }],
          departamentos: [{ departamento: 'Chocó', sesiones: 6 }, { departamento: 'Antioquia', sesiones: 2 }],
          sinUbicacion: 3,
          ...extra,
        })
      }
      if (url === '/analitica/sesiones-recientes') return Promise.resolve([sesion, { ...sesion, id: 's2', ip: null, pais: null, departamento: null, ciudad: null }])
      if (url === '/analitica/entrada-salida') return Promise.resolve({ entradas: [], salidas: [] })
      if (url === '/analitica/resumen') {
        return Promise.resolve({
          paginasVistas: { serie7: [1], semanaActual: 1, semanaAnterior: 1, deltaPct: 0 },
          visitantes: { serie7: [1], semanaActual: 1, semanaAnterior: 1, deltaPct: 0 },
          tasaRebotePct: 0, duracionPromedioSeg: 0,
        })
      }
      return Promise.resolve([])
    })
  }

  test('muestra las visitas por departamento y por país, con el aviso de que es aproximada', async () => {
    conUbicaciones()
    renderTab()

    expect(await screen.findByText('6 (75%)')).toBeInTheDocument()
    expect(screen.getByText('Chocó', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByText('Antioquia')).toBeInTheDocument()
    expect(screen.getByText('Colombia')).toBeInTheDocument()
    expect(screen.getByText('Estados Unidos')).toBeInTheDocument()
    expect(screen.getByText('3 sesiones sin ubicación determinada.')).toBeInTheDocument()
    expect(screen.getByText(/no el lugar exacto de la persona/)).toBeInTheDocument()
  })

  test('lista las sesiones recientes con la IP y marca como eliminada la que ya se purgó', async () => {
    conUbicaciones()
    renderTab()

    const tabla = await screen.findByRole('table', { name: /Últimas sesiones de visitantes/ })
    expect(within(tabla).getByText('181.49.10.10')).toBeInTheDocument()
    expect(within(tabla).getByText('Quibdó, Chocó, Colombia')).toBeInTheDocument()
    expect(within(tabla).getAllByText('Móvil · Chrome')).toHaveLength(2)
    expect(within(tabla).getByText('Eliminada')).toBeInTheDocument()
    expect(within(tabla).getByText('Sin ubicación')).toBeInTheDocument()
  })

  test('sin visitas desde Colombia lo dice en vez de dejar la columna vacía', async () => {
    conUbicaciones({ paises: [{ pais: 'US', sesiones: 2 }], departamentos: [], sinUbicacion: 0 })
    renderTab()

    expect(await screen.findByText('Sin visitas desde Colombia en el período.')).toBeInTheDocument()
  })

  test('un fallo al cargar las ubicaciones no rompe el resto de la pestaña', async () => {
    conUbicaciones()
    const base = vi.mocked(api.get).getMockImplementation()!
    vi.mocked(api.get).mockImplementation((url: string) =>
      url === '/analitica/ubicaciones' ? Promise.reject(new Error('fail')) : base(url))
    renderTab()

    expect(await screen.findByText('No se pudo cargar')).toBeInTheDocument()
    expect(screen.getByText('Dispositivos')).toBeInTheDocument()
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
