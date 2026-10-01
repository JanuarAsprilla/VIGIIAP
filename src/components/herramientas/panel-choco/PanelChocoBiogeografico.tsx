import { useEffect, useRef } from 'react'
import { Eye } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { puedeEditarModulo } from '@/lib/permisosModulo'
import { iniciarPanelChoco } from './panelChoco.motor'
import marcado from './panelChoco.original.html?raw'
import './panelChoco.original.css'
import '../herramientaTema.css'
import './panelChoco.tema.css'

/** Panel del dashboard original, con su estructura y lógica intactas. Aquí solo se monta:
 * el marcado es un recurso estático propio (no proviene de usuarios) y el motor se
 * desmonta limpio (listeners y gráficas) al salir de la herramienta. */
export default function PanelChocoBiogeografico() {
  const { user } = useAuth()
  // Actualizar los datos afecta a toda la herramienta: solo el superadministrador y los
  // administradores con acceso de edición al módulo Herramientas (panel de administración).
  const puedeEditar = !!user && (user.rol === 'super_admin' || (user.rol === 'admin_sig' && puedeEditarModulo(user, 'herramientas')))
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
      <div ref={rootRef} className={`pc-root ht-root${puedeEditar ? '' : ' pc-solo-lectura'}`} />
      {!puedeEditar && (
        <div className="flex items-center gap-2 px-3 py-2 bg-bg-alt border border-border rounded-lg text-xs text-text-muted">
          <Eye className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          Estás viendo este panel en modo solo lectura. La carga y actualización de datos la realizan el superadministrador y los administradores con acceso al módulo Herramientas.
        </div>
      )}
    </div>
  )
}
