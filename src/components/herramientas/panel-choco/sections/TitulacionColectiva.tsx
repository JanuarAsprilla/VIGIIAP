import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { DEFAULT_TIT_DEPTOS, DEFAULT_TIT_MUNIS, C_CC, C_RI, C_ST } from '../data/titulacion.generated'
import { useDatasetVersionado } from '../hooks/useDatasetVersionado'
import { recalcularTitulacion } from '../lib/recalcularTitulacion'
import CargaDatasetButton from '../components/CargaDatasetButton'
import GraficoBarrasApiladas from '../components/GraficoBarrasApiladas'
import GraficoTorta from '../components/GraficoTorta'
import FiltroDeptoMunicipio from '../components/FiltroDeptoMunicipio'
import TablaDatos, { type ColumnaTabla } from '../components/TablaDatos'
import type { DeptoTitulacion, MunicipioTitulacion, FilaExcel } from '../types'

const COLUMNAS_REQUERIDAS = ['DeptoNom', 'MpNombre', 'Area_ha'] as const

interface TitulacionDataset {
  deptos: DeptoTitulacion[]
  munis: Record<string, MunicipioTitulacion[]>
}

const DATASET_POR_DEFECTO: TitulacionDataset = {
  deptos: DEFAULT_TIT_DEPTOS as DeptoTitulacion[],
  munis: DEFAULT_TIT_MUNIS as Record<string, MunicipioTitulacion[]>,
}

const columnasDepto: ColumnaTabla<DeptoTitulacion>[] = [
  { key: 'name', label: 'Departamento', render: (f) => f.name },
  { key: 'cc', label: 'Cons. Comunitarios (Ha)', align: 'right', render: (f) => f.cc.toLocaleString('es-CO', { maximumFractionDigits: 1 }), valorOrden: (f) => f.cc },
  { key: 'ri', label: 'Resguardos Ind. (Ha)', align: 'right', render: (f) => f.ri.toLocaleString('es-CO', { maximumFractionDigits: 1 }), valorOrden: (f) => f.ri },
  { key: 'st', label: 'Sin titular (Ha)', align: 'right', render: (f) => f.st.toLocaleString('es-CO', { maximumFractionDigits: 1 }), valorOrden: (f) => f.st },
  { key: 'num_cc', label: '# CC', align: 'right', render: (f) => String(f.num_cc), valorOrden: (f) => f.num_cc },
  { key: 'num_ri', label: '# RI', align: 'right', render: (f) => String(f.num_ri), valorOrden: (f) => f.num_ri },
]

const columnasMunicipio: ColumnaTabla<MunicipioTitulacion>[] = [
  { key: 'name', label: 'Municipio', render: (f) => f.name },
  { key: 'cc', label: 'CC (Ha)', align: 'right', render: (f) => f.cc.toLocaleString('es-CO', { maximumFractionDigits: 1 }), valorOrden: (f) => f.cc },
  { key: 'ri', label: 'RI (Ha)', align: 'right', render: (f) => f.ri.toLocaleString('es-CO', { maximumFractionDigits: 1 }), valorOrden: (f) => f.ri },
  { key: 'st', label: 'Sin titular (Ha)', align: 'right', render: (f) => f.st.toLocaleString('es-CO', { maximumFractionDigits: 1 }), valorOrden: (f) => f.st },
]

// TODO(panel-choco): el original permite explorar el detalle de cada consejo comunitario
// o resguardo por nombre (cc_nombres/ri_nombres) — ya se recalculan y guardan, pero esta
// vista todavía no los expone en un desglose propio.
export default function TitulacionColectiva() {
  const { valor: titulacion, actualizar, esPersonalizado, restaurarDefault } = useDatasetVersionado('titulacion', DATASET_POR_DEFECTO)
  const [filasCC, setFilasCC] = useState<FilaExcel[] | null>(null)
  const [filasRI, setFilasRI] = useState<FilaExcel[] | null>(null)
  const [deptoSel, setDeptoSel] = useState('todos')
  const [muniSel, setMuniSel] = useState('todos')

  const intentarRecalcular = (cc: FilaExcel[] | null, ri: FilaExcel[] | null) => {
    if (cc && ri) actualizar(recalcularTitulacion(cc, ri))
  }

  const municipiosDelDepto = titulacion.munis[deptoSel] ?? []
  const municipiosVisibles = muniSel === 'todos'
    ? municipiosDelDepto
    : municipiosDelDepto.filter((m) => m.name === muniSel)

  const totalCC = titulacion.deptos.reduce((acc, d) => acc + d.cc, 0)
  const totalRI = titulacion.deptos.reduce((acc, d) => acc + d.ri, 0)
  const totalST = titulacion.deptos.reduce((acc, d) => acc + d.st, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-muted leading-relaxed max-w-2xl">
          Área titulada mediante Consejos Comunitarios (afrodescendientes) y Resguardos Indígenas frente al
          territorio sin titular, por departamento.
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {esPersonalizado && (
            <button
              onClick={restaurarDefault}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-text-muted hover:text-text transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Restaurar datos originales
            </button>
          )}
          <CargaDatasetButton
            etiqueta="Cargar Cons. Comunitarios"
            columnasRequeridas={COLUMNAS_REQUERIDAS}
            onFilas={(filas) => { setFilasCC(filas); intentarRecalcular(filas, filasRI) }}
          />
          <CargaDatasetButton
            etiqueta="Cargar Resguardos Ind."
            columnasRequeridas={COLUMNAS_REQUERIDAS}
            onFilas={(filas) => { setFilasRI(filas); intentarRecalcular(filasCC, filas) }}
          />
        </div>
      </div>

      {(filasCC && !filasRI) || (!filasCC && filasRI) ? (
        <p className="text-xs text-gold-500 bg-gold-300/10 border border-gold-300/40 rounded-lg px-3 py-2">
          Sube ambos archivos (Consejos Comunitarios y Resguardos Indígenas) para recalcular — con solo uno cargado se mantienen los datos anteriores.
        </p>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--card-bg)] border border-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-text mb-3">Área titulada por departamento</h3>
          <GraficoBarrasApiladas
            labels={titulacion.deptos.map((d) => d.name)}
            series={[
              { label: 'Consejos Comunitarios', datos: titulacion.deptos.map((d) => d.cc), color: C_CC as string },
              { label: 'Resguardos Indígenas', datos: titulacion.deptos.map((d) => d.ri), color: C_RI as string },
              { label: 'Sin titular', datos: titulacion.deptos.map((d) => d.st), color: C_ST as string },
            ]}
          />
        </div>
        <div className="bg-[var(--card-bg)] border border-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-text mb-3">Porcentaje de área titulada por departamento</h3>
          <GraficoTorta labels={titulacion.deptos.map((d) => d.name)} valores={titulacion.deptos.map((d) => d.pct)} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Consejos Comunitarios', valor: totalCC, color: C_CC as string },
          { label: 'Resguardos Indígenas', valor: totalRI, color: C_RI as string },
          { label: 'Sin titular', valor: totalST, color: C_ST as string },
        ].map((s) => (
          <div key={s.label} className="bg-[var(--card-bg)] border border-border rounded-xl p-4 border-t-2" style={{ borderTopColor: s.color }}>
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1">{s.label}</p>
            <p className="text-lg font-mono font-bold text-text">{s.valor.toLocaleString('es-CO', { maximumFractionDigits: 0 })} Ha</p>
          </div>
        ))}
      </div>

      <TablaDatos columnas={columnasDepto} filas={titulacion.deptos} claveFila={(f) => f.id} />

      <div className="space-y-3">
        <FiltroDeptoMunicipio
          departamentos={titulacion.deptos}
          municipios={municipiosDelDepto.map((m) => m.name)}
          deptoSeleccionado={deptoSel}
          municipioSeleccionado={muniSel}
          onDeptoChange={(id) => { setDeptoSel(id); setMuniSel('todos') }}
          onMunicipioChange={setMuniSel}
        />
        {deptoSel !== 'todos' && (
          <TablaDatos columnas={columnasMunicipio} filas={municipiosVisibles} claveFila={(f) => f.name} />
        )}
      </div>
    </div>
  )
}
