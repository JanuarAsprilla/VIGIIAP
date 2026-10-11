/**
 * Las ventanas de las herramientas (diálogos y avisos) usan `position: fixed`. La zona principal de la
 * plataforma lleva una transformación 3D por la transición de página y, con ella, `fixed` se mide contra
 * todo el contenido y no contra la pantalla: el diálogo quedaba abajo, a veces fuera de vista. Se montan
 * en un contenedor propio del `body`, fuera de esa zona, para que siempre se centren en la pantalla.
 */
export interface PortalHerramienta {
  elemento: HTMLElement
  quitar: () => void
}

/** Crea el contenedor en el body con las clases de la herramienta (para que apliquen sus estilos acotados). */
export function crearPortal(clases: string[]): PortalHerramienta {
  const elemento = document.createElement('div')
  elemento.className = clases.join(' ')
  document.body.appendChild(elemento)
  return { elemento, quitar: () => elemento.remove() }
}

/** Mueve al portal los elementos del origen que coincidan con los selectores (los que no existan se ignoran). */
export function moverAlPortal(origen: HTMLElement, portal: HTMLElement, selectores: string[]): void {
  for (const selector of selectores) {
    const elemento = origen.querySelector(selector)
    if (elemento) portal.appendChild(elemento)
  }
}
