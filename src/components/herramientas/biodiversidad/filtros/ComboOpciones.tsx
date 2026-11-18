import { useMemo, useState } from 'react'
import { useBiodiversidadOpciones } from '@/hooks/useBiodiversidad'
import { useDebounced } from '@/hooks/useDebounced'
import { fmtNum } from '../lib/format'
import { sanearTextoOpciones } from '../lib/parametros'
import type { CampoOpciones, Grupo, OpcionFiltro, ParamsApi } from '../types'
import Combobox, { type OpcionCombo } from './Combobox'

interface Props {
  grupo: Grupo
  campo: CampoOpciones
  etiqueta: string
  /** Filtros actuales; el servidor excluye el del propio campo. */
  params: ParamsApi
  seleccion: string | null
  placeholder?: string
  deshabilitado?: boolean
  motivo?: string | null
  /** Traduce el valor devuelto a una etiqueta legible (p. ej. tipo de evidencia). */
  etiquetar?: (o: OpcionFiltro) => string
  onElegir: (valor: string, nombre: string) => void
  onLimpiar: () => void
}

/** Combobox cuyas opciones vienen de `/opciones`. Solo consulta mientras la lista está abierta, con espera al escribir. */
export default function ComboOpciones({
  grupo, campo, etiqueta, params, seleccion, placeholder, deshabilitado, motivo, etiquetar, onElegir, onLimpiar,
}: Props) {
  const [abierto, setAbierto] = useState(false)
  const [texto, setTexto] = useState('')
  const buscado = useDebounced(sanearTextoOpciones(texto), 300)
  const consulta = useBiodiversidadOpciones(
    grupo, campo, buscado.length >= 2 ? { ...params, buscar: buscado } : params, abierto && !deshabilitado,
  )
  const opciones = useMemo<OpcionCombo[]>(
    () => (consulta.data?.valores ?? []).map((o) => ({
      valor: o.valor, etiqueta: etiquetar ? etiquetar(o) : o.nombre, detalle: fmtNum(o.registros),
    })),
    [consulta.data, etiquetar],
  )
  return (
    <Combobox
      etiqueta={etiqueta} placeholder={placeholder} seleccion={seleccion} opciones={opciones}
      cargando={abierto && consulta.isFetching} error={consulta.isError} deshabilitado={deshabilitado} motivo={motivo}
      onAbrir={() => setAbierto(true)} onCerrar={() => setAbierto(false)} onTexto={setTexto}
      onElegir={(o) => onElegir(o.valor, o.etiqueta)} onLimpiar={onLimpiar}
    />
  )
}
