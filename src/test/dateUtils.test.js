import { describe, test, expect } from 'vitest'
import { formatDate, timeAgo } from '../lib/dateUtils'

const SPANISH_MONTHS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
]

// ─── formatDate ───────────────────────────────────────────────────────────────
describe('formatDate', () => {
  test('returns a non-empty string for a valid ISO date', () => {
    const result = formatDate('2024-03-15T00:00:00Z')
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })

  test('output contains a Spanish month abbreviation', () => {
    const result = formatDate('2024-06-20T00:00:00Z').toLowerCase()
    const hasSpanishMonth = SPANISH_MONTHS.some((m) => result.includes(m))
    expect(hasSpanishMonth).toBe(true)
  })

  test('output includes the year', () => {
    const result = formatDate('2024-03-15T00:00:00Z')
    expect(result).toContain('2024')
  })

  test('returns empty string for null', () => {
    expect(formatDate(null)).toBe('')
  })

  test('returns empty string for undefined', () => {
    expect(formatDate(undefined)).toBe('')
  })

  test('returns empty string for empty string', () => {
    expect(formatDate('')).toBe('')
  })

  test('throws RangeError for an invalid date string (Intl.DateTimeFormat behaviour)', () => {
    expect(() => formatDate('not-a-date')).toThrow(RangeError)
  })
})

// ─── timeAgo ──────────────────────────────────────────────────────────────────
describe('timeAgo', () => {
  test('returns empty string for null', () => {
    expect(timeAgo(null)).toBe('')
  })

  test('returns empty string for undefined', () => {
    expect(timeAgo(undefined)).toBe('')
  })

  test('returns "hace X min" for a recent timestamp (< 1 hour)', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000).toISOString()
    expect(timeAgo(fiveMinutesAgo)).toMatch(/^hace \d+ min$/)
  })

  test('returns "hace Xh" for a timestamp 2 hours ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60_000).toISOString()
    expect(timeAgo(twoHoursAgo)).toMatch(/^hace \d+h$/)
  })

  test('returns "hace X días" for a timestamp 3 days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60_000).toISOString()
    expect(timeAgo(threeDaysAgo)).toMatch(/^hace \d+ días$/)
  })

  test('falls back to formatDate for timestamps older than 30 days', () => {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60_000).toISOString()
    const result = timeAgo(sixtyDaysAgo).toLowerCase()
    const hasSpanishMonth = SPANISH_MONTHS.some((m) => result.includes(m))
    expect(hasSpanishMonth).toBe(true)
  })

  test('throws RangeError for an invalid date string (Intl.DateTimeFormat behaviour)', () => {
    expect(() => timeAgo('invalid')).toThrow(RangeError)
  })
})
