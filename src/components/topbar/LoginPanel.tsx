/**
 * Panel de acceso anclado bajo el botón "Ingresar" del TopBar — reemplaza la
 * navegación a una página aparte. A diferencia de los demás paneles del
 * TopBar (Soporte, Notificaciones, Ajustes), este sí lleva un scrim de fondo:
 * iniciar sesión es una tarea que bloquea el flujo, no un ajuste rápido que
 * se consulta de paso — por eso oscurece y desenfoca el resto de la pantalla
 * (TopBar incluido) para que la persona se enfoque solo en esto (ver Apple
 * HIG: "dim to focus, separate to keep flow").
 *
 * Es un panel aparte de WelcomePanel (ver ese archivo) — TopBar decide cuál
 * de los dos mostrar vía `activePanel`. Este solo pide credenciales; no
 * conoce ni explica las dos formas de acceso, eso es trabajo de WelcomePanel.
 *
 * Se renderiza vía <Portal> directo a <body>: el propio TopBar ya usa
 * backdropFilter para su estilo de nav — eso lo convierte en el "containing
 * block" de cualquier descendiente position:fixed (ver Portal.tsx), así que
 * sin portal el scrim quedaba atrapado dentro de la franja del TopBar en vez
 * de cubrir toda la página. Al escapar del DOM del TopBar, la posición ya no
 * puede anclarse con CSS relativo al botón — se calcula con
 * getBoundingClientRect() sobre anchorRef en su lugar.
 */
import { useState, useLayoutEffect, type RefObject } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, User, X } from 'lucide-react'
import LoginForm from '@/components/auth/LoginForm'
import Portal from '@/components/ui/Portal'
import { panelAnim } from './panelAnim'

const GAP_PX = 8 // equivalente al mt-2 que tenía el panel cuando estaba anclado con CSS

export default function LoginPanel({ onClose, onBack, from, anchorRef, boxRef, onNavigateAuthModal }: {
  onClose: () => void
  // Vuelve a WelcomePanel — omitido cuando se llega directo aquí (redirect
  // desde una ruta protegida, ver TopBar), donde no hay a dónde volver.
  onBack?: () => void
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
              {onBack ? (
                <button
                  onClick={onBack}
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
              <h2 id="login-panel-title" className="font-display text-base font-bold text-text">Iniciar sesión</h2>
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
            <LoginForm
              from={from}
              onClose={onClose}
              showHeading={false}
              onNavigate={onNavigateAuthModal}
            />
          </div>
        </motion.div>
      )}
    </Portal>
  )
}
