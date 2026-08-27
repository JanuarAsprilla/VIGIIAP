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
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// ─── Request interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
    config.timeout = 300_000  // 5 min — uploads grandes de mapas/documentos
  }
  return config
})

// ─── Refresh silencioso de sesión ──────────────────────────────────────────────
// El backend rota el access token (15 min) contra un refresh token de 30 días
// (cookie HttpOnly vigiiap_refresh, ver auth.service.js). Sin esto, cualquier
// usuario activo era deslogueado a la fuerza cada 15 minutos aunque su sesión
// real siguiera vigente. Un solo refresh en vuelo se comparte entre todas las
// peticiones 401 concurrentes: el backend rota/invalida el refresh token en
// cada uso, así que dispararlo varias veces en paralelo haría que solo una
// petición ganara y el resto fallara con "token ya usado".
let refreshPromise: Promise<unknown> | null = null
function refreshSession() {
  refreshPromise ??= api.post('/auth/refresh').finally(() => { refreshPromise = null })
  return refreshPromise
}

const AUTH_ENDPOINTS_NO_RETRY = /\/auth\/(login|refresh|visitante|registro)(\?|$)/

// ─── Response interceptor — normaliza errores ─────────────────────────────────
api.interceptors.response.use(
  (res) => res.data,
  async (err) => {
    const status  = err.response?.status
    const original = err.config as (typeof err.config & { _retried?: boolean }) | undefined

    if (status === 401 && original && !original._retried && !AUTH_ENDPOINTS_NO_RETRY.test(original.url ?? '')) {
      original._retried = true
      try {
        await refreshSession()
        return api(original)
      } catch {
        // El refresh también falló — sigue al manejo de 401 normal abajo.
      }
    }

    const rawMsg  = err.response?.data?.error ?? err.message ?? 'Error inesperado'
    const message = typeof rawMsg === 'string' ? rawMsg : 'Error inesperado'

    if (status === 401) {
      clearLocalSession()
      window.dispatchEvent(new Event('vigiiap:logout'))
    }

    if (status === 429) {
      window.dispatchEvent(new CustomEvent('vigiiap:rate-limit', { detail: { message } }))
    }

    const error    = new Error(message) as Error & { status?: number; code?: string; fields?: unknown }
    error.status   = status
    error.code     = err.response?.data?.code   ?? null
    error.fields   = err.response?.data?.fields ?? null
    return Promise.reject(error)
  },
)

export default api
