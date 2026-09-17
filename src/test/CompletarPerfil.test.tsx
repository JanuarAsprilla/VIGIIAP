import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import CompletarPerfilForm from '@/components/auth/CompletarPerfilForm'
import CompletarPerfilPanel from '@/components/auth/CompletarPerfilPanel'

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

const authMock = {
  user: { name: 'Ana Restrepo', email: 'ana@gmail.com' },
  completarPerfil: vi.fn(),
}
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authMock }))

function renderForm(onClose = vi.fn()) {
  return { onClose, ...render(<CompletarPerfilForm onClose={onClose} />) }
}

beforeEach(() => {
  vi.clearAllMocks()
  authMock.user = { name: 'Ana Restrepo', email: 'ana@gmail.com' }
})

describe('CompletarPerfilForm — validación', () => {
  test('institución vacía muestra error y no llama a completarPerfil()', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: /Completar registro/i }))

    expect(await screen.findByText('Ingrese su institución u organización')).toBeInTheDocument()
    expect(authMock.completarPerfil).not.toHaveBeenCalled()
  })
})

describe('CompletarPerfilForm — envío', () => {
  test('el nombre viene prellenado desde user.name', () => {
    renderForm()
    expect(screen.getByLabelText('Nombre Completo')).toHaveValue('Ana Restrepo')
  })

  test('con institución válida llama a completarPerfil() y cierra el panel', async () => {
    authMock.completarPerfil.mockResolvedValue({ perfilCompleto: true })
    const user = userEvent.setup()
    const { onClose } = renderForm()

    await user.type(screen.getByLabelText('Institución / Organización'), 'IIAP')
    await user.click(screen.getByRole('button', { name: /Completar registro/i }))

    expect(authMock.completarPerfil).toHaveBeenCalledWith({ nombre: 'Ana Restrepo', institucion: 'IIAP' })
    expect(onClose).toHaveBeenCalled()
  })

  test('si completarPerfil() falla, se queda en el formulario y muestra el error', async () => {
    authMock.completarPerfil.mockRejectedValue(new Error('Institución requerida'))
    const user = userEvent.setup()
    const { onClose } = renderForm()

    await user.type(screen.getByLabelText('Institución / Organización'), 'IIAP')
    await user.click(screen.getByRole('button', { name: /Completar registro/i }))

    expect(await screen.findByText('Institución requerida')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })
})

describe('CompletarPerfilPanel', () => {
  test('renderiza el título y pasa onClose al panel', () => {
    const onClose = vi.fn()
    render(<CompletarPerfilPanel onClose={onClose} />)
    expect(screen.getByText('Completa tu Perfil')).toBeInTheDocument()
  })
})
