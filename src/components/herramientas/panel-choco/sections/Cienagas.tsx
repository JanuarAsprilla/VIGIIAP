import { useMemo } from 'react'
import { CIENAGAS_DATA } from '../data/cienagas.generated'
import { DEPTO_IDS } from '../data/limites.generated'
import SeccionEntidadSimple from './shared/SeccionEntidadSimple'
import type { CienagasPorDeptoMunicipio, EntidadArea } from '../types'

const NOMBRE_POR_ID: Record<string, string> = Object.fromEntries(
  Object.entries(DEPTO_IDS as Record<string, string>).map(([nombre, id]) => [id, nombre]),
)

function agregarPorDepto(data: CienagasPorDeptoMunicipio): EntidadArea[] {
  const entidades = Object.entries(data).map(([deptoId, municipios]) => {
    const area = Object.values(municipios).flat().reduce((acc, c) => acc + c.a, 0)
    return { id: deptoId, name: NOMBRE_POR_ID[deptoId] ?? deptoId, area }
  })
  const total = entidades.reduce((acc, e) => acc + e.area, 0)
  return entidades.map((e) => ({ ...e, pct: total > 0 ? (e.area / total) * 100 : 0 }))
}

export default function Cienagas() {
  const entidades = useMemo(() => agregarPorDepto(CIENAGAS_DATA as CienagasPorDeptoMunicipio), [])

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted leading-relaxed">
        Ciénagas del Chocó Biogeográfico agregadas por departamento.
      </p>
      <SeccionEntidadSimple entidades={entidades} etiquetaColumnaNombre="Departamento" />
    </div>
  )
}
