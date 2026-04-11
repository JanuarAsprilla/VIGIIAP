import { createContext, useContext, useState, useCallback } from 'react'

// ── Role constants ──
export const ROLES = {
  ADMIN: 'Administrador SIG',
  INVESTIGADOR: 'Investigador',
  PUBLICO: 'Público',
}

// ── Demo users (reemplazar con API real en Fase 2) ──
const DEMO_USERS = {
  'admin@iiap.org.co': {
    name: 'Admin IIAP',
    role: ROLES.ADMIN,
    initials: 'AI',
    email: 'admin@iiap.org.co',
    _password: 'admin1234',
  },
  'carlos@iiap.org.co': {
    name: 'Carlos Rentería',
    role: ROLES.ADMIN,
    initials: 'CR',
    email: 'carlos@iiap.org.co',
    _password: 'admin1234',
  },
  'investigador@iiap.org.co': {
    name: 'Analista Territorial',
    role: ROLES.INVESTIGADOR,
    initials: 'AT',
    email: 'investigador@iiap.org.co',
    _password: 'inv1234',
  },
  'maria@iiap.org.co': {
    name: 'María Valencia',
    role: ROLES.INVESTIGADOR,
    initials: 'MV',
    email: 'maria@iiap.org.co',
    _password: 'inv1234',
  },
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (email, password) => {
    setLoading(true)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        setLoading(false)
        const key = email.toLowerCase().trim()
        const found = DEMO_USERS[key]

        if (found) {
          if (found._password === password) {
            const { _password, ...safeUser } = found
            setUser(safeUser)
            resolve(safeUser)
          } else {
            reject(new Error('Contraseña incorrecta'))
          }
        } else if (email && password) {
          // Cualquier otro → Público
          const name = email.split('@')[0].replace(/[._-]/g, ' ')
          const publicUser = {
            name: name.charAt(0).toUpperCase() + name.slice(1),
            role: ROLES.PUBLICO,
            initials: name[0].toUpperCase(),
            email,
          }
          setUser(publicUser)
          resolve(publicUser)
        } else {
          reject(new Error('Credenciales requeridas'))
        }
      }, 700)
    })
  }, [])

  const logout = useCallback(() => setUser(null), [])

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
