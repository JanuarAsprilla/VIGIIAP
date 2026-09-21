import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { DEFAULT_LIMITES_DEPTOS, DEFAULT_LIMITES_MUNIS } from '../data/limites.generated'
import { useDatasetVersionado } from '../hooks/useDatasetVersionado'
import { recalcularLimites } from '../lib/recalcularLimites'
import CargaDatasetButton from '../components/CargaDatasetButton'
import FiltroDeptoMunicipio from '../components/FiltroDeptoMunicipio'
import TablaDatos, { type ColumnaTabla } from '../components/TablaDatos'
import SeccionEntidadSimple from './shared/SeccionEntidadSimple'
import type { DeptoArea, MunicipioArea } from '../types'

const COLUMNAS_REQUERIDAS_LIMITES = ['DeptoNom', 'MpNombre', 'AreaHa'] as const

interface LimitesDataset {
  deptos: DeptoArea[]
  munis: Record<string, MunicipioArea[]>
}

const DATASET_POR_DEFECTO: LimitesDataset = {
  deptos: DEFAULT_LIMITES_DEPTOS as DeptoArea[],
  munis: DEFAULT_LIMITES_MUNIS as Record<string, MunicipioArea[]>,
}

const columnasMunicipio: ColumnaTabla<MunicipioArea>[] = [
  { key: 'name', label: 'Municipio', render: (f) => f.name },
  {
    key: 'area', label: 'Área (Ha)', align: 'right',
    render: (f) => f.area.toLocaleString('es-CO', { maximumFractionDigits: 1 }),
    valorOrden: (f) => f.area,
  },
]

export default function ResumenTerritorial() {
  const { valor: limites, actualizar, esPersonalizado, restaurarDefault } = useDatasetVersionado('limites', DATASET_POR_DEFECTO)
  const [deptoSel, setDeptoSel] = useState('todos')
  const [muniSel, setMuniSel] = useState('todos')

  const municipiosDelDepto = limites.munis[deptoSel] ?? []
  const municipiosVisibles = muniSel === 'todos'
    ? municipiosDelDepto
    : municipiosDelDepto.filter((m) => m.name === muniSel)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-muted leading-relaxed max-w-2xl">
          Distribución del territorio del Chocó Biogeográfico por departamento — {limites.deptos.length} departamentos,{' '}
          {limites.deptos.reduce((acc, d) => acc + d.municipios, 0)} municipios.
        </p>
        <div className="flex items-center gap-2">
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
            etiqueta="Cargar límites (Excel)"
            columnasRequeridas={COLUMNAS_REQUERIDAS_LIMITES}
            onFilas={(filas) => actualizar(recalcularLimites(filas))}
          />
        </div>
      </div>

      <SeccionEntidadSimple entidades={limites.deptos} etiquetaColumnaNombre="Departamento" />

      <div className="space-y-3">
        <FiltroDeptoMunicipio
          departamentos={limites.deptos}
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
