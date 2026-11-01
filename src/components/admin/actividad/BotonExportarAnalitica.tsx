import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { exportarAnaliticaExcel, type RangoExportacion } from '@/lib/exportarAnaliticaExcel'

/** Descarga a Excel todo lo que muestra la pestaña Analítica para el rango elegido. */
export default function BotonExportarAnalitica({ rango }: { rango: RangoExportacion }) {
  const [exportando, setExportando] = useState(false)
  const [fallo, setFallo] = useState(false)

  const exportar = async () => {
    setExportando(true)
    setFallo(false)
    try {
      await exportarAnaliticaExcel(rango)
    } catch {
      setFallo(true)
    } finally {
      setExportando(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={exportar}
        disabled={exportando}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-primary-800/10 border border-primary-800/20 text-primary-600 hover:bg-primary-800/15 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {exportando ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Download className="w-4 h-4" aria-hidden="true" />}
        {exportando ? 'Exportando…' : 'Exportar a Excel'}
      </button>
      {fallo && <p role="alert" className="text-xs text-red-500">No se pudo exportar. Intenta de nuevo.</p>}
    </div>
  )
}
