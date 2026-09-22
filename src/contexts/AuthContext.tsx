import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import api from '@/lib/api'
import queryClient from '@/lib/queryClient'
import { ROLES } from '@/lib/constants/roles'
import type { PermisoModulo } from '@/lib/constants/modulos'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  name: string
  email: string | null
  role: string
  rol: string
  tipo: string | null
  isVisitante: boolean
  initials: string
  institucion: string | null
  twoFactorEnabled?: boolean
  // Solo presente para admin_sig/super_admin cuando el super_admin activó
  // require2faAdmins en Configuración (ver getProfile en auth.service.js).
  // true + twoFactorEnabled=false = el rol exige 2FA y el usuario aún no lo
  // activó -- RequireAdmin lo redirige a /perfil hasta que lo complete.
  require2FA?: boolean
  avatarUrl: string | null
  // false solo tras un primer login con Google/Microsoft sin institución (ver
  // src/modules/oauth/ en el backend) — dispara la alerta de completar perfil.
  // true por defecto: las cuentas registradas por formulario ya piden
  // institución, y el shape de /auth/visitante no trae este campo.
  perfilCompleto: boolean
  // Preferencia de tema persistida en el servidor -- null = sin preferencia
  // guardada (ver ThemeSync en App.tsx, que la aplica sobre ThemeContext).
  tema: 'light' | 'dark' | null
  // Solo presente para admin_sig (ver getProfile en auth.service.js) -- super_admin
  // y roles no-admin no tienen restricción por módulo, así que este campo queda
  // undefined para ellos y el panel no debe filtrar nada en base a él.
  modulos?: PermisoModulo[]
}

interface RawAuthUser {
  id: string
  nombre?: string
  email?: string | null
  rol: string
  tipo?: string | null
  institucion?: string | null
  twoFactorEnabled?: boolean
  require2FA?: boolean
  avatar_url?: string | null
  perfilCompleto?: boolean
  tema?: 'light' | 'dark' | null
  modulos?: PermisoModulo[]
  [key: string]: unknown
}

export interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isVisitante: boolean
  isSuperAdmin: boolean
  isAdmin: boolean
  loading: boolean
  initializing: boolean
  login: (email: string, password: string) => Promise<AuthUser | { passwordExpired: true } | { requiresTwoFactor: true }>
  loginVisitante: (nombre?: string) => Promise<AuthUser>
  confirmTwoFactor: (code: string) => Promise<AuthUser>
  logout: () => Promise<void>
  register: (data: Record<string, unknown>) => Promise<unknown>
  refreshProfile: () => Promise<AuthUser | undefined>
  completarPerfil: (data: {
    nombre?: string
    institucion: string
    perfilSolicitado?: 'investigador' | 'tecnico' | 'institucional'
    motivo?: string
  }) => Promise<AuthUser>
}

const ROLE_MAP: Record<string, string> = {
  super_admin:  ROLES.SUPER_ADMIN,
  admin_sig:    ROLES.ADMIN,
  investigador: ROLES.INVESTIGADOR,
  tecnico:      ROLES.TECNICO,
  institucional:ROLES.INSTITUCIONAL,
  publico:      ROLES.PUBLICO,
  visitante:    ROLES.VISITANTE,
}

function normalizeUser(raw: RawAuthUser): AuthUser {
  const isVisitante = raw.rol === 'visitante' || raw.tipo === 'visitante'
  return {
    id:          raw.id,
    name:        raw.nombre ?? 'Visitante',
    email:       raw.email ?? null,
    role:        ROLE_MAP[raw.rol] ?? ROLES.VISITANTE,
    rol:         raw.rol,
    tipo:        raw.tipo ?? null,
    isVisitante,
    initials:    (raw.nombre ?? 'V')
      .split(' ')
      .map((w) => w[0] ?? '')
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase(),
    institucion:       raw.institucion ?? null,
    twoFactorEnabled:  raw.twoFactorEnabled ?? false,
    require2FA:        raw.require2FA,
    avatarUrl:         raw.avatar_url ?? null,
    perfilCompleto:    raw.perfilCompleto ?? true,
    tema:              raw.tema ?? null,
    modulos:           raw.modulos,
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  // Estado de usuario solo en memoria (no localStorage): la sesión persiste
  // a través de la cookie HttpOnly vigiiap_token; refreshProfile() rehidrata
  // desde /auth/me al montar.
  const [user, setUser]               = useState<AuthUser | null>(null)
  const [loading, setLoading]         = useState(false)
  const [initializing, setInitializing] = useState(true)

  const persistUser = useCallback((normalized: AuthUser) => {
    // No escribir datos de usuario en localStorage (riesgo de XSS) — el
    // token JWT lo gestiona el backend con cookie HttpOnly.
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
      const raw = (await api.get('/auth/me')) as RawAuthUser
      const normalized = normalizeUser(raw)
      persistUser(normalized)
      return normalized
    } catch (err) {
      // Solo una sesión realmente inválida (401) debe cerrar sesión. Otros
      // errores — 429 por rate limit, 5xx, red caída — son transitorios y
      // no deben desloguear a alguien con una cookie de sesión todavía válida.
      if ((err as { status?: number } | null)?.status === 401) {
        clearSession()
      }
      throw err
    }
  }, [persistUser, clearSession])

  // Rehidrata la sesión al montar usando la cookie HttpOnly vigiiap_token.
  // Si la cookie no existe o expiró, clearSession limpia el estado.
  // initializing se mantiene true hasta que la promesa resuelva (éxito o error)
  // para evitar que RequireAuth redirija al login antes de saber si hay sesión.
  useEffect(() => {
    // Patrón "fetch on mount" — setInitializing solo se dispara una vez que
    // la promesa resuelve (éxito o error), no sincrónicamente en el efecto.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshProfile().catch(() => {}).finally(() => setInitializing(false))
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
  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      const res = (await api.post('/auth/login', { email, password })) as
        | { token: string; user: Record<string, unknown> }
        | { passwordExpired: true }
        | { requiresTwoFactor: true }

      if ('passwordExpired' in res && res.passwordExpired) {
        return { passwordExpired: true as const }
      }
      if ('requiresTwoFactor' in res && res.requiresTwoFactor) {
        return { requiresTwoFactor: true as const }
      }

      // Token no se escribe en localStorage; cookie HttpOnly. El login devuelve
      // un usuario mínimo (id, nombre, email, rol) — sin avatarUrl, institucion
      // ni twoFactorEnabled. Se pide el perfil completo de inmediato, mismo
      // patrón que confirmTwoFactor(), para que la UI no muestre esos campos
      // "perdidos" hasta el próximo reload de página.
      const full = await refreshProfile()
      if (!full) throw new Error('No se pudo cargar el perfil tras iniciar sesión')
      return full
    } finally {
      setLoading(false)
    }
  }, [refreshProfile])

  // ── Login visitante (acceso rápido sin credenciales) ──
  const loginVisitante = useCallback(async (nombre = '') => {
    setLoading(true)
    try {
      // Token no se escribe en localStorage; gestionado por cookie HttpOnly.
      // Mismo patrón que login(): se pide el perfil vía /auth/me tras el POST
      // en vez de confiar en el `user` parcial de la respuesta.
      await api.post('/auth/visitante', { nombre: nombre || undefined })
      const full = await refreshProfile()
      if (!full) throw new Error('No se pudo cargar el perfil tras iniciar sesión')
      return full
    } finally {
      setLoading(false)
    }
  }, [refreshProfile])

  // ── Confirmar segundo factor (2FA) — completa el login tras requiresTwoFactor ──
  const confirmTwoFactor = useCallback(async (code: string) => {
    setLoading(true)
    try {
      // El backend valida el código contra la cookie temporal vigiiap_2fa_temp
      // y, si es válido, emite las cookies de sesión reales.
      await api.post('/auth/2fa/confirm', { code })
      const full = await refreshProfile()
      if (!full) throw new Error('No se pudo cargar el perfil tras verificar el código')
      return full
    } finally {
      setLoading(false)
    }
  }, [refreshProfile])

  // ── Registro ──
  const register = useCallback(async (data: Record<string, unknown>) => {
    return api.post('/auth/registro', data)
  }, [])

  // ── Completar perfil (institución, y opcionalmente pedir un rol elevado) tras un primer login OAuth ──
  const completarPerfil = useCallback(async (data: {
    nombre?: string
    institucion: string
    perfilSolicitado?: 'investigador' | 'tecnico' | 'institucional'
    motivo?: string
  }) => {
    await api.patch('/auth/completar-perfil', data)
    const full = await refreshProfile()
    if (!full) throw new Error('No se pudo actualizar el perfil')
    return full
  }, [refreshProfile])

  // ── Logout ──
  // Invalida la cookie HttpOnly en el servidor antes de limpiar el estado local.
  // Si el request falla (red caída, server error), igual limpia localmente.
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Limpiar localmente aunque el server falle
    }
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
      initializing,
      login,
      loginVisitante,
      confirmTwoFactor,
      logout,
      register,
      refreshProfile,
      completarPerfil,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// El hook vive junto a su Provider — patrón establecido en todo el proyecto
// (ver ThemeContext, UIContext, SearchContext). Separarlo en otro archivo
// solo para satisfacer fast-refresh no aporta valor aquí.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
