import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { SearchProvider, useSearch } from '@/contexts/SearchContext'

function Probe() {
  const { query, setQuery, debouncedQuery } = useSearch()
  return (
    <div>
      <input aria-label="query" value={query} onChange={(e) => setQuery(e.target.value)} />
      <span data-testid="debounced">{debouncedQuery}</span>
    </div>
  )
}

function OutsideProvider() {
  useSearch()
  return null
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('SearchContext', () => {
  test('useSearch lanza un error si se usa fuera del SearchProvider', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<OutsideProvider />)).toThrow('useSearch debe usarse dentro de SearchProvider')
    consoleErrorSpy.mockRestore()
  })

  test('debouncedQuery no cambia de inmediato al escribir', () => {
    render(<SearchProvider><Probe /></SearchProvider>)
    fireEvent.change(screen.getByLabelText('query'), { target: { value: 'mapas' } })

    expect(screen.getByLabelText('query')).toHaveValue('mapas')
    expect(screen.getByTestId('debounced')).toHaveTextContent('')
  })

  test('debouncedQuery se actualiza 300ms después de dejar de escribir', () => {
    render(<SearchProvider><Probe /></SearchProvider>)
    fireEvent.change(screen.getByLabelText('query'), { target: { value: 'mapas' } })

    act(() => { vi.advanceTimersByTime(300) })
    expect(screen.getByTestId('debounced')).toHaveTextContent('mapas')
  })

  test('reinicia el temporizador con cada tecla — no se dispara antes de que el usuario deje de escribir', () => {
    render(<SearchProvider><Probe /></SearchProvider>)
    const input = screen.getByLabelText('query')

    fireEvent.change(input, { target: { value: 'm' } })
    act(() => { vi.advanceTimersByTime(250) })
    fireEvent.change(input, { target: { value: 'ma' } })
    act(() => { vi.advanceTimersByTime(250) })

    expect(screen.getByTestId('debounced')).toHaveTextContent('')

    act(() => { vi.advanceTimersByTime(50) })
    expect(screen.getByTestId('debounced')).toHaveTextContent('ma')
  })
})
