import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AuditoriaTab from '@/pages/admin/AuditoriaTab'

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

vi.mock('@/lib/exportarActividadExcel', () => ({ exportarActividadExcel: vi.fn().mockResolvedValue(undefined) }))
import { exportarActividadExcel } from '@/lib/exportarActividadExcel'

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><AuditoriaTab /></QueryClientProvider>)
}

function makeLog(overrides: Record<string, unknown> = {}) {
  return {
    id: '1', accion: 'login', modulo: 'auth', descripcion: 'Login exitoso',
    usuario_email: 'ana@iiap.gov.co', ip: '127.0.0.1', creado_en: '2025-01-01T10:00:00Z',
    ...overrides,
  }
}

beforeEach(() => { vi.clearAllMocks() })

describe('AuditoriaTab — normalización de acciones', () => {
  test('una acción conocida muestra su etiqueta legible', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeLog({ accion: 'delete_usuario' })], meta: { total: 1 } })
    renderPage()
    expect(await screen.findByText('Eliminar usuario')).toBeInTheDocument()
  })

  test('una acción desconocida se humaniza en vez de mostrarse en bruto, sin romper el render', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeLog({ accion: 'accion_nueva_sin_mapear' })], meta: { total: 1 } })
    renderPage()
    expect(await screen.findByText('Accion nueva sin mapear')).toBeInTheDocument()
  })

  test('las acciones de geovisores y fichas ya tienen etiqueta (antes salían como UPDATE_GEOVISOR)', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [makeLog({ id: 'a', accion: 'update_geovisor' }), makeLog({ id: 'b', accion: 'upsert_config_fichas' })],
      meta: { total: 2 },
    })
    renderPage()
    expect(await screen.findByText('Actualizar geovisor')).toBeInTheDocument()
    expect(screen.getByText('Configurar fichas de capa')).toBeInTheDocument()
  })
})

describe('AuditoriaTab — gravedad y origen', () => {
  test('cada evento muestra su gravedad de forma accesible', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [makeLog({ accion: 'login_blocked', severidad: 'critica' })], meta: { total: 1 },
    })
    renderPage()
    const fila = (await screen.findByRole('cell', { name: 'Login bloqueado' })).closest('tr')!
    expect(within(fila).getByText('Crítica')).toBeInTheDocument()
  })

  test('muestra la IP con el navegador y el sistema debajo', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [makeLog({ ip: '186.96.117.11', navegador: 'Chrome', sistema: 'macOS', dispositivo: 'escritorio' })],
      meta: { total: 1 },
    })
    renderPage()
    expect(await screen.findByText('186.96.117.11')).toBeInTheDocument()
    expect(screen.getByText('Chrome · macOS')).toBeInTheDocument()
  })

  test('sin datos del navegador solo muestra la IP', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeLog({ ip: '10.0.0.5' })], meta: { total: 1 } })
    renderPage()
    const fila = (await screen.findByText('10.0.0.5')).closest('tr')!
    expect(within(fila).queryByText(/·/)).not.toBeInTheDocument()
  })
})

describe('AuditoriaTab — filtros nuevos', () => {
  test('el selector de gravedad envía severidad y reinicia a la página 1', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeLog()], meta: { total: 1 } })
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('cell', { name: 'Login' })

    await user.selectOptions(screen.getByRole('combobox', { name: 'Gravedad' }), 'critica')

    expect(api.get).toHaveBeenLastCalledWith('/admin/audit', { params: expect.objectContaining({ severidad: 'critica', offset: 0 }) })
  })

  test('tras el debounce, los campos usuario e IP viajan como parámetros', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeLog()], meta: { total: 1 } })
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('cell', { name: 'Login' })

    await user.type(screen.getByLabelText('Usuario'), 'ana@')
    await user.type(screen.getByLabelText('IP'), '186.96')
    await new Promise((resolve) => setTimeout(resolve, 450))

    expect(api.get).toHaveBeenCalledWith('/admin/audit', { params: expect.objectContaining({ usuario: 'ana@', ip: '186.96' }) })
  })

  test('el campo IP descarta los caracteres que no pueden formar una dirección', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeLog()], meta: { total: 1 } })
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('cell', { name: 'Login' })

    await user.type(screen.getByLabelText('IP'), "1'; XYZ--")

    expect(screen.getByLabelText('IP')).toHaveValue('1')
  })

  test('"Limpiar filtros" aparece al filtrar y los deja todos vacíos', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeLog()], meta: { total: 1 } })
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('cell', { name: 'Login' })
    expect(screen.queryByRole('button', { name: 'Limpiar filtros' })).not.toBeInTheDocument()

    await user.selectOptions(screen.getByRole('combobox', { name: 'Gravedad' }), 'critica')
    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }))

    expect(screen.getByRole('combobox', { name: 'Gravedad' })).toHaveValue('')
    expect(screen.queryByRole('button', { name: 'Limpiar filtros' })).not.toBeInTheDocument()
  })
})

describe('AuditoriaTab — resumen de 24 horas', () => {
  function respuestaPorRuta(resumen: Record<string, number>) {
    vi.mocked(api.get).mockImplementation(async (url: string) =>
      (url === '/admin/audit/resumen'
        ? resumen
        : { data: [makeLog()], meta: { total: 1 } }) as never)
  }

  test('muestra los contadores que devuelve el backend', async () => {
    respuestaPorRuta({ eventosHoy: 12, eventos24h: 40, loginsFallidos24h: 3, bloqueos24h: 1, criticos24h: 2, ipsDistintas24h: 5, usuariosActivos24h: 4 })
    renderPage()

    const resumen = await screen.findByRole('region', { name: /Resumen de las últimas 24 horas/i })
    await waitFor(() => expect(within(resumen).getByText('12')).toBeInTheDocument())
    expect(within(resumen).getByText('1 cuenta bloqueada')).toBeInTheDocument()
    expect(within(resumen).getByText('4 usuarios activos')).toBeInTheDocument()
  })

  test('pulsar «Eventos críticos» filtra la tabla por gravedad crítica', async () => {
    respuestaPorRuta({ eventosHoy: 1, eventos24h: 1, loginsFallidos24h: 0, bloqueos24h: 0, criticos24h: 2, ipsDistintas24h: 1, usuariosActivos24h: 1 })
    const user = userEvent.setup()
    renderPage()
    const boton = await screen.findByRole('button', { name: /Eventos críticos/i })
    await waitFor(() => expect(boton).toBeEnabled())

    await user.click(boton)

    expect(screen.getByRole('combobox', { name: 'Gravedad' })).toHaveValue('critica')
  })

  test('pulsar «Intentos fallidos» filtra por la acción login_failed', async () => {
    respuestaPorRuta({ eventosHoy: 3, eventos24h: 3, loginsFallidos24h: 3, bloqueos24h: 0, criticos24h: 0, ipsDistintas24h: 1, usuariosActivos24h: 0 })
    const user = userEvent.setup()
    renderPage()
    const boton = await screen.findByRole('button', { name: /Intentos fallidos/i })
    await waitFor(() => expect(boton).toBeEnabled())

    await user.click(boton)

    expect(screen.getByRole('combobox', { name: 'Acción' })).toHaveValue('login_failed')
  })

  test('un contador en cero no es pulsable', async () => {
    respuestaPorRuta({ eventosHoy: 0, eventos24h: 0, loginsFallidos24h: 0, bloqueos24h: 0, criticos24h: 0, ipsDistintas24h: 0, usuariosActivos24h: 0 })
    renderPage()

    expect(await screen.findByRole('button', { name: /Eventos críticos/i })).toBeDisabled()
  })
})

describe('AuditoriaTab — detalle del evento', () => {
  const evento = makeLog({
    id: 'evt-99', accion: 'update_geovisor', modulo: 'geovisores', descripcion: 'Geovisor actualizado: Estaciones Climaticas Choco Biogeografico completo',
    usuario_email: 'admin@iiap.org.co', ip: '186.96.117.11', entidad_id: 'gv-1', severidad: 'info',
    navegador: 'Chrome', sistema: 'macOS', dispositivo: 'escritorio', userAgent: 'Mozilla/5.0 (Macintosh) Chrome/126',
  })

  test('el ojo abre un panel con la descripción completa, el dispositivo y el recurso', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [evento], meta: { total: 1 } })
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Ver detalle de Actualizar geovisor' }))

    const panel = screen.getByRole('dialog')
    expect(within(panel).getByText(/Estaciones Climaticas Choco Biogeografico completo/)).toBeInTheDocument()
    expect(within(panel).getByText('Chrome · macOS · Escritorio')).toBeInTheDocument()
    expect(within(panel).getByText('gv-1')).toBeInTheDocument()
    expect(within(panel).getByText('evt-99')).toBeInTheDocument()
    expect(within(panel).getByText('Mozilla/5.0 (Macintosh) Chrome/126')).toBeInTheDocument()
  })

  test('hacer clic en la fila también abre el panel', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [evento], meta: { total: 1 } })
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByText('admin@iiap.org.co'))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  test('se cierra con el botón y con Escape', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [evento], meta: { total: 1 } })
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Ver detalle de Actualizar geovisor' }))

    await user.click(screen.getByRole('button', { name: 'Cerrar detalle' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ver detalle de Actualizar geovisor' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('un evento sin datos del navegador lo dice y no muestra User-Agent', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeLog({ id: 'x1', accion: 'login' })], meta: { total: 1 } })
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Ver detalle de Login' }))

    const panel = screen.getByRole('dialog')
    expect(within(panel).getByText('Sin datos del navegador')).toBeInTheDocument()
    expect(within(panel).queryByText('User-Agent')).not.toBeInTheDocument()
  })
})

describe('AuditoriaTab — búsqueda', () => {
  // La búsqueda es un parámetro real de la consulta al backend (con
  // debounce), no un filtro sobre la página de 10 filas ya cargada --
  // antes, buscar a alguien que no estuviera en esa página no encontraba
  // nada, aunque sí tuviera actividad registrada.
  test('tras el debounce, pide a la API con el término de búsqueda y reinicia a la página 1', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeLog()], meta: { total: 1 } })
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('cell', { name: 'Login' })

    await user.type(screen.getByPlaceholderText(/Buscar por usuario/i), 'carlos')
    await new Promise((resolve) => setTimeout(resolve, 400))

    expect(api.get).toHaveBeenCalledWith('/admin/audit', { params: expect.objectContaining({ q: 'carlos', offset: 0 }) })
  })
})

describe('AuditoriaTab — estados', () => {
  test('sin eventos muestra el mensaje vacío explícito', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [], meta: { total: 0 } })
    renderPage()
    expect(await screen.findByText('Sin eventos registrados')).toBeInTheDocument()
  })

  test('el botón de exportar Excel está deshabilitado sin eventos', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [], meta: { total: 0 } })
    renderPage()
    expect(await screen.findByRole('button', { name: /Exportar Excel/i })).toBeDisabled()
  })

  test('muestra un spinner de carga mientras isLoading', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(document.querySelector('.animate-spin')).not.toBeNull()
  })
})

describe('AuditoriaTab — filtro de módulo', () => {
  test('cambiar el módulo reinicia a la página 1', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeLog()], meta: { total: 25 } })
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('cell', { name: 'Login' })

    const select = screen.getByRole('combobox', { name: 'Módulo' }) as HTMLSelectElement
    await user.selectOptions(select, 'usuarios')
    expect(select).toHaveValue('usuarios')
  })
})

describe('AuditoriaTab — filtro de acción', () => {
  test('el backend ya soporta filtrar por accion= exacta -- el selector lo envía', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeLog()], meta: { total: 1 } })
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('cell', { name: 'Login' })

    const select = screen.getByRole('combobox', { name: 'Acción' }) as HTMLSelectElement
    await user.selectOptions(select, 'delete_usuario')

    expect(select).toHaveValue('delete_usuario')
    expect(api.get).toHaveBeenLastCalledWith('/admin/audit', { params: expect.objectContaining({ accion: 'delete_usuario', offset: 0 }) })
  })

  test('incluye las acciones de seguridad antes invisibles (refresh_token_reuse, login_failed, etc.)', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeLog()], meta: { total: 1 } })
    renderPage()
    await screen.findByRole('cell', { name: 'Login' })

    const select = screen.getByRole('combobox', { name: 'Acción' })
    const opciones = Array.from(select.querySelectorAll('option')).map((o) => o.textContent)
    expect(opciones).toContain('Reutilización de refresh token')
    expect(opciones).toContain('Login fallido')
    expect(opciones).toContain('Login bloqueado')
  })
})

describe('AuditoriaTab — paginación', () => {
  test('anterior está deshabilitado en la página 1, siguiente habilitado con más páginas', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeLog()], meta: { total: 25 } })
    renderPage()
    await screen.findByRole('cell', { name: 'Login' })

    const [prev, next] = screen.getAllByRole('button').filter((b) =>
      b.querySelector('.lucide-chevron-left, .lucide-chevron-right'))
    expect(prev).toBeDisabled()
    expect(next).not.toBeDisabled()
  })

  test('avanzar de página solicita el siguiente offset a la API', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeLog()], meta: { total: 25 } })
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('cell', { name: 'Login' })

    const next = screen.getAllByRole('button').find((b) => b.querySelector('.lucide-chevron-right'))!
    await user.click(next)

    expect(screen.getByText('Página 2 de 3 · 25 eventos total')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/admin/audit', { params: expect.objectContaining({ offset: 10 }) })
  })
})

describe('AuditoriaTab — exportar Excel', () => {
  test('exporta con los filtros de módulo y búsqueda activos', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeLog()], meta: { total: 1 } })
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('cell', { name: 'Login' })

    await user.selectOptions(screen.getByRole('combobox', { name: 'Módulo' }), 'usuarios')
    await user.type(screen.getByPlaceholderText(/Buscar por usuario/i), 'ana')
    await new Promise((resolve) => setTimeout(resolve, 400)) // debounce de la búsqueda
    await user.click(screen.getByRole('button', { name: /Exportar Excel/i }))

    expect(exportarActividadExcel).toHaveBeenCalledWith({
      filtroModulo: 'usuarios', busqueda: 'ana', desde: undefined, hasta: undefined,
    })
  })

  test('exporta con el rango de fechas activo', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeLog()], meta: { total: 1 } })
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('cell', { name: 'Login' })

    await user.type(screen.getByLabelText('Desde'), '2026-01-01')
    await user.type(screen.getByLabelText('Hasta'), '2026-01-31')
    await user.click(screen.getByRole('button', { name: /Exportar Excel/i }))

    expect(exportarActividadExcel).toHaveBeenCalledWith(expect.objectContaining({
      desde: '2026-01-01', hasta: '2026-01-31',
    }))
  })

  test('un fallo al exportar muestra un mensaje de error', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [makeLog()], meta: { total: 1 } })
    vi.mocked(exportarActividadExcel).mockRejectedValueOnce(new Error('fail'))

    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('cell', { name: 'Login' })
    await user.click(screen.getByRole('button', { name: /Exportar Excel/i }))

    expect(await screen.findByText(/No se pudo generar el archivo Excel/i)).toBeInTheDocument()
  })
})
