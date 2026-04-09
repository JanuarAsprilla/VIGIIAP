import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const UIContext = createContext(null)

function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored !== null ? JSON.parse(stored) : defaultValue
    } catch {
      return defaultValue
    }
  })

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* sin permisos */ }
  }, [key, value])

  return [value, setValue]
}

export function UIProvider({ children }) {
  const [density, setDensity]           = useLocalStorage('vigiiap_density', 'normal')
  const [notifications, setNotifications] = useLocalStorage('vigiiap_notif_enabled', true)
  const [paletteOpen, setPaletteOpen]   = useState(false)

  const openPalette  = useCallback(() => setPaletteOpen(true),  [])
  const closePalette = useCallback(() => setPaletteOpen(false), [])

  return (
    <UIContext.Provider value={{ density, setDensity, notifications, setNotifications, paletteOpen, openPalette, closePalette }}>
      {children}
    </UIContext.Provider>
  )
}

export function useUI() {
  const context = useContext(UIContext)
  if (!context) throw new Error('useUI debe usarse dentro de UIProvider')
  return context
}
