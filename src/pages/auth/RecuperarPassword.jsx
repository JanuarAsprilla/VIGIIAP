import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle, Send } from 'lucide-react'

export default function RecuperarPassword() {
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-6">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Back to home FAB */}
      <Link
        to="/"
        className="fixed top-6 left-6 z-10 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white text-sm font-medium no-underline hover:bg-white/20 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al inicio
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
            <span className="text-white font-bold text-xl">V</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-1">VIGIIAP</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-float p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-primary-700" />
              </div>
              <h2 className="text-xl font-bold text-text mb-2">Correo Enviado</h2>
              <p className="text-sm text-text-muted leading-relaxed mb-6 max-w-sm mx-auto">
                Hemos enviado las instrucciones de recuperación a <strong>{email}</strong>.
                Revise su bandeja de entrada y siga los pasos indicados.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold no-underline hover:bg-primary-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al Login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-text mb-1">Recuperar Contraseña</h2>
                <p className="text-sm text-text-muted leading-relaxed">
                  Ingrese su correo electrónico y le enviaremos un enlace para restablecer su contraseña.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-text mb-1.5">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="usuario@iiap.org.co"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-bg-alt border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-primary-800 text-white rounded-lg text-sm font-bold hover:bg-primary-700 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Enviar Instrucciones
                </button>
              </form>

              <div className="text-center mt-6 pt-4 border-t border-border">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-800 no-underline hover:text-primary-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver al inicio de sesión
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}