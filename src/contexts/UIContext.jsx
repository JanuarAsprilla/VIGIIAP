import { createContext, useContext, useState } from 'react'

const UIContext = createContext(null)

export function UIProvider({ children }) {
  const [density, setDensity] = useState('normal') // 'compact' | 'normal' | 'comodo'

  return (
    <UIContext.Provider value={{ density, setDensity }}>
      {children}
    </UIContext.Provider>
  )
}

export function useUI() {
  const context = useContext(UIContext)
  if (!context) {
    throw new Error('useUI debe usarse dentro de UIProvider')
  }
  return context
}
