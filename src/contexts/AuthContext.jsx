import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import api from '@/lib/api'
import queryClient from '@/lib/queryClient'

// ─── Mapeo de roles backend → etiquetas UI ────────────────────────────────────
export const ROLES = {
  ADMIN:        'Administrador SIG',
  INVESTIGADOR: 'Investigador',
  PUBLICO:      'Público',
}

const ROLE_MAP = {
  admin_sig:    ROLES.ADMIN,
  investigador: ROLES.INVESTIGADOR,
  publico:      ROLES.PUBLICO,
}

function normalizeUser(raw) {
  return {
    id:          raw.id,
    name:        raw.nombre,
    email:       raw.email,
    role:        ROLE_MAP[raw.rol] ?? ROLES.PUBLICO,
    rol:         raw.rol,           // valor backend — útil para lógica interna
    initials:    raw.nombre
      ?.split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() ?? '?',
    institucion: raw.institucion ?? null,
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null)

function loadPersistedUser() {
  try {
    const raw = localStorage.getItem('vigiiap_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(loadPersistedUser)
  const [loading, setLoading] = useState(false)

  // Escucha el evento de logout forzado por el interceptor de axios (401)
  useEffect(() => {
    const handleForceLogout = () => {
      setUser(null)
      queryClient.clear()
    }
    window.addEventListener('vigiiap:logout', handleForceLogout)
    return () => window.removeEventListener('vigiiap:logout', handleForceLogout)
  }, [])

  const persistUser = (normalized) => {
    localStorage.setItem('vigiiap_user', JSON.stringify(normalized))
    setUser(normalized)
  }

  const clearSession = () => {
    localStorage.removeItem('vigiiap_token')
    localStorage.removeItem('vigiiap_user')
    setUser(null)
    queryClient.clear()
  }

  // ── Login ──
  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const { token, user: raw } = await api.post('/auth/login', { email, password })
      localStorage.setItem('vigiiap_token', token)
      const normalized = normalizeUser(raw)
      persistUser(normalized)
      return normalized
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Registro ──
  const register = useCallback(async (data) => {
    return api.post('/auth/registro', data)
  }, [])

  // ── Logout ──
  const logout = useCallback(() => {
    clearSession()
  }, [])

  // ── Refrescar perfil desde la API ──
  const refreshProfile = useCallback(async () => {
    try {
      const raw = await api.get('/auth/me')
      const normalized = normalizeUser(raw)
      persistUser(normalized)
      return normalized
    } catch {
      clearSession()
    }
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      loading,
      login,
      logout,
      register,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
