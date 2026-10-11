import { Loader2, AlertCircle } from 'lucide-react'

/** Cargando / error / vacío de una tarjeta de analítica; no pinta nada si hay datos. */
export default function EstadoCarga({ isLoading, isError, vacio }: { isLoading: boolean; isError: boolean; vacio: boolean }) {
  if (isLoading) return <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary-700" /></div>
  if (isError) return <div className="py-8 flex flex-col items-center gap-1"><AlertCircle className="w-5 h-5 text-red-400" /><p className="text-xs text-red-500">No se pudo cargar</p></div>
  if (vacio) return <p className="py-8 text-center text-xs text-text-muted">Sin datos en el período seleccionado</p>
  return null
}
