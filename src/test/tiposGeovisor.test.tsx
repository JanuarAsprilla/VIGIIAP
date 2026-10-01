import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  TIPOS_GEOVISOR, tipoDeGeovisor, capasVectorialesSeleccionadas,
} from '@/components/admin/geovisores/tiposGeovisor'
import SelectorTipoGeovisor from '@/components/admin/geovisores/SelectorTipoGeovisor'

describe('tipoDeGeovisor', () => {
  test('es "estandar" cuando ninguna capa tiene fichas', () => {
    expect(tipoDeGeovisor([])).toBe('estandar')
  })

  test('es "fichas" en cuanto una capa tiene fichas', () => {
    expect(tipoDeGeovisor(['clima:estaciones'])).toBe('fichas')
  })
})

describe('capasVectorialesSeleccionadas', () => {
  const capas = [
    { id: 'clima:estaciones', tipo: 'vectorial' },
    { id: 'clima:relieve', tipo: 'raster' },
    { id: 'bio:trampas', tipo: 'vectorial' },
  ]

  test('conserva solo las vectoriales que están seleccionadas', () => {
    expect(capasVectorialesSeleccionadas(['clima:estaciones', 'clima:relieve'], capas)).toEqual(['clima:estaciones'])
  })

  test('ignora ids seleccionados que ya no existen en el catálogo', () => {
    expect(capasVectorialesSeleccionadas(['fantasma:capa'], capas)).toEqual([])
  })
})

describe('SelectorTipoGeovisor', () => {
  test('ofrece un tipo por cada entrada del registro', () => {
    render(<SelectorTipoGeovisor value="estandar" onChange={vi.fn()} />)
    expect(screen.getAllByRole('radio')).toHaveLength(TIPOS_GEOVISOR.length)
  })

  test('marca como seleccionado solo el tipo activo', () => {
    render(<SelectorTipoGeovisor value="fichas" onChange={vi.fn()} />)
    expect(screen.getByRole('radio', { name: /fichas por punto/i })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: /estándar/i })).toHaveAttribute('aria-checked', 'false')
  })

  test('avisa el tipo elegido al hacer clic', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<SelectorTipoGeovisor value="estandar" onChange={onChange} />)
    await user.click(screen.getByRole('radio', { name: /fichas por punto/i }))
    expect(onChange).toHaveBeenCalledWith('fichas')
  })
})
