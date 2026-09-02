import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Errores from '@/pages/admin/Errores'

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
  return render(<QueryClientProvider client={qc}><Errores /></QueryClientProvider>)
}

function makeError(overrides: Record<string, unknown> = {}) {
  return {
    id: 1, mensaje: 'Connection timeout', stack: 'Error: Connection timeout\n    at foo.js:1:1',
    metodo: 'POST', ruta: '/api/v1/mapas', status_code: 500,
    ocurrencias: 3, primera_vez: '2026-09-01T10:00:00Z', ultima_vez: '2026-09-02T10:00:00Z',
    ...overrides,
  }
}

beforeEach(() => { vi.clearAllMocks() })

describe('Errores — estados', () => {
  test('sin errores muestra el mensaje explícito de "todo en orden"', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [], meta: { total: 0 } })
    renderPage()
    expect(await screen.findByText('Sin errores registrados')).toBeInTheDocument()
    expect(screen.getByText(/todo en orden/i)).toBeInTheDocument()
  })

  test('muestra un spinner de carga mientras isLoading', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(document.querySelector('.animate-spin')).not.toBeNull()
  })

  test('un error de carga muestra el mensaje de fallo con botón de reintentar', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('network fail'))
    renderPage()
    expect(await screen.findByText(/No se pudo cargar el registro de errores/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Reintentar/i })).toBeInTheDocument()
  })
})

describe('Errores — listado', () => {
  test('muestra mensaje, endpoint y contador de ocurrencias', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeError()], meta: { total: 1 } })
    renderPage()
    expect(await screen.findByText('Connection timeout')).toBeInTheDocument()
    expect(screen.getByText('POST /api/v1/mapas')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  test('un error sin stack no muestra el botón de expandir detalle', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeError({ stack: null })], meta: { total: 1 } })
    renderPage()
    await screen.findByText('Connection timeout')
    expect(screen.queryByRole('button', { name: /Ver detalle/i })).not.toBeInTheDocument()
  })
})

describe('Errores — detalle expandible', () => {
  test('clic en el botón de detalle muestra el stack trace, otro clic lo oculta', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeError()], meta: { total: 1 } })
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Connection timeout')

    expect(screen.queryByText(/at foo\.js/)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Ver detalle/i }))
    expect(screen.getByText(/at foo\.js/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Ocultar detalle/i }))
    expect(screen.queryByText(/at foo\.js/)).not.toBeInTheDocument()
  })
})

describe('Errores — paginación', () => {
  test('anterior deshabilitado en página 1, avanzar pide el siguiente offset', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeError()], meta: { total: 25 } })
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Connection timeout')

    const [prev, next] = screen.getAllByRole('button').filter((b) =>
      b.querySelector('.lucide-chevron-left, .lucide-chevron-right'))
    expect(prev).toBeDisabled()

    await user.click(next)
    expect(screen.getByText('Página 2 de 3 · 25 errores total')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/admin/errores', { params: expect.objectContaining({ offset: 10 }) })
  })
})
