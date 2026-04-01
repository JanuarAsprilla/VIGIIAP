import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail, Globe, MessageCircle, Camera, PlayCircle } from 'lucide-react'
import { NAV_LINKS } from '@/lib/constants'

// ── Redes sociales ──
const socialLinks = [
  { icon: Globe, label: 'Facebook', href: '#' },
  { icon: MessageCircle, label: 'Twitter', href: '#' },
  { icon: Camera, label: 'Instagram', href: '#' },
  { icon: PlayCircle, label: 'YouTube', href: '#' },
]

// ── Links de recursos ──
const resourceLinks = [
  { label: 'Guía de Usuario', href: '/recursos/guia-usuario' },
  { label: 'Preguntas Frecuentes', href: '/recursos/faq' },
  { label: 'Términos de Uso', href: '/recursos/terminos' },
]

export default function Footer() {
  return (
    <footer className="relative bg-primary-900 text-white mt-16">
      {/* ── Wave separator ── */}
      <div className="absolute -top-15 inset-x-0 h-15 overflow-hidden pointer-events-none">
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="w-full h-full text-primary-900"
        >
          <path
            d="M0,60 C240,120 480,0 720,60 C960,120 1200,0 1440,60 L1440,120 L0,120 Z"
            fill="currentColor"
          />
        </svg>
      </div>

      <div className="pt-16 pb-8 px-6">
        <div className="max-w-350 mx-auto">
          {/* ── Main grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_2fr] gap-12 pb-8 border-b border-white/10">
            {/* Brand column */}
            <div>
              {/* Logo */}
              <div className="flex items-center gap-2 mb-6">
                <svg viewBox="0 0 50 50" fill="none" className="w-11 h-11">
                  <rect
                    x="5" y="5" width="40" height="40" rx="5"
                    stroke="currentColor" strokeWidth="2"
                  />
                  <text
                    x="50%" y="55%"
                    dominantBaseline="middle" textAnchor="middle"
                    fill="currentColor" fontSize="14" fontWeight="bold"
                  >
                    IIAP
                  </text>
                </svg>
                <span className="font-display text-2xl font-bold">VIGIIAP</span>
              </div>

              {/* Description */}
              <p className="text-white/70 text-[0.95rem] leading-relaxed max-w-87.5 mb-6">
                Visor y Gestor de Información Ambiental del Instituto de
                Investigaciones Ambientales del Pacífico.
              </p>

              {/* Social links */}
              <div className="flex gap-3">
                {socialLinks.map(({ icon: Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    title={label}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-primary-300 hover:text-primary-900 transition-colors"
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Links columns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {/* Módulos */}
              <div>
                <h4 className="text-base font-semibold mb-4">Módulos</h4>
                <ul className="space-y-2">
                  {NAV_LINKS.filter((l) => l.path !== '/').map((link) => (
                    <li key={link.path}>
                      <Link
                        to={link.path}
                        className="text-white/70 hover:text-primary-300 text-sm no-underline transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recursos */}
              <div>
                <h4 className="text-base font-semibold mb-4">Recursos</h4>
                <ul className="space-y-2">
                  {resourceLinks.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-white/70 hover:text-primary-300 text-sm no-underline transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contacto */}
              <div>
                <h4 className="text-base font-semibold mb-4">Contacto</h4>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-primary-300 shrink-0" />
                    <span className="text-white/70">Quibdó, Chocó, Colombia</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-primary-300 shrink-0" />
                    <span className="text-white/70">+57 (4) 671 1127</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-primary-300 shrink-0" />
                    <span className="text-white/70">info@iiap.org.co</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* ── Bottom bar ── */}
          <div className="pt-6 text-center">
            <p className="text-[0.85rem] text-white/50">
              © {new Date().getFullYear()} IIAP — Instituto de Investigaciones
              Ambientales del Pacífico. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}