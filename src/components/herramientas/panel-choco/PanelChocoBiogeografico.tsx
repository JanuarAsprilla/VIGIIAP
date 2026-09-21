import { useState } from 'react'
import { Eye } from 'lucide-react'
import SidebarNavCapas from './components/SidebarNavCapas'
import { usePanelChocoPermisos } from './hooks/usePanelChocoPermisos'
import ResumenTerritorial from './sections/ResumenTerritorial'
import TitulacionColectiva from './sections/TitulacionColectiva'
import CuencasHidrograficas from './sections/CuencasHidrograficas'
import AreasRunap from './sections/AreasRunap'
import Humedales from './sections/Humedales'
import Paramos from './sections/Paramos'
import Cienagas from './sections/Cienagas'
import PoblacionEtnias from './sections/PoblacionEtnias'
import type { CapaId } from './types'

const SECCIONES: Record<CapaId, React.ComponentType> = {
  resumen: ResumenTerritorial,
  titulacion: TitulacionColectiva,
  cuencas: CuencasHidrograficas,
  runap: AreasRunap,
  humedales: Humedales,
  paramos: Paramos,
  cienagas: Cienagas,
  poblacion: PoblacionEtnias,
}

export default function PanelChocoBiogeografico() {
  const [capaActiva, setCapaActiva] = useState<CapaId>('resumen')
  const { puedeEditar } = usePanelChocoPermisos()
  const Seccion = SECCIONES[capaActiva]

  return (
    <div className="space-y-4">
      {!puedeEditar && (
        <div className="flex items-center gap-2 px-3 py-2 bg-bg-alt border border-border rounded-lg text-xs text-text-muted">
          <Eye className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          Estás viendo este panel en modo solo lectura. Investigadores y administradores SIG pueden cargar y actualizar los datos.
        </div>
      )}
      <div className="flex flex-col md:flex-row gap-6">
        <SidebarNavCapas capaActiva={capaActiva} onCambiarCapa={setCapaActiva} />
        <div className="flex-1 min-w-0">
          <Seccion />
        </div>
      </div>
    </div>
  )
}
