import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserPlus, ArrowLeft, Mail, User,
  Building2, FileText, Briefcase, AlertCircle,
  Lock, Eye, EyeOff, CheckCircle2, XCircle, Send,
} from 'lucide-react'
import AuthLayout from '@/components/AuthLayout'
import { useAuth } from '@/contexts/AuthContext'
import {
  validateEmail, validateRequired, validateMinLength,
  validateSelect, validateCheckbox,
  validatePasswordStrength, passwordCriteria,
} from '@/lib/validators'

const PERFILES = [
  { value: '',              label: 'Seleccione el perfil de acceso...' },
  { value: 'investigador',  label: 'Investigador / Científico'          },
  { value: 'tecnico',       label: 'Técnico SIG / Analista Territorial' },
  { value: 'institucional', label: 'Funcionario Institucional'          },
  { value: 'publico',       label: 'Usuario Público General'            },
]

const CRITERIA_LABELS = [
  { key: 'length',      label: 'Mínimo 8 caracteres'           },
  { key: 'upper',       label: 'Al menos una mayúscula (A–Z)'  },
  { key: 'lower',       label: 'Al menos una minúscula (a–z)'  },
  { key: 'numOrSymbol', label: 'Al menos un número o símbolo'  },
]

// ── Sub-componentes ───────────────────────────────────────────────────────────

function Field({ label, icon: Icon, error, hint, children }) {
  return (
    <div>
      <label className="block text-[0.8rem] font-semibold text-text mb-1.5">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-3.5 w-4 h-4 text-text-muted pointer-events-none" />
        )}
        {children}
      </div>
      {hint && !error && <p className="text-[0.7rem] text-text-muted mt-1">{hint}</p>}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-xs text-red-500 mt-1 flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3" />{error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

function PasswordStrengthMeter({ value }) {
  const criteria = passwordCriteria(value)
  const met      = Object.values(criteria).filter(Boolean).length
  if (!value) return null

  const bars = [
    met <= 1 ? 'bg-red-400'    : 'bg-bg-alt',
    met >= 2 ? 'bg-amber-400'  : 'bg-bg-alt',
    met >= 3 ? 'bg-amber-400'  : 'bg-bg-alt',
    met >= 4 ? 'bg-green-500'  : 'bg-bg-alt',
  ]
  const label =
    met <= 1 ? { text: 'Muy débil',  color: 'text-red-500'   } :
    met === 2 ? { text: 'Débil',     color: 'text-amber-500' } :
    met === 3 ? { text: 'Moderada',  color: 'text-amber-600' } :
               { text: 'Segura',     color: 'text-green-600' }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-2 space-y-2"
    >
      {/* Barras de fortaleza */}
      <div className="flex items-center gap-1.5">
        <div className="flex gap-1 flex-1">
          {bars.map((cls, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${cls}`}
            />
          ))}
        </div>
        <span className={`text-[0.65rem] font-bold ${label.color}`}>{label.text}</span>
      </div>

      {/* Criterios individuales */}
      <ul className="space-y-0.5">
        {CRITERIA_LABELS.map(({ key, label: txt }) => {
          const ok = criteria[key]
          return (
            <li key={key} className={`flex items-center gap-1.5 text-[0.68rem] transition-colors ${
              ok ? 'text-green-600' : 'text-text-muted'
            }`}>
              {ok
                ? <CheckCircle2 className="w-3 h-3 shrink-0 text-green-500" />
                : <XCircle      className="w-3 h-3 shrink-0 text-bg-alt-dark opacity-40" />
              }
              {txt}
            </li>
          )
        })}
      </ul>
    </motion.div>
  )
}

const inputCls = (err) =>
  `w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm text-text placeholder:text-text-muted bg-white focus:outline-none focus:ring-2 transition ${
    err ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10'
        : 'border-border focus:border-primary-800 focus:ring-primary-800/10'
  }`

// ── Componente principal ──────────────────────────────────────────────────────

export default function SolicitarAcceso() {
  const { register } = useAuth()
  const [sent, setSent]             = useState(false)
  const [loading, setLoading]       = useState(false)
  const [serverError, setServerError] = useState('')
  const [showPass, setShowPass]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [form, setForm] = useState({
    nombre: '', email: '', password: '', confirmPassword: '',
    institucion: '', perfil: '', motivo: '', terminos: false,
  })
  const [errors, setErrors] = useState({})

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }))
    setErrors((p) => ({ ...p, [k]: undefined }))
    setServerError('')
  }

  const validate = () => {
    const e = {}
    const req = validateRequired(form.nombre, 'El nombre completo')
    if (req)                                                              e.nombre          = req
    const emailErr = validateEmail(form.email)
    if (emailErr)                                                         e.email           = emailErr
    const passErr  = validatePasswordStrength(form.password)
    if (passErr)                                                          e.password        = passErr
    if (!form.confirmPassword)                                            e.confirmPassword = 'Confirma tu contraseña'
    else if (form.password !== form.confirmPassword)                      e.confirmPassword = 'Las contraseñas no coinciden'
    const instErr = validateRequired(form.institucion, 'La institución')
    if (instErr)                                                          e.institucion     = instErr
    const perfilErr = validateSelect(form.perfil, 'un perfil')
    if (perfilErr)                                                        e.perfil          = perfilErr
    const motivoErr = validateMinLength(form.motivo, 10, 'El motivo')
    if (motivoErr)                                                        e.motivo          = motivoErr
    const termErr = validateCheckbox(form.terminos, 'Debe aceptar los términos')
    if (termErr)                                                          e.terminos        = termErr
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      await register({
        nombre:      form.nombre,
        email:       form.email,
        password:    form.password,
        institucion: form.institucion,
        motivo:      `[${form.perfil}] ${form.motivo}`,
      })
      setSent(true)
    } catch (err) {
      setServerError(err.message ?? 'No se pudo enviar la solicitud. Intente de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <AnimatePresence mode="wait">

        {/* ── Pantalla de éxito ── */}
        {sent ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }} className="text-center py-2"
          >
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
              className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-primary-100"
            >
              <Send className="w-9 h-9 text-primary-700" />
            </motion.div>

            <h2 className="font-display text-2xl font-bold text-text mb-2">¡Verifica tu correo!</h2>

            <div className="bg-bg-alt border border-border rounded-xl px-4 py-3 mb-4 text-left">
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1">
                Correo enviado a
              </p>
              <p className="text-sm font-semibold text-text">{form.email}</p>
            </div>

            <div className="space-y-2 text-sm text-text-muted leading-relaxed mb-5 text-left">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <p>Revisa tu bandeja de entrada (y la carpeta de spam).</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <p>Haz clic en el botón <strong className="text-text">"Verificar mi correo"</strong> del mensaje que te enviamos.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <p>Una vez verificado, un administrador revisará y activará tu acceso.</p>
              </div>
            </div>

            <p className="text-xs text-text-muted mb-6">
              El enlace de verificación expira en <strong>24 horas</strong>.
            </p>

            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary-800 text-white rounded-xl text-sm font-semibold no-underline hover:bg-primary-700 transition-colors w-full"
            >
              <ArrowLeft className="w-4 h-4" /> Ir al inicio de sesión
            </Link>
          </motion.div>

        ) : (

          /* ── Formulario ── */
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold text-text mb-1">Solicitar Acceso</h2>
              <p className="text-sm text-text-muted">Complete el formulario. Recibirá un correo para verificar su cuenta.</p>
            </div>

            <AnimatePresence>
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{serverError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>

              {/* Nombre */}
              <Field label="Nombre Completo" icon={User} error={errors.nombre}>
                <input
                  type="text" value={form.nombre}
                  onChange={(e) => set('nombre', e.target.value)}
                  placeholder="Ej. Juan Pérez García"
                  autoComplete="name"
                  className={inputCls(errors.nombre)}
                />
              </Field>

              {/* Email */}
              <Field label="Correo Electrónico" icon={Mail} error={errors.email}>
                <input
                  type="email" value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="correo@institucion.org"
                  autoComplete="email"
                  className={inputCls(errors.email)}
                />
              </Field>

              {/* Contraseña con criterios */}
              <div>
                <Field label="Contraseña" icon={Lock} error={errors.password}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    placeholder="Crea una contraseña segura"
                    autoComplete="new-password"
                    className={`${inputCls(errors.password)} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3.5 top-3 text-text-muted hover:text-text transition-colors"
                    tabIndex={-1}
                    aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </Field>
                <PasswordStrengthMeter value={form.password} />
              </div>

              {/* Confirmar contraseña */}
              <Field label="Confirmar Contraseña" icon={Lock} error={errors.confirmPassword}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => set('confirmPassword', e.target.value)}
                  placeholder="Repite tu contraseña"
                  autoComplete="new-password"
                  className={`${inputCls(errors.confirmPassword)} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3.5 top-3 text-text-muted hover:text-text transition-colors"
                  tabIndex={-1}
                  aria-label={showConfirm ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </Field>

              {/* Institución */}
              <Field label="Institución / Organización" icon={Building2} error={errors.institucion}>
                <input
                  type="text" value={form.institucion}
                  onChange={(e) => set('institucion', e.target.value)}
                  placeholder="Nombre de la institución"
                  className={inputCls(errors.institucion)}
                />
              </Field>

              {/* Perfil */}
              <Field label="Perfil de Acceso Requerido" icon={Briefcase} error={errors.perfil}>
                <select
                  value={form.perfil}
                  onChange={(e) => set('perfil', e.target.value)}
                  className={inputCls(errors.perfil)}
                >
                  {PERFILES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </Field>

              {/* Motivo */}
              <Field
                label="Motivo de la Solicitud" icon={FileText} error={errors.motivo}
                hint="Describa para qué proyecto o investigación necesita acceso"
              >
                <textarea
                  rows={3} value={form.motivo}
                  onChange={(e) => set('motivo', e.target.value)}
                  placeholder="Indique el proyecto, institución y propósito del acceso solicitado..."
                  className={`${inputCls(errors.motivo)} resize-none`}
                />
              </Field>

              {/* Términos */}
              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox" checked={form.terminos}
                    onChange={(e) => set('terminos', e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-primary-800 rounded shrink-0"
                  />
                  <span className="text-xs text-text-muted leading-relaxed">
                    Acepto los{' '}
                    <Link to="/terminos" className="font-semibold text-primary-800 hover:underline no-underline">
                      Términos y Condiciones
                    </Link>{' '}
                    y el tratamiento de mis datos personales por el IIAP.
                  </span>
                </label>
                <AnimatePresence>
                  {errors.terminos && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-xs text-red-500 mt-1 flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />{errors.terminos}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary-800 text-white rounded-xl text-sm font-bold hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {loading
                  ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><UserPlus className="w-4 h-4" />Enviar Solicitud</>
                }
              </button>
            </form>

            <div className="text-center mt-6 pt-5 border-t border-border">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-800 no-underline hover:text-primary-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Ya tengo cuenta — Iniciar sesión
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  )
}
