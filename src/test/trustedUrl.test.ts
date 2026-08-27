import { describe, test, expect } from 'vitest'
import { isTrustedUrl } from '@/lib/trustedUrl'

describe('isTrustedUrl', () => {
  test('acepta el propio origen del sitio', () => {
    expect(isTrustedUrl(`${window.location.origin}/api/descargar/mapa/1`)).toBe(true)
  })

  test('rechaza un dominio externo arbitrario', () => {
    expect(isTrustedUrl('https://evil.example.com/malware.exe')).toBe(false)
  })

  test('resuelve una ruta relativa contra el propio origen, sin lanzar', () => {
    expect(isTrustedUrl('/api/descargar/mapa/1')).toBe(true)
    expect(isTrustedUrl('no-es-una-url')).toBe(true)
  })

  test('rechaza esquemas no-http como javascript:', () => {
    expect(isTrustedUrl('javascript:alert(1)')).toBe(false)
  })

  test('rechaza una URL protocol-relative que apunta a otro host', () => {
    expect(isTrustedUrl('//evil.example.com/malware.exe')).toBe(false)
  })

  test('rechaza sin lanzar una URL malformada que ni siquiera el origen propio puede resolver', () => {
    expect(isTrustedUrl('http://[invalid')).toBe(false)
  })
})
