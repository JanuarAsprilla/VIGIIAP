import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import SolicitarHerramientaModal from '@/components/herramientas/SolicitarHerramientaModal'

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

const { mutateAsyncSpy } = vi.hoisted(() => ({ mutateAsyncSpy: vi.fn() }))
vi.mock('@/hooks/useSolicitudes', () => ({
  useCreateSolicitud: () => ({ mutateAsync: mutateAsyncSpy, isPending: false }),
}))

const onClose = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
})

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Nombre de la herramienta/i), 'Detector de deforestación')
  await user.selectOptions(screen.getByLabelText(/Tipo de herramienta/i), 'analisis-espacial')
  await user.type(screen.getByLabelText(/Descripción funcional/i), 'Compara imágenes satelitales de dos fechas y resalta pérdida de cobertura boscosa.')
}

describe('SolicitarHerramientaModal — validación', () => {
  test('nombre, tipo y descripción son obligatorios', async () => {
    const user = userEvent.setup()
    render(<SolicitarHerramientaModal onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: /Enviar Solicitud/i }))

    expect(screen.getByText('El nombre es requerido')).toBeInTheDocument()
    expect(screen.getByText('Seleccione un tipo de herramienta')).toBeInTheDocument()
    expect(screen.getByText('La descripción es requerido')).toBeInTheDocument()
    expect(mutateAsyncSpy).not.toHaveBeenCalled()
  })

  test('la descripción exige un mínimo de 20 caracteres', async () => {
    const user = userEvent.setup()
    render(<SolicitarHerramientaModal onClose={onClose} />)
    await user.type(screen.getByLabelText(/Nombre de la herramienta/i), 'Detector')
    await user.selectOptions(screen.getByLabelText(/Tipo de herramienta/i), 'otro')
    await user.type(screen.getByLabelText(/Descripción funcional/i), 'muy corta')
    await user.click(screen.getByRole('button', { name: /Enviar Solicitud/i }))

    expect(screen.getByText('La descripción debe tener al menos 20 caracteres')).toBeInTheDocument()
  })

  test('escribir en un campo limpia su error y el error del servidor', async () => {
    mutateAsyncSpy.mockRejectedValueOnce(new Error('fallo'))
    const user = userEvent.setup()
    render(<SolicitarHerramientaModal onClose={onClose} />)
    await fillValid(user)
    await user.click(screen.getByRole('button', { name: /Enviar Solicitud/i }))
    expect(await screen.findByText('fallo')).toBeInTheDocument()

    await user.type(screen.getByLabelText(/Nombre de la herramienta/i), 'x')
    expect(screen.queryByText('fallo')).not.toBeInTheDocument()
  })
})

describe('SolicitarHerramientaModal — envío', () => {
  test('con datos válidos, arma la descripción con tipo y justificación, y muestra la confirmación', async () => {
    mutateAsyncSpy.mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<SolicitarHerramientaModal onClose={onClose} />)
    await fillValid(user)
    await user.type(screen.getByLabelText(/Justificación/i), 'Monitoreo trimestral de zonas protegidas')
    await user.click(screen.getByRole('button', { name: /Enviar Solicitud/i }))

    expect(mutateAsyncSpy).toHaveBeenCalledWith({
      tipo: 'otro',
      descripcion: '[Solicitud de herramienta: Detector de deforestación] Tipo: analisis-espacial. Compara imágenes satelitales de dos fechas y resalta pérdida de cobertura boscosa. Justificación: Monitoreo trimestral de zonas protegidas',
    })
    expect(await screen.findByText('Solicitud Enviada')).toBeInTheDocument()
  })

  test('sin justificación (opcional), no la añade a la descripción', async () => {
    mutateAsyncSpy.mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<SolicitarHerramientaModal onClose={onClose} />)
    await fillValid(user)
    await user.click(screen.getByRole('button', { name: /Enviar Solicitud/i }))

    expect(mutateAsyncSpy).toHaveBeenCalledWith(expect.objectContaining({
      descripcion: expect.not.stringContaining('Justificación'),
    }))
  })

  test('si el servidor falla, muestra el mensaje de error y no avanza a la confirmación', async () => {
    mutateAsyncSpy.mockRejectedValue(new Error('Límite diario alcanzado'))
    const user = userEvent.setup()
    render(<SolicitarHerramientaModal onClose={onClose} />)
    await fillValid(user)
    await user.click(screen.getByRole('button', { name: /Enviar Solicitud/i }))

    expect(await screen.findByText('Límite diario alcanzado')).toBeInTheDocument()
    expect(screen.queryByText('Solicitud Enviada')).not.toBeInTheDocument()
  })
})

describe('SolicitarHerramientaModal — cierre', () => {
  test('el backdrop, la X, Cancelar y Escape cierran el modal', async () => {
    const user = userEvent.setup()
    render(<SolicitarHerramientaModal onClose={onClose} />)

    await user.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalledTimes(1)

    await user.click(screen.getByLabelText('Cerrar'))
    expect(onClose).toHaveBeenCalledTimes(2)

    await user.click(screen.getByText('Cancelar'))
    expect(onClose).toHaveBeenCalledTimes(3)

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(4)
  })
})
