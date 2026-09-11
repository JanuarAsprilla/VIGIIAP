import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
    <QueryClientProvider client={qc}><Terminos /></QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Terminos — política de privacidad remota', () => {
  test('muestra la política editada por el super_admin cuando la API la devuelve', async () => {
    // api.get ya viene sin envolver (ver interceptor en src/lib/api.ts) —
    // este es el caso que antes se rompía por un `select: (res) => res.data`
    // que volvía a buscar `.data` sobre un objeto que ya no lo tenía.
    vi.mocked(api.get).mockResolvedValue({
      politicaPrivacidad: 'Texto personalizado de la política de datos del IIAP.',
    })

    renderPage()

    expect(await screen.findByText('Texto personalizado de la política de datos del IIAP.')).toBeInTheDocument()
  })

  test('usa el texto de respaldo si la API no trae política configurada', async () => {
    vi.mocked(api.get).mockResolvedValue({})

    renderPage()

    expect(await screen.findByText(/En cumplimiento de la Ley 1581 de 2012/)).toBeInTheDocument()
  })
})
