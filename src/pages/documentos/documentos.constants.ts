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
