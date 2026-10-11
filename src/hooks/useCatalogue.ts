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
import { useGlobalSearchContent } from '@/hooks/useGlobalSearchContent'
import type { CatalogueEntry } from '@/types'

// Mapa estático icono por path — evita acoplamiento a la estructura de NAV_LINKS
const ROUTE_ICONS: Record<string, LucideIcon> = {
  '/':            Home,
  '/mapas':       MapIcon,
  '/documentos':  FileText,
  '/geovisores':  Globe,
  '/herramientas': Wrench,
  '/solicitudes': ClipboardList,
}

function buildModuleEntries(): CatalogueEntry[] {
  return NAV_LINKS.map((link) => ({
    id:       `mod-${link.path}`,
    group:    'Módulos',
    label:    link.label,
    keywords: link.label.toLowerCase(),
    icon:     ROUTE_ICONS[link.path] ?? Home,
    to:       link.path,
  }))
}

function buildActionEntries(isAuthenticated: boolean): CatalogueEntry[] {
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
      keywords: 'terminos condiciones uso',
      icon:     FileCheck,
      to:       '/terminos',
    },
    {
      id:       'res-privacidad',
      group:    'Recursos',
      label:    'Política de Privacidad',
      keywords: 'privacidad politica datos personales tratamiento',
      icon:     FileCheck,
      to:       '/politica-privacidad',
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

function buildMapaEntries(mapas: ReturnType<typeof useGlobalSearchContent>['mapas']): CatalogueEntry[] {
  return mapas.map((m) => ({
    id:          `mapa-${m.id}`,
    group:       'Mapas',
    label:       m.titulo,
    keywords:    [m.titulo, m.categoria, m.descripcion].filter(Boolean).join(' '),
    icon:        MapIcon,
    to:          '/mapas',
    meta:        m.categoria,
    presetQuery: m.titulo,
  }))
}

function buildDocumentoEntries(documentos: ReturnType<typeof useGlobalSearchContent>['documentos']): CatalogueEntry[] {
  return documentos.map((d) => ({
    id:          `documento-${d.id}`,
    group:       'Documentos',
    label:       d.titulo,
    keywords:    [d.titulo, d.categoria ?? d.tipo, d.resumen].filter(Boolean).join(' '),
    icon:        FileText,
    to:          '/documentos',
    meta:        d.categoria ?? d.tipo,
    presetQuery: d.titulo,
  }))
}

function buildGeovisorEntries(geovisores: ReturnType<typeof useGlobalSearchContent>['geovisores']): CatalogueEntry[] {
  return geovisores.map((g) => ({
    id:       `geovisor-${g.id}`,
    group:    'Geovisores',
    label:    g.titulo,
    keywords: [g.titulo, g.subtitulo, g.categoria, g.descripcion].filter(Boolean).join(' '),
    icon:     Globe,
    to:       `/geovisores/${g.slug}`,
    meta:     g.categoria ?? undefined,
  }))
}

/**
 * @param enabled  Difiere las 3 consultas de contenido (mapas/documentos/
 *   geovisores) hasta que el Command Palette se abra por primera vez.
 */
export function useCatalogue(enabled = false) {
  const { isAuthenticated } = useAuth()
  const { mapas, documentos, geovisores } = useGlobalSearchContent(enabled)

  return useMemo(
    () => [
      ...buildModuleEntries(),
      ...buildMapaEntries(mapas),
      ...buildDocumentoEntries(documentos),
      ...buildGeovisorEntries(geovisores),
      ...buildActionEntries(isAuthenticated),
    ],
    [isAuthenticated, mapas, documentos, geovisores],
  )
}
