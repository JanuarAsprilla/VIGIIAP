/**
 * Panel de acceso anclado bajo el botón "Ingresar" del TopBar — reemplaza la
 * navegación a una página aparte. A diferencia de los demás paneles del
 * TopBar (Soporte, Notificaciones, Ajustes), este sí lleva un scrim de fondo:
 * iniciar sesión es una tarea que bloquea el flujo, no un ajuste rápido que
 * se consulta de paso — por eso oscurece y desenfoca el resto de la pantalla
 * (TopBar incluido) para que la persona se enfoque solo en esto (ver Apple
 * HIG: "dim to focus, separate to keep flow").
 *
 * Se renderiza vía <Portal> directo a <body>: el propio TopBar ya usa
 * backdropFilter para su estilo de nav — eso lo convierte en el "containing
 * block" de cualquier descendiente position:fixed (ver Portal.tsx), así que
 * sin portal el scrim quedaba atrapado dentro de la franja del TopBar en vez
 * de cubrir toda la página. Al escapar del DOM del TopBar, la posición ya no
 * puede anclarse con CSS relativo al botón — se calcula con
 * getBoundingClientRect() sobre anchorRef en su lugar.
 *
 * Se abre siempre en el paso "welcome": una bienvenida breve que explica las
 * dos formas de acceder (institucional / visitante) antes de pedir
 * credenciales — entrar al sitio no debe desplegar el formulario de una vez.
 * Solo al pulsar "Iniciar sesión" (o "Solicitar acceso") pasa al formulario
 * real. "Continuar como visitante" es un atajo directo, sin pasar por el
 * formulario, igual que el WelcomeGate original que este panel reemplazó.
 */
import { useState, useLayoutEffect, type RefObject } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, ArrowLeft, Building2, Compass, FileCheck2, Globe, User, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import LoginForm from '@/components/auth/LoginForm'
import Portal from '@/components/ui/Portal'
import { panelAnim } from './panelAnim'

const GAP_PX = 8 // equivalente al mt-2 que tenía el panel cuando estaba anclado con CSS

type Step = 'welcome' | 'form'

function WelcomeStep({ onIniciarSesion, onVisitante, onSolicitar, entering, error }: {
  onIniciarSesion: () => void
  onVisitante: () => void
  onSolicitar: () => void
  entering: boolean
  error: string | null
}) {
  return (
    <motion.div
      key="welcome"
      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
    >
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
        <button type="button" onClick={onVisitante} disabled={entering}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border border-border text-text hover:border-primary-800 hover:text-primary-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
          <Compass className="w-4 h-4" aria-hidden="true" />
          {entering ? 'Entrando…' : 'Continuar como visitante'}
        </button>
        <button type="button" onClick={onSolicitar}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-text-muted hover:text-primary-800 transition-colors">
          <FileCheck2 className="w-3.5 h-3.5" aria-hidden="true" />¿No tiene cuenta? Solicitar acceso
        </button>
      </div>
    </motion.div>
  )
}

export default function LoginPanel({ onClose, from, anchorRef, boxRef, onNavigateAuthModal }: {
  onClose: () => void
  from?: string
  anchorRef: RefObject<HTMLElement | null>
  // El panel vive en un portal (ver comentario de arriba) — TopBar necesita
  // esta referencia para su detector de "clic afuera cierra el panel", ya
  // que una vez portado, el nodo real del panel deja de ser descendiente
  // DOM del contenedor que ese detector ya vigila.
  boxRef: RefObject<HTMLDivElement | null>
  // Abre RecuperarPasswordPanel/SolicitarAccesoPanel (ver MainLayout) sin
  // navegar — navegar y volver (ver RecuperarPassword.tsx) dispara dos veces
  // la transición de página en sucesión inmediata, que se percibe como que
  // la página se recarga.
  onNavigateAuthModal: (target: 'recuperar' | 'solicitar') => void
}) {
  const { loginVisitante } = useAuth()
  // Si el panel se abrió porque una ruta protegida redirigió aquí (ver
  // RequireAuth/RequireAdmin — pasan `from`), la persona ya mostró intención
  // de entrar: se salta la bienvenida y va directo al formulario. Un clic
  // manual en "Ingresar" (from=undefined) sí empieza por la bienvenida.
  const [step, setStep]         = useState<Step>(from ? 'form' : 'welcome')
  const [entering, setEntering] = useState(false)
  const [visitanteError, setVisitanteError] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null)

  useLayoutEffect(() => {
    function updateCoords() {
      const rect = anchorRef.current?.getBoundingClientRect()
      if (!rect) return
      setCoords({ top: rect.bottom + GAP_PX, right: window.innerWidth - rect.right })
    }
    updateCoords()
    window.addEventListener('resize', updateCoords)
    return () => window.removeEventListener('resize', updateCoords)
  }, [anchorRef])

  const handleVisitante = async () => {
    setEntering(true)
    setVisitanteError(null)
    try {
      await loginVisitante()
      onClose()
    } catch (err) {
      setVisitanteError((err as Error)?.message || 'No se pudo acceder como visitante. Intente de nuevo.')
    } finally {
      setEntering(false)
    }
  }

  const handleSolicitar = () => { onNavigateAuthModal('solicitar'); onClose() }
  const handleRecuperar = () => { onNavigateAuthModal('recuperar'); onClose() }

  return (
    <Portal>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-40 bg-black/35 backdrop-blur-3xl"
        onClick={onClose}
        aria-hidden="true"
      />
      {coords && (
        <motion.div
          {...panelAnim}
          ref={boxRef}
          style={{ ...panelAnim.style, position: 'fixed', top: coords.top, right: coords.right }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-panel-title"
          className="glass-panel w-[380px] max-w-[92vw] max-h-[85vh] rounded-2xl z-50 overflow-hidden flex flex-col"
        >
          <div
            className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-border"
            style={{ background: 'var(--card-bg)' }}
          >
            <div className="flex items-center gap-2.5">
              {step === 'form' ? (
                <button
                  onClick={() => setStep('welcome')}
                  aria-label="Volver a bienvenida"
                  className="w-8 h-8 -ml-1 rounded-lg flex items-center justify-center shrink-0 text-text-muted hover:text-text hover:bg-bg-alt transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                </button>
              ) : (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--brand-gradient)' }}>
                  <User className="w-4 h-4 text-white" aria-hidden="true" />
                </div>
              )}
              <h2 id="login-panel-title" className="font-display text-base font-bold text-text">
                {step === 'welcome' ? 'Bienvenido a VIGIA-IIAP' : 'Iniciar sesión'}
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="p-1.5 -mr-1 rounded-lg text-text-muted hover:text-text hover:bg-bg-alt transition-colors shrink-0"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <AnimatePresence mode="wait">
              {step === 'welcome' ? (
                <WelcomeStep
                  onIniciarSesion={() => setStep('form')}
                  onVisitante={handleVisitante}
                  onSolicitar={handleSolicitar}
                  entering={entering}
                  error={visitanteError}
                />
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
                >
                  <LoginForm
                    from={from}
                    onClose={onClose}
                    showHeading={false}
                    onNavigate={(target) => (target === 'recuperar' ? handleRecuperar() : handleSolicitar())}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </Portal>
  )
}
