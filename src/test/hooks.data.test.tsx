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
import { createElement } from 'react'

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
import { useAdminStats } from '@/hooks/useStats'
import { useNoticiasList, useNoticiaBySlug } from '@/hooks/useNoticias'
import { useMapasList } from '@/hooks/useMapas'
import { useDocumentosList } from '@/hooks/useDocumentos'
import { useSolicitudesAdmin, useMisSolicitudes } from '@/hooks/useSolicitudes'
import { useUsuariosList } from '@/hooks/useUsuarios'
import { useCategoriasList } from '@/hooks/useCategorias'
import { useAdminNotificaciones } from '@/hooks/useNotificaciones'
import { useCatalogue } from '@/hooks/useCatalogue'

// ─── QueryClient wrapper (fresh per test, no retries) ─────────────────────────
function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: {
      queries:   { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children)
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
    api.get.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useAdminStats(), { wrapper: makeWrapper() })
    expect(result.current.isLoading).toBe(true)
  })

  test('exposes isError on API failure', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('500'))

    const { result } = renderHook(() => useAdminStats(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

// ─── useNoticiasList ──────────────────────────────────────────────────────────
describe('useNoticiasList', () => {
  beforeEach(() => { vi.clearAllMocks() })

  const rawNoticia = {
    id: 1, slug: 'prueba', titulo: 'Test noticia', resumen: 'resumen',
    contenido: 'contenido', categoria: 'biodiversidad', autor: 'IIAP',
    publicado_en: '2025-01-01', publicado: true, imagen_url: null, visibilidad: 'publico',
  }

  test('fetches noticias and normalizes the shape', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [rawNoticia], total: 1 })

    const { result } = renderHook(() => useNoticiasList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const items = result.current.data?.data
    expect(Array.isArray(items)).toBe(true)
    expect(items[0]).toMatchObject({
      id: 1,
      slug: 'prueba',
      title: 'Test noticia',
      tag: 'BIODIVERSIDAD',
      author: 'IIAP',
    })
  })

  test('calls the noticias API endpoint', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [], total: 0 })

    renderHook(() => useNoticiasList({ limit: 5 }), { wrapper: makeWrapper() })
    await waitFor(() => expect(api.get).toHaveBeenCalled())

    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('noticias'), expect.any(Object))
  })
})

// ─── useNoticiaBySlug ─────────────────────────────────────────────────────────
describe('useNoticiaBySlug', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('fetches noticia by slug', async () => {
    const raw = {
      id: 2, slug: 'mi-slug', titulo: 'Artículo', resumen: '', contenido: 'texto',
      categoria: 'mapas', autor: 'Autor', publicado_en: '2025-06-01',
      publicado: true, imagen_url: null, visibilidad: 'publico',
    }
    vi.mocked(api.get).mockResolvedValue(raw)

    const { result } = renderHook(() => useNoticiaBySlug('mi-slug'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('mi-slug'))
    expect(result.current.data?.slug).toBe('mi-slug')
  })

  test('does not fetch when slug is falsy', () => {
    vi.mocked(api.get).mockResolvedValue({})

    renderHook(() => useNoticiaBySlug(null), { wrapper: makeWrapper() })
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
    vi.mocked(api.get).mockResolvedValue({ data: [rawMap], total: 1 })

    const { result } = renderHook(() => useMapasList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const maps = result.current.data?.data
    expect(Array.isArray(maps)).toBe(true)
    expect(maps[0]).toMatchObject({ id: 1, slug: 'mapa-1', title: 'Mapa Test' })
    expect(Array.isArray(maps[0].formats)).toBe(true)
  })

  test('derived formats includes PDF when archivo_pdf_url is present', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [rawMap], total: 1 })

    const { result } = renderHook(() => useMapasList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const map = result.current.data?.data[0]
    expect(map.formats).toContain('PDF')
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
    vi.mocked(api.get).mockResolvedValue({ data: [rawDoc], total: 1 })

    const { result } = renderHook(() => useDocumentosList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const docs = result.current.data?.data
    expect(Array.isArray(docs)).toBe(true)
    expect(docs[0]).toMatchObject({ id: 1, nombre: 'Documento Test', type: 'pdf' })
    expect(docs[0].tamano).toBe('100 KB')
  })
})

// ─── useSolicitudesAdmin / useMisSolicitudes ──────────────────────────────────
describe('useSolicitudesAdmin', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('fetches admin solicitudes list', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [], total: 0 })

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
    vi.mocked(api.get).mockResolvedValue({ data: [], total: 0 })

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
    vi.mocked(api.get).mockResolvedValue({ data: [rawUser], total: 1 })

    const { result } = renderHook(() => useUsuariosList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(api.get).toHaveBeenCalledWith('/admin/usuarios', expect.any(Object))
  })

  test('normalizes user rol to display label', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [rawUser], total: 1 })

    const { result } = renderHook(() => useUsuariosList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const users = result.current.data?.data
    expect(users[0].rol).toBe('Investigador')
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
    expect(result.current.data[0]).toMatchObject({ id: 1, nombre: 'Biodiversidad' })
  })

  test('handles data-envelope response format', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [{ id: 2, nombre: 'Mapas' }] })

    const { result } = renderHook(() => useCategoriasList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(Array.isArray(result.current.data)).toBe(true)
    expect(result.current.data[0].nombre).toBe('Mapas')
  })
})

// ─── useAdminNotificaciones ───────────────────────────────────────────────────
describe('useAdminNotificaciones', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('does not fetch when enabled=false', () => {
    renderHook(() => useAdminNotificaciones(false), { wrapper: makeWrapper() })
    expect(api.get).not.toHaveBeenCalled()
  })

  test('fetches /admin/notificaciones when enabled=true', async () => {
    vi.mocked(api.get).mockResolvedValue([{ id: 1, mensaje: 'Nueva solicitud' }])

    const { result } = renderHook(() => useAdminNotificaciones(true), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(api.get).toHaveBeenCalledWith('/admin/notificaciones')
    expect(Array.isArray(result.current.data)).toBe(true)
  })
})

// ─── useCatalogue ─────────────────────────────────────────────────────────────
describe('useCatalogue', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('returns an array of catalogue entries', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [], total: 0 })

    const { result } = renderHook(() => useCatalogue(), { wrapper: makeWrapper() })
    await waitFor(() => expect(Array.isArray(result.current)).toBe(true))

    expect(result.current.length).toBeGreaterThan(0)
  })

  test('each entry has required shape', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [], total: 0 })

    const { result } = renderHook(() => useCatalogue(), { wrapper: makeWrapper() })
    await waitFor(() => expect(Array.isArray(result.current)).toBe(true))

    result.current.forEach((entry) => {
      expect(entry).toHaveProperty('id')
      expect(entry).toHaveProperty('group')
      expect(entry).toHaveProperty('label')
      expect(entry).toHaveProperty('to')
    })
  })

  test('includes news entries when noticias are returned by API', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [{
        id: 1, slug: 'noticia-1', titulo: 'Noticia X', categoria: 'Mapas',
        resumen: 'resumen', publicado_en: '2025-01-01', publicado: true,
        autor: 'IIAP', imagen_url: null, visibilidad: 'publico', contenido: '',
      }],
      total: 1,
    })

    const { result } = renderHook(() => useCatalogue(), { wrapper: makeWrapper() })
    await waitFor(() => {
      expect(result.current.filter((e) => e.group === 'Noticias').length).toBeGreaterThan(0)
    })

    const news = result.current.filter((e) => e.group === 'Noticias')
    expect(news[0]).toMatchObject({
      group: 'Noticias',
      to: '/noticias/noticia-1',
    })
  })

  test('includes static Módulos entries regardless of API', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [], total: 0 })

    const { result } = renderHook(() => useCatalogue(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.length).toBeGreaterThan(0))

    const modulos = result.current.filter((e) => e.group === 'Módulos')
    expect(modulos.length).toBeGreaterThan(0)
  })
})
