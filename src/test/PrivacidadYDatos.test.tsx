import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import PrivacidadYDatos from '@/components/privacidad/PrivacidadYDatos'

vi.mock('@/lib/api', () => ({ default: { get: vi.fn(), delete: vi.fn() } }))
import api from '@/lib/api'

const authMock = { user: { id: 'u1', rol: 'investigador' } as { id: string; rol: string } }
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authMock }))

const asignar = vi.fn()
const ubicacionOriginal = window.location

function renderizar() {
  return render(<MemoryRouter><PrivacidadYDatos /></MemoryRouter>)
}

beforeEach(() => {
  vi.clearAllMocks()
  authMock.user = { id: 'u1', rol: 'investigador' }
  Object.defineProperty(window, 'location', { value: { ...ubicacionOriginal, assign: asignar }, writable: true })
  URL.createObjectURL = vi.fn(() => 'blob:datos')
  URL.revokeObjectURL = vi.fn()
})
afterEach(() => {
  Object.defineProperty(window, 'location', { value: ubicacionOriginal, writable: true })
})

describe('PrivacidadYDatos — descargar mis datos', () => {
  test('pide los datos al servidor y los guarda como archivo JSON', async () => {
    vi.mocked(api.get).mockResolvedValue({ cuenta: { id: 'u1' } })
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    renderizar()
    await userEvent.click(screen.getByRole('button', { name: /descargar mis datos/i }))

    await waitFor(() => expect(clic).toHaveBeenCalledOnce())
    expect(api.get).toHaveBeenCalledWith('/usuarios/me/datos')
    expect(URL.createObjectURL).toHaveBeenCalledOnce()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:datos')
    clic.mockRestore()
  })

  test('si falla muestra el mensaje y no genera ningún archivo', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Error de red'))

    renderizar()
    await userEvent.click(screen.getByRole('button', { name: /descargar mis datos/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Error de red')
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })
})

describe('PrivacidadYDatos — eliminar mi cuenta', () => {
  async function abrirFormulario() {
    renderizar()
    await userEvent.click(screen.getByRole('button', { name: /^eliminar mi cuenta$/i }))
  }

  test('primero explica qué pasa y no muestra el formulario hasta que lo pides', () => {
    renderizar()
    expect(screen.getByText(/esta acción no se puede deshacer/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/escribe/i)).not.toBeInTheDocument()
  })

  test('el botón definitivo solo se habilita al escribir la frase exacta', async () => {
    await abrirFormulario()
    const definitivo = screen.getByRole('button', { name: /eliminar definitivamente/i })
    expect(definitivo).toBeDisabled()

    await userEvent.type(screen.getByLabelText(/escribe/i), 'eliminar')
    expect(definitivo).toBeDisabled() // distingue mayúsculas

    await userEvent.clear(screen.getByLabelText(/escribe/i))
    await userEvent.type(screen.getByLabelText(/escribe/i), 'ELIMINAR')
    expect(definitivo).toBeEnabled()
  })

  test('envía la frase y la contraseña, y al terminar recarga en la portada', async () => {
    vi.mocked(api.delete).mockResolvedValue({ message: 'ok' })
    await abrirFormulario()
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'Clave-123')
    await userEvent.type(screen.getByLabelText(/escribe/i), 'ELIMINAR')

    await userEvent.click(screen.getByRole('button', { name: /eliminar definitivamente/i }))

    await waitFor(() => expect(asignar).toHaveBeenCalledWith('/'))
    expect(api.delete).toHaveBeenCalledWith('/usuarios/me', { data: { confirmacion: 'ELIMINAR', password: 'Clave-123' } })
  })

  test('sin contraseña (cuenta de Google o Microsoft) envía solo la frase', async () => {
    vi.mocked(api.delete).mockResolvedValue({})
    await abrirFormulario()
    await userEvent.type(screen.getByLabelText(/escribe/i), 'ELIMINAR')
    await userEvent.click(screen.getByRole('button', { name: /eliminar definitivamente/i }))

    await waitFor(() => expect(api.delete).toHaveBeenCalled())
    expect(api.delete).toHaveBeenCalledWith('/usuarios/me', { data: { confirmacion: 'ELIMINAR', password: undefined } })
  })

  test('si el servidor rechaza (p. ej. contraseña incorrecta) muestra el error y no recarga', async () => {
    vi.mocked(api.delete).mockRejectedValue(new Error('Contraseña incorrecta'))
    await abrirFormulario()
    await userEvent.type(screen.getByLabelText(/escribe/i), 'ELIMINAR')
    await userEvent.click(screen.getByRole('button', { name: /eliminar definitivamente/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Contraseña incorrecta')
    expect(asignar).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /eliminar definitivamente/i })).toBeEnabled()
  })

  test('cancelar cierra el formulario y borra lo escrito', async () => {
    await abrirFormulario()
    await userEvent.type(screen.getByLabelText(/escribe/i), 'ELIM')
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }))

    expect(screen.queryByLabelText(/escribe/i)).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /^eliminar mi cuenta$/i }))
    expect(screen.getByLabelText(/escribe/i)).toHaveValue('')
  })

  test.each(['admin_sig', 'super_admin'])('una cuenta %s no ve el formulario: la elimina un Super Administrador', (rol) => {
    authMock.user = { id: 'a1', rol }
    renderizar()
    expect(screen.getByText(/las cuentas administrativas las elimina un super administrador/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^eliminar mi cuenta$/i })).not.toBeInTheDocument()
  })
})
