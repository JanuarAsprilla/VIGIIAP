import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LogIn, Mail, Lock, Eye, EyeOff, AlertCircle, ChevronRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import AuthLayout from '@/components/AuthLayout'

const DEMO_CREDS = [
  { label: 'Administrador SIG', email: 'admin@iiap.org.co',        pass: 'admin1234', dot: 'bg-red-400'     },
  { label: 'Investigador',      email: 'investigador@iiap.org.co', pass: 'inv1234',   dot: 'bg-gold-400'    },
  { label: 'Usuario Público',   email: 'usuario@ejemplo.co',       pass: '123456',    dot: 'bg-primary-400' },
]

function InputField({ label, icon: Icon, error, right, ...props }) {
  return (
    <div>
      <label className="block text-[0.8rem] font-semibold text-text mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        <input
          {...props}
          className={`w-full pl-10 ${right ? 'pr-11' : 'pr-4'} py-3 border rounded-xl text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 transition bg-white ${
            error
              ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10'
              : 'border-border focus:border-primary-800 focus:ring-primary-800/10'
          }`}
        />
        {right}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />{error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Login() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { login, loading } = useAuth()
  const from = location.state?.from?.pathname || '/'

  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [showPass, setShowPass]       = useState(false)
  const [remember, setRemember]       = useState(false)
  const [errors, setErrors]           = useState({})
  const [serverError, setServerError] = useState('')

  const validate = () => {
    const e = {}
    if (!email.trim()) e.email = 'El correo es requerido'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Correo no válido'
    if (!password) e.password = 'La contraseña es requerida'
    else if (password.length < 6) e.password = 'Mínimo 6 caracteres'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    try {
      const user = await login(email, password)
      navigate(user.role === 'Administrador SIG' ? '/admin' : (from === '/admin' ? '/' : from), { replace: true })
    } catch (err) {
      setServerError(err.message || 'Credenciales incorrectas. Intente de nuevo.')
    }
  }

  const fillDemo = (cred) => {
    setEmail(cred.email); setPassword(cred.pass)
    setErrors({}); setServerError('')
  }

  return (
    <AuthLayout>
      {/* Heading */}
      <div className="mb-8">
        <h2 className="font-display text-2xl font-bold text-text mb-1">Bienvenido</h2>
        <p className="text-sm text-text-muted">Ingrese sus credenciales para acceder al portal territorial</p>
      </div>

      {/* Server error */}
      <AnimatePresence>
        {serverError && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <InputField
          label="Correo Electrónico"
          icon={Mail}
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })) }}
          placeholder="usuario@iiap.org.co"
          error={errors.email}
          autoComplete="email"
        />

        <InputField
          label="Contraseña"
          icon={Lock}
          type={showPass ? 'text' : 'password'}
          value={password}
          onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })) }}
          placeholder="••••••••"
          error={errors.password}
          autoComplete="current-password"
          right={
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 accent-primary-800 rounded" />
            <span className="text-sm text-text-muted select-none">Recordarme</span>
          </label>
          <Link to="/recuperar-password"
            className="text-sm font-semibold text-primary-800 no-underline hover:text-primary-600 transition-colors">
            ¿Olvidó su contraseña?
          </Link>
        </div>

        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary-800 text-white rounded-xl text-sm font-bold hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-2 shadow-sm">
          {loading
            ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><LogIn className="w-4 h-4" />Iniciar Sesión</>
          }
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-text-muted uppercase tracking-wider">o</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Register link */}
      <Link to="/solicitar-acceso"
        className="flex items-center justify-between w-full px-4 py-3 border-2 border-border rounded-xl text-sm font-semibold text-text no-underline hover:border-primary-800 hover:text-primary-800 transition-colors group">
        <span>¿No tiene cuenta? Solicitar acceso</span>
        <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary-800 transition-colors" />
      </Link>

      {/* Demo credentials */}
      <div className="mt-6 bg-bg-alt rounded-xl p-4 border border-border">
        <p className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-3">
          Acceso de demostración
        </p>
        <div className="space-y-1.5">
          {DEMO_CREDS.map((c) => (
            <button key={c.label} type="button" onClick={() => fillDemo(c)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white border border-border hover:border-primary-300 hover:bg-primary-50/30 transition-colors text-left">
              <span className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
              <span className="text-xs font-semibold text-text">{c.label}</span>
              <span className="text-[0.65rem] text-text-muted ml-auto truncate">{c.email}</span>
            </button>
          ))}
        </div>
      </div>
    </AuthLayout>
  )
}
