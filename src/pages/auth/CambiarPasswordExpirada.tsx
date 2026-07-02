import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import api from '@/lib/api'
import { validatePasswordStrength, validatePasswordMatch } from '@/lib/validators'

export default function CambiarPasswordExpirada() {
  const navigate = useNavigate()
  const [nueva, setNueva]       = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [showNueva, setShowNueva] = useState(false)
  const [showConf, setShowConf]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [done, setDone]           = useState(false)

  const strengthError  = nueva ? validatePasswordStrength(nueva) : null
  const matchError     = confirmar ? validatePasswordMatch(nueva, confirmar) : null
  const canSubmit      = nueva && confirmar && !strengthError && !matchError && !loading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api.post('/auth/change-expired-password', { nuevaPassword: nueva })
      setDone(true)
      setTimeout(() => navigate('/login', { replace: true }), 2500)
    } catch (err) {
      setError((err as Error).message || 'No se pudo cambiar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-border p-8 space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center">
            <ShieldAlert className="w-7 h-7 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">Contraseña expirada</h1>
          <p className="text-sm text-text-muted">
            Su contraseña ha expirado. Debe establecer una nueva contraseña para continuar.
          </p>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <p className="font-semibold text-text-primary">¡Contraseña actualizada!</p>
            <p className="text-sm text-text-muted">Redirigiendo al inicio de sesión…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={showNueva ? 'text' : 'password'}
                  value={nueva}
                  onChange={(e) => setNueva(e.target.value)}
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                  placeholder="Mínimo 8 caracteres"
                  required
                />
                <button type="button" onClick={() => setShowNueva(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                  {showNueva ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {strengthError && <p className="text-xs text-red-500">{strengthError}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  type={showConf ? 'text' : 'password'}
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                  placeholder="Repita la contraseña"
                  required
                />
                <button type="button" onClick={() => setShowConf(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                  {showConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {matchError && <p className="text-xs text-red-500">{matchError}</p>}
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-3 rounded-xl bg-primary-800 text-white font-semibold text-sm hover:bg-primary-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Actualizando…' : 'Cambiar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
