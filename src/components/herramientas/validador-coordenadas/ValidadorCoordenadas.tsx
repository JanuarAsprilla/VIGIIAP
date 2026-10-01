import { useEffect, useRef } from 'react'
import { iniciarValidador } from './validador.motor'
import { crearPortal, moverAlPortal } from '../portalHerramienta'
import marcado from './validador.original.html?raw'
import './validador.original.css'
import '../herramientaTema.css'
import './validador.tema.css'

/** Validador del HTML original, con su estructura y lógica intactas. Aquí solo se monta:
 * el marcado es un recurso estático propio (no proviene de usuarios) y el motor se
 * desmonta limpio (listeners y mapa) al salir de la herramienta. */
export default function ValidadorCoordenadas() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    root.innerHTML = marcado
    const portal = crearPortal(['vc-root', 'ht-root'])
    moverAlPortal(root, portal.elemento, ['#overlay-columnas', '#vc-cargando'])
    const destruir = iniciarValidador(root, { portal: portal.elemento })
    return () => {
      destruir()
      portal.quitar()
      root.innerHTML = ''
    }
  }, [])

  return <div ref={rootRef} className="vc-root ht-root" />
}
