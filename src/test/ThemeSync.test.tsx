/**
 * ThemeSync aplica la preferencia de tema guardada en el servidor
 * (usuarios.tema) sobre ThemeContext al cargar sesión — ver comentario en
 * el propio componente para el porqué de vivir separado de ThemeProvider.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import ThemeSync from '@/components/ThemeSync'

const authMock: { user: { id: string; tema: 'light' | 'dark' | null } | null } = { user: null }
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authMock }))

const setThemeSpy = vi.fn()
vi.mock('@/contexts/ThemeContext', () => ({ useTheme: () => ({ setTheme: setThemeSpy }) }))

describe('ThemeSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.user = null
  })

  test('no aplica nada cuando no hay sesión', () => {
    render(<ThemeSync />)
    expect(setThemeSpy).not.toHaveBeenCalled()
  })

  test('no aplica nada cuando el usuario no tiene tema guardado', () => {
    authMock.user = { id: 'u1', tema: null }
    render(<ThemeSync />)
    expect(setThemeSpy).not.toHaveBeenCalled()
  })

  test('aplica el tema guardado en el servidor al cargar sesión', () => {
    authMock.user = { id: 'u1', tema: 'dark' }
    render(<ThemeSync />)
    expect(setThemeSpy).toHaveBeenCalledWith('dark')
  })

  test('re-aplica el tema al cambiar de cuenta (id distinto)', () => {
    authMock.user = { id: 'u1', tema: 'dark' }
    const { rerender } = render(<ThemeSync />)
    expect(setThemeSpy).toHaveBeenCalledTimes(1)

    authMock.user = { id: 'u2', tema: 'light' }
    rerender(<ThemeSync />)
    expect(setThemeSpy).toHaveBeenCalledWith('light')
  })

  test('no renderiza contenido visible', () => {
    authMock.user = { id: 'u1', tema: 'dark' }
    const { container } = render(<ThemeSync />)
    expect(container).toBeEmptyDOMElement()
  })
})
