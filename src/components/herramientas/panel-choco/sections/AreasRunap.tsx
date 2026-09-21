import { RUNAP_DATA, RUNAP_COLORS } from '../data/runap.generated'
import SeccionCategoriaPorDepto from './shared/SeccionCategoriaPorDepto'
import type { RunapData } from '../types'

// TODO(panel-choco): el original abre un detalle por categoría (RUNAP_DETALLE/RUNAP_DETAIL,
// áreas protegidas individuales por depto/municipio) — esta vista se queda en el nivel
// depto x categoría, que es lo que cubre la sección de gráficas del original.
export default function AreasRunap() {
  const data = RUNAP_DATA as RunapData
  const series = data.categorias.map((c, i) => ({ ...c, color: RUNAP_COLORS[i % RUNAP_COLORS.length] }))

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted leading-relaxed">
        Áreas del Sistema Nacional de Áreas Protegidas (RUNAP) presentes en el Chocó Biogeográfico, por categoría de manejo.
      </p>
      <SeccionCategoriaPorDepto deptos={data.deptos} series={series} />
    </div>
  )
}
