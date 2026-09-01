import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Avatar from '@/components/ui/Avatar'

describe('Avatar', () => {
  test('muestra la imagen cuando hay avatarUrl', () => {
    // alt="" es intencional (imagen decorativa junto al nombre) — le da rol
    // "presentation", no "img", así que se consulta por tag.
    const { container } = render(<Avatar avatarUrl="https://cdn.test/foto.jpg" initials="AR" />)
    const img = container.querySelector('img')
    expect(img).toHaveAttribute('src', 'https://cdn.test/foto.jpg')
  })

  test('cae a las iniciales cuando no hay avatarUrl', () => {
    const { container } = render(<Avatar avatarUrl={null} initials="AR" />)
    expect(container.querySelector('img')).not.toBeInTheDocument()
    expect(screen.getByText('AR')).toBeInTheDocument()
  })

  test('aplica la forma squircle cuando se pasa shape="squircle"', () => {
    render(<Avatar avatarUrl={null} initials="AR" shape="squircle" />)
    expect(screen.getByText('AR').parentElement).toHaveClass('rounded-2xl')
  })
})
