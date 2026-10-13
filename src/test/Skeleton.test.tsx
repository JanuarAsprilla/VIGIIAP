import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SkeletonLista, SkeletonFilasTabla } from '@/components/ui/Skeleton'

describe('SkeletonLista', () => {
  test('anuncia la carga a lectores de pantalla una sola vez y oculta las tarjetas decorativas', () => {
    render(<SkeletonLista filas={4} />)

    const region = screen.getByRole('status')
    expect(region).toHaveAttribute('aria-busy', 'true')
    expect(screen.getAllByText('Cargando…')).toHaveLength(1)
    expect(region.querySelectorAll('[aria-hidden="true"].flex')).toHaveLength(4)
  })

  test('por defecto dibuja 5 filas', () => {
    render(<SkeletonLista />)
    expect(screen.getByRole('status').querySelectorAll('.flex.items-center.gap-4')).toHaveLength(5)
  })
})

describe('SkeletonFilasTabla', () => {
  test('dibuja las filas y columnas pedidas dentro de un tbody, más un aviso accesible', () => {
    render(<table><tbody><SkeletonFilasTabla filas={3} columnas={4} /></tbody></table>)

    const filas = document.querySelectorAll('tbody tr[aria-hidden="true"]')
    expect(filas).toHaveLength(3)
    filas.forEach((fila) => expect(fila.querySelectorAll('td')).toHaveLength(4))
    expect(screen.getByRole('status')).toHaveTextContent('Cargando…')
  })

  test('el aviso accesible ocupa todas las columnas', () => {
    render(<table><tbody><SkeletonFilasTabla columnas={7} /></tbody></table>)
    expect(screen.getByRole('status')).toHaveAttribute('colspan', '7')
  })
})
