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

export const CATEGORY_COLORS = {
  'Cartografía':            { from: '#1B4332', to: '#2D6A4F' },
  'Estudios Ambientales':   { from: '#7C2D12', to: '#C2410C' },
  'Normativa':              { from: '#1E3A5F', to: '#1D4ED8' },
  'Informes Técnicos':      { from: '#78350F', to: '#B45309' },
  'Biodiversidad':          { from: '#14532D', to: '#15803D' },
  'Hidrología':             { from: '#1E3A8A', to: '#0284C7' },
  'Protocolos Ambientales': { from: '#1B4332', to: '#40916C' },
  'Bibliografía Técnica':   { from: '#0F766E', to: '#0D9488' },
  'Análisis de Tendencias': { from: '#4C1D95', to: '#7C3AED' },
  'Formatos y Plantillas':  { from: '#92400E', to: '#D4A373' },
  default:                  { from: '#1B4332', to: '#52B788' },
}

export { fadeUp } from '@/lib/animations'

export const categoryIcons = {
  MapIcon, Leaf, Scale, ClipboardList, ClipboardCheck,
  FileSpreadsheet, Waves, BookOpen, TrendingUp,
}

export const typeStyles = {
  pdf:  { bg: 'bg-red-50',   text: 'text-red-500',   label: 'PDF' },
  docx: { bg: 'bg-blue-50',  text: 'text-blue-500',  label: 'Word' },
  xlsx: { bg: 'bg-green-50', text: 'text-green-600', label: 'Excel' },
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
