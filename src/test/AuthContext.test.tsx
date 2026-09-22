/**
 * Tests for AuthProvider/useAuth — session rehydration on mount, login
 * variants (normal / passwordExpired / requiresTwoFactor), visitante login,
 * logout, and the forced-logout event dispatched by the axios interceptor
 * on a 401 (see api.test.ts).
 */
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

vi.mock('@/lib/api', () => ({
  default: {
    get:   vi.fn(),
    post:  vi.fn(),
    patch: vi.fn(),
  },
}))

import api from '@/lib/api'

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

const rawInvestigador = {
  id: 'u1', nombre: 'Ana Restrepo', email: 'ana@iiap.gov.co',
  rol: 'investigador', institucion: 'IIAP', twoFactorEnabled: false,
}

describe('AuthProvider — rehydration on mount', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('rehydrates the session from /auth/me and exposes the normalized user', async () => {
    vi.mocked(api.get).mockResolvedValue(rawInvestigador)

    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.initializing).toBe(true)

    await waitFor(() => expect(result.current.initializing).toBe(false))

    expect(api.get).toHaveBeenCalledWith('/auth/me')
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toMatchObject({ id: 'u1', name: 'Ana Restrepo', rol: 'investigador' })
  })

  test('clears the session when /auth/me fails (no valid cookie)', async () => {
    vi.mocked(api.get).mockRejectedValue(Object.assign(new Error('401'), { status: 401 }))

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.initializing).toBe(false))

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  test('derives isAdmin/isSuperAdmin/isVisitante from the rol', async () => {
    vi.mocked(api.get).mockResolvedValue({ ...rawInvestigador, rol: 'admin_sig' })

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.initializing).toBe(false))

    expect(result.current.isAdmin).toBe(true)
    expect(result.current.isSuperAdmin).toBe(false)
    expect(result.current.isVisitante).toBe(false)
  })

  test('propaga require2FA cuando el backend lo expone (admin_sig con 2FA obligatorio activo)', async () => {
    vi.mocked(api.get).mockResolvedValue({ ...rawInvestigador, rol: 'admin_sig', require2FA: true })

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.initializing).toBe(false))

    expect(result.current.user?.require2FA).toBe(true)
  })

  test('require2FA queda undefined para roles no-admin, mismo cuando el backend no lo envía', async () => {
    vi.mocked(api.get).mockResolvedValue(rawInvestigador)

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.initializing).toBe(false))

    expect(result.current.user?.require2FA).toBeUndefined()
  })
})

describe('AuthProvider — refreshProfile() ante errores transitorios', () => {
  beforeEach(() => { vi.clearAllMocks() })

  // Regresión: un 429 (rate limit) en /auth/me no debe cerrar una sesión que
  // sigue siendo válida — antes cualquier error en refreshProfile() llamaba
  // clearSession() sin importar la causa, desconectando a la persona sin
  // aviso solo por quedar temporalmente limitada por el rate limiter.
  test('un 429 en /auth/me no cierra una sesión ya autenticada', async () => {
    vi.mocked(api.get).mockResolvedValueOnce(rawInvestigador)
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.initializing).toBe(false))
    expect(result.current.isAuthenticated).toBe(true)

    vi.mocked(api.get).mockRejectedValueOnce(
      Object.assign(new Error('Demasiadas solicitudes. Intenta de nuevo en unos minutos.'), { status: 429 }),
    )
    await act(async () => {
      await expect(result.current.refreshProfile()).rejects.toThrow('Demasiadas solicitudes')
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toMatchObject({ id: 'u1' })
  })

  test('un 401 en /auth/me sí cierra una sesión que ya no es válida', async () => {
    vi.mocked(api.get).mockResolvedValueOnce(rawInvestigador)
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.initializing).toBe(false))
    expect(result.current.isAuthenticated).toBe(true)

    vi.mocked(api.get).mockRejectedValueOnce(Object.assign(new Error('401'), { status: 401 }))
    await act(async () => {
      await expect(result.current.refreshProfile()).rejects.toThrow()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })
})

describe('AuthProvider — login()', () => {
  beforeEach(() => { vi.clearAllMocks() })

  async function mountReady() {
    vi.mocked(api.get).mockResolvedValue(null)
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.initializing).toBe(false))
    return result
  }

  test('a normal login sets the user and returns the normalized profile', async () => {
    const result = await mountReady()
    // El POST de login solo confirma que no hay passwordExpired/requiresTwoFactor —
    // el perfil real se pide después vía /auth/me (refreshProfile).
    vi.mocked(api.post).mockResolvedValue({ token: 'jwt', user: { id: 'u1', rol: 'investigador' } })
    vi.mocked(api.get).mockResolvedValueOnce(rawInvestigador)

    let outcome: unknown
    await act(async () => { outcome = await result.current.login('ana@iiap.gov.co', 'secret123') })

    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'ana@iiap.gov.co', password: 'secret123' })
    expect(result.current.isAuthenticated).toBe(true)
    expect(outcome).toMatchObject({ id: 'u1', rol: 'investigador' })
  })

  test('a passwordExpired response does not authenticate the user', async () => {
    const result = await mountReady()
    vi.mocked(api.post).mockResolvedValue({ passwordExpired: true })

    let outcome: unknown
    await act(async () => { outcome = await result.current.login('ana@iiap.gov.co', 'secret123') })

    expect(outcome).toEqual({ passwordExpired: true })
    expect(result.current.isAuthenticated).toBe(false)
  })

  test('a requiresTwoFactor response does not authenticate the user', async () => {
    const result = await mountReady()
    vi.mocked(api.post).mockResolvedValue({ requiresTwoFactor: true })

    let outcome: unknown
    await act(async () => { outcome = await result.current.login('ana@iiap.gov.co', 'secret123') })

    expect(outcome).toEqual({ requiresTwoFactor: true })
    expect(result.current.isAuthenticated).toBe(false)
  })

  test('loading is true only while the login request is in flight', async () => {
    const result = await mountReady()
    let resolveLogin!: (v: unknown) => void
    vi.mocked(api.post).mockReturnValue(new Promise((resolve) => { resolveLogin = resolve }))
    vi.mocked(api.get).mockResolvedValueOnce(rawInvestigador)

    let pending!: Promise<unknown>
    act(() => { pending = result.current.login('ana@iiap.gov.co', 'secret123') })
    await waitFor(() => expect(result.current.loading).toBe(true))

    await act(async () => { resolveLogin({ token: 'jwt', user: rawInvestigador }); await pending })
    expect(result.current.loading).toBe(false)
  })
})

describe('AuthProvider — loginVisitante() / logout()', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('loginVisitante authenticates with isVisitante=true', async () => {
    vi.mocked(api.get).mockResolvedValueOnce(null)
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.initializing).toBe(false))

    vi.mocked(api.post).mockResolvedValue({
      token: 'jwt', user: { id: 'v1', rol: 'visitante', tipo: 'visitante' },
    })
    vi.mocked(api.get).mockResolvedValueOnce({ id: 'v1', rol: 'visitante', tipo: 'visitante' })
    await act(async () => { await result.current.loginVisitante('Invitado') })

    expect(api.post).toHaveBeenCalledWith('/auth/visitante', { nombre: 'Invitado' })
    expect(result.current.isVisitante).toBe(true)
  })

  test('logout clears the session locally even if the server call fails', async () => {
    vi.mocked(api.get).mockResolvedValue(rawInvestigador)
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true))

    vi.mocked(api.post).mockRejectedValue(new Error('network down'))
    await act(async () => { await result.current.logout() })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })
})

describe('AuthProvider — forced logout via vigiiap:logout event', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('clears the user when the axios interceptor dispatches vigiiap:logout on a 401', async () => {
    vi.mocked(api.get).mockResolvedValue(rawInvestigador)
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true))

    act(() => { window.dispatchEvent(new Event('vigiiap:logout')) })

    await waitFor(() => expect(result.current.isAuthenticated).toBe(false))
  })
})

describe('AuthProvider — perfilCompleto / completarPerfil()', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('normalizeUser expone perfilCompleto=false cuando /auth/me lo reporta así (cuenta OAuth sin institución)', async () => {
    vi.mocked(api.get).mockResolvedValue({ ...rawInvestigador, perfilCompleto: false })

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.initializing).toBe(false))

    expect(result.current.user).toMatchObject({ perfilCompleto: false })
  })

  test('perfilCompleto por defecto es true cuando /auth/me no lo incluye (cuenta tradicional)', async () => {
    vi.mocked(api.get).mockResolvedValue(rawInvestigador)

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.initializing).toBe(false))

    expect(result.current.user).toMatchObject({ perfilCompleto: true })
  })

  test('completarPerfil() llama al PATCH y refresca el perfil', async () => {
    vi.mocked(api.get).mockResolvedValue({ ...rawInvestigador, perfilCompleto: false })
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.initializing).toBe(false))

    vi.mocked(api.patch).mockResolvedValue({ perfilCompleto: true })
    vi.mocked(api.get).mockResolvedValueOnce({ ...rawInvestigador, perfilCompleto: true })

    await act(async () => { await result.current.completarPerfil({ institucion: 'IIAP' }) })

    expect(api.patch).toHaveBeenCalledWith('/auth/completar-perfil', { institucion: 'IIAP' })
    expect(result.current.user).toMatchObject({ perfilCompleto: true })
  })

  test('completarPerfil() pasa perfilSolicitado y motivo al PATCH cuando se piden', async () => {
    vi.mocked(api.get).mockResolvedValue({ ...rawInvestigador, perfilCompleto: false })
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.initializing).toBe(false))

    vi.mocked(api.patch).mockResolvedValue({ perfilCompleto: true, rolSolicitado: 'investigador' })
    vi.mocked(api.get).mockResolvedValueOnce({ ...rawInvestigador, perfilCompleto: true })

    await act(async () => {
      await result.current.completarPerfil({
        institucion: 'IIAP', perfilSolicitado: 'investigador', motivo: 'Investigación',
      })
    })

    expect(api.patch).toHaveBeenCalledWith('/auth/completar-perfil', {
      institucion: 'IIAP', perfilSolicitado: 'investigador', motivo: 'Investigación',
    })
  })
})

describe('AuthProvider — normalización de tema', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('tema es null cuando /auth/me no lo incluye', async () => {
    vi.mocked(api.get).mockResolvedValue(rawInvestigador)

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.initializing).toBe(false))

    expect(result.current.user).toMatchObject({ tema: null })
  })

  test('tema pasa directo cuando /auth/me lo reporta', async () => {
    vi.mocked(api.get).mockResolvedValue({ ...rawInvestigador, tema: 'dark' })

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.initializing).toBe(false))

    expect(result.current.user).toMatchObject({ tema: 'dark' })
  })
})

describe('useAuth() outside AuthProvider', () => {
  test('throws a descriptive error', () => {
    expect(() => renderHook(() => useAuth())).toThrow('useAuth debe usarse dentro de AuthProvider')
  })
})
