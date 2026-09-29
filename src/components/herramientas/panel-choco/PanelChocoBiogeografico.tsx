import { useEffect, useRef } from 'react'
import { Eye } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { iniciarPanelChoco } from './panelChoco.motor'
import marcado from './panelChoco.original.html?raw'
import './panelChoco.original.css'
import './panelChoco.tema.css'

const ROLES_EDITAN = new Set(['investigador', 'admin_sig', 'super_admin'])

/** Panel del dashboard original, con su estructura y lógica intactas. Aquí solo se monta:
 * el marcado es un recurso estático propio (no proviene de usuarios) y el motor se
 * desmonta limpio (listeners y gráficas) al salir de la herramienta. */
export default function PanelChocoBiogeografico() {
  const { user } = useAuth()
  const puedeEditar = !!user && ROLES_EDITAN.has(user.rol)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    root.innerHTML = marcado
    const destruir = iniciarPanelChoco(root, { puedeEditar })
    return () => {
      destruir()
      root.innerHTML = ''
    }
  }, [puedeEditar])

  return (
    <div className="space-y-4">
      {!puedeEditar && (
        <div className="flex items-center gap-2 px-3 py-2 bg-bg-alt border border-border rounded-lg text-xs text-text-muted">
          <Eye className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          Estás viendo este panel en modo solo lectura. Investigadores y administradores SIG pueden cargar y actualizar los datos.
        </div>
      )}
      <div ref={rootRef} className={`pc-root${puedeEditar ? '' : ' pc-solo-lectura'}`} />
    </div>
  )
}
