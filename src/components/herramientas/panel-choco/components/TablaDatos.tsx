import { useMemo, useState } from 'react'
import { ArrowUpDown } from 'lucide-react'

export interface ColumnaTabla<T> {
  key: string
  label: string
  align?: 'left' | 'right'
  render: (fila: T) => string
  valorOrden?: (fila: T) => number | string
}

interface TablaDatosProps<T> {
  columnas: ColumnaTabla<T>[]
  filas: T[]
  claveFila: (fila: T) => string
}

export default function TablaDatos<T>({ columnas, filas, claveFila }: TablaDatosProps<T>) {
  const [orden, setOrden] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null)

  const filasOrdenadas = useMemo(() => {
    if (!orden) return filas
    const columna = columnas.find((c) => c.key === orden.key)
    if (!columna?.valorOrden) return filas
    const signo = orden.dir === 'asc' ? 1 : -1
    return [...filas].sort((a, b) => {
      const va = columna.valorOrden!(a)
      const vb = columna.valorOrden!(b)
      return va < vb ? -1 * signo : va > vb ? 1 * signo : 0
    })
  }, [filas, orden, columnas])

  const alternarOrden = (key: string) => {
    setOrden((prev) => prev?.key === key
      ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      : { key, dir: 'desc' })
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-bg-alt border-b border-border">
            {columnas.map((c) => (
              <th
                key={c.key}
                className={`px-4 py-2.5 text-[0.65rem] font-bold uppercase tracking-wider text-text-muted ${c.align === 'right' ? 'text-right' : 'text-left'}`}
              >
                {c.valorOrden ? (
                  <button
                    onClick={() => alternarOrden(c.key)}
                    className={`inline-flex items-center gap-1 hover:text-text transition-colors ${c.align === 'right' ? 'flex-row-reverse' : ''}`}
                  >
                    {c.label}
                    <ArrowUpDown className="w-3 h-3 opacity-50" aria-hidden="true" />
                  </button>
                ) : c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filasOrdenadas.map((fila) => (
            <tr key={claveFila(fila)} className="border-b border-border/60 last:border-0 hover:bg-bg-alt/50 transition-colors">
              {columnas.map((c) => (
                <td key={c.key} className={`px-4 py-2 text-text ${c.align === 'right' ? 'text-right font-mono' : ''}`}>
                  {c.render(fila)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
