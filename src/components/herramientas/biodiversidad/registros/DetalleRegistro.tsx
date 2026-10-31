import { useEffect, useId, useRef, useState, type KeyboardEvent, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { ExternalLink, X } from 'lucide-react'
import { useBiodiversidadRegistro } from '@/hooks/useBiodiversidad'
import { PanelError } from '../EstadoConsulta'
import InsigniasConservacion from '../InsigniasConservacion'
import { urlDoi, urlRegistroGbif } from '../lib/enlaces'
import { traducirEvidencia } from '../lib/evidencia'
import { etiquetarLicencia } from '../lib/licencia'
import { separarMarcas, traducirMarca, traducirMarcaLocal, type MarcaTraducida } from '../lib/marcas'
import type { Grupo, RegistroDetalle } from '../types'
import { CreditoFoto, ImagenGbif } from './FotoRegistro'
import { textoAlt } from './textoAlt'
import { Ubicacion } from './UbicacionRegistro'

const ENLACE = { target: '_blank', rel: 'noopener noreferrer' } as const
const FOCALIZABLES = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), select, input'
const FECHA = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

interface Props {
  grupo: Grupo
  gbifId: string
  origen: RefObject<HTMLElement | null>
  onCerrar: () => void
}

function fmtFechaEvento(valor: string | null, anio: number | null): string {
  if (valor) {
    const d = new Date(valor)
    if (!Number.isNaN(d.getTime())) return /^\d{4}-\d{2}-\d{2}/.test(valor) ? FECHA.format(d) : String(d.getUTCFullYear())
  }
  return anio ? String(anio) : 'Sin fecha'
}

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="bio-dato">
      <dt>{etiqueta}</dt>
      <dd>{children}</dd>
    </div>
  )
}

function Galeria({ r }: { r: RegistroDetalle }) {
  const [indice, setIndice] = useState(0)
  const fotos = r.fotos
  if (fotos.length === 0) {
    return <div className="bio-galeria"><ImagenGbif foto={null} alt="" ancho={800} proporcion="4 / 3" /></div>
  }
  const actual = fotos[Math.min(indice, fotos.length - 1)]
  return (
    <div className="bio-galeria">
      <ImagenGbif key={actual.imagen} foto={actual} alt={`${textoAlt(r)} (foto ${indice + 1} de ${fotos.length})`} ancho={800} proporcion="4 / 3" prioridad />
      <CreditoFoto foto={actual} />
      {fotos.length > 1 && (
        <ul className="bio-miniaturas" aria-label="Fotografías del registro">
          {fotos.map((f, i) => (
            <li key={`${f.imagen}-${i}`}>
              <button type="button" aria-label={`Ver fotografía ${i + 1} de ${fotos.length}`} aria-current={i === indice} onClick={() => setIndice(i)}>
                <ImagenGbif foto={f} alt="" ancho={120} proporcion="1 / 1" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ListaMarcas({ titulo, marcas, vacio }: { titulo: string; marcas: MarcaTraducida[]; vacio: string }) {
  return (
    <div>
      <h4 className="text-xs font-bold text-text-light mb-1.5">{titulo}</h4>
      {marcas.length === 0 ? (
        <p className="text-sm text-text-muted">{vacio}</p>
      ) : (
        <ul className="space-y-1.5">
          {marcas.map((m) => (
            <li key={m.codigo} className={`bio-marca bio-marca-${m.tono}`}>
              <span className="bio-marca-tono">{m.tono === 'aviso' ? 'Advertencia' : 'Informativa'}</span>
              <span>{m.texto}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Contenido({ r }: { r: RegistroDetalle }) {
  const gbif = urlRegistroGbif(r.gbif_id)
  const doi = urlDoi(r.doi_conjunto)
  const lic = etiquetarLicencia(r.licencia)
  const tax = [r.taxonomia.reino, r.taxonomia.clase, r.taxonomia.orden, r.taxonomia.familia, r.taxonomia.genero].filter(Boolean)
  const locales = separarMarcas(r.marcas_revision).map(traducirMarcaLocal)
  const deGbif = separarMarcas(r.marcas_gbif).map(traducirMarca)
  const catalogo = [r.institution_code, r.collection_code, r.catalog_number].filter(Boolean).join(' · ')
  return (
    <div className="bio-detalle-cuerpo">
      <Galeria r={r} />
      <div className="space-y-5 min-w-0">
        {tax.length > 0 && <p className="text-xs text-text-muted">{tax.join(' › ')}</p>}
        <InsigniasConservacion c={r} />
        <dl className="bio-datos">
          <Dato etiqueta="Fecha del evento">{fmtFechaEvento(r.fecha_evento, r.anio)}</Dato>
          <Dato etiqueta="Evidencia">{traducirEvidencia(r.tipo_evidencia)}</Dato>
          <Dato etiqueta="Lugar">{r.municipio}, {r.departamento}</Dato>
          <Dato etiqueta="Ubicación"><Ubicacion r={r} /></Dato>
          <Dato etiqueta="Observador">{r.registrado_por ?? 'Sin indicar'}</Dato>
          <Dato etiqueta="Identificado por">{r.identificado_por ?? 'Sin indicar'}</Dato>
          {r.nombre_original && r.nombre_original !== r.especie && <Dato etiqueta="Nombre original">{r.nombre_original}</Dato>}
          <Dato etiqueta="Licencia del registro">
            {lic.href ? <a className="bio-enlace" href={lic.href} {...ENLACE}>{lic.etiqueta}</a> : lic.etiqueta}
          </Dato>
        </dl>
        <section aria-labelledby="bio-det-fuente">
          <h3 id="bio-det-fuente" className="bio-eyebrow mb-2">Fuente</h3>
          <p className="text-sm text-text-light">{r.conjunto ?? 'Conjunto sin título'}</p>
          {doi && <a className="bio-enlace text-sm" href={doi} {...ENLACE}>DOI {r.doi_conjunto}</a>}
          {catalogo && <p className="text-xs text-text-muted mt-1">Institución y catálogo: {catalogo}</p>}
        </section>
        <section aria-labelledby="bio-det-calidad" className="space-y-3">
          <h3 id="bio-det-calidad" className="bio-eyebrow">Calidad del dato</h3>
          <ListaMarcas titulo="Revisión de Vigía" marcas={locales} vacio="No se detectaron observaciones en la revisión de la plataforma." />
          <ListaMarcas titulo="Marcas de GBIF" marcas={deGbif} vacio="GBIF no señaló observaciones sobre este registro." />
        </section>
        {gbif && (
          <a className="bio-boton" href={gbif} {...ENLACE} aria-label={`Ver el registro ${r.gbif_id} en GBIF (se abre en una pestaña nueva)`}>
            Ver en GBIF <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
        )}
      </div>
    </div>
  )
}

/** Diálogo modal accesible: foco atrapado, Escape cierra y el foco vuelve a la tarjeta que lo abrió. */
export default function DetalleRegistro({ grupo, gbifId, origen, onCerrar }: Props) {
  const titulo = useId()
  const caja = useRef<HTMLDivElement>(null)
  const consulta = useBiodiversidadRegistro(grupo, gbifId)
  const cierre = useRef(onCerrar)

  useEffect(() => { cierre.current = onCerrar }, [onCerrar])
  useEffect(() => {
    const devolver = origen.current
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    caja.current?.focus({ preventScroll: true })
    return () => {
      document.body.style.overflow = previo
      if (devolver?.isConnected) devolver.focus()
    }
  }, [origen])

  function alTeclear(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') { e.stopPropagation(); cierre.current(); return }
    if (e.key !== 'Tab' || !caja.current) return
    const lista = [...caja.current.querySelectorAll<HTMLElement>(FOCALIZABLES)].filter((x) => !x.hasAttribute('disabled'))
    if (lista.length === 0) { e.preventDefault(); return }
    const [primero, ultimo] = [lista[0], lista[lista.length - 1]]
    if (e.shiftKey && (document.activeElement === primero || document.activeElement === caja.current)) { e.preventDefault(); ultimo.focus() }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus() }
  }

  const r = consulta.data
  return createPortal(
    <div className="bio-root bio-velo" onMouseDown={(e) => { if (e.target === e.currentTarget) onCerrar() }}>
      <div ref={caja} role="dialog" aria-modal="true" aria-labelledby={titulo} tabIndex={-1} className="bio-detalle" onKeyDown={alTeclear}>
        <header className="bio-detalle-cabecera">
          <div className="min-w-0">
            <p className="bio-eyebrow">Registro {gbifId}</p>
            <h2 id={titulo} className={`font-display text-xl sm:text-2xl font-bold leading-tight ${r?.especie ? 'italic' : ''}`}>
              {r ? r.especie ?? 'Sin especie determinada' : 'Cargando registro'}
            </h2>
          </div>
          <button type="button" className="bio-boton shrink-0" onClick={onCerrar} aria-label="Cerrar el detalle del registro">
            <X className="w-4 h-4" aria-hidden="true" />Cerrar
          </button>
        </header>
        {consulta.isError ? (
          <PanelError error={consulta.error} onReintentar={() => void consulta.refetch()} compacto />
        ) : !r ? (
          <div role="status" aria-label="Cargando el registro" className="bio-detalle-cuerpo animate-pulse">
            <div className="bg-bg-alt rounded-xl aspect-[4/3]" />
            <div className="space-y-3"><div className="h-5 bg-bg-alt rounded w-2/3" /><div className="h-24 bg-bg-alt rounded" /><div className="h-24 bg-bg-alt rounded" /></div>
          </div>
        ) : <Contenido r={r} />}
      </div>
    </div>,
    document.body,
  )
}
