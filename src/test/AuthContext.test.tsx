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
    get:  vi.fn(),
    post: vi.fn(),
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

describe('useAuth() outside AuthProvider', () => {
  test('throws a descriptive error', () => {
    expect(() => renderHook(() => useAuth())).toThrow('useAuth debe usarse dentro de AuthProvider')
  })
})
