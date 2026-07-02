/**
 * Tests for all mutation hooks across the data layer.
 * Covers create, update, delete, toggle, upload, and download operations.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

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
    ADMIN: 'Administrador SIG', INVESTIGADOR: 'Investigador',
    TECNICO: 'Técnico', INSTITUCIONAL: 'Institucional', PUBLICO: 'Público',
  },
}))

import api from '@/lib/api'
import {
  useCreateSolicitud, useUpdateEstadoSolicitud, useResponderSolicitud,
  useSolicitudArchivos, useUploadSolicitudArchivo, useDeleteSolicitudArchivo,
  useDownloadSolicitudArchivo,
} from '@/hooks/useSolicitudes'
import { useCreateMapa, useUpdateMapa, useToggleMapaActivo, useDeleteMapa, useMapaBySlug } from '@/hooks/useMapas'
import { useCreateDocumento, useUpdateDocumento, useDeleteDocumento, useDocumentoBySlug } from '@/hooks/useDocumentos'
import {
  useCreateUsuario, useUpdateUsuarioRol, useToggleActivo,
  useDeleteUsuario, useUpdatePerfil, useUpdatePassword,
} from '@/hooks/useUsuarios'
import { useCreateCategoria, useDeleteCategoria, useUploadCategoriaThumbnail } from '@/hooks/useCategorias'

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children)
}

// ─── useSolicitudes mutations ─────────────────────────────────────────────────

describe('useCreateSolicitud', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('calls POST /solicitudes with payload', async () => {
    vi.mocked(api.post).mockResolvedValue({ id: 1 })
    const { result } = renderHook(() => useCreateSolicitud(), { wrapper: makeWrapper() })

    await act(async () => {
      await result.current.mutateAsync({ tipo: 'uso-suelo', descripcion: 'Test' })
    })

    expect(api.post).toHaveBeenCalledWith('/solicitudes', { tipo: 'uso-suelo', descripcion: 'Test' })
  })

  test('exposes isSuccess after mutation', async () => {
    vi.mocked(api.post).mockResolvedValue({ id: 42 })
    const { result } = renderHook(() => useCreateSolicitud(), { wrapper: makeWrapper() })

    await act(async () => { await result.current.mutateAsync({ tipo: 'linderos' }) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  test('exposes isError when API fails', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('500'))
    const { result } = renderHook(() => useCreateSolicitud(), { wrapper: makeWrapper() })

    await act(async () => {
      try { await result.current.mutateAsync({}) } catch { /* expected */ }
    })
    expect(result.current.isError).toBe(true)
  })
})

describe('useUpdateEstadoSolicitud', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('calls PATCH /solicitudes/:id/estado with mapped estado', async () => {
    vi.mocked(api.patch).mockResolvedValue({})
    const { result } = renderHook(() => useUpdateEstadoSolicitud(), { wrapper: makeWrapper() })

    await act(async () => {
      await result.current.mutateAsync({ id: '5', estado: 'En Revisión', nota: 'ok' })
    })

    expect(api.patch).toHaveBeenCalledWith('/solicitudes/5/estado', {
      estado: 'en_revision',
      nota: 'ok',
    })
  })
})

describe('useResponderSolicitud', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('calls POST /solicitudes/:id/responder', async () => {
    vi.mocked(api.post).mockResolvedValue({})
    const { result } = renderHook(() => useResponderSolicitud(), { wrapper: makeWrapper() })

    await act(async () => {
      await result.current.mutateAsync({ id: '3', respuesta: 'Aprobado con observaciones' })
    })

    expect(api.post).toHaveBeenCalledWith('/solicitudes/3/responder', {
      respuesta: 'Aprobado con observaciones',
    })
  })
})

describe('useSolicitudArchivos', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('fetches archivos for a solicitud', async () => {
    vi.mocked(api.get).mockResolvedValue([{ id: 1, nombre: 'doc.pdf' }])
    const { result } = renderHook(() => useSolicitudArchivos('7'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('solicitudes/7'))
  })

  test('does not fetch when solicitudId is falsy', () => {
    renderHook(() => useSolicitudArchivos(null), { wrapper: makeWrapper() })
    expect(api.get).not.toHaveBeenCalled()
  })
})

describe('useUploadSolicitudArchivo', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('calls POST /solicitudes/:id/archivos with FormData', async () => {
    vi.mocked(api.post).mockResolvedValue({ id: 99 })
    const { result } = renderHook(() => useUploadSolicitudArchivo(), { wrapper: makeWrapper() })
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })

    await act(async () => {
      await result.current.mutateAsync({ solicitudId: '2', file })
    })

    expect(api.post).toHaveBeenCalledWith(
      '/solicitudes/2/archivos',
      expect.any(FormData),
      expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } })
    )
  })
})

describe('useDeleteSolicitudArchivo', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('calls DELETE /solicitudes/:id/archivos/:archivoId', async () => {
    vi.mocked(api.delete).mockResolvedValue({})
    const { result } = renderHook(() => useDeleteSolicitudArchivo(), { wrapper: makeWrapper() })

    await act(async () => {
      await result.current.mutateAsync({ solicitudId: '1', archivoId: '10' })
    })

    expect(api.delete).toHaveBeenCalledWith('/solicitudes/1/archivos/10')
  })
})

describe('useDownloadSolicitudArchivo', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('calls GET /solicitudes/:id/archivos/:archivoId/download', async () => {
    vi.mocked(api.get).mockResolvedValue({ url: 'https://example.com/file.pdf' })
    const { result } = renderHook(() => useDownloadSolicitudArchivo(), { wrapper: makeWrapper() })

    await act(async () => {
      await result.current.mutateAsync({ solicitudId: '1', archivoId: '5' })
    })

    expect(api.get).toHaveBeenCalledWith('/solicitudes/1/archivos/5/download')
  })
})

// ─── useMapas mutations ───────────────────────────────────────────────────────

describe('useCreateMapa', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('calls POST /mapas with formData', async () => {
    vi.mocked(api.post).mockResolvedValue({ id: 1 })
    const { result } = renderHook(() => useCreateMapa(), { wrapper: makeWrapper() })
    const fd = new FormData()

    await act(async () => { await result.current.mutateAsync({ formData: fd }) })
    expect(api.post).toHaveBeenCalledWith('/mapas', fd, expect.any(Object))
  })
})

describe('useUpdateMapa', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('calls PUT /mapas/:id', async () => {
    vi.mocked(api.put).mockResolvedValue({ id: 5 })
    const { result } = renderHook(() => useUpdateMapa(), { wrapper: makeWrapper() })
    const fd = new FormData()

    await act(async () => { await result.current.mutateAsync({ id: '5', formData: fd }) })
    expect(api.put).toHaveBeenCalledWith('/mapas/5', fd, expect.any(Object))
  })
})

describe('useToggleMapaActivo', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('calls PATCH /mapas/:id/activo', async () => {
    vi.mocked(api.patch).mockResolvedValue({})
    const { result } = renderHook(() => useToggleMapaActivo(), { wrapper: makeWrapper() })

    await act(async () => { await result.current.mutateAsync({ id: '3', activo: false }) })
    expect(api.patch).toHaveBeenCalledWith('/mapas/3/activo', { activo: false })
  })
})

describe('useDeleteMapa', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('calls DELETE /mapas/:id', async () => {
    vi.mocked(api.delete).mockResolvedValue({})
    const { result } = renderHook(() => useDeleteMapa(), { wrapper: makeWrapper() })

    await act(async () => { await result.current.mutateAsync('7') })
    expect(api.delete).toHaveBeenCalledWith('/mapas/7')
  })
})

describe('useMapaBySlug', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('fetches mapa by slug', async () => {
    vi.mocked(api.get).mockResolvedValue({ id: 1, slug: 'test-map', titulo: 'Test' })
    const { result } = renderHook(() => useMapaBySlug('test-map'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('test-map'))
  })

  test('skips fetch when slug is falsy', () => {
    renderHook(() => useMapaBySlug(null), { wrapper: makeWrapper() })
    expect(api.get).not.toHaveBeenCalled()
  })
})

// ─── useDocumentos mutations ──────────────────────────────────────────────────

describe('useCreateDocumento', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('calls POST /documentos', async () => {
    vi.mocked(api.post).mockResolvedValue({ id: 1 })
    const { result } = renderHook(() => useCreateDocumento(), { wrapper: makeWrapper() })
    const fd = new FormData()

    await act(async () => { await result.current.mutateAsync({ formData: fd }) })
    expect(api.post).toHaveBeenCalledWith('/documentos', fd, expect.any(Object))
  })
})

describe('useUpdateDocumento', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('calls PUT /documentos/:id', async () => {
    vi.mocked(api.put).mockResolvedValue({ id: 2 })
    const { result } = renderHook(() => useUpdateDocumento(), { wrapper: makeWrapper() })
    const fd = new FormData()

    await act(async () => { await result.current.mutateAsync({ id: '2', formData: fd }) })
    expect(api.put).toHaveBeenCalledWith('/documentos/2', fd, expect.any(Object))
  })
})

describe('useDeleteDocumento', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('calls DELETE /documentos/:id', async () => {
    vi.mocked(api.delete).mockResolvedValue({})
    const { result } = renderHook(() => useDeleteDocumento(), { wrapper: makeWrapper() })

    await act(async () => { await result.current.mutateAsync('4') })
    expect(api.delete).toHaveBeenCalledWith('/documentos/4')
  })
})

describe('useDocumentoBySlug', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('fetches documento by slug', async () => {
    vi.mocked(api.get).mockResolvedValue({ id: 1, slug: 'doc-1', titulo: 'Documento Test' })
    const { result } = renderHook(() => useDocumentoBySlug('doc-1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('doc-1'))
  })

  test('skips fetch when slug is falsy', () => {
    renderHook(() => useDocumentoBySlug(undefined), { wrapper: makeWrapper() })
    expect(api.get).not.toHaveBeenCalled()
  })
})

// ─── useNoticias mutations ────────────────────────────────────────────────────




// ─── useUsuarios mutations ────────────────────────────────────────────────────

describe('useCreateUsuario', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('calls POST /admin/usuarios', async () => {
    vi.mocked(api.post).mockResolvedValue({ id: 10 })
    const { result } = renderHook(() => useCreateUsuario(), { wrapper: makeWrapper() })

    await act(async () => {
      await result.current.mutateAsync({ nombre: 'Test', email: 'test@iiap.gov.co', rol: 'Público' })
    })
    expect(api.post).toHaveBeenCalledWith('/admin/usuarios', expect.any(Object))
  })
})

describe('useUpdateUsuarioRol', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('calls PATCH /admin/usuarios/:id/rol', async () => {
    vi.mocked(api.patch).mockResolvedValue({})
    const { result } = renderHook(() => useUpdateUsuarioRol(), { wrapper: makeWrapper() })

    await act(async () => {
      await result.current.mutateAsync({ id: '1', rol: 'Investigador' })
    })
    expect(api.patch).toHaveBeenCalledWith(expect.stringContaining('usuarios/1'), expect.any(Object))
  })
})

describe('useToggleActivo', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('calls PATCH to toggle user active status', async () => {
    vi.mocked(api.patch).mockResolvedValue({})
    const { result } = renderHook(() => useToggleActivo(), { wrapper: makeWrapper() })

    await act(async () => {
      await result.current.mutateAsync({ id: '2', activo: false })
    })
    expect(api.patch).toHaveBeenCalledWith(expect.stringContaining('usuarios/2'), expect.any(Object))
  })
})

describe('useDeleteUsuario', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('calls DELETE /admin/usuarios/:id', async () => {
    vi.mocked(api.delete).mockResolvedValue({})
    const { result } = renderHook(() => useDeleteUsuario(), { wrapper: makeWrapper() })

    await act(async () => { await result.current.mutateAsync('5') })
    expect(api.delete).toHaveBeenCalledWith(expect.stringContaining('usuarios/5'))
  })
})

describe('useUpdatePerfil', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('calls PATCH /usuarios/me with user data', async () => {
    vi.mocked(api.patch).mockResolvedValue({ nombre: 'Updated' })
    const { result } = renderHook(() => useUpdatePerfil(), { wrapper: makeWrapper() })

    await act(async () => {
      await result.current.mutateAsync({ nombre: 'Updated', institucion: 'IIAP' })
    })
    expect(api.patch).toHaveBeenCalledWith('/usuarios/me', { nombre: 'Updated', institucion: 'IIAP' })
  })
})

describe('useUpdatePassword', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('calls PATCH /usuarios/me/password with passwords', async () => {
    vi.mocked(api.patch).mockResolvedValue({})
    const { result } = renderHook(() => useUpdatePassword(), { wrapper: makeWrapper() })

    await act(async () => {
      await result.current.mutateAsync({ currentPassword: 'old123', newPassword: 'New@123' })
    })
    expect(api.patch).toHaveBeenCalledWith('/usuarios/me/password', {
      currentPassword: 'old123',
      newPassword: 'New@123',
    })
  })
})

// ─── useCategorias mutations ──────────────────────────────────────────────────

describe('useCreateCategoria', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('calls POST /categorias with nombre', async () => {
    vi.mocked(api.post).mockResolvedValue({ id: 1, nombre: 'Nueva' })
    const { result } = renderHook(() => useCreateCategoria(), { wrapper: makeWrapper() })

    await act(async () => { await result.current.mutateAsync('Nueva categoría') })
    expect(api.post).toHaveBeenCalledWith('/categorias', { nombre: 'Nueva categoría' })
  })
})

describe('useDeleteCategoria', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('calls DELETE /categorias/:nombre (URL-encoded)', async () => {
    vi.mocked(api.delete).mockResolvedValue({})
    const { result } = renderHook(() => useDeleteCategoria(), { wrapper: makeWrapper() })

    await act(async () => { await result.current.mutateAsync('Biodiversidad') })
    expect(api.delete).toHaveBeenCalledWith('/categorias/Biodiversidad')
  })
})

describe('useUploadCategoriaThumbnail', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('calls POST /categorias/:nombre/thumbnail with FormData', async () => {
    vi.mocked(api.post).mockResolvedValue({ id: 2 })
    const { result } = renderHook(() => useUploadCategoriaThumbnail(), { wrapper: makeWrapper() })
    const file = new File(['img'], 'thumb.jpg', { type: 'image/jpeg' })

    await act(async () => {
      await result.current.mutateAsync({ nombre: 'Biodiversidad', file })
    })
    expect(api.post).toHaveBeenCalledWith(
      '/categorias/Biodiversidad/thumbnail',
      expect.any(FormData),
      expect.any(Object)
    )
  })
})
