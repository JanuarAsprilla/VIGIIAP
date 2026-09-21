import { Bar } from 'react-chartjs-2'
import { POB_DATA, ETNIA_DATA } from '../data/poblacion.generated'
import { DEFAULT_LIMITES_DEPTOS } from '../data/limites.generated'
import { BASE_CHART_OPTIONS, BAR_SCALES_OPTIONS } from '../palette'
import GraficoTorta from '../components/GraficoTorta'
import SeccionEntidadSimple from './shared/SeccionEntidadSimple'
import SeccionCategoriaPorDepto from './shared/SeccionCategoriaPorDepto'
import type { DeptoPoblacion, PiramideGrupo, EtniaDepto, DeptoArea, EntidadArea } from '../types'
import type { CategoriaDeptoSerie } from '../types'

const CATEGORIAS_ETNIA: { key: keyof Omit<EtniaDepto, 'id' | 'name'>; nombre: string; color: string }[] = [
  { key: 'negro',      nombre: 'Negro/Afrocolombiano', color: '#284E39' },
  { key: 'indigena',   nombre: 'Indígena',              color: '#F7AC42' },
  { key: 'ninguno',    nombre: 'Ninguno',                color: '#B0CB1F' },
  { key: 'noinforma',  nombre: 'No informa',             color: '#E2E8F0' },
  { key: 'raizal',     nombre: 'Raizal',                 color: '#E51A4B' },
  { key: 'palenquero', nombre: 'Palenquero',             color: '#E95B8C' },
  { key: 'gitano',     nombre: 'Gitano/Rrom',            color: '#185FA5' },
]

// TODO(panel-choco): el original también permite drill-down de etnia por municipio
// (ETNIA_MUNIS) cuando se filtra a un departamento — no está cubierto en esta vista.
export default function PoblacionEtnias() {
  const deptosPob = POB_DATA.deptos as DeptoPoblacion[]
  const piramide = POB_DATA.piramide as PiramideGrupo[]
  const etnia = ETNIA_DATA as EtniaDepto[]
  const limites = DEFAULT_LIMITES_DEPTOS as DeptoArea[]

  const entidadesPoblacion: EntidadArea[] = deptosPob.map((d) => ({ id: d.id, name: d.name, area: d.total, pct: d.pct }))

  const totalHombres = deptosPob.reduce((acc, d) => acc + d.hombres, 0)
  const totalMujeres = deptosPob.reduce((acc, d) => acc + d.mujeres, 0)

  const densidadPorDepto = deptosPob
    .map((d) => {
      const areaHa = limites.find((l) => l.id === d.id)?.area ?? 0
      const areaKm2 = areaHa / 100
      return { name: d.name, densidad: areaKm2 > 0 ? d.total / areaKm2 : 0 }
    })
    .sort((a, b) => b.densidad - a.densidad)

  const seriesEtnia: CategoriaDeptoSerie[] = CATEGORIAS_ETNIA.map((cat) => ({
    nombre: cat.nombre,
    color: cat.color,
    datos: etnia.map((d) => d[cat.key]),
  }))

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-text-muted leading-relaxed mb-4">
          Población total: {deptosPob.reduce((acc, d) => acc + d.total, 0).toLocaleString('es-CO')} habitantes
          en el Chocó Biogeográfico.
        </p>
        <SeccionEntidadSimple entidades={entidadesPoblacion} etiquetaColumnaNombre="Departamento" etiquetaMetrica="Población" unidad="hab" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--card-bg)] border border-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-text mb-3">Distribución por género</h3>
          <GraficoTorta labels={['Hombres', 'Mujeres']} valores={[totalHombres, totalMujeres]} unidad="hab" />
        </div>
        <div className="bg-[var(--card-bg)] border border-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-text mb-3">Densidad por departamento (hab/km²)</h3>
          <div style={{ height: 250 }}>
            <Bar
              data={{
                labels: densidadPorDepto.map((d) => d.name),
                datasets: [{ data: densidadPorDepto.map((d) => d.densidad), backgroundColor: '#009846', borderRadius: 6 }],
              }}
              options={{ ...BASE_CHART_OPTIONS, scales: BAR_SCALES_OPTIONS, plugins: { ...BASE_CHART_OPTIONS.plugins, legend: { display: false } } }}
            />
          </div>
        </div>
      </div>

      <div className="bg-[var(--card-bg)] border border-border rounded-xl p-5">
        <h3 className="text-sm font-bold text-text mb-3">Pirámide poblacional por grupos de edad</h3>
        <div style={{ height: 320 }}>
          <Bar
            data={{
              labels: piramide.map((p) => p.grupo),
              datasets: [{ data: piramide.map((p) => p.total), backgroundColor: '#F7AC42', borderRadius: 4 }],
            }}
            options={{
              ...BASE_CHART_OPTIONS,
              indexAxis: 'y' as const,
              scales: BAR_SCALES_OPTIONS,
              plugins: { ...BASE_CHART_OPTIONS.plugins, legend: { display: false } },
            }}
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-text mb-3">Grupos étnicos por departamento</h3>
        <SeccionCategoriaPorDepto deptos={etnia.map((d) => d.name)} series={seriesEtnia} unidad="hab" etiquetaMetrica="Población" />
      </div>
    </div>
  )
}
