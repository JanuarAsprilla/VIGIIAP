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

// =====================================================
// Mapas module data
// =====================================================

export const MAP_CATEGORIES = [
  { value: '', label: 'Todas las categorías' },
  { value: 'biodiversidad', label: 'Biodiversidad y Especies' },
  { value: 'hidrologia', label: 'Hidrología' },
  { value: 'planificacion', label: 'Planificación' },
  { value: 'ecosistemas', label: 'Ecosistemas' },
  { value: 'cobertura', label: 'Cobertura Vegetal' },
  { value: 'comunidades', label: 'Comunidades' },
]

export const MAP_DEPARTMENTS = [
  { value: '', label: 'Todo el Chocó' },
  { value: 'choco', label: 'Chocó' },
  { value: 'valle', label: 'Valle del Cauca' },
  { value: 'cauca', label: 'Cauca' },
  { value: 'narino', label: 'Nariño' },
  { value: 'costa-norte', label: 'Costa Norte (Chocó)' },
]

export const MAP_FORMATS = [
  { value: '', label: 'Todos los formatos' },
  { value: 'shp', label: 'SHP' },
  { value: 'pdf', label: 'PDF' },
  { value: 'geojson', label: 'GeoJSON' },
  { value: 'tif', label: 'TIF' },
  { value: 'jpg', label: 'JPG' },
]

export const MAP_YEARS = [
  { value: '', label: 'Todos los años' },
  { value: '2024', label: '2024 - Reciente' },
  { value: '2023', label: '2023' },
  { value: '2022', label: '2022' },
  { value: '2021', label: '2021' },
]

export const SAMPLE_MAPS = [
  {
    id: 'MAPA_REF_01',
    category: 'Ecosistemas v.2024',
    title: 'Mapa de Cobertura Vegetal y Uso de la Tierra',
    excerpt: 'Análisis detallado de los estratos vegetales del Chocó...',
    formats: ['SHP', 'PDF', 'JPG'],
    badge: 'SHP + PDF',
    badgeColor: 'primary',
    date: 'Sep 2023',
  },
  {
    id: 'MAPA_REF_02',
    category: 'Hidrología',
    title: 'Cuenca del Río Atrato: Dinámica Fluvial',
    excerpt: 'Cartografía multitemporal de la red hídrica principal y sus...',
    formats: ['SHP', 'PDF', 'JPG'],
    badge: 'GeoJSON',
    badgeColor: 'orange',
    date: 'Jun 2024',
  },
  {
    id: 'MAPA_REF_03',
    category: 'Planificación',
    title: 'Mapa de Conflictos de Uso del Suelo 2023',
    excerpt: 'Identificación de áreas con sobreuso y subuso del suelo en...',
    formats: ['SHP', 'PDF', 'JPG'],
    badge: 'TIF',
    badgeColor: 'primary',
    date: 'Ene 2024',
  },
  {
    id: 'MAPA_REF_04',
    category: 'Ecosistemas v.2024',
    title: 'Zonificación Ambiental del Pacífico Norte',
    excerpt: 'Delimitación de áreas de conservación y uso sostenible...',
    formats: ['SHP', 'PDF', 'JPG'],
    badge: 'SHP + PDF',
    badgeColor: 'primary',
    date: 'Mar 2024',
  },
  {
    id: 'MAPA_REF_05',
    category: 'Hidrología',
    title: 'Red Hídrica y Cuencas Hidrográficas Sector Atrato',
    excerpt: 'Mapeo completo de ríos tributarios y microcuencas del...',
    formats: ['SHP', 'PDF'],
    badge: 'GeoJSON',
    badgeColor: 'orange',
    date: 'Abr 2024',
  },
  {
    id: 'MAPA_REF_06',
    category: 'Planificación',
    title: 'Áreas de Reserva Forestal del Pacífico',
    excerpt: 'Cartografía oficial de las zonas de reserva forestal...',
    formats: ['PDF', 'TIF'],
    badge: 'TIF',
    badgeColor: 'primary',
    date: 'Feb 2024',
  },
]