import { HUMEDAL_DATA } from '../data/humedales.generated'
import SeccionCategoriaPorDepto from './shared/SeccionCategoriaPorDepto'
import type { HumedalData } from '../types'

export default function Humedales() {
  const data = HUMEDAL_DATA as HumedalData

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted leading-relaxed">
        Extensión de humedales del Chocó Biogeográfico por tipo y departamento.
      </p>
      <SeccionCategoriaPorDepto deptos={data.deptos} series={data.tipos} />
    </div>
  )
}
