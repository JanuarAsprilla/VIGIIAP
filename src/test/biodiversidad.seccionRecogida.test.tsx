import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SeccionFiltro from '@/components/herramientas/biodiversidad/filtros/SeccionFiltro'

const detalles = (titulo: string) => screen.getByText(titulo).closest('details') as HTMLDetailsElement

describe('secciones del panel de filtros', () => {
  test('sin filtros activos arrancan recogidas', () => {
    render(<SeccionFiltro titulo="Territorio" activos={0}><p>contenido</p></SeccionFiltro>)
    expect(detalles('Territorio').open).toBe(false)
  })
  test('con un filtro activo se muestran abiertas para verlo', () => {
    render(<SeccionFiltro titulo="Conservación" activos={1}><p>contenido</p></SeccionFiltro>)
    expect(detalles('Conservación').open).toBe(true)
  })
})
