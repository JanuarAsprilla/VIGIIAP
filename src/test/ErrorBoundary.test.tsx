import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ErrorBoundary from '@/components/ErrorBoundary'

const { captureExceptionSpy } = vi.hoisted(() => ({ captureExceptionSpy: vi.fn() }))
vi.mock('@sentry/react', () => ({ captureException: captureExceptionSpy }))

function Bomb({ throwError }: { throwError: boolean }) {
  if (throwError) throw new Error('boom')
  return <div>Contenido normal</div>
}

const externalThrowFlag = { current: true }
function ResettableBomb() {
  if (externalThrowFlag.current) throw new Error('boom')
  return <div>Recuperado</div>
}

let consoleErrorSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  vi.clearAllMocks()
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  consoleErrorSpy.mockRestore()
})

describe('ErrorBoundary', () => {
  test('renderiza a los hijos normalmente cuando no hay error', () => {
    render(<ErrorBoundary><Bomb throwError={false} /></ErrorBoundary>)
    expect(screen.getByText('Contenido normal')).toBeInTheDocument()
  })

  test('captura el error de un hijo y muestra la UI de fallback', () => {
    render(<ErrorBoundary><Bomb throwError /></ErrorBoundary>)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Ocurrió un error inesperado')).toBeInTheDocument()
    expect(screen.queryByText('Contenido normal')).not.toBeInTheDocument()
  })

  test('reporta el error a Sentry con el component stack', () => {
    render(<ErrorBoundary><Bomb throwError /></ErrorBoundary>)
    expect(captureExceptionSpy).toHaveBeenCalledTimes(1)
    const [error, context] = captureExceptionSpy.mock.calls[0]
    expect((error as Error).message).toBe('boom')
    expect(context.contexts.react.componentStack).toEqual(expect.any(String))
  })

  test('"Intentar de nuevo" limpia el estado de error y vuelve a renderizar a los hijos', async () => {
    externalThrowFlag.current = true
    const user = userEvent.setup()
    render(<ErrorBoundary><ResettableBomb /></ErrorBoundary>)
    expect(screen.getByText('Ocurrió un error inesperado')).toBeInTheDocument()

    externalThrowFlag.current = false
    await user.click(screen.getByRole('button', { name: /Intentar de nuevo/i }))
    expect(screen.getByText('Recuperado')).toBeInTheDocument()
  })
})
