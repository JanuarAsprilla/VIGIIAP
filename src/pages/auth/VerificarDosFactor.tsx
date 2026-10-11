import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ROLES } from '@/lib/constants/roles'

export default function VerificarDosFactor() {
  const navigate = useNavigate()
  const { confirmTwoFactor } = useAuth()
  const [code, setCode]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const user = await confirmTwoFactor(code)
      const isAdmin = user.role === ROLES.ADMIN || user.role === ROLES.SUPER_ADMIN
      navigate(isAdmin ? '/admin' : '/', { replace: true })
    } catch (err) {
      setError((err as Error)?.message || 'Código inválido o expirado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--card-bg)] rounded-2xl shadow-xl border border-border p-8 space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 bg-primary-500/12 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-primary-700" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-text">Verificación en dos pasos</h1>
          <p className="text-sm text-text-muted">
            Ingresa el código de 6 dígitos de tu app de autenticación, o uno de tus códigos de emergencia.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label htmlFor="tf-code" className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Código
            </label>
            <input
              id="tf-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              maxLength={8}
              autoFocus
              autoComplete="one-time-code"
              className="w-full px-4 py-3 text-center text-lg tracking-[0.3em] font-mono rounded-xl border border-border bg-[var(--card-bg)] text-text focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          {error && (
            <p className="text-sm text-red-dark bg-red/10 px-4 py-3 rounded-xl">{error}</p>
          )}

          <button
            type="submit"
            disabled={code.trim().length < 6 || loading}
            className="w-full py-3 rounded-xl bg-primary-800 text-white font-semibold text-sm hover:bg-primary-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verificando…' : 'Verificar'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate('/login', { replace: true })}
          className="w-full flex items-center justify-center gap-1.5 text-xs text-text-muted hover:text-text transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Volver al inicio de sesión
        </button>
      </div>
    </div>
  )
}
