import { useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Formulario mínimo tras un primer login con Google/Microsoft (ver
 * src/modules/oauth/ en el backend) — la cuenta ya existe y está
 * autenticada, solo falta la institución que un registro tradicional ya
 * pide en su propio formulario. No pide contraseña ni cambia el rol: para
 * eso ya existe "Solicitar acceso institucional" en el menú de perfil.
 */
export default function CompletarPerfilForm({ onClose }: { onClose: () => void }) {
  const { user, completarPerfil } = useAuth()
  const [nombre, setNombre] = useState(user?.name ?? '')
  const [institucion, setInstitucion] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (institucion.trim().length < 2) { setError('Ingrese su institución u organización'); return }
    setError('')
    setLoading(true)
    try {
      await completarPerfil({ nombre: nombre.trim() || undefined, institucion: institucion.trim() })
      onClose()
    } catch (err) {
      setError((err as Error)?.message ?? 'Ocurrió un error. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <p className="text-sm text-text-muted leading-relaxed mb-5">
        Iniciaste sesión con <strong>{user?.email}</strong>. Solo falta un dato para dejar tu registro completo.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="cp-nombre" className="block text-[0.8rem] font-semibold text-text mb-1.5">
            Nombre Completo
          </label>
          <input
            id="cp-nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre y apellido"
            autoComplete="name"
            className="w-full px-4 py-3 border border-border rounded-xl text-sm text-text placeholder:text-text-muted bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:border-primary-800 focus:ring-primary-800/10 transition"
          />
        </div>

        <div>
          <label htmlFor="cp-institucion" className="block text-[0.8rem] font-semibold text-text mb-1.5">
            Institución / Organización
          </label>
          <div className="relative">
            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" aria-hidden="true" />
            <input
              id="cp-institucion"
              type="text"
              value={institucion}
              onChange={(e) => { setInstitucion(e.target.value); setError('') }}
              placeholder="IIAP, universidad, entidad..."
              autoComplete="organization"
              className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm text-text placeholder:text-text-muted bg-[var(--card-bg)] focus:outline-none focus:ring-2 transition ${
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
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary-800 text-white rounded-xl text-sm font-bold hover:bg-primary-700 disabled:opacity-60 transition-colors shadow-sm">
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</>
            : <><CheckCircle2 className="w-4 h-4" />Completar registro</>
          }
        </button>
      </form>
    </div>
  )
}
