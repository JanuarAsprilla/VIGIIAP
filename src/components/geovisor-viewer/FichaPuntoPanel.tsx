import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import Thumbnail from '@/components/ui/Thumbnail'
import { isTrustedUrl } from '@/lib/trustedUrl'
import type { FichaPunto, MedioFicha } from '@/types'

/** Solo medios ya procesados y con URL de origen confiable -- el visor
 *  público nunca debe intentar mostrar un video todavía "procesando" (no
 *  tiene archivo real detrás) ni una URL que no venga de este backend/CDN.
 *  Valida `url` Y `miniaturaUrl` por separado -- el render usa miniaturaUrl
 *  como preferencia (Thumbnail, poster de video) así que validar solo `url`
 *  dejaba pasar un miniaturaUrl de origen no confiable sin filtrar. */
function medioVisible(m: MedioFicha): m is MedioFicha & { url: string } {
  return m.estado === 'listo' && !!m.url && isTrustedUrl(m.url)
    && (!m.miniaturaUrl || isTrustedUrl(m.miniaturaUrl))
}

/**
 * Drawer lateral (desktop) / hoja inferior (móvil) con el contenido completo
 * de una ficha -- galería con lightbox, video, descripción y créditos. Vive
 * fuera de <MapContainer> en GeovisorViewer.tsx: un popup de Leaflet es
 * demasiado angosto para una galería real.
 */
export default function FichaPuntoPanel({ ficha, onClose }: {
  ficha: FichaPunto | null
  onClose: () => void
}) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  const medios = (ficha?.medios ?? []).filter(medioVisible).sort((a, b) => a.orden - b.orden)
  const fotos = medios.filter((m) => m.tipo === 'imagen')
  const videos = medios.filter((m) => m.tipo === 'video')

  return (
    <AnimatePresence onExitComplete={() => setLightboxIdx(null)}>
      {ficha && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-[1200] bg-black/30 sm:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 bottom-0 z-[1300] max-h-[75vh] rounded-t-2xl
              sm:inset-y-0 sm:right-0 sm:left-auto sm:bottom-auto sm:top-0 sm:max-h-full sm:h-full sm:w-full sm:max-w-sm sm:rounded-none
              bg-[var(--card-bg)] shadow-2xl flex flex-col overflow-hidden"
            role="dialog" aria-label={ficha.titulo ?? 'Ficha del punto'}
          >
            <div className="flex items-start justify-between gap-2 px-4 py-3 border-b border-border shrink-0">
              <h3 className="text-sm font-bold text-text">{ficha.titulo || 'Ficha del punto'}</h3>
              <button type="button" onClick={onClose} aria-label="Cerrar ficha"
                className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-alt transition-colors shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {fotos.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5">
                  {fotos.map((foto, i) => (
                    <button key={foto.id} type="button" onClick={() => setLightboxIdx(i)}
                      aria-label={`Ampliar foto ${i + 1}`}
                      className="aspect-square rounded-lg overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-700">
                      <Thumbnail src={foto.miniaturaUrl ?? foto.url} alt={foto.leyenda ?? ''} objectFit="cover" className="w-full h-full" />
                    </button>
                  ))}
                </div>
              )}

              {videos.map((video) => (
                <div key={video.id} className="space-y-1">
                  <video controls preload="none" poster={video.miniaturaUrl ?? undefined} className="w-full rounded-lg bg-black">
                    <source src={video.url} />
                  </video>
                  {video.creditos && <p className="text-[0.65rem] text-text-muted">{video.creditos}</p>}
                </div>
              ))}

              {ficha.descripcion && (
                // Texto plano tal como lo escribió el administrador -- nunca HTML,
                // whitespace-pre-line solo respeta los saltos de línea.
                <p className="text-sm text-text leading-relaxed whitespace-pre-line">{ficha.descripcion}</p>
              )}

              {fotos.some((f) => f.creditos) && (
                <div className="pt-2 border-t border-border space-y-0.5">
                  {fotos.filter((f) => f.creditos).map((f) => (
                    <p key={f.id} className="text-[0.65rem] text-text-muted">{f.leyenda ? `${f.leyenda} — ` : ''}{f.creditos}</p>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {lightboxIdx !== null && fotos[lightboxIdx] && (
            <div className="fixed inset-0 z-[1400] bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxIdx(null)}>
              <button type="button" onClick={() => setLightboxIdx(null)} aria-label="Cerrar imagen ampliada"
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
              {lightboxIdx > 0 && (
                <button type="button" onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => (i ?? 0) - 1) }}
                  aria-label="Foto anterior" className="absolute left-2 sm:left-4 text-white/80 hover:text-white transition-colors">
                  <ChevronLeft className="w-8 h-8" />
                </button>
              )}
              <img src={fotos[lightboxIdx].url} alt={fotos[lightboxIdx].leyenda ?? ''}
                className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
              {lightboxIdx < fotos.length - 1 && (
                <button type="button" onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => (i ?? 0) + 1) }}
                  aria-label="Foto siguiente" className="absolute right-2 sm:right-4 text-white/80 hover:text-white transition-colors">
                  <ChevronRight className="w-8 h-8" />
                </button>
              )}
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  )
}
