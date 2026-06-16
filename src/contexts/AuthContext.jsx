import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import api from '@/lib/api'
import queryClient from '@/lib/queryClient'

// ─── Mapeo de roles backend → etiquetas UI ────────────────────────────────────
export const ROLES = {
  SUPER_ADMIN:   'Super Administrador',
  ADMIN:         'Administrador SIG',
  INVESTIGADOR:  'Investigador',
  TECNICO:       'Técnico SIG',
  INSTITUCIONAL: 'Funcionario Institucional',
  PUBLICO:       'Público',
  VISITANTE:     'Visitante',
}

const ROLE_MAP = {
  super_admin:  ROLES.SUPER_ADMIN,
  admin_sig:    ROLES.ADMIN,
  investigador: ROLES.INVESTIGADOR,
  tecnico:      ROLES.TECNICO,
  institucional:ROLES.INSTITUCIONAL,
  publico:      ROLES.PUBLICO,
  visitante:    ROLES.VISITANTE,
}

function normalizeUser(raw) {
  const isVisitante = raw.rol === 'visitante' || raw.tipo === 'visitante'
  return {
    id:          raw.id,
    name:        raw.nombre ?? 'Visitante',
    email:       raw.email ?? null,
    role:        ROLE_MAP[raw.rol] ?? ROLES.VISITANTE,
    rol:         raw.rol,
    tipo:        raw.tipo ?? null,       // 'visitante' | null
    isVisitante,
    initials:    (raw.nombre ?? 'V')
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase(),
    institucion: raw.institucion ?? null,
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // C-01: estado de usuario solo en memoria (no localStorage).
  // La sesión persiste a través de la cookie HttpOnly vigiiap_token;
  // refreshProfile() rehidrata desde /auth/me al montar.
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(false)

  const persistUser = useCallback((normalized) => {
    // C-01: No escribir datos de usuario en localStorage (XSS risk).
    // El token JWT lo gestiona el backend con cookie HttpOnly (PR #10).
    setUser(normalized)
  }, [])

  const clearSession = useCallback(() => {
    // Limpia cualquier residuo de sesiones anteriores y el estado en memoria.
    localStorage.removeItem('vigiiap_token')
    localStorage.removeItem('vigiiap_user')
    setUser(null)
    queryClient.clear()
  }, [])

  // ── Refrescar perfil desde la API ──
  // Definido antes de los effects para poder usarse en el effect de mount.
  const refreshProfile = useCallback(async () => {
    try {
      const raw = await api.get('/auth/me')
      const normalized = normalizeUser(raw)
      persistUser(normalized)
      return normalized
    } catch {
      clearSession()
    }
  }, [persistUser, clearSession])

  // Rehidrata la sesión al montar usando la cookie HttpOnly vigiiap_token.
  // Si la cookie no existe o expiró, clearSession limpia el estado.
  useEffect(() => {
    refreshProfile()
  }, [refreshProfile])

  // Escucha el evento de logout forzado por el interceptor de axios (401)
  useEffect(() => {
    const handleForceLogout = () => {
      setUser(null)
      queryClient.clear()
    }
    window.addEventListener('vigiiap:logout', handleForceLogout)
    return () => window.removeEventListener('vigiiap:logout', handleForceLogout)
  }, [])

  // ── Login institucional ──
  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const { token, user: raw } = await api.post('/auth/login', { email, password })
      // C-01: token no se escribe en localStorage; el backend lo envía
      // como cookie HttpOnly (Set-Cookie) y api.js usa withCredentials=true.
      void token
      const normalized = normalizeUser(raw)
      persistUser(normalized)
      return normalized
    } finally {
      setLoading(false)
    }
  }, [persistUser])

  // ── Login visitante (acceso rápido sin credenciales) ──
  const loginVisitante = useCallback(async (nombre = '') => {
    setLoading(true)
    try {
      const { token, user: raw } = await api.post('/auth/visitante', { nombre: nombre || undefined })
      // C-01: token no se escribe en localStorage; gestionado por cookie HttpOnly.
      void token
      const normalized = normalizeUser(raw)
      persistUser(normalized)
      return normalized
    } finally {
      setLoading(false)
    }
  }, [persistUser])

  // ── Registro ──
  const register = useCallback(async (data) => {
    return api.post('/auth/registro', data)
  }, [])

  // ── Logout ──
  const logout = useCallback(() => {
    clearSession()
  }, [clearSession])

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated:  !!user,
      isVisitante:      user?.isVisitante ?? false,
      isSuperAdmin:     user?.rol === 'super_admin',
      isAdmin:          user?.rol === 'admin_sig' || user?.rol === 'super_admin',
      loading,
      login,
      loginVisitante,
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
