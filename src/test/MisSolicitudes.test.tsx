import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { MisSolicitudes } from '@/pages/solicitudes/MisSolicitudes'
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

const { useMisSolicitudesMock } = vi.hoisted(() => ({ useMisSolicitudesMock: vi.fn() }))
vi.mock('@/hooks/useSolicitudes', () => ({ useMisSolicitudes: useMisSolicitudesMock }))

function makeRow(overrides: Partial<SolicitudData> = {}): SolicitudData {
  return {
    id: '#AAA1', _id: 'a', tipo: 'Certificado de Uso de Suelo', tipoRaw: 'uso-suelo', subtipo: '',
    descripcion: '', fecha: '01/01/2026', creadoEn: '2026-01-01T00:00:00Z',
    estado: 'Pendiente', estadoRaw: 'pendiente', estadoColor: 'orange',
    solicitante: '', email: '', notas: '', respondidaEn: null,
    timeline: [], revisor: null, diasPendiente: 0, accionesValidas: [],
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('MisSolicitudes', () => {
  test('mientras carga, no renderiza nada', () => {
    useMisSolicitudesMock.mockReturnValue({ data: undefined, isLoading: true })
    const { container } = render(<MisSolicitudes onVerDetalle={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  test('sin solicitudes propias, no renderiza nada', () => {
    useMisSolicitudesMock.mockReturnValue({ data: { data: [] }, isLoading: false })
    const { container } = render(<MisSolicitudes onVerDetalle={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  test('con una solicitud, usa el singular "solicitud registrada"', () => {
    useMisSolicitudesMock.mockReturnValue({ data: { data: [makeRow()] }, isLoading: false })
    render(<MisSolicitudes onVerDetalle={vi.fn()} />)
    expect(screen.getByText('1 solicitud registrada')).toBeInTheDocument()
  })

  test('con varias solicitudes, usa el plural y las lista todas', () => {
    useMisSolicitudesMock.mockReturnValue({
      data: { data: [makeRow({ id: '#AAA1' }), makeRow({ id: '#AAA2', tipo: 'Consulta de Linderos' })] },
      isLoading: false,
    })
    render(<MisSolicitudes onVerDetalle={vi.fn()} />)
    expect(screen.getByText('2 solicitudes registradas')).toBeInTheDocument()
    expect(screen.getByText('Consulta de Linderos')).toBeInTheDocument()
  })

  test('ver detalle llama a onVerDetalle con la solicitud correspondiente', async () => {
    const onVerDetalle = vi.fn()
    const row = makeRow()
    useMisSolicitudesMock.mockReturnValue({ data: { data: [row] }, isLoading: false })
    const user = userEvent.setup()
    render(<MisSolicitudes onVerDetalle={onVerDetalle} />)
    await user.click(screen.getByRole('button'))
    expect(onVerDetalle).toHaveBeenCalledWith(row)
  })
})
