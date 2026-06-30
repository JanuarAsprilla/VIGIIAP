import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { fadeUp } from '@/lib/animations'
import Card3D from '@/components/ui/Card3D'

export function AyudaCTA() {
  return (
    <Card3D
      {...fadeUp(0.35)}
      glow="rgba(26,86,50,0.16)"
      intensity={3}
      className="bg-primary-50 border border-primary-200 rounded-xl p-5"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <h4 className="text-sm font-bold text-primary-900 mb-1.5">¿Necesitas ayuda técnica?</h4>
      <p className="text-xs text-primary-800/70 leading-relaxed mb-3">
        Nuestro equipo de soporte especializado está disponible para
        guiarte en trámites complejos.
      </p>
      <Link
        to="/guia-usuario"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-800 no-underline hover:text-primary-600 transition-colors"
      >
        Consultar Guía Técnica
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </Card3D>
  )
}
