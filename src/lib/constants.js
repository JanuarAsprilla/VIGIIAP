import {
  Home, Map, FileText, Globe, Wrench, ClipboardList, Newspaper,
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
  { label: 'Inicio',       path: ROUTES.HOME,         icon: Home },
  { label: 'Mapas',        path: ROUTES.MAPAS,        icon: Map },
  { label: 'Documentos',   path: ROUTES.DOCUMENTOS,   icon: FileText },
  { label: 'Geovisor',     path: ROUTES.GEOVISOR,     icon: Globe },
  { label: 'Herramientas', path: ROUTES.HERRAMIENTAS, icon: Wrench },
  { label: 'Solicitudes',  path: ROUTES.SOLICITUDES,  icon: ClipboardList },
  { label: 'Noticias',     path: '/noticias',          icon: Newspaper },
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
    slug: 'nueva-capa-reservas-naturales-2024',
    tag: 'ACTUALIZACIÓN DE DATOS',
    title: 'Publicada nueva capa cartográfica de Reservas Naturales de la Sociedad Civil 2024.',
    excerpt: 'La actualización incluye 14 nuevas reservas en el departamento del Chocó, sumando más de...',
    time: 'Hace 2 horas',
    author: 'Geoportal Regional',
  },
  {
    id: 2,
    slug: 'encuentro-planificadores-territoriales',
    tag: 'EVENTO REGIONAL',
    title: 'Encuentro de Planificadores Territoriales: Desafíos del cambio climático en el litoral Pacífico.',
    excerpt: 'Representantes de 4 departamentos se reunirán en Quibdó para unificar criterios de resiliencia...',
    time: 'Hace 1 día',
    author: 'Evento',
  },
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
  { value: 'pdf', label: 'PDF' },
  { value: 'img', label: 'Imagen' },
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
    categoryKey: 'cobertura',
    category: 'Cobertura Vegetal',
    department: 'choco',
    year: '2023',
    title: 'Mapa de Cobertura Vegetal y Uso de la Tierra',
    excerpt: 'Análisis detallado de los estratos vegetales del Chocó con clasificación por tipo de cobertura.',
    formats: ['PDF', 'IMG'],
    badge: 'PDF',
    badgeColor: 'primary',
    date: 'Sep 2023',
    geovisorLink: '/geovisor',
  },
  {
    id: 'MAPA_REF_02',
    categoryKey: 'hidrologia',
    category: 'Hidrología',
    department: 'choco',
    year: '2024',
    title: 'Cuenca del Río Atrato: Dinámica Fluvial',
    excerpt: 'Cartografía multitemporal de la red hídrica principal y sus afluentes en la cuenca del Atrato.',
    formats: ['PDF', 'IMG'],
    badge: 'PDF + IMG',
    badgeColor: 'primary',
    date: 'Jun 2024',
    geovisorLink: '/geovisor',
  },
  {
    id: 'MAPA_REF_03',
    categoryKey: 'planificacion',
    category: 'Planificación',
    department: 'narino',
    year: '2023',
    title: 'Mapa de Conflictos de Uso del Suelo 2023',
    excerpt: 'Identificación de áreas con sobreuso y subuso del suelo en municipios del Pacífico colombiano.',
    formats: ['PDF', 'IMG'],
    badge: 'PDF',
    badgeColor: 'primary',
    date: 'Ene 2024',
    geovisorLink: '/geovisor',
  },
  {
    id: 'MAPA_REF_04',
    categoryKey: 'ecosistemas',
    category: 'Ecosistemas',
    department: 'valle',
    year: '2024',
    title: 'Zonificación Ambiental del Pacífico Norte',
    excerpt: 'Delimitación de áreas de conservación y uso sostenible con criterios ambientales integrados.',
    formats: ['PDF', 'IMG'],
    badge: 'IMG',
    badgeColor: 'orange',
    date: 'Mar 2024',
    geovisorLink: '/geovisor',
  },
  {
    id: 'MAPA_REF_05',
    categoryKey: 'hidrologia',
    category: 'Hidrología',
    department: 'choco',
    year: '2024',
    title: 'Red Hídrica y Cuencas Hidrográficas Sector Atrato',
    excerpt: 'Mapeo completo de ríos tributarios y microcuencas del sector medio y bajo del río Atrato.',
    formats: ['PDF'],
    badge: 'PDF',
    badgeColor: 'primary',
    date: 'Abr 2024',
    geovisorLink: '/geovisor',
  },
  {
    id: 'MAPA_REF_06',
    categoryKey: 'planificacion',
    category: 'Planificación',
    department: 'cauca',
    year: '2024',
    title: 'Áreas de Reserva Forestal del Pacífico',
    excerpt: 'Cartografía oficial de las zonas de reserva forestal con delimitación legal actualizada.',
    formats: ['PDF', 'IMG'],
    badge: 'PDF + IMG',
    badgeColor: 'primary',
    date: 'Feb 2024',
    geovisorLink: '/geovisor',
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
        dateISO: '2023-10-12',
        url: null,
      },
      {
        name: 'Guía_Ética_Trabajo_Comunitario.docx',
        type: 'docx',
        size: '1.8 MB',
        updated: '05 Sep 2023',
        dateISO: '2023-09-05',
        url: null,
      },
      {
        name: 'Protocolo_Muestreo_Suelos_V3.pdf',
        type: 'pdf',
        size: '3.1 MB',
        updated: '22 Ago 2023',
        dateISO: '2023-08-22',
        url: null,
      },
      {
        name: 'Manual_Seguridad_Campo.pdf',
        type: 'pdf',
        size: '2.5 MB',
        updated: '14 Jul 2023',
        dateISO: '2023-07-14',
        url: null,
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
        dateISO: '2023-11-10',
        url: null,
      },
      {
        name: 'Plantilla_Informe_Técnico.docx',
        type: 'docx',
        size: '98 KB',
        updated: '08 Oct 2023',
        dateISO: '2023-10-08',
        url: null,
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
        dateISO: '2023-11-15',
        url: null,
      },
      {
        name: 'Manual_PostGIS_Básico.pdf',
        type: 'pdf',
        size: '6.8 MB',
        updated: '20 Sep 2023',
        dateISO: '2023-09-20',
        url: null,
      },
      {
        name: 'Guía_Procesamiento_Imágenes_Satelitales.pdf',
        type: 'pdf',
        size: '5.1 MB',
        updated: '03 Ago 2023',
        dateISO: '2023-08-03',
        url: null,
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
        dateISO: '2023-12-20',
        url: null,
      },
      {
        name: 'Reporte_Anual_Deforestación_Chocó.pdf',
        type: 'pdf',
        size: '7.4 MB',
        updated: '15 Dic 2023',
        dateISO: '2023-12-15',
        url: null,
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
    solicitante: 'Comunidad Negra Río Baudó',
    notas: 'Pendiente de visita técnica programada para el 20 de octubre.',
    timeline: ['Recibida', 'En Revisión', 'En Proceso'],
  },
  {
    id: '#VIG-2024-085',
    tipo: 'Consulta de Linderos',
    subtipo: 'Resguardo Indígena',
    fecha: '10 Oct 2023',
    estado: 'Aprobado',
    estadoColor: 'green',
    solicitante: 'Cabildo Indígena Wounaan',
    notas: 'Linderos validados cartográficamente. Certificado disponible para descarga.',
    timeline: ['Recibida', 'En Revisión', 'En Proceso', 'Aprobado'],
  },
  {
    id: '#VIG-2024-082',
    tipo: 'Estudio Técnico Ambiental',
    subtipo: 'Zona de Protección',
    fecha: '08 Oct 2023',
    estado: 'Rechazado',
    estadoColor: 'red',
    solicitante: 'Empresa Maderas del Pacífico S.A.',
    notas: 'Rechazado por superposición con área protegida. Puede presentar una nueva solicitud con ajustes al polígono.',
    timeline: ['Recibida', 'En Revisión', 'Rechazado'],
  },
  {
    id: '#VIG-2024-079',
    tipo: 'Validación Cartográfica',
    subtipo: 'Cuenca Media Atrato',
    fecha: '05 Oct 2023',
    estado: 'En Proceso',
    estadoColor: 'yellow',
    solicitante: 'Gobernación del Chocó',
    notas: 'En proceso de verificación con datos IGAC. Tiempo estimado: 5 días hábiles.',
    timeline: ['Recibida', 'En Revisión', 'En Proceso'],
  },
  {
    id: '#VIG-2024-074',
    tipo: 'Permiso de Aprovechamiento Forestal',
    subtipo: 'Bosque secundario - Riosucio',
    fecha: '01 Oct 2023',
    estado: 'Aprobado',
    estadoColor: 'green',
    solicitante: 'Asociación Agroforestal Pacífico',
    notas: 'Permiso otorgado por 12 meses con cuota máxima de 80 m³.',
    timeline: ['Recibida', 'En Revisión', 'En Proceso', 'Aprobado'],
  },
  {
    id: '#VIG-2024-071',
    tipo: 'Consulta de Linderos',
    subtipo: 'Área Urbana - Istmina',
    fecha: '28 Sep 2023',
    estado: 'En Proceso',
    estadoColor: 'yellow',
    solicitante: 'Alcaldía Municipal de Istmina',
    notas: 'Solicitud en cruce con base catastral municipal. Requiere georreferenciación adicional.',
    timeline: ['Recibida', 'En Revisión', 'En Proceso'],
  },
  {
    id: '#VIG-2024-068',
    tipo: 'Estudio Técnico Ambiental',
    subtipo: 'Humedal Costero - Bahía Solano',
    fecha: '25 Sep 2023',
    estado: 'Aprobado',
    estadoColor: 'green',
    solicitante: 'Instituto de Investigaciones del Pacífico',
    notas: 'Estudio aprobado. Informe final publicado en el repositorio IIAP.',
    timeline: ['Recibida', 'En Revisión', 'En Proceso', 'Aprobado'],
  },
  {
    id: '#VIG-2024-063',
    tipo: 'Certificado de Uso de Suelo',
    subtipo: 'Zona industrial - Quibdó',
    fecha: '20 Sep 2023',
    estado: 'Rechazado',
    estadoColor: 'red',
    solicitante: 'Constructora Pacífico Verde Ltda.',
    notas: 'Zona declarada de conservación hídrica. No compatible con uso industrial solicitado.',
    timeline: ['Recibida', 'En Revisión', 'Rechazado'],
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

// =====================================================
// Noticias (full data for listing + detail)
// =====================================================

// =====================================================
// Nuevo Análisis modal — tipos y áreas
// =====================================================

export const ANALYSIS_TYPES = [
  { value: '', label: 'Seleccione un tipo' },
  { value: 'cobertura', label: 'Cobertura Vegetal' },
  { value: 'hidrologia', label: 'Análisis Hidrológico' },
  { value: 'biodiversidad', label: 'Biodiversidad y Especies' },
  { value: 'conflictos', label: 'Conflictos de Uso del Suelo' },
  { value: 'zonificacion', label: 'Zonificación Ambiental' },
  { value: 'otro', label: 'Otro' },
]

export const ANALYSIS_DEPARTMENTS = [
  { value: '', label: 'Todo el Chocó Biogeográfico' },
  { value: 'choco', label: 'Chocó' },
  { value: 'valle', label: 'Valle del Cauca' },
  { value: 'cauca', label: 'Cauca' },
  { value: 'narino', label: 'Nariño' },
]

// =====================================================
// Noticias (full data for listing + detail)
// =====================================================

export const ALL_NEWS = [
  {
    id: 1,
    slug: 'nueva-capa-reservas-naturales-2024',
    tag: 'ACTUALIZACIÓN DE DATOS',
    tagColor: 'primary',
    title: 'Publicada nueva capa cartográfica de Reservas Naturales de la Sociedad Civil 2024.',
    excerpt: 'La actualización incluye 14 nuevas reservas en el departamento del Chocó, sumando más de...',
    content: 'La actualización incluye 14 nuevas reservas en el departamento del Chocó, sumando más de 45,000 hectáreas al inventario de áreas protegidas de la sociedad civil. Esta nueva capa cartográfica permite identificar con precisión los límites de cada reserva, facilitando los procesos de planificación territorial y monitoreo ambiental.\n\nEl equipo técnico del IIAP realizó el levantamiento de información en campo durante los meses de agosto y septiembre de 2024, utilizando equipos GPS de alta precisión y verificando los límites con las comunidades locales.\n\nLa capa está disponible para descarga en formato PDF e imagen desde el Repositorio de Mapas, y puede visualizarse interactivamente en el Geovisor SIAT-PC.',
    time: 'Hace 2 horas',
    date: '01 Abril 2026',
    author: 'Geoportal Regional',
    category: 'Ambiente',
  },
  {
    id: 2,
    slug: 'encuentro-planificadores-territoriales',
    tag: 'EVENTO REGIONAL',
    tagColor: 'gold',
    title: 'Encuentro de Planificadores Territoriales: Desafíos del cambio climático en el litoral Pacífico.',
    excerpt: 'Representantes de 4 departamentos se reunirán en Quibdó para unificar criterios de resiliencia...',
    content: 'Representantes de los departamentos de Chocó, Valle del Cauca, Cauca y Nariño se reunirán en la ciudad de Quibdó los días 15 y 16 de abril de 2026 para unificar criterios de resiliencia climática en la planificación territorial del litoral Pacífico colombiano.\n\nEl encuentro, organizado por el IIAP en coordinación con el Ministerio de Ambiente y Desarrollo Sostenible, abordará temas como la gestión del riesgo por inundaciones, la erosión costera y la protección de manglares como barreras naturales.\n\nSe espera la participación de más de 120 planificadores territoriales, funcionarios ambientales y líderes comunitarios de la región.',
    time: 'Hace 1 día',
    date: '31 Marzo 2026',
    author: 'Coordinación de Eventos IIAP',
    category: 'Social',
  },
  {
    id: 3,
    slug: 'lanzamiento-geoportal-biodiversidad',
    tag: 'TECNOLOGÍA',
    tagColor: 'primary',
    title: 'Lanzamiento del nuevo Geoportal de Biodiversidad del Chocó Biogeográfico.',
    excerpt: 'Nuevas capas de información geográfica ahora disponibles para consulta pública con datos actualizados...',
    content: 'El Instituto de Investigaciones Ambientales del Pacífico lanza oficialmente el Geoportal de Biodiversidad, una herramienta que integra más de 200 capas de información geográfica sobre la diversidad biológica del Chocó Biogeográfico.\n\nEl geoportal incluye datos de distribución de especies endémicas, áreas de importancia para la conservación, corredores biológicos y zonas de amortiguamiento. Toda la información está disponible para consulta pública y descarga.\n\nEste desarrollo representa un avance significativo en la democratización de la información ambiental de la región.',
    time: 'Hace 3 días',
    date: '29 Marzo 2026',
    author: 'Laboratorio de Datos IIAP',
    category: 'Ambiente',
  },
  {
    id: 4,
    slug: 'taller-herramientas-sig-comunidades',
    tag: 'CAPACITACIÓN',
    tagColor: 'gold',
    title: 'Taller de Herramientas SIG para comunidades del medio Atrato.',
    excerpt: 'Capacitación técnica en el uso de mapas digitales para líderes comunitarios del Chocó...',
    content: 'El IIAP realizó con éxito el taller de capacitación en Herramientas SIG dirigido a 35 líderes comunitarios del medio Atrato. Los participantes aprendieron a utilizar el Geovisor SIAT-PC para consultar información territorial de sus comunidades.\n\nEl taller incluyó módulos prácticos sobre lectura de mapas digitales, uso de coordenadas GPS y generación de reportes territoriales básicos.\n\nEsta iniciativa forma parte del programa de transferencia tecnológica del instituto, que busca empoderar a las comunidades locales en la gestión de su territorio.',
    time: 'Hace 5 días',
    date: '27 Marzo 2026',
    author: 'Programa de Extensión IIAP',
    category: 'Social',
  },
  {
    id: 5,
    slug: 'actualizacion-datos-hidrograficos',
    tag: 'ACTUALIZACIÓN DE DATOS',
    tagColor: 'primary',
    title: 'Actualización de la red hidrográfica del Pacífico colombiano con datos 2025-2026.',
    excerpt: 'Se incorporan más de 1,200 nuevos tramos de ríos y quebradas al sistema de información...',
    content: 'El equipo de hidrografía del IIAP completó la actualización de la red hidrográfica del Pacífico colombiano, incorporando más de 1,200 nuevos tramos de ríos y quebradas identificados mediante imágenes satelitales de alta resolución.\n\nLa actualización mejora significativamente la precisión de la cartografía hídrica de la región y permite una mejor planificación de proyectos de acueducto rural, manejo de cuencas y prevención de inundaciones.\n\nLos datos están disponibles para consulta en el Geovisor y descarga desde el Repositorio de Mapas.',
    time: 'Hace 1 semana',
    date: '25 Marzo 2026',
    author: 'Equipo de Hidrografía IIAP',
    category: 'Ambiente',
  },
]


// =====================================================
// Admin Panel — mock data (Fase 2: reemplazar con API)
// =====================================================

export const ADMIN_MOCK_USERS = [
  { id: 'USR-001', nombre: 'Admin IIAP',           correo: 'admin@iiap.org.co',          rol: 'Administrador SIG', estado: 'Activo',   ultimoAcceso: '08 Abr 2026', initials: 'AI' },
  { id: 'USR-002', nombre: 'Carlos Rentería',       correo: 'carlos@iiap.org.co',         rol: 'Administrador SIG', estado: 'Activo',   ultimoAcceso: '07 Abr 2026', initials: 'CR' },
  { id: 'USR-003', nombre: 'Analista Territorial',  correo: 'investigador@iiap.org.co',   rol: 'Investigador',      estado: 'Activo',   ultimoAcceso: '08 Abr 2026', initials: 'AT' },
  { id: 'USR-004', nombre: 'María Valencia',        correo: 'maria@iiap.org.co',          rol: 'Investigador',      estado: 'Activo',   ultimoAcceso: '07 Abr 2026', initials: 'MV' },
  { id: 'USR-005', nombre: 'Jorge Mena',            correo: 'jorge@iiap.org.co',          rol: 'Investigador',      estado: 'Activo',   ultimoAcceso: '06 Abr 2026', initials: 'JM' },
  { id: 'USR-006', nombre: 'Liliana Palacios',      correo: 'liliana@iiap.org.co',        rol: 'Investigador',      estado: 'Activo',   ultimoAcceso: '05 Abr 2026', initials: 'LP' },
  { id: 'USR-007', nombre: 'Sandra Córdoba',        correo: 'sandra@iiap.org.co',         rol: 'Público',           estado: 'Activo',   ultimoAcceso: '04 Abr 2026', initials: 'SC' },
  { id: 'USR-008', nombre: 'Roberto Asprilla',      correo: 'roberto@iiap.org.co',        rol: 'Público',           estado: 'Activo',   ultimoAcceso: '02 Abr 2026', initials: 'RA' },
  { id: 'USR-009', nombre: 'Pedro Mosquera',        correo: 'pedro@iiap.org.co',          rol: 'Público',           estado: 'Inactivo', ultimoAcceso: '01 Mar 2026', initials: 'PM' },
]

export const ADMIN_ACTIVITY_LOG = [
  { id: 1,  usuario: 'Admin IIAP',          initials: 'AI', accion: 'Aprobó solicitud',      detalle: '#VIG-2024-085 — Consulta de Linderos',        modulo: 'Solicitudes', fecha: '08 Abr 2026', hora: '10:32', tipo: 'success' },
  { id: 2,  usuario: 'Admin IIAP',          initials: 'AI', accion: 'Publicó noticia',        detalle: 'Expansión del SINAP en el Chocó',              modulo: 'Noticias',    fecha: '08 Abr 2026', hora: '09:15', tipo: 'info'    },
  { id: 3,  usuario: 'María Valencia',      initials: 'MV', accion: 'Creó solicitud',         detalle: '#VIG-2024-090 — Validación Cartográfica',      modulo: 'Solicitudes', fecha: '07 Abr 2026', hora: '16:48', tipo: 'info'    },
  { id: 4,  usuario: 'Admin IIAP',          initials: 'AI', accion: 'Rechazó solicitud',      detalle: '#VIG-2024-082 — Estudio Técnico Ambiental',    modulo: 'Solicitudes', fecha: '07 Abr 2026', hora: '14:20', tipo: 'error'   },
  { id: 5,  usuario: 'Carlos Rentería',     initials: 'CR', accion: 'Actualizó rol',          detalle: 'Jorge Mena → Investigador',                    modulo: 'Usuarios',    fecha: '06 Abr 2026', hora: '11:05', tipo: 'warning' },
  { id: 6,  usuario: 'Analista Territorial',initials: 'AT', accion: 'Descargó documento',    detalle: 'Protocolo_Monitoreo_Flora_2025.pdf',           modulo: 'Documentos',  fecha: '05 Abr 2026', hora: '15:30', tipo: 'info'    },
  { id: 7,  usuario: 'Sandra Córdoba',      initials: 'SC', accion: 'Inició sesión',          detalle: '',                                             modulo: 'Auth',        fecha: '05 Abr 2026', hora: '08:30', tipo: 'info'    },
  { id: 8,  usuario: 'Admin IIAP',          initials: 'AI', accion: 'Cargó documento',        detalle: 'Mapa_Cobertura_Vegetal_2026.pdf',              modulo: 'Documentos',  fecha: '04 Abr 2026', hora: '15:22', tipo: 'info'    },
  { id: 9,  usuario: 'Carlos Rentería',     initials: 'CR', accion: 'Creó usuario',           detalle: 'Liliana Palacios — Investigador',               modulo: 'Usuarios',    fecha: '03 Abr 2026', hora: '09:00', tipo: 'success' },
  { id: 10, usuario: 'Admin IIAP',          initials: 'AI', accion: 'Desactivó usuario',      detalle: 'Pedro Mosquera',                               modulo: 'Usuarios',    fecha: '01 Mar 2026', hora: '10:00', tipo: 'warning' },
  { id: 11, usuario: 'Analista Territorial',initials: 'AT', accion: 'Ejecutó análisis',       detalle: 'Buffer 500m — Cuenca Atrato',                  modulo: 'Herramientas',fecha: '28 Mar 2026', hora: '14:10', tipo: 'info'    },
  { id: 12, usuario: 'Admin IIAP',          initials: 'AI', accion: 'Actualizó configuración',detalle: 'Tiempo de sesión → 8h',                        modulo: 'Sistema',     fecha: '25 Mar 2026', hora: '11:30', tipo: 'warning' },
]

export const ADMIN_DASHBOARD_KPIS = [
  { label: 'Usuarios Registrados', value: 9,   trend: '+2 este mes',  trendUp: true  },
  { label: 'Solicitudes Pendientes', value: 3, trend: '-1 vs ayer',   trendUp: false },
  { label: 'Documentos Activos',   value: 24,  trend: '+3 esta semana', trendUp: true },
  { label: 'Noticias Publicadas',  value: 5,   trend: '+1 hoy',       trendUp: true  },
]
