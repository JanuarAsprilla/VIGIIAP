import { motion } from 'framer-motion'
import { Headphones } from 'lucide-react'
import { fadeUp } from './documentos.constants'

export function SupportCTA({ onContactar }) {
  return (
    <motion.div
      {...(fadeUp(0.5) as any)}
      className="grid grid-cols-1 md:grid-cols-2 rounded-2xl overflow-hidden"
    >
      <div className="bg-primary-100 p-8 flex flex-col justify-center">
        <h3 className="font-display text-2xl font-bold text-primary-900 leading-tight mb-3">
          ¿Necesita soporte documental?
        </h3>
        <p className="text-sm text-primary-800/70 leading-relaxed mb-6">
          Si no encuentra el documento o formato requerido para sus operaciones
          técnicas, contacte con nuestra oficina de gestión de datos.
        </p>
        <div>
          <button
            onClick={onContactar}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-primary-900 rounded-lg text-sm font-semibold hover:bg-primary-800 hover:text-white transition-colors border border-primary-200"
          >
            <Headphones className="w-4 h-4" aria-hidden="true" />
            Contactar Soporte
          </button>
        </div>
      </div>
      <div className="bg-gradient-to-br from-bg-alt to-border min-h-[200px] hidden md:block" />
    </motion.div>
  )
}
