import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { SolicitudesTable } from '@/pages/solicitudes/SolicitudesTable'
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

function makeRow(overrides: Partial<SolicitudData> = {}): SolicitudData {
  return {
    id: '#AAA1', _id: 'a', tipo: 'Certificado de Uso de Suelo', tipoRaw: 'uso-suelo', subtipo: 'Predio La Esperanza',
    descripcion: '', fecha: '01/01/2026', creadoEn: '2026-01-01T00:00:00Z',
    estado: 'Pendiente', estadoRaw: 'pendiente', estadoColor: 'orange',
    solicitante: '', email: '', notas: '', respondidaEn: null,
    timeline: [], revisor: null, diasPendiente: 0, accionesValidas: [],
    ...overrides,
  }
}

const rows: SolicitudData[] = [
  makeRow({ id: '#AAA1', estado: 'Pendiente', estadoColor: 'orange' }),
  makeRow({ id: '#AAA2', tipo: 'Consulta de Linderos', estado: 'Aprobado', estadoColor: 'green' }),
]

const defaultProps = {
  rows,
  onVerDetalle: vi.fn(),
  filtro: '',
  onFiltroChange: vi.fn(),
  totalAll: 2,
  page: 1,
  totalPages: 1,
  onPrev: vi.fn(),
  onNext: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SolicitudesTable — filas y paginación', () => {
  test('renderiza cada fila con id, tipo, fecha y estado', () => {
    render(<SolicitudesTable {...defaultProps} />)
    expect(screen.getByText('#AAA1')).toBeInTheDocument()
    expect(screen.getByText('Consulta de Linderos')).toBeInTheDocument()
    expect(screen.getByText('Aprobado')).toBeInTheDocument()
  })

  test('sin filas, muestra el estado vacío con el filtro activo', () => {
    render(<SolicitudesTable {...defaultProps} rows={[]} filtro="Rechazado" />)
    expect(screen.getByText('Sin solicitudes')).toBeInTheDocument()
    expect(screen.getByText('No hay solicitudes con estado "Rechazado"')).toBeInTheDocument()
  })

  test('ver detalle llama a onVerDetalle con la solicitud correspondiente', async () => {
    const onVerDetalle = vi.fn()
    const user = userEvent.setup()
    render(<SolicitudesTable {...defaultProps} onVerDetalle={onVerDetalle} />)
    await user.click(screen.getByLabelText('Ver detalle de #AAA2'))
    expect(onVerDetalle).toHaveBeenCalledWith(rows[1])
  })

  test('el botón de página anterior está deshabilitado en la primera página', () => {
    render(<SolicitudesTable {...defaultProps} page={1} totalPages={3} />)
    expect(screen.getByLabelText('Página anterior')).toBeDisabled()
    expect(screen.getByLabelText('Página siguiente')).not.toBeDisabled()
  })

  test('el botón de página siguiente está deshabilitado en la última página', () => {
    render(<SolicitudesTable {...defaultProps} page={3} totalPages={3} />)
    expect(screen.getByLabelText('Página siguiente')).toBeDisabled()
  })

  test('clic en siguiente/anterior invoca los callbacks provistos', async () => {
    const onPrev = vi.fn()
    const onNext = vi.fn()
    const user = userEvent.setup()
    render(<SolicitudesTable {...defaultProps} page={2} totalPages={3} onPrev={onPrev} onNext={onNext} />)
    await user.click(screen.getByLabelText('Página anterior'))
    await user.click(screen.getByLabelText('Página siguiente'))
    expect(onPrev).toHaveBeenCalled()
    expect(onNext).toHaveBeenCalled()
  })

  test('muestra el rango correcto de resultados mostrados', () => {
    render(<SolicitudesTable {...defaultProps} totalAll={10} page={2} totalPages={3} />)
    expect(screen.getByText(/Mostrando 5–6 de 10 solicitudes/)).toBeInTheDocument()
  })
})

describe('SolicitudesTable — filtro por estado', () => {
  test('abre el menú, selecciona un estado y notifica el cambio', async () => {
    const onFiltroChange = vi.fn()
    const user = userEvent.setup()
    render(<SolicitudesTable {...defaultProps} onFiltroChange={onFiltroChange} />)

    await user.click(screen.getByText('Filtrar por estado'))
    await user.click(screen.getByRole('button', { name: 'Aprobado' }))
    expect(onFiltroChange).toHaveBeenCalledWith('Aprobado')
  })

  test('con un filtro activo, el botón muestra la etiqueta seleccionada', () => {
    render(<SolicitudesTable {...defaultProps} filtro="Resuelta" />)
    expect(screen.getByText('Resuelta')).toBeInTheDocument()
  })

  test('clic fuera del menú lo cierra', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <SolicitudesTable {...defaultProps} />
        <button>Fuera</button>
      </div>,
    )
    await user.click(screen.getByText('Filtrar por estado'))
    expect(screen.getByText('Todos los estados')).toBeInTheDocument()
    await user.click(screen.getByText('Fuera'))
    expect(screen.queryByText('Todos los estados')).not.toBeInTheDocument()
  })
})
