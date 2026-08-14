import { Map, FileText, Globe, Wrench, ClipboardList } from 'lucide-react'

export const ALL_MODULES = [
  {
    id: 'mapas', title: 'Catálogo de Mapas',
    description: 'Mapas temáticos de biodiversidad, suelos, hidrografía y cobertura vegetal del Chocó Biogeográfico producidos por el IIAP.',
    icon: Map, path: '/mapas', action: 'Explorar mapas', tag: 'Cartografía',
    gradient: 'from-[#1A5632] to-[#284E39]', chip: 'bg-primary-50 text-primary-800',
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
    id: 'geovisor', title: 'Geovisor Interactivo',
    description: 'Herramienta SIG en línea para la visualización y análisis de capas geoespaciales sobre el territorio del Chocó Biogeográfico.',
    icon: Globe, path: '/geovisor', action: 'Abrir geovisor', tag: 'SIG',
    gradient: 'from-[#1A5632] to-[#218842]', chip: 'bg-primary-50 text-primary-800',
    glow: 'rgba(26,86,50,0.22)', ctaColor: '#1A5632', publicAccess: false,
  },
  {
    id: 'herramientas', title: 'Herramientas SIG',
    description: 'Calculadoras de área, convertidores de coordenadas y motores de análisis espacial para procesamiento de datos geográficos.',
    icon: Wrench, path: '/herramientas', action: 'Usar herramientas', tag: 'Análisis',
    gradient: 'from-[#B0CB1F] to-[#218842]', chip: 'bg-lime-50 text-lime-800',
    glow: 'rgba(176,203,31,0.22)', ctaColor: '#6B8A0C', publicAccess: false,
  },
  {
    id: 'solicitudes', title: 'Solicitudes de Acceso',
    description: 'Gestiona solicitudes de acceso a datos, información especializada y colaboración con el IIAP.',
    icon: ClipboardList, path: '/solicitudes', action: 'Gestionar solicitudes', tag: 'Gestión',
    gradient: 'from-[#284E39] to-[#1A5632]', chip: 'bg-primary-50 text-primary-800',
    glow: 'rgba(40,78,57,0.22)', ctaColor: '#1A5632', publicAccess: false,
  },
]
