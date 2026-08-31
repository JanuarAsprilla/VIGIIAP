import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import SolicitarAcceso from '@/pages/auth/SolicitarAcceso'

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

const authMock = { register: vi.fn() }
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authMock }))
vi.mock('@/hooks/usePlatformStats', () => ({ usePlatformStats: () => [] }))

function renderPage() {
  return render(<SolicitarAcceso />, { wrapper: MemoryRouter })
}

const VALID = {
  nombre: 'Ana Restrepo',
  email: 'ana@iiap.gov.co',
  password: 'Sup3r$ecreta',
  institucion: 'IIAP',
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Nombre Completo'), VALID.nombre)
  await user.type(screen.getByLabelText('Correo Electrónico'), VALID.email)
  await user.type(screen.getByLabelText('Contraseña'), VALID.password)
  await user.type(screen.getByLabelText('Confirmar Contraseña'), VALID.password)
  await user.type(screen.getByLabelText('Institución / Organización'), VALID.institucion)
  await user.selectOptions(screen.getByLabelText('Perfil de Acceso Requerido'), 'investigador')
  await user.click(screen.getByRole('checkbox'))
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SolicitarAcceso — validación', () => {
  test('todos los campos requeridos muestran error y no se llama a register()', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: /Enviar Solicitud/i }))

    expect(await screen.findByText('El nombre completo es requerido')).toBeInTheDocument()
    expect(screen.getByText('Debe aceptar los términos')).toBeInTheDocument()
    expect(authMock.register).not.toHaveBeenCalled()
  })

  test('contraseñas que no coinciden muestran el error específico', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText('Contraseña'), 'Sup3r$ecreta')
    await user.type(screen.getByLabelText('Confirmar Contraseña'), 'OtraDistinta1!')
    await user.click(screen.getByRole('button', { name: /Enviar Solicitud/i }))

    expect(await screen.findByText('Las contraseñas no coinciden')).toBeInTheDocument()
    expect(authMock.register).not.toHaveBeenCalled()
  })

  test('una contraseña débil es rechazada aunque no esté vacía', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText('Contraseña'), 'abc')
    await user.click(screen.getByRole('button', { name: /Enviar Solicitud/i }))

    expect(await screen.findByText(/La contraseña debe tener al menos 8 caracteres/i)).toBeInTheDocument()
    expect(authMock.register).not.toHaveBeenCalled()
  })
})

describe('SolicitarAcceso — envío', () => {
  test('con datos válidos llama a register() con el payload correcto y muestra la pantalla de éxito', async () => {
    authMock.register.mockResolvedValue({ id: '1' })
    const user = userEvent.setup()
    renderPage()
    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /Enviar Solicitud/i }))

    expect(authMock.register).toHaveBeenCalledWith(expect.objectContaining({
      nombre: VALID.nombre,
      email: VALID.email,
      password: VALID.password,
      institucion: VALID.institucion,
      perfil: 'investigador',
    }))
    expect(await screen.findByText(/Verifica tu correo/i)).toBeInTheDocument()
  })

  test('si register() falla, muestra el error del servidor y no la pantalla de éxito', async () => {
    authMock.register.mockRejectedValue(new Error('El email ya está registrado'))
    const user = userEvent.setup()
    renderPage()
    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /Enviar Solicitud/i }))

    expect(await screen.findByText('El email ya está registrado')).toBeInTheDocument()
    expect(screen.queryByText(/Verifica tu correo/i)).not.toBeInTheDocument()
  })
})
