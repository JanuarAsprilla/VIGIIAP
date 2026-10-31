import { etiquetaTramo, tramosLeyenda } from '../lib/escala'
import { TITULO_LEYENDA, type Metrica } from '../lib/metrica'

interface Props {
  cortes: number[]
  maximo: number
  metrica?: Metrica
}

/** Leyenda integrada: barra de clases con rótulos debajo; no se superpone al mapa. */
export default function LeyendaEscala({ cortes, maximo, metrica = 'registros' }: Props) {
  const tramos = tramosLeyenda(cortes, maximo, metrica !== 'sin_especie')
  return (
    <div className="bio-leyenda" role="group" aria-label={`Leyenda: ${TITULO_LEYENDA[metrica].toLowerCase()}`}>
      <div className="bio-leyenda-cab">
        <p className="bio-eyebrow">{TITULO_LEYENDA[metrica]}</p>
        <p className="text-[0.625rem] text-text-muted">Cada tramo reúne una cantidad parecida de municipios</p>
      </div>
      <ul>
        <li title="Municipios sin registros para esta medida"><span className="bio-muestra bio-muestra-vacia" aria-hidden="true" /><span>Sin datos</span></li>
        {tramos.map((t) => (
          <li key={t.clase}>
            <span className="bio-muestra" style={{ background: `var(--bio-c${t.clase})` }} aria-hidden="true" />
            <span>{etiquetaTramo(t, metrica)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
