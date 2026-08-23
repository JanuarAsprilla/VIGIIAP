import axios from 'axios'

// Auth via HttpOnly cookie — el navegador la adjunta automáticamente.
// Backend (PR #10) implementa Set-Cookie: vigiiap_token=<jwt>; HttpOnly; Secure; SameSite=None
// (frontend y backend en subdominios distintos). Para logout: Set-Cookie: vigiiap_token=; Max-Age=0.
// SameSite=None expone a CSRF vía formularios cross-site — por eso toda petición
// mutante autenticada por cookie exige el header X-CSRF-Token (ver más abajo).

function clearLocalSession() {
  localStorage.removeItem('vigiiap_token')
  localStorage.removeItem('vigiiap_user')
  clearCsrfToken()
}

// ─── Cliente base ─────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// ─── Token CSRF (double-submit) ────────────────────────────────────────────────
// El backend liga este token al valor actual de la cookie de sesión (HMAC), así
// que cambia cada vez que el access token cambia (login, refresh). Se pide una
// sola vez y se cachea; las peticiones concurrentes que lo necesiten esperan el
// mismo fetch en lugar de disparar cada una su propio GET /auth/csrf-token.
const SAFE_METHODS = new Set(['get', 'head', 'options'])
let csrfToken: string | null = null
let csrfPromise: Promise<string | null> | null = null

function clearCsrfToken() {
  csrfToken = null
}

async function fetchCsrfToken(): Promise<string | null> {
  csrfPromise ??= axios
    .get<{ csrfToken: string }>(`${api.defaults.baseURL}/auth/csrf-token`, { withCredentials: true })
    .then((res) => { csrfToken = res.data.csrfToken; return csrfToken })
    .catch(() => null)
    .finally(() => { csrfPromise = null })
  return csrfPromise
}

// ─── Request interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(async (config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
    config.timeout = 300_000  // 5 min — uploads grandes de mapas/documentos
  }

  const method = config.method?.toLowerCase()
  if (method && !SAFE_METHODS.has(method)) {
    const token = csrfToken ?? (await fetchCsrfToken())
    if (token) config.headers['X-CSRF-Token'] = token
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
    .then(() => {
      // El access token cambió — el CSRF token cacheado (ligado al anterior
      // vía HMAC) queda inválido; se pedirá uno nuevo en la próxima petición mutante.
      clearCsrfToken()
      return true
    })
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

    if (status === 401) {
      // Único camino que NO cierra sesión: primer 401 de esta petición,
      // con config disponible para reintentar, que no sea el propio
      // /auth/refresh, y cuyo refresh efectivamente funcione.
      const canRetry = originalReq && !originalReq._retried && !isRefreshCall
      if (canRetry) {
        originalReq._retried = true
        const refreshed = await attemptRefresh()
        if (refreshed) return api(originalReq)
      }

      // Todo lo demás — sin config, ya reintentado, es el propio refresh,
      // o el refresh falló — es una sesión muerta de verdad. Antes esta
      // rama solo se ejecutaba en el primer 401: si el reintento posterior
      // al refresh volvía a dar 401 (refresh "exitoso" pero sesión igual
      // inválida), el cliente se quedaba con isAuthenticated=true para
      // siempre mientras el servidor seguía rechazando cada petición —
      // estado inconsistente que nunca se autocorregía.
      clearLocalSession()
      window.dispatchEvent(new Event('vigiiap:logout'))
    }

    if (status === 403 && err.response?.data?.error === 'Token CSRF inválido o ausente') {
      // Token cacheado obsoleto (ej. carrera con un refresh reciente) — se pide
      // uno nuevo y se reintenta la petición original una sola vez.
      const canRetry = originalReq && !originalReq._retried
      if (canRetry) {
        originalReq._retried = true
        clearCsrfToken()
        const token = await fetchCsrfToken()
        if (token) return api(originalReq)
      }
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
