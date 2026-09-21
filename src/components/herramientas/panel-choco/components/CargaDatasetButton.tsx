import { useRef, type ChangeEvent } from 'react'
import { Upload } from 'lucide-react'
import { usePanelChocoPermisos } from '../hooks/usePanelChocoPermisos'
import { useCargaExcel } from '../hooks/useCargaExcel'
import type { FilaExcel } from '../types'

interface CargaDatasetButtonProps {
  etiqueta: string
  columnasRequeridas: readonly string[]
  onFilas: (filas: FilaExcel[]) => void
}

/** Controla su propia visibilidad por permisos — quien no puede editar nunca ve
 * ni siquiera el botón, no solo un botón deshabilitado (oculto, no disabled). */
export default function CargaDatasetButton({ etiqueta, columnasRequeridas, onFilas }: CargaDatasetButtonProps) {
  const { puedeEditar } = usePanelChocoPermisos()
  const { estado, error, cargarArchivo } = useCargaExcel(columnasRequeridas)
  const inputRef = useRef<HTMLInputElement>(null)

  if (!puedeEditar) return null

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const filas = await cargarArchivo(file)
    if (filas) onFilas(filas)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <label className="inline-flex items-center gap-2 px-3 py-2 bg-bg-alt border border-border rounded-lg text-xs font-semibold text-text cursor-pointer hover:border-primary-800 hover:text-primary-800 transition-colors">
        <Upload className="w-3.5 h-3.5" aria-hidden="true" />
        {estado === 'cargando' ? 'Leyendo…' : etiqueta}
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="sr-only"
          onChange={(e) => { void handleChange(e) }}
        />
      </label>
      {error && <span className="text-xs text-red-600">{error}</span>}
      {estado === 'listo' && <span className="text-xs text-primary-700 font-medium">✓ Datos actualizados</span>}
    </div>
  )
}
