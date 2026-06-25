/**
 * Tests for useSolicitudes — data hooks, mutations, and normalization branches.
 *
 * Strategy:
 *  - Mock @/lib/api; no real HTTP calls.
 *  - Fresh QueryClientProvider per test.
 *  - Drive all normalizeSolicitud branches by varying raw API payloads.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
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
import {
  useSolicitudesAdmin,
  useMisSolicitudes,
  useSolicitudById,
  useCreateSolicitud,
  useUpdateEstadoSolicitud,
  useResponderSolicitud,
  useSolicitudArchivos,
  useUploadSolicitudArchivo,
  useDeleteSolicitudArchivo,
  useDownloadSolicitudArchivo,
  ESTADO_API,
  TRANSICIONES_VALIDAS,
  SOL_KEYS,
} from '@/hooks/useSolicitudes'

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: {
      queries:   { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children)
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeSolicitud(overrides = {}) {
  return {
    id:                  'abc-123-def-456-789',
    tipo:                'uso-suelo',
    descripcion:         'Necesito certificado de uso de suelo para predio rural.',
    creado_en:           '2024-03-10T08:00:00Z',
    estado:              'pendiente',
    solicitante:         'Carlos Ruiz',
    email:               'carlos@test.com',
    nota_admin:          null,
    respondida_en:       null,
    revisado_por_nombre: null,
    dias_pendiente:      3,
    ...overrides,
  }
}

// ─── Exported constants ───────────────────────────────────────────────────────

describe('ESTADO_API', () => {
  test('maps all display labels to backend values', () => {
    expect(ESTADO_API['Pendiente']).toBe('pendiente')
    expect(ESTADO_API['En Revisión']).toBe('en_revision')
    expect(ESTADO_API['Aprobado']).toBe('aprobada')
    expect(ESTADO_API['Rechazado']).toBe('rechazada')
    expect(ESTADO_API['Resuelta']).toBe('resuelta')
  })
})

describe('TRANSICIONES_VALIDAS', () => {
  test('pendiente can transition to revision, aprobado, rechazado', () => {
    expect(TRANSICIONES_VALIDAS.pendiente).toContain('En Revisión')
    expect(TRANSICIONES_VALIDAS.pendiente).toContain('Aprobado')
    expect(TRANSICIONES_VALIDAS.pendiente).toContain('Rechazado')
  })

  test('resuelta is a terminal state with no transitions', () => {
    expect(TRANSICIONES_VALIDAS.resuelta).toHaveLength(0)
  })
})

describe('SOL_KEYS', () => {
  test('generates stable cache keys', () => {
    expect(SOL_KEYS.all).toEqual(['solicitudes'])
    expect(SOL_KEYS.list({ page: 1 })).toEqual(['solicitudes', 'list', { page: 1 }])
    expect(SOL_KEYS.mine({ page: 2 })).toEqual(['solicitudes', 'mine', { page: 2 }])
    expect(SOL_KEYS.detail('id-123')).toEqual(['solicitudes', 'detail', 'id-123'])
  })
})

// ─── normalizeSolicitud branches via useSolicitudesAdmin ─────────────────────

describe('normalizeSolicitud — TIPO_LABEL branches', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('maps known tipo to label', async () => {
    api.get.mockResolvedValue({ data: [makeSolicitud({ tipo: 'uso-suelo' })], meta: {} })
    const { result } = renderHook(() => useSolicitudesAdmin(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.data[0].tipo).toBe('Certificado de Uso de Suelo')
  })

  test('falls back to raw tipo when not in map', async () => {
    api.get.mockResolvedValue({ data: [makeSolicitud({ tipo: 'tipo-desconocido' })], meta: {} })
    const { result } = renderHook(() => useSolicitudesAdmin(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.data[0].tipo).toBe('tipo-desconocido')
  })

  test('maps linderos', async () => {
    api.get.mockResolvedValue({ data: [makeSolicitud({ tipo: 'linderos' })], meta: {} })
    const { result } = renderHook(() => useSolicitudesAdmin(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.data[0].tipo).toBe('Consulta de Linderos')
  })

  test('maps estudio-ambiental', async () => {
    api.get.mockResolvedValue({ data: [makeSolicitud({ tipo: 'estudio-ambiental' })], meta: {} })
    const { result } = renderHook(() => useSolicitudesAdmin(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.data[0].tipo).toBe('Estudio Técnico Ambiental')
  })
})

describe('normalizeSolicitud — ESTADO branches', () => {
  beforeEach(() => { vi.clearAllMocks() })

  const estadosCases = [
    { estado: 'pendiente',   expectedLabel: 'Pendiente',   expectedColor: 'orange' },
    { estado: 'en_revision', expectedLabel: 'En Revisión', expectedColor: 'blue' },
    { estado: 'aprobada',    expectedLabel: 'Aprobado',    expectedColor: 'green' },
    { estado: 'rechazada',   expectedLabel: 'Rechazado',   expectedColor: 'red' },
    { estado: 'resuelta',    expectedLabel: 'Resuelta',    expectedColor: 'teal' },
  ]

  for (const { estado, expectedLabel, expectedColor } of estadosCases) {
    test(`estado ${estado} → label ${expectedLabel}, color ${expectedColor}`, async () => {
      api.get.mockResolvedValue({ data: [makeSolicitud({ estado })], meta: {} })
      const { result } = renderHook(() => useSolicitudesAdmin(), { wrapper: makeWrapper() })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      const item = result.current.data!.data[0]
      expect(item.estado).toBe(expectedLabel)
      expect(item.estadoColor).toBe(expectedColor)
      expect(item.estadoRaw).toBe(estado)
    })
  }

  test('unknown estado falls back to En Proceso and yellow color', async () => {
    api.get.mockResolvedValue({ data: [makeSolicitud({ estado: 'estado-raro' })], meta: {} })
    const { result } = renderHook(() => useSolicitudesAdmin(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const item = result.current.data!.data[0]
    expect(item.estado).toBe('En Proceso')
    expect(item.estadoColor).toBe('yellow')
  })
})

describe('normalizeSolicitud — buildTimeline branches', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('pendiente timeline', async () => {
    api.get.mockResolvedValue({ data: [makeSolicitud({ estado: 'pendiente' })], meta: {} })
    const { result } = renderHook(() => useSolicitudesAdmin(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.data[0].timeline).toEqual(['Recibida', 'Pendiente'])
  })

  test('en_revision timeline', async () => {
    api.get.mockResolvedValue({ data: [makeSolicitud({ estado: 'en_revision' })], meta: {} })
    const { result } = renderHook(() => useSolicitudesAdmin(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.data[0].timeline).toEqual(['Recibida', 'Pendiente', 'En Revisión'])
  })

  test('aprobada timeline', async () => {
    api.get.mockResolvedValue({ data: [makeSolicitud({ estado: 'aprobada' })], meta: {} })
    const { result } = renderHook(() => useSolicitudesAdmin(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.data[0].timeline).toEqual(['Recibida', 'Pendiente', 'En Revisión', 'Aprobado'])
  })

  test('rechazada timeline', async () => {
    api.get.mockResolvedValue({ data: [makeSolicitud({ estado: 'rechazada' })], meta: {} })
    const { result } = renderHook(() => useSolicitudesAdmin(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.data[0].timeline).toEqual(['Recibida', 'Pendiente', 'En Revisión', 'Rechazado'])
  })

  test('resuelta timeline', async () => {
    api.get.mockResolvedValue({ data: [makeSolicitud({ estado: 'resuelta' })], meta: {} })
    const { result } = renderHook(() => useSolicitudesAdmin(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.data[0].timeline).toEqual(['Recibida', 'Pendiente', 'En Revisión', 'Resuelta'])
  })
})

describe('normalizeSolicitud — nullable fields', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('descripcion null → subtipo is empty string', async () => {
    api.get.mockResolvedValue({ data: [makeSolicitud({ descripcion: null })], meta: {} })
    const { result } = renderHook(() => useSolicitudesAdmin(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.data[0].subtipo).toBe('')
    expect(result.current.data!.data[0].descripcion).toBe('')
  })

  test('nota_admin present → notas populated', async () => {
    api.get.mockResolvedValue({ data: [makeSolicitud({ nota_admin: 'Requiere revisión adicional' })], meta: {} })
    const { result } = renderHook(() => useSolicitudesAdmin(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.data[0].notas).toBe('Requiere revisión adicional')
  })

  test('respondida_en present → not null', async () => {
    const fecha = '2024-04-01T12:00:00Z'
    api.get.mockResolvedValue({ data: [makeSolicitud({ respondida_en: fecha })], meta: {} })
    const { result } = renderHook(() => useSolicitudesAdmin(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.data[0].respondidaEn).toBe(fecha)
  })

  test('revisado_por_nombre present → revisor populated', async () => {
    api.get.mockResolvedValue({ data: [makeSolicitud({ revisado_por_nombre: 'Ana López' })], meta: {} })
    const { result } = renderHook(() => useSolicitudesAdmin(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.data[0].revisor).toBe('Ana López')
  })

  test('dias_pendiente missing → calculated from creado_en', async () => {
    api.get.mockResolvedValue({
      data: [makeSolicitud({ dias_pendiente: undefined, creado_en: '2024-01-01T00:00:00Z' })],
      meta: {},
    })
    const { result } = renderHook(() => useSolicitudesAdmin(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(typeof result.current.data!.data[0].diasPendiente).toBe('number')
    expect(result.current.data!.data[0].diasPendiente).toBeGreaterThanOrEqual(0)
  })

  test('dias_pendiente present → uses API value', async () => {
    api.get.mockResolvedValue({ data: [makeSolicitud({ dias_pendiente: 7 })], meta: {} })
    const { result } = renderHook(() => useSolicitudesAdmin(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.data[0].diasPendiente).toBe(7)
  })

  test('id normalized — dashes stripped and uppercased', async () => {
    api.get.mockResolvedValue({ data: [makeSolicitud({ id: 'abc-123-def-456' })], meta: {} })
    const { result } = renderHook(() => useSolicitudesAdmin(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.data[0].id).toMatch(/^#[A-F0-9]+$/)
    expect(result.current.data!.data[0]._id).toBe('abc-123-def-456')
  })

  test('accionesValidas maps TRANSICIONES_VALIDAS for estado', async () => {
    api.get.mockResolvedValue({ data: [makeSolicitud({ estado: 'pendiente' })], meta: {} })
    const { result } = renderHook(() => useSolicitudesAdmin(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.data[0].accionesValidas).toEqual(TRANSICIONES_VALIDAS.pendiente)
  })

  test('unknown estado → accionesValidas is empty array', async () => {
    api.get.mockResolvedValue({ data: [makeSolicitud({ estado: 'estado-raro' })], meta: {} })
    const { result } = renderHook(() => useSolicitudesAdmin(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.data[0].accionesValidas).toEqual([])
  })
})

// ─── Query hooks ──────────────────────────────────────────────────────────────

describe('useSolicitudesAdmin', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('calls GET /solicitudes and returns normalized list', async () => {
    api.get.mockResolvedValue({ data: [makeSolicitud()], meta: { total: 1 } })
    const { result } = renderHook(() => useSolicitudesAdmin({ page: 1 }), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/solicitudes', { params: { page: 1 } })
    expect(result.current.data!.data).toHaveLength(1)
    expect(result.current.data!.meta).toEqual({ total: 1 })
  })

  test('exposes isError on failure', async () => {
    api.get.mockRejectedValue(new Error('500'))
    const { result } = renderHook(() => useSolicitudesAdmin(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useMisSolicitudes', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('calls GET /solicitudes/mis-solicitudes', async () => {
    api.get.mockResolvedValue({ data: [makeSolicitud()], meta: {} })
    const { result } = renderHook(() => useMisSolicitudes(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/solicitudes/mis-solicitudes', { params: {} })
  })
})

describe('useSolicitudById', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('calls GET /solicitudes/:id when id provided', async () => {
    api.get.mockResolvedValue(makeSolicitud())
    const { result } = renderHook(() => useSolicitudById('sol-001'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/solicitudes/sol-001')
  })

  test('does not fetch when id is falsy (enabled: !!id)', async () => {
    const { result } = renderHook(() => useSolicitudById(null), { wrapper: makeWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
    expect(api.get).not.toHaveBeenCalled()
  })

  test('does not fetch when id is empty string', async () => {
    const { result } = renderHook(() => useSolicitudById(''), { wrapper: makeWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
    expect(api.get).not.toHaveBeenCalled()
  })
})

// ─── Mutation hooks ───────────────────────────────────────────────────────────

describe('useCreateSolicitud', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('calls POST /solicitudes and invalidates cache on success', async () => {
    api.post.mockResolvedValue({ id: 'new-id' })
    const { result } = renderHook(() => useCreateSolicitud(), { wrapper: makeWrapper() })
    await act(async () => {
      await result.current.mutateAsync({ tipo: 'linderos', descripcion: 'Test' })
    })
    expect(api.post).toHaveBeenCalledWith('/solicitudes', { tipo: 'linderos', descripcion: 'Test' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  test('exposes isError on failure', async () => {
    api.post.mockRejectedValue(new Error('400'))
    const { result } = renderHook(() => useCreateSolicitud(), { wrapper: makeWrapper() })
    await act(async () => {
      try { await result.current.mutateAsync({}) } catch { /* expected */ }
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useUpdateEstadoSolicitud', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('maps display label to backend estado via ESTADO_API', async () => {
    api.patch.mockResolvedValue({})
    const { result } = renderHook(() => useUpdateEstadoSolicitud(), { wrapper: makeWrapper() })
    await act(async () => {
      await result.current.mutateAsync({ id: 'sol-1', estado: 'En Revisión', nota: 'Nota' })
    })
    expect(api.patch).toHaveBeenCalledWith('/solicitudes/sol-1/estado', {
      estado: 'en_revision',
      nota: 'Nota',
    })
  })

  test('passes through estado when not in ESTADO_API map (fallback branch)', async () => {
    api.patch.mockResolvedValue({})
    const { result } = renderHook(() => useUpdateEstadoSolicitud(), { wrapper: makeWrapper() })
    await act(async () => {
      await result.current.mutateAsync({ id: 'sol-1', estado: 'custom-estado', nota: '' })
    })
    expect(api.patch).toHaveBeenCalledWith('/solicitudes/sol-1/estado', {
      estado: 'custom-estado',
      nota: '',
    })
  })

  test('exposes isError on failure', async () => {
    api.patch.mockRejectedValue(new Error('500'))
    const { result } = renderHook(() => useUpdateEstadoSolicitud(), { wrapper: makeWrapper() })
    await act(async () => {
      try { await result.current.mutateAsync({ id: 'x', estado: 'Pendiente', nota: '' }) } catch { /* expected */ }
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useResponderSolicitud', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('calls POST /solicitudes/:id/responder', async () => {
    api.post.mockResolvedValue({})
    const { result } = renderHook(() => useResponderSolicitud(), { wrapper: makeWrapper() })
    await act(async () => {
      await result.current.mutateAsync({ id: 'sol-1', respuesta: 'Aprobado con condiciones.' })
    })
    expect(api.post).toHaveBeenCalledWith('/solicitudes/sol-1/responder', {
      respuesta: 'Aprobado con condiciones.',
    })
  })
})

describe('useSolicitudArchivos', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('calls GET /solicitudes/:id/archivos when solicitudId provided', async () => {
    api.get.mockResolvedValue([{ id: 'f1', nombre: 'plano.pdf' }])
    const { result } = renderHook(() => useSolicitudArchivos('sol-1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/solicitudes/sol-1/archivos')
  })

  test('does not fetch when solicitudId is falsy (enabled: !!solicitudId)', () => {
    const { result } = renderHook(() => useSolicitudArchivos(null), { wrapper: makeWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
    expect(api.get).not.toHaveBeenCalled()
  })
})

describe('useUploadSolicitudArchivo', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('calls POST /solicitudes/:id/archivos with multipart form', async () => {
    api.post.mockResolvedValue({ id: 'file-1' })
    const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' })
    const { result } = renderHook(() => useUploadSolicitudArchivo(), { wrapper: makeWrapper() })
    await act(async () => {
      await result.current.mutateAsync({ solicitudId: 'sol-1', file })
    })
    expect(api.post).toHaveBeenCalledWith(
      '/solicitudes/sol-1/archivos',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
  })
})

describe('useDeleteSolicitudArchivo', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('calls DELETE /solicitudes/:solicitudId/archivos/:archivoId', async () => {
    api.delete.mockResolvedValue({})
    const { result } = renderHook(() => useDeleteSolicitudArchivo(), { wrapper: makeWrapper() })
    await act(async () => {
      await result.current.mutateAsync({ solicitudId: 'sol-1', archivoId: 'f-1' })
    })
    expect(api.delete).toHaveBeenCalledWith('/solicitudes/sol-1/archivos/f-1')
  })
})

describe('useDownloadSolicitudArchivo', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('calls GET /solicitudes/:solicitudId/archivos/:archivoId/download', async () => {
    api.get.mockResolvedValue({ url: 'https://cdn.example.com/doc.pdf' })
    const { result } = renderHook(() => useDownloadSolicitudArchivo(), { wrapper: makeWrapper() })
    await act(async () => {
      await result.current.mutateAsync({ solicitudId: 'sol-1', archivoId: 'f-1' })
    })
    expect(api.get).toHaveBeenCalledWith('/solicitudes/sol-1/archivos/f-1/download')
  })
})
