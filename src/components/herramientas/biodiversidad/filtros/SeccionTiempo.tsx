import { useMemo } from 'react'
import { traducirEvidencia } from '../lib/evidencia'
import type { CambiosUrl, Filtros } from '../lib/filtros'
import type { Grupo, ParamsApi } from '../types'
import ComboOpciones from './ComboOpciones'

interface Props {
  grupo: Grupo
  filtros: Filtros
  params: ParamsApi
  desde: number
  hasta: number
  onCambio: (cambios: CambiosUrl) => void
}

export default function SeccionTiempo({ grupo, filtros, params, desde, hasta, onCambio }: Props) {
  const anios = useMemo(() => Array.from({ length: Math.max(0, hasta - desde + 1) }, (_, i) => desde + i), [desde, hasta])
  const tope = filtros.anioHasta ?? hasta
  const piso = filtros.anioDesde ?? desde
  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-3" role="group" aria-label="Rango de años">
        <label className="flex flex-col gap-1 min-w-0">
          <span className="bio-eyebrow">Desde</span>
          <select className="bio-campo" value={filtros.anioDesde ?? ''} onChange={(e) => onCambio({ anio_desde: e.target.value || null })}>
            <option value="">{desde}</option>
            {anios.filter((a) => a <= tope).map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 min-w-0">
          <span className="bio-eyebrow">Hasta</span>
          <select className="bio-campo" value={filtros.anioHasta ?? ''} onChange={(e) => onCambio({ anio_hasta: e.target.value || null })}>
            <option value="">{hasta}</option>
            {anios.filter((a) => a >= piso).map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
      </div>
      <ComboOpciones
        grupo={grupo} campo="tipo_evidencia" etiqueta="Tipo de evidencia" params={params}
        seleccion={filtros.evidencia ? traducirEvidencia(filtros.evidencia) : null}
        etiquetar={(o) => traducirEvidencia(o.valor)}
        onElegir={(v) => onCambio({ evidencia: v })} onLimpiar={() => onCambio({ evidencia: null })}
      />
    </div>
  )
}
