import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ReportesTab from '@/pages/admin/ReportesTab'

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

// react-chartjs-2 renderiza sobre <canvas>, que jsdom no soporta de verdad
// (getContext devuelve null) -- se mockea al componente y se prueba
// separadamente que reciba los datasets correctos, no el pintado real.
vi.mock('react-chartjs-2', () => ({
  Line: (props: { data: { labels: string[]; datasets: { label: string; data: number[] }[] } }) => (
    <div data-testid="line-chart" data-labels={JSON.stringify(props.data.labels)} data-datasets={JSON.stringify(props.data.datasets.map((d) => d.label))} />
  ),
  Bar: (props: { data: { labels: string[]; datasets: { data: number[] }[] } }) => (
    <div data-testid="bar-chart" data-labels={JSON.stringify(props.data.labels)} data-values={JSON.stringify(props.data.datasets[0].data)} />
  ),
}))

vi.mock('@/lib/api', () => ({ default: { get: vi.fn() } }))
import api from '@/lib/api'

type ApiGetConfig = Parameters<typeof api.get>[1]
/** El período anterior se pide con periodo=custom -- lo distinguimos así del período principal. */
function paramsDe(config?: ApiGetConfig): Record<string, string> | undefined {
  return config?.params as Record<string, string> | undefined
}

vi.mock('@/lib/exportarReporteExcel', () => ({ exportarReporteExcel: vi.fn().mockResolvedValue(undefined) }))
import { exportarReporteExcel } from '@/lib/exportarReporteExcel'

function renderTab() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><ReportesTab /></QueryClientProvider>)
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
    serieTiempo: {
      granularidad: 'dia',
      serie: [
        { etiqueta: '2026-08-25', usuarios: 1, solicitudes: 0, documentos: 0, mapas: 0 },
        { etiqueta: '2026-08-26', usuarios: 0, solicitudes: 2, documentos: 1, mapas: 0 },
      ],
    },
    ...overrides,
  }
}

beforeEach(() => { vi.clearAllMocks() })

describe('ReportesTab — carga por período', () => {
  test('pide el reporte de la semana por defecto', async () => {
    vi.mocked(api.get).mockResolvedValue(makeReporte())
    renderTab()
    await screen.findByText('Del 2026-08-25 al 2026-09-01')
    expect(api.get).toHaveBeenCalledWith('/admin/reportes', { params: { periodo: 'semana' } })
  })

  test('cambiar a "Este mes" vuelve a pedir el reporte con ese período', async () => {
    vi.mocked(api.get).mockResolvedValue(makeReporte({ periodo: 'mes' }))
    const user = userEvent.setup()
    renderTab()
    await screen.findByText('Del 2026-08-25 al 2026-09-01')

    await user.click(screen.getByRole('button', { name: 'Este mes' }))

    await waitFor(() =>
      expect(api.get).toHaveBeenLastCalledWith('/admin/reportes', { params: { periodo: 'mes' } }),
    )
  })

  test('el rango personalizado no consulta hasta que ambas fechas estén completas', async () => {
    vi.mocked(api.get).mockResolvedValue(makeReporte())
    const user = userEvent.setup()
    renderTab()
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

describe('ReportesTab — métricas', () => {
  test('muestra las métricas devueltas por el backend', async () => {
    vi.mocked(api.get).mockResolvedValue(makeReporte())
    renderTab()

    expect(await screen.findByText('7')).toBeInTheDocument() // usuarios nuevos
    expect(screen.getByText('5')).toBeInTheDocument() // solicitudes nuevas
  })

  test('un error de carga muestra el mensaje y permite reintentar', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('fail'))
    renderTab()
    expect(await screen.findByText('No se pudo generar el reporte.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})

describe('ReportesTab — gráfica de serie de tiempo', () => {
  test('pasa las etiquetas y las 4 métricas como datasets a la gráfica de línea', async () => {
    vi.mocked(api.get).mockResolvedValue(makeReporte())
    renderTab()
    const chart = await screen.findByTestId('line-chart')

    expect(JSON.parse(chart.getAttribute('data-labels')!)).toEqual(['2026-08-25', '2026-08-26'])
    expect(JSON.parse(chart.getAttribute('data-datasets')!)).toEqual([
      'Usuarios nuevos', 'Solicitudes nuevas', 'Documentos publicados', 'Mapas publicados',
    ])
  })

  test('el título de la sección refleja la granularidad diaria', async () => {
    vi.mocked(api.get).mockResolvedValue(makeReporte())
    renderTab()
    expect(await screen.findByText('Evolución día a día')).toBeInTheDocument()
  })

  test('con granularidad horaria (período "hoy"), el título dice "por hora"', async () => {
    vi.mocked(api.get).mockResolvedValue(makeReporte({
      periodo: 'dia',
      serieTiempo: { granularidad: 'hora', serie: [{ etiqueta: '09:00', usuarios: 1, solicitudes: 0, documentos: 0, mapas: 0 }] },
    }))
    renderTab()
    expect(await screen.findByText('Evolución por hora')).toBeInTheDocument()
  })
})

describe('ReportesTab — exportar Excel', () => {
  test('el botón de exportar está deshabilitado hasta que haya datos', async () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}))
    renderTab()
    expect(screen.getByRole('button', { name: /Exportar Excel/i })).toBeDisabled()
  })

  test('al hacer clic genera el libro con los datos del reporte y libera el botón al terminar', async () => {
    vi.mocked(api.get).mockResolvedValue(makeReporte())
    const user = userEvent.setup()
    renderTab()
    await screen.findByText('Del 2026-08-25 al 2026-09-01')

    await user.click(screen.getByRole('button', { name: /Exportar Excel/i }))

    expect(exportarReporteExcel).toHaveBeenCalledWith(expect.objectContaining({ desde: '2026-08-25', hasta: '2026-09-01' }))
    await waitFor(() => expect(screen.getByRole('button', { name: /Exportar Excel/i })).not.toBeDisabled())
  })

  test('mientras exporta, el botón muestra "Generando Excel…" y queda deshabilitado', async () => {
    vi.mocked(api.get).mockResolvedValue(makeReporte())
    let resolveExport: () => void = () => {}
    vi.mocked(exportarReporteExcel).mockReturnValue(new Promise((resolve) => { resolveExport = () => resolve(undefined) }))

    const user = userEvent.setup()
    renderTab()
    await screen.findByText('Del 2026-08-25 al 2026-09-01')
    await user.click(screen.getByRole('button', { name: /Exportar Excel/i }))

    expect(await screen.findByText('Generando Excel…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Generando Excel/i })).toBeDisabled()

    resolveExport()
    await waitFor(() => expect(screen.getByRole('button', { name: /Exportar Excel/i })).toBeInTheDocument())
  })
})

describe('ReportesTab — actividad por módulo', () => {
  test('ordena los módulos de mayor a menor actividad y los pasa a la gráfica de barras', async () => {
    vi.mocked(api.get).mockResolvedValue(makeReporte({
      // 'auth' no está en MODULOS_CATALOGO -- debe caer al valor crudo.
      actividadPorModulo: [{ modulo: 'auth', total: 3 }, { modulo: 'solicitudes', total: 15 }, { modulo: 'mapas', total: 8 }],
    }))
    renderTab()
    const chart = await screen.findByTestId('bar-chart')

    expect(JSON.parse(chart.getAttribute('data-labels')!)).toEqual(['Solicitudes', 'Mapas', 'auth'])
    expect(JSON.parse(chart.getAttribute('data-values')!)).toEqual([15, 8, 3])
  })

  test('sin actividad por módulo, no renderiza la gráfica', async () => {
    vi.mocked(api.get).mockResolvedValue(makeReporte({ actividadPorModulo: [] }))
    renderTab()
    await screen.findByText('Del 2026-08-25 al 2026-09-01')
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument()
  })
})

describe('ReportesTab — comparación con el período anterior', () => {
  test('pide el período inmediatamente anterior, de igual duración, y muestra el delta', async () => {
    vi.mocked(api.get).mockImplementation((_url, config) => {
      const params = paramsDe(config)
      if (params?.periodo === 'custom') {
        expect(params).toEqual({ periodo: 'custom', desde: '2026-08-17', hasta: '2026-08-24' })
        return Promise.resolve(makeReporte({ usuarios: { nuevos: 4, creadosPorAdmin: 1 } }))
      }
      return Promise.resolve(makeReporte()) // actual: usuarios.nuevos = 7
    })
    renderTab()
    await screen.findByText('Del 2026-08-25 al 2026-09-01')

    // (7 - 4) / 4 = +75%
    expect(await screen.findByText('+75%')).toBeInTheDocument()
  })

  test('"Pendientes" no muestra variación -- es un conteo actual, no del período', async () => {
    vi.mocked(api.get).mockResolvedValue(makeReporte())
    renderTab()
    await screen.findByText('Del 2026-08-25 al 2026-09-01')

    const tarjetaPendientes = screen.getByText('Pendientes').closest('div.flex-1')
    expect(tarjetaPendientes?.textContent).not.toMatch(/%/)
  })
})
