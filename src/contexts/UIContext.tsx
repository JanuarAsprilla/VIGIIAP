import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'

export type Density = 'compact' | 'normal' | 'comfortable'

interface NotifPrefs {
  solicitudes: boolean
  mapas: boolean
  email: boolean
}

interface UIContextValue {
  density: Density
  setDensity: (d: Density) => void
  notifications: boolean
  setNotifications: (n: boolean) => void
  notifPrefs: NotifPrefs
  setNotifPrefs: (p: NotifPrefs) => void
  paletteOpen: boolean
  openPalette: () => void
  closePalette: () => void
}

const UIContext = createContext<UIContextValue | null>(null)

// M-04: allowlists para valores leídos desde localStorage.
const VALID_DENSITIES: Density[] = ['compact', 'normal', 'comfortable']

function isValidDensity(v: string): v is Density {
  return VALID_DENSITIES.includes(v as Density)
}

function isValidNotifPrefs(v: unknown): v is NotifPrefs {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false
  const validKeys: (keyof NotifPrefs)[] = ['solicitudes', 'mapas', 'email']
  const record = v as Record<string, unknown>
  return validKeys.every((k) => typeof record[k] === 'boolean')
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
  // M-04: validar que el valor leído sea uno de los permitidos.
  const density = isValidDensity(densityRaw) ? densityRaw : 'normal'

  const [notifications, setNotifications]   = useLocalStorage('vigiiap_notif_enabled_v1', true)
  const [notifPrefsRaw, setNotifPrefs]       = useLocalStorage('vigiiap_notif_prefs_v1', {
    solicitudes: true, mapas: false, email: true,
  })
  // M-04: validar shape de notifPrefs; usar defaults si es inválido.
  const DEFAULT_NOTIF_PREFS = { solicitudes: true, mapas: false, email: true }
  const notifPrefs = isValidNotifPrefs(notifPrefsRaw) ? notifPrefsRaw : DEFAULT_NOTIF_PREFS

  const [paletteOpen, setPaletteOpen]   = useState(false)

  const openPalette  = useCallback(() => setPaletteOpen(true),  [])
  const closePalette = useCallback(() => setPaletteOpen(false), [])

  return (
    <UIContext.Provider value={{ density, setDensity, notifications, setNotifications, notifPrefs, setNotifPrefs, paletteOpen, openPalette, closePalette }}>
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
