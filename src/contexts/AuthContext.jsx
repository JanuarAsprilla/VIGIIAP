import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

// ── Demo user (será reemplazado por datos reales del backend) ──
const DEMO_USER = {
  name: 'Analista Territorial',
  role: 'Región Pacífico',
  initials: 'AT',
  email: 'analista@iiap.org.co',
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (email, password) => {
    setLoading(true)

    // Simulación — se reemplazará por llamada real al backend
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        setLoading(false)
        // Aceptar cualquier credencial por ahora
        if (email && password) {
          setUser(DEMO_USER)
          resolve(DEMO_USER)
        } else {
          reject(new Error('Credenciales requeridas'))
        }
      }, 800)
    })
  }, [])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}