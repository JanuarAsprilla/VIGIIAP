import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const UIContext = createContext(null)

// M-04: allowlists para valores leídos desde localStorage.
const VALID_DENSITIES = ['compact', 'normal', 'comfortable']

function isValidNotifPrefs(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false
  const validKeys = ['noticias', 'solicitudes', 'mapas', 'email']
  return validKeys.every((k) => typeof v[k] === 'boolean')
}

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
  const [densityRaw, setDensity]            = useLocalStorage('vigiiap_density', 'normal')
  // M-04: validar que el valor leído sea uno de los permitidos.
  const density = VALID_DENSITIES.includes(densityRaw) ? densityRaw : 'normal'

  const [notifications, setNotifications]   = useLocalStorage('vigiiap_notif_enabled', true)
  const [notifPrefsRaw, setNotifPrefs]       = useLocalStorage('vigiiap_notif_prefs', {
    noticias: true, solicitudes: true, mapas: false, email: true,
  })
  // M-04: validar shape de notifPrefs; usar defaults si es inválido.
  const DEFAULT_NOTIF_PREFS = { noticias: true, solicitudes: true, mapas: false, email: true }
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

export function useUI() {
  const context = useContext(UIContext)
  if (!context) throw new Error('useUI debe usarse dentro de UIProvider')
  return context
}
