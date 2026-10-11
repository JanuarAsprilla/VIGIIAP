import { useRef, useState, type DragEvent } from 'react'
import { UploadCloud } from 'lucide-react'
import { FORMATOS_IMAGEN, FORMATOS_VIDEO, MAX_BYTES_IMAGEN, MAX_BYTES_VIDEO, type ArchivoRechazado } from '@/lib/media/formatosMedio'

function clasificarArchivo(f: File): ArchivoRechazado | null {
  const esImagen = FORMATOS_IMAGEN.includes(f.type)
  const esVideo = FORMATOS_VIDEO.includes(f.type)
  if (!esImagen && !esVideo) return { nombre: f.name, motivo: 'Formato no admitido' }
  const limite = esImagen ? MAX_BYTES_IMAGEN : MAX_BYTES_VIDEO
  if (f.size > limite) return { nombre: f.name, motivo: `Supera el máximo de ${Math.round(limite / (1024 * 1024))}MB` }
  return null
}

/**
 * Selector de múltiples fotos/video con arrastrar-y-soltar -- generaliza el
 * patrón de ThumbnailDropzone.tsx (que sigue siendo de un solo archivo, sin
 * tocar) para el caso de varios medios por ficha. No sube nada por sí mismo:
 * solo valida formato/tamaño y entrega los archivos aceptados/rechazados al
 * padre, que decide cómo subirlos (incluyendo generar el poster de video
 * antes de llamar a la mutación real).
 */
export default function MedioDropzone({ onArchivos, disabled = false }: {
  onArchivos: (aceptados: File[], rechazados: ArchivoRechazado[]) => void
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const clasificar = (files: FileList | File[]) => {
    const aceptados: File[] = []
    const rechazados: ArchivoRechazado[] = []
    for (const f of Array.from(files)) {
      const rechazo = clasificarArchivo(f)
      if (rechazo) rechazados.push(rechazo)
      else aceptados.push(f)
    }
    if (aceptados.length || rechazados.length) onArchivos(aceptados, rechazados)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    if (!disabled) clasificar(e.dataTransfer.files)
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-xl transition-all ${
          disabled
            ? 'opacity-50 border-border cursor-not-allowed'
            : dragging ? 'border-primary-600 bg-primary-500/10 cursor-pointer' : 'border-border hover:border-primary-400 hover:bg-bg-alt/60 cursor-pointer'
        }`}
      >
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${dragging ? 'bg-primary-500/12' : 'bg-bg-alt'}`}>
          <UploadCloud className={`w-4 h-4 ${dragging ? 'text-primary-700' : 'text-text-muted'}`} aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-semibold text-text">{dragging ? 'Suelta los archivos aquí' : 'Haz clic o arrastra fotos y video'}</p>
          <p className="text-[0.6rem] text-text-muted">JPG, PNG, WebP (máx. 15MB) · MP4, MOV, WebM (máx. 300MB)</p>
        </div>
      </div>
      <input ref={inputRef} type="file" accept={[...FORMATOS_IMAGEN, ...FORMATOS_VIDEO].join(',')}
        multiple disabled={disabled} aria-label="Subir fotos o video"
        onChange={(e) => { if (e.target.files?.length) clasificar(e.target.files); e.target.value = '' }}
        className="sr-only" />
    </div>
  )
}
