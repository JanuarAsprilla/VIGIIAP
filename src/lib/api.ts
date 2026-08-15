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

// ─── Renovación silenciosa de sesión ───────────────────────────────────────────
// El token de acceso expira en minutos (JWT_EXPIRES_IN, 15m por defecto si no
// está configurado en el backend). Sin esto, cualquier usuario que quede
// inactivo más tiempo que eso — leyendo un documento largo, llenando un
// formulario — recibía un 401 en su siguiente petición y se le cerraba la
// sesión de golpe, aunque el backend ya expone POST /auth/refresh (cookie
// HttpOnly propia) para renovar sin pedir credenciales de nuevo.
// Antes de rendirse en un 401, se intenta refrescar una sola vez; las
// peticiones que lleguen mientras el refresh está en vuelo esperan ese mismo
// intento en lugar de disparar cada una su propio POST /auth/refresh.
let refreshPromise: Promise<boolean> | null = null

async function attemptRefresh(): Promise<boolean> {
  refreshPromise ??= axios
    .post(`${api.defaults.baseURL}/auth/refresh`, {}, { withCredentials: true })
    .then(() => true)
    .catch(() => false)
    .finally(() => { refreshPromise = null })
  return refreshPromise
}

// ─── Response interceptor — normaliza errores ─────────────────────────────────
api.interceptors.response.use(
  (res) => res.data,
  async (err) => {
    const status       = err.response?.status
    const originalReq  = err.config
    const isRefreshCall = originalReq?.url?.includes('/auth/refresh')

    if (status === 401 && originalReq && !originalReq._retried && !isRefreshCall) {
      originalReq._retried = true
      const refreshed = await attemptRefresh()
      if (refreshed) return api(originalReq)

      clearLocalSession()
      window.dispatchEvent(new Event('vigiiap:logout'))
    }

    const rawMsg  = err.response?.data?.error ?? err.message ?? 'Error inesperado'
    const message = typeof rawMsg === 'string' ? rawMsg : 'Error inesperado'

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
