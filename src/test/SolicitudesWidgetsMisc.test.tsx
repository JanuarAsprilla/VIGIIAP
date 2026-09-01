import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { StatusBadge } from '@/pages/solicitudes/StatusBadge'
import { AyudaCTA } from '@/pages/solicitudes/AyudaCTA'
import { BottomStats } from '@/pages/solicitudes/BottomStats'
import type { SolicitudData } from '@/hooks/useSolicitudes'

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

function makeRow(overrides: Partial<SolicitudData> = {}): SolicitudData {
  return {
    id: '#AAAAAAAA', _id: 'a', tipo: 'x', tipoRaw: 'x', subtipo: '', descripcion: '',
    fecha: '01/01/2026', creadoEn: '2026-01-01T00:00:00Z',
    estado: 'Pendiente', estadoRaw: 'pendiente', estadoColor: 'orange',
    solicitante: '', email: '', notas: '', respondidaEn: null,
    timeline: [], revisor: null, diasPendiente: 0, accionesValidas: [],
    ...overrides,
  }
}

describe('StatusBadge', () => {
  test('aplica el color correspondiente al estado', () => {
    render(<StatusBadge estado="Aprobado" color="green" />)
    expect(screen.getByText('Aprobado')).toBeInTheDocument()
    expect(screen.getByText('Aprobado').className).toMatch(/text-primary-700/)
  })
})

describe('AyudaCTA', () => {
  test('enlaza a la guía de usuario', () => {
    render(<MemoryRouter><AyudaCTA /></MemoryRouter>)
    expect(screen.getByRole('link', { name: /Consultar Guía Técnica/i })).toHaveAttribute('href', '/guia-usuario')
  })
})

describe('BottomStats', () => {
  test('calcula el total, en proceso, tasa de resueltas y rechazadas', () => {
    const rows = [
      makeRow({ estado: 'Pendiente' }),
      makeRow({ estado: 'En Revisión' }),
      makeRow({ estado: 'Aprobado' }),
      makeRow({ estado: 'Resuelta' }),
      makeRow({ estado: 'Rechazado' }),
    ]
    render(<BottomStats rows={rows} />)
    expect(screen.getByText('Total').nextSibling?.textContent).toBe('5')
    expect(screen.getByText('En Proceso').nextSibling?.textContent).toBe('2')
    expect(screen.getByText('Resueltas').nextSibling?.textContent).toBe('40%')
    expect(screen.getByText('Rechazadas').nextSibling?.textContent).toBe('1')
  })

  test('sin filas, la tasa de resueltas muestra un guion en lugar de dividir por cero', () => {
    render(<BottomStats rows={[]} />)
    expect(screen.getByText('Resueltas').nextSibling?.textContent).toBe('—')
  })
})
