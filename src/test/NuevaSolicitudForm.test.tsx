import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, createRef, type ReactNode } from 'react'
import { NuevaSolicitudForm } from '@/pages/solicitudes/NuevaSolicitudForm'

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
  return {
    motion,
    AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  }
})

vi.mock('@/hooks/useSolicitudes', () => ({
  useCreateSolicitud: vi.fn(),
  useUploadSolicitudArchivo: vi.fn(),
}))
import { useCreateSolicitud, useUploadSolicitudArchivo } from '@/hooks/useSolicitudes'

const authMock = { user: null as { name: string; email: string } | null, isAuthenticated: false }
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authMock }))

function renderForm() {
  const ref = createRef<HTMLDivElement>()
  return render(<NuevaSolicitudForm formRef={ref} />)
}

const DESC_VALIDA = 'Solicito certificado de uso de suelo para el predio ubicado en la vereda X.'

beforeEach(() => {
  vi.clearAllMocks()
  authMock.user = null
  authMock.isAuthenticated = false
  vi.mocked(useCreateSolicitud).mockReturnValue({
    mutateAsync: vi.fn(), isPending: false,
  } as unknown as ReturnType<typeof useCreateSolicitud>)
  vi.mocked(useUploadSolicitudArchivo).mockReturnValue({
    mutateAsync: vi.fn(), isPending: false,
  } as unknown as ReturnType<typeof useUploadSolicitudArchivo>)
})

describe('NuevaSolicitudForm — validación', () => {
  test('todos los campos vacíos muestran error y no llaman a la mutación', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useCreateSolicitud).mockReturnValue({
      mutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useCreateSolicitud>)

    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: /Enviar Solicitud/i }))

    expect(await screen.findAllByText('Requerido')).not.toHaveLength(0)
    expect(screen.getByText('Seleccione un tipo de trámite')).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  test('un correo con formato inválido muestra error específico', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.type(screen.getByLabelText(/Correo Electrónico/i), 'no-es-un-correo')
    await user.click(screen.getByRole('button', { name: /Enviar Solicitud/i }))

    expect(await screen.findByText('Correo no válido')).toBeInTheDocument()
  })

  test('una descripción menor a 20 caracteres es rechazada', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.type(screen.getByLabelText(/Descripción/i), 'muy corta')
    await user.click(screen.getByRole('button', { name: /Enviar Solicitud/i }))

    expect(await screen.findByText('Mínimo 20 caracteres')).toBeInTheDocument()
  })
})

describe('NuevaSolicitudForm — envío', () => {
  async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText(/Nombre Completo/i), 'Ana Restrepo')
    await user.type(screen.getByLabelText(/Correo Electrónico/i), 'ana@iiap.gov.co')
    await user.selectOptions(screen.getByLabelText(/Tipo de Trámite/i), 'uso-suelo')
    await user.type(screen.getByLabelText(/Descripción/i), DESC_VALIDA)
    await user.click(screen.getByRole('button', { name: /Enviar Solicitud/i }))
  }

  test('con datos válidos llama a la mutación con tipo y descripción, y muestra éxito', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ id: 'sol-1' })
    vi.mocked(useCreateSolicitud).mockReturnValue({
      mutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useCreateSolicitud>)

    const user = userEvent.setup()
    renderForm()
    await fillAndSubmit(user)

    expect(mutateAsync).toHaveBeenCalledWith({ tipo: 'uso-suelo', descripcion: DESC_VALIDA })
    expect(await screen.findByText('¡Solicitud enviada!')).toBeInTheDocument()
  })

  test('un 429 muestra el mensaje de límite diario, no el genérico', async () => {
    const err = Object.assign(new Error('Too many requests'), { status: 429 })
    const mutateAsync = vi.fn().mockRejectedValue(err)
    vi.mocked(useCreateSolicitud).mockReturnValue({
      mutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useCreateSolicitud>)

    const user = userEvent.setup()
    renderForm()
    await fillAndSubmit(user)

    expect(await screen.findByText('Has alcanzado el límite de solicitudes por día. Intenta mañana.')).toBeInTheDocument()
  })

  test('un error no-429 muestra el mensaje del servidor', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('Servicio no disponible'))
    vi.mocked(useCreateSolicitud).mockReturnValue({
      mutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useCreateSolicitud>)

    const user = userEvent.setup()
    renderForm()
    await fillAndSubmit(user)

    expect(await screen.findByText('Servicio no disponible')).toBeInTheDocument()
  })
})

describe('NuevaSolicitudForm — usuario autenticado', () => {
  test('precarga nombre/correo de la sesión y los bloquea de edición', () => {
    authMock.isAuthenticated = true
    authMock.user = { name: 'Ana Restrepo', email: 'ana@iiap.gov.co' }

    renderForm()

    expect(screen.getByLabelText(/Nombre Completo/i)).toHaveValue('Ana Restrepo')
    expect(screen.getByLabelText(/Correo Electrónico/i)).toHaveValue('ana@iiap.gov.co')
    expect(screen.getByLabelText(/Nombre Completo/i)).toHaveAttribute('readonly')
  })
})
