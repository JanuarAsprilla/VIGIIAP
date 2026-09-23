import { useRef } from 'react'
import { Upload, MapPinPlus, Ruler, Move, Download, Loader2 } from 'lucide-react'

interface BarraAccionesProps {
  onArchivoSeleccionado: (file: File) => void
  cargando: boolean
  modoAgregar: boolean
  modoMedir: boolean
  modoMover: boolean
  onToggleAgregar: () => void
  onToggleMedir: () => void
  onToggleMover: () => void
  onExportar: () => void
  exportando: boolean
  puedeExportar: boolean
  estadoDatos: string
}

function ModoBoton({ activo, onClick, icon: Icon, iconColor, children }: {
  activo: boolean; onClick: () => void; icon: typeof MapPinPlus; iconColor: string; children: string
}) {
  return (
    <button type="button" onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
        activo ? 'bg-primary-800 text-white border-primary-800' : 'bg-[var(--card-bg)] text-text border-border hover:border-primary-800'
      }`}>
      <Icon className="w-3.5 h-3.5" style={{ color: activo ? 'white' : iconColor }} aria-hidden="true" />
      {children}
    </button>
  )
}

/** Barra de acciones -- cargar Excel, modos de interacción con el mapa,
 *  exportar. Los tres modos (agregar/medir/mover) son mutuamente
 *  excluyentes, igual que en la herramienta original. */
export default function BarraAcciones({
  onArchivoSeleccionado, cargando, modoAgregar, modoMedir, modoMover,
  onToggleAgregar, onToggleMedir, onToggleMover, onExportar, exportando, puedeExportar, estadoDatos,
}: BarraAccionesProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button type="button" onClick={() => inputRef.current?.click()} disabled={cargando}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-primary-800 text-white hover:bg-primary-700 disabled:opacity-60 transition-colors">
        {cargando ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Upload className="w-3.5 h-3.5" aria-hidden="true" />}
        Cargar Excel
      </button>
      <input ref={inputRef} type="file" accept=".xlsx,.xls" className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onArchivoSeleccionado(f); e.target.value = '' }} />

      <ModoBoton activo={modoAgregar} onClick={onToggleAgregar} icon={MapPinPlus} iconColor="#185FA5">
        {modoAgregar ? 'Agregar puntos con clic: ON' : 'Agregar puntos con clic: OFF'}
      </ModoBoton>
      <ModoBoton activo={modoMedir} onClick={onToggleMedir} icon={Ruler} iconColor="#0F6E56">
        {modoMedir ? 'Medir distancia: ON' : 'Medir distancia: OFF'}
      </ModoBoton>
      <ModoBoton activo={modoMover} onClick={onToggleMover} icon={Move} iconColor="#854F0B">
        {modoMover ? 'Mover puntos: ON' : 'Mover puntos: OFF'}
      </ModoBoton>

      <button type="button" onClick={onExportar} disabled={!puedeExportar || exportando}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-border text-text hover:border-primary-800 disabled:opacity-40 transition-colors">
        {exportando ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-700" aria-hidden="true" /> : <Download className="w-3.5 h-3.5 text-primary-700" aria-hidden="true" />}
        Descargar Excel de resultados
      </button>

      {estadoDatos && <span className="text-xs text-text-muted">{estadoDatos}</span>}
    </div>
  )
}
