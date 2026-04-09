import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle, Send, KeyRound, AlertCircle, ShieldCheck } from 'lucide-react'
import AuthLayout from '@/components/AuthLayout'

const STEPS = [
  { id: 'email',    label: 'Correo',    icon: Mail        },
  { id: 'enviado',  label: 'Enviado',   icon: Send        },
  { id: 'listo',    label: 'Listo',     icon: ShieldCheck },
]

export default function RecuperarPassword() {
  const [step, setStep] = useState('email') // 'email' | 'enviado'
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) { setError('Ingrese su correo electrónico'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Correo no válido'); return }
    setStep('enviado')
  }

  const stepIndex = STEPS.findIndex((s) => s.id === step)

  return (
    <AuthLayout>
      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.slice(0, 2).map((s, i) => {
          const done = i < stepIndex || step === 'enviado'
          const active = i === stepIndex
          return (
            <div key={s.id} className="flex items-center">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                done || active
                  ? 'bg-primary-800 text-white'
                  : 'bg-bg-alt text-text-muted'
              }`}>
                <s.icon className="w-3 h-3" />
                {s.label}
              </div>
              {i < STEPS.length - 2 && (
                <div className={`w-8 h-px mx-1 transition-colors ${done ? 'bg-primary-800' : 'bg-border'}`} />
              )}
            </div>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {step === 'email' ? (
          <motion.div key="email"
            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>

            <div className="mb-7">
              <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center mb-4 border border-primary-100">
                <KeyRound className="w-6 h-6 text-primary-700" />
              </div>
              <h2 className="font-display text-2xl font-bold text-text mb-1">Recuperar Contraseña</h2>
              <p className="text-sm text-text-muted leading-relaxed">
                Ingrese el correo asociado a su cuenta. Le enviaremos un enlace seguro para restablecer su contraseña.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="block text-[0.8rem] font-semibold text-text mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError('') }}
                    placeholder="usuario@iiap.org.co"
                    autoComplete="email"
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm text-text placeholder:text-text-muted bg-white focus:outline-none focus:ring-2 transition ${
                      error
                        ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10'
                        : 'border-border focus:border-primary-800 focus:ring-primary-800/10'
                    }`}
                  />
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

              <button type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary-800 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors shadow-sm">
                <Send className="w-4 h-4" />
                Enviar Instrucciones
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-border text-center">
              <Link to="/login"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-800 no-underline hover:text-primary-600 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio de sesión
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div key="enviado"
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-center">

            {/* Animated success icon */}
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
              className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-primary-100">
              <CheckCircle className="w-10 h-10 text-primary-700" />
            </motion.div>

            <h2 className="font-display text-2xl font-bold text-text mb-2">Correo Enviado</h2>

            <div className="bg-bg-alt border border-border rounded-xl px-4 py-3 mb-5 text-left">
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1">Enviado a</p>
              <p className="text-sm font-semibold text-text">{email}</p>
            </div>

            <p className="text-sm text-text-muted leading-relaxed mb-2 max-w-sm mx-auto">
              Hemos enviado un enlace seguro a su correo. Revise también la carpeta de spam o correo no deseado.
            </p>
            <p className="text-xs text-text-muted mb-8">
              El enlace expirará en <strong>30 minutos</strong>.
            </p>

            <div className="flex flex-col gap-2">
              <Link to="/login"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary-800 text-white rounded-xl text-sm font-semibold no-underline hover:bg-primary-700 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio de sesión
              </Link>
              <button onClick={() => { setStep('email'); setEmail(''); setError('') }}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-border text-text-muted rounded-xl text-sm font-semibold hover:border-primary-800 hover:text-primary-800 transition-colors">
                Enviar a otro correo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  )
}
