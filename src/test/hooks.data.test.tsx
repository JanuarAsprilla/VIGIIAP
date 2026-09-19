/**
 * Tests for the 9 data-fetching hooks.
 *
 * Strategy:
 *  - Mock @/lib/api so no real HTTP calls happen.
 *  - Wrap each renderHook with a fresh QueryClientProvider (no retries, no cache).
 *  - Assert the hook exposes the expected normalized shape and calls the right endpoint.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

// ─── Mock @/lib/api ───────────────────────────────────────────────────────────
vi.mock('@/lib/api', () => ({
  default: {
    get:    vi.fn(),
    post:   vi.fn(),
    put:    vi.fn(),
    patch:  vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true }),
  ROLES: {
    ADMIN:         'Administrador SIG',
    INVESTIGADOR:  'Investigador',
    TECNICO:       'Técnico',
    INSTITUCIONAL: 'Institucional',
    PUBLICO:       'Público',
  },
}))

import api from '@/lib/api'
import { useAdminStats, useDashboardTendencias } from '@/hooks/useStats'
import { useMapasList } from '@/hooks/useMapas'
import { useDocumentosList } from '@/hooks/useDocumentos'
import { useSolicitudesAdmin, useMisSolicitudes } from '@/hooks/useSolicitudes'
import { useUsuariosList } from '@/hooks/useUsuarios'
import { useCategoriasList } from '@/hooks/useCategorias'
import { useNotificaciones } from '@/hooks/useNotificaciones'
import { useTiposNotificacionList } from '@/hooks/useTiposNotificacion'
import { useNotificacionPrefs, useUpdateNotificacionPref } from '@/hooks/useNotificacionPrefs'
import { useCatalogue } from '@/hooks/useCatalogue'
import {
  useGeovisoresList, useGeovisoresPublico, useGeovisorPorSlug, useCapasDeGeovisor,
} from '@/hooks/useGeovisores'
import { useConexionesGeoserverList, useWorkspacesDeConexion } from '@/hooks/useConexionesGeoserver'

// ─── QueryClient wrapper (fresh per test, no retries) ─────────────────────────
function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: {
      queries:   { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: qc }, children)
}

// ─── useAdminStats ────────────────────────────────────────────────────────────
describe('useAdminStats', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('fetches admin stats from /admin/stats', async () => {
    const fakeStats = { mapas: 10, documentos: 25, solicitudes: 5, usuarios: 50 }
    vi.mocked(api.get).mockResolvedValue(fakeStats)

    const { result } = renderHook(() => useAdminStats(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(api.get).toHaveBeenCalledWith('/admin/stats')
    expect(result.current.data).toEqual(fakeStats)
  })

  test('exposes isLoading while fetching', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useAdminStats(), { wrapper: makeWrapper() })
    expect(result.current.isLoading).toBe(true)
  })

  test('exposes isError on API failure', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('500'))

    const { result } = renderHook(() => useAdminStats(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})


// ─── useDashboardTendencias ───────────────────────────────────────────────────
describe('useDashboardTendencias', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('fetches trend deltas from /admin/dashboard/tendencias', async () => {
    const fakeTendencias = {
      usuarios:    { serie7: [1,1,2,1,3,2,4], semanaActual: 14, semanaAnterior: 10, deltaPct: 40 },
      solicitudes: { serie7: [0,1,0,0,1,0,1], semanaActual: 3,  semanaAnterior: 3,  deltaPct: 0 },
      documentos:  { serie7: [0,0,0,1,0,0,0], semanaActual: 1,  semanaAnterior: 2,  deltaPct: -50 },
      mapas:       { serie7: [0,0,0,0,0,0,0], semanaActual: 0,  semanaAnterior: 0,  deltaPct: 0 },
    }
    vi.mocked(api.get).mockResolvedValue(fakeTendencias)

    const { result } = renderHook(() => useDashboardTendencias(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(api.get).toHaveBeenCalledWith('/admin/dashboard/tendencias')
    expect(result.current.data).toEqual(fakeTendencias)
  })

  test('exposes isLoading while fetching', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useDashboardTendencias(), { wrapper: makeWrapper() })
    expect(result.current.isLoading).toBe(true)
  })

  test('exposes isError on API failure', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('500'))
    const { result } = renderHook(() => useDashboardTendencias(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  test('respects the enabled flag', () => {
    const { result } = renderHook(() => useDashboardTendencias(false), { wrapper: makeWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
    expect(api.get).not.toHaveBeenCalled()
  })
})

// ─── useMapasList ─────────────────────────────────────────────────────────────
describe('useMapasList', () => {
  beforeEach(() => { vi.clearAllMocks() })

  const rawMap = {
    id: 1, slug: 'mapa-1', titulo: 'Mapa Test', categoria: 'Biodiversidad',
    anio: 2024, descripcion: 'Desc', thumbnail_url: null,
    archivo_pdf_url: 'https://example.com/mapa.pdf', archivo_img_url: null,
    geovisor_url: null, activo: true, visibilidad: 'publico', creado_en: '2025-01-01',
  }

  test('fetches and normalizes maps list', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [rawMap], meta: { total: 1 } })

    const { result } = renderHook(() => useMapasList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const maps = result.current.data?.data
    expect(Array.isArray(maps)).toBe(true)
    expect(maps![0]).toMatchObject({ id: 1, slug: 'mapa-1', title: 'Mapa Test' })
    expect(Array.isArray(maps![0].formats)).toBe(true)
  })

  test('derived formats includes PDF when archivo_pdf_url is present', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [rawMap], meta: { total: 1 } })

    const { result } = renderHook(() => useMapasList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const map = result.current.data?.data?.[0]
    expect(map!.formats).toContain('PDF')
  })
})

// ─── useDocumentosList ────────────────────────────────────────────────────────
describe('useDocumentosList', () => {
  beforeEach(() => { vi.clearAllMocks() })

  const rawDoc = {
    id: 1, slug: 'doc-1', titulo: 'Documento Test', tipo: 'protocolo',
    anio: 2024, autores: 'Autor', resumen: 'Resumen',
    archivo_url: 'https://example.com/doc.pdf', visibilidad: 'publico',
    activo: true, creado_en: '2025-01-01', tamano_bytes: 102400, categoria: 'protocolos',
    categoria_thumbnail_url: null,
  }

  test('fetches and normalizes documents list', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [rawDoc], meta: { total: 1 } })

    const { result } = renderHook(() => useDocumentosList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const docs = result.current.data?.data
    expect(Array.isArray(docs)).toBe(true)
    expect(docs![0]).toMatchObject({ id: 1, nombre: 'Documento Test', type: 'pdf' })
    expect(docs![0].tamano).toBe('100 KB')
  })
})

// ─── useSolicitudesAdmin / useMisSolicitudes ──────────────────────────────────
describe('useSolicitudesAdmin', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('fetches admin solicitudes list', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [], meta: { total: 0 } })

    const { result } = renderHook(() => useSolicitudesAdmin(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('solicitudes'), expect.any(Object))
  })

  test('exposes isError on API failure', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('403'))

    const { result } = renderHook(() => useSolicitudesAdmin(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useMisSolicitudes', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('fetches current user solicitudes', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [], meta: { total: 0 } })

    const { result } = renderHook(() => useMisSolicitudes(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(api.get).toHaveBeenCalled()
  })
})

// ─── useUsuariosList ──────────────────────────────────────────────────────────
describe('useUsuariosList', () => {
  beforeEach(() => { vi.clearAllMocks() })

  const rawUser = {
    id: 1, nombre: 'Test User', email: 'test@iiap.gov.co',
    rol: 'investigador', activo: true, creado_en: '2025-01-01',
    institucion: 'IIAP', foto_url: null,
  }

  test('fetches users from /admin/usuarios', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [rawUser], meta: { total: 1 } })

    const { result } = renderHook(() => useUsuariosList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(api.get).toHaveBeenCalledWith('/admin/usuarios', expect.any(Object))
  })

  test('normalizes user rol to display label', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [rawUser], meta: { total: 1 } })

    const { result } = renderHook(() => useUsuariosList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const users = result.current.data?.data
    expect(users![0].rol).toBe('Investigador')
  })

  test('normaliza rolSolicitado a su etiqueta de display cuando hay una solicitud pendiente', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [{ ...rawUser, rol: 'publico', rolSolicitado: 'tecnico' }], meta: { total: 1 },
    })

    const { result } = renderHook(() => useUsuariosList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.data[0].rolSolicitado).toBe('Técnico SIG')
  })

  test('rolSolicitado es null cuando no hay solicitud pendiente', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [rawUser], meta: { total: 1 } })

    const { result } = renderHook(() => useUsuariosList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.data[0].rolSolicitado).toBeNull()
  })
})

// ─── useCategoriasList ────────────────────────────────────────────────────────
describe('useCategoriasList', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('fetches categories and returns an array', async () => {
    vi.mocked(api.get).mockResolvedValue([{ id: 1, nombre: 'Biodiversidad' }])

    const { result } = renderHook(() => useCategoriasList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(Array.isArray(result.current.data)).toBe(true)
    expect((result.current.data as any)[0]).toMatchObject({ id: 1, nombre: 'Biodiversidad' })
  })

  test('handles data-envelope response format', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [{ id: 2, nombre: 'Mapas' }] })

    const { result } = renderHook(() => useCategoriasList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(Array.isArray(result.current.data)).toBe(true)
    expect((result.current.data as any)[0].nombre).toBe('Mapas')
  })
})

// ─── useNotificaciones ─────────────────────────────────────────────────────────
describe('useNotificaciones', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('does not fetch when enabled=false', () => {
    renderHook(() => useNotificaciones(false), { wrapper: makeWrapper() })
    expect(api.get).not.toHaveBeenCalled()
  })

  test('fetches /notificaciones when enabled=true', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [{ id: '1', mensaje: 'Nueva solicitud' }] })

    const { result } = renderHook(() => useNotificaciones(true), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(api.get).toHaveBeenCalledWith('/notificaciones')
    expect(Array.isArray(result.current.data)).toBe(true)
  })
})

// ─── useTiposNotificacionList ──────────────────────────────────────────────────
describe('useTiposNotificacionList', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('fetches /notificaciones/tipos and unwraps data', async () => {
    const tipos = [{ clave: 'nuevo_usuario', nombre: 'Nuevo usuario', icono: 'User', color: 'magenta', aplica_a: 'admin', activo: true, orden: 1 }]
    vi.mocked(api.get).mockResolvedValue({ data: tipos });

    const { result } = renderHook(() => useTiposNotificacionList(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.get).toHaveBeenCalledWith('/notificaciones/tipos');
    expect(result.current.data).toEqual(tipos);
  })
})

// ─── useNotificacionPrefs / useUpdateNotificacionPref ──────────────────────────
describe('useNotificacionPrefs', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('fetches /notificaciones/prefs and unwraps data', async () => {
    const prefs = [{ clave: 'nueva_solicitud', nombre: 'Nueva solicitud', icono: 'ClipboardList', color: 'gold', en_pantalla: true }]
    vi.mocked(api.get).mockResolvedValue({ data: prefs });

    const { result } = renderHook(() => useNotificacionPrefs(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.get).toHaveBeenCalledWith('/notificaciones/prefs');
    expect(result.current.data).toEqual(prefs);
  })

  test('does not fetch when enabled=false', () => {
    renderHook(() => useNotificacionPrefs(false), { wrapper: makeWrapper() });
    expect(api.get).not.toHaveBeenCalled();
  })
})

describe('useUpdateNotificacionPref', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('PATCHes the given clave with enPantalla', async () => {
    vi.mocked(api.patch).mockResolvedValue({});

    const { result } = renderHook(() => useUpdateNotificacionPref(), { wrapper: makeWrapper() });
    result.current.mutate({ clave: 'nueva_solicitud', enPantalla: false });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.patch).toHaveBeenCalledWith('/notificaciones/prefs/nueva_solicitud', { enPantalla: false });
  })
})

// ─── useCatalogue ─────────────────────────────────────────────────────────────
describe('useCatalogue', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('returns an array of catalogue entries', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [], meta: { total: 0 } })

    const { result } = renderHook(() => useCatalogue(), { wrapper: makeWrapper() })
    await waitFor(() => expect(Array.isArray(result.current)).toBe(true))

    expect(result.current.length).toBeGreaterThan(0)
  })

  test('each entry has required shape', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [], meta: { total: 0 } })

    const { result } = renderHook(() => useCatalogue(), { wrapper: makeWrapper() })
    await waitFor(() => expect(Array.isArray(result.current)).toBe(true))

    result.current.forEach((entry) => {
      expect(entry).toHaveProperty('id')
      expect(entry).toHaveProperty('group')
      expect(entry).toHaveProperty('label')
      expect(entry).toHaveProperty('to')
    })
  })

  test('includes static Módulos entries regardless of API', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [], meta: { total: 0 } })

    const { result } = renderHook(() => useCatalogue(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.length).toBeGreaterThan(0))

    const modulos = result.current.filter((e) => e.group === 'Módulos')
    expect(modulos.length).toBeGreaterThan(0)
  })

  test('enabled=false no dispara las consultas de contenido (mapas/documentos/geovisores)', () => {
    vi.mocked(api.get).mockResolvedValue({ data: [], meta: { total: 0 } })

    renderHook(() => useCatalogue(false), { wrapper: makeWrapper() })

    expect(api.get).not.toHaveBeenCalledWith('/mapas', expect.anything())
    expect(api.get).not.toHaveBeenCalledWith('/documentos', expect.anything())
    expect(api.get).not.toHaveBeenCalledWith('/geovisores', expect.anything())
  })

  test('enabled=true incluye mapas, documentos y geovisores reales como entradas del catálogo', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/mapas') return Promise.resolve({ data: [{ id: 'm1', titulo: 'Mapa X', categoria: 'Fauna', descripcion: null }], meta: { total: 1 } })
      if (url === '/documentos') return Promise.resolve({ data: [{ id: 'd1', titulo: 'Doc X', tipo: 'informe', categoria: null, resumen: null }], meta: { total: 1 } })
      if (url === '/geovisores') return Promise.resolve({ data: [{ id: 'g1', slug: 'geo-x', titulo: 'Geovisor X', subtitulo: null, categoria: null, descripcion: null }], meta: { total: 1 } })
      return Promise.resolve({ data: [], meta: { total: 0 } })
    })

    const { result } = renderHook(() => useCatalogue(true), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.some((e) => e.group === 'Mapas')).toBe(true))

    expect(result.current.find((e) => e.group === 'Mapas')).toMatchObject({ label: 'Mapa X', to: '/mapas', presetQuery: 'Mapa X' })
    expect(result.current.find((e) => e.group === 'Documentos')).toMatchObject({ label: 'Doc X', to: '/documentos', presetQuery: 'Doc X' })
    expect(result.current.find((e) => e.group === 'Geovisores')).toMatchObject({ label: 'Geovisor X', to: '/geovisores/geo-x' })
  })
})

// ─── useGeovisoresList ─────────────────────────────────────────────────────────
describe('useGeovisoresList', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('pide la vista admin con admin=true y limit por defecto', async () => {
    const rawGeovisor = {
      id: '1', slug: 'geologia-choco', titulo: 'Geología del Chocó', subtitulo: null,
      descripcion: null, cita: null, categoria: 'Geología', conexionGeoserverId: 'c1',
      workspacesGeoserver: [], colorPorTema: {}, centro: { lat: 5.55, lng: -76.6 },
      zoomInicial: 8, basemapDefecto: 'calles', areaMaxHa: null, presetsArea: [],
      iaHabilitada: false, visibilidad: 'publico',
      presentacion: { mostrarMetricas: true, mostrarImagenes: false, camposPopup: [] },
      thumbnailUrl: null, activo: true, orden: 0, creadoEn: '2026-01-01',
    }
    vi.mocked(api.get).mockResolvedValue({ data: [rawGeovisor], meta: { total: 1 } })

    const { result } = renderHook(() => useGeovisoresList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(api.get).toHaveBeenCalledWith('/geovisores', { params: { admin: 'true', limit: 100, page: 1 } })
    expect(result.current.data?.data).toEqual([rawGeovisor])
  })
})

// ─── useConexionesGeoserverList / useWorkspacesDeConexion ─────────────────────
describe('useConexionesGeoserverList', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('pide /admin/conexiones-geoserver', async () => {
    const rawConexion = { id: 'c1', nombre: 'GeoServer IIAP', url: 'https://geoserver.test/geoserver', usuario_lectura: 'lector', timeout_ms: 20000, activo: true, creado_en: '', actualizado_en: '' }
    vi.mocked(api.get).mockResolvedValue([rawConexion])

    const { result } = renderHook(() => useConexionesGeoserverList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(api.get).toHaveBeenCalledWith('/admin/conexiones-geoserver')
    expect(result.current.data).toEqual([rawConexion])
  })
})

describe('useWorkspacesDeConexion', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('pide /admin/conexiones-geoserver/:id/workspaces cuando hay conexionId', async () => {
    const workspaces = [{ id: 't_15_geologia', nombre: 'Geologia', totalCapas: 3 }]
    vi.mocked(api.get).mockResolvedValue(workspaces)

    const { result } = renderHook(() => useWorkspacesDeConexion('c1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(api.get).toHaveBeenCalledWith('/admin/conexiones-geoserver/c1/workspaces')
    expect(result.current.data).toEqual(workspaces)
  })

  test('no dispara la consulta sin conexionId', () => {
    const { result } = renderHook(() => useWorkspacesDeConexion(null), { wrapper: makeWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

// ─── useGeovisoresPublico / useGeovisorPorSlug / useCapasDeGeovisor ──────────
const rawGeovisorPublico = {
  id: '1', slug: 'geologia-choco', titulo: 'Geología del Chocó', subtitulo: null,
  descripcion: null, cita: null, categoria: 'Geología', conexionGeoserverId: 'c1',
  workspacesGeoserver: [], colorPorTema: {}, centro: { lat: 5.55, lng: -76.6 },
  zoomInicial: 8, basemapDefecto: 'calles', areaMaxHa: null, presetsArea: [],
  iaHabilitada: false, visibilidad: 'publico',
  presentacion: { mostrarMetricas: true, mostrarImagenes: false, camposPopup: [] },
  thumbnailUrl: null, activo: true, orden: 0, creadoEn: '2026-01-01',
}

describe('useGeovisoresPublico', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('pide el listado publico sin el parametro admin', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [rawGeovisorPublico], meta: { total: 1 } })

    const { result } = renderHook(() => useGeovisoresPublico(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(api.get).toHaveBeenCalledWith('/geovisores', { params: { limit: 100, page: 1 } })
  })
})

describe('useGeovisorPorSlug', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('pide /geovisores/:slug cuando hay slug', async () => {
    vi.mocked(api.get).mockResolvedValue(rawGeovisorPublico)

    const { result } = renderHook(() => useGeovisorPorSlug('geologia-choco'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(api.get).toHaveBeenCalledWith('/geovisores/geologia-choco')
    expect(result.current.data).toEqual(rawGeovisorPublico)
  })

  test('no dispara la consulta sin slug', () => {
    const { result } = renderHook(() => useGeovisorPorSlug(undefined), { wrapper: makeWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
    expect(api.get).not.toHaveBeenCalled()
  })

  test('expone isError si el geovisor no existe o no hay permiso', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Geovisor no encontrado'))

    const { result } = renderHook(() => useGeovisorPorSlug('no-existe'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useCapasDeGeovisor', () => {
  beforeEach(() => { vi.clearAllMocks() })

  const temas = [{ id: 'geologia', nombre: 'Geología', capas: [{ id: 'geologia:unidades', nombre: 'Unidades', tipo: 'vectorial', tema: 'geologia' }] }]

  test('pide /geovisores/:slug/capas y extrae `temas` de la respuesta', async () => {
    vi.mocked(api.get).mockResolvedValue({ temas })

    const { result } = renderHook(() => useCapasDeGeovisor('geologia-choco'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(api.get).toHaveBeenCalledWith('/geovisores/geologia-choco/capas')
    expect(result.current.data).toEqual(temas)
  })

  test('no dispara la consulta sin slug', () => {
    const { result } = renderHook(() => useCapasDeGeovisor(null), { wrapper: makeWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})
