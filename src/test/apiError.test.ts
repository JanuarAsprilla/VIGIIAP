import { describe, test, expect } from 'vitest'
import { getApiErrorMessage, asApiError } from '@/lib/apiError'

describe('getApiErrorMessage', () => {
  test('returns the message of a real Error', () => {
    expect(getApiErrorMessage(new Error('Credenciales incorrectas'))).toBe('Credenciales incorrectas')
  })

  test('falls back to the default message for a non-Error value', () => {
    expect(getApiErrorMessage('just a string')).toBe('Error inesperado')
    expect(getApiErrorMessage(null)).toBe('Error inesperado')
    expect(getApiErrorMessage(undefined)).toBe('Error inesperado')
    expect(getApiErrorMessage({ message: 'looks like an error but is not' })).toBe('Error inesperado')
  })

  test('uses a custom fallback message when provided', () => {
    expect(getApiErrorMessage(42, 'Algo salió mal')).toBe('Algo salió mal')
  })
})

describe('asApiError', () => {
  test('returns the same Error instance, typed as ApiError', () => {
    const err = Object.assign(new Error('boom'), { status: 500, code: 'FATAL' })
    const result = asApiError(err)
    expect(result).toBe(err)
    expect(result?.status).toBe(500)
    expect(result?.code).toBe('FATAL')
  })

  test('returns null for a non-Error value instead of throwing', () => {
    expect(asApiError('not an error')).toBeNull()
    expect(asApiError(null)).toBeNull()
    expect(asApiError({ status: 500 })).toBeNull()
  })
})
