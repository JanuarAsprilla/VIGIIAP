/**
 * Panel de bienvenida — centrado en pantalla (ver CenteredAuthPanel), no
 * anclado bajo el botón "Ingresar" como LoginPanel: es el primer contacto
 * con el sitio, bloquea el flujo por completo, así que vive como un modal
 * de verdad en el centro, no como un popover colgado de un botón.
 *
 * Separado de LoginPanel a propósito: son dos cosas distintas, no un paso
 * interno de un mismo panel. Este explica brevemente las dos formas de
 * acceder (institucional / visitante) antes de pedir credenciales;
 * LoginPanel es quien pide el correo y la contraseña. TopBar decide cuál de
 * los dos renderizar vía `activePanel` ('welcome' | 'login').
 *
 * "Continuar como visitante" es un atajo directo sin pasar por LoginPanel,
 * igual que el WelcomeGate original que este panel reemplazó.
 */
import { useState, type RefObject } from 'react'
import { AlertCircle, Building2, Compass, FileCheck2, Globe, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Portal from '@/components/ui/Portal'
import CenteredAuthPanel from '@/components/auth/CenteredAuthPanel'

export default function WelcomePanel({ onClose, onIniciarSesion, onSolicitar, boxRef }: {
  onClose: () => void
  onIniciarSesion: () => void
  onSolicitar: () => void
  boxRef: RefObject<HTMLDivElement | null>
}) {
  const { loginVisitante } = useAuth()
  const [entering, setEntering] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const handleVisitante = async () => {
    setEntering(true)
    setError(null)
    try {
      await loginVisitante()
      onClose()
    } catch (err) {
      setError((err as Error)?.message || 'No se pudo acceder como visitante. Intente de nuevo.')
    } finally {
      setEntering(false)
    }
  }

  return (
    <Portal>
      <CenteredAuthPanel title="Bienvenido a VIGIA-IIAP" icon={User} onClose={onClose} boxRef={boxRef}>
        <p className="text-sm text-text-muted leading-relaxed mb-5">
          Consulte información pública como <strong className="text-text">visitante</strong>, sin registro,
          o inicie sesión con su cuenta <strong className="text-text">institucional</strong> para acceder al
          Geovisor, herramientas y trámites completos.
        </p>

        {error && (
          <div className="flex items-start gap-2.5 text-red-dark text-sm bg-red/10 border border-red/20 rounded-xl px-4 py-3 mb-5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2.5 mb-5">
          <div className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-[var(--card-bg)]">
            <Building2 className="w-4 h-4 text-primary-800 mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-[0.8rem] font-bold text-text leading-tight">Institucional</p>
              <p className="text-xs text-text-muted leading-snug mt-0.5">Investigadores, personal IIAP y aliados — acceso completo.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-[var(--card-bg)]">
            <Globe className="w-4 h-4 text-gold-500 mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-[0.8rem] font-bold text-text leading-tight">Visitante</p>
              <p className="text-xs text-text-muted leading-snug mt-0.5">Solo consulta de información pública, sin registro.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button type="button" onClick={onIniciarSesion}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary-800 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors shadow-sm">
            <User className="w-4 h-4" aria-hidden="true" />Iniciar sesión
          </button>
          <button type="button" onClick={handleVisitante} disabled={entering}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border border-border text-text hover:border-primary-800 hover:text-primary-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
            <Compass className="w-4 h-4" aria-hidden="true" />
            {entering ? 'Entrando…' : 'Continuar como visitante'}
          </button>
          <button type="button" onClick={onSolicitar}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-text-muted hover:text-primary-800 transition-colors">
            <FileCheck2 className="w-3.5 h-3.5" aria-hidden="true" />¿No tiene cuenta? Solicitar acceso
          </button>
        </div>
      </CenteredAuthPanel>
    </Portal>
  )
}
