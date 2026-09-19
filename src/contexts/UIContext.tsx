import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'

export type Density = 'compact' | 'normal' | 'comfortable'

interface UIContextValue {
  density: Density
  setDensity: (d: Density) => void
  notifications: boolean
  setNotifications: (n: boolean) => void
  paletteOpen: boolean
  openPalette: () => void
  closePalette: () => void
}

const UIContext = createContext<UIContextValue | null>(null)

// Allowlist para valores leídos desde localStorage.
const VALID_DENSITIES: Density[] = ['compact', 'normal', 'comfortable']

function isValidDensity(v: string): v is Density {
  return VALID_DENSITIES.includes(v as Density)
}

function useLocalStorage<T>(key: string, defaultValue: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
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

export function UIProvider({ children }: { children: ReactNode }) {
  const [densityRaw, setDensity]            = useLocalStorage<string>('vigiiap_density_v1', 'normal')
  const density = isValidDensity(densityRaw) ? densityRaw : 'normal'

  const [notifications, setNotifications]   = useLocalStorage('vigiiap_notif_enabled_v1', true)

  const [paletteOpen, setPaletteOpen]   = useState(false)

  const openPalette  = useCallback(() => setPaletteOpen(true),  [])
  const closePalette = useCallback(() => setPaletteOpen(false), [])

  return (
    <UIContext.Provider value={{ density, setDensity, notifications, setNotifications, paletteOpen, openPalette, closePalette }}>
      {children}
    </UIContext.Provider>
  )
}

// El hook vive junto a su Provider — patrón establecido en todo el proyecto.
// eslint-disable-next-line react-refresh/only-export-components
export function useUI() {
  const context = useContext(UIContext)
  if (!context) throw new Error('useUI debe usarse dentro de UIProvider')
  return context
}
