/**
 * Genera un poster frame (imagen de portada) de un video en el navegador,
 * antes de subirlo -- el backend transcodifica el video en segundo plano
 * (puede tardar minutos) y mientras tanto necesita algo que mostrar en la
 * miniatura. Se extrae a la mitad del primer segundo (o la mitad de la
 * duración si el video dura menos de 2s) porque el primer frame de muchos
 * videos de celular sale negro (el sensor aún ajustando exposición).
 */
export function generarPosterDeVideo(archivo: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true
    const url = URL.createObjectURL(archivo)
    video.src = url

    const limpiar = () => URL.revokeObjectURL(url)

    video.addEventListener('loadeddata', () => {
      video.currentTime = Math.min(1, (video.duration || 2) / 2)
    })

    video.addEventListener('seeked', () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) { limpiar(); reject(new Error('No se pudo generar el poster del video')); return }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => {
        limpiar()
        if (!blob) { reject(new Error('No se pudo generar el poster del video')); return }
        resolve(new File([blob], 'poster.webp', { type: 'image/webp' }))
      }, 'image/webp', 0.85)
    })

    video.addEventListener('error', () => { limpiar(); reject(new Error('No se pudo leer el video')) })
  })
}
