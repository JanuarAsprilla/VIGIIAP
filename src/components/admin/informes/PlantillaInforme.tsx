import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { ImagePlus, Loader2, Palette, Trash2 } from 'lucide-react'
import TarjetaAdmin from '@/components/admin/TarjetaAdmin'
import { getApiErrorMessage } from '@/lib/apiError'
import { COLOR_HEX, LOGO_MAX_BYTES, LOGO_TIPOS } from '@/lib/informes'
import { useActualizarGeneral, useQuitarLogo, useSubirLogo, type InformeGeneral } from '@/hooks/useInformesAdmin'

interface Valores {
  institucion: string
  subtitulo: string
  pie: string
  aviso: string
  color_primario: string
  color_acento: string
}

const desdeGeneral = (g: InformeGeneral): Valores => ({
  institucion: g.institucion,
  subtitulo: g.subtitulo ?? '',
  pie: g.pie ?? '',
  aviso: g.aviso ?? '',
  color_primario: g.color_primario,
  color_acento: g.color_acento,
})

const colorValido = (c: string, respaldo: string) => (COLOR_HEX.test(c) ? c : respaldo)

function validar(v: Valores): string | null {
  const nombre = v.institucion.trim()
  if (nombre.length < 2 || nombre.length > 120) return 'El nombre de la institución debe tener entre 2 y 120 caracteres.'
  if (!COLOR_HEX.test(v.color_primario) || !COLOR_HEX.test(v.color_acento)) return 'Los colores deben tener la forma #RRGGBB.'
  return null
}

function VistaPrevia({ v, logoUrl }: { v: Valores; logoUrl: string | null }) {
  const acento = colorValido(v.color_acento, '#0F172A')
  const primario = colorValido(v.color_primario, '#009846')
  return (
    <figure className="rounded-xl border border-border overflow-hidden text-sm shadow-sm" aria-label="Vista previa del informe">
      <div className="flex items-center gap-3 px-4 py-3 text-white" style={{ backgroundColor: acento }}>
        {logoUrl && <img src={logoUrl} alt="Logo del informe" className="h-9 w-auto max-w-[8rem] object-contain" />}
        <span className="font-display font-bold truncate">{v.institucion || 'Nombre de la institución'}</span>
      </div>
      <div className="px-4 py-3 bg-white text-slate-800 space-y-1" style={{ borderTop: `4px solid ${primario}` }}>
        <p className="text-base font-bold" style={{ color: primario }}>Informe de ejemplo</p>
        {v.subtitulo && <p className="text-xs text-slate-600">{v.subtitulo}</p>}
        <p className="text-xs text-slate-500">Filtros aplicados · fecha de consulta · cifras clave · tablas</p>
      </div>
      <figcaption className="px-4 py-2 bg-slate-100 text-slate-600 text-[11px] space-y-0.5">
        {v.pie && <p>{v.pie}</p>}
        {v.aviso && <p>{v.aviso}</p>}
        {!v.pie && !v.aviso && <p>Pie y aviso legal del informe</p>}
      </figcaption>
    </figure>
  )
}

function CampoColor({ etiqueta, valor, onCambio, deshabilitado }: {
  etiqueta: string
  valor: string
  onCambio: (v: string) => void
  deshabilitado: boolean
}) {
  return (
    <label className="text-sm block">
      <span className="font-semibold block mb-1">{etiqueta}</span>
      <span className="flex items-center gap-2">
        <input type="color" aria-label={`${etiqueta} (selector)`} className="h-9 w-12 rounded border border-border bg-transparent p-0.5"
          value={colorValido(valor, '#000000')} disabled={deshabilitado} onChange={(e) => onCambio(e.target.value)} />
        <input className="admin-campo w-28 font-mono" value={valor} maxLength={7} disabled={deshabilitado} onChange={(e) => onCambio(e.target.value)} />
      </span>
    </label>
  )
}

function Logo({ logoUrl, puedeEditar, onAviso }: { logoUrl: string | null; puedeEditar: boolean; onAviso: (m: string) => void }) {
  const subir = useSubirLogo()
  const quitar = useQuitarLogo()
  const entrada = useRef<HTMLInputElement>(null)
  const elegir = (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    if (!(LOGO_TIPOS as readonly string[]).includes(archivo.type)) return onAviso('El logo debe ser PNG, JPG o WebP.')
    if (archivo.size > LOGO_MAX_BYTES) return onAviso('El logo pesa más de 2 MB.')
    subir.mutate(archivo, {
      onSuccess: () => onAviso('Logo actualizado.'),
      onError: (err) => onAviso(getApiErrorMessage(err, 'No se pudo subir el logo')),
    })
  }
  const trabajando = subir.isPending || quitar.isPending
  return (
    <div className="rounded-xl border border-border p-3 space-y-2">
      <p className="text-sm font-semibold">Logo</p>
      <p className="text-xs text-text-muted">
        {logoUrl ? 'El logo aparece en el encabezado de cada informe.' : 'Sin logo oficial por ahora: los informes llevan solo el nombre y los colores. Cuando haya logo, súbelo aquí y se usa de inmediato.'}
      </p>
      {puedeEditar && (
        <div className="flex flex-wrap gap-2">
          <input ref={entrada} type="file" accept={LOGO_TIPOS.join(',')} className="sr-only" aria-label="Archivo del logo" onChange={elegir} />
          <button type="button" className="admin-boton" disabled={trabajando} onClick={() => entrada.current?.click()}>
            {subir.isPending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <ImagePlus className="w-4 h-4" aria-hidden="true" />}
            {logoUrl ? 'Cambiar logo' : 'Subir logo'}
          </button>
          {logoUrl && (
            <button type="button" className="admin-boton" disabled={trabajando}
              onClick={() => quitar.mutate(undefined, {
                onSuccess: () => onAviso('Logo eliminado.'),
                onError: (err) => onAviso(getApiErrorMessage(err, 'No se pudo eliminar el logo')),
              })}>
              <Trash2 className="w-4 h-4" aria-hidden="true" />Quitar logo
            </button>
          )}
        </div>
      )}
      <p className="text-[11px] text-text-muted">PNG, JPG o WebP · máximo 2 MB · mejor con fondo transparente.</p>
    </div>
  )
}

export default function PlantillaInforme({ general, puedeEditar, onAviso }: {
  general: InformeGeneral
  puedeEditar: boolean
  onAviso: (mensaje: string) => void
}) {
  const guardar = useActualizarGeneral()
  const [v, setV] = useState<Valores>(() => desdeGeneral(general))
  const [error, setError] = useState<string | null>(null)
  const poner = <K extends keyof Valores>(campo: K) => (valor: Valores[K]) => setV((actual) => ({ ...actual, [campo]: valor }))
  const sinCambios = JSON.stringify(v) === JSON.stringify(desdeGeneral(general))

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    const problema = validar(v)
    setError(problema)
    if (problema) return
    guardar.mutate({ ...v, institucion: v.institucion.trim() }, {
      onSuccess: () => onAviso('Plantilla guardada.'),
      onError: (err) => setError(getApiErrorMessage(err, 'No se pudo guardar la plantilla')),
    })
  }

  return (
    <TarjetaAdmin titulo="Plantilla del informe" icono={Palette} aviso="Así se ven el encabezado, los colores y el pie de los informes descargados.">
      <div className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={enviar} className="space-y-3" noValidate>
          <fieldset className="space-y-3" disabled={!puedeEditar || guardar.isPending}>
            <label className="text-sm block"><span className="font-semibold block mb-1">Nombre de la institución</span>
              <input className="admin-campo w-full" value={v.institucion} maxLength={120} onChange={(e) => poner('institucion')(e.target.value)} /></label>
            <label className="text-sm block"><span className="font-semibold block mb-1">Subtítulo</span>
              <input className="admin-campo w-full" value={v.subtitulo} maxLength={200} onChange={(e) => poner('subtitulo')(e.target.value)} /></label>
            <div className="flex flex-wrap gap-4">
              <CampoColor etiqueta="Color principal" valor={v.color_primario} onCambio={poner('color_primario')} deshabilitado={!puedeEditar} />
              <CampoColor etiqueta="Color del encabezado" valor={v.color_acento} onCambio={poner('color_acento')} deshabilitado={!puedeEditar} />
            </div>
            <label className="text-sm block"><span className="font-semibold block mb-1">Pie del informe</span>
              <textarea className="admin-campo w-full" rows={2} value={v.pie} maxLength={500} onChange={(e) => poner('pie')(e.target.value)} /></label>
            <label className="text-sm block"><span className="font-semibold block mb-1">Aviso legal</span>
              <textarea className="admin-campo w-full" rows={3} value={v.aviso} maxLength={1000} onChange={(e) => poner('aviso')(e.target.value)} /></label>
          </fieldset>
          {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
          {puedeEditar && (
            <button type="submit" className="admin-boton admin-boton-lleno" disabled={guardar.isPending || sinCambios}>
              {guardar.isPending && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}Guardar plantilla
            </button>
          )}
        </form>
        <div className="space-y-3">
          <VistaPrevia v={v} logoUrl={general.logo_url} />
          <Logo logoUrl={general.logo_url} puedeEditar={puedeEditar} onAviso={onAviso} />
        </div>
      </div>
    </TarjetaAdmin>
  )
}
