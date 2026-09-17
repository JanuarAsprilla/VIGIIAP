// Catálogo de módulos delegables por administrador SIG — debe reflejar
// exactamente las claves de MODULOS en VIGIIAP-backend/src/modules/admin/modulos.service.js.
export const MODULOS_CATALOGO = [
  { clave: 'usuarios',             nombre: 'Usuarios' },
  { clave: 'solicitudes',          nombre: 'Solicitudes' },
  { clave: 'documentos',           nombre: 'Documentos' },
  { clave: 'mapas',                nombre: 'Mapas' },
  { clave: 'geovisores',           nombre: 'Geovisores' },
  { clave: 'conexiones_geoserver', nombre: 'Conexiones GeoServer' },
  { clave: 'categorias',           nombre: 'Categorías' },
  { clave: 'configuracion',        nombre: 'Configuración' },
  { clave: 'actividad',            nombre: 'Actividad' },
  { clave: 'errores',              nombre: 'Errores' },
  { clave: 'reportes',             nombre: 'Reportes' },
] as const

export type ModuloClave = (typeof MODULOS_CATALOGO)[number]['clave']

export interface PermisoModulo {
  modulo: ModuloClave
  puede_ver: boolean
  puede_editar: boolean
}
