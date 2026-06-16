import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, test, expect, beforeEach } from 'vitest'
import { ThemeProvider, useTheme } from '../contexts/ThemeContext'

// ─── Helper consumer component ────────────────────────────────────────────────
function ThemeConsumer() {
  const { theme, isDark, toggleTheme } = useTheme()
  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="is-dark">{String(isDark)}</div>
      <button onClick={toggleTheme}>toggle</button>
    </div>
  )
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear()
    // Reset the class on documentElement between tests
    document.documentElement.classList.remove('dark')
  })

  test('defaults to light when localStorage is empty', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('theme').textContent).toBe('light')
  })

  test('isDark is false when theme is light', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('is-dark').textContent).toBe('false')
  })

  test('uses stored dark theme from localStorage', () => {
    localStorage.setItem('vigiiap_theme', 'dark')
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('theme').textContent).toBe('dark')
  })

  test('isDark is true when stored theme is dark', () => {
    localStorage.setItem('vigiiap_theme', 'dark')
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('is-dark').textContent).toBe('true')
  })

  test('rejects invalid theme value and falls back to light', () => {
    localStorage.setItem('vigiiap_theme', 'rainbow')
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('theme').textContent).toBe('light')
  })

  test('toggleTheme switches from light to dark', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'toggle' }))
    expect(screen.getByTestId('theme').textContent).toBe('dark')
  })

  test('toggleTheme switches from dark back to light', async () => {
    const user = userEvent.setup()
    localStorage.setItem('vigiiap_theme', 'dark')
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'toggle' }))
    expect(screen.getByTestId('theme').textContent).toBe('light')
  })

  test('throws when useTheme is used outside ThemeProvider', () => {
    // Suppress expected console.error from React
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<ThemeConsumer />)).toThrow('useTheme debe usarse dentro de ThemeProvider')
    spy.mockRestore()
  })
})
