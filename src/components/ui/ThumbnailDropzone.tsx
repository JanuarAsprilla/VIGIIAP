import { useRef, useState, useEffect, useCallback, type DragEvent } from 'react'
import { Image } from 'lucide-react'

/** Arrastrar-y-soltar de una miniatura, con vista previa -- compartido entre
 *  GestionMapas.tsx y GeovisorFormBody.tsx (antes duplicado en el primero). */
export default function ThumbnailDropzone({ onFile, existing, label = 'Miniatura / Vista previa' }: {
  onFile: (f: File | null) => void
  existing: string | null
  label?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const previewUrlRef = useRef<string | null>(null)

  // Revoca el Object URL al desmontar para evitar memory leaks
  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
  }, [])

  const accept = useCallback((f: File | null | undefined) => {
    if (!f || !f.type.startsWith('image/')) return
    if (f.size > 50 * 1024 * 1024) return
    onFile(f)
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    const url = URL.createObjectURL(f)
    previewUrlRef.current = url
    setPreview(url)
  }, [onFile])

  const handleDrop = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragging(false); accept(e.dataTransfer.files[0]) }

  const thumb = preview || existing || null

  return (
    <div>
      <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
        {label} <span className="text-text-muted font-normal normal-case tracking-normal">(opcional)</span>
      </label>
      {thumb ? (
        <div className="relative w-full h-28 rounded-xl overflow-hidden border border-border bg-bg-alt group">
          <img src={thumb} alt="Miniatura" className="w-full h-full object-contain" loading="lazy" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button type="button" onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 bg-[var(--card-bg)] text-text text-xs font-semibold rounded-lg hover:bg-bg-alt transition-colors">
              Cambiar
            </button>
            <button type="button" onClick={() => {
              onFile(null)
              if (previewUrlRef.current) { URL.revokeObjectURL(previewUrlRef.current); previewUrlRef.current = null }
              setPreview(null)
            }}
              className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors">
              Quitar
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
            dragging ? 'border-primary-600 bg-primary-500/10' : 'border-border hover:border-primary-400 hover:bg-bg-alt/60'
          }`}
        >
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${dragging ? 'bg-primary-500/12' : 'bg-bg-alt'}`}>
            <Image className={`w-4 h-4 ${dragging ? 'text-primary-700' : 'text-text-muted'}`} />
          </div>
          <div>
            <p className="text-xs font-semibold text-text">{dragging ? 'Suelta la imagen aquí' : 'Haz clic o arrastra una imagen'}</p>
            <p className="text-[0.6rem] text-text-muted">JPG, PNG o WebP — máx. 50 MB</p>
          </div>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" aria-label={label}
        onChange={(e) => { accept(e.target.files?.[0]); e.target.value = '' }}
        className="sr-only" />
    </div>
  )
}
