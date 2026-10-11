import { Map, FileText, Globe, Wrench, ClipboardList } from 'lucide-react'

// REGRESIÓN (revisión de diseño): mapas, geovisores y solicitudes usaban
// variantes casi idénticas del mismo verde institucional -- en la vitrina
// de 5 módulos (Home#ModuleShowcaseSection), "Explorar mapas" y "Abrir
// geovisores" terminaban viéndose como el mismo botón. Cada módulo ahora
// tiene un acento claramente distinto tomado de la paleta oficial IIAP
// (la misma que documentos.constants.ts#CATEGORY_COLORS), para que los 5
// se puedan diferenciar de un vistazo.
export const ALL_MODULES = [
  {
    id: 'mapas', title: 'Catálogo de Mapas',
    description: 'Mapas temáticos de biodiversidad, suelos, hidrografía y cobertura vegetal del Chocó Biogeográfico producidos por el IIAP.',
    icon: Map, path: '/mapas', action: 'Explorar mapas', tag: 'Cartografía',
    gradient: 'from-[#1A5632] to-[#218842]', chip: 'bg-primary-50 text-primary-800',
    glow: 'rgba(26,86,50,0.28)', ctaColor: '#1A5632', publicAccess: true,
  },
  {
    id: 'documentos', title: 'Biblioteca Documental',
    description: 'Informes técnicos, investigaciones científicas, protocolos ambientales y documentos institucionales del IIAP.',
    icon: FileText, path: '/documentos', action: 'Consultar biblioteca', tag: 'Documentos',
    gradient: 'from-[#F08143] to-[#F7AC42]', chip: 'bg-amber-50 text-amber-800',
    glow: 'rgba(247,172,66,0.28)', ctaColor: '#C45A1A', publicAccess: true,
  },
  {
    id: 'geovisores', title: 'Geovisores',
    description: 'Herramienta SIG en línea para la visualización y análisis de capas geoespaciales sobre el territorio del Chocó Biogeográfico.',
    icon: Globe, path: '/geovisores', action: 'Abrir geovisores', tag: 'SIG',
    gradient: 'from-[#E95B8C] to-[#F18A87]', chip: 'bg-rose-50 text-rose-800',
    glow: 'rgba(233,91,140,0.26)', ctaColor: '#D1447A', publicAccess: false,
  },
  {
    id: 'herramientas', title: 'Herramientas SIG',
    description: 'Calculadoras de área, convertidores de coordenadas y motores de análisis espacial para procesamiento de datos geográficos.',
    icon: Wrench, path: '/herramientas', action: 'Usar herramientas', tag: 'Análisis',
    gradient: 'from-[#B0CB1F] to-[#FFF383]', chip: 'bg-lime-50 text-lime-800',
    glow: 'rgba(176,203,31,0.24)', ctaColor: '#6B8A0C', publicAccess: false,
  },
  {
    id: 'solicitudes', title: 'Solicitudes de Acceso',
    description: 'Gestiona solicitudes de acceso a datos, información especializada y colaboración con el IIAP.',
    icon: ClipboardList, path: '/solicitudes', action: 'Gestionar solicitudes', tag: 'Gestión',
    gradient: 'from-[#C12A2B] to-[#E51A4B]', chip: 'bg-red-50 text-red-800',
    glow: 'rgba(193,42,43,0.26)', ctaColor: '#C12A2B', publicAccess: false,
  },
]
