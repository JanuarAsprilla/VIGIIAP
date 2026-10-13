import {
  Waves, BookOpen, TrendingUp,
  Map as MapIcon, Leaf, Scale, ClipboardList, ClipboardCheck,
  FileSpreadsheet,
} from 'lucide-react'

export const CATEGORY_META = {
  default:                  { icon: 'BookOpen' },
  'Cartografía':            { icon: 'MapIcon' },
  'Estudios Ambientales':   { icon: 'Leaf' },
  'Normativa':              { icon: 'Scale' },
  'Informes Técnicos':      { icon: 'ClipboardList' },
  'Biodiversidad':          { icon: 'Leaf' },
  'Hidrología':             { icon: 'Waves' },
  'Protocolos Ambientales': { icon: 'ClipboardCheck' },
  'Bibliografía Técnica':   { icon: 'BookOpen' },
  'Análisis de Tendencias': { icon: 'TrendingUp' },
  'Formatos y Plantillas':  { icon: 'FileSpreadsheet' },
}

/* Paleta oficial IIAP (Manual de Identidad Visual) — sin tonos ajenos a marca */
export const CATEGORY_COLORS = {
  'Cartografía':            { from: '#1A5632', to: '#218842' },
  'Estudios Ambientales':   { from: '#C12A2B', to: '#F08143' },
  'Normativa':              { from: '#284E39', to: '#1A5632' },
  'Informes Técnicos':      { from: '#F08143', to: '#F7AC42' },
  'Biodiversidad':          { from: '#1A5632', to: '#B0CB1F' },
  'Hidrología':             { from: '#218842', to: '#009846' },
  'Protocolos Ambientales': { from: '#284E39', to: '#009846' },
  'Bibliografía Técnica':   { from: '#E95B8C', to: '#F18A87' },
  'Análisis de Tendencias': { from: '#C12A2B', to: '#E51A4B' },
  'Formatos y Plantillas':  { from: '#F7AC42', to: '#FFF383' },
  default:                  { from: '#1A5632', to: '#009846' },
}

// REGRESIÓN (revisión de diseño): CATEGORY_META/CATEGORY_COLORS solo cubren
// los 10 nombres fijos de siempre, pero `categoria` es texto libre editable
// por el admin (ver GestionCategorias.tsx) -- cualquier nombre nuevo caía
// siempre en el mismo ícono/color "default", sin aviso, perdiendo distinción
// visual justo para las categorías que de verdad varían en producción. Igual
// que Geovisores.tsx#colorDeCategoria (mismo problema ahí: categorías sin
// enum fijo), se deriva un color/ícono estables a partir del propio nombre
// cuando no hay una entrada exacta, en vez de un "default" plano.
const FALLBACK_ICONS = ['BookOpen', 'MapIcon', 'Leaf', 'Scale', 'ClipboardList', 'Waves', 'TrendingUp', 'FileSpreadsheet']
const FALLBACK_COLORS: { from: string; to: string }[] = [
  { from: '#1A5632', to: '#009846' },
  { from: '#C12A2B', to: '#E51A4B' },
  { from: '#284E39', to: '#218842' },
  { from: '#F08143', to: '#F7AC42' },
  { from: '#E95B8C', to: '#F18A87' },
  { from: '#B0CB1F', to: '#FFF383' },
]

function hashCategoryName(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return hash
}

export function getCategoryIcon(name: string): string {
  const exact = (CATEGORY_META as Record<string, { icon: string }>)[name]
  if (exact) return exact.icon
  return FALLBACK_ICONS[hashCategoryName(name) % FALLBACK_ICONS.length]
}

export function getCategoryColors(name: string): { from: string; to: string } {
  const exact = (CATEGORY_COLORS as Record<string, { from: string; to: string }>)[name]
  if (exact) return exact
  return FALLBACK_COLORS[hashCategoryName(name) % FALLBACK_COLORS.length]
}

export { fadeUp } from '@/lib/animations'

export const categoryIcons = {
  MapIcon, Leaf, Scale, ClipboardList, ClipboardCheck,
  FileSpreadsheet, Waves, BookOpen, TrendingUp,
}

export const typeStyles = {
  pdf:  { bg: 'bg-red/8',      text: 'text-red',      label: 'PDF' },
  docx: { bg: 'bg-gold-400/10', text: 'text-gold-400', label: 'Word' },
  xlsx: { bg: 'bg-primary-50',  text: 'text-primary-700', label: 'Excel' },
}

export const SORT_OPTIONS = [
  { value: 'name-asc',  label: 'Nombre A–Z' },
  { value: 'name-desc', label: 'Nombre Z–A' },
  { value: 'date-desc', label: 'Más reciente' },
  { value: 'date-asc',  label: 'Más antiguo' },
]

export const CONSULTA_TYPES = [
  { value: '',                        label: 'Seleccione el tipo de consulta' },
  { value: 'documento-no-encontrado', label: 'Documento no encontrado' },
  { value: 'formato-requerido',       label: 'Formato o plantilla requerida' },
  { value: 'acceso-restringido',      label: 'Problema de acceso a documento' },
  { value: 'documento-desactualizado',label: 'Documento desactualizado' },
  { value: 'otro',                    label: 'Otro' },
]
