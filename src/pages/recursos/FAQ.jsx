import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, ChevronDown } from 'lucide-react'

const FAQS = [
  { q: '¿Cómo puedo solicitar acceso al sistema?', a: 'Desde la pantalla de inicio de sesión, haga clic en "Solicitar Acceso" y complete el formulario. Un administrador revisará su solicitud y le enviará las credenciales por correo electrónico.' },
  { q: '¿En qué formatos puedo descargar los mapas?', a: 'Los mapas están disponibles en formato PDF e Imagen. También puede visualizarlos directamente en el Geovisor interactivo.' },
  { q: '¿Cómo funciona el Geovisor?', a: 'El Geovisor permite visualizar capas de información territorial con controles de zoom, búsqueda por coordenadas, herramientas de medición y diferentes estilos de mapa base.' },
  { q: '¿Cuánto tarda una solicitud de trámite?', a: 'El tiempo promedio de respuesta es de 5.2 días hábiles, dependiendo del tipo de trámite y la complejidad de la solicitud.' },
  { q: '¿Puedo usar las herramientas SIG sin iniciar sesión?', a: 'Las herramientas de visualización están disponibles para todos. Sin embargo, para guardar resultados y acceder a funciones avanzadas es necesario iniciar sesión.' },
  { q: '¿Cómo contacto al soporte técnico?', a: 'Puede comunicarse con el equipo de soporte a través del módulo de Documentos (sección "Soporte Documental") o escribiendo directamente a info@iiap.org.co.' },
]

function FAQItem({ faq, index }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white border border-border rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-bg-alt/50 transition-colors"
      >
        <HelpCircle className="w-5 h-5 text-primary-700 shrink-0" />
        <span className="flex-1 text-[0.95rem] font-semibold text-text">{faq.q}</span>
        <ChevronDown className={`w-5 h-5 text-text-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 pl-14">
              <p className="card-text leading-relaxed">{faq.a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function FAQ() {
  return (
    <div className="space-y-8">
      <div>
        <span className="page-header-tag block mb-2">Recursos</span>
        <h1 className="page-header-title mb-3">Preguntas Frecuentes</h1>
        <p className="page-header-description max-w-2xl">
          Respuestas a las consultas más comunes sobre el uso del sistema VIGIIAP.
        </p>
      </div>
      <div className="space-y-3">
        {FAQS.map((faq, i) => (
          <FAQItem key={i} faq={faq} index={i} />
        ))}
      </div>
    </div>
  )
}