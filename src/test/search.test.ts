import { describe, test, expect } from 'vitest'
import { normalize, matches } from '@/lib/search'

describe('normalize', () => {
  test('strips accents and lowercases', () => {
    expect(normalize('Hidrología')).toBe('hidrologia')
  })

  test('trims surrounding whitespace', () => {
    expect(normalize('  Mapa  ')).toBe('mapa')
  })

  test('returns an empty string for null/undefined', () => {
    expect(normalize(null)).toBe('')
    expect(normalize(undefined)).toBe('')
  })
})

describe('matches', () => {
  test('an empty query matches everything', () => {
    expect(matches(['Cualquier cosa'], '')).toBe(true)
    expect(matches(['Cualquier cosa'], '   ')).toBe(true)
  })

  test('matches a substring regardless of accents/case', () => {
    expect(matches(['Cartografía Hidrológica'], 'HIDROLOGIA')).toBe(true)
  })

  test('requires every token to match (AND), not just one', () => {
    expect(matches(['Mapa de Hidrología del Chocó'], 'mapa hidro')).toBe(true)
    expect(matches(['Mapa de Hidrología del Chocó'], 'mapa inexistente')).toBe(false)
  })

  test('does not match when no field contains the token', () => {
    expect(matches(['Biodiversidad', 'Fauna'], 'zonificacion')).toBe(false)
  })

  test('ignores null/undefined fields in the haystack instead of throwing', () => {
    expect(matches([null, undefined, 'Ecosistemas'], 'ecosistemas')).toBe(true)
  })

  test('tolerates a single-character typo on words of 5+ letters (fuzzy match)', () => {
    // "analisis" vs "analisi" — 1 char deleted, same length bucket
    expect(matches(['Análisis territorial'], 'analisi')).toBe(true)
  })

  test('does not fuzzy-match short tokens (under 5 chars) with a typo', () => {
    // "mapa" (4 chars) vs "mapx" — must be an exact substring, no fuzzy leeway
    expect(matches(['Mapa base'], 'mapx')).toBe(false)
  })

  test('does not fuzzy-match words whose length differs by more than 2', () => {
    // "hidrografia" (11) vs a much shorter unrelated 8-char token — length gap > 2
    expect(matches(['Hidrografía nacional'], 'hidrogx')).toBe(false)
  })
})
