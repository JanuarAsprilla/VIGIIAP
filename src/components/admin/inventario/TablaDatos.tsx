import type { ReactNode } from 'react'

export interface ColumnaTabla<T> {
  clave: string
  titulo: string
  render: (fila: T) => ReactNode
  /** Clases de la celda, p. ej. para alinear números. */
  clase?: string
}

/** Tabla de solo lectura: el nombre accesible sale del `caption` y se desplaza en horizontal en pantallas estrechas. */
export default function TablaDatos<T>({ nombre, columnas, filas, clave, claseFila }: {
  nombre: string
  columnas: ColumnaTabla<T>[]
  filas: T[]
  clave: (fila: T) => string
  claseFila?: (fila: T) => string
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border/70 bg-[var(--card-bg)]" tabIndex={0} role="region" aria-label={`Tabla de ${nombre.toLowerCase()}`}>
      <table className="w-full min-w-[34rem] text-left text-sm">
        <caption className="sr-only">{nombre}</caption>
        <thead>
          <tr className="border-b border-border/70 bg-bg-alt/60">
            {columnas.map((c) => (
              <th key={c.clave} scope="col" className={`px-4 py-2.5 text-[0.65rem] font-bold uppercase tracking-wider text-text-muted ${c.clase ?? ''}`}>{c.titulo}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {filas.map((fila) => (
            <tr key={clave(fila)} className={claseFila?.(fila) ?? ''}>
              {columnas.map((c) => (
                <td key={c.clave} className={`px-4 py-2.5 align-top ${c.clase ?? ''}`}>{c.render(fila)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
