import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const ThemeContext = createContext(null)

// M-04: solo valores conocidos son aceptados desde localStorage.
const VALID_THEMES = ['light', 'dark']

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem('vigiiap_theme')
      return VALID_THEMES.includes(stored) ? stored : 'light'
    }
    catch { return 'light' }
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try { localStorage.setItem('vigiiap_theme', theme) } catch { /* noop */ }
  }, [theme])

  const toggleTheme = useCallback(
    () => setTheme((t) => (t === 'light' ? 'dark' : 'light')),
    []
  )

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider')
  return ctx
}
