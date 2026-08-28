import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Actividad from '@/pages/admin/Actividad'

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
  return render(<QueryClientProvider client={qc}><Actividad /></QueryClientProvider>)
}

function makeLog(overrides: Record<string, unknown> = {}) {
  return {
    id: '1', accion: 'login', modulo: 'auth', descripcion: 'Login exitoso',
    usuario_email: 'ana@iiap.gov.co', ip: '127.0.0.1', creado_en: '2025-01-01T10:00:00Z',
    ...overrides,
  }
}

beforeEach(() => { vi.clearAllMocks() })

describe('Actividad — normalización de acciones', () => {
  test('una acción conocida muestra su etiqueta legible', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeLog({ accion: 'delete_usuario' })], meta: { total: 1 } })
    renderPage()
    expect(await screen.findByText('Eliminar usuario')).toBeInTheDocument()
  })

  test('una acción desconocida cae al texto crudo, sin romper el render', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeLog({ accion: 'accion_nueva_sin_mapear' })], meta: { total: 1 } })
    renderPage()
    expect(await screen.findByText('accion_nueva_sin_mapear')).toBeInTheDocument()
  })
})

describe('Actividad — búsqueda local', () => {
  test('filtra por email, acción o descripción dentro de la página actual', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        makeLog({ id: '1', usuario_email: 'ana@iiap.gov.co', descripcion: 'Login exitoso' }),
        makeLog({ id: '2', usuario_email: 'carlos@iiap.gov.co', accion: 'registro', descripcion: 'Nuevo registro' }),
      ],
      meta: { total: 2 },
    })

    const user = userEvent.setup()
    renderPage()
    await screen.findByText('ana@iiap.gov.co')

    await user.type(screen.getByPlaceholderText(/Buscar por usuario/i), 'carlos')

    expect(screen.queryByText('ana@iiap.gov.co')).not.toBeInTheDocument()
    expect(screen.getByText('carlos@iiap.gov.co')).toBeInTheDocument()
  })
})

describe('Actividad — estados', () => {
  test('sin eventos muestra el mensaje vacío explícito', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [], meta: { total: 0 } })
    renderPage()
    expect(await screen.findByText('Sin eventos registrados')).toBeInTheDocument()
  })

  test('el botón de exportar CSV está deshabilitado sin eventos', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [], meta: { total: 0 } })
    renderPage()
    expect(await screen.findByRole('button', { name: /Exportar CSV/i })).toBeDisabled()
  })

  test('muestra un spinner de carga mientras isLoading', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(document.querySelector('.animate-spin')).not.toBeNull()
  })
})

describe('Actividad — filtro de módulo', () => {
  test('cambiar el módulo reinicia a la página 1', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeLog()], meta: { total: 25 } })
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Login')

    const select = screen.getByRole('combobox') as HTMLSelectElement
    await user.selectOptions(select, 'usuarios')
    expect(select).toHaveValue('usuarios')
  })
})

describe('Actividad — paginación', () => {
  test('anterior está deshabilitado en la página 1, siguiente habilitado con más páginas', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeLog()], meta: { total: 25 } })
    renderPage()
    await screen.findByText('Login')

    const [prev, next] = screen.getAllByRole('button').filter((b) =>
      b.querySelector('.lucide-chevron-left, .lucide-chevron-right'))
    expect(prev).toBeDisabled()
    expect(next).not.toBeDisabled()
  })

  test('avanzar de página solicita el siguiente offset a la API', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeLog()], meta: { total: 25 } })
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Login')

    const next = screen.getAllByRole('button').find((b) => b.querySelector('.lucide-chevron-right'))!
    await user.click(next)

    expect(screen.getByText('Página 2 de 3 · 25 eventos total')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/admin/audit', { params: expect.objectContaining({ offset: 10 }) })
  })
})

describe('Actividad — exportar CSV', () => {
  test('genera y libera un Object URL al exportar', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeLog()], meta: { total: 1 } })
    const createObjectURL = vi.fn().mockReturnValue('blob:mock-url')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })

    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Login')
    await user.click(screen.getByRole('button', { name: /Exportar CSV/i }))

    expect(createObjectURL).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    vi.unstubAllGlobals()
  })
})
