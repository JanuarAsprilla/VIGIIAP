import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
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

vi.mock('@/lib/api', () => ({ default: { get: vi.fn(), patch: vi.fn() } }))
import api from '@/lib/api'

vi.mock('react-chartjs-2', () => ({
  Doughnut: () => <div data-testid="doughnut-chart" />,
  Bar: () => <div data-testid="bar-chart" />,
}))

interface MockUser { rol: string; modulos?: { modulo: string; puede_ver: boolean; puede_editar: boolean }[] }
const authMock: { user: MockUser | null } = { user: { rol: 'super_admin' } }
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authMock }))

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

beforeEach(() => {
  vi.clearAllMocks()
  authMock.user = { rol: 'super_admin' }
  vi.mocked(api.patch).mockResolvedValue(undefined)
})

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
    // Aparece dos veces con un solo error: en la fila y en la tarjeta "más
    // frecuente" del resumen (inevitable cuando solo hay un error cargado).
    expect(await screen.findAllByText('Connection timeout')).toHaveLength(2)
    expect(screen.getByText('/api/v1/mapas')).toBeInTheDocument()
    expect(screen.getByText('POST')).toBeInTheDocument()
    expect(screen.getByText('3 veces')).toBeInTheDocument()
  })

  test('un error sin stack no tiene la fila expandible', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeError({ stack: null })], meta: { total: 1 } })
    renderPage()
    const [filaBtn] = await screen.findAllByRole('button', { name: /Connection timeout/i })
    expect(filaBtn).toBeDisabled()
    expect(filaBtn).not.toHaveAttribute('aria-expanded')
  })
})

describe('Errores — detalle expandible', () => {
  test('clic en la fila muestra el stack trace, otro clic lo oculta', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeError()], meta: { total: 1 } })
    const user = userEvent.setup()
    renderPage()
    const [filaBtn] = await screen.findAllByRole('button', { name: /Connection timeout/i })

    expect(screen.queryByText(/at foo\.js/)).not.toBeInTheDocument()

    await user.click(filaBtn)
    expect(screen.getByText(/at foo\.js/)).toBeInTheDocument()

    await user.click(filaBtn)
    expect(screen.queryByText(/at foo\.js/)).not.toBeInTheDocument()
  })

  test('el botón de copiar detalle muestra confirmación tras copiar', async () => {
    // La aserción sobre el mock exacto de navigator.clipboard es frágil en
    // jsdom (@testing-library/user-event trae su propio shim de portapapeles
    // que puede tomar precedencia) -- se valida el comportamiento observable
    // (el botón cambia a "Copiado"), no la llamada interna a la Clipboard API.
    vi.mocked(api.get).mockResolvedValue({ data: [makeError()], meta: { total: 1 } })
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })
    const user = userEvent.setup()
    renderPage()
    const [filaBtn] = await screen.findAllByRole('button', { name: /Connection timeout/i })
    await user.click(filaBtn)

    expect(screen.getByRole('button', { name: /Copiar detalle/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Copiar detalle/i }))
    expect(await screen.findByText('Copiado')).toBeInTheDocument()
  })
})

describe('Errores — paginación (client-side, sobre el registro completo)', () => {
  function makeErrores(n: number) {
    return Array.from({ length: n }, (_, i) => makeError({ id: i + 1, mensaje: `Error ${i + 1}`, ruta: `/api/v1/ruta-${i + 1}` }))
  }

  test('pide el registro completo de una sola vez, sin offset', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: makeErrores(3), meta: { total: 3 } })
    renderPage()
    await screen.findByText('/api/v1/ruta-1')
    expect(api.get).toHaveBeenCalledWith('/admin/errores', { params: { limit: 200 } })
  })

  test('anterior deshabilitado en página 1, avanzar muestra la siguiente página', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: makeErrores(25), meta: { total: 25 } })
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('/api/v1/ruta-1')

    const [prev, next] = screen.getAllByRole('button').filter((b) =>
      b.querySelector('.lucide-chevron-left, .lucide-chevron-right'))
    expect(prev).toBeDisabled()

    await user.click(next)
    expect(screen.getByText('Página 2 de 3 · 25 errores total')).toBeInTheDocument()
    expect(screen.queryByText('/api/v1/ruta-1')).not.toBeInTheDocument()
    expect(screen.getByText('/api/v1/ruta-11')).toBeInTheDocument()
  })
})

describe('Errores — filtro por severidad', () => {
  test('el filtro "Críticos" muestra solo errores 5xx', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        makeError({ id: 1, mensaje: 'Fallo del servidor', status_code: 500 }),
        makeError({ id: 2, mensaje: 'Petición inválida', status_code: 400 }),
      ],
      meta: { total: 2 },
    })
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Fallo del servidor')

    await user.click(screen.getByRole('button', { name: 'Críticos' }))

    expect(screen.getByRole('button', { name: /Fallo del servidor/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Petición inválida/i })).not.toBeInTheDocument()
  })

  test('volver a "Todos" restaura el listado completo', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        makeError({ id: 1, mensaje: 'Fallo del servidor', status_code: 500 }),
        makeError({ id: 2, mensaje: 'Petición inválida', status_code: 400 }),
      ],
      meta: { total: 2 },
    })
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Fallo del servidor')

    const grupoSeveridad = screen.getByRole('group', { name: 'Filtrar por severidad' })
    await user.click(within(grupoSeveridad).getByRole('button', { name: 'Críticos' }))
    await user.click(within(grupoSeveridad).getByRole('button', { name: 'Todos' }))

    expect(screen.getByRole('button', { name: /Petición inválida/i })).toBeInTheDocument()
  })
})

describe('Errores — gráficos', () => {
  test('muestra los gráficos de distribución y rutas cuando hay datos', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeError()], meta: { total: 1 } })
    renderPage()
    expect(await screen.findByText('Distribución por Severidad')).toBeInTheDocument()
    expect(screen.getByText('Rutas Más Afectadas')).toBeInTheDocument()
    expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument()
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  test('sin errores, no muestra la sección de gráficos', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [], meta: { total: 0 } })
    renderPage()
    await screen.findByText('Sin errores registrados')
    expect(screen.queryByText('Distribución por Severidad')).not.toBeInTheDocument()
  })
})

describe('Errores — resumen', () => {
  test('muestra críticos (5xx), ocurrencias totales y el error más frecuente', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        makeError({ id: 1, mensaje: 'Connection timeout', status_code: 500, ocurrencias: 5 }),
        makeError({ id: 2, mensaje: 'Petición inválida', status_code: 400, ocurrencias: 1, ruta: '/api/v1/documentos' }),
      ],
      meta: { total: 2 },
    })
    renderPage()
    await screen.findAllByText('Connection timeout')

    expect(screen.getByText('1')).toBeInTheDocument() // 1 crítico (5xx)
    expect(screen.getByText('6')).toBeInTheDocument() // 5 + 1 ocurrencias totales
    expect(screen.getByText('Más frecuente — 5×')).toBeInTheDocument()
  })

  test('el buscador filtra por mensaje o endpoint', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        makeError({ id: 1, mensaje: 'Connection timeout', ruta: '/api/v1/mapas' }),
        makeError({ id: 2, mensaje: 'Token inválido', ruta: '/api/v1/auth/login' }),
      ],
      meta: { total: 2 },
    })
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Connection timeout')

    await user.type(screen.getByLabelText(/Buscar error/i), 'auth')
    // El filtro solo afecta la lista de filas -- la tarjeta de resumen "más
    // frecuente" sigue mostrando el error más frecuente entre TODOS los
    // cargados, no solo los que coinciden con la búsqueda.
    expect(screen.queryByRole('button', { name: /Connection timeout/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Token inválido/i })).toBeInTheDocument()
  })
})

describe('Errores — estado de seguimiento', () => {
  test('un admin con permiso de editar puede cambiar el estado, y eso llama al PATCH', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [makeError({ estado: 'pendiente' })],
      meta: { total: 1 },
    })
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Connection timeout')

    const select = screen.getByLabelText('Estado del error')
    expect(select).toHaveValue('pendiente')

    await user.selectOptions(select, 'revisando')

    expect(api.patch).toHaveBeenCalledWith('/admin/errores/1/estado', { estado: 'revisando' })
  })

  test('un admin_sig sin permiso de editar "errores" ve un badge de solo lectura, no un select', async () => {
    authMock.user = { rol: 'admin_sig', modulos: [{ modulo: 'errores', puede_ver: true, puede_editar: false }] }
    vi.mocked(api.get).mockResolvedValue({
      data: [makeError({ estado: 'revisando' })],
      meta: { total: 1 },
    })
    renderPage()
    await screen.findAllByText('Connection timeout')

    expect(screen.queryByLabelText('Estado del error')).not.toBeInTheDocument()
    // "Revisando" también existe como botón de filtro -- se busca el badge (un <span>), no el botón.
    expect(screen.getByText('Revisando', { selector: 'span' })).toBeInTheDocument()
  })

  test('el filtro "Pendientes" muestra solo errores con ese estado', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        makeError({ id: 1, mensaje: 'Sin resolver', estado: 'pendiente' }),
        makeError({ id: 2, mensaje: 'Ya resuelto', estado: 'resuelto' }),
      ],
      meta: { total: 2 },
    })
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Sin resolver')

    const grupoEstado = screen.getByRole('group', { name: 'Filtrar por estado' })
    await user.click(within(grupoEstado).getByRole('button', { name: 'Pendientes' }))

    expect(screen.getByRole('button', { name: /Sin resolver/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Ya resuelto/i })).not.toBeInTheDocument()
  })

  test('el detalle expandido muestra quién y cuándo actualizó el estado, si aplica', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [makeError({
        estado: 'resuelto',
        estado_actualizado_por: 'admin@iiap.org.co',
        estado_actualizado_en: '2026-09-20T10:00:00Z',
      })],
      meta: { total: 1 },
    })
    const user = userEvent.setup()
    renderPage()
    const fila = await screen.findByRole('button', { name: /Connection timeout/i })

    await user.click(fila)

    expect(screen.getByText(/Estado actualizado por admin@iiap\.org\.co/)).toBeInTheDocument()
  })

  test('sin estado en la respuesta del backend, se asume "pendiente" por compatibilidad', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeError()], meta: { total: 1 } }) // sin campo estado
    renderPage()
    await screen.findAllByText('Connection timeout')

    expect(screen.getByLabelText('Estado del error')).toHaveValue('pendiente')
  })
})
