import {
  MapPin, FileText, Globe, Settings, ClipboardList,
  Map, Users, Building2, Ruler, Home, Shield,
} from 'lucide-react'

// =====================================================
// Route definitions
// =====================================================

export const ROUTES = {
  HOME: '/',
  MAPAS: '/mapas',
  DOCUMENTOS: '/documentos',
  GEOVISOR: '/geovisor',
  HERRAMIENTAS: '/herramientas',
  SOLICITUDES: '/solicitudes',
  ADMIN: '/admin',
}

// =====================================================
// Navigation links
// =====================================================

export const NAV_LINKS = [
  { label: 'Inicio', path: ROUTES.HOME },
  { label: 'Mapas', path: ROUTES.MAPAS },
  { label: 'Documentos', path: ROUTES.DOCUMENTOS },
  { label: 'Geovisor', path: ROUTES.GEOVISOR },
  { label: 'Herramientas', path: ROUTES.HERRAMIENTAS },
  { label: 'Solicitudes', path: ROUTES.SOLICITUDES },
]

// =====================================================
// Module definitions (for the modules grid)
// =====================================================

export const MODULES = [
  {
    id: 'mapas',
    title: 'Mapas',
    description: 'Repositorio completo de mapas temáticos del Chocó Biogeográfico',
    icon: MapPin,
    path: ROUTES.MAPAS,
    features: [
      'Listado de mapas',
      'Etiquetas temáticas',
      'Citas bibliográficas',
      'Múltiples formatos',
    ],
  },
  {
    id: 'documentos',
    title: 'Documentos',
    description: 'Protocolos, formatos, guías y estadísticas geográficas',
    icon: FileText,
    path: ROUTES.DOCUMENTOS,
    features: [
      'Protocolos oficiales',
      'Formatos de campo',
      'Guías técnicas',
      'Excel estadísticos',
    ],
  },
  {
    id: 'geovisor',
    title: 'Geovisor',
    description: 'Visualización interactiva de información geoespacial',
    icon: Globe,
    path: ROUTES.GEOVISOR,
    features: [
      'SIAT-PC integrado',
      'Capas interactivas',
      'Análisis espacial',
      'Exportación de datos',
    ],
  },
  {
    id: 'herramientas',
    title: 'Herramientas',
    description: 'Aplicaciones y tableros para captura y visualización',
    icon: Settings,
    path: ROUTES.HERRAMIENTAS,
    features: [
      'Geoformularios',
      'Apps móviles',
      'Tableros de control',
      'Reportes dinámicos',
    ],
  },
  {
    id: 'solicitudes',
    title: 'Solicitudes',
    description: 'Formatos y gestión de solicitudes cartográficas',
    icon: ClipboardList,
    path: ROUTES.SOLICITUDES,
    features: [
      'Solicitudes cartográficas',
      'Seguimiento en línea',
      'Formatos descargables',
      'Historial de solicitudes',
    ],
  },
]

// =====================================================
// Regional statistics (for Hero section — used later)
// =====================================================

export const STATS = [
  { icon: Map, value: 7, label: 'Departamentos' },
  { icon: Users, value: 7, suffix: 'M', label: 'Población' },
  { icon: Building2, value: 92, label: 'Municipios' },
  { icon: Ruler, value: 233946, label: 'Km² Área Total', format: true },
  { icon: Home, value: 174, label: 'Comunidades' },
  { icon: Shield, value: 232, label: 'Resguardos Indígenas' },
]