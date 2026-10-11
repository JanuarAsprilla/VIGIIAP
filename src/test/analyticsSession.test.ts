import { describe, test, expect, beforeEach } from 'vitest'
import {
  obtenerSessionId, esNuevaSesion, detectarDispositivo, parsearNavegador, extraerUtm,
} from '@/lib/analyticsSession'

beforeEach(() => {
  sessionStorage.clear()
})

describe('analyticsSession → obtenerSessionId()', () => {
  test('genera un UUID nuevo cuando no hay sesión guardada', () => {
    const id = obtenerSessionId(1_000_000)
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  })

  test('reutiliza el mismo id dentro de la ventana de 30 min', () => {
    const primero = obtenerSessionId(1_000_000)
    const segundo = obtenerSessionId(1_000_000 + 5 * 60 * 1000) // +5 min
    expect(segundo).toBe(primero)
  })

  test('rota a un id nuevo tras 30+ min de inactividad', () => {
    const primero = obtenerSessionId(1_000_000)
    const segundo = obtenerSessionId(1_000_000 + 31 * 60 * 1000) // +31 min
    expect(segundo).not.toBe(primero)
  })

  test('cada llamada actualiza la marca de última actividad (evita expirar en medio de una visita activa)', () => {
    const primero = obtenerSessionId(0)
    obtenerSessionId(20 * 60 * 1000)       // +20 min, dentro de la ventana
    const tercero = obtenerSessionId(35 * 60 * 1000) // +15 min desde la última — sigue dentro de ventana
    expect(tercero).toBe(primero)
  })
})

describe('analyticsSession → esNuevaSesion()', () => {
  test('true en la primera visita (sin sesión guardada)', () => {
    expect(esNuevaSesion(1_000_000)).toBe(true)
  })

  test('false si ya existe una sesión vigente', () => {
    obtenerSessionId(1_000_000)
    expect(esNuevaSesion(1_000_000 + 60_000)).toBe(false)
  })

  test('true de nuevo tras expirar por inactividad', () => {
    obtenerSessionId(1_000_000)
    expect(esNuevaSesion(1_000_000 + 31 * 60 * 1000)).toBe(true)
  })
})

describe('analyticsSession → detectarDispositivo()', () => {
  test('menos de 768px es móvil', () => {
    expect(detectarDispositivo(375)).toBe('movil')
    expect(detectarDispositivo(767)).toBe('movil')
  })
  test('entre 768 y 1023px es tablet', () => {
    expect(detectarDispositivo(768)).toBe('tablet')
    expect(detectarDispositivo(1023)).toBe('tablet')
  })
  test('1024px o más es escritorio', () => {
    expect(detectarDispositivo(1024)).toBe('escritorio')
    expect(detectarDispositivo(1920)).toBe('escritorio')
  })
})

describe('analyticsSession → parsearNavegador()', () => {
  test('detecta Chrome en Windows', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    expect(parsearNavegador(ua)).toEqual({ navegador: 'Chrome', sistemaOperativo: 'Windows' })
  })

  test('detecta Safari en macOS (sin falso positivo de Chrome)', () => {
    const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
    expect(parsearNavegador(ua)).toEqual({ navegador: 'Safari', sistemaOperativo: 'macOS' })
  })

  test('detecta Firefox en Linux', () => {
    const ua = 'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0'
    expect(parsearNavegador(ua)).toEqual({ navegador: 'Firefox', sistemaOperativo: 'Linux' })
  })

  test('detecta Safari en iOS', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    expect(parsearNavegador(ua)).toEqual({ navegador: 'Safari', sistemaOperativo: 'iOS' })
  })

  test('detecta Chrome en Android', () => {
    const ua = 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
    expect(parsearNavegador(ua)).toEqual({ navegador: 'Chrome', sistemaOperativo: 'Android' })
  })

  test('user-agent vacío no rompe -- retorna nulls', () => {
    expect(parsearNavegador('')).toEqual({ navegador: null, sistemaOperativo: null })
  })
})

describe('analyticsSession → extraerUtm()', () => {
  test('extrae los tres parámetros UTM presentes', () => {
    const utm = extraerUtm('?utm_source=facebook&utm_medium=social&utm_campaign=lanzamiento')
    expect(utm).toEqual({ utmSource: 'facebook', utmMedium: 'social', utmCampaign: 'lanzamiento' })
  })

  test('sin query string, todos son null', () => {
    expect(extraerUtm('')).toEqual({ utmSource: null, utmMedium: null, utmCampaign: null })
  })

  test('ignora otros parámetros de query ajenos a UTM', () => {
    const utm = extraerUtm('?ref=algo&utm_source=google')
    expect(utm).toEqual({ utmSource: 'google', utmMedium: null, utmCampaign: null })
  })
})
