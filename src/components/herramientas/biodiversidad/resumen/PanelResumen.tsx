import { useBiodiversidadResumen, useBiodiversidadSeries } from '@/hooks/useBiodiversidad'
import { Cargando, PanelError } from '../EstadoConsulta'
import { fmtNum, fmtPct } from '../lib/format'
import type { Amenaza, AlcanceTerritorial, Grupo, RespuestaResumen, TipoConservacion } from '../types'
import BarrasEvidencia from './BarrasEvidencia'
import GraficoAnios from './GraficoAnios'
import PanelConservacion from './PanelConservacion'

interface Props {
  grupo: Grupo
  alcance: AlcanceTerritorial
  nombreAlcance: string | null
  esIndividual: boolean
  onFiltrarEspecies: (f: { conservacion: TipoConservacion; amenaza: Amenaza | null }) => void
}

function Kpis({ r }: { r: RespuestaResumen }) {
  const items = [
    { etiqueta: 'Registros', valor: fmtNum(r.registros), nota: 'ocurrencias publicadas' },
    { etiqueta: 'Especies', valor: fmtNum(r.especies), nota: 'distintas documentadas' },
    r.con_foto !== null
      ? { etiqueta: 'Con fotografía', valor: fmtNum(r.con_foto), nota: `${fmtPct(r.con_foto, r.registros)} de los registros` }
      : { etiqueta: 'Con fotografía', valor: '—', nota: 'el inventario agregado no las incluye' },
    { etiqueta: 'Periodo', valor: r.anio_min !== null && r.anio_max !== null ? `${r.anio_min}–${r.anio_max}` : '—', nota: 'años con registros' },
  ]
  return (
    <dl className="bio-kpis">
      {items.map((it) => (
        <div key={it.etiqueta} className="bio-kpi">
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

export default function PanelResumen({ grupo, alcance, nombreAlcance, esIndividual, onFiltrarEspecies }: Props) {
  const resumen = useBiodiversidadResumen(grupo, alcance)
  const series = useBiodiversidadSeries(grupo, alcance)
  if (resumen.isError && !resumen.data) return <PanelError error={resumen.error} onReintentar={() => void resumen.refetch()} />
  return (
    <div className="space-y-5">
      <p className="text-sm text-text-muted">
        {nombreAlcance ? <>Cifras de <b className="text-text">{nombreAlcance}</b>.</> : 'Cifras de todo el Chocó biogeográfico.'}
        {' '}Elige un municipio en el mapa para acotarlas.
      </p>
      {!resumen.data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bio-panel overflow-hidden" aria-busy="true">
          {[0, 1, 2, 3].map((k) => <Cargando key={k} etiqueta="Cargando indicadores" className="h-24 rounded-none" />)}
        </div>
      ) : (
        <div className={`space-y-5 ${resumen.isFetching ? 'bio-cargando' : 'bio-entra'}`} aria-busy={resumen.isFetching}>
          <Kpis r={resumen.data} />
          <div className="grid gap-5 xl:grid-cols-2 [&>*]:min-w-0">
            <PanelConservacion resumen={resumen.data} grupo={grupo} puedeVerEspecies onFiltrar={onFiltrarEspecies} />
            <section className="bio-panel p-4 sm:p-5 space-y-5" aria-labelledby="bio-series-titulo">
              <div>
                <h3 id="bio-series-titulo" className="section-title">Registros por año</h3>
                <p className="text-xs text-text-muted mt-0.5">Refleja el esfuerzo de muestreo de cada año, no la abundancia.</p>
              </div>
              {series.isError && !series.data ? (
                <PanelError error={series.error} onReintentar={() => void series.refetch()} compacto />
              ) : !series.data ? <Cargando etiqueta="Cargando gráfico" className="h-48" /> : (
                <>
                  <GraficoAnios datos={series.data.por_anio} />
                  <div>
                    <h4 className="bio-eyebrow mb-3">{esIndividual ? 'Tipo de evidencia' : 'Tipo de evidencia (inventario)'}</h4>
                    <BarrasEvidencia datos={series.data.por_evidencia} />
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  )
}
