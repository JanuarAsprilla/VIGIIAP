import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserPlus, ArrowLeft, CheckCircle, Mail, User, Building2, FileText } from 'lucide-react'

export default function SolicitarAcceso() {
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    // Simular envío — en backend real se enviará un email al admin
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
            <span className="text-white font-bold text-xl">V</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-1">VIGIIAP</h1>
          <p className="text-white/60 text-sm">
            Solicitud de acceso al portal territorial
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-float p-8">
          {sent ? (
            /* ── Success state ── */
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-primary-700" />
              </div>
              <h2 className="text-xl font-bold text-text mb-2">
                Solicitud Enviada
              </h2>
              <p className="text-sm text-text-muted leading-relaxed mb-6 max-w-sm mx-auto">
                Su solicitud ha sido recibida. El administrador del sistema revisará
                su información y le enviará las credenciales de acceso al correo
                electrónico proporcionado.
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
            /* ── Form ── */
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-text mb-1">
                  Solicitar Acceso
                </h2>
                <p className="text-sm text-text-muted leading-relaxed">
                  Complete el formulario. Un administrador revisará su solicitud
                  y le enviará las credenciales por correo electrónico.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-text mb-1.5">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Ej. Juan Pérez"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-bg-alt border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-text mb-1.5">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted" />
                    <input
                      type="email"
                      placeholder="correo@institucion.org"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-bg-alt border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
                    />
                  </div>
                </div>

                {/* Institution */}
                <div>
                  <label className="block text-sm font-semibold text-text mb-1.5">
                    Institución / Organización
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Nombre de la institución"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-bg-alt border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
                    />
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-semibold text-text mb-1.5">
                    Motivo de la Solicitud
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-4.5 h-4.5 text-text-muted" />
                    <textarea
                      rows={3}
                      placeholder="Describa brevemente para qué necesita acceso al sistema..."
                      required
                      className="w-full pl-10 pr-4 py-3 bg-bg-alt border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition resize-y min-h-[80px]"
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-primary-800 text-white rounded-lg text-sm font-bold hover:bg-primary-700 transition-colors"
                >
                  <UserPlus className="w-4.5 h-4.5" />
                  Enviar Solicitud
                </button>
              </form>

              {/* Back to login */}
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