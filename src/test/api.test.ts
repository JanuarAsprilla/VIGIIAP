/**
 * Tests for the real axios client in src/lib/api.ts — request/response
 * interceptors, silent session refresh, and error normalization.
 *
 * Strategy: swap axios's `adapter` for a fake transport function instead of
 * mocking @/lib/api itself. This exercises the actual interceptor pipeline
 * (including the retry-with-refreshed-token path) with no real network I/O.
 * The module is re-imported fresh in each test so the module-scoped
 * `refreshPromise` singleton never leaks state between tests.
 */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'

type FakeAdapter = (config: AxiosRequestConfig) => Promise<AxiosResponse>

function ok(config: AxiosRequestConfig, data: unknown): AxiosResponse {
  return { data, status: 200, statusText: 'OK', headers: {}, config } as AxiosResponse
}

function unauthorized(config: AxiosRequestConfig, message = 'Token inválido o expirado') {
  const err = new Error(message) as Error & { config: AxiosRequestConfig; response: unknown }
  err.config   = config
  err.response = { status: 401, data: { error: message } }
  return err
}

async function loadApi() {
  vi.resetModules()
  localStorage.clear()
  const mod = await import('@/lib/api')
  return mod.default
}

describe('api.ts — response interceptor', () => {
  let dispatchSpy: ReturnType<typeof vi.spyOn>
  const originalGlobalAdapter = axios.defaults.adapter

  beforeEach(() => {
    dispatchSpy = vi.spyOn(window, 'dispatchEvent')
  })

  afterEach(() => {
    // attemptRefresh() en api.ts llama a axios.post() directo (no a la
    // instancia `api`), para evitar reentrar el propio interceptor de
    // respuesta durante un refresh — así que los tests que necesitan
    // interceptar ese POST /auth/refresh pisan también el adapter global.
    // Se restaura acá para no filtrar el fake adapter a otros archivos de test.
    axios.defaults.adapter = originalGlobalAdapter
  })

  test('unwraps res.data on a successful response', async () => {
    const api = await loadApi()
    api.defaults.adapter = ((config: AxiosRequestConfig) =>
      Promise.resolve(ok(config, { foo: 'bar' }))) as FakeAdapter
    await expect(api.get('/whatever')).resolves.toEqual({ foo: 'bar' })
  })

  test('on a 401 from a protected endpoint, silently refreshes and retries once', async () => {
    const api = await loadApi()
    const calls: string[] = []
    const fakeAdapter = (async (config: AxiosRequestConfig) => {
      calls.push(config.url ?? '')
      if (config.url?.includes('/auth/refresh')) return ok(config, { token: 'new-access-token' })
      if (!(config as { _retried?: boolean })._retried) throw unauthorized(config)
      return ok(config, { secret: 42 })
    }) as FakeAdapter
    api.defaults.adapter = fakeAdapter
    // attemptRefresh() usa axios.post() directo, no la instancia `api` — hay
    // que interceptar también el adapter global para que ese POST se resuelva.
    axios.defaults.adapter = fakeAdapter

    await expect(api.get('/protegido')).resolves.toEqual({ secret: 42 })
    expect(calls).toEqual(['/protegido', expect.stringContaining('/auth/refresh'), '/protegido'])
  })

  test('shares a single in-flight refresh across concurrent 401s (no duplicate /auth/refresh calls)', async () => {
    const api = await loadApi()
    let refreshCalls = 0
    const fakeAdapter = (async (config: AxiosRequestConfig) => {
      if (config.url?.includes('/auth/refresh')) {
        refreshCalls++
        await new Promise((r) => setTimeout(r, 5))
        return ok(config, { token: 'new' })
      }
      if (!(config as { _retried?: boolean })._retried) throw unauthorized(config)
      return ok(config, { ok: true })
    }) as FakeAdapter
    api.defaults.adapter = fakeAdapter
    axios.defaults.adapter = fakeAdapter

    await Promise.all([api.get('/a'), api.get('/b'), api.get('/c')])
    expect(refreshCalls).toBe(1)
  })

  test('logs out (dispatches vigiiap:logout, clears local session) when refresh also fails', async () => {
    const api = await loadApi()
    localStorage.setItem('vigiiap_token', 'stale')
    api.defaults.adapter = ((config: AxiosRequestConfig) =>
      Promise.reject(unauthorized(config, 'Refresh token no encontrado'))) as FakeAdapter

    await expect(api.get('/protegido')).rejects.toMatchObject({ status: 401 })
    expect(localStorage.getItem('vigiiap_token')).toBeNull()
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'vigiiap:logout' }))
  })

  test('does not attempt a silent refresh for a failed /auth/login itself', async () => {
    const api = await loadApi()
    let refreshCalls = 0
    api.defaults.adapter = ((config: AxiosRequestConfig) => {
      if (config.url === '/auth/refresh') refreshCalls++
      return Promise.reject(unauthorized(config, 'Credenciales incorrectas'))
    }) as FakeAdapter

    await expect(api.post('/auth/login', {})).rejects.toThrow('Credenciales incorrectas')
    expect(refreshCalls).toBe(0)
  })

  test('does not retry a request twice — a second 401 after refresh falls through to logout', async () => {
    const api = await loadApi()
    api.defaults.adapter = ((config: AxiosRequestConfig) => {
      if (config.url === '/auth/refresh') return Promise.resolve(ok(config, { token: 'new' }))
      // Always 401s, even after "refresh" — must not loop forever.
      return Promise.reject(unauthorized(config))
    }) as FakeAdapter

    await expect(api.get('/protegido')).rejects.toMatchObject({ status: 401 })
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'vigiiap:logout' }))
  })

  test('dispatches vigiiap:rate-limit with the server message on a 429', async () => {
    const api = await loadApi()
    api.defaults.adapter = ((config: AxiosRequestConfig) => {
      const err = new Error('429') as Error & { config: AxiosRequestConfig; response: unknown }
      err.config   = config
      err.response = { status: 429, data: { error: 'Demasiadas peticiones, intenta más tarde' } }
      return Promise.reject(err)
    }) as FakeAdapter

    await expect(api.get('/algo')).rejects.toThrow()
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'vigiiap:rate-limit', detail: { message: 'Demasiadas peticiones, intenta más tarde' } }),
    )
  })

  test('normalizes a non-string error payload to a generic message', async () => {
    const api = await loadApi()
    api.defaults.adapter = ((config: AxiosRequestConfig) => {
      const err = new Error('boom') as Error & { config: AxiosRequestConfig; response: unknown }
      err.config   = config
      err.response = { status: 500, data: { error: { unexpected: 'shape' } } }
      return Promise.reject(err)
    }) as FakeAdapter

    await expect(api.get('/roto')).rejects.toMatchObject({ status: 500, message: 'Error inesperado' })
  })
})

describe('api.ts — request interceptor', () => {
  test('FormData uploads drop the JSON Content-Type header and extend the timeout to 5 minutes', async () => {
    const api = await loadApi()
    let seen: AxiosRequestConfig | undefined
    api.defaults.adapter = ((config: AxiosRequestConfig) => {
      seen = config
      return Promise.resolve(ok(config, {}))
    }) as FakeAdapter

    const fd = new FormData()
    fd.append('archivo', new Blob(['x']), 'x.pdf')
    await api.post('/mapas', fd)

    // El interceptor borra el 'application/json' que forzaría el default del
    // cliente — el valor final concreto (multipart boundary, etc.) lo decide
    // el adapter real en el navegador, fuera del alcance de este test.
    expect(seen?.headers?.['Content-Type']).not.toBe('application/json')
    expect(seen?.timeout).toBe(300_000)
  })

  test('a plain JSON request keeps the default 15s timeout and Content-Type', async () => {
    const api = await loadApi()
    let seen: AxiosRequestConfig | undefined
    api.defaults.adapter = ((config: AxiosRequestConfig) => {
      seen = config
      return Promise.resolve(ok(config, {}))
    }) as FakeAdapter

    await api.post('/mapas', { titulo: 'Test' })

    expect(seen?.headers?.['Content-Type']).toBe('application/json')
    expect(seen?.timeout).toBe(15_000)
  })
})
