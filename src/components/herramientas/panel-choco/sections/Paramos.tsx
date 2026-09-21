import { PARAMOS_DATA, PARAMOS_COLORS } from '../data/paramos.generated'
import SeccionCategoriaPorDepto from './shared/SeccionCategoriaPorDepto'
import type { ParamosData } from '../types'

// TODO(panel-choco): el original expone PARAMOS_DETAIL (complejos de páramo individuales
// por depto/municipio) — esta vista se queda en el nivel depto x complejo agregado.
export default function Paramos() {
  const data = PARAMOS_DATA as ParamosData
  const series = data.paramos.map((c, i) => ({ ...c, color: PARAMOS_COLORS[i % PARAMOS_COLORS.length] }))

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted leading-relaxed">
        Complejos de páramo presentes en el Chocó Biogeográfico, por departamento.
      </p>
      <SeccionCategoriaPorDepto deptos={data.deptos} series={series} />
    </div>
  )
}
