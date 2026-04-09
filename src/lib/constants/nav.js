import {
  Home, Map, FileText, Globe, Wrench, ClipboardList, Newspaper,
  LayoutGrid, Users, Building2, Shield,
} from 'lucide-react'

export const ROUTES = {
  HOME: '/',
  MAPAS: '/mapas',
  DOCUMENTOS: '/documentos',
  GEOVISOR: '/geovisor',
  HERRAMIENTAS: '/herramientas',
  SOLICITUDES: '/solicitudes',
  ADMIN: '/admin',
}

export const NAV_LINKS = [
  { label: 'Inicio',       path: ROUTES.HOME,         icon: Home },
  { label: 'Mapas',        path: ROUTES.MAPAS,        icon: Map },
  { label: 'Documentos',   path: ROUTES.DOCUMENTOS,   icon: FileText },
  { label: 'Geovisor',     path: ROUTES.GEOVISOR,     icon: Globe },
  { label: 'Herramientas', path: ROUTES.HERRAMIENTAS, icon: Wrench },
  { label: 'Solicitudes',  path: ROUTES.SOLICITUDES,  icon: ClipboardList },
  { label: 'Noticias',     path: '/noticias',          icon: Newspaper },
]

export const MODULES = [
  {
    id: 'mapas',
    title: 'Catálogo de Mapas',
    description: 'Visualiza capas temáticas de biodiversidad, suelos y redes hídricas.',
    icon: Map,
    path: ROUTES.MAPAS,
    action: 'EXPLORAR',
  },
  {
    id: 'documentos',
    title: 'Biblioteca Documental',
    description: 'Planes de ordenamiento, decretos y estudios técnicos regionales.',
    icon: FileText,
    path: ROUTES.DOCUMENTOS,
    action: 'CONSULTAR',
  },
  {
    id: 'geovisor',
    title: 'Geovisor 3D',
    description: 'Herramienta interactiva de análisis espacial en tiempo real.',
    icon: Globe,
    path: ROUTES.GEOVISOR,
    action: 'LANZAR APP',
  },
  {
    id: 'herramientas',
    title: 'Herramientas SIG',
    description: 'Calculadoras de área, convertidores y motores de consulta avanzada.',
    icon: Wrench,
    path: ROUTES.HERRAMIENTAS,
    action: 'ACCEDER',
  },
]

export const STATS = [
  { icon: LayoutGrid, value: '05', label: 'Departamentos' },
  { icon: Users, value: '1.2M', label: 'Población' },
  { icon: Building2, value: '124', label: 'Municipios' },
  { icon: Shield, value: '32', label: 'Áreas Protegidas' },
]
