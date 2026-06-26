import axios from 'axios'

// Auth via HttpOnly cookie — el navegador la adjunta automáticamente.
// Backend (PR #10) implementa Set-Cookie: vigiiap_token=<jwt>; HttpOnly; Secure; SameSite=Strict.
// Para logout: backend envía Set-Cookie: vigiiap_token=; Max-Age=0.

function clearLocalSession() {
  localStorage.removeItem('vigiiap_token')
  localStorage.removeItem('vigiiap_user')
}

// ─── Cliente base ─────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// ─── Request interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
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
    const rawMsg  = err.response?.data?.error ?? err.message ?? 'Error inesperado'
    const message = typeof rawMsg === 'string' ? rawMsg : 'Error inesperado'

    if (status === 401) {
      clearLocalSession()
      window.dispatchEvent(new Event('vigiiap:logout'))
    }

    const error    = new Error(message) as Error & { status?: number; code?: string; fields?: unknown }
    error.status   = status
    error.code     = err.response?.data?.code   ?? null
    error.fields   = err.response?.data?.fields ?? null
    return Promise.reject(error)
  },
)

export default api
