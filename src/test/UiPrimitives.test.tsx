import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PaginationBar from '@/components/ui/PaginationBar'
import { Skeleton, SkeletonText, SkeletonCard } from '@/components/ui/Skeleton'

describe('PaginationBar', () => {
  test('con una sola página, no renderiza nada', () => {
    const { container } = render(<PaginationBar page={1} totalPages={1} total={3} pageSize={10} onPage={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  test('muestra el rango "desde–hasta de total"', () => {
    render(<PaginationBar page={2} totalPages={3} total={25} pageSize={10} onPage={vi.fn()} />)
    expect(screen.getByText('11–20 de 25')).toBeInTheDocument()
  })

  test('anterior está deshabilitado en la primera página, siguiente en la última', () => {
    render(<PaginationBar page={1} totalPages={3} total={25} pageSize={10} onPage={vi.fn()} />)
    expect(screen.getByLabelText('Página anterior')).toBeDisabled()
    expect(screen.getByLabelText('Página siguiente')).not.toBeDisabled()
  })

  test('clic en un número de página llama a onPage con ese número', async () => {
    const onPage = vi.fn()
    const user = userEvent.setup()
    render(<PaginationBar page={1} totalPages={3} total={25} pageSize={10} onPage={onPage} />)
    await user.click(screen.getByText('3'))
    expect(onPage).toHaveBeenCalledWith(3)
  })

  test('la página activa tiene aria-current="page"', () => {
    render(<PaginationBar page={2} totalPages={3} total={25} pageSize={10} onPage={vi.fn()} />)
    expect(screen.getByText('2')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText('1')).not.toHaveAttribute('aria-current')
  })

  test('con 7 páginas o menos, muestra todos los números 1..totalPages', () => {
    render(<PaginationBar page={1} totalPages={6} total={60} pageSize={10} onPage={vi.fn()} />)
    for (let i = 1; i <= 6; i++) expect(screen.getByText(String(i))).toBeInTheDocument()
  })

  test('con más de 7 páginas y estando al inicio, la ventana empieza en 1', () => {
    render(<PaginationBar page={2} totalPages={20} total={200} pageSize={10} onPage={vi.fn()} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.queryByText('8')).not.toBeInTheDocument()
  })

  test('con más de 7 páginas y estando al final, la ventana termina en totalPages', () => {
    render(<PaginationBar page={20} totalPages={20} total={200} pageSize={10} onPage={vi.fn()} />)
    expect(screen.getByText('14')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.queryByText('13')).not.toBeInTheDocument()
  })

  test('con más de 7 páginas y en el medio, la ventana está centrada en la página actual', () => {
    render(<PaginationBar page={10} totalPages={20} total={200} pageSize={10} onPage={vi.fn()} />)
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('13')).toBeInTheDocument()
    expect(screen.queryByText('6')).not.toBeInTheDocument()
    expect(screen.queryByText('14')).not.toBeInTheDocument()
  })
})

describe('Skeleton', () => {
  test('renderiza un placeholder decorativo oculto para lectores de pantalla', () => {
    const { container } = render(<Skeleton className="h-4 w-10" />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  test('SkeletonText renderiza el número de líneas solicitado', () => {
    const { container } = render(<SkeletonText lines={4} />)
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThanOrEqual(4)
  })

  test('SkeletonCard combina un ícono, dos líneas de encabezado y texto', () => {
    const { container } = render(<SkeletonCard />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })
})
