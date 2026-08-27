import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { Scaling } from 'lucide-react'
import ToolCard from '@/components/herramientas/ToolCard'

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
  return { motion }
})

vi.mock('@/components/ui/Card3D', () => ({
  default: ({ children, className }: { children: ReactNode; className?: string }) =>
    <div className={className}>{children}</div>,
}))

describe('ToolCard', () => {
  test('sin demo, no muestra el aviso de datos de muestra', () => {
    render(
      <ToolCard tag="Geometría" title="Herramienta" icon={Scaling} color="primary" index={0}>
        <p>Contenido</p>
      </ToolCard>,
    )
    expect(screen.queryByText(/Datos de muestra/)).not.toBeInTheDocument()
  })

  test('con demo, muestra el aviso de datos de muestra demostrativos', () => {
    render(
      <ToolCard tag="Geometría" title="Herramienta" icon={Scaling} color="primary" index={0} demo>
        <p>Contenido</p>
      </ToolCard>,
    )
    expect(screen.getByText(/Datos de muestra/)).toBeInTheDocument()
  })

  test('un color no reconocido recae en el estilo primary sin romper', () => {
    const { container } = render(
      <ToolCard tag="X" title="Herramienta" icon={Scaling} color={'inexistente' as 'primary'} index={0}>
        <p>Contenido</p>
      </ToolCard>,
    )
    expect(container.querySelector('.border-t-primary-800')).not.toBeNull()
  })
})
