import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

/**
 * Escapa al DOM al final de <body> — necesario para cualquier overlay a
 * pantalla completa (scrim con backdrop-filter, fixed inset-0) que viva
 * anidado dentro de un ancestro que también use filter/backdrop-filter
 * (ej. TopBar, que ya tiene su propio backdropFilter para el glass del nav):
 * ese ancestro se vuelve el "containing block" de sus hijos position:fixed
 * (ver spec de CSS Filter Effects), así que el overlay queda atrapado
 * dentro de sus límites en vez de cubrir el viewport completo.
 */
export default function Portal({ children }: { children: ReactNode }) {
  if (typeof document === 'undefined') return null
  return createPortal(children, document.body)
}
