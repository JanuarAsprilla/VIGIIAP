import { useId, useMemo, useState, type ChangeEvent } from 'react'
import { motion } from 'framer-motion'
import { X, Loader2, Download, FileSpreadsheet, AlertCircle, AlertTriangle, CircleCheck } from 'lucide-react'
import { panelAnim } from '@/lib/animations'
import { getApiErrorMessage } from '@/lib/apiError'
import { useImportarFichas } from '@/hooks/useFichasPunto'
import {
  leerTablaFichas, filasDeTabla, cruzarConPuntos, contarDescripcionesCortas,
  descargarPlantillaFichas, DESCRIPCION_MINIMA, type FilaFicha,
} from '@/lib/fichas/importarFichas'
import type { FeatureFichaEstado, ResultadoImportacionFichas } from '@/types'

const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024
const MAX_IDENTIFICADORES_LISTADOS = 5

interface Analisis {
  nombreArchivo: string
  filas: FilaFicha[]
  sinCoincidencia: string[]
  sinIdentificador: number
  cortas: number
}

const plural = (n: number, singular: string, pluralForma: string) => (n === 1 ? singular : pluralForma)

/**
 * Importa títulos y descripciones de toda una capa desde un Excel o CSV. El
 * archivo se lee y se cruza con los puntos reales de la capa en el navegador:
 * lo que no coincide con ningún punto se avisa y se ignora, y recién después de
 * revisar el resumen el admin confirma. Las fotos y videos se siguen subiendo
 * punto por punto.
 */
export default function ImportarFichasDialog({ configId, capaNombre, features, onClose }: {
  configId: string
  capaNombre: string
  features: readonly FeatureFichaEstado[]
  onClose: () => void
}) {
  const importar = useImportarFichas(configId)
  const inputId = useId()
  const tituloId = useId()

  const [analisis, setAnalisis] = useState<Analisis | null>(null)
  const [sobrescribir, setSobrescribir] = useState(false)
  const [error, setError] = useState('')
  const [leyendo, setLeyendo] = useState(false)
  const [progreso, setProgreso] = useState<{ hechas: number; total: number } | null>(null)
  const [resultado, setResultado] = useState<ResultadoImportacionFichas | null>(null)

  const valoresConocidos = useMemo(() => new Set(features.map((f) => f.valor)), [features])
  const importando = importar.isPending

  const alElegirArchivo = async (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    setError('')
    setAnalisis(null)
    if (archivo.size > TAMANO_MAXIMO_BYTES) {
      setError('El archivo supera los 5 MB. Divídelo en partes más pequeñas.')
      return
    }
    setLeyendo(true)
    try {
      const tabla = filasDeTabla(await leerTablaFichas(archivo))
      if (tabla.error) { setError(tabla.error); return }
      const { coinciden, sinCoincidencia } = cruzarConPuntos(tabla.filas, valoresConocidos)
      setAnalisis({
        nombreArchivo: archivo.name,
        filas: coinciden,
        sinCoincidencia,
        sinIdentificador: tabla.sinIdentificador,
        cortas: contarDescripcionesCortas(coinciden),
      })
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo leer el archivo. Verifica que sea un .xlsx o .csv válido.'))
    } finally {
      setLeyendo(false)
    }
  }

  const ejecutar = async () => {
    if (!analisis || analisis.filas.length === 0) return
    setError('')
    setProgreso({ hechas: 0, total: analisis.filas.length })
    try {
      setResultado(await importar.mutateAsync({
        filas: analisis.filas,
        sobrescribir,
        onProgreso: (hechas, total) => setProgreso({ hechas, total }),
      }))
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo completar la importación'))
    } finally {
      setProgreso(null)
    }
  }

  const alDescargarPlantilla = async () => {
    setError('')
    try {
      await descargarPlantillaFichas(features, capaNombre)
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo generar la plantilla'))
    }
  }

  const n = analisis?.filas.length ?? 0

  return (
    <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget && !importando) onClose() }}>
      <motion.div {...panelAnim} role="dialog" aria-modal="true" aria-labelledby={tituloId}
        className="bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-lg my-8 flex flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-border">
          <div>
            <h3 id={tituloId} className="text-base font-bold text-text">Importar fichas desde Excel o CSV</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Carga de una vez los títulos y descripciones de "{capaNombre}". Las fotos y videos se suben después, punto por punto.
            </p>
          </div>
          <button onClick={onClose} disabled={importando} aria-label="Cerrar"
            className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-alt transition-colors disabled:opacity-40">
            <X className="w-5 h-5" />
          </button>
        </div>

        {resultado ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-primary-700">
              <CircleCheck className="w-5 h-5" aria-hidden="true" />
              <p className="text-sm font-bold">Importación terminada</p>
            </div>
            <ul className="space-y-1 text-sm text-text">
              <li>{resultado.creadas} creadas</li>
              <li>{resultado.actualizadas} actualizadas</li>
              <li>{resultado.omitidas} omitidas (ya tenían descripción)</li>
            </ul>
            <button onClick={onClose}
              className="w-full py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">
              Listo
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={alDescargarPlantilla} disabled={importando}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-xs font-semibold text-text hover:border-primary-800 disabled:opacity-40 transition-colors">
                <Download className="w-3.5 h-3.5" aria-hidden="true" /> Descargar plantilla (.xlsx)
              </button>
              <span className="text-[0.65rem] text-text-muted">Ya trae un punto por fila, con su identificador.</span>
            </div>

            <div>
              <label htmlFor={inputId}
                className="flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-border rounded-xl text-sm text-text-muted hover:border-primary-800 hover:text-primary-800 cursor-pointer transition-colors">
                {leyendo
                  ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  : <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />}
                <span>{analisis ? `${analisis.nombreArchivo} — elegir otro` : 'Elegir archivo .xlsx o .csv'}</span>
              </label>
              <input id={inputId} type="file" accept=".xlsx,.csv" onChange={alElegirArchivo} disabled={importando}
                aria-label="Archivo de fichas" className="sr-only" />
              <p className="text-[0.65rem] text-text-muted mt-1.5">
                Columnas: <strong>Identificador</strong>, <strong>Título</strong> (opcional) y <strong>Descripción</strong>. Máximo 5 MB.
              </p>
            </div>

            {error && (
              <p role="alert" className="flex items-start gap-1.5 text-xs text-red-600">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" /> {error}
              </p>
            )}

            {analisis && (
              <div className="space-y-3 border border-border rounded-xl p-4">
                <p className="text-sm font-bold text-text">
                  {n} {plural(n, 'ficha lista', 'fichas listas')} para importar
                </p>

                {analisis.sinCoincidencia.length > 0 && (
                  <p className="flex items-start gap-1.5 text-xs text-gold-500">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      Identificadores que no coinciden con ningún punto de la capa (se ignorarán):{' '}
                      {analisis.sinCoincidencia.slice(0, MAX_IDENTIFICADORES_LISTADOS).join(', ')}
                      {analisis.sinCoincidencia.length > MAX_IDENTIFICADORES_LISTADOS && ` y ${analisis.sinCoincidencia.length - MAX_IDENTIFICADORES_LISTADOS} más`}
                    </span>
                  </p>
                )}
                {analisis.sinIdentificador > 0 && (
                  <p className="flex items-start gap-1.5 text-xs text-gold-500">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{analisis.sinIdentificador} {plural(analisis.sinIdentificador, 'fila sin identificador se ignorará', 'filas sin identificador se ignorarán')}.</span>
                  </p>
                )}
                {analisis.cortas > 0 && (
                  <p className="flex items-start gap-1.5 text-xs text-gold-500">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      {analisis.cortas} {plural(analisis.cortas, 'descripción tiene', 'descripciones tienen')} menos de {DESCRIPCION_MINIMA} caracteres: se
                      guardan, pero esa ficha no contará como completa hasta ampliarla.
                    </span>
                  </p>
                )}

                <label className="flex items-start gap-2 text-xs text-text cursor-pointer">
                  <input type="checkbox" checked={sobrescribir} onChange={(e) => setSobrescribir(e.target.checked)} disabled={importando}
                    className="mt-0.5 w-3.5 h-3.5 rounded border-border text-primary-800 focus:ring-primary-800/30 shrink-0" />
                  <span>
                    <strong>Reemplazar las descripciones que ya existen</strong>
                    <span className="block text-text-muted">Apagado: los puntos que ya tienen descripción no se tocan.</span>
                  </span>
                </label>
              </div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={onClose} disabled={importando}
                className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 hover:text-primary-800 disabled:opacity-40 transition-colors">
                Cancelar
              </button>
              {analisis && (
                <button type="button" onClick={ejecutar} disabled={n === 0 || importando}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors">
                  {importando && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  {importando && progreso
                    ? `Importando… ${progreso.hechas}/${progreso.total}`
                    : `Importar ${n} ${plural(n, 'ficha', 'fichas')}`}
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
