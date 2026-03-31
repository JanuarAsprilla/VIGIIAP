import {
  Home, Map, FileText, Globe, Wrench, ClipboardList,
  LayoutGrid, Users, Building2, Shield,
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
// Sidebar navigation
// =====================================================

export const NAV_LINKS = [
  { label: 'Inicio', path: ROUTES.HOME, icon: Home },
  { label: 'Mapas', path: ROUTES.MAPAS, icon: Map },
  { label: 'Documentos', path: ROUTES.DOCUMENTOS, icon: FileText },
  { label: 'Geovisor', path: ROUTES.GEOVISOR, icon: Globe },
  { label: 'Herramientas', path: ROUTES.HERRAMIENTAS, icon: Wrench },
  { label: 'Solicitudes', path: ROUTES.SOLICITUDES, icon: ClipboardList },
]

// =====================================================
// Module cards (Home page — diseño Figma)
// =====================================================

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

// =====================================================
// Regional statistics (Home page — Cifras del Territorio)
// =====================================================

export const STATS = [
  { icon: LayoutGrid, value: '05', label: 'Departamentos' },
  { icon: Users, value: '1.2M', label: 'Población' },
  { icon: Building2, value: '124', label: 'Municipios' },
  { icon: Shield, value: '32', label: 'Áreas Protegidas' },
]

// =====================================================
// News articles (Home page)
// =====================================================

export const NEWS = [
  {
    id: 1,
    tag: 'ACTUALIZACIÓN DE DATOS',
    title: 'Publicada nueva capa cartográfica de Reservas Naturales de la Sociedad Civil 2024.',
    excerpt: 'La actualización incluye 14 nuevas reservas en el departamento del Chocó, sumando más de...',
    time: 'Hace 2 horas',
    author: 'Geoportal Regional',
  },
  {
    id: 2,
    tag: 'EVENTO REGIONAL',
    title: 'Encuentro de Planificadores Territoriales: Desafíos del cambio climático en el litoral Pacífico.',
    excerpt: 'Representantes de 4 departamentos se reunirán en Quibdó para unificar criterios de resiliencia...',
    time: 'Hace 1 día',
    author: 'Evento',
  },
]

// =====================================================
// System status (Home page widget)
// =====================================================

export const SYSTEM_STATUS = [
  { label: 'Capas Vectoriales', value: '452 Activadas' },
  { label: 'Uptime Geovisor', value: '99.8% Mensual' },
  { label: 'Sincronización SIG', value: 'Hace 15 min' },
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

// =====================================================
// Documentos module data
// =====================================================

export const DOC_CATEGORIES = [
  {
    id: 'protocolos',
    title: 'Protocolos Ambientales',
    subtitle: '12 documentos actualizados',
    icon: 'Waves',
    color: 'border-l-primary-800',
    docs: [
      {
        name: 'Protocolo_Monitoreo_Biodiversidad_V2.pdf',
        type: 'pdf',
        size: '4.2 MB',
        updated: '12 Oct 2023',
      },
      {
        name: 'Guía_Ética_Trabajo_Comunitario.docx',
        type: 'docx',
        size: '1.8 MB',
        updated: '05 Sep 2023',
      },
      {
        name: 'Protocolo_Muestreo_Suelos_V3.pdf',
        type: 'pdf',
        size: '3.1 MB',
        updated: '22 Ago 2023',
      },
      {
        name: 'Manual_Seguridad_Campo.pdf',
        type: 'pdf',
        size: '2.5 MB',
        updated: '14 Jul 2023',
      },
    ],
  },
  {
    id: 'formatos',
    title: 'Formatos y Plantillas',
    subtitle: '8 recursos disponibles',
    icon: 'FileInput',
    color: 'border-l-gold-400',
    docs: [
      {
        name: 'Formato_Captura_Datos_Campo_V4.xlsx',
        type: 'xlsx',
        size: '156 KB',
        updated: '10 Nov 2023',
      },
      {
        name: 'Plantilla_Informe_Técnico.docx',
        type: 'docx',
        size: '98 KB',
        updated: '08 Oct 2023',
      },
    ],
  },
  {
    id: 'guias',
    title: 'Guías Técnicas Geográficas',
    subtitle: '15 manuales detallados',
    icon: 'BookOpen',
    color: 'border-l-primary-500',
    docs: [
      {
        name: 'Guía_Uso_Geovisor_SIAT_PC.pdf',
        type: 'pdf',
        size: '4.2 MB',
        updated: '15 Nov 2023',
      },
      {
        name: 'Manual_PostGIS_Básico.pdf',
        type: 'pdf',
        size: '6.8 MB',
        updated: '20 Sep 2023',
      },
      {
        name: 'Guía_Procesamiento_Imágenes_Satelitales.pdf',
        type: 'pdf',
        size: '5.1 MB',
        updated: '03 Ago 2023',
      },
    ],
  },
  {
    id: 'estadisticos',
    title: 'Datos Estadísticos y Reportes',
    subtitle: '4 informes anuales',
    icon: 'TrendingUp',
    color: 'border-l-primary-300',
    docs: [
      {
        name: 'Estadísticas_Biodiversidad_2023.xlsx',
        type: 'xlsx',
        size: '2.8 MB',
        updated: '20 Dic 2023',
      },
      {
        name: 'Reporte_Anual_Deforestación_Chocó.pdf',
        type: 'pdf',
        size: '7.4 MB',
        updated: '15 Dic 2023',
      },
    ],
  },
]

// =====================================================
// Solicitudes module data
// =====================================================

export const SOLICITUDES_KPIS = [
  { label: 'Total Activas', value: '124' },
  { label: 'En Revisión', value: '32' },
  { label: 'Aprobadas', value: '89%' },
  { label: 'Tiempo Promedio', value: '5.2d' },
]

export const SOLICITUDES_TABLE = [
  {
    id: '#VIG-2024-089',
    tipo: 'Certificado de Uso de Suelo',
    subtipo: 'Predio rural - Quibdó',
    fecha: '12 Oct 2023',
    estado: 'En Proceso',
    estadoColor: 'yellow',
  },
  {
    id: '#VIG-2024-085',
    tipo: 'Consulta de Linderos',
    subtipo: 'Resguardo Indígena',
    fecha: '10 Oct 2023',
    estado: 'Aprobado',
    estadoColor: 'green',
  },
  {
    id: '#VIG-2024-082',
    tipo: 'Estudio Técnico Ambiental',
    subtipo: 'Zona de Protección',
    fecha: '08 Oct 2023',
    estado: 'Rechazado',
    estadoColor: 'red',
  },
  {
    id: '#VIG-2024-079',
    tipo: 'Validación Cartográfica',
    subtipo: 'Cuenca Media Atrato',
    fecha: '05 Oct 2023',
    estado: 'En Proceso',
    estadoColor: 'yellow',
  },
]

export const TRAMITE_TYPES = [
  { value: '', label: 'Seleccione una opción' },
  { value: 'uso-suelo', label: 'Certificado de Uso de Suelo' },
  { value: 'linderos', label: 'Consulta de Linderos' },
  { value: 'estudio-ambiental', label: 'Estudio Técnico Ambiental' },
  { value: 'validacion', label: 'Validación Cartográfica' },
  { value: 'aprovechamiento', label: 'Permiso de Aprovechamiento Forestal' },
  { value: 'otro', label: 'Otro' },
]