import { useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Briefcase, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

type PerfilSolicitado = '' | 'investigador' | 'tecnico' | 'institucional'

// 'publico' no aparece aquí — es el rol con el que ya nace toda cuenta OAuth
// (ver oauth.service.js#findOrCreateUser), así que pedirlo no tendría efecto.
const PERFILES: { value: PerfilSolicitado; label: string }[] = [
  { value: '',              label: 'Mantener mi acceso público (sin cambios)' },
  { value: 'investigador',  label: 'Investigador / Científico'          },
  { value: 'tecnico',       label: 'Técnico SIG / Analista Territorial' },
  { value: 'institucional', label: 'Funcionario Institucional'          },
]

/**
 * Formulario tras un primer login con Google/Microsoft (ver
 * src/modules/oauth/ en el backend) — la cuenta ya existe y está
 * autenticada, solo falta institución. Si además pide un perfil de acceso
 * elevado, esa solicitud NO se concede sola: queda pendiente de que un
 * admin la apruebe desde el panel de Usuarios (mismo mecanismo que ya usa
 * "Solicitar acceso institucional") — este formulario nunca cambia el rol
 * directamente.
 */
export default function CompletarPerfilForm({ onClose }: { onClose: () => void }) {
  const { user, completarPerfil } = useAuth()
  const [nombre, setNombre] = useState(user?.name ?? '')
  const [institucion, setInstitucion] = useState('')
  const [perfilSolicitado, setPerfilSolicitado] = useState<PerfilSolicitado>('')
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [solicitudEnviada, setSolicitudEnviada] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (institucion.trim().length < 2) { setError('Ingrese su institución u organización'); return }
    setError('')
    setLoading(true)
    try {
      await completarPerfil({
        nombre: nombre.trim() || undefined,
        institucion: institucion.trim(),
        perfilSolicitado: perfilSolicitado || undefined,
        motivo: motivo.trim() || undefined,
      })
      if (perfilSolicitado) {
        setSolicitudEnviada(true)
      } else {
        onClose()
      }
    } catch (err) {
      setError((err as Error)?.message ?? 'Ocurrió un error. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (solicitudEnviada) {
    return (
      <div className="text-center py-2">
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
          className="w-16 h-16 bg-primary-800/10 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-primary-800/15">
          <CheckCircle2 className="w-8 h-8 text-primary-700" />
        </motion.div>
        <h3 className="font-display text-lg font-bold text-text mb-2">Solicitud enviada</h3>
        <p className="text-sm text-text-muted leading-relaxed mb-6">
          Un administrador revisará tu solicitud de acceso como <strong>{PERFILES.find((p) => p.value === perfilSolicitado)?.label}</strong>. Mientras tanto, ya puedes seguir usando tu cuenta con acceso público.
        </p>
        <button type="button" onClick={onClose}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary-800 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors">
          Entendido
        </button>
      </div>
    )
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

        <div>
          <label htmlFor="cp-perfil" className="block text-[0.8rem] font-semibold text-text mb-1.5">
            Perfil de Acceso
          </label>
          <div className="relative">
            <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" aria-hidden="true" />
            <select
              id="cp-perfil"
              value={perfilSolicitado}
              onChange={(e) => setPerfilSolicitado(e.target.value as PerfilSolicitado)}
              className="w-full pl-10 pr-4 py-3 border border-border rounded-xl text-sm text-text bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:border-primary-800 focus:ring-primary-800/10 transition appearance-none"
            >
              {PERFILES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          {perfilSolicitado && (
            <p className="text-xs text-text-muted mt-1.5">
              Un administrador debe aprobar este acceso — seguirás viendo el contenido público mientras tanto.
            </p>
          )}
        </div>

        <AnimatePresence>
          {perfilSolicitado && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }} className="overflow-hidden"
            >
              <label htmlFor="cp-motivo" className="block text-[0.8rem] font-semibold text-text mb-1.5">
                Motivo (opcional)
              </label>
              <textarea
                id="cp-motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Cuéntanos brevemente para qué necesitas este acceso"
                rows={2}
                maxLength={500}
                className="w-full px-4 py-3 border border-border rounded-xl text-sm text-text placeholder:text-text-muted bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:border-primary-800 focus:ring-primary-800/10 transition resize-none"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <button type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary-800 text-white rounded-xl text-sm font-bold hover:bg-primary-700 disabled:opacity-60 transition-colors shadow-sm">
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</>
            : <><CheckCircle2 className="w-4 h-4" />{perfilSolicitado ? 'Enviar solicitud' : 'Completar registro'}</>
          }
        </button>
      </form>
    </div>
  )
}
