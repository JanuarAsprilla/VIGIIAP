import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ComparativaPeriodo from '@/components/admin/actividad/ComparativaPeriodo'

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

const RANGO = { desde: '2026-01-08', hasta: '2026-01-15' }

function conCliente(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

const COMPARATIVA = {
  actual:   { desde: '2026-01-08T00:00:00.000Z', hasta: '2026-01-15T23:59:59.999Z', vistas: 150, sesiones: 60, acciones: 20, rebotePct: 60 },
  anterior: { desde: '2026-01-01T00:00:00.000Z', hasta: '2026-01-07T23:59:59.999Z', vistas: 100, sesiones: 80, acciones: 20, rebotePct: 40 },
  variacion: { vistas: 50, sesiones: -25, acciones: 0, rebotePuntos: 20 },
}

beforeEach(() => vi.clearAllMocks())

describe('ComparativaPeriodo', () => {
  test('muestra el valor actual, el anterior y la variación de cada métrica', async () => {
    vi.mocked(api.get).mockResolvedValue(COMPARATIVA)

    conCliente(<ComparativaPeriodo rango={RANGO} />)

    expect(await screen.findByText('150')).toBeInTheDocument()
    expect(screen.getByText('antes: 100')).toBeInTheDocument()
    expect(screen.getByText('+50 %')).toBeInTheDocument()
    expect(screen.getByText('−25 %')).toBeInTheDocument()
    expect(screen.getByText('0 %')).toBeInTheDocument()
    expect(vi.mocked(api.get).mock.calls[0][0]).toBe('/analitica/comparativa')
  })

  test('el rebote se muestra en puntos porcentuales', async () => {
    vi.mocked(api.get).mockResolvedValue(COMPARATIVA)

    conCliente(<ComparativaPeriodo rango={RANGO} />)

    expect(await screen.findByText('+20 pts')).toBeInTheDocument()
    expect(screen.getByText('antes: 40 %')).toBeInTheDocument()
  })

  test('aclara que compara solo el sitio público con el período anterior', async () => {
    vi.mocked(api.get).mockResolvedValue(COMPARATIVA)

    conCliente(<ComparativaPeriodo rango={RANGO} />)

    expect(await screen.findByText(/igual duración/i)).toBeInTheDocument()
    expect(screen.getByText(/sitio público/i)).toBeInTheDocument()
  })

  test('si la API falla muestra el aviso de error', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('500'))

    conCliente(<ComparativaPeriodo rango={RANGO} />)

    expect(await screen.findByText(/No se pudo cargar/i)).toBeInTheDocument()
  })
})
