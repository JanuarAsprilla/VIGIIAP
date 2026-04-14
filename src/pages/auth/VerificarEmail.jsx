import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader2, ArrowLeft, RefreshCw } from 'lucide-react'
import AuthLayout from '@/components/AuthLayout'
import api from '@/lib/api'

export default function VerificarEmail() {
  const { token } = useParams()
  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'already' | 'expired' | 'error'
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (!token) { setStatus('error'); return }

    api.get(`/auth/verificar-email/${token}`)
      .then((res) => {
        setStatus(res.alreadyVerified ? 'already' : 'success')
      })
      .catch((err) => {
        if (err.status === 400 && err.message?.includes('expirado')) {
          setStatus('expired')
        } else {
          setStatus('error')
        }
      })
  }, [token])

  const handleReenviar = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setResending(true)
    try {
      await api.post('/auth/reenviar-verificacion', { email })
      setResent(true)
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthLayout>
      <div className="text-center">
        {status === 'loading' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <Loader2 className="w-12 h-12 text-primary-700 animate-spin" />
            <p className="text-sm text-text-muted">Verificando tu correo...</p>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto border-4 border-green-200"
            >
              <CheckCircle className="w-10 h-10 text-green-600" />
            </motion.div>
            <div>
              <h2 className="font-display text-2xl font-bold text-text mb-2">¡Correo verificado!</h2>
              <p className="text-sm text-text-muted leading-relaxed max-w-sm mx-auto">
                Tu dirección de correo ha sido verificada correctamente.
                Un administrador revisará tu solicitud y recibirás un correo cuando tu cuenta sea activada.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-800 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Ir al inicio de sesión
            </Link>
          </motion.div>
        )}

        {status === 'already' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
            <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto border-4 border-primary-100">
              <CheckCircle className="w-10 h-10 text-primary-700" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-text mb-2">Ya verificado</h2>
              <p className="text-sm text-text-muted">Tu correo ya había sido verificado anteriormente.</p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-800 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
            >
              Ir al inicio de sesión
            </Link>
          </motion.div>
        )}

        {(status === 'expired' || status === 'error') && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto border-4 border-red-100">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-text mb-2">
                {status === 'expired' ? 'Enlace expirado' : 'Enlace no válido'}
              </h2>
              <p className="text-sm text-text-muted leading-relaxed max-w-sm mx-auto">
                {status === 'expired'
                  ? 'Este enlace de verificación ya expiró. Solicita uno nuevo ingresando tu correo.'
                  : 'El enlace no es válido o ya fue utilizado.'}
              </p>
            </div>

            {!resent ? (
              <form onSubmit={handleReenviar} className="space-y-3 max-w-xs mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
                />
                <button
                  type="submit"
                  disabled={resending}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-primary-800 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors"
                >
                  {resending
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                    : <><RefreshCw className="w-4 h-4" /> Reenviar verificación</>
                  }
                </button>
              </form>
            ) : (
              <p className="text-sm text-green-600 font-semibold">
                Si el correo existe, recibirás el enlace en breve.
              </p>
            )}

            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio de sesión
            </Link>
          </motion.div>
        )}
      </div>
    </AuthLayout>
  )
}
