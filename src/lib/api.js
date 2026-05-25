import axios from 'axios'

// ─── NOTA DE SEGURIDAD ────────────────────────────────────────────────────────
// El token JWT se almacena actualmente en localStorage. Para eliminar la
// vulnerabilidad XSS sobre el token, el backend debe:
//
//   1. En POST /auth/login y POST /auth/visitante:
//      Enviar Set-Cookie: vigiiap_token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400
//
//   2. En POST /auth/logout:
//      Enviar Set-Cookie: vigiiap_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0
//
//   3. En todos los endpoints protegidos: leer el token desde la cookie
//      (además de aceptar el header Authorization como fallback).
//
// Cuando el backend implemente las cookies, cambiar USE_COOKIE_AUTH = true.
// ─────────────────────────────────────────────────────────────────────────────
const USE_COOKIE_AUTH = false

// ─── Utilidad: decodifica payload JWT sin verificar firma ─────────────────────
// Usado SOLO como optimización UX (evitar request con token ya expirado).
// La verificación real de firma y expiración siempre ocurre en el backend.
function getTokenExp(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp ?? null
  } catch {
    return null
  }
}

function isTokenExpired(token) {
  const exp = getTokenExp(token)
  if (!exp) return false
  return Date.now() / 1000 > exp
}

function clearLocalSession() {
  localStorage.removeItem('vigiiap_token')
  localStorage.removeItem('vigiiap_user')
}

// ─── Cliente base ─────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
  // withCredentials: true envía cookies httpOnly automáticamente.
  // Cuando USE_COOKIE_AUTH sea true esto es lo único necesario.
  withCredentials: USE_COOKIE_AUTH,
})

// ─── Request interceptor — adjunta JWT (modo localStorage) y verifica expiración
api.interceptors.request.use((config) => {
  if (!USE_COOKIE_AUTH) {
    // Modo actual: token en localStorage (migrar a cookie httpOnly cuando el backend lo soporte)
    const token = localStorage.getItem('vigiiap_token')
    if (token) {
      if (isTokenExpired(token)) {
        clearLocalSession()
        window.dispatchEvent(new Event('vigiiap:logout'))
        return Promise.reject(Object.assign(new Error('Sesión expirada'), { status: 401, code: 'TOKEN_EXPIRED' }))
      }
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  // Modo cookie: el navegador adjunta la cookie httpOnly automáticamente, sin código extra.

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
    config.timeout = 0
  }
  return config
})

// ─── Response interceptor — normaliza errores ─────────────────────────────────
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const status  = err.response?.status
    // Sanitize the message — only use string values, never objects
    const rawMsg  = err.response?.data?.error ?? err.message ?? 'Error inesperado'
    const message = typeof rawMsg === 'string' ? rawMsg : 'Error inesperado'

    // Token inválido o expirado → limpiar sesión sin recargar la app
    if (status === 401) {
      clearLocalSession()
      window.dispatchEvent(new Event('vigiiap:logout'))
    }

    const error    = new Error(message)
    error.status   = status
    error.code     = err.response?.data?.code   ?? null
    error.fields   = err.response?.data?.fields ?? null
    return Promise.reject(error)
  },
)

export default api
