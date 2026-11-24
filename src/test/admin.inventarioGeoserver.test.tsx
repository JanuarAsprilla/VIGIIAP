import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { createElement, type ReactNode } from 'react'
import InventarioGeoserver from '@/pages/admin/InventarioGeoserver'
import type { InventarioGeoserver as Inventario, SincronizacionInventario } from '@/types'

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

const authMock: { user: Record<string, unknown> | null } = { user: null }
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authMock }))

vi.mock('@/hooks/useConexionesGeoserver', () => ({
  useInventarioGeoserver: vi.fn(),
  useSincronizarConexionGeoserver: vi.fn(),
  useConexionesSeleccionables: vi.fn(),
}))
import { useInventarioGeoserver, useSincronizarConexionGeoserver, useConexionesSeleccionables } from '@/hooks/useConexionesGeoserver'

const AHORA = Date.parse('2026-11-24T12:00:00Z')
const haceMin = (m: number) => new Date(AHORA - m * 60_000).toISOString()

function sync(over: Partial<SincronizacionInventario> = {}): SincronizacionInventario {
  return {
    iniciada_en: haceMin(6), terminada_en: haceMin(5), estado: 'ok', fuente: 'rest+ogc',
    resumen: { capas: { nuevos: 2, cambiados: 1, eliminados: 0 }, grupos: { nuevos: 1 } }, error: null, ...over,
  }
}

function inventario(over: Partial<Inventario> = {}): Inventario {
  return {
    sincronizacion: sync(),
    espacios: [
      { nombre: 't_15_geologia', namespace_uri: 'http://geo', titulo: 'Geología del Chocó', resumen: null, capas: 2, grupos: 1 },
      { nombre: 't_20_suelos', namespace_uri: null, titulo: null, resumen: null, capas: 1, grupos: 0 },
    ],
    capas: [
      { capa_id: 't_15_geologia:unidades', espacio: 't_15_geologia', nombre: 'unidades', titulo: 'Unidades geológicas', resumen: null, palabras_clave: null, tipo: 'vectorial', estilo_defecto: 'polygon', estilos: ['polygon'], bbox: null, habilitada: true, eliminado_en: null },
      { capa_id: 't_15_geologia:dem', espacio: 't_15_geologia', nombre: 'dem', titulo: null, resumen: null, palabras_clave: null, tipo: 'raster', estilo_defecto: null, estilos: null, bbox: null, habilitada: false, eliminado_en: null },
      { capa_id: 't_20_suelos:perfiles', espacio: 't_20_suelos', nombre: 'perfiles', titulo: 'Perfiles de suelo', resumen: null, palabras_clave: null, tipo: 'vectorial', estilo_defecto: 'point', estilos: null, bbox: null, habilitada: true, eliminado_en: '2026-11-20T10:00:00Z' },
    ],
    grupos: [
      { grupo_id: 't_15_geologia:base', espacio: 't_15_geologia', nombre: 'base', titulo: 'Geología base', resumen: null, modo: 'SINGLE', miembros: ['t_15_geologia:unidades', 't_15_geologia:dem'], bbox: null },
    ],
    estilos: [{ nombre: 'polygon', espacio: null, formato: 'sld' }, { nombre: 'point', espacio: 't_20_suelos', formato: 'css' }],
    ...over,
  }
}

function mockInventario(data: Inventario | undefined, extra: Record<string, unknown> = {}) {
  vi.mocked(useInventarioGeoserver).mockReturnValue({
    data, isPending: false, isError: false, error: null, refetch: vi.fn(), ...extra,
  } as unknown as ReturnType<typeof useInventarioGeoserver>)
}

const mutate = vi.fn()
function mockSincronizar(extra: Record<string, unknown> = {}) {
  vi.mocked(useSincronizarConexionGeoserver).mockReturnValue({
    mutate, isPending: false, error: null, data: undefined, ...extra,
  } as unknown as ReturnType<typeof useSincronizarConexionGeoserver>)
}

const adminSig = (editar: boolean) => ({
  rol: 'admin_sig',
  modulos: [{ modulo: 'geovisores', puede_ver: true, puede_editar: editar }],
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/conexiones-geoserver/c1/inventario']}>
      <Routes><Route path="/admin/conexiones-geoserver/:id/inventario" element={<InventarioGeoserver />} /></Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(AHORA)
  authMock.user = adminSig(true)
  mockInventario(inventario())
  mockSincronizar()
  vi.mocked(useConexionesSeleccionables).mockReturnValue({
    data: [{ id: 'c1', nombre: 'GeoServer institucional', tipo: 'propio', activo: true, capas_nuevas_auto: true }],
  } as unknown as ReturnType<typeof useConexionesSeleccionables>)
})

afterEach(() => vi.useRealTimers())

describe('InventarioGeoserver — estado de la sincronización', () => {
  test('ok: muestra estado, fuente, antigüedad y el resumen de cambios', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: /Inventario de GeoServer/ })).toBeInTheDocument()
    expect(screen.getByText('GeoServer institucional')).toBeInTheDocument()
    expect(screen.getByText('Completa')).toBeInTheDocument()
    expect(screen.getByText('API REST + OGC')).toBeInTheDocument()
    expect(screen.getByText('Actualizado hace 5 min')).toBeInTheDocument()
    const capas = screen.getByRole('group', { name: 'Cambios en Capas' })
    expect(capas).toHaveTextContent('2 nuevas')
    expect(capas).toHaveTextContent('1 cambiada')
    expect(screen.queryByText(/La API REST de GeoServer no está disponible/)).not.toBeInTheDocument()
  })

  test('parcial: el estado se dice con texto', () => {
    mockInventario(inventario({ sincronizacion: sync({ estado: 'parcial' }) }))
    renderPage()
    expect(screen.getByText('Parcial')).toBeInTheDocument()
  })

  test('error: muestra el estado y el mensaje de error', () => {
    mockInventario(inventario({ sincronizacion: sync({ estado: 'error', error: 'GeoServer no respondió a tiempo' }) }))
    renderPage()
    expect(screen.getByText('Con error')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('GeoServer no respondió a tiempo')
  })

  test('solo OGC: nombra la fuente y explica qué falta y qué pedir', () => {
    mockInventario(inventario({ sincronizacion: sync({ fuente: 'ogc' }) }))
    renderPage()
    expect(screen.getByText('Solo OGC (sin API REST)')).toBeInTheDocument()
    expect(screen.getByText('La API REST de GeoServer no está disponible con esta cuenta: no se ven espacios de trabajo con título ni grupos no publicados. Pide a quien administra GeoServer una cuenta de solo lectura para la API REST.')).toBeInTheDocument()
  })

  test('sin ninguna sincronización lo dice y no inventa tablas con datos', () => {
    mockInventario({ sincronizacion: null, espacios: [], capas: [], grupos: [], estilos: [] })
    renderPage()
    expect(screen.getByText(/Esta conexión todavía no se ha sincronizado/)).toBeInTheDocument()
  })

  test('mientras carga anuncia «Cargando»', () => {
    mockInventario(undefined, { isPending: true })
    renderPage()
    expect(screen.getByRole('status', { name: /Cargando/ })).toBeInTheDocument()
  })

  test('si falla la carga muestra el error y permite reintentar', async () => {
    const refetch = vi.fn()
    mockInventario(undefined, { isError: true, error: new Error('Sin permiso'), refetch })
    renderPage()
    expect(screen.getByRole('alert')).toHaveTextContent('Sin permiso')
    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(refetch).toHaveBeenCalled()
  })
})

describe('InventarioGeoserver — sincronizar ahora', () => {
  test('llama a la sincronización de la conexión', async () => {
    renderPage()
    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByRole('button', { name: 'Sincronizar ahora' }))
    expect(mutate).toHaveBeenCalledWith('c1')
  })

  test('mientras corre queda deshabilitado y lo anuncia', () => {
    mockSincronizar({ isPending: true })
    renderPage()
    const boton = screen.getByRole('button', { name: /Sincronizando/ })
    expect(boton).toBeDisabled()
    expect(screen.getByRole('status', { name: 'Sincronización en curso' })).toBeInTheDocument()
  })

  test('al terminar anuncia el resultado', () => {
    mockSincronizar({ data: { estado: 'ok', fuente: 'rest+ogc', resumen: {}, duracion_ms: 1500 } })
    renderPage()
    expect(screen.getByRole('status', { name: 'Resultado de la sincronización' })).toHaveTextContent('Sincronización completa en 1,5 s')
  })

  test('el límite por minuto (429) se explica claramente', () => {
    mockSincronizar({ error: Object.assign(new Error('Esta conexión se puede sincronizar una vez por minuto. Espera un momento y vuelve a intentarlo.'), { status: 429 }) })
    renderPage()
    expect(screen.getByRole('alert', { name: 'Error al sincronizar' })).toHaveTextContent('una vez por minuto')
  })

  test('cualquier otro error se muestra tal cual', () => {
    mockSincronizar({ error: new Error('GeoServer no responde') })
    renderPage()
    expect(screen.getByRole('alert', { name: 'Error al sincronizar' })).toHaveTextContent('GeoServer no responde')
  })

  test('quien solo puede ver no tiene el botón y se le explica', () => {
    authMock.user = adminSig(false)
    renderPage()
    expect(screen.queryByRole('button', { name: /Sincronizar/ })).not.toBeInTheDocument()
    expect(screen.getByText(/Solo lectura/)).toBeInTheDocument()
    expect(screen.getByText('Completa')).toBeInTheDocument()
  })
})

describe('InventarioGeoserver — tablas de solo lectura', () => {
  test('las pestañas traen el conteo y la de espacios es la primera', () => {
    renderPage()
    const pestanas = screen.getAllByRole('tab').map((t) => t.textContent)
    expect(pestanas).toEqual(['Espacios de trabajo2', 'Capas2', 'Grupos1', 'Estilos2'])
    expect(screen.getByRole('tab', { name: /Espacios de trabajo/ })).toHaveAttribute('aria-selected', 'true')
  })

  test('espacios: nombre, título del servicio (o guion), capas y grupos', () => {
    renderPage()
    const tabla = screen.getByRole('table', { name: 'Espacios de trabajo' })
    const filas = within(tabla).getAllByRole('row')
    expect(filas[1]).toHaveTextContent('t_15_geologia')
    expect(filas[1]).toHaveTextContent('Geología del Chocó')
    expect(filas[2]).toHaveTextContent('t_20_suelos')
    expect(filas[2]).toHaveTextContent('—')
  })

  test('capas: oculta las eliminadas hasta activar «Incluir eliminados» y las marca', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderPage()
    await user.click(screen.getByRole('tab', { name: /Capas/ }))

    const tabla = screen.getByRole('table', { name: 'Capas' })
    expect(within(tabla).getAllByRole('row')).toHaveLength(3)
    expect(within(tabla).queryByText('Perfiles de suelo')).not.toBeInTheDocument()
    expect(within(tabla).getByText('Deshabilitada')).toBeInTheDocument()

    await user.click(screen.getByRole('switch', { name: 'Incluir eliminados' }))

    const eliminada = within(tabla).getByText('Perfiles de suelo').closest('tr') as HTMLElement
    expect(eliminada).toHaveTextContent('Eliminada')
    expect(eliminada).toHaveTextContent('point')
  })

  test('la búsqueda filtra la pestaña activa sin importar tildes y avisa cuando no hay coincidencias', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderPage()
    await user.click(screen.getByRole('tab', { name: /Capas/ }))

    await user.type(screen.getByRole('searchbox', { name: 'Buscar en el inventario' }), 'geologicas')
    const tabla = screen.getByRole('table', { name: 'Capas' })
    expect(within(tabla).getAllByRole('row')).toHaveLength(2)
    expect(within(tabla).getByText('Unidades geológicas')).toBeInTheDocument()
    expect(screen.getByText('1 de 2')).toBeInTheDocument()

    await user.clear(screen.getByRole('searchbox'))
    await user.type(screen.getByRole('searchbox'), 'zzz')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByText(/Nada coincide con «zzz»/)).toBeInTheDocument()
  })

  test('grupos: nombre, espacio, modo y miembros', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderPage()
    await user.click(screen.getByRole('tab', { name: /Grupos/ }))

    const fila = within(screen.getByRole('table', { name: 'Grupos de capas' })).getAllByRole('row')[1]
    expect(fila).toHaveTextContent('Geología base')
    expect(fila).toHaveTextContent('t_15_geologia')
    expect(fila).toHaveTextContent('SINGLE')
    expect(fila).toHaveTextContent('2 capas')
    expect(fila).toHaveTextContent('t_15_geologia:unidades')
  })

  test('estilos: nombre, espacio y formato', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderPage()
    await user.click(screen.getByRole('tab', { name: /Estilos/ }))

    const filas = within(screen.getByRole('table', { name: 'Estilos' })).getAllByRole('row')
    expect(filas[1]).toHaveTextContent('polygon')
    expect(filas[2]).toHaveTextContent('css')
  })

  test('una pestaña sin datos dice que está vacía en vez de mostrar una tabla vacía', async () => {
    mockInventario(inventario({ grupos: [] }))
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderPage()
    await user.click(screen.getByRole('tab', { name: /Grupos/ }))

    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByText('Esta conexión no tiene grupos de capas sincronizados.')).toBeInTheDocument()
  })

  test('las pestañas se recorren con las flechas del teclado', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderPage()
    screen.getByRole('tab', { name: /Espacios de trabajo/ }).focus()

    await user.keyboard('{ArrowRight}')

    expect(screen.getByRole('tab', { name: /Capas/ })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: /Capas/ })).toHaveFocus()
  })
})
