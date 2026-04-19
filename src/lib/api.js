import axios from 'axios'

// ─── Cliente base ─────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request interceptor — adjunta JWT ────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vigiiap_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  // Let the browser set the multipart boundary automatically for file uploads
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
    const message = err.response?.data?.error ?? err.message ?? 'Error inesperado'

    // Token expirado → limpiar sesión y redirigir sin recargar la app
    if (status === 401 && localStorage.getItem('vigiiap_token')) {
      localStorage.removeItem('vigiiap_token')
      localStorage.removeItem('vigiiap_user')
      window.dispatchEvent(new Event('vigiiap:logout'))
    }

    const error = new Error(message)
    error.status = status
    error.code   = err.response?.data?.code   ?? null
    error.fields = err.response?.data?.fields ?? null
    return Promise.reject(error)
  },
)

export default api
