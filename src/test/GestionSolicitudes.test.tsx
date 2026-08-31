import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import GestionSolicitudes from '@/pages/admin/GestionSolicitudes'
import type { SolicitudData, ArchivoSolicitud } from '@/hooks/useSolicitudes'

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

describe('GestionSolicitudes — tabla', () => {
  test('muestra la solicitud con tipo, solicitante y estado', () => {
    render(<GestionSolicitudes />)
    expect(screen.getByText('SOL-001')).toBeInTheDocument()
    expect(screen.getByText('Ana Restrepo')).toBeInTheDocument()
    expect(screen.getByText('Pendiente', { selector: 'span' })).toBeInTheDocument()
  })

  test('sin solicitudes, muestra "Sin resultados"', () => {
    vi.mocked(useSolicitudesAdmin).mockReturnValue({
      data: { data: [], meta: { total: 0 } },
    } as unknown as ReturnType<typeof useSolicitudesAdmin>)

    render(<GestionSolicitudes />)
    expect(screen.getByText('Sin resultados')).toBeInTheDocument()
  })

  test('una solicitud con 7 o más días pendiente y acciones válidas se marca "urgente"', () => {
    vi.mocked(useSolicitudesAdmin).mockReturnValue({
      data: { data: [makeSolicitud({ diasPendiente: 8 })], meta: { total: 1 } },
    } as unknown as ReturnType<typeof useSolicitudesAdmin>)

    render(<GestionSolicitudes />)
    expect(screen.getByText('urgente')).toBeInTheDocument()
  })

  test('marcar en revisión desde la tabla llama a la mutación con el estado correcto', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useUpdateEstadoSolicitud).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useUpdateEstadoSolicitud>)

    const user = userEvent.setup()
    render(<GestionSolicitudes />)
    await user.click(screen.getByTitle('Marcar en revisión'))

    expect(mutateAsync).toHaveBeenCalledWith({ id: 'mongo-1', estado: 'En Revisión' })
  })

  test('si falla marcar en revisión, muestra un toast de error', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('fail'))
    vi.mocked(useUpdateEstadoSolicitud).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useUpdateEstadoSolicitud>)

    const user = userEvent.setup()
    render(<GestionSolicitudes />)
    await user.click(screen.getByTitle('Marcar en revisión'))

    expect(await screen.findByText('Error al actualizar la solicitud')).toBeInTheDocument()
  })
})

describe('GestionSolicitudes — filtros', () => {
  test('el buscador actualiza el input controlado', async () => {
    const user = userEvent.setup()
    render(<GestionSolicitudes />)
    const input = screen.getByLabelText('Buscar solicitudes por ID, tipo o solicitante')
    await user.type(input, 'ana')
    expect(input).toHaveValue('ana')
  })

  test('cambiar el filtro de estado no rompe el render', async () => {
    const user = userEvent.setup()
    render(<GestionSolicitudes />)
    await user.selectOptions(screen.getByLabelText('Filtrar por estado de solicitud'), 'Aprobado')
    expect(screen.getByLabelText('Filtrar por estado de solicitud')).toHaveValue('Aprobado')
  })
})

describe('GestionSolicitudes — rechazar', () => {
  test('con Rechazado en accionesValidas, rechazar llama a la mutación con nota y notifica', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useUpdateEstadoSolicitud).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useUpdateEstadoSolicitud>)

    const user = userEvent.setup()
    render(<GestionSolicitudes />)
    await user.click(screen.getByTitle('Ver detalle'))
    const rechazarButtons = screen.getAllByRole('button', { name: /^Rechazar$/i })
    await user.click(rechazarButtons[rechazarButtons.length - 1])
    await user.type(screen.getByPlaceholderText('Agregar comentario o motivo...'), 'Documentación incompleta')
    await user.click(screen.getByRole('button', { name: /Confirmar Rechazo/i }))

    expect(mutateAsync).toHaveBeenCalledWith({ id: 'mongo-1', estado: 'Rechazado', nota: 'Documentación incompleta' })
    expect(await screen.findByText(/rechazada — se notificó al solicitante/)).toBeInTheDocument()
  })

  test('cancelar el modal de acción no llama a la mutación', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useUpdateEstadoSolicitud).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useUpdateEstadoSolicitud>)

    const user = userEvent.setup()
    render(<GestionSolicitudes />)
    await user.click(screen.getByTitle('Ver detalle'))
    const aprobarButtons = screen.getAllByRole('button', { name: /^Aprobar$/i })
    await user.click(aprobarButtons[aprobarButtons.length - 1])
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(mutateAsync).not.toHaveBeenCalled()
    expect(screen.queryByText('Confirmar Aprobación')).not.toBeInTheDocument()
  })

  test('si falla la acción, muestra un toast de error genérico', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('fail'))
    vi.mocked(useUpdateEstadoSolicitud).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useUpdateEstadoSolicitud>)

    const user = userEvent.setup()
    render(<GestionSolicitudes />)
    await user.click(screen.getByTitle('Ver detalle'))
    const aprobarButtons = screen.getAllByRole('button', { name: /^Aprobar$/i })
    await user.click(aprobarButtons[aprobarButtons.length - 1])
    await user.click(screen.getByRole('button', { name: /Confirmar Aprobación/i }))

    expect(await screen.findByText('Error al procesar la solicitud')).toBeInTheDocument()
  })
})

describe('GestionSolicitudes — drawer de detalle', () => {
  test('cerrar el drawer con la X lo oculta', async () => {
    const user = userEvent.setup()
    render(<GestionSolicitudes />)
    await user.click(screen.getByTitle('Ver detalle'))
    expect(screen.getByText('Historial del trámite')).toBeInTheDocument()

    const closeButtons = screen.getAllByRole('button').filter((b) => b.querySelector('.lucide-x'))
    await user.click(closeButtons[closeButtons.length - 1])
    expect(screen.queryByText('Historial del trámite')).not.toBeInTheDocument()
  })

  test('sin descripción, muestra el subtipo como respaldo', async () => {
    vi.mocked(useSolicitudesAdmin).mockReturnValue({
      data: { data: [makeSolicitud({ descripcion: undefined, subtipo: 'Uso de suelo' })], meta: { total: 1 } },
    } as unknown as ReturnType<typeof useSolicitudesAdmin>)

    const user = userEvent.setup()
    render(<GestionSolicitudes />)
    await user.click(screen.getByTitle('Ver detalle'))
    expect(screen.getAllByText('Uso de suelo').length).toBeGreaterThan(0)
  })

  test('una solicitud resuelta muestra la respuesta enviada', async () => {
    vi.mocked(useSolicitudesAdmin).mockReturnValue({
      data: { data: [makeSolicitud({ estado: 'Resuelta', notas: 'Se aprobó el trámite', accionesValidas: [] })], meta: { total: 1 } },
    } as unknown as ReturnType<typeof useSolicitudesAdmin>)

    const user = userEvent.setup()
    render(<GestionSolicitudes />)
    await user.click(screen.getByTitle('Ver detalle'))
    expect(screen.getByText('Respuesta enviada al solicitante')).toBeInTheDocument()
    expect(screen.getByText('Se aprobó el trámite')).toBeInTheDocument()
  })
})

describe('GestionSolicitudes — archivos adjuntos', () => {
  function makeArchivo(overrides: Partial<ArchivoSolicitud> = {}): ArchivoSolicitud {
    return { id: 'a1', nombre: 'plano.pdf', tamano_bytes: 2048, url: '/a1.pdf', ...overrides }
  }

  test('sin archivos, muestra el mensaje de "sin documentos"', async () => {
    const user = userEvent.setup()
    render(<GestionSolicitudes />)
    await user.click(screen.getByTitle('Ver detalle'))
    expect(screen.getByText('Sin documentos adjuntos')).toBeInTheDocument()
  })

  test('con archivos, descargar abre el enlace generado', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ url: 'https://cdn.example.com/a1.pdf' })
    vi.mocked(useDownloadSolicitudArchivo).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useDownloadSolicitudArchivo>)
    vi.mocked(useSolicitudArchivos).mockReturnValue({ data: [makeArchivo()] } as unknown as ReturnType<typeof useSolicitudArchivos>)

    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    const user = userEvent.setup()
    render(<GestionSolicitudes />)
    await user.click(screen.getByTitle('Ver detalle'))
    await user.click(screen.getByText('Descargar'))

    expect(mutateAsync).toHaveBeenCalledWith({ solicitudId: 'mongo-1', archivoId: 'a1' })
    expect(openSpy).toHaveBeenCalledWith('https://cdn.example.com/a1.pdf', '_blank', 'noopener,noreferrer')
    openSpy.mockRestore()
  })

  test('eliminar un archivo llama a la mutación y muestra el toast', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useDeleteSolicitudArchivo).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useDeleteSolicitudArchivo>)
    vi.mocked(useSolicitudArchivos).mockReturnValue({ data: [makeArchivo({ nombre: 'plano.pdf' })] } as unknown as ReturnType<typeof useSolicitudArchivos>)

    const user = userEvent.setup()
    render(<GestionSolicitudes />)
    await user.click(screen.getByTitle('Ver detalle'))
    await user.click(screen.getByText('Eliminar'))
    await user.click(screen.getByRole('button', { name: 'Sí, eliminar' }))

    expect(mutateAsync).toHaveBeenCalledWith({ solicitudId: 'mongo-1', archivoId: 'a1' })
    expect(await screen.findByText('Archivo "plano.pdf" eliminado')).toBeInTheDocument()
  })
})

describe('GestionSolicitudes — exportar CSV', () => {
  test('exportar genera y libera un Object URL', async () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:mock-url')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })

    const user = userEvent.setup()
    render(<GestionSolicitudes />)
    await user.click(screen.getByLabelText('Exportar solicitudes a CSV'))

    expect(createObjectURL).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    vi.unstubAllGlobals()
  })
})
