import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import NuevoAnalisisModal from '@/components/NuevoAnalisisModal'

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
  await user.type(screen.getByLabelText(/Nombre del análisis/i), 'Cobertura Cuenca Atrato')
  await user.selectOptions(screen.getByLabelText(/Tipo de análisis/i), 'cobertura')
}

describe('NuevoAnalisisModal — validación', () => {
  test('nombre y tipo son obligatorios', async () => {
    const user = userEvent.setup()
    render(<NuevoAnalisisModal onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: /Iniciar Análisis/i }))

    expect(await screen.findAllByText('Requerido')).toHaveLength(2)
    expect(mutateAsyncSpy).not.toHaveBeenCalled()
  })

  test('escribir en un campo limpia su error', async () => {
    const user = userEvent.setup()
    render(<NuevoAnalisisModal onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: /Iniciar Análisis/i }))
    expect(await screen.findAllByText('Requerido')).toHaveLength(2)

    await user.type(screen.getByLabelText(/Nombre del análisis/i), 'A')
    expect(screen.getAllByText('Requerido')).toHaveLength(1)
  })

  test('al elegir un tipo, muestra las capas recomendadas', async () => {
    const user = userEvent.setup()
    render(<NuevoAnalisisModal onClose={onClose} />)
    expect(screen.queryByText('Capas recomendadas')).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText(/Tipo de análisis/i), 'hidrologia')
    expect(screen.getByText('Capas recomendadas')).toBeInTheDocument()
    expect(screen.getByText('Red Hídrica')).toBeInTheDocument()
  })
})

describe('NuevoAnalisisModal — envío', () => {
  test('con datos válidos, arma la descripción con tipo, área y notas y muestra la confirmación', async () => {
    mutateAsyncSpy.mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<NuevoAnalisisModal onClose={onClose} />)
    await fillValid(user)
    await user.selectOptions(screen.getByLabelText(/Área de interés/i), 'choco')
    await user.type(screen.getByLabelText(/Notas adicionales/i), 'Prioridad alta')
    await user.click(screen.getByRole('button', { name: /Iniciar Análisis/i }))

    expect(mutateAsyncSpy).toHaveBeenCalledWith({
      tipo: 'estudio-ambiental',
      descripcion: '[Análisis: Cobertura Cuenca Atrato] Tipo: cobertura. Departamento: choco. Notas: Prioridad alta',
    })
    expect(await screen.findByText('Análisis Creado')).toBeInTheDocument()
  })

  test('si el servidor falla, muestra el mensaje de error y permanece en el formulario', async () => {
    mutateAsyncSpy.mockRejectedValue(new Error('Servicio no disponible'))
    const user = userEvent.setup()
    render(<NuevoAnalisisModal onClose={onClose} />)
    await fillValid(user)
    await user.click(screen.getByRole('button', { name: /Iniciar Análisis/i }))

    expect(await screen.findByText('Servicio no disponible')).toBeInTheDocument()
    expect(screen.queryByText('Análisis Creado')).not.toBeInTheDocument()
  })

  test('"Entendido" en la pantalla de éxito cierra el modal', async () => {
    mutateAsyncSpy.mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<NuevoAnalisisModal onClose={onClose} />)
    await fillValid(user)
    await user.click(screen.getByRole('button', { name: /Iniciar Análisis/i }))
    await user.click(await screen.findByText('Entendido'))

    expect(onClose).toHaveBeenCalled()
  })
})

describe('NuevoAnalisisModal — cierre', () => {
  test('Cancelar, la X y Escape cierran el modal', async () => {
    const user = userEvent.setup()
    render(<NuevoAnalisisModal onClose={onClose} />)

    await user.click(screen.getByText('Cancelar'))
    expect(onClose).toHaveBeenCalledTimes(1)

    await user.click(screen.getByLabelText('Cerrar modal'))
    expect(onClose).toHaveBeenCalledTimes(2)

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(3)
  })
})
