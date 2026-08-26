import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Configuracion from '@/pages/admin/Configuracion'

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

vi.mock('@/lib/api', () => ({ default: { get: vi.fn(), put: vi.fn() } }))
import api from '@/lib/api'

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={qc}><Configuracion /></QueryClientProvider>)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.get).mockResolvedValue({ data: {} })
})

describe('Configuracion — carga remota', () => {
  test('precarga los campos generales con la config remota', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { siteName: 'Portal de Prueba', modoMantenimiento: 'true', mensajeMantenimiento: 'En mantenimiento' },
    })

    renderPage()

    expect(await screen.findByDisplayValue('Portal de Prueba')).toBeInTheDocument()
    expect(await screen.findByText('Mensaje de mantenimiento')).toBeInTheDocument()
  })
})

describe('Configuracion — guardar', () => {
  test('guardar exitosamente muestra "¡Guardado!" y luego vuelve al estado normal', async () => {
    vi.mocked(api.put).mockResolvedValue({})
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /Guardar Cambios/i }))

    expect(await screen.findByRole('button', { name: /¡Guardado!/i })).toBeInTheDocument()
    expect(api.put).toHaveBeenCalledWith('/admin/configuracion', expect.objectContaining({
      modoMantenimiento: 'false',
    }))
  })

  test('un fallo al guardar muestra "Error al guardar"', async () => {
    vi.mocked(api.put).mockRejectedValue(new Error('fail'))
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /Guardar Cambios/i }))

    expect(await screen.findByRole('button', { name: /Error al guardar/i })).toBeInTheDocument()
  })
})

describe('Configuracion — modo mantenimiento', () => {
  test('activar el modo mantenimiento revela el campo de mensaje', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.queryByLabelText('Mensaje de mantenimiento')).not.toBeInTheDocument()

    const section = screen.getByText('Activar modo mantenimiento').closest('.flex.items-center.justify-between')!
    const toggle = section.querySelector('div[class*="w-10"]') as HTMLElement
    await user.click(toggle)

    await waitFor(() => expect(screen.getByLabelText('Mensaje de mantenimiento')).toBeInTheDocument())
  })
})
