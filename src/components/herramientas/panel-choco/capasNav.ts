import type { CapaId } from './types'

export interface CapaNav {
  id: CapaId
  label: string
  color: string
}

export const CAPAS_NAV: CapaNav[] = [
  { id: 'resumen',     label: 'Resumen territorial',      color: '#284E39' },
  { id: 'titulacion',  label: 'Titulación colectiva',      color: '#E8A020' },
  { id: 'cuencas',     label: 'Cuencas hidrográficas',      color: '#185FA5' },
  { id: 'runap',       label: 'Áreas protegidas (RUNAP)',   color: '#2E7D32' },
  { id: 'humedales',   label: 'Humedales',                  color: '#00838F' },
  { id: 'paramos',     label: 'Páramos',                    color: '#7F77DD' },
  { id: 'cienagas',    label: 'Ciénagas',                   color: '#0A4A5E' },
  { id: 'poblacion',   label: 'Población y etnias',         color: '#E51A4B' },
]
