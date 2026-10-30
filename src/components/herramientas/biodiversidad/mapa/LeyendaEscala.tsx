import { fmtNum } from '../lib/format'
import { tramosLeyenda } from '../lib/escala'

export default function LeyendaEscala({ cortes, maximo }: { cortes: number[]; maximo: number }) {
  const tramos = tramosLeyenda(cortes, maximo)
  return (
    <div className="bio-leyenda" role="group" aria-label="Leyenda: registros por municipio">
      <p className="bio-eyebrow">Registros por municipio</p>
      <ul>
        <li><span className="bio-muestra" style={{ background: 'var(--bio-c0)' }} aria-hidden="true" />Sin registros</li>
        {tramos.map((t) => (
          <li key={t.clase}>
            <span className="bio-muestra" style={{ background: `var(--bio-c${t.clase})` }} aria-hidden="true" />
            {t.desde === t.hasta ? fmtNum(t.hasta) : `${fmtNum(t.desde)} – ${fmtNum(t.hasta)}`}
          </li>
        ))}
      </ul>
      <p className="text-[0.625rem] text-text-muted mt-1.5">Clases por cuantiles (escala no lineal)</p>
    </div>
  )
}
