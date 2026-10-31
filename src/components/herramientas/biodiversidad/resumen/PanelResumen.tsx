import { useBiodiversidadResumen, useBiodiversidadSeries } from '@/hooks/useBiodiversidad'
import { Cargando, PanelError } from '../EstadoConsulta'
import { fmtNum, fmtPct } from '../lib/format'
import type { Amenaza, EspecieResumen, Grupo, ParamsApi, RespuestaResumen, TipoConservacion } from '../types'
import BarrasEvidencia from './BarrasEvidencia'
import GraficoAnios from './GraficoAnios'
import EspeciesDestacadas from './EspeciesDestacadas'
import PanelConservacion from './PanelConservacion'

interface Props {
  grupo: Grupo
  paramsResumen: ParamsApi
  paramsSeries: ParamsApi
  paramsEspecies: ParamsApi
  nombreAlcance: string | null
  esIndividual: boolean
  /** Texto que explica qué filtros no alcanzan a las series (inventarios agregados). */
  notaSeries: string | null
  onFiltrarEspecies: (f: { conservacion: TipoConservacion; amenaza: Amenaza | null }) => void
  onVerRegistros: (e: EspecieResumen) => void
}

function Kpis({ r }: { r: RespuestaResumen }) {
  const items = [
    { etiqueta: 'Registros', valor: fmtNum(r.registros), nota: 'ocurrencias publicadas' },
    { etiqueta: 'Especies', valor: r.especies !== null ? fmtNum(r.especies) : '—', nota: r.especies !== null ? 'distintas documentadas' : 'no se calcula con el filtro de fuente' },
    r.con_foto !== null
      ? { etiqueta: 'Con fotografía', valor: fmtNum(r.con_foto), nota: `${fmtPct(r.con_foto, r.registros)} de los registros` }
      : { etiqueta: 'Con fotografía', valor: '—', nota: 'el inventario agregado no las incluye' },
    r.con_ubicacion !== null
      ? { etiqueta: 'Con ubicación visible', valor: fmtNum(r.con_ubicacion), nota: `${fmtPct(r.con_ubicacion, r.registros)}; el resto se reserva o no la tiene` }
      : { etiqueta: 'Con ubicación visible', valor: '—', nota: 'el inventario agregado no tiene coordenadas' },
    { etiqueta: 'Periodo', valor: r.anio_min !== null && r.anio_max !== null ? `${r.anio_min}–${r.anio_max}` : '—', nota: r.anio_min !== null ? 'años con registros' : 'no disponible con este filtro' },
    r.entidades !== null && r.conjuntos !== null
      ? { etiqueta: 'Fuentes', valor: fmtNum(r.entidades), nota: `entidades publicadoras · ${fmtNum(r.conjuntos)} ${r.conjuntos === 1 ? 'conjunto' : 'conjuntos'} de datos` }
      : { etiqueta: 'Fuentes', valor: '—', nota: 'no disponible con este filtro' },
  ]
  return (
    <dl className="bio-kpis bio-kpis-6">
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

export default function PanelResumen({ grupo, paramsResumen, paramsSeries, paramsEspecies, nombreAlcance, esIndividual, notaSeries, onFiltrarEspecies, onVerRegistros }: Props) {
  const resumen = useBiodiversidadResumen(grupo, paramsResumen)
  const series = useBiodiversidadSeries(grupo, paramsSeries)
  if (resumen.isError && !resumen.data) return <PanelError error={resumen.error} onReintentar={() => void resumen.refetch()} />
  return (
    <div className="space-y-5">
      <p className="text-sm text-text-muted">
        {nombreAlcance ? <>Cifras de <b className="text-text">{nombreAlcance}</b>.</> : 'Cifras de todo el Chocó biogeográfico.'}
        {' '}Cambian con los filtros activos y con el municipio que elijas en el mapa.
      </p>
      {!resumen.data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bio-panel overflow-hidden" aria-busy="true">
          {[0, 1, 2, 3].map((k) => <Cargando key={k} etiqueta="Cargando indicadores" className="h-24 rounded-none" />)}
        </div>
      ) : (
        <div className={`space-y-5 ${resumen.isFetching ? 'bio-cargando' : 'bio-entra'}`} aria-busy={resumen.isFetching}>
          <Kpis r={resumen.data} />
          <EspeciesDestacadas grupo={grupo} params={paramsEspecies} activo={esIndividual && (resumen.data.amenazadas.total ?? 0) > 0} onVer={onVerRegistros} />
          <div className="grid gap-5 xl:grid-cols-2 [&>*]:min-w-0">
            <PanelConservacion resumen={resumen.data} grupo={grupo} puedeVerEspecies onFiltrar={onFiltrarEspecies} />
            <section className="bio-panel p-4 sm:p-5 space-y-5" aria-labelledby="bio-series-titulo">
              <div>
                <h3 id="bio-series-titulo" className="section-title">Registros por año</h3>
                <p className="text-xs text-text-muted mt-0.5">Refleja el esfuerzo de muestreo de cada año, no la abundancia.</p>
                {notaSeries && <p className="text-xs text-text-muted mt-1">{notaSeries}</p>}
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
