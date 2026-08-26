import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import FAQ from '@/pages/recursos/FAQ'
import GuiaUsuario from '@/pages/recursos/GuiaUsuario'
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
  default: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}))

describe('FAQ', () => {
  test('todas las preguntas están colapsadas por defecto', () => {
    render(<FAQ />)
    expect(screen.getByText('¿Cómo puedo solicitar acceso al sistema?')).toBeInTheDocument()
    expect(screen.queryByText(/haga clic en "Solicitar Acceso"/)).not.toBeInTheDocument()
  })

  test('clic en una pregunta expande su respuesta, y un segundo clic la colapsa', async () => {
    const user = userEvent.setup()
    render(<FAQ />)
    await user.click(screen.getByText('¿Cómo puedo solicitar acceso al sistema?'))
    expect(screen.getByText(/haga clic en "Solicitar Acceso"/)).toBeInTheDocument()

    await user.click(screen.getByText('¿Cómo puedo solicitar acceso al sistema?'))
    expect(screen.queryByText(/haga clic en "Solicitar Acceso"/)).not.toBeInTheDocument()
  })

  test('cada pregunta se expande de forma independiente', async () => {
    const user = userEvent.setup()
    render(<FAQ />)
    await user.click(screen.getByText('¿Cómo funciona el Geovisor?'))
    expect(screen.getByText(/controles de zoom, búsqueda por coordenadas/)).toBeInTheDocument()
    expect(screen.queryByText(/haga clic en "Solicitar Acceso"/)).not.toBeInTheDocument()
  })
})

describe('GuiaUsuario', () => {
  test('renderiza las seis secciones de la guía', () => {
    render(<GuiaUsuario />)
    expect(screen.getByText('Primeros Pasos')).toBeInTheDocument()
    expect(screen.getByText('Herramientas SIG')).toBeInTheDocument()
    expect(screen.getByText('Solicitudes y Trámites')).toBeInTheDocument()
  })
})

describe('Terminos', () => {
  test('renderiza las secciones de términos de uso', () => {
    render(<Terminos />)
    expect(screen.getByText('1. Aceptación de Términos')).toBeInTheDocument()
    expect(screen.getByText('info@iiap.org.co')).toBeInTheDocument()
  })
})
