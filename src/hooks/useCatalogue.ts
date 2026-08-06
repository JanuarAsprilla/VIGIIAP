/**
 * useCatalogue — fuente de datos del Command Palette.
 *
 * Principio DIP: CommandPalette depende de esta abstracción,
 * no de constants.js directamente. Cuando llegue el backend,
 * solo este hook cambia — ningún componente consumidor.
 *
 * Cada entrada del catálogo tiene la forma:
 *   { id, group, label, keywords, icon, to, meta? }
 */

import { useMemo } from 'react'
import {
  Home, Map as MapIcon, FileText, Globe, Wrench,
  ClipboardList, UserCircle, BookOpen,
  HelpCircle, FileCheck, type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { NAV_LINKS } from '@/lib/constants'

// Mapa estático icono por path — evita acoplamiento a la estructura de NAV_LINKS
const ROUTE_ICONS: Record<string, LucideIcon> = {
  '/':            Home,
  '/mapas':       MapIcon,
  '/documentos':  FileText,
  '/geovisor':    Globe,
  '/herramientas': Wrench,
  '/solicitudes': ClipboardList,
}

function buildModuleEntries() {
  return NAV_LINKS.map((link) => ({
    id:       `mod-${link.path}`,
    group:    'Módulos',
    label:    link.label,
    keywords: link.label.toLowerCase(),
    icon:     ROUTE_ICONS[link.path] ?? Home,
    to:       link.path,
  }))
}

function buildActionEntries(isAuthenticated: boolean) {
  const entries = [
    {
      id:       'res-guia',
      group:    'Recursos',
      label:    'Guía de Usuario',
      keywords: 'guia ayuda manual documentacion',
      icon:     BookOpen,
      to:       '/guia-usuario',
    },
    {
      id:       'res-faq',
      group:    'Recursos',
      label:    'Preguntas Frecuentes',
      keywords: 'faq preguntas frecuentes ayuda soporte',
      icon:     HelpCircle,
      to:       '/faq',
    },
    {
      id:       'res-terminos',
      group:    'Recursos',
      label:    'Términos y Condiciones',
      keywords: 'terminos condiciones privacidad politica datos',
      icon:     FileCheck,
      to:       '/terminos',
    },
  ]

  if (isAuthenticated) {
    entries.unshift(
      {
        id:       'act-perfil',
        group:    'Mi Cuenta',
        label:    'Mi Perfil',
        keywords: 'perfil cuenta usuario configuracion',
        icon:     UserCircle,
        to:       '/perfil',
      },
      {
        id:       'act-solicitudes',
        group:    'Mi Cuenta',
        label:    'Mis Solicitudes',
        keywords: 'solicitudes tramites expedientes radicados',
        icon:     ClipboardList,
        to:       '/solicitudes',
      },
    )
  }

  return entries
}

/**
 * Devuelve el catálogo completo de entradas buscables.
 */
export function useCatalogue() {
  const { isAuthenticated } = useAuth()


  return useMemo(
    () => [
      ...buildModuleEntries(),
      ...buildActionEntries(isAuthenticated),
    ],
    [isAuthenticated],
  )
}
