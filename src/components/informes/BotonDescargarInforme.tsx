import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, FileSpreadsheet, FileText, Loader2, LogIn, Sheet } from 'lucide-react'
import { useConfiguracionInforme } from '@/hooks/useConfiguracionInforme'
import { getApiErrorMessage } from '@/lib/apiError'
import { generarArchivo, guardarArchivo, type DatosInforme, type FormatoDescarga } from '@/lib/generarInforme'
import { NOMBRE_FORMATO } from '@/lib/informes'

const ICONOS: Record<FormatoDescarga, typeof FileText> = { pdf: FileText, xlsx: FileSpreadsheet, csv: Sheet }

interface Props {
  /** Clave de la herramienta en Administración → Informes. */
  herramienta: string
  /**
   * Reúne lo que lleva el informe con los filtros vigentes. `maxFilas` es el tope que configuró el administrador y `formato`
   * el que eligió la persona: el PDF es un resumen; el Excel y el CSV pueden llevar los datos completos.
   */
  construir: (maxFilas: number, signal: AbortSignal, formato: FormatoDescarga) => Promise<DatosInforme>
  className?: string
}

/**
 * Botón «Descargar informe». Lo que ofrece lo decide el servidor (Administración → Informes): se oculta si la herramienta no
 * tiene informe, invita a iniciar sesión si así está configurado y ofrece solo los formatos habilitados.
 */
export default function BotonDescargarInforme({ herramienta, construir, className = 'bio-boton' }: Props) {
  const { data: config } = useConfiguracionInforme(herramienta)
  const navigate = useNavigate()
  const location = useLocation()
  const idMenu = useId()
  const contenedor = useRef<HTMLDivElement>(null)
  const disparador = useRef<HTMLButtonElement>(null)
  const cancelar = useRef<AbortController | null>(null)
  const [abierto, setAbierto] = useState(false)
  const [generando, setGenerando] = useState<FormatoDescarga | null>(null)
  const [mensaje, setMensaje] = useState<{ texto: string; error: boolean } | null>(null)

  useEffect(() => () => cancelar.current?.abort(), [])

  useEffect(() => {
    if (!abierto) return
    const fuera = (e: MouseEvent) => { if (!contenedor.current?.contains(e.target as Node)) setAbierto(false) }
    document.addEventListener('mousedown', fuera)
    return () => document.removeEventListener('mousedown', fuera)
  }, [abierto])

  const descargar = useCallback(async (formato: FormatoDescarga) => {
    if (!config) return
    setAbierto(false)
    setMensaje(null)
    setGenerando(formato)
    cancelar.current?.abort()
    const control = new AbortController()
    cancelar.current = control
    try {
      const datos = await construir(config.maxFilas, control.signal, formato)
      const archivo = await generarArchivo(formato, datos, config.plantilla, control.signal)
      if (control.signal.aborted) return
      guardarArchivo(archivo.blob, archivo.nombre)
      setMensaje({ texto: `Informe descargado: ${archivo.nombre}`, error: false })
    } catch (err) {
      if (control.signal.aborted) return
      setMensaje({ texto: `No se pudo generar el informe. ${getApiErrorMessage(err, 'Inténtalo de nuevo.')}`, error: true })
    } finally {
      if (cancelar.current === control) setGenerando(null)
    }
  }, [config, construir])

  if (!config?.habilitado || config.formatos.length === 0) return null

  if (!config.puedeDescargar) {
    return (
      <button type="button" className={className} title="Inicia sesión para descargar el informe"
        onClick={() => navigate('/login', { state: { from: location } })}>
        <LogIn className="w-4 h-4" aria-hidden="true" />
        Descargar informe
        <span className="sr-only"> (requiere iniciar sesión)</span>
      </button>
    )
  }

  const unico = config.formatos.length === 1 ? config.formatos[0] : null
  const ocupado = generando !== null
  const IconoPrincipal = ICONOS[unico ?? 'pdf']
  const alTeclear = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' && abierto) {
      setAbierto(false)
      disparador.current?.focus()
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const items = [...(contenedor.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])]
      if (items.length === 0) return
      e.preventDefault()
      const actual = items.indexOf(document.activeElement as HTMLElement)
      const siguiente = e.key === 'ArrowDown' ? (actual + 1) % items.length : (actual - 1 + items.length) % items.length
      items[siguiente].focus()
    }
  }

  return (
    <div ref={contenedor} className="relative inline-flex flex-col items-start gap-1" onKeyDown={alTeclear}>
      <button ref={disparador} type="button" className={className} disabled={ocupado}
        aria-haspopup={unico ? undefined : 'menu'} aria-expanded={unico ? undefined : abierto} aria-controls={unico ? undefined : idMenu}
        onClick={() => (unico ? void descargar(unico) : setAbierto((v) => !v))}>
        {ocupado ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <IconoPrincipal className="w-4 h-4" aria-hidden="true" />}
        {ocupado ? 'Preparando informe…' : unico ? `Descargar informe (${NOMBRE_FORMATO[unico]})` : 'Descargar informe'}
        {!unico && !ocupado && <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />}
      </button>
      {abierto && !unico && (
        <ul id={idMenu} role="menu" aria-label="Formato del informe"
          className="absolute left-0 top-full mt-1 z-30 min-w-[12rem] rounded-xl border border-border bg-surface p-1 shadow-lg">
          {config.formatos.map((formato) => {
            const Icono = ICONOS[formato]
            return (
              <li key={formato} role="none">
                <button type="button" role="menuitem" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-primary-600/10 focus-visible:bg-primary-600/10"
                  onClick={() => void descargar(formato)}>
                  <Icono className="w-4 h-4" aria-hidden="true" />{NOMBRE_FORMATO[formato]}
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <p role="status" aria-live="polite" className={mensaje ? `text-xs max-w-[18rem] ${mensaje.error ? 'text-red-700 dark:text-red-300' : 'text-text-muted'}` : 'sr-only'}>
        {mensaje?.texto ?? ''}
      </p>
    </div>
  )
}
