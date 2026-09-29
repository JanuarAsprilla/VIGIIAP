import { useState } from 'react'
import { Loader2, AlertTriangle, PlayCircle, ChevronLeft, ChevronRight, Trash2, X } from 'lucide-react'
import { getApiErrorMessage } from '@/lib/apiError'
import { generarPosterDeVideo } from '@/lib/video/posterFrame'
import Thumbnail from '@/components/ui/Thumbnail'
import MedioDropzone from '@/components/ui/MedioDropzone'
import { FORMATOS_VIDEO, type ArchivoRechazado } from '@/lib/media/formatosMedio'
import { useSubirMedioFicha, useActualizarMedio, useReordenarMedios, useEliminarMedio } from '@/hooks/useFichasPunto'
import type { MedioFicha } from '@/types'

const MAX_IMAGENES = 12
const MAX_VIDEOS = 3

interface Subiendo {
  id: string
  nombre: string
  tipo: 'imagen' | 'video'
  progreso: number
  error?: string
}

function MedioCard({ medio, index, total, onMover, onEliminar, onActualizar }: {
  medio: MedioFicha
  index: number
  total: number
  onMover: (direccion: -1 | 1) => void
  onEliminar: () => void
  onActualizar: (data: { leyenda?: string; creditos?: string }) => void
}) {
  const [leyenda, setLeyenda] = useState(medio.leyenda ?? '')
  const [creditos, setCreditos] = useState(medio.creditos ?? '')
  const [medioAnterior, setMedioAnterior] = useState(medio)

  // Ajustado durante el render, no en un efecto -- si el medio llega
  // actualizado desde el servidor (ej. tras un refetch), refleja los
  // valores nuevos sin pisar lo que el admin esté escribiendo en ese momento.
  if (medio !== medioAnterior) {
    setMedioAnterior(medio)
    setLeyenda(medio.leyenda ?? '')
    setCreditos(medio.creditos ?? '')
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="relative aspect-video bg-bg-alt">
        {medio.estado === 'procesando' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-text-muted">
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            <span className="text-[0.65rem]">Procesando video…</span>
          </div>
        ) : medio.estado === 'error' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-red-600">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            <span className="text-[0.65rem]">No se pudo procesar</span>
          </div>
        ) : (
          <>
            <Thumbnail src={medio.miniaturaUrl ?? medio.url ?? ''} alt={medio.leyenda ?? ''} objectFit="cover" className="w-full h-full" />
            {medio.tipo === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                <PlayCircle className="w-8 h-8 text-white drop-shadow" aria-hidden="true" />
              </div>
            )}
          </>
        )}
      </div>

      <div className="p-2 space-y-1.5">
        <input type="text" value={leyenda} placeholder="Leyenda (opcional)"
          onChange={(e) => setLeyenda(e.target.value)}
          onBlur={() => { if (leyenda.trim() !== (medio.leyenda ?? '')) onActualizar({ leyenda: leyenda.trim() || undefined }) }}
          className="w-full px-2 py-1 bg-[var(--card-bg)] border border-border rounded text-[0.65rem] focus:outline-none focus:border-primary-800 transition" />
        <input type="text" value={creditos} placeholder="Créditos (opcional)"
          onChange={(e) => setCreditos(e.target.value)}
          onBlur={() => { if (creditos.trim() !== (medio.creditos ?? '')) onActualizar({ creditos: creditos.trim() || undefined }) }}
          className="w-full px-2 py-1 bg-[var(--card-bg)] border border-border rounded text-[0.65rem] focus:outline-none focus:border-primary-800 transition" />

        <div className="flex items-center justify-between pt-0.5">
          <div className="flex gap-1">
            <button type="button" onClick={() => onMover(-1)} disabled={index === 0} title="Mover antes"
              className="p-1 rounded text-text-muted hover:text-text hover:bg-bg-alt disabled:opacity-30 transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => onMover(1)} disabled={index === total - 1} title="Mover después"
              className="p-1 rounded text-text-muted hover:text-text hover:bg-bg-alt disabled:opacity-30 transition-colors">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <button type="button" onClick={onEliminar} title="Eliminar"
            className="p-1 rounded text-text-muted hover:text-red-dark hover:bg-red/10 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Fotos y video de una ficha: dropzone de subida + grid de lo ya subido.
 * El poster de video se genera en el navegador (posterFrame.ts) ANTES de
 * subir, porque el backend puede tardar minutos en transcodificar -- sin
 * poster, la tarjeta quedaría vacía hasta que termine.
 */
export default function MediosFichaGrid({ configId, valor, medios }: {
  configId: string
  valor: string
  medios: MedioFicha[]
}) {
  const subirMedio = useSubirMedioFicha(configId)
  const actualizarMedio = useActualizarMedio(configId)
  const reordenarMedios = useReordenarMedios(configId)
  const eliminarMedio = useEliminarMedio(configId)

  const [subiendo, setSubiendo] = useState<Subiendo[]>([])
  const [rechazados, setRechazados] = useState<ArchivoRechazado[]>([])

  const ordenados = [...medios].sort((a, b) => a.orden - b.orden)
  const nImagenes = ordenados.filter((m) => m.tipo === 'imagen').length + subiendo.filter((s) => s.tipo === 'imagen').length
  const nVideos = ordenados.filter((m) => m.tipo === 'video').length + subiendo.filter((s) => s.tipo === 'video').length

  const subirArchivo = async (archivo: File) => {
    const esVideo = FORMATOS_VIDEO.includes(archivo.type)
    const id = `${archivo.name}-${archivo.size}-${archivo.lastModified}`
    setSubiendo((s) => [...s, { id, nombre: archivo.name, tipo: esVideo ? 'video' : 'imagen', progreso: 0 }])

    let poster: File | undefined
    if (esVideo) {
      try { poster = await generarPosterDeVideo(archivo) } catch { /* sin poster el backend igual genera uno al transcodificar */ }
    }

    try {
      await subirMedio.mutateAsync({
        valor, archivo, poster,
        onUploadProgress: (e) => {
          const progreso = e.total ? Math.round((e.loaded / e.total) * 100) : 0
          setSubiendo((s) => s.map((u) => u.id === id ? { ...u, progreso } : u))
        },
      })
      setSubiendo((s) => s.filter((u) => u.id !== id))
    } catch (err) {
      setSubiendo((s) => s.map((u) => u.id === id ? { ...u, error: getApiErrorMessage(err, 'No se pudo subir') } : u))
    }
  }

  const handleArchivos = (aceptados: File[], rechazadosNuevos: ArchivoRechazado[]) => {
    const rechazadosPorLimite: ArchivoRechazado[] = []
    let imagenesRestantes = MAX_IMAGENES - nImagenes
    let videosRestantes = MAX_VIDEOS - nVideos
    const paraSubir: File[] = []

    for (const archivo of aceptados) {
      const esVideo = FORMATOS_VIDEO.includes(archivo.type)
      if (esVideo) {
        if (videosRestantes <= 0) { rechazadosPorLimite.push({ nombre: archivo.name, motivo: `Máximo ${MAX_VIDEOS} videos por ficha` }); continue }
        videosRestantes--
      } else {
        if (imagenesRestantes <= 0) { rechazadosPorLimite.push({ nombre: archivo.name, motivo: `Máximo ${MAX_IMAGENES} imágenes por ficha` }); continue }
        imagenesRestantes--
      }
      paraSubir.push(archivo)
    }

    setRechazados([...rechazadosNuevos, ...rechazadosPorLimite])
    // Secuencial, no en paralelo -- varios videos grandes a la vez saturan una
    // conexión lenta y hacen más lento el conjunto, no más rápido.
    paraSubir.reduce((prev, archivo) => prev.then(() => subirArchivo(archivo)), Promise.resolve())
  }

  return (
    <div className="space-y-3">
      <MedioDropzone onArchivos={handleArchivos} disabled={nImagenes >= MAX_IMAGENES && nVideos >= MAX_VIDEOS} />

      {rechazados.length > 0 && (
        <div className="space-y-1">
          {rechazados.map((r, i) => (
            <p key={i} className="flex items-center gap-1.5 text-[0.65rem] text-red-600">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span className="truncate">{r.nombre}: {r.motivo}</span>
              <button type="button" onClick={() => setRechazados((rs) => rs.filter((_, idx) => idx !== i))} className="ml-auto shrink-0 text-text-muted hover:text-text">
                <X className="w-3 h-3" />
              </button>
            </p>
          ))}
        </div>
      )}

      {(ordenados.length > 0 || subiendo.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ordenados.map((medio, i) => (
            <MedioCard key={medio.id} medio={medio} index={i} total={ordenados.length}
              onMover={(direccion) => {
                const nuevoIdx = i + direccion
                if (nuevoIdx < 0 || nuevoIdx >= ordenados.length) return
                const copia = [...ordenados]
                ;[copia[i], copia[nuevoIdx]] = [copia[nuevoIdx], copia[i]]
                reordenarMedios.mutate({ valor, ids: copia.map((m) => m.id) })
              }}
              onEliminar={() => eliminarMedio.mutate(medio.id)}
              onActualizar={(data) => actualizarMedio.mutate({ medioId: medio.id, ...data })}
            />
          ))}
          {subiendo.map((s) => (
            <div key={s.id} className="border border-dashed border-border rounded-lg p-2 flex flex-col items-center justify-center gap-1.5 aspect-video">
              {s.error ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-red-600" aria-hidden="true" />
                  <p className="text-[0.6rem] text-red-600 text-center px-1">{s.error}</p>
                  <button type="button" onClick={() => setSubiendo((sub) => sub.filter((u) => u.id !== s.id))}
                    className="text-[0.6rem] text-text-muted hover:text-text underline">Quitar</button>
                </>
              ) : (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-primary-700" aria-hidden="true" />
                  <p className="text-[0.6rem] text-text-muted truncate max-w-full px-1">{s.nombre}</p>
                  <p className="text-[0.6rem] font-mono text-text-muted">{s.progreso}%</p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
