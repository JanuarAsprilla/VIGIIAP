import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AccionesVisitantes from '@/components/admin/actividad/AccionesVisitantes'
import TiempoReal from '@/components/admin/actividad/TiempoReal'

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

vi.mock('@/lib/api', () => ({ default: { get: vi.fn() } }))
import api from '@/lib/api'

function conCliente(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

beforeEach(() => vi.clearAllMocks())

describe('AccionesVisitantes', () => {
  test('muestra cada acción con su nombre legible, total y los recursos más frecuentes', async () => {
    vi.mocked(api.get).mockResolvedValue({
      eventos: [
        { nombre: 'descarga_mapa', total: 12, sesiones: 9 },
        { nombre: 'abrir_geovisor', total: 5, sesiones: 4 },
      ],
      recursos: [{ nombre: 'descarga_mapa', recurso: 'Río Atrato.pdf', total: 7 }],
    })

    conCliente(<AccionesVisitantes rango={{ desde: '2026-01-01', hasta: '2026-01-15' }} />)

    expect(await screen.findByText('Descargas de mapas')).toBeInTheDocument()
    expect(screen.getByText('Geovisores abiertos')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('Río Atrato.pdf')).toBeInTheDocument()
    expect(vi.mocked(api.get).mock.calls[0][0]).toBe('/analitica/eventos-top')
  })

  test('sin eventos muestra el estado vacío', async () => {
    vi.mocked(api.get).mockResolvedValue({ eventos: [], recursos: [] })

    conCliente(<AccionesVisitantes rango={{ desde: '2026-01-01', hasta: '2026-01-15' }} />)

    expect(await screen.findByText(/Sin datos/i)).toBeInTheDocument()
  })
})

describe('TiempoReal', () => {
  test('muestra los visitantes en línea y las páginas donde están', async () => {
    vi.mocked(api.get).mockResolvedValue({
      ventanaMin: 5, visitantesActivos: 7, paginasActuales: [{ ruta: '/mapas', visitantes: 4 }],
    })

    conCliente(<TiempoReal />)

    expect(await screen.findByText('7')).toBeInTheDocument()
    expect(screen.getByText(/En línea ahora/i)).toBeInTheDocument()
    expect(screen.getByText('/mapas')).toBeInTheDocument()
    expect(vi.mocked(api.get).mock.calls[0][0]).toBe('/analitica/tiempo-real')
  })

  test('con nadie en línea lo dice sin listar páginas', async () => {
    vi.mocked(api.get).mockResolvedValue({ ventanaMin: 5, visitantesActivos: 0, paginasActuales: [] })

    conCliente(<TiempoReal />)

    expect(await screen.findByText(/Nadie en línea/i)).toBeInTheDocument()
  })
})
