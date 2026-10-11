import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import Terminos from '@/pages/recursos/Terminos'

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
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}><Terminos /></QueryClientProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Terminos — condiciones de uso (política de privacidad vive en su propia página)', () => {
  test('muestra los términos editados por el super_admin cuando la API los devuelve', async () => {
    vi.mocked(api.get).mockResolvedValue({
      terminosUso: 'Términos de uso personalizados del IIAP.',
    })

    renderPage()

    expect(await screen.findByText('Términos de uso personalizados del IIAP.')).toBeInTheDocument()
  })

  test('usa el texto de respaldo si la API no trae términos configurados', async () => {
    vi.mocked(api.get).mockResolvedValue({})

    renderPage()

    expect(await screen.findByText(/Al acceder y utilizar la plataforma VIGIA-IIAP/)).toBeInTheDocument()
  })

  test('enlaza a /politica-privacidad en vez de embeber el texto de la política', async () => {
    vi.mocked(api.get).mockResolvedValue({})

    renderPage()
    await screen.findByText(/Al acceder y utilizar la plataforma VIGIA-IIAP/)

    const link = screen.getByRole('link', { name: 'Política de Privacidad' })
    expect(link).toHaveAttribute('href', '/politica-privacidad')
    expect(screen.queryByText(/En cumplimiento de la Ley 1581 de 2012/)).not.toBeInTheDocument()
  })
})
