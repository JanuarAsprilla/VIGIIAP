export const GRUPOS = ['aves', 'mamiferos', 'anfibios', 'reptiles', 'insectos', 'plantas', 'hongos'] as const
export type Grupo = (typeof GRUPOS)[number]

export type Metodo = 'individual' | 'agregado'

export interface GrupoEstado {
  grupo: Grupo
  metodo: Metodo
  desde: number
  hasta: number
  registros: number
  fecha_fuente: string | null
  doi: string | null
}

export interface EstadoBiodiversidad {
  grupos: GrupoEstado[]
  conservacion: { activa: boolean; actualizada_en: string | null }
  aviso: string
}

export interface MunicipioConteo {
  codigo_municipal: string
  municipio: string
  departamento: string
  registros: number
  /** null cuando el filtro activo no permite calcularlo (inventarios agregados con filtro de fuente). */
  sin_especie: number | null
  especies: number | null
}

export interface RespuestaMunicipios {
  grupo: Grupo
  metodo: Metodo
  desde: number
  hasta: number
  municipios: MunicipioConteo[]
}

export type Amenaza = 'CR' | 'EN' | 'VU'
export type TipoConservacion = 'amenazada' | 'endemica' | 'introducida' | 'invasora'

export interface Foto {
  imagen: string
  autor: string | null
  editor: string | null
  licencia: string | null
  referencia: string | null
}

export interface Conservacion {
  amenaza: Amenaza | null
  endemica_colombia: boolean
  endemica_choco: boolean
  introducida: boolean
  invasora: boolean
}

export interface RegistroBiodiversidad extends Conservacion {
  gbif_id: string
  especie: string | null
  especie_clave: string | null
  anio: number | null
  fecha_evento: string | null
  tipo_evidencia: string | null
  licencia: string | null
  latitud: number | null
  longitud: number | null
  incertidumbre_m: number | null
  coordenadas_ocultas: boolean
  conjunto: string | null
  doi_conjunto: string | null
  codigo_municipal: string
  municipio: string
  departamento: string
  registrado_por: string | null
  identificado_por: string | null
  foto: Foto | null
  fotos_total: number
}

export interface Taxonomia {
  reino: string | null
  clase: string | null
  orden: string | null
  familia: string | null
  genero: string | null
}

export interface RegistroDetalle extends RegistroBiodiversidad {
  fotos: Foto[]
  /** Marcas de revisión propias de la plataforma (p. ej. incertidumbre_mayor_umbral). */
  marcas_revision: string[]
  /** Códigos de calidad de GBIF; el servicio los añadirá en este campo. */
  marcas_gbif?: string[]
  institution_code: string | null
  collection_code: string | null
  catalog_number: string | null
  occurrence_id: string | null
  nombre_original: string | null
  taxonomia: Taxonomia
}

export interface RespuestaRegistros {
  grupo: Grupo
  desde: number
  hasta: number
  pagina: number
  tamano: number
  total: number
  registros: RegistroBiodiversidad[]
}

export interface AlcanceTerritorial {
  codigo_municipal?: string
  departamento?: string
}

/** Parámetros de consulta ya validados y listos para enviarse (sin `grupo`). */
export type ParamsApi = Record<string, string | number>

export interface RespuestaResumen {
  grupo: Grupo
  metodo: Metodo
  alcance: { codigo_municipal: string | null; departamento: string | null }
  registros: number
  especies: number | null
  con_foto: number | null
  /** Cada cifra es null cuando el filtro activo no permite calcular la conservación. */
  amenazadas: { CR: number | null; EN: number | null; VU: number | null; total: number | null }
  endemicas_colombia: number | null
  endemicas_choco: number | null
  introducidas: number | null
  invasoras: number | null
  anio_min: number | null
  anio_max: number | null
  entidades: number | null
  conjuntos: number | null
  con_ubicacion: number | null
}

export interface EspecieResumen extends Conservacion {
  especie: string
  especie_clave: string
  reino: string | null
  clase: string | null
  orden: string | null
  familia: string | null
  genero: string | null
  registros: number
  municipios: number
  /** Foto representativa (solo grupos individuales); null en agregados o si la especie no tiene fotos válidas. */
  foto?: Foto | null
  fotos_total?: number
}

export interface RespuestaEspecies {
  grupo: Grupo
  metodo: Metodo
  pagina: number
  tamano: number
  total: number
  especies: EspecieResumen[]
}

export interface RespuestaSeries {
  grupo: Grupo
  metodo: Metodo
  por_anio: { anio: number; registros: number }[]
  por_evidencia: { tipo: string; registros: number }[]
}

export const CAMPOS_OPCIONES = ['reino', 'division', 'clase', 'orden', 'familia', 'genero', 'entidad', 'conjunto', 'tipo_evidencia', 'anio'] as const
export type CampoOpciones = (typeof CAMPOS_OPCIONES)[number]

export interface OpcionFiltro {
  valor: string
  nombre: string
  registros: number
}

export interface RespuestaOpciones {
  grupo: Grupo
  campo: CampoOpciones
  valores: OpcionFiltro[]
}

export interface PuntoMapa {
  id: string
  lat: number
  lon: number
  e: string | null
  ek: string | null
  a: Amenaza | null
}

export interface RespuestaPuntos {
  grupo: Grupo
  total: number
  mostrados: number
  ocultos: number
  muestreado: boolean
  puntos: PuntoMapa[]
}

export const NOMBRES_GRUPO: Record<Grupo, string> = {
  aves: 'Aves',
  mamiferos: 'Mamíferos',
  anfibios: 'Anfibios',
  reptiles: 'Reptiles',
  insectos: 'Insectos',
  plantas: 'Plantas',
  hongos: 'Hongos',
}

export function esGrupo(valor: unknown): valor is Grupo {
  return typeof valor === 'string' && (GRUPOS as readonly string[]).includes(valor)
}
