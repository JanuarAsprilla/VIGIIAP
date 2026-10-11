// Agrupamiento visual de módulos para el modal de permisos de GestionAdmins.tsx
// -- mismo agrupamiento que el sidebar admin (AdminSidebar.tsx), para que
// asignar permisos se sienta como el mismo mapa mental que navegar el panel.
// Vive en su propio archivo (no en GestionAdmins.tsx) para que ese archivo
// pueda exportar solo el componente -- requisito de react-refresh/only-export-components.
import {
  Users, ClipboardList, FileText, Map, MapPinned, Server, Tag,
  Settings, Activity, AlertTriangle, FileBarChart, KeyRound, type LucideIcon,
} from 'lucide-react'
import { MODULOS_CATALOGO, type ModuloClave } from '@/lib/constants/modulos'

const MODULO_ICON_BASE: Partial<Record<ModuloClave, LucideIcon>> = {
  usuarios: Users,
  solicitudes: ClipboardList,
  documentos: FileText,
  mapas: Map,
  geovisores: MapPinned,
  conexiones_geoserver: Server,
  categorias: Tag,
  configuracion: Settings,
  actividad: Activity,
  errores: AlertTriangle,
  reportes: FileBarChart,
}

/** Ícono por módulo, con KeyRound como respaldo para cualquier módulo del catálogo sin ícono asignado. */
export function iconoDeModulo(clave: ModuloClave): LucideIcon {
  return MODULO_ICON_BASE[clave] ?? KeyRound
}

const GRUPOS_BASE: { titulo: string; claves: ModuloClave[] }[] = [
  { titulo: 'Gestión', claves: ['usuarios', 'solicitudes', 'documentos', 'mapas', 'geovisores', 'conexiones_geoserver', 'categorias'] },
  { titulo: 'Sistema', claves: ['configuracion', 'actividad', 'errores', 'reportes'] },
]

// Deriva de MODULOS_CATALOGO (la fuente única de verdad) en vez de asumir que
// GRUPOS_BASE quedó sincronizado a mano: si algún día se agrega un módulo
// nuevo al catálogo y alguien olvida categorizarlo aquí, sigue apareciendo
// (en un grupo "Otros") en vez de contar para el "{habilitados}/{total}" sin
// tener ningún switch visible para habilitarlo.
const CLAVES_AGRUPADAS = new Set(GRUPOS_BASE.flatMap((g) => g.claves))
const CLAVES_SIN_GRUPO = MODULOS_CATALOGO.map((m) => m.clave).filter((c) => !CLAVES_AGRUPADAS.has(c))
export const GRUPOS_MODULOS = CLAVES_SIN_GRUPO.length > 0
  ? [...GRUPOS_BASE, { titulo: 'Otros', claves: CLAVES_SIN_GRUPO }]
  : GRUPOS_BASE
