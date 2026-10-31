import { cambiosConjunto, cambiosEntidad, type CambiosUrl, type Filtros } from '../lib/filtros'
import type { Grupo, ParamsApi } from '../types'
import ComboOpciones from './ComboOpciones'

interface Props {
  grupo: Grupo
  filtros: Filtros
  params: ParamsApi
  onCambio: (cambios: CambiosUrl) => void
}

export default function SeccionFuente({ grupo, filtros, params, onCambio }: Props) {
  return (
    <div className="grid gap-3">
      <ComboOpciones
        grupo={grupo} campo="entidad" etiqueta="Entidad publicadora" params={params} seleccion={filtros.nombreEntidad ?? filtros.entidad}
        onElegir={(v, n) => onCambio(cambiosEntidad(v, n))} onLimpiar={() => onCambio(cambiosEntidad(null, null))}
      />
      <ComboOpciones
        grupo={grupo} campo="conjunto" etiqueta="Conjunto de datos" params={params} seleccion={filtros.nombreConjunto ?? filtros.conjunto}
        onElegir={(v, n) => onCambio(cambiosConjunto(v, n))} onLimpiar={() => onCambio(cambiosConjunto(null, null))}
      />
    </div>
  )
}
