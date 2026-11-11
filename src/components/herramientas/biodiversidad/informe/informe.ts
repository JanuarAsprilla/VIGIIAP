import api from '@/lib/api'
import type { Cifra, DatosInforme, FormatoDescarga, TablaInforme } from '@/lib/generarInforme'
import { fmtFecha, fmtNum, fmtNumONulo } from '../lib/format'
import {
  NOMBRES_GRUPO,
  type Conservacion, type EspecieResumen, type Grupo, type GrupoEstado, type Metodo, type MunicipioConteo, type ParamsApi,
  type RespuestaEspecies, type RespuestaResumen,
} from '../types'

/** La API entrega 100 por página y el límite público es de 100 peticiones cada 15 minutos: el informe se queda en unas pocas páginas. */
export const ESPECIES_MAXIMAS_POR_INFORME = 300
const TAMANO_PAGINA = 100
/** La exportación de registros es una sola petición que puede mover decenas de miles de filas. */
const PLAZO_EXPORTACION_MS = 60_000
/** Parámetros de listado que la exportación no admite: el servidor fija el orden y el tope. */
const PARAMETROS_DE_LISTADO = ['orden', 'pagina', 'tamano']

/** Un registro de la exportación del servidor (sin fotos; las coordenadas ya vienen ocultas cuando corresponde). */
export interface RegistroExportado extends Conservacion {
  gbif_id: string
  especie: string | null
  anio: number | null
  fecha_evento: string | null
  tipo_evidencia: string | null
  licencia: string | null
  latitud: number | string | null
  longitud: number | string | null
  incertidumbre_m: number | string | null
  coordenadas_ocultas: boolean
  conjunto: string | null
  doi_conjunto: string | null
  municipio: string
  departamento: string
  registrado_por: string | null
  identificado_por: string | null
}

export interface RespuestaExportacion {
  grupo: Grupo
  desde: number
  hasta: number
  limite: number
  truncado: boolean
  registros: RegistroExportado[]
}

export interface EntradaInforme {
  grupo: Grupo
  metodo: Metodo
  info: GrupoEstado | undefined
  /** Aviso de la herramienta sobre cómo leer los datos (lo entrega el servicio). */
  aviso: string | undefined
  /** Texto de cada filtro activo («Familia: Hylidae»). */
  filtros: string[]
  ranking: MunicipioConteo[]
  resumen: RespuestaResumen
  especies: EspecieResumen[]
  totalEspecies: number
  /** Registros individuales: solo en el Excel y el CSV, y solo en grupos con registros individuales. */
  registros?: RespuestaExportacion
  maxFilas: number
  generadoEn: Date
}

/** Fecha de la consulta, en la hora de quien la hace. La del corte de datos se formatea aparte, en UTC (ver fmtFecha). */
const fechaLarga = (d: Date) => d.toLocaleDateString('es-CO', { dateStyle: 'long' })
const dosCifras = (n: number) => String(n).padStart(2, '0')
const diaLocal = (d: Date) => `${d.getFullYear()}-${dosCifras(d.getMonth() + 1)}-${dosCifras(d.getDate())}`

function conservacion(e: Conservacion): string | null {
  const partes = [
    e.amenaza ? `Amenazada (${e.amenaza})` : null,
    e.endemica_choco ? 'Endémica del Chocó' : null,
    e.endemica_colombia && !e.endemica_choco ? 'Endémica de Colombia' : null,
    e.introducida ? 'Introducida' : null,
    e.invasora ? 'Invasora' : null,
  ].filter((p): p is string => p !== null)
  return partes.length > 0 ? partes.join(', ') : null
}

function cifras(r: RespuestaResumen, info: GrupoEstado | undefined): Cifra[] {
  const a = r.amenazadas
  const periodo = r.anio_min !== null && r.anio_max !== null ? `${r.anio_min}-${r.anio_max}` : info ? `${info.desde}-${info.hasta}` : null
  const sinCalculo = 'No se calcula con este filtro'
  const opcional = (etiqueta: string, valor: number | null): Cifra[] => (valor === null ? [] : [{ etiqueta, valor: fmtNum(valor) }])
  return [
    { etiqueta: 'Registros', valor: fmtNum(r.registros) },
    { etiqueta: 'Especies', valor: fmtNumONulo(r.especies), nota: r.especies === null ? sinCalculo : 'Distintas documentadas' },
    ...opcional('Registros con foto', r.con_foto),
    {
      etiqueta: 'Especies amenazadas', valor: fmtNumONulo(a.total),
      nota: a.total === null ? sinCalculo : `CR ${fmtNumONulo(a.CR)} · EN ${fmtNumONulo(a.EN)} · VU ${fmtNumONulo(a.VU)}`,
    },
    ...opcional('Endémicas de Colombia', r.endemicas_colombia),
    ...opcional('Endémicas del Chocó', r.endemicas_choco),
    ...opcional('Introducidas', r.introducidas),
    ...opcional('Invasoras', r.invasoras),
    ...(periodo ? [{ etiqueta: 'Periodo de los registros', valor: periodo }] : []),
    ...opcional('Entidades publicadoras', r.entidades),
    ...opcional('Conjuntos de datos', r.conjuntos),
  ]
}

function tablaMunicipios(ranking: MunicipioConteo[], maxFilas: number): TablaInforme {
  const conRegistros = ranking.filter((m) => m.registros > 0)
  const filas = conRegistros.slice(0, maxFilas)
  return {
    titulo: 'Registros por municipio',
    columnas: ['Municipio', 'Departamento', 'Registros', 'Especies'],
    filas: filas.map((m) => [m.municipio, m.departamento, m.registros, m.especies]),
    numericas: [2, 3],
    nota: conRegistros.length > filas.length ? `Se muestran los ${fmtNum(filas.length)} municipios con más registros de ${fmtNum(conRegistros.length)}.` : undefined,
  }
}

const aNumero = (v: number | string | null): number | null => (v === null || v === '' || Number.isNaN(Number(v)) ? null : Number(v))

function ubicacion(r: RegistroExportado): string {
  if (r.coordenadas_ocultas) return 'Generalizada u oculta'
  return r.latitud === null ? 'Sin coordenadas' : 'Visible'
}

/** Registros individuales para la hoja de cálculo. Sin formato numérico de miles: son años y coordenadas, no cantidades. */
function tablaRegistros(r: RespuestaExportacion, totalRegistros: number): TablaInforme {
  return {
    titulo: 'Registros',
    columnas: [
      'ID GBIF', 'Especie', 'Año', 'Fecha del evento', 'Tipo de evidencia', 'Licencia', 'Municipio', 'Departamento', 'Latitud', 'Longitud',
      'Incertidumbre (m)', 'Ubicación', 'Conjunto de datos', 'DOI del conjunto', 'Registrado por', 'Identificado por', 'Conservación',
    ],
    filas: r.registros.map((x) => [
      x.gbif_id, x.especie, x.anio, x.fecha_evento, x.tipo_evidencia, x.licencia, x.municipio, x.departamento, aNumero(x.latitud), aNumero(x.longitud),
      aNumero(x.incertidumbre_m), ubicacion(x), x.conjunto, x.doi_conjunto, x.registrado_por, x.identificado_por, conservacion(x),
    ]),
    principal: true,
    nota: r.truncado
      ? `Se incluyen los ${fmtNum(r.registros.length)} registros más recientes de ${fmtNum(totalRegistros)} que cumplen los filtros (tope de la descarga: ${fmtNum(r.limite)}).`
      : undefined,
  }
}

function tablaEspecies(especies: EspecieResumen[], total: number, principal: boolean): TablaInforme {
  return {
    titulo: 'Especies con más registros',
    columnas: ['Especie', 'Familia', 'Orden', 'Registros', 'Municipios', 'Conservación'],
    filas: especies.map((e) => [e.especie, e.familia, e.orden, e.registros, e.municipios, conservacion(e)]),
    numericas: [3, 4],
    principal,
    nota: total > especies.length ? `Se incluyen las ${fmtNum(especies.length)} especies con más registros de ${fmtNum(total)}.` : undefined,
  }
}

function fuente(e: EntradaInforme): string[] {
  const { info } = e
  const doi = info?.doi ? (info.doi.startsWith('http') ? info.doi : `https://doi.org/${info.doi}`) : null
  return [
    'Fuente: GBIF (Global Biodiversity Information Facility), https://www.gbif.org.',
    ...(info?.fecha_fuente ? [`Corte de datos: ${fmtFecha(info.fecha_fuente)}.`] : []),
    ...(info ? [`Periodo del corte: ${info.desde}-${info.hasta}. Registros del corte: ${fmtNum(info.registros)}.`] : []),
    ...(doi ? [`DOI del corte: ${doi}`] : []),
    `Consulta realizada el ${fechaLarga(e.generadoEn)}.`,
    ...(e.metodo === 'agregado' ? ['Inventario agregado: el servicio entrega conteos por municipio, no registros individuales.'] : []),
    ...(e.registros ? ['Las ubicaciones de especies amenazadas y de registros sensibles aparecen generalizadas u ocultas, igual que en la plataforma.'] : []),
    'Cada conjunto de datos conserva su licencia original (por ejemplo CC BY o CC0): consulta la fuente de cada conjunto antes de reutilizar los datos.',
    'Más registros indica dónde se ha muestreado más, no dónde hay más vida.',
    ...(e.aviso ? [e.aviso] : []),
  ]
}

/** Arma el informe a partir de lo que ya se consultó. No toca la red: es lo que se prueba. */
export function construirInforme(e: EntradaInforme): DatosInforme {
  const dia = diaLocal(e.generadoEn)
  return {
    titulo: `Observatorio de Biodiversidad - ${NOMBRES_GRUPO[e.grupo]}`,
    subtitulo: e.metodo === 'agregado' ? 'Inventario agregado por municipio' : 'Registros de ocurrencia por municipio',
    generadoEn: e.generadoEn,
    filtros: [`Grupo: ${NOMBRES_GRUPO[e.grupo]}`, ...e.filtros],
    secciones: [
      { titulo: 'Cifras clave', cifras: cifras(e.resumen, e.info) },
      { titulo: 'Territorio', tablas: [tablaMunicipios(e.ranking, e.maxFilas)] },
      { titulo: 'Especies', tablas: [tablaEspecies(e.especies, e.totalEspecies, !e.registros)] },
      ...(e.registros ? [{ titulo: 'Registros individuales', tablas: [tablaRegistros(e.registros, e.resumen.registros)] }] : []),
    ],
    fuente: fuente(e),
    nombreArchivo: `informe-biodiversidad-${e.grupo}-${dia}`,
  }
}

export interface ContextoConsulta {
  grupo: Grupo
  metodo: Metodo
  info: GrupoEstado | undefined
  aviso: string | undefined
  filtros: string[]
  ranking: MunicipioConteo[]
  paramsResumen: ParamsApi
  paramsEspecies: ParamsApi
  paramsRegistros: ParamsApi
}

/** Los filtros del tablero sin lo que solo tiene sentido al paginar un listado. */
function filtrosDeExportacion(params: ParamsApi): ParamsApi {
  return Object.fromEntries(Object.entries(params).filter(([clave]) => !PARAMETROS_DE_LISTADO.includes(clave)))
}

/** Una sola petición al servidor, que aplica el permiso, las ubicaciones ocultas y el tope de filas configurado. */
function pedirRegistros(c: ContextoConsulta, signal: AbortSignal): Promise<RespuestaExportacion> {
  return api.get('/informes/biodiversidad/registros', {
    params: { grupo: c.grupo, ...filtrosDeExportacion(c.paramsRegistros) }, signal, timeout: PLAZO_EXPORTACION_MS,
  })
}

/**
 * Consulta el resumen y las especies principales con los filtros vigentes, y arma el informe. El Excel y el CSV suman los
 * registros individuales (solo en grupos que los tienen); el PDF es un resumen y no los lleva.
 */
export async function reunirInforme(c: ContextoConsulta, maxFilas: number, signal: AbortSignal, formato: FormatoDescarga = 'pdf'): Promise<DatosInforme> {
  const conRegistros = formato !== 'pdf' && c.metodo === 'individual'
  const limite = Math.min(maxFilas, ESPECIES_MAXIMAS_POR_INFORME)
  const resumen: RespuestaResumen = await api.get('/biodiversidad/resumen', { params: { grupo: c.grupo, ...c.paramsResumen }, signal })
  const especies: EspecieResumen[] = []
  let total = 0
  for (let pagina = 1; especies.length < limite; pagina += 1) {
    const respuesta: RespuestaEspecies = await api.get('/biodiversidad/especies', {
      params: { grupo: c.grupo, ...c.paramsEspecies, orden: 'registros', pagina, tamano: TAMANO_PAGINA }, signal,
    })
    total = respuesta.total
    especies.push(...respuesta.especies)
    if (respuesta.especies.length < TAMANO_PAGINA || especies.length >= total) break
  }
  const registros = conRegistros ? await pedirRegistros(c, signal) : undefined
  return construirInforme({
    grupo: c.grupo, metodo: c.metodo, info: c.info, aviso: c.aviso, filtros: c.filtros, ranking: c.ranking,
    resumen, especies: especies.slice(0, limite), totalEspecies: total, registros, maxFilas, generadoEn: new Date(),
  })
}
