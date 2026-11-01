import { useId, useMemo, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { Images, MapPinned, X } from 'lucide-react'
import { useBiodiversidadMunicipios, useBiodiversidadRegistros } from '@/hooks/useBiodiversidad'
import { useDialogoModal } from '@/hooks/useDialogoModal'
import InsigniasConservacion from '../InsigniasConservacion'
import { fotoValida, linajeCompleto } from '../lib/especie'
import { fmtNum } from '../lib/format'
import { urlImagenValida } from '../lib/foto'
import { estiloGrupo } from '../lib/paleta'
import { CreditoFoto, ImagenGbif } from '../registros/FotoRegistro'
import type { EspecieResumen, Foto, Grupo } from '../types'

interface Props {
  e: EspecieResumen
  grupo: Grupo
  esIndividual: boolean
  origen: RefObject<HTMLElement | null>
  onCerrar: () => void
  onVerRegistros: (e: EspecieResumen) => void
  onVerMunicipios?: (e: EspecieResumen) => void
}

const MAX_FOTOS = 8
const MAX_MUNICIPIOS = 10

/** Foto grande con miniaturas; la representativa de la especie va primero y no se repite. */
function Galeria({ especie, fotos, grupo, esIndividual }: { especie: string; fotos: Foto[]; grupo: Grupo; esIndividual: boolean }) {
  const [indice, setIndice] = useState(0)
  if (fotos.length === 0) {
    return (
      <div className="bio-galeria">
        <ImagenGbif foto={null} grupo={grupo} alt="" ancho={800} proporcion={esIndividual ? '4 / 3' : '16 / 6'} sinFotoTexto={esIndividual ? 'Aún sin fotografía' : undefined} />
      </div>
    )
  }
  const actual = fotos[Math.min(indice, fotos.length - 1)]
  return (
    <div className="bio-galeria">
      <ImagenGbif key={actual.imagen} foto={actual} alt={`${especie} (foto ${indice + 1} de ${fotos.length})`} ancho={800} proporcion="4 / 3" prioridad />
      <CreditoFoto foto={actual} />
      {fotos.length > 1 && (
        <ul className="bio-miniaturas" aria-label="Fotografías de la especie">
          {fotos.map((f, i) => (
            <li key={f.imagen}>
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

/** «Ver más» de una especie: lo que la tarjeta resume, en un diálogo desplazable. */
export default function DetalleEspecie({ e, grupo, esIndividual, origen, onCerrar, onVerRegistros, onVerMunicipios }: Props) {
  const titulo = useId()
  const { caja, alTeclear } = useDialogoModal(origen, onCerrar)
  const municipiosQ = useBiodiversidadMunicipios(grupo, { especie_clave: e.especie_clave })
  const fotosQ = useBiodiversidadRegistros(grupo, { especie_clave: e.especie_clave, con_foto: 'true', orden: 'anio_desc', tamano: MAX_FOTOS }, esIndividual)

  const donde = useMemo(
    () => (municipiosQ.data?.municipios ?? []).filter((m) => m.registros > 0).sort((a, b) => b.registros - a.registros),
    [municipiosQ.data],
  )
  const fotos = useMemo(() => {
    const vistas = new Set<string>()
    const lista: Foto[] = []
    for (const f of [fotoValida(e), ...(fotosQ.data?.registros ?? []).map((r) => r.foto)]) {
      if (f && urlImagenValida(f.imagen) && !vistas.has(f.imagen)) { vistas.add(f.imagen); lista.push(f) }
    }
    return lista.slice(0, MAX_FOTOS)
  }, [e, fotosQ.data])
  const maximo = Math.max(1, ...donde.map((m) => m.registros))
  const linaje = linajeCompleto(e)

  return createPortal(
    <div className="bio-root bio-tema bio-velo" data-lenis-prevent style={estiloGrupo(grupo)} onMouseDown={(ev) => { if (ev.target === ev.currentTarget) onCerrar() }}>
      <div ref={caja} role="dialog" aria-modal="true" aria-labelledby={titulo} tabIndex={-1} className="bio-detalle" onKeyDown={alTeclear}>
        <header className="bio-detalle-cabecera">
          <div className="min-w-0">
            <p className="bio-eyebrow">Especie</p>
            <h2 id={titulo} className="font-display text-xl sm:text-2xl font-bold leading-tight italic">{e.especie}</h2>
            {linaje && <p className="text-xs text-text-muted mt-1">{linaje}</p>}
          </div>
          <button type="button" className="bio-boton shrink-0" onClick={onCerrar} aria-label="Cerrar el detalle de la especie">
            <X className="w-4 h-4" aria-hidden="true" />Cerrar
          </button>
        </header>
        <div className="bio-detalle-cuerpo">
          <Galeria especie={e.especie} fotos={fotos} grupo={grupo} esIndividual={esIndividual} />
          <div className="space-y-5 min-w-0">
            <InsigniasConservacion c={e} />
            <dl className="bio-datos">
              <div className="bio-dato"><dt>Registros</dt><dd>{fmtNum(e.registros)}</dd></div>
              <div className="bio-dato"><dt>Municipios</dt><dd>{fmtNum(e.municipios)}</dd></div>
              {esIndividual && (e.fotos_total ?? 0) > 0 && <div className="bio-dato"><dt>Fotografías</dt><dd>{fmtNum(e.fotos_total ?? 0)}</dd></div>}
            </dl>
            <section aria-labelledby={`${titulo}-donde`} className="space-y-2">
              <h3 id={`${titulo}-donde`} className="bio-eyebrow">Dónde se registra</h3>
              {municipiosQ.isError ? (
                <p className="text-sm text-text-muted">No se pudo cargar la lista de municipios.</p>
              ) : !municipiosQ.data ? (
                <p className="text-sm text-text-muted" role="status">Cargando municipios…</p>
              ) : donde.length === 0 ? (
                <p className="text-sm text-text-muted">Sin municipios con registros.</p>
              ) : (
                <>
                  <ul aria-label="Municipios donde se registra" className="space-y-1.5">
                    {donde.slice(0, MAX_MUNICIPIOS).map((m) => (
                      <li key={m.codigo_municipal} className="text-sm">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="min-w-0"><span className="font-semibold">{m.municipio}</span> <span className="text-text-muted text-xs">{m.departamento}</span></span>
                          <span className="tabular-nums font-semibold shrink-0">{fmtNum(m.registros)}</span>
                        </div>
                        <div className="h-1 rounded bg-[color-mix(in_srgb,var(--color-text)_10%,transparent)]" aria-hidden="true">
                          <div className="h-1 rounded bg-[var(--bio-acento)]" style={{ width: `${Math.max(3, (m.registros / maximo) * 100)}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                  {donde.length > MAX_MUNICIPIOS && <p className="text-xs text-text-muted">y {fmtNum(donde.length - MAX_MUNICIPIOS)} municipios más.</p>}
                </>
              )}
            </section>
            <div className="flex flex-wrap gap-2">
              {esIndividual ? (
                <button type="button" className="bio-boton" onClick={() => onVerRegistros(e)}>
                  <Images className="w-4 h-4" aria-hidden="true" />Ver los registros
                </button>
              ) : onVerMunicipios && (
                <button type="button" className="bio-boton" onClick={() => onVerMunicipios(e)}>
                  <MapPinned className="w-4 h-4" aria-hidden="true" />Ver por municipio en el tablero
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
