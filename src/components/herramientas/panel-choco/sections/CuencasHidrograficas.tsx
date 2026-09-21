import { CUENCA_DATA } from '../data/cuencas.generated'
import SeccionEntidadSimple from './shared/SeccionEntidadSimple'
import type { CuencaArea } from '../types'

// TODO(panel-choco): el original permite hacer drill-down a subcuencas (SZH_DATA) por
// cuenca seleccionada — esta vista solo cubre el nivel de cuenca principal.
export default function CuencasHidrograficas() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted leading-relaxed">
        Distribución del territorio del Chocó Biogeográfico por cuenca hidrográfica principal.
      </p>
      <SeccionEntidadSimple
        entidades={CUENCA_DATA as CuencaArea[]}
        etiquetaColumnaNombre="Cuenca"
      />
    </div>
  )
}
