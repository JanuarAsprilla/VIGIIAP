import { createContext, useContext, useState, useCallback } from 'react'

const UIContext = createContext(null)

export function UIProvider({ children }) {
  const [density, setDensity]       = useState('normal') // 'compact' | 'normal' | 'comodo'
  const [paletteOpen, setPaletteOpen] = useState(false)

  const openPalette  = useCallback(() => setPaletteOpen(true),  [])
  const closePalette = useCallback(() => setPaletteOpen(false), [])

  return (
    <UIContext.Provider value={{ density, setDensity, paletteOpen, openPalette, closePalette }}>
      {children}
    </UIContext.Provider>
  )
}

export function useUI() {
  const context = useContext(UIContext)
  if (!context) throw new Error('useUI debe usarse dentro de UIProvider')
  return context
}
