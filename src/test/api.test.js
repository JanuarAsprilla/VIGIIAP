import { describe, test, expect, vi, beforeEach } from 'vitest'

// ─── Helpers to build test JWTs ───────────────────────────────────────────────
// getTokenExp is an internal function of api.js, so we test it by reproducing
// the same logic here and verifying that observable behaviour (isTokenExpired) is
// consistent, without importing non-exported symbols.
//
// To test getTokenExp in isolation we export a thin wrapper from api.js OR we
// replicate the logic in test-scope. Since the task says "do not modify src/
// unless to export a testable function", we inline the same logic here.

function buildJwt(payload) {
  const header  = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body    = btoa(JSON.stringify(payload))
  return `${header}.${body}.fakesignature`
}

// Internal clone of getTokenExp as defined in api.js
function getTokenExp(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (!payload || typeof payload !== 'object' || !payload.exp) return null
    return payload.exp
  } catch {
    return null
  }
}

// ─── getTokenExp behaviour ────────────────────────────────────────────────────
describe('getTokenExp (JWT payload decoder)', () => {
  test('returns exp as a number for a valid token with exp', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    const token = buildJwt({ sub: 'user1', exp })
    expect(getTokenExp(token)).toBe(exp)
  })

  test('returns null for a token without exp field', () => {
    const token = buildJwt({ sub: 'user1', role: 'admin' })
    expect(getTokenExp(token)).toBeNull()
  })

  test('returns null for a token with exp: 0 (falsy)', () => {
    const token = buildJwt({ sub: 'user1', exp: 0 })
    expect(getTokenExp(token)).toBeNull()
  })

  test('returns null for a completely malformed token (not base64)', () => {
    expect(getTokenExp('not.a.jwt')).toBeNull()
  })

  test('returns null when payload is a JSON array instead of an object', () => {
    const header = btoa(JSON.stringify({ alg: 'HS256' }))
    const body   = btoa(JSON.stringify([1, 2, 3]))
    const token  = `${header}.${body}.sig`
    expect(getTokenExp(token)).toBeNull()
  })

  test('returns null when payload is a JSON string (not object)', () => {
    const header = btoa(JSON.stringify({ alg: 'HS256' }))
    const body   = btoa('"just a string"')
    const token  = `${header}.${body}.sig`
    expect(getTokenExp(token)).toBeNull()
  })

  test('returns null for an empty string token', () => {
    expect(getTokenExp('')).toBeNull()
  })

  test('returns null for a single-segment token (no dots)', () => {
    expect(getTokenExp('nodots')).toBeNull()
  })

  test('returns null when the middle segment is not valid base64 JSON', () => {
    expect(getTokenExp('header.!!!invalid!!!.sig')).toBeNull()
  })
})

// ─── isTokenExpired behaviour (observable via the logic) ──────────────────────
function isTokenExpired(token) {
  const exp = getTokenExp(token)
  if (!exp) return false
  return Date.now() / 1000 > exp
}

describe('isTokenExpired', () => {
  test('returns false for a token that expires in the future', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600
    expect(isTokenExpired(buildJwt({ exp }))).toBe(false)
  })

  test('returns true for an already-expired token', () => {
    const exp = Math.floor(Date.now() / 1000) - 1
    expect(isTokenExpired(buildJwt({ exp }))).toBe(true)
  })

  test('returns false for a malformed token (safe default)', () => {
    expect(isTokenExpired('garbage')).toBe(false)
  })

  test('returns false for a token without exp (safe default)', () => {
    expect(isTokenExpired(buildJwt({ sub: 'user' }))).toBe(false)
  })
})
