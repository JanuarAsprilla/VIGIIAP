import { Cargando } from './EstadoConsulta'
import type { Indicadores as TIndicadores } from './lib/derivar'
import { fmtNum, fmtPct } from './lib/format'

interface Item {
  etiqueta: string
  valor: string
  nota: string
}

function items(i: TIndicadores): Item[] {
  return [
    { etiqueta: 'Registros totales', valor: fmtNum(i.registros), nota: 'en el Chocó biogeográfico' },
    { etiqueta: 'Municipios con registros', valor: fmtNum(i.municipiosConRegistros), nota: `de ${fmtNum(i.totalMunicipios)} municipios` },
    { etiqueta: 'Departamentos cubiertos', valor: fmtNum(i.departamentos), nota: 'con al menos un registro' },
    { etiqueta: 'Sin especie determinada', valor: fmtPct(i.sinEspecie, i.registros), nota: `${fmtNum(i.sinEspecie)} registros sin nombre de especie` },
  ]
}

export default function Indicadores({ datos, cargando }: { datos: TIndicadores | null; cargando: boolean }) {
  if (cargando || !datos) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bio-panel overflow-hidden" aria-busy="true">
        {[0, 1, 2, 3].map((k) => <Cargando key={k} etiqueta="Cargando indicadores" className="h-24 rounded-none" />)}
      </div>
    )
  }
  return (
    <dl className="grid grid-cols-2 lg:grid-cols-4 bio-panel overflow-hidden bio-entra">
      {items(datos).map((it, k) => (
        <div
          key={it.etiqueta}
          className={`p-4 sm:p-5 border-border ${k % 2 === 1 ? 'border-l' : ''} ${k >= 2 ? 'border-t lg:border-t-0' : ''} ${k > 0 ? 'lg:border-l' : ''}`}
        >
          <dt className="bio-eyebrow">{it.etiqueta}</dt>
          <dd className="mt-2">
            <span className="bio-cifra text-[clamp(1.5rem,3vw,2.25rem)] block">{it.valor}</span>
            <span className="block text-xs text-text-muted mt-1.5">{it.nota}</span>
          </dd>
        </div>
      ))}
    </dl>
  )
}
