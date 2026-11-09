import { describe, test, expect } from 'vitest'
import { urlExportarActividadCsv, MAX_FILAS_CSV } from '@/lib/exportarActividadCsv'

describe('urlExportarActividadCsv', () => {
  test('pide el CSV al endpoint de exportación, sin filtros por omisión', () => {
    expect(urlExportarActividadCsv({}, '/api/v1')).toBe('/api/v1/admin/export/audit?formato=csv')
  })

  test('envía los filtros que el backend aplica, con sus nombres', () => {
    const url = urlExportarActividadCsv({
      filtroModulo: 'auth', filtroAccion: 'login', severidad: 'alta', resultado: 'fallo',
      usuario: 'ana@iiap.gov.co', ip: '10.0.0.1', desde: '2026-01-01', hasta: '2026-01-31',
    }, '/api/v1')
    const params = new URL(url, 'https://x.test').searchParams
    expect(Object.fromEntries(params)).toEqual({
      formato: 'csv', modulo: 'auth', accion: 'login', severidad: 'alta', resultado: 'fallo',
      usuario: 'ana@iiap.gov.co', ip: '10.0.0.1', desde: '2026-01-01', hasta: '2026-01-31T23:59:59.999Z',
    })
  })

  test('omite los filtros vacíos', () => {
    const url = urlExportarActividadCsv({ filtroModulo: '', usuario: undefined }, '/api/v1')
    expect(url).toBe('/api/v1/admin/export/audit?formato=csv')
  })

  test('codifica los valores y respeta una base absoluta', () => {
    const url = urlExportarActividadCsv({ usuario: 'a&b=c' }, 'https://api.iiap.test/api/v1')
    expect(url.startsWith('https://api.iiap.test/api/v1/admin/export/audit?')).toBe(true)
    expect(new URL(url).searchParams.get('usuario')).toBe('a&b=c')
  })

  test('el tope coincide con el del backend', () => {
    expect(MAX_FILAS_CSV).toBe(500_000)
  })
})
