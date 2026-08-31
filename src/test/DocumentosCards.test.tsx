import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategoryCard } from '@/pages/documentos/CategoryCard'
import { SupportCTA } from '@/pages/documentos/SupportCTA'
import type { CategoryItem } from '@/pages/documentos/documentos.utils'

function makeCategory(overrides: Partial<CategoryItem> = {}): CategoryItem {
  return {
    id: 'c1',
    title: 'Cartografía',
    icon: 'MapIcon',
    thumbnail: null,
    docs: [
      { id: 'd1', name: 'Mapa 1', type: 'pdf', size: '1MB', updated: '01/01/2026', dateISO: '2026-01-01', url: '/f1.pdf', resumen: '' },
      { id: 'd2', name: 'Mapa 2', type: 'pdf', size: '2MB', updated: '02/01/2026', dateISO: '2026-01-02', url: '/f2.pdf', resumen: '' },
    ],
    ...overrides,
  }
}

describe('CategoryCard', () => {
  test('muestra el título y el conteo total de documentos sin filtro activo', () => {
    render(<CategoryCard category={makeCategory()} filteredCount={null} onOpen={vi.fn()} index={0} />)
    expect(screen.getByText('Cartografía')).toBeInTheDocument()
    expect(screen.getByText('2 docs')).toBeInTheDocument()
  })

  test('con un filtro activo, muestra "coincidencias / total"', () => {
    render(<CategoryCard category={makeCategory()} filteredCount={1} onOpen={vi.fn()} index={0} />)
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
  })

  test('un solo documento usa el singular "doc"', () => {
    render(<CategoryCard category={makeCategory({ docs: [{ id: 'd1', name: 'Mapa 1', type: 'pdf', size: '1MB', updated: '01/01/2026', dateISO: '2026-01-01', url: '/f1.pdf', resumen: '' }] })} filteredCount={null} onOpen={vi.fn()} index={0} />)
    expect(screen.getByText('1 doc')).toBeInTheDocument()
  })

  test('clic en la tarjeta llama a onOpen', async () => {
    const onOpen = vi.fn()
    const user = userEvent.setup()
    render(<CategoryCard category={makeCategory()} filteredCount={null} onOpen={onOpen} index={0} />)
    await user.click(screen.getByRole('button'))
    expect(onOpen).toHaveBeenCalled()
  })

  test('con thumbnail definido, renderiza la imagen en lugar del degradado', () => {
    const { container } = render(<CategoryCard category={makeCategory({ thumbnail: '/thumb.jpg' })} filteredCount={null} onOpen={vi.fn()} index={0} />)
    expect(container.querySelector('img')).toHaveAttribute('src', '/thumb.jpg')
  })

  test('categoría con ícono y título desconocidos usa el ícono y color por defecto sin romper', () => {
    render(<CategoryCard category={makeCategory({ title: 'Rara', icon: 'Inexistente' })} filteredCount={null} onOpen={vi.fn()} index={0} />)
    expect(screen.getByText('Rara')).toBeInTheDocument()
  })
})

describe('SupportCTA', () => {
  test('clic en "Contactar Soporte" llama a onContactar', async () => {
    const onContactar = vi.fn()
    const user = userEvent.setup()
    render(<SupportCTA onContactar={onContactar} />)
    await user.click(screen.getByText('Contactar Soporte'))
    expect(onContactar).toHaveBeenCalled()
  })
})
