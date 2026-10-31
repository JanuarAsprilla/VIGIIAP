import { useMemo, useState } from 'react'
import { useBiodiversidadSugerencias } from '@/hooks/useBiodiversidad'
import { useDebounced } from '@/hooks/useDebounced'
import { fmtNum } from '../lib/format'
import type { Filtros } from '../lib/filtros'
import { paramsSugerencias } from '../lib/paramsApi'
import { sanearBusqueda } from '../lib/parametros'
import type { Grupo, Metodo } from '../types'
import Combobox, { type OpcionCombo } from './Combobox'

interface Props {
  grupo: Grupo
  metodo: Metodo
  filtros: Filtros
  etiqueta: string
  placeholder?: string
  ocultarEtiqueta?: boolean
  idEntrada?: string
  deshabilitado?: boolean
  motivo?: string | null
  /** Con texto libre + Enter se filtra por nombre (`buscar`) en vez de por una especie concreta. */
  permitirTextoLibre?: boolean
  onEspecie: (clave: string, nombre: string) => void
  onBuscar?: (texto: string) => void
  onLimpiar: () => void
}

/** Búsqueda de especie con sugerencias de `/especies?buscar=` (tamaño pequeño, con espera al escribir). */
export default function SelectorEspecie({
  grupo, metodo, filtros, etiqueta, placeholder, ocultarEtiqueta, idEntrada, deshabilitado, motivo, permitirTextoLibre = false,
  onEspecie, onBuscar, onLimpiar,
}: Props) {
  const [abierto, setAbierto] = useState(false)
  const [texto, setTexto] = useState('')
  const buscado = useDebounced(sanearBusqueda(texto), 300)
  const consulta = useBiodiversidadSugerencias(
    grupo, paramsSugerencias(filtros, metodo, buscado), abierto && !deshabilitado && buscado.length >= 2,
  )
  const opciones = useMemo<OpcionCombo[]>(
    () => (buscado.length >= 2 ? consulta.data?.especies ?? [] : []).map((e) => ({
      valor: e.especie_clave, etiqueta: e.especie, detalle: `${fmtNum(e.registros)} reg.`,
    })),
    [consulta.data, buscado],
  )
  return (
    <Combobox
      etiqueta={etiqueta} placeholder={placeholder} ocultarEtiqueta={ocultarEtiqueta} idEntrada={idEntrada}
      seleccion={filtros.especie ? filtros.nombreEspecie ?? filtros.especie : filtros.buscar || null}
      opciones={opciones} filtradoRemoto cargando={abierto && consulta.isFetching && buscado.length >= 2}
      error={consulta.isError} deshabilitado={deshabilitado} motivo={motivo}
      vacio={buscado.length < 2 ? 'Escribe al menos 2 letras' : 'Ninguna especie coincide'}
      onAbrir={() => setAbierto(true)} onCerrar={() => setAbierto(false)}
      onTexto={setTexto}
      onElegir={(o) => onEspecie(o.valor, o.etiqueta)} onLimpiar={onLimpiar}
      onEnterTexto={permitirTextoLibre ? (t) => onBuscar?.(sanearBusqueda(t)) : undefined}
    />
  )
}
