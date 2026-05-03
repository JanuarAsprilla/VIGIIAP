import axios from 'axios'

// ─── Utilidad: decodifica payload JWT sin verificar firma ─────────────────────
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

function clearSession() {
  localStorage.removeItem('vigiiap_token')
  localStorage.removeItem('vigiiap_user')
}

// ─── Cliente base ─────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
})

// ─── Request interceptor — adjunta JWT y verifica expiración ──────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vigiiap_token')
  if (token) {
    if (isTokenExpired(token)) {
      clearSession()
      window.dispatchEvent(new Event('vigiiap:logout'))
      return Promise.reject(Object.assign(new Error('Sesión expirada'), { status: 401, code: 'TOKEN_EXPIRED' }))
    }
    config.headers.Authorization = `Bearer ${token}`
  }
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
    if (status === 401 && localStorage.getItem('vigiiap_token')) {
      clearSession()
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
