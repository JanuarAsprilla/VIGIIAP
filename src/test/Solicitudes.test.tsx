import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode, type RefObject } from 'react'
import Solicitudes from '@/pages/Solicitudes'
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
    id: '#AAAAAAAA',
    _id: 'aaaaaaaa-0000-0000-0000-000000000000',
    tipo: 'Certificado de Uso de Suelo',
    tipoRaw: 'uso-suelo',
    subtipo: 'Predio La Esperanza',
    descripcion: 'Predio La Esperanza',
    fecha: '01/01/2026',
    creadoEn: '2026-01-01T00:00:00Z',
    estado: 'Pendiente',
    estadoRaw: 'pendiente',
    estadoColor: 'orange',
    solicitante: 'Ana Restrepo',
    email: 'ana@example.com',
    notas: '',
    respondidaEn: null,
    timeline: ['Recibida', 'Pendiente'],
    revisor: null,
    diasPendiente: 2,
    accionesValidas: ['En Revisión', 'Aprobado', 'Rechazado'],
    ...overrides,
  }
}

const rows: SolicitudData[] = [
  makeRow({ id: '#AAA1', tipo: 'Certificado de Uso de Suelo', estado: 'Pendiente' }),
  makeRow({ id: '#AAA2', tipo: 'Consulta de Linderos', estado: 'Aprobado' }),
]

vi.mock('@/hooks/useSolicitudes', () => ({
  useMisSolicitudes: () => ({ data: { data: rows, meta: {} } }),
}))

let searchQuery = ''
vi.mock('@/contexts/SearchContext', () => ({ useSearch: () => ({ query: searchQuery, setQuery: vi.fn() }) }))

const { exportCSVSpy } = vi.hoisted(() => ({ exportCSVSpy: vi.fn() }))
vi.mock('@/pages/solicitudes/solicitudes.utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/pages/solicitudes/solicitudes.utils')>()
  return { ...actual, exportCSV: exportCSVSpy }
})

vi.mock('@/pages/solicitudes/SolicitudesTable', () => ({
  SolicitudesTable: ({ totalAll, page, totalPages, onVerDetalle, onFiltroChange, onPrev, onNext }: {
    totalAll: number; page: number; totalPages: number
    onVerDetalle: (s: SolicitudData) => void
    onFiltroChange: (v: string) => void
    onPrev: () => void; onNext: () => void
  }) => (
    <div>
      <span>Total: {totalAll}</span>
      <span>Página: {page} / {totalPages}</span>
      <button onClick={() => onVerDetalle(rows[0])}>Ver detalle fila</button>
      <button onClick={() => onFiltroChange('Aprobado')}>Filtrar Aprobado</button>
      <button onClick={onPrev}>Prev</button>
      <button onClick={onNext}>Next</button>
    </div>
  ),
}))
vi.mock('@/pages/solicitudes/NuevaSolicitudForm', () => ({
  NuevaSolicitudForm: ({ formRef }: { formRef: RefObject<HTMLDivElement | null> }) => (
    <div ref={formRef}>Formulario Nueva Solicitud</div>
  ),
}))
vi.mock('@/pages/solicitudes/MisSolicitudes', () => ({
  MisSolicitudes: () => <div>Mis Solicitudes</div>,
}))
vi.mock('@/pages/solicitudes/AyudaCTA', () => ({
  AyudaCTA: () => <div>Ayuda CTA</div>,
}))
vi.mock('@/pages/solicitudes/BottomStats', () => ({
  BottomStats: ({ rows: r }: { rows: SolicitudData[] }) => <div>Stats: {r.length}</div>,
}))
vi.mock('@/pages/solicitudes/DetalleSolicitudModal', () => ({
  DetalleSolicitudModal: ({ sol, onClose }: { sol: SolicitudData; onClose: () => void }) => (
    <div>
      <span>Detalle de {sol.id}</span>
      <button onClick={onClose}>Cerrar detalle</button>
    </div>
  ),
}))

beforeEach(() => {
  vi.clearAllMocks()
  searchQuery = ''
})

describe('Solicitudes — orquestación de página', () => {
  test('muestra el total sin filtrar y las estadísticas de todas las filas', () => {
    render(<Solicitudes />)
    expect(screen.getByText('Total: 2')).toBeInTheDocument()
    expect(screen.getByText('Stats: 2')).toBeInTheDocument()
  })

  test('filtrar por estado reduce el total mostrado en la tabla', async () => {
    const user = userEvent.setup()
    render(<Solicitudes />)
    await user.click(screen.getByText('Filtrar Aprobado'))
    expect(screen.getByText('Total: 1')).toBeInTheDocument()
  })

  test('la búsqueda global filtra por id, tipo, subtipo o estado', () => {
    searchQuery = 'linderos'
    render(<Solicitudes />)
    expect(screen.getByText('Total: 1')).toBeInTheDocument()
  })

  test('exportar reporte llama a exportCSV con las filas filtradas', async () => {
    const user = userEvent.setup()
    render(<Solicitudes />)
    await user.click(screen.getByText('Exportar Reporte'))
    expect(exportCSVSpy).toHaveBeenCalledWith(rows)
  })

  test('ver detalle abre el modal y cerrarlo lo oculta', async () => {
    const user = userEvent.setup()
    render(<Solicitudes />)
    await user.click(screen.getByText('Ver detalle fila'))
    expect(screen.getByText('Detalle de #AAA1')).toBeInTheDocument()

    await user.click(screen.getByText('Cerrar detalle'))
    expect(screen.queryByText('Detalle de #AAA1')).not.toBeInTheDocument()
  })

  test('Nueva Solicitud hace scroll hacia el formulario', async () => {
    const user = userEvent.setup()
    const scrollSpy = vi.fn()
    HTMLElement.prototype.scrollIntoView = scrollSpy
    render(<Solicitudes />)
    await user.click(screen.getByText('Nueva Solicitud'))
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
  })
})
