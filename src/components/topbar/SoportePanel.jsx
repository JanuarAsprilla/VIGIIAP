import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Mail, Phone, Clock, ExternalLink } from 'lucide-react'
import { panelAnim } from './panelAnim'

export default function SoportePanel({ onClose }) {
  return (
    <motion.div
      {...panelAnim}
      className="absolute top-full right-0 mt-2 w-72 bg-white border border-border rounded-xl shadow-float overflow-hidden z-50"
    >
      <div className="px-4 py-3 border-b border-border bg-primary-50">
        <p className="text-sm font-bold text-primary-900">Centro de Soporte IIAP</p>
        <p className="text-xs text-primary-800/70 mt-0.5">Lun–Vie · 8:00 AM – 5:00 PM</p>
      </div>

      <div className="p-4 space-y-3">
        <a
          href="mailto:soportegis@iiap.org.co"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-alt transition-colors no-underline group"
        >
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4 text-primary-800" />
          </div>
          <div>
            <span className="block text-sm font-semibold text-text group-hover:text-primary-800 transition-colors">
              soportegis@iiap.org.co
            </span>
            <span className="block text-xs text-text-muted">Correo electrónico</span>
          </div>
        </a>

        <a
          href="tel:+576042711600"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-alt transition-colors no-underline group"
        >
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4 text-primary-800" />
          </div>
          <div>
            <span className="block text-sm font-semibold text-text group-hover:text-primary-800 transition-colors">
              (604) 271-1600
            </span>
            <span className="block text-xs text-text-muted">Línea directa IIAP</span>
          </div>
        </a>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-alt">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0 border border-border">
            <Clock className="w-4 h-4 text-text-muted" />
          </div>
          <div>
            <span className="block text-sm font-semibold text-text">Tiempo de respuesta</span>
            <span className="block text-xs text-text-muted">Máximo 24 horas hábiles</span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <Link
          to="/solicitudes"
          onClick={onClose}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors no-underline"
        >
          Radicar Solicitud Técnica
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </motion.div>
  )
}
