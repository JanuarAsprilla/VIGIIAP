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
  sin_especie: number
  especies: number
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

export interface FiltrosRegistros {
  grupo: Grupo
  codigo_municipal?: string
  departamento?: string
  anio_desde?: number
  anio_hasta?: number
  buscar?: string
  con_foto?: 'true'
  conservacion?: TipoConservacion
  amenaza?: Amenaza
  especie_clave?: string
  pagina: number
  tamano: number
}

export interface AlcanceTerritorial {
  codigo_municipal?: string
  departamento?: string
}

export interface RespuestaResumen {
  grupo: Grupo
  metodo: Metodo
  alcance: { codigo_municipal: string | null; departamento: string | null }
  registros: number
  especies: number
  con_foto: number | null
  amenazadas: { CR: number; EN: number; VU: number; total: number }
  endemicas_colombia: number
  endemicas_choco: number
  introducidas: number
  invasoras: number
  anio_min: number | null
  anio_max: number | null
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

export interface FiltrosEspecies extends AlcanceTerritorial {
  grupo: Grupo
  buscar?: string
  conservacion?: TipoConservacion
  amenaza?: Amenaza
  orden?: 'registros' | 'nombre'
  con_foto?: 'true'
  pagina: number
  tamano: number
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
