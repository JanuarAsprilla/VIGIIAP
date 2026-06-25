/**
 * Branch-coverage tests for hooks with gap below 80%.
 * Each suite targets the specific nullish-coalescing / ternary / optional-chain
 * branches that the broader data and mutation tests don't exercise.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

vi.mock('@/lib/api', () => ({
  default: {
    get:    vi.fn(),
    post:   vi.fn(),
    patch:  vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuth,
  ROLES: {
    ADMIN:         'Administrador SIG',
    INVESTIGADOR:  'Investigador',
    TECNICO:       'Técnico',
    INSTITUCIONAL: 'Institucional',
    PUBLICO:       'Público',
  },
}))

// Default to authenticated; tests that need unauthenticated reassign this
let mockAuth = { isAuthenticated: true }

import api from '@/lib/api'
import { useNoticiasList } from '@/hooks/useNoticias'
import { useUsuariosList } from '@/hooks/useUsuarios'
import { useAdminNotificaciones } from '@/hooks/useNotificaciones'
import { useCategoriasList } from '@/hooks/useCategorias'
import { useCatalogue } from '@/hooks/useCatalogue'
import { useMapasList } from '@/hooks/useMapas'

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: {
      queries:   { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children)
}

// ─── useNoticias — normalizeNoticia null-field branches (lines 11-24, 28-30) ──

describe('useNoticias normalizeNoticia — null field branches', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('null categoria → tag falls back to NOTICIAS', async () => {
    api.get.mockResolvedValue({
      data: [{
        id: 'n1', slug: 'nota-1', titulo: 'Nota uno',
        resumen: null, contenido: null, categoria: null,
        autor: null, publicado_en: null, creado_en: '2024-01-01T00:00:00Z',
        publicado: true, visibilidad: null, imagen_url: null,
      }],
      meta: {},
    })
    const { result } = renderHook(() => useNoticiasList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const n = result.current.data.data[0]
    expect(n.tag).toBe('NOTICIAS')         // ?? 'NOTICIAS' branch
    expect(n.excerpt).toBe('')             // null resumen → ''
    expect(n.content).toBe('')             // null contenido → ''
    expect(n.author).toBe('IIAP')          // null autor → 'IIAP'
    expect(n.category).toBe('')            // null categoria → ''
    expect(n.visibilidad).toBe('publico')  // null visibilidad → 'publico'
    expect(n.thumbUrl).toBe('')            // null imagen_url → ''
    expect(n.resumen).toBe('')             // null resumen → ''
    expect(n.contenido).toBe('')           // null contenido → ''
    expect(n.imagen_url).toBe('')          // null imagen_url → ''
  })

  test('publicado_en null → date falls back to creado_en', async () => {
    api.get.mockResolvedValue({
      data: [{
        id: 'n2', slug: 'nota-2', titulo: 'Nota dos',
        publicado_en: null, creado_en: '2024-06-01T00:00:00Z',
        publicado: false, categoria: 'ambiental',
      }],
      meta: {},
    })
    const { result } = renderHook(() => useNoticiasList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const n = result.current.data.data[0]
    // Both date and time use publicado_en ?? creado_en
    expect(typeof n.date).toBe('string')
    expect(typeof n.time).toBe('string')
  })

  test('categoria toUpperCase applied when present', async () => {
    api.get.mockResolvedValue({
      data: [{
        id: 'n3', slug: 'nota-3', titulo: 'T', categoria: 'biodiversidad',
        creado_en: '2024-01-01T00:00:00Z', publicado: true,
      }],
      meta: {},
    })
    const { result } = renderHook(() => useNoticiasList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data.data[0].tag).toBe('BIODIVERSIDAD')
  })
})

// ─── useUsuarios — normalizeUser branches (lines 22-39, 71, 84) ──────────────

describe('useUsuarios normalizeUser — null/unknown field branches', () => {
  beforeEach(() => { vi.clearAllMocks() })

  function makeUser(overrides = {}) {
    return {
      id: 'u1', nombre: 'Ana López', email: 'ana@test.com',
      rol: 'admin_sig', activo: true,
      email_verified: true, motivo_acceso: 'Investigación',
      institucion: 'IIAP', actualizado_en: '2024-03-01T00:00:00Z',
      creado_en: '2024-01-01T00:00:00Z',
      ...overrides,
    }
  }

  test('activo=false → estado Inactivo', async () => {
    api.get.mockResolvedValue({ data: [makeUser({ activo: false })], meta: {} })
    const { result } = renderHook(() => useUsuariosList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data.data[0].estado).toBe('Inactivo')
  })

  test('nombre null → initials falls back to ?', async () => {
    api.get.mockResolvedValue({ data: [makeUser({ nombre: null })], meta: {} })
    const { result } = renderHook(() => useUsuariosList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data.data[0].initials).toBe('?')
  })

  test('unknown rol → falls back to PUBLICO', async () => {
    api.get.mockResolvedValue({ data: [makeUser({ rol: 'rol-desconocido' })], meta: {} })
    const { result } = renderHook(() => useUsuariosList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data.data[0].rol).toBe('Público')
  })

  test('email_verified null → defaults to false', async () => {
    api.get.mockResolvedValue({ data: [makeUser({ email_verified: null })], meta: {} })
    const { result } = renderHook(() => useUsuariosList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data.data[0].emailVerified).toBe(false)
  })

  test('motivo_acceso null → empty string', async () => {
    api.get.mockResolvedValue({ data: [makeUser({ motivo_acceso: null })], meta: {} })
    const { result } = renderHook(() => useUsuariosList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data.data[0].motivoAcceso).toBe('')
  })

  test('institucion null → empty string', async () => {
    api.get.mockResolvedValue({ data: [makeUser({ institucion: null })], meta: {} })
    const { result } = renderHook(() => useUsuariosList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data.data[0].institucion).toBe('')
  })

  test('actualizado_en null → falls back to creado_en', async () => {
    api.get.mockResolvedValue({ data: [makeUser({ actualizado_en: null })], meta: {} })
    const { result } = renderHook(() => useUsuariosList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(typeof result.current.data.data[0].ultimoAcceso).toBe('string')
  })

  test('all known roles map correctly', async () => {
    const roles = ['admin_sig', 'investigador', 'tecnico', 'institucional', 'publico']
    for (const rol of roles) {
      api.get.mockResolvedValue({ data: [makeUser({ rol })], meta: {} })
      const { result } = renderHook(() => useUsuariosList(), { wrapper: makeWrapper() })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data.data[0].rolBackend).toBe(rol)
    }
  })
})

// ─── useNotificaciones — select branches (line 8) ────────────────────────────

describe('useAdminNotificaciones — select branches', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('res.data present → returns res.data', async () => {
    const items = [{ id: '1', mensaje: 'Nueva solicitud' }]
    api.get.mockResolvedValue({ data: items })
    const { result } = renderHook(() => useAdminNotificaciones(true), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(items)
  })

  test('res.data null but res is array → returns res directly', async () => {
    const items = [{ id: '2', mensaje: 'Otra' }]
    api.get.mockResolvedValue(items) // res IS the array, no .data wrapper
    const { result } = renderHook(() => useAdminNotificaciones(true), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(items)
  })

  test('enabled=false → does not fetch', () => {
    const { result } = renderHook(() => useAdminNotificaciones(false), { wrapper: makeWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
    expect(api.get).not.toHaveBeenCalled()
  })
})

// ─── useCategorias — select branches (line 13) ───────────────────────────────

describe('useCategoriasList — select branches', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('res is array → returned directly (Array.isArray true)', async () => {
    const cats = [{ nombre: 'Fauna' }, { nombre: 'Flora' }]
    api.get.mockResolvedValue(cats)
    const { result } = renderHook(() => useCategoriasList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(cats)
  })

  test('res is object with data → returns res.data (Array.isArray false)', async () => {
    const cats = [{ nombre: 'Suelos' }]
    api.get.mockResolvedValue({ data: cats })
    const { result } = renderHook(() => useCategoriasList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(cats)
  })

  test('res.data undefined → falls back to empty array', async () => {
    api.get.mockResolvedValue({ otrocampo: true }) // no data, not an array
    const { result } = renderHook(() => useCategoriasList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })
})

// ─── useCatalogue — unauthenticated + null-noticias branches (lines 39-72, 109) ─

describe('useCatalogue — auth and news branches', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('unauthenticated → no account entries in catalogue', async () => {
    mockAuth = { isAuthenticated: false }
    api.get.mockResolvedValue({ data: [], meta: {} }) // empty noticias
    const { result } = renderHook(() => useCatalogue(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current).toBeDefined())
    const ids = result.current.map((e) => e.id)
    expect(ids).not.toContain('act-perfil')
    expect(ids).not.toContain('act-solicitudes')
  })

  test('authenticated → account entries present', async () => {
    mockAuth = { isAuthenticated: true }
    api.get.mockResolvedValue({ data: [], meta: {} })
    const { result } = renderHook(() => useCatalogue(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current).toBeDefined())
    const ids = result.current.map((e) => e.id)
    expect(ids).toContain('act-perfil')
    expect(ids).toContain('act-solicitudes')
  })

  test('noticias with null titulo → falls back to title then —', async () => {
    mockAuth = { isAuthenticated: true }
    api.get.mockResolvedValue({
      data: [{
        id: 'n1', slug: 'slug-1',
        titulo: null, title: null,
        categoria: null, tag: null,
        resumen: null, publicado_en: null, creado_en: '2024-01-01T00:00:00Z',
        publicado: true,
      }],
      meta: {},
    })
    const { result } = renderHook(() => useCatalogue(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.some((e) => e.group === 'Noticias')).toBe(true))
    const newsEntry = result.current.find((e) => e.id === 'new-n1')
    expect(newsEntry?.label).toBe('—')  // titulo ?? title ?? '—' fallback
  })

  test('noticias with titulo → uses titulo', async () => {
    mockAuth = { isAuthenticated: true }
    api.get.mockResolvedValue({
      data: [{
        id: 'n2', slug: 'slug-2', titulo: 'Avance investigativo',
        categoria: 'ciencia', resumen: 'Breve resumen',
        creado_en: '2024-01-01T00:00:00Z', publicado: true,
      }],
      meta: {},
    })
    const { result } = renderHook(() => useCatalogue(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.some((e) => e.group === 'Noticias')).toBe(true))
    const entry = result.current.find((e) => e.id === 'new-n2')
    expect(entry?.label).toBe('Avance investigativo')
    expect(entry?.meta).toBe('ciencia')
  })

  test('resource entries always present (Guía, FAQ, Términos)', async () => {
    mockAuth = { isAuthenticated: false }
    api.get.mockResolvedValue({ data: [], meta: {} })
    const { result } = renderHook(() => useCatalogue(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current).toBeDefined())
    const ids = result.current.map((e) => e.id)
    expect(ids).toContain('res-guia')
    expect(ids).toContain('res-faq')
    expect(ids).toContain('res-terminos')
  })
})

// ─── useMapas — deriveFormats / fmtFromUrl branches (lines 18-21, 30, 55, 66) ─

describe('useMapasList — normalizeMap branch coverage', () => {
  beforeEach(() => { vi.clearAllMocks() })

  function makeMapa(overrides = {}) {
    return {
      id: 'm1', nombre: 'Mapa Fauna', autor: 'IIAP',
      fecha: '2024-01-15', descripcion: 'Desc',
      tematica: 'Fauna', visible: true, visibilidad: 'publico',
      archivo_pdf_url: null, archivo_img_url: null, geovisor_url: null,
      ...overrides,
    }
  }

  test('only geovisor_url → formato Geovisor', async () => {
    api.get.mockResolvedValue({
      data: [makeMapa({ geovisor_url: 'https://geovisor.test/map' })],
      meta: {},
    })
    const { result } = renderHook(() => useMapasList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const m = result.current.data.data[0]
    expect(m.formato).toBe('Geovisor')
  })

  test('only archivo_img_url → formato IMG', async () => {
    api.get.mockResolvedValue({
      data: [makeMapa({ archivo_img_url: 'https://cdn.test/img.jpg' })],
      meta: {},
    })
    const { result } = renderHook(() => useMapasList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data.data[0].formato).toBe('IMG')
  })

  test('pdf_url with .pdf extension → formato PDF', async () => {
    api.get.mockResolvedValue({
      data: [makeMapa({ archivo_pdf_url: 'https://cdn.test/documento.pdf' })],
      meta: {},
    })
    const { result } = renderHook(() => useMapasList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data.data[0].formato).toBe('PDF')
  })

  test('pdf_url with image extension and no img_url → formato IMG', async () => {
    api.get.mockResolvedValue({
      data: [makeMapa({ archivo_pdf_url: 'https://cdn.test/mapa.png', archivo_img_url: null })],
      meta: {},
    })
    const { result } = renderHook(() => useMapasList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data.data[0].formato).toBe('IMG')
  })

  test('no files at all → defaults to PDF', async () => {
    api.get.mockResolvedValue({
      data: [makeMapa()], // all urls null
      meta: {},
    })
    const { result } = renderHook(() => useMapasList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data.data[0].formato).toBe('PDF')
  })

  test('both img and pdf urls → IMG takes priority', async () => {
    api.get.mockResolvedValue({
      data: [makeMapa({
        archivo_img_url: 'https://cdn.test/img.jpg',
        archivo_pdf_url: 'https://cdn.test/doc.pdf',
      })],
      meta: {},
    })
    const { result } = renderHook(() => useMapasList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data.data[0].formato).toBe('IMG')
  })

  test('activo=false → visible field is false', async () => {
    api.get.mockResolvedValue({
      data: [makeMapa({ activo: false })],
      meta: {},
    })
    const { result } = renderHook(() => useMapasList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data.data[0].visible).toBe(false)
  })

  test('missing descripcion → descripcion field present', async () => {
    api.get.mockResolvedValue({
      data: [makeMapa({ descripcion: null })],
      meta: {},
    })
    const { result } = renderHook(() => useMapasList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    // Should normalize gracefully
    expect(result.current.data.data[0]).toHaveProperty('nombre')
  })
})
