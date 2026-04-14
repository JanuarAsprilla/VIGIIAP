import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LogIn, Mail, Lock, Eye, EyeOff, AlertCircle,
  ChevronRight, Building2, Globe, User, Send, Loader2,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import AuthLayout from '@/components/AuthLayout'
import { validateEmail, validatePassword } from '@/lib/validators'
import api from '@/lib/api'

// ─── Tipos de acceso ──────────────────────────────────────────────────────────
const MODOS = [
  {
    id:     'institucional',
    icon:   Building2,
    label:  'Soy del Instituto / Institución',
    desc:   'Investigadores, personal IIAP y aliados',
    color:  'border-primary-800 bg-primary-50 text-primary-900',
    active: 'border-primary-800 ring-2 ring-primary-800/20 bg-primary-50',
  },
  {
    id:    'visitante',
    icon:  Globe,
    label: 'Solo quiero consultar información',
    desc:  'Acceso público a información del IIAP',
    color: 'border-border bg-bg-alt text-text',
    active: 'border-gold-400 ring-2 ring-gold-400/20 bg-amber-50/40',
  },
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
  const { login, loginVisitante, loading } = useAuth()
  const from = location.state?.from?.pathname || '/'

  const [modo, setModo]               = useState('institucional')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [nombreVisitante, setNombre]  = useState('')
  const [showPass, setShowPass]       = useState(false)
  const [errors, setErrors]           = useState({})
  const [serverError, setServerError] = useState('')
  const [errorCode, setErrorCode]     = useState(null)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSent, setResendSent]   = useState(false)

  const validate = () => {
    const e = {}
    if (modo === 'institucional') {
      const emailErr    = validateEmail(email)
      const passwordErr = validatePassword(password, 6)
      if (emailErr)    e.email    = emailErr
      if (passwordErr) e.password = passwordErr
    }
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    setErrorCode(null)
    setResendSent(false)
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})

    try {
      if (modo === 'visitante') {
        await loginVisitante(nombreVisitante.trim())
        navigate(from === '/admin' ? '/' : from, { replace: true })
      } else {
        const user = await login(email, password)
        navigate(user.role === 'Administrador SIG' ? '/admin' : (from === '/admin' ? '/' : from), { replace: true })
      }
    } catch (err) {
      setErrorCode(err.code ?? null)
      setServerError(err.message || 'No se pudo acceder. Intente de nuevo.')
    }
  }

  const handleResendVerification = async () => {
    setResendLoading(true)
    try {
      await api.post('/auth/reenviar-verificacion', { email })
      setResendSent(true)
    } catch {
      // Generic response — always show success to avoid revealing email existence
      setResendSent(true)
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <AuthLayout>
      {/* Heading */}
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-text mb-1">Bienvenido</h2>
        <p className="text-sm text-text-muted">Seleccione cómo desea acceder al portal territorial</p>
      </div>

      {/* Selector de modo */}
      <div className="grid grid-cols-2 gap-2.5 mb-6">
        {MODOS.map((m) => {
          const Icon = m.icon
          const isActive = modo === m.id
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => { setModo(m.id); setServerError(''); setErrorCode(null); setResendSent(false); setErrors({}) }}
              className={`flex flex-col items-start gap-1.5 p-3.5 rounded-xl border-2 text-left transition-all ${isActive ? m.active : 'border-border bg-white hover:border-primary-300'}`}
            >
              <Icon className={`w-5 h-5 ${isActive && m.id === 'institucional' ? 'text-primary-800' : isActive ? 'text-amber-600' : 'text-text-muted'}`} />
              <span className="text-[0.78rem] font-bold text-text leading-tight">{m.label}</span>
              <span className="text-[0.65rem] text-text-muted leading-snug">{m.desc}</span>
            </button>
          )
        })}
      </div>

      {/* Error del servidor */}
      <AnimatePresence>
        {serverError && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 space-y-2">
            <div className="flex items-start gap-2.5 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
            {errorCode === 'EMAIL_NOT_VERIFIED' && (
              <div className="pl-6">
                {resendSent ? (
                  <p className="text-xs text-green-700 font-semibold">
                    Correo de verificación reenviado. Revisa tu bandeja de entrada.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-800 hover:text-primary-600 transition-colors disabled:opacity-50"
                  >
                    {resendLoading
                      ? <><Loader2 className="w-3 h-3 animate-spin" />Enviando...</>
                      : <><Send className="w-3 h-3" />Reenviar correo de verificación</>
                    }
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* ── Modo institucional ── */}
        {modo === 'institucional' && (
          <motion.form
            key="institucional"
            initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
            onSubmit={handleSubmit} className="space-y-4" noValidate
          >
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
            <div className="flex items-center justify-end pt-1">
              <Link to="/recuperar-password"
                className="text-sm font-semibold text-primary-800 no-underline hover:text-primary-600 transition-colors">
                ¿Olvidó su contraseña?
              </Link>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary-800 text-white rounded-xl text-sm font-bold hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm">
              {loading
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><LogIn className="w-4 h-4" />Iniciar Sesión</>
              }
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-text-muted uppercase tracking-wider">o</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Link to="/solicitar-acceso"
              className="flex items-center justify-between w-full px-4 py-3 border-2 border-border rounded-xl text-sm font-semibold text-text no-underline hover:border-primary-800 hover:text-primary-800 transition-colors group">
              <span>¿No tiene cuenta? Solicitar acceso</span>
              <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary-800 transition-colors" />
            </Link>
          </motion.form>
        )}

        {/* ── Modo visitante ── */}
        {modo === 'visitante' && (
          <motion.form
            key="visitante"
            initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
            onSubmit={handleSubmit} className="space-y-5"
          >
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-800 leading-relaxed">
                Accede como <strong>visitante</strong> para consultar mapas, documentos,
                noticias y demás información pública del IIAP sin necesidad de registrarte.
              </p>
            </div>

            <InputField
              label="Tu nombre (opcional)"
              icon={User}
              type="text"
              value={nombreVisitante}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="¿Cómo te llamas? (opcional)"
            />

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm">
              {loading
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Globe className="w-4 h-4" />Acceder como visitante</>
              }
            </button>

            <p className="text-xs text-text-muted text-center leading-relaxed">
              El acceso como visitante solo permite consultar información pública.
              Para solicitar acceso completo,{' '}
              <Link to="/solicitar-acceso" className="text-primary-800 font-semibold hover:underline">
                regístrate aquí
              </Link>.
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthLayout>
  )
}
