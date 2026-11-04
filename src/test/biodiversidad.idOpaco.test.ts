import { describe, expect, test } from 'vitest'
import { leerParametros } from '@/components/herramientas/biodiversidad/lib/parametros'
import { urlRegistroGbif } from '@/components/herramientas/biodiversidad/lib/enlaces'

const OPACO = `o${'A1_-'.repeat(8)}`

describe('registro con ubicación reservada (id opaco del servidor)', () => {
  test('la URL acepta el id numérico y el opaco, y descarta cualquier otra cosa', () => {
    expect(leerParametros(new URLSearchParams('registro=5282328258')).registro).toBe('5282328258')
    expect(leerParametros(new URLSearchParams(`registro=${OPACO}`)).registro).toBe(OPACO)
    expect(leerParametros(new URLSearchParams('registro=1;DROP')).registro).toBeNull()
    expect(leerParametros(new URLSearchParams('registro=oabc')).registro).toBeNull()
  })

  test('nunca se enlaza a GBIF con un id opaco (sería enlazar a un registro que no existe)', () => {
    expect(urlRegistroGbif(OPACO)).toBeNull()
    expect(urlRegistroGbif('5282328258')).toBe('https://www.gbif.org/occurrence/5282328258')
  })
})
