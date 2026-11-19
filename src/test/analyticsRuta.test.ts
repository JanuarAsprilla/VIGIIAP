import { describe, test, expect } from 'vitest'
import { rutaParaAnalitica, referrerParaAnalitica } from '@/lib/analyticsRuta'

const TOKEN = 'ab12'.repeat(16)

describe('analyticsRuta → rutaParaAnalitica()', () => {
  test('sustituye el token de restablecimiento y de verificación por :token', () => {
    expect(rutaParaAnalitica(`/reset-password/${TOKEN}`)).toBe('/reset-password/:token')
    expect(rutaParaAnalitica(`/verificar-email/${TOKEN}`)).toBe('/verificar-email/:token')
  })

  test('sustituye cualquier segmento largo hexadecimal, aunque la ruta no sea conocida', () => {
    expect(rutaParaAnalitica(`/otra/${TOKEN}/paso`)).toBe('/otra/:token/paso')
  })

  test('deja intactas las rutas normales, con slugs cortos', () => {
    expect(rutaParaAnalitica('/')).toBe('/')
    expect(rutaParaAnalitica('/geovisores/bosques-del-choco')).toBe('/geovisores/bosques-del-choco')
  })
})

describe('analyticsRuta → referrerParaAnalitica()', () => {
  test('conserva el origen y la ruta normalizada, sin consulta ni fragmento', () => {
    expect(referrerParaAnalitica(`https://app.test/reset-password/${TOKEN}?token=zzz#a`)).toBe('https://app.test/reset-password/:token')
    expect(referrerParaAnalitica('https://www.google.com/search?q=atrato')).toBe('https://www.google.com/search')
  })

  test('devuelve null si está vacío o no es una URL', () => {
    expect(referrerParaAnalitica('')).toBeNull()
    expect(referrerParaAnalitica('no es url')).toBeNull()
  })
})
