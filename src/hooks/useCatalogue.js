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
  ClipboardList, Newspaper, UserCircle, BookOpen,
  HelpCircle, FileCheck,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { NAV_LINKS } from '@/lib/constants'
import { useNoticiasList } from '@/hooks/useNoticias'

// Mapa estático icono por path — evita acoplamiento a la estructura de NAV_LINKS
const ROUTE_ICONS = {
  '/':            Home,
  '/mapas':       MapIcon,
  '/documentos':  FileText,
  '/geovisor':    Globe,
  '/herramientas': Wrench,
  '/solicitudes': ClipboardList,
  '/noticias':    Newspaper,
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

function buildActionEntries(isAuthenticated) {
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
 * Las noticias provienen de la API real.
 */
export function useCatalogue() {
  const { isAuthenticated } = useAuth()
  const { data: noticiasData } = useNoticiasList({ limit: 5 })
  const noticias = noticiasData?.data ?? []

  const newsEntries = useMemo(
    () => noticias.map((n) => ({
      id:       `new-${n.id}`,
      group:    'Noticias',
      label:    n.titulo ?? n.title ?? '—',
      meta:     n.categoria ?? n.tag,
      keywords: `${n.titulo ?? ''} ${n.categoria ?? ''} ${n.resumen ?? ''}`.toLowerCase(),
      icon:     Newspaper,
      to:       `/noticias/${n.slug}`,
    })),
    [noticias],
  )

  return useMemo(
    () => [
      ...buildModuleEntries(),
      ...buildActionEntries(isAuthenticated),
      ...newsEntries,
    ],
    [isAuthenticated, newsEntries],
  )
}
