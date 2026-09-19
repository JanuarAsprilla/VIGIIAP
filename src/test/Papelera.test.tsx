import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Papelera from '@/pages/admin/Papelera'

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

vi.mock('@/lib/api', () => ({ default: { get: vi.fn(), patch: vi.fn(), delete: vi.fn() } }))
import api from '@/lib/api'

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><Papelera /></QueryClientProvider>)
}

function makeItem(overrides: Record<string, unknown> = {}) {
  return { id: 'mapa-1', titulo: 'Mapa del Chocó', deleted_at: '2026-09-01T10:00:00Z', ...overrides }
}

beforeEach(() => { vi.clearAllMocks() })

describe('Papelera — listado', () => {
  test('muestra los elementos eliminados con su fecha', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeItem()], meta: { total: 1, totalPages: 1 } })
    renderPage()
    expect(await screen.findByText('Mapa del Chocó')).toBeInTheDocument()
  })

  test('la papelera vacía muestra un mensaje explícito', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [], meta: { total: 0, totalPages: 1 } })
    renderPage()
    expect(await screen.findByText(/La papelera de mapas está vacía/i)).toBeInTheDocument()
  })

  test('un error de carga muestra el botón de reintentar', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('network fail'))
    renderPage()
    expect(await screen.findByText('No se pudo cargar la papelera.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Reintentar/i })).toBeInTheDocument()
  })

  test('cambiar a la pestaña Geovisores vuelve a pedir con tipo=geovisor', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [], meta: { total: 0, totalPages: 1 } })
    const user = userEvent.setup()
    renderPage()
    await screen.findByText(/La papelera de mapas está vacía/i)

    await user.click(screen.getByRole('button', { name: /Geovisores/i }))

    await waitFor(() => {
      const calls = vi.mocked(api.get).mock.calls
      const lastCall = calls[calls.length - 1]
      expect(lastCall?.[1]).toMatchObject({ params: expect.objectContaining({ tipo: 'geovisor' }) })
    })
  })
})

describe('Papelera — restaurar', () => {
  test('restaurar llama a PATCH con la url correcta y muestra un toast', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeItem()], meta: { total: 1, totalPages: 1 } })
    vi.mocked(api.patch).mockResolvedValue({ message: 'mapa restaurado correctamente' })
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Mapa del Chocó')

    await user.click(screen.getByRole('button', { name: /Restaurar/i }))

    expect(api.patch).toHaveBeenCalledWith('/admin/papelera/mapa/mapa-1/restaurar')
    expect(await screen.findByText(/restaurado correctamente/i)).toBeInTheDocument()
  })
})

describe('Papelera — eliminar permanentemente', () => {
  test('el botón Eliminar abre un diálogo de confirmación antes de purgar', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeItem()], meta: { total: 1, totalPages: 1 } })
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Mapa del Chocó')

    await user.click(screen.getByRole('button', { name: /Eliminar/i }))

    expect(screen.getByText('Eliminar permanentemente')).toBeInTheDocument()
    expect(api.delete).not.toHaveBeenCalled()
  })

  test('cancelar el diálogo no llama a la purga', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeItem()], meta: { total: 1, totalPages: 1 } })
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Mapa del Chocó')

    await user.click(screen.getByRole('button', { name: /Eliminar/i }))
    await user.click(screen.getByRole('button', { name: /Cancelar/i }))

    expect(api.delete).not.toHaveBeenCalled()
    expect(screen.queryByText('Eliminar permanentemente')).not.toBeInTheDocument()
  })

  test('confirmar la purga llama a DELETE con la url correcta y muestra un toast', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeItem()], meta: { total: 1, totalPages: 1 } })
    vi.mocked(api.delete).mockResolvedValue({ message: 'mapa eliminado permanentemente' })
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Mapa del Chocó')

    await user.click(screen.getByRole('button', { name: /Eliminar/i }))
    await user.click(screen.getByRole('button', { name: /Sí, eliminar/i }))

    expect(api.delete).toHaveBeenCalledWith('/admin/papelera/mapa/mapa-1')
    expect(await screen.findByText(/eliminado permanentemente/i)).toBeInTheDocument()
  })

  test('si el servidor rechaza la purga, muestra un toast de error', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeItem()], meta: { total: 1, totalPages: 1 } })
    vi.mocked(api.delete).mockRejectedValue(new Error('fail'))
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Mapa del Chocó')

    await user.click(screen.getByRole('button', { name: /Eliminar/i }))
    await user.click(screen.getByRole('button', { name: /Sí, eliminar/i }))

    expect(await screen.findByText('fail')).toBeInTheDocument()
  })
})

describe('Papelera — categorías usan nombre como clave', () => {
  test('restaurar una categoría usa el nombre, no un id, en la url', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [{ nombre: 'Biodiversidad', deleted_at: '2026-09-01T10:00:00Z' }],
      meta: { total: 1, totalPages: 1 },
    })
    vi.mocked(api.patch).mockResolvedValue({ message: 'categoria restaurada correctamente' })
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /Categorías/i }))
    await screen.findByText('Biodiversidad')
    await user.click(screen.getByRole('button', { name: /Restaurar/i }))

    expect(api.patch).toHaveBeenCalledWith('/admin/papelera/categoria/Biodiversidad/restaurar')
  })
})
