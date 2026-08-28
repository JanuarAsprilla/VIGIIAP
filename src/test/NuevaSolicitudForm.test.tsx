import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

describe('NuevaSolicitudForm — archivos adjuntos', () => {
  function getFileInput(container: HTMLElement) {
    return container.querySelector('input[type="file"]') as HTMLInputElement
  }

  test('adjuntar un archivo lo muestra en la lista con su nombre y tamaño', async () => {
    const { container } = renderForm()
    const file = new File(['contenido'], 'plano.pdf', { type: 'application/pdf' })
    await userEvent.upload(getFileInput(container), file)

    expect(screen.getByText('plano.pdf')).toBeInTheDocument()
    expect(screen.getByText('9 B')).toBeInTheDocument()
  })

  test('quitar un archivo lo elimina de la lista', async () => {
    const { container } = renderForm()
    const file = new File(['contenido'], 'plano.pdf', { type: 'application/pdf' })
    const user = userEvent.setup()
    await user.upload(getFileInput(container), file)
    await user.click(screen.getByLabelText('Quitar archivo'))

    expect(screen.queryByText('plano.pdf')).not.toBeInTheDocument()
  })

  test('más de 5 archivos a la vez muestra el error de máximo permitido', async () => {
    const { container } = renderForm()
    const files = Array.from({ length: 6 }, (_, i) => new File(['x'], `doc${i}.pdf`, { type: 'application/pdf' }))
    await userEvent.upload(getFileInput(container), files)

    expect(screen.getByText('Máximo 5 archivos')).toBeInTheDocument()
    expect(screen.queryByText('doc0.pdf')).not.toBeInTheDocument()
  })

  test('un archivo mayor a 10 MB muestra el error con su nombre', async () => {
    const { container } = renderForm()
    const big = new File(['x'], 'grande.pdf', { type: 'application/pdf' })
    Object.defineProperty(big, 'size', { value: 11 * 1024 * 1024 })
    await userEvent.upload(getFileInput(container), big)

    expect(screen.getByText('"grande.pdf" supera los 10 MB')).toBeInTheDocument()
  })

  test('al enviar con archivos adjuntos, los sube secuencialmente tras crear la solicitud', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ id: 'sol-1' })
    const uploadMutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useCreateSolicitud).mockReturnValue({
      mutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useCreateSolicitud>)
    vi.mocked(useUploadSolicitudArchivo).mockReturnValue({
      mutateAsync: uploadMutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useUploadSolicitudArchivo>)

    const { container } = renderForm()
    const file = new File(['contenido'], 'plano.pdf', { type: 'application/pdf' })
    const user = userEvent.setup()
    await user.upload(getFileInput(container), file)
    await user.type(screen.getByLabelText(/Nombre Completo/i), 'Ana Restrepo')
    await user.type(screen.getByLabelText(/Correo Electrónico/i), 'ana@iiap.gov.co')
    await user.selectOptions(screen.getByLabelText(/Tipo de Trámite/i), 'uso-suelo')
    await user.type(screen.getByLabelText(/Descripción/i), DESC_VALIDA)
    await user.click(screen.getByRole('button', { name: /Enviar Solicitud/i }))

    expect(await screen.findByText('¡Solicitud enviada!')).toBeInTheDocument()
    expect(uploadMutateAsync).toHaveBeenCalledWith({ solicitudId: 'sol-1', file })
  })

  test('si la subida de un archivo falla, igual muestra éxito (no bloquea el flujo)', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ id: 'sol-1' })
    const uploadMutateAsync = vi.fn().mockRejectedValue(new Error('upload failed'))
    vi.mocked(useCreateSolicitud).mockReturnValue({
      mutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useCreateSolicitud>)
    vi.mocked(useUploadSolicitudArchivo).mockReturnValue({
      mutateAsync: uploadMutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useUploadSolicitudArchivo>)

    const { container } = renderForm()
    const file = new File(['contenido'], 'plano.pdf', { type: 'application/pdf' })
    const user = userEvent.setup()
    await user.upload(getFileInput(container), file)
    await user.type(screen.getByLabelText(/Nombre Completo/i), 'Ana Restrepo')
    await user.type(screen.getByLabelText(/Correo Electrónico/i), 'ana@iiap.gov.co')
    await user.selectOptions(screen.getByLabelText(/Tipo de Trámite/i), 'uso-suelo')
    await user.type(screen.getByLabelText(/Descripción/i), DESC_VALIDA)
    await user.click(screen.getByRole('button', { name: /Enviar Solicitud/i }))

    expect(await screen.findByText('¡Solicitud enviada!')).toBeInTheDocument()
  })
})

describe('NuevaSolicitudForm — modal de éxito', () => {
  test('"Entendido" cierra el modal de confirmación', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ id: 'sol-1' })
    vi.mocked(useCreateSolicitud).mockReturnValue({
      mutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useCreateSolicitud>)

    const user = userEvent.setup()
    renderForm()
    await user.type(screen.getByLabelText(/Nombre Completo/i), 'Ana Restrepo')
    await user.type(screen.getByLabelText(/Correo Electrónico/i), 'ana@iiap.gov.co')
    await user.selectOptions(screen.getByLabelText(/Tipo de Trámite/i), 'uso-suelo')
    await user.type(screen.getByLabelText(/Descripción/i), DESC_VALIDA)
    await user.click(screen.getByRole('button', { name: /Enviar Solicitud/i }))
    await screen.findByText('¡Solicitud enviada!')

    await user.click(screen.getByText('Entendido'))
    expect(screen.queryByText('¡Solicitud enviada!')).not.toBeInTheDocument()
  })

  test('tras el éxito, el formulario se limpia', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ id: 'sol-1' })
    vi.mocked(useCreateSolicitud).mockReturnValue({
      mutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useCreateSolicitud>)

    const user = userEvent.setup()
    renderForm()
    await user.type(screen.getByLabelText(/Nombre Completo/i), 'Ana Restrepo')
    await user.type(screen.getByLabelText(/Correo Electrónico/i), 'ana@iiap.gov.co')
    await user.selectOptions(screen.getByLabelText(/Tipo de Trámite/i), 'uso-suelo')
    await user.type(screen.getByLabelText(/Descripción/i), DESC_VALIDA)
    await user.click(screen.getByRole('button', { name: /Enviar Solicitud/i }))
    await screen.findByText('¡Solicitud enviada!')

    expect(screen.getByLabelText(/Nombre Completo/i)).toHaveValue('')
    expect(screen.getByLabelText(/Descripción/i)).toHaveValue('')
  })
})

describe('NuevaSolicitudForm — límite de descripción', () => {
  test('una descripción que exceda el máximo permitido muestra el error de longitud', async () => {
    const user = userEvent.setup()
    renderForm()
    const textarea = screen.getByLabelText(/Descripción/i)
    fireEvent.change(textarea, { target: { value: 'x'.repeat(1001) } })
    await user.click(screen.getByRole('button', { name: /Enviar Solicitud/i }))

    expect(await screen.findByText('Máximo 1000 caracteres')).toBeInTheDocument()
  })
})
