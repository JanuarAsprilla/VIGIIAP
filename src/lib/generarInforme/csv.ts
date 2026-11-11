import type { Celda, DatosInforme, TablaInforme } from './tipos'

/** Una celda de texto que empiece así la interpretan como fórmula Excel y Calc: se neutraliza con un apóstrofo. */
const COMIENZO_DE_FORMULA = /^[=+\-@\t\r]/

function celdaCsv(valor: Celda): string {
  if (valor === null) return ''
  const texto = typeof valor === 'string' && COMIENZO_DE_FORMULA.test(valor) ? `'${valor}` : String(valor)
  return /[",\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

export function tablaPrincipal(datos: DatosInforme): TablaInforme | null {
  const tablas = datos.secciones.flatMap((s) => s.tablas ?? [])
  return tablas.find((t) => t.principal) ?? tablas[0] ?? null
}

/**
 * CSV de la tabla principal: datos planos, coma como separador y BOM para que Excel respete los acentos.
 * Tras una línea en blanco, la fuente y los filtros van como comentarios («# ...») para no mezclarlos con los datos.
 */
export function generarCsv(datos: DatosInforme): Blob {
  const tabla = tablaPrincipal(datos)
  const lineas = tabla
    ? [tabla.columnas.map(celdaCsv).join(','), ...tabla.filas.map((fila) => fila.map(celdaCsv).join(','))]
    : []
  const comentarios = [
    datos.titulo,
    ...datos.filtros.map((f) => `Filtro: ${f}`),
    ...datos.fuente,
  ].map((l) => `# ${l.replace(/[\r\n]+/g, ' ')}`)
  const contenido = [...lineas, '', ...comentarios].join('\r\n')
  return new Blob(['﻿', contenido, '\r\n'], { type: 'text/csv;charset=utf-8' })
}
