import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'

export const CLAVE_AVISO_PRIVACIDAD = 'vigiiap:aviso-privacidad-v1'

function yaFueVisto(): boolean {
  try { return localStorage.getItem(CLAVE_AVISO_PRIVACIDAD) === '1' } catch { return false }
}

/**
 * Aviso informativo, no bloqueante: VIGIA-IIAP solo usa cookies estrictamente necesarias y una analítica propia y
 * anónima, así que no hay nada que aceptar o rechazar; se informa una vez y se enlazan las políticas.
 */
export default function AvisoPrivacidad() {
  const [visible, setVisible] = useState(() => !yaFueVisto())
  if (!visible) return null

  const cerrar = () => {
    try { localStorage.setItem(CLAVE_AVISO_PRIVACIDAD, '1') } catch { /* sin almacenamiento: el aviso volverá a salir */ }
    setVisible(false)
  }

  return (
    <aside
      role="region" aria-label="Aviso de privacidad y cookies"
      className="fixed bottom-20 md:bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-50 rounded-2xl border border-border bg-[var(--card-bg)] shadow-lg p-4"
    >
      <div className="flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-primary-800 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-xs text-text-muted leading-relaxed">
          <p>
            Esta plataforma usa solo cookies necesarias para mantener tu sesión y una analítica propia y anónima de las
            visitas. No usamos publicidad ni seguimiento de terceros.{' '}
            <Link to="/politica-cookies" className="font-semibold text-primary-800 hover:underline">Política de cookies</Link>
            {' · '}
            <Link to="/politica-privacidad" className="font-semibold text-primary-800 hover:underline">Política de privacidad</Link>
          </p>
          <button
            type="button" onClick={cerrar}
            className="mt-3 px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary-800 text-white hover:bg-primary-700 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </aside>
  )
}
