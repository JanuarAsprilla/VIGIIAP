import api from '@/lib/api'
import {
  bandaInstitucional, lineaMeta, seccion, encabezadoFila, filaDatos, pieDePagina,
  descargarWorkbook, logoInstitucionalBase64, COLOR_INSTITUCIONAL,
} from '@/lib/excelInstitucional'
import { ETIQUETA_EVENTO, ETIQUETA_DISPOSITIVO, formatoVariacion } from '@/lib/analiticaFormato'
import type {
  Comparativa, PaginaTop, EventosTop, Embudo, TransicionPagina, DispositivoStat, FuenteTrafico, UbicacionesAnalitica,
} from '@/hooks/useAnalitica'

const ULTIMA_COLUMNA = 6 // A: gutter/logo · B-F: hasta cinco columnas de datos

export interface RangoExportacion {
  desde: string
  hasta: string
}

interface DatosAnalitica {
  comparativa: Comparativa
  paginas: PaginaTop[]
  eventos: EventosTop
  embudos: Embudo[]
  flujo: TransicionPagina[]
  dispositivos: DispositivoStat[]
  fuentes: FuenteTrafico[]
  ubicaciones: UbicacionesAnalitica
}

async function cargarDatos(rango: RangoExportacion): Promise<DatosAnalitica> {
  const opciones = { params: { desde: rango.desde, hasta: rango.hasta } }
  // El cliente de API devuelve directamente el cuerpo de la respuesta (ver lib/api.ts).
  const pedir = <T>(ruta: string) => api.get(ruta, opciones) as unknown as Promise<T>
  const [comparativa, paginas, eventos, embudos, flujo, dispositivos, fuentes, ubicaciones] = await Promise.all([
    pedir<Comparativa>('/analitica/comparativa'),
    pedir<PaginaTop[]>('/analitica/paginas-top'),
    pedir<EventosTop>('/analitica/eventos-top'),
    pedir<Embudo[]>('/analitica/embudos'),
    pedir<TransicionPagina[]>('/analitica/flujo-navegacion'),
    pedir<DispositivoStat[]>('/analitica/dispositivos'),
    pedir<FuenteTrafico[]>('/analitica/fuentes-trafico'),
    pedir<UbicacionesAnalitica>('/analitica/ubicaciones'),
  ])
  return { comparativa, paginas, eventos, embudos, flujo, dispositivos, fuentes, ubicaciones }
}

type Sheet = import('exceljs').Worksheet
type Celda = string | number | null

/** Sección con encabezado y filas; si no hay filas deja una nota en lugar de una tabla vacía. */
function tabla(sheet: Sheet, titulo: string, encabezado: string[], filas: Celda[][]): void {
  seccion(sheet, titulo, ULTIMA_COLUMNA)
  if (filas.length === 0) {
    lineaMeta(sheet, 'Sin datos en el período seleccionado', { ultimaColumna: ULTIMA_COLUMNA })
    sheet.addRow([])
    return
  }
  encabezadoFila(sheet, [null, ...encabezado])
  filas.forEach((fila, i) => {
    const row = filaDatos(sheet, [null, ...fila], { zebra: i % 2 === 1, colInicio: 2, colFin: ULTIMA_COLUMNA })
    for (let c = 2; c <= ULTIMA_COLUMNA; c++) row.getCell(c).font = { size: 10, color: { argb: COLOR_INSTITUCIONAL.text } }
  })
  sheet.addRow([])
}

const fechaCorta = (iso: string) => iso.slice(0, 10)

/**
 * Exporta a Excel todo lo que muestra la pestaña Analítica para el rango elegido, con el mismo
 * formato institucional que los demás reportes. Si falla alguna consulta no descarga un libro
 * incompleto: propaga el error para que la pantalla lo avise.
 */
export async function exportarAnaliticaExcel(rango: RangoExportacion): Promise<void> {
  const d = await cargarDatos(rango)

  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'VIGIA — IIAP'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Analítica', {
    views: [{ state: 'frozen', ySplit: 7, showGridLines: false }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
  })
  sheet.columns = [{ width: 6 }, { width: 34 }, { width: 24 }, { width: 18 }, { width: 18 }, { width: 18 }]

  const logo = await logoInstitucionalBase64()
  bandaInstitucional(workbook, sheet, {
    titulo: 'VIGIA — Sistema de Información Territorial del Chocó\n'
      + 'Instituto de Investigaciones Ambientales del Pacífico (IIAP)\n'
      + 'Analítica de uso de la plataforma',
    ultimaColumna: ULTIMA_COLUMNA,
    logo,
  })
  lineaMeta(sheet, `Período: ${fechaCorta(rango.desde)} a ${fechaCorta(rango.hasta)}`, { ultimaColumna: ULTIMA_COLUMNA, destacado: true })
  lineaMeta(sheet, `Generado el ${new Date().toLocaleString('es-CO')}`, { ultimaColumna: ULTIMA_COLUMNA })
  sheet.addRow([])

  const { actual, anterior, variacion } = d.comparativa
  tabla(sheet, 'Comparación con el período anterior (sitio público)',
    ['Métrica', 'Actual', 'Anterior', 'Variación'],
    [
      ['Páginas vistas', actual.vistas, anterior.vistas, formatoVariacion(variacion.vistas, '%')],
      ['Visitas (sesiones)', actual.sesiones, anterior.sesiones, formatoVariacion(variacion.sesiones, '%')],
      ['Acciones de los visitantes', actual.acciones, anterior.acciones, formatoVariacion(variacion.acciones, '%')],
      ['Tasa de rebote', `${actual.rebotePct} %`, `${anterior.rebotePct} %`, formatoVariacion(variacion.rebotePuntos, 'pts')],
    ])

  tabla(sheet, 'Páginas más visitadas', ['Página', 'Vistas', 'Visitantes'],
    d.paginas.map((p) => [p.ruta, p.vistas, p.visitantes]))

  tabla(sheet, 'Acciones de los visitantes', ['Acción', 'Total', 'Visitantes'],
    d.eventos.eventos.map((e) => [ETIQUETA_EVENTO[e.nombre] ?? e.nombre, e.total, e.sesiones]))

  tabla(sheet, 'Lo más solicitado', ['Acción', 'Recurso', 'Total'],
    d.eventos.recursos.map((r) => [ETIQUETA_EVENTO[r.nombre] ?? r.nombre, r.recurso, r.total]))

  tabla(sheet, 'Embudos de conversión', ['Embudo', 'Paso', 'Sesiones', '% del paso anterior', '% del inicio'],
    d.embudos.flatMap((e) => e.pasos.map((p) => [e.titulo, p.etiqueta, p.sesiones, `${p.pctDelAnterior} %`, `${p.pctDelInicio} %`])))

  tabla(sheet, 'Flujo de navegación', ['Desde', 'Hacia', 'Veces'],
    d.flujo.map((t) => [t.desde, t.hacia, t.veces]))

  tabla(sheet, 'Dispositivos', ['Dispositivo', 'Sesiones'],
    d.dispositivos.map((x) => [ETIQUETA_DISPOSITIVO[x.dispositivo] ?? x.dispositivo, x.sesiones]))

  tabla(sheet, 'Fuentes de tráfico', ['Fuente', 'Sesiones'],
    d.fuentes.map((f) => [f.fuente, f.sesiones]))

  tabla(sheet, 'Visitas por país', ['País', 'Sesiones'],
    [...d.ubicaciones.paises.map((p) => [p.pais, p.sesiones] as Celda[]),
      ...(d.ubicaciones.sinUbicacion ? [['Sin determinar', d.ubicaciones.sinUbicacion] as Celda[]] : [])])

  tabla(sheet, 'Visitas por departamento (Colombia)', ['Departamento', 'Sesiones'],
    d.ubicaciones.departamentos.map((x) => [x.departamento, x.sesiones]))

  pieDePagina(sheet, 'Generado automáticamente por VIGIA — datos anónimos y agregados; no incluye direcciones IP.', ULTIMA_COLUMNA)

  await descargarWorkbook(workbook, `analitica-${fechaCorta(rango.desde)}_${fechaCorta(rango.hasta)}.xlsx`)
}
