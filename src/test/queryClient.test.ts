import { describe, test, expect, vi, beforeEach } from 'vitest'

const captureExceptionSpy = vi.fn()
vi.mock('@sentry/react', () => ({ captureException: captureExceptionSpy }))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('queryClient — política de reintentos', () => {
  test('no reintenta errores 4xx (fallas del cliente)', async () => {
    const { default: queryClient } = await import('@/lib/queryClient')
    const retry = queryClient.getDefaultOptions().queries?.retry as (count: number, error: unknown) => boolean
    expect(retry(0, { status: 404 })).toBe(false)
    expect(retry(0, { status: 401 })).toBe(false)
  })

  test('reintenta errores que no son 4xx hasta 3 veces', async () => {
    const { default: queryClient } = await import('@/lib/queryClient')
    const retry = queryClient.getDefaultOptions().queries?.retry as (count: number, error: unknown) => boolean
    expect(retry(0, { status: 500 })).toBe(true)
    expect(retry(2, { status: 500 })).toBe(true)
    expect(retry(3, { status: 500 })).toBe(false)
  })

  test('reintenta cuando el error no trae status (p.ej. red caída)', async () => {
    const { default: queryClient } = await import('@/lib/queryClient')
    const retry = queryClient.getDefaultOptions().queries?.retry as (count: number, error: unknown) => boolean
    expect(retry(0, {})).toBe(true)
  })

  test('el retraso entre reintentos crece exponencialmente y se limita a 15s', async () => {
    const { default: queryClient } = await import('@/lib/queryClient')
    const retryDelay = queryClient.getDefaultOptions().queries?.retryDelay as (attempt: number) => number
    expect(retryDelay(0)).toBe(1000)
    expect(retryDelay(1)).toBe(2000)
    expect(retryDelay(2)).toBe(4000)
    expect(retryDelay(10)).toBe(15_000)
  })
})

describe('queryClient — errores de mutaciones', () => {
  test('reporta el error de una mutación fallida a Sentry', async () => {
    const { default: queryClient } = await import('@/lib/queryClient')
    const onError = queryClient.getDefaultOptions().mutations?.onError as (error: unknown) => void
    const err = new Error('fallo de red')
    onError(err)
    expect(captureExceptionSpy).toHaveBeenCalledWith(err, { level: 'error', tags: { source: 'mutation' } })
  })
})
