import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { KeyRound, Eye, EyeOff, ShieldCheck, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'
import AuthLayout from '@/components/AuthLayout'
import api from '@/lib/api'

export default function ResetPassword() {
  const { token } = useParams()
  const navigate   = useNavigate()
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [showPass, setShowPass]     = useState(false)
  const [loading, setLoading]       = useState(false)
  const [success, setSuccess]       = useState(false)
  const [error, setError]           = useState('')

  const validate = () => {
    if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
    if (password !== confirm) return 'Las contraseñas no coinciden'
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }

    setLoading(true)
    setError('')
    try {
      await api.post('/auth/reset-password', { token, password })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.message ?? 'Ocurrió un error. El enlace puede haber expirado.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthLayout>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-5">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto border-4 border-green-200"
          >
            <ShieldCheck className="w-10 h-10 text-green-600" />
          </motion.div>
          <div>
            <h2 className="font-display text-2xl font-bold text-text mb-2">¡Contraseña actualizada!</h2>
            <p className="text-sm text-text-muted">Redirigiendo al inicio de sesión...</p>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-800 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            Ir al inicio de sesión
          </Link>
        </motion.div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="mb-7">
        <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center mb-4 border border-primary-100">
          <KeyRound className="w-6 h-6 text-primary-700" />
        </div>
        <h2 className="font-display text-2xl font-bold text-text mb-1">Nueva Contraseña</h2>
        <p className="text-sm text-text-muted leading-relaxed">
          Ingresa tu nueva contraseña. Debe tener al menos 8 caracteres.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label className="block text-[0.8rem] font-semibold text-text mb-1.5">Nueva contraseña</label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              placeholder="Mínimo 8 caracteres"
              className="w-full px-4 pr-10 py-3 border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[0.8rem] font-semibold text-text mb-1.5">Confirmar contraseña</label>
          <input
            type={showPass ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setError('') }}
            placeholder="Repite la contraseña"
            className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
          />
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-xs text-red-500 flex items-center gap-1.5"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
            </motion.p>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary-800 text-white rounded-xl text-sm font-bold hover:bg-primary-700 disabled:opacity-60 transition-colors"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : 'Actualizar contraseña'}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-border text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-800 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio de sesión
        </Link>
      </div>
    </AuthLayout>
  )
}
