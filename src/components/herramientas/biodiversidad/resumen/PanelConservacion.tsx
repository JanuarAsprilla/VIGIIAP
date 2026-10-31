import { AVISO_SIN_MARCA, CATEGORIAS_AMENAZA, NOMBRE_AMENAZA, tieneListaEndemismo } from '../lib/conservacion'
import { fmtNum } from '../lib/format'
import type { Amenaza, Grupo, RespuestaResumen, TipoConservacion } from '../types'

interface Props {
  resumen: RespuestaResumen
  grupo: Grupo
  puedeVerEspecies: boolean
  onFiltrar: (f: { conservacion: TipoConservacion; amenaza: Amenaza | null }) => void
}

function Fila({ etiqueta, valor, nota, onClick }: { etiqueta: string; valor: number | null; nota?: string; onClick?: () => void }) {
  const contenido = (
    <>
      <span title={nota}>{etiqueta}{nota && valor === null && <small className="block text-[0.6875rem] text-text-muted font-normal">{nota}</small>}</span>
      {valor === null ? <span className="text-text-muted text-xs font-semibold">Sin lista nacional</span> : <b className="tabular-nums">{fmtNum(valor)}</b>}
    </>
  )
  return onClick && valor !== null && valor > 0 ? (
    <button type="button" className="bio-cons-fila bio-cons-fila-boton" onClick={onClick}>{contenido}</button>
  ) : (
    <div className="bio-cons-fila">{contenido}</div>
  )
}

export default function PanelConservacion({ resumen, grupo, puedeVerEspecies, onFiltrar }: Props) {
  const { amenazadas: a } = resumen
  const ir = (conservacion: TipoConservacion, amenaza: Amenaza | null = null) => (puedeVerEspecies ? () => onFiltrar({ conservacion, amenaza }) : undefined)
  return (
    <section className="bio-panel p-4 sm:p-5 space-y-5" aria-labelledby="bio-cons-titulo">
      <div>
        <h3 id="bio-cons-titulo" className="section-title">Estado de conservación</h3>
        <p className="text-xs text-text-muted mt-0.5">Especies distintas, con su categoría más severa según la Resolución 0126 de 2024 del MADS.</p>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {CATEGORIAS_AMENAZA.map((c) => {
          const n = a[c]
          const cuerpo = (
            <>
              <span className={`bio-uicn bio-uicn-${c}`}>{c}</span>
              <span className="bio-cifra text-[clamp(1.35rem,3vw,1.9rem)] block mt-2">{fmtNum(n)}</span>
              <span className="text-[0.6875rem] text-text-muted leading-tight block mt-1">{NOMBRE_AMENAZA[c]}</span>
            </>
          )
          return puedeVerEspecies && n > 0 ? (
            <button key={c} type="button" className="bio-tesela bio-tesela-boton" onClick={() => onFiltrar({ conservacion: 'amenazada', amenaza: c })}
              aria-label={`${NOMBRE_AMENAZA[c]}: ${fmtNum(n)} ${n === 1 ? 'especie' : 'especies'}. Ver la lista`}>{cuerpo}</button>
          ) : (
            <div key={c} className="bio-tesela" role="group" aria-label={`${NOMBRE_AMENAZA[c]}: ${fmtNum(n)} ${n === 1 ? 'especie' : 'especies'}`}>{cuerpo}</div>
          )
        })}
      </div>
      <p className="text-sm text-text-light">
        <b className="text-text tabular-nums">{fmtNum(a.total)}</b> {a.total === 1 ? 'especie amenazada' : 'especies amenazadas'} en total.
      </p>
      <div className="bio-cons-lista">
        <Fila
          etiqueta="Endémicas de Colombia" valor={tieneListaEndemismo(grupo) ? resumen.endemicas_colombia : null}
          nota="Solo hay listas nacionales de endemismo para aves, plantas y mamíferos." onClick={ir('endemica')}
        />
        <Fila etiqueta="Endémicas del Chocó, reportadas por el IIAP (2011)" valor={resumen.endemicas_choco} onClick={ir('endemica')} nota="Lista histórica y parcial." />
        <Fila etiqueta="Introducidas" valor={resumen.introducidas} onClick={ir('introducida')} />
        <Fila etiqueta="Invasoras" valor={resumen.invasoras} onClick={ir('invasora')} />
      </div>
      <p className="text-xs text-text-muted leading-relaxed">{AVISO_SIN_MARCA}</p>
    </section>
  )
}
