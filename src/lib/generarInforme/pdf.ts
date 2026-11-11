import type { jsPDF } from 'jspdf'
import type { Celda, DatosInforme, LogoPdf, PlantillaInforme, SeccionInforme, TablaInforme } from './tipos'

type Rgb = [number, number, number]
type TextoCelda = string | number

const MARGEN = 40
const ALTO_ENCABEZADO = 70
const ALTO_PIE = 36
const CIFRAS_POR_FILA = 3
const ALTO_CIFRA = 54

const AGUA: Rgb = [71, 85, 105]
const TENUE: Rgb = [226, 232, 240]
const FILA_ALTERNA: Rgb = [245, 247, 246]

const LATIN1_MAXIMO = 0xff
const ESPACIO_DE_NO_SEPARACION = String.fromCharCode(0xa0)
const SIGNOS: Record<string, string> = {
  '“': '"', '”': '"', '«': '"', '»': '"', '‘': "'", '’': "'",
  '–': '-', '—': '-', '…': '...', '•': '·',
}
const MARCAS_COMBINANTES = /\p{M}/gu

const dentroDeLatin1 = (c: string) => (c.codePointAt(0) ?? 0) <= LATIN1_MAXIMO

/**
 * Las fuentes estándar del PDF solo cubren Latin-1: se normalizan los signos tipográficos, se conserva lo del español
 * y, fuera de ese rango, se quita el diacrítico (ā → a) o se deja «?».
 */
export function textoPdf(valor: string): string {
  return Array.from(valor, (c) => {
    if (c === ESPACIO_DE_NO_SEPARACION) return ' '
    const signo = SIGNOS[c]
    if (signo !== undefined) return signo
    if (dentroDeLatin1(c)) return c
    return Array.from(c.normalize('NFD').replace(MARCAS_COMBINANTES, ''), (b) => (dentroDeLatin1(b) ? b : '?')).join('')
  }).join('')
}

export function hexARgb(hex: string, respaldo: Rgb): Rgb {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex)
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : respaldo
}

const fechaLarga = (d: Date) => d.toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })
const textoCelda = (c: Celda, numerica: boolean): TextoCelda => {
  if (c === null) return '-'
  if (typeof c === 'number') return numerica ? c.toLocaleString('es-CO') : String(c)
  return textoPdf(c)
}

interface Contexto {
  doc: jsPDF
  plantilla: PlantillaInforme
  primario: Rgb
  acento: Rgb
  logo: LogoPdf | null
  ancho: number
  alto: number
  contenidoAncho: number
}

function encabezadoPrimeraPagina(c: Contexto, datos: DatosInforme): number {
  const { doc } = c
  doc.setFillColor(...c.acento)
  doc.rect(0, 0, c.ancho, ALTO_ENCABEZADO, 'F')
  let x = MARGEN
  if (c.logo) {
    const alto = 40
    const ancho = Math.min(120, (c.logo.ancho / c.logo.alto) * alto)
    doc.addImage(c.logo.dataUrl, c.logo.formato, x, (ALTO_ENCABEZADO - alto) / 2, ancho, alto)
    x += ancho + 14
  }
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold').setFontSize(15)
  doc.text(textoPdf(c.plantilla.institucion), x, c.plantilla.subtitulo ? 33 : 41, { maxWidth: c.ancho - x - MARGEN })
  if (c.plantilla.subtitulo) {
    doc.setFont('helvetica', 'normal').setFontSize(9)
    doc.text(textoPdf(c.plantilla.subtitulo), x, 49, { maxWidth: c.ancho - x - MARGEN })
  }
  doc.setFillColor(...c.primario)
  doc.rect(0, ALTO_ENCABEZADO, c.ancho, 4, 'F')

  let y = ALTO_ENCABEZADO + 34
  doc.setTextColor(...c.primario).setFont('helvetica', 'bold').setFontSize(18)
  const titulo = doc.splitTextToSize(textoPdf(datos.titulo), c.contenidoAncho) as string[]
  doc.text(titulo, MARGEN, y)
  y += titulo.length * 22
  doc.setTextColor(...AGUA).setFont('helvetica', 'normal').setFontSize(9)
  const linea = [datos.subtitulo, `Generado el ${fechaLarga(datos.generadoEn)}`].filter(Boolean).join(' · ')
  doc.text(textoPdf(linea), MARGEN, y)
  return y + 18
}

function encabezadoContinuacion(c: Contexto) {
  c.doc.setFillColor(...c.acento)
  c.doc.rect(0, 0, c.ancho, 22, 'F')
  c.doc.setTextColor(255, 255, 255).setFont('helvetica', 'bold').setFontSize(8)
  c.doc.text(textoPdf(c.plantilla.institucion), MARGEN, 14)
}

function asegurarEspacio(c: Contexto, y: number, necesario: number): number {
  if (y + necesario <= c.alto - ALTO_PIE - 10) return y
  c.doc.addPage()
  encabezadoContinuacion(c)
  return 44
}

function titulo(c: Contexto, texto: string, y: number, tam = 13): number {
  const donde = asegurarEspacio(c, y, 40)
  c.doc.setTextColor(...c.primario).setFont('helvetica', 'bold').setFontSize(tam)
  c.doc.text(textoPdf(texto), MARGEN, donde)
  c.doc.setDrawColor(...c.primario).setLineWidth(0.8).line(MARGEN, donde + 4, MARGEN + c.contenidoAncho, donde + 4)
  return donde + 20
}

function lista(c: Contexto, lineas: string[], y: number, tam = 9, color: Rgb = AGUA): number {
  let actual = y
  for (const linea of lineas) {
    // El tipo de letra se fija antes de medir: si no, el texto se parte con la medida de lo último que se dibujó.
    c.doc.setFont('helvetica', 'normal').setFontSize(tam)
    const partes = c.doc.splitTextToSize(textoPdf(linea), c.contenidoAncho) as string[]
    actual = asegurarEspacio(c, actual, partes.length * (tam + 3))
    c.doc.setTextColor(...color).setFont('helvetica', 'normal').setFontSize(tam)
    c.doc.text(partes, MARGEN, actual)
    actual += partes.length * (tam + 3) + 2
  }
  return actual
}

function cifras(c: Contexto, items: NonNullable<SeccionInforme['cifras']>, y: number): number {
  const separacion = 10
  const ancho = (c.contenidoAncho - separacion * (CIFRAS_POR_FILA - 1)) / CIFRAS_POR_FILA
  let actual = y
  for (let i = 0; i < items.length; i += CIFRAS_POR_FILA) {
    actual = asegurarEspacio(c, actual, ALTO_CIFRA + 8)
    items.slice(i, i + CIFRAS_POR_FILA).forEach((cifra, j) => {
      const x = MARGEN + j * (ancho + separacion)
      c.doc.setDrawColor(...TENUE).setLineWidth(0.8).roundedRect(x, actual, ancho, ALTO_CIFRA, 5, 5, 'S')
      c.doc.setTextColor(...AGUA).setFont('helvetica', 'normal').setFontSize(8)
      c.doc.text(textoPdf(cifra.etiqueta), x + 8, actual + 14, { maxWidth: ancho - 16 })
      c.doc.setTextColor(...c.primario).setFont('helvetica', 'bold').setFontSize(16)
      c.doc.text(textoPdf(cifra.valor), x + 8, actual + 35, { maxWidth: ancho - 16 })
      if (cifra.nota) {
        c.doc.setTextColor(...AGUA).setFont('helvetica', 'normal').setFontSize(7)
        c.doc.text(textoPdf(cifra.nota), x + 8, actual + 47, { maxWidth: ancho - 16 })
      }
    })
    actual += ALTO_CIFRA + 8
  }
  return actual + 4
}

async function tabla(c: Contexto, t: TablaInforme, y: number): Promise<number> {
  const { autoTable } = await import('jspdf-autotable')
  const donde = asegurarEspacio(c, y, 70)
  c.doc.setTextColor(0, 0, 0).setFont('helvetica', 'bold').setFontSize(10)
  c.doc.text(textoPdf(t.titulo), MARGEN, donde)
  if (t.filas.length === 0) return lista(c, ['Sin datos para estos filtros.'], donde + 16)
  const numericas = new Set(t.numericas ?? [])
  autoTable(c.doc, {
    startY: donde + 8,
    head: [t.columnas.map(textoPdf)],
    body: t.filas.map((fila) => fila.map((celda, i) => textoCelda(celda, numericas.has(i)))),
    margin: { left: MARGEN, right: MARGEN, top: 34, bottom: ALTO_PIE + 6 },
    styles: { fontSize: 8, cellPadding: 3, textColor: [30, 41, 59] },
    headStyles: { fillColor: c.primario, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: FILA_ALTERNA },
    columnStyles: Object.fromEntries([...numericas].map((i) => [i, { halign: 'right' as const }])),
    // El encabezado de una columna numérica se alinea con sus cifras.
    didParseCell: (celda) => { if (celda.section === 'head' && numericas.has(celda.column.index)) celda.cell.styles.halign = 'right' },
    didDrawPage: (datosPagina) => { if (datosPagina.pageNumber > 1) encabezadoContinuacion(c) },
  })
  const fin = (c.doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? donde + 20
  return t.nota ? lista(c, [t.nota], fin + 12, 8) : fin + 14
}

function pieDePagina(c: Contexto) {
  const total = c.doc.getNumberOfPages()
  for (let pagina = 1; pagina <= total; pagina += 1) {
    c.doc.setPage(pagina)
    c.doc.setDrawColor(...TENUE).setLineWidth(0.6).line(MARGEN, c.alto - ALTO_PIE, c.ancho - MARGEN, c.alto - ALTO_PIE)
    c.doc.setTextColor(...AGUA).setFont('helvetica', 'normal').setFontSize(7.5)
    if (c.plantilla.pie) c.doc.text(textoPdf(c.plantilla.pie), MARGEN, c.alto - ALTO_PIE + 13, { maxWidth: c.contenidoAncho - 80 })
    c.doc.text(`Página ${pagina} de ${total}`, c.ancho - MARGEN, c.alto - ALTO_PIE + 13, { align: 'right' })
  }
}

/** PDF A4 con la plantilla institucional: encabezado, filtros, cifras, tablas, fuente y aviso legal, con numeración de páginas. */
export async function generarPdf(datos: DatosInforme, plantilla: PlantillaInforme, logo: LogoPdf | null = null): Promise<Blob> {
  const { jsPDF: Documento } = await import('jspdf')
  const doc = new Documento({ unit: 'pt', format: 'a4' })
  const ancho = doc.internal.pageSize.getWidth()
  const alto = doc.internal.pageSize.getHeight()
  const c: Contexto = {
    doc, plantilla, logo, ancho, alto, contenidoAncho: ancho - MARGEN * 2,
    primario: hexARgb(plantilla.colorPrimario, [0, 152, 70]), acento: hexARgb(plantilla.colorAcento, [15, 23, 42]),
  }
  doc.setProperties({ title: textoPdf(datos.titulo), author: textoPdf(plantilla.institucion), creator: textoPdf(plantilla.institucion) })

  let y = encabezadoPrimeraPagina(c, datos)
  y = titulo(c, 'Filtros aplicados', y, 11)
  y = lista(c, datos.filtros.length > 0 ? datos.filtros.map((f) => `· ${f}`) : ['Sin filtros: se incluyen todos los registros del grupo.'], y - 4)
  for (const seccion of datos.secciones) {
    y = titulo(c, seccion.titulo, y + 6)
    if (seccion.parrafos) y = lista(c, seccion.parrafos, y - 4)
    if (seccion.cifras) y = cifras(c, seccion.cifras, y - 4)
    for (const t of seccion.tablas ?? []) y = await tabla(c, t, y)
  }
  y = titulo(c, 'Fuente y citación', y + 6, 11)
  y = lista(c, datos.fuente, y - 4, 8.5)
  if (plantilla.aviso) {
    y = titulo(c, 'Aviso legal', y + 6, 11)
    lista(c, [plantilla.aviso], y - 4, 8)
  }
  pieDePagina(c)
  return doc.output('blob')
}
