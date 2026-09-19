import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import Terminos from '@/pages/recursos/Terminos'

vi.mock('framer-motion', () => {
  const cache = new Map<string, (p: Record<string, unknown>) => ReactNode>()
  const motion = new Proxy({}, {
    get: (_t, tag: string) => {
      if (!cache.has(tag)) {
        cache.set(tag, ({ children, ...p }: Record<string, unknown>) => createElement(tag, p, children as ReactNode))
      }
      return cache.get(tag)
    },
  })
  return { motion, AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</> }
})

vi.mock('@/components/ui/Card3D', () => ({
  default: ({ children, className }: { children: ReactNode; className?: string }) =>
    <div className={className}>{children}</div>,
}))

function renderPage() {
  return render(<MemoryRouter><Terminos /></MemoryRouter>)
}

describe('Terminos — condiciones de uso (política de privacidad vive en su propia página)', () => {
  test('muestra las secciones de términos de uso', () => {
    renderPage()
    expect(screen.getByText(/1\. Aceptación de Términos/)).toBeInTheDocument()
    expect(screen.getByText(/2\. Uso Autorizado/)).toBeInTheDocument()
    expect(screen.getByText(/3\. Propiedad Intelectual/)).toBeInTheDocument()
  })

  test('enlaza a /politica-privacidad en vez de embeber el texto de la política', () => {
    renderPage()
    const link = screen.getByRole('link', { name: 'Política de Privacidad' })
    expect(link).toHaveAttribute('href', '/politica-privacidad')
    expect(screen.queryByText(/En cumplimiento de la Ley 1581 de 2012/)).not.toBeInTheDocument()
  })
})
