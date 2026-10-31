import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { conAncho, urlImagenValida, urlReferenciaValida } from '../lib/foto'
import { etiquetarLicencia } from '../lib/licencia'
import GrupoIcono from '../GrupoIcono'
import type { Foto, Grupo } from '../types'

const ENLACE = { target: '_blank', rel: 'noopener noreferrer' } as const
const LICENCIA_FOTO = { etiqueta: 'Licencia no indicada', href: null }

interface ImgProps {
  foto: Foto | null
  alt: string
  ancho: number
  /** Proporción reservada para evitar saltos de diseño. */
  proporcion?: string
  prioridad?: boolean
  /** Si se indica, la ausencia de foto se resuelve con el icono y el color del grupo en lugar de un marcador. */
  grupo?: Grupo
  /** Texto bajo el icono cuando no hay foto (p. ej. inventario agregado). */
  sinFotoTexto?: string
}

/** Imagen de la caché de GBIF con tamaño reservado. Si la URL no cumple el patrón o falla, muestra un marcador. */
export function ImagenGbif({ foto, alt, ancho, proporcion = '4 / 3', prioridad = false, grupo, sinFotoTexto }: ImgProps) {
  const [fallo, setFallo] = useState(false)
  const url = foto ? urlImagenValida(foto.imagen) : null
  return (
    <span className="bio-foto" style={{ aspectRatio: proporcion }}>
      {url && !fallo ? (
        <img
          src={conAncho(url, ancho)} alt={alt} loading={prioridad ? 'eager' : 'lazy'} decoding="async" referrerPolicy="no-referrer"
          onError={() => setFallo(true)}
        />
      ) : grupo ? (
        <span className="bio-foto-grupo">
          <GrupoIcono grupo={grupo} className="bio-foto-grupo-icono" />
          {(fallo || sinFotoTexto) && <span>{fallo ? 'No se pudo cargar la fotografía' : sinFotoTexto}</span>}
        </span>
      ) : (
        <span className="bio-foto-vacia">
          <ImageOff className="w-6 h-6" aria-hidden="true" />
          <span>{url ? 'No se pudo cargar la fotografía' : 'Sin fotografía'}</span>
        </span>
      )}
    </span>
  )
}

/** Crédito obligatorio: autor, licencia y enlace a la referencia, siempre junto a la foto. */
export function CreditoFoto({ foto }: { foto: Foto }) {
  const lic = etiquetarLicencia(foto.licencia, LICENCIA_FOTO)
  const ref = urlReferenciaValida(foto.referencia)
  return (
    <span className="bio-credito">
      <span className="bio-credito-autor">Foto: {foto.autor ?? 'autor sin indicar'}{foto.editor && foto.editor !== foto.autor ? ` · ${foto.editor}` : ''}</span>
      <span className="bio-credito-pie">
        {lic.href ? <a className="bio-enlace" href={lic.href} {...ENLACE}>{lic.etiqueta}</a> : <span>{lic.etiqueta}</span>}
        {ref && <a className="bio-enlace" href={ref} {...ENLACE} aria-label="Ver la fotografía en su fuente (se abre en una pestaña nueva)">Fuente</a>}
      </span>
    </span>
  )
}
