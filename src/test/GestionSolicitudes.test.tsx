import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import GestionSolicitudes from '@/pages/admin/GestionSolicitudes'
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
  default: ({ children, className }: { children: ReactNode; className?: string }) =>
    <div className={className}>{children}</div>,
}))

vi.mock('@/hooks/useSolicitudes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useSolicitudes')>()
  return {
    ...actual,
    useSolicitudesAdmin: vi.fn(),
    useUpdateEstadoSolicitud: vi.fn(),
    useResponderSolicitud: vi.fn(),
    useSolicitudArchivos: vi.fn(),
    useDeleteSolicitudArchivo: vi.fn(),
    useDownloadSolicitudArchivo: vi.fn(),
  }
})
import {
  useSolicitudesAdmin, useUpdateEstadoSolicitud, useResponderSolicitud,
  useSolicitudArchivos, useDeleteSolicitudArchivo, useDownloadSolicitudArchivo,
} from '@/hooks/useSolicitudes'

function makeSolicitud(overrides: Partial<SolicitudData> = {}): SolicitudData {
  return {
    _id: 'mongo-1', id: 'SOL-001', tipo: 'Certificación', subtipo: 'Uso de suelo',
    solicitante: 'Ana Restrepo', email: 'ana@iiap.gov.co', fecha: '01/01/2025',
    estado: 'Pendiente', diasPendiente: 1, accionesValidas: ['En Revisión', 'Aprobado', 'Rechazado'],
    notas: '', timeline: ['Recibida', 'Pendiente'],
    ...overrides,
  } as SolicitudData
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useSolicitudesAdmin).mockReturnValue({
    data: { data: [makeSolicitud()], meta: { total: 1 } },
  } as unknown as ReturnType<typeof useSolicitudesAdmin>)
  vi.mocked(useUpdateEstadoSolicitud).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useUpdateEstadoSolicitud>)
  vi.mocked(useResponderSolicitud).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useResponderSolicitud>)
  vi.mocked(useSolicitudArchivos).mockReturnValue({ data: [] } as unknown as ReturnType<typeof useSolicitudArchivos>)
  vi.mocked(useDeleteSolicitudArchivo).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useDeleteSolicitudArchivo>)
  vi.mocked(useDownloadSolicitudArchivo).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useDownloadSolicitudArchivo>)
})

describe('GestionSolicitudes — acciones según accionesValidas', () => {
  test('una solicitud sin acciones válidas no muestra botones de cambio de estado', async () => {
    vi.mocked(useSolicitudesAdmin).mockReturnValue({
      data: { data: [makeSolicitud({ accionesValidas: [] })] },
    } as unknown as ReturnType<typeof useSolicitudesAdmin>)

    const user = userEvent.setup()
    render(<GestionSolicitudes />)
    await user.click(screen.getByTitle('Ver detalle'))

    expect(screen.queryByRole('button', { name: /Aprobar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Rechazar/i })).not.toBeInTheDocument()
  })

  test('con Aprobado en accionesValidas, aprobar llama a la mutación con el estado correcto', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useUpdateEstadoSolicitud).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useUpdateEstadoSolicitud>)

    const user = userEvent.setup()
    render(<GestionSolicitudes />)
    await user.click(screen.getByTitle('Ver detalle'))
    const aprobarButtons = screen.getAllByRole('button', { name: /^Aprobar$/i })
    await user.click(aprobarButtons[aprobarButtons.length - 1])
    await user.click(screen.getByRole('button', { name: /Confirmar Aprobación/i }))

    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ id: 'mongo-1', estado: 'Aprobado' }))
  })
})

describe('GestionSolicitudes — enviar respuesta', () => {
  test('una respuesta menor a 10 caracteres no llama a la mutación', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useResponderSolicitud).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useResponderSolicitud>)
    vi.mocked(useSolicitudesAdmin).mockReturnValue({
      data: { data: [makeSolicitud({ accionesValidas: ['Resuelta'] })] },
    } as unknown as ReturnType<typeof useSolicitudesAdmin>)

    const user = userEvent.setup()
    render(<GestionSolicitudes />)
    await user.click(screen.getByTitle('Ver detalle'))
    await user.type(screen.getByPlaceholderText(/Redacta la respuesta oficial/i), 'corta')
    await user.click(screen.getByRole('button', { name: /Enviar y resolver/i }))

    expect(mutateAsync).not.toHaveBeenCalled()
  })

  test('una respuesta válida llama a la mutación con el texto recortado', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useResponderSolicitud).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useResponderSolicitud>)
    vi.mocked(useSolicitudesAdmin).mockReturnValue({
      data: { data: [makeSolicitud({ accionesValidas: ['Resuelta'] })] },
    } as unknown as ReturnType<typeof useSolicitudesAdmin>)

    const user = userEvent.setup()
    render(<GestionSolicitudes />)
    await user.click(screen.getByTitle('Ver detalle'))
    await user.type(screen.getByPlaceholderText(/Redacta la respuesta oficial/i), '  Respuesta oficial suficientemente larga  ')
    await user.click(screen.getByRole('button', { name: /Enviar y resolver/i }))

    expect(mutateAsync).toHaveBeenCalledWith({ id: 'mongo-1', respuesta: 'Respuesta oficial suficientemente larga' })
  })
})
