import { BookOpen, ChevronRight } from 'lucide-react'
import Card3D from '@/components/ui/Card3D'
import { EASE_OUT_EXPO } from '@/lib/animations'

const SECTIONS = [
  { title: 'Primeros Pasos', description: 'Cómo acceder al sistema, configurar su perfil y personalizar su experiencia en VIGIA-IIAP.' },
  { title: 'Módulo de Mapas', description: 'Buscar, filtrar y descargar cartografía temática. Uso de formatos y visualización en el Geovisor.' },
  { title: 'Centro de Documentos', description: 'Navegación por categorías, búsqueda avanzada y descarga de protocolos y guías técnicas.' },
  { title: 'Geovisor SIAT-PC', description: 'Capas de información, herramientas de medición, exportación y cambio de estilos de mapa.' },
  { title: 'Herramientas SIG', description: 'Calculadora de áreas, generador de buffers, conversor de coordenadas y analizador de superposición.' },
  { title: 'Solicitudes y Trámites', description: 'Cómo crear solicitudes, hacer seguimiento y descargar formatos oficiales.' },
]

export default function GuiaUsuario() {
  return (
    <div className="space-y-8">
      <div>
        <span className="page-header-tag block mb-2">Recursos</span>
        <h1 className="page-header-title mb-3">Guía de Usuario</h1>
        <p className="page-header-description max-w-2xl">
          Manual completo del sistema VIGIA-IIAP. Aprenda a utilizar todas las herramientas
          y módulos disponibles para la gestión territorial del Chocó Biogeográfico.
        </p>
      </div>

      <div className="space-y-3">
        {SECTIONS.map((section, i) => (
          <Card3D
            key={section.title}
            initial={{ opacity: 0, y: 20, rotateX: 5, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  rotateX: 0, scale: 1    }}
            transition={{ delay: i * 0.05, duration: 0.45, ease: EASE_OUT_EXPO }}
            style={{ transformPerspective: 900 }}
            glow="rgba(26,86,50,0.14)"
            intensity={4}
            className="bg-white border border-border/70 rounded-xl p-5 flex items-center gap-4 cursor-pointer"
            whileHover={{ y: -3 }}
          >
            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-primary-800" />
            </div>
            <div className="flex-1">
              <h3 className="card-title text-text mb-0.5">{section.title}</h3>
              <p className="card-text">{section.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-text-muted shrink-0" />
          </Card3D>
        ))}
      </div>
    </div>
  )
}