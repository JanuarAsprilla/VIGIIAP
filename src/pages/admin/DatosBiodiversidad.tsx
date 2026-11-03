import { useState, type FormEvent } from 'react'
import { AlertTriangle, CheckCircle2, CircleDashed, Clock, Database, KeyRound, Loader2, RefreshCw, ShieldCheck, Trash2, XCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getApiErrorMessage } from '@/lib/apiError'
import { puedeEditarModulo } from '@/lib/permisosModulo'
import {
  useBorrarCredencial, useCambiarAjustes, useEjecucionesActualizacion, useEstadoActualizacion,
  useGuardarCredencial, useSolicitarActualizacion,
  type EjecucionActualizacion, type EstadoActualizacion, type EstadoEjecucion, type TareaActualizacion,
} from '@/hooks/useActualizacionBiodiversidad'
import { SkeletonLista } from '@/components/ui/Skeleton'

const TAREAS: { clave: TareaActualizacion; titulo: string; ayuda: string }[] = [
  { clave: 'fotos', titulo: 'Fotos por especie', ayuda: 'Busca una foto representativa para cada especie de aves, insectos y plantas.' },
  { clave: 'frescura', titulo: 'Frescura de los datos', ayuda: 'Mide cuánto ha crecido GBIF desde que se cargó el corte. No necesita cuenta.' },
  { clave: 'datos', titulo: 'Actualización completa de datos', ayuda: 'Descarga y carga un corte nuevo con la cuenta de GBIF designada. Aún no está disponible.' },
]
const FRECUENCIAS = [7, 15, 30, 60, 90]
const NOMBRE_GRUPO: Record<string, string> = {
  aves: 'Aves', mamiferos: 'Mamíferos', anfibios: 'Anfibios', reptiles: 'Reptiles', insectos: 'Insectos', plantas: 'Plantas', hongos: 'Hongos',
}
const ESTADO_UI: Record<EstadoEjecucion, { texto: string; clase: string; Icono: typeof Clock }> = {
  solicitada: { texto: 'En espera', clase: 'text-amber-700 dark:text-amber-300', Icono: Clock },
  en_curso: { texto: 'En curso', clase: 'text-sky-700 dark:text-sky-300', Icono: Loader2 },
  ok: { texto: 'Listo', clase: 'text-emerald-700 dark:text-emerald-300', Icono: CheckCircle2 },
  error: { texto: 'Falló', clase: 'text-red-700 dark:text-red-300', Icono: XCircle },
  omitida: { texto: 'Omitida', clase: 'text-text-muted', Icono: CircleDashed },
}

const fecha = (valor: string | null | undefined) => (valor ? new Date(valor).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : '—')
const numero = (n: number) => n.toLocaleString('es-CO')

function Tarjeta({ titulo, icono: Icono, children, aviso }: { titulo: string; icono: typeof Database; children: React.ReactNode; aviso?: string }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 space-y-4">
      <header className="flex items-start gap-3">
        <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary-600/10 text-primary-700 dark:text-primary-300 shrink-0"><Icono className="w-5 h-5" aria-hidden="true" /></span>
        <div className="min-w-0">
          <h2 className="section-title">{titulo}</h2>
          {aviso && <p className="text-xs text-text-muted mt-0.5">{aviso}</p>}
        </div>
      </header>
      {children}
    </section>
  )
}

function EstadoChip({ estado }: { estado: EstadoEjecucion }) {
  const { texto, clase, Icono } = ESTADO_UI[estado]
  return <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${clase}`}><Icono className={`w-3.5 h-3.5 ${estado === 'en_curso' ? 'animate-spin' : ''}`} aria-hidden="true" />{texto}</span>
}

function textoResumen(e: EjecucionActualizacion): string | null {
  const m = e.resumen
  if (typeof m.mensaje === 'string') return m.mensaje
  if (typeof m.motivo === 'string') return m.motivo
  return null
}

function Cortes({ estado }: { estado: EstadoActualizacion }) {
  const frescura = estado.ultimas_ejecuciones.find((e) => e.tarea === 'frescura' && e.estado === 'ok')
  const grupos = (frescura?.resumen.grupos ?? {}) as Record<string, { crecimiento_pct?: number }>
  return (
    <Tarjeta titulo="Datos cargados hoy" icono={Database} aviso="Cada grupo se carga como un corte de GBIF. La columna de crecimiento compara GBIF hoy con la primera medición.">
      {estado.cortes.length === 0 ? <p className="text-sm text-text-muted">Todavía no hay cortes publicados.</p> : (
        <div className="overflow-x-auto" data-lenis-prevent>
          <table className="w-full text-sm">
            <caption className="sr-only">Cortes de datos publicados por grupo</caption>
            <thead><tr className="text-left text-xs text-text-muted"><th className="py-1.5 pr-3 font-semibold">Grupo</th><th className="py-1.5 pr-3 font-semibold text-right">Registros</th><th className="py-1.5 pr-3 font-semibold">Fuente al</th><th className="py-1.5 font-semibold text-right">GBIF desde entonces</th></tr></thead>
            <tbody>
              {estado.cortes.map((c) => {
                const crec = grupos[c.grupo]?.crecimiento_pct
                return (
                  <tr key={c.grupo} className="border-t border-border">
                    <td className="py-2 pr-3 font-semibold">{NOMBRE_GRUPO[c.grupo] ?? c.grupo}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{numero(c.registros)}</td>
                    <td className="py-2 pr-3">{fecha(c.fecha_fuente)}</td>
                    <td className="py-2 text-right tabular-nums">{crec === undefined ? '—' : `${crec > 0 ? '+' : ''}${crec.toLocaleString('es-CO')} %`}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Tarjeta>
  )
}

function Tareas({ estado, puedeEditar, onAviso }: { estado: EstadoActualizacion; puedeEditar: boolean; onAviso: (m: string) => void }) {
  const solicitar = useSolicitarActualizacion()
  const pedir = (tarea: TareaActualizacion) => solicitar.mutate(tarea, {
    onSuccess: () => onAviso('Solicitud enviada: se ejecuta en la próxima revisión automática (diaria).'),
    onError: (err) => onAviso(getApiErrorMessage(err, 'No se pudo solicitar')),
  })
  return (
    <Tarjeta titulo="Qué se actualiza" icono={RefreshCw} aviso="Un proceso automático revisa cada día qué toca según la frecuencia configurada y atiende lo que se pida aquí.">
      <ul className="space-y-3">
        {TAREAS.map((t) => {
          const ultima = estado.ultimas_ejecuciones.find((e) => e.tarea === t.clave)
          const pendiente = ultima?.estado === 'solicitada' || ultima?.estado === 'en_curso'
          const sinCuenta = t.clave === 'datos' && estado.ajustes.modo !== 'cuenta'
          return (
            <li key={t.clave} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{t.titulo}</p>
                <p className="text-xs text-text-muted">{t.ayuda}</p>
                <p className="text-xs mt-1 flex flex-wrap items-center gap-x-2">
                  {ultima ? <><EstadoChip estado={ultima.estado} /><span className="text-text-muted">{fecha(ultima.fin ?? ultima.creado_en)}</span>{textoResumen(ultima) && <span className="text-text-muted">· {textoResumen(ultima)}</span>}</> : <span className="text-text-muted">Aún no se ha ejecutado</span>}
                </p>
              </div>
              {puedeEditar && (
                <button type="button" className="bio-boton bio-boton-chico" disabled={pendiente || sinCuenta || solicitar.isPending}
                  title={sinCuenta ? 'Requiere el modo con cuenta de GBIF' : undefined} onClick={() => pedir(t.clave)}>
                  <RefreshCw className="w-4 h-4" aria-hidden="true" />{pendiente ? 'En espera' : 'Actualizar ahora'}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </Tarjeta>
  )
}

function Ajustes({ estado, esSuper, onAviso }: { estado: EstadoActualizacion; esSuper: boolean; onAviso: (m: string) => void }) {
  const cambiar = useCambiarAjustes()
  const { ajustes, credenciales } = estado
  const aplicar = (cambio: Parameters<typeof cambiar.mutate>[0]) => cambiar.mutate(cambio, {
    onSuccess: () => onAviso('Configuración guardada.'),
    onError: (err) => onAviso(getApiErrorMessage(err, 'No se pudo guardar')),
  })
  const bloqueado = !esSuper || cambiar.isPending
  return (
    <Tarjeta titulo="Configuración" icono={ShieldCheck} aviso={esSuper ? 'Solo el Super Administrador cambia esto.' : 'Solo lectura: lo administra el Super Administrador.'}>
      <div className="space-y-4 text-sm">
        <label className="flex items-center justify-between gap-3">
          <span><span className="font-semibold block">Actualización automática</span><span className="text-xs text-text-muted">Si se apaga, solo se ejecuta lo que se pida a mano.</span></span>
          <input type="checkbox" role="switch" aria-label="Actualización automática" className="w-5 h-5 accent-primary-700" checked={ajustes.activa} disabled={bloqueado} onChange={(e) => aplicar({ activa: e.target.checked })} />
        </label>
        <fieldset className="space-y-2" disabled={bloqueado}>
          <legend className="font-semibold mb-1">Modo</legend>
          <label className="flex items-start gap-2"><input type="radio" name="modo" className="mt-1" checked={ajustes.modo === 'publico'} onChange={() => aplicar({ modo: 'publico' })} /><span><span className="font-medium">Sin cuenta de GBIF</span><span className="block text-xs text-text-muted">Fotos y medición de frescura con la API pública.</span></span></label>
          <label className="flex items-start gap-2"><input type="radio" name="modo" className="mt-1" checked={ajustes.modo === 'cuenta'} disabled={credenciales.length === 0} onChange={() => aplicar({ modo: 'cuenta', credencial_usuario_id: ajustes.credencial_usuario_id ?? credenciales[0]?.usuario_id })} /><span><span className="font-medium">Con cuenta de GBIF</span><span className="block text-xs text-text-muted">{credenciales.length === 0 ? 'Disponible cuando alguien guarde su cuenta de GBIF.' : 'Permite la actualización completa de datos cuando esté disponible.'}</span></span></label>
        </fieldset>
        {ajustes.modo === 'cuenta' && (
          <label className="block"><span className="font-semibold block mb-1">Quién aporta la cuenta</span>
            <select className="bio-campo w-full" value={ajustes.credencial_usuario_id ?? ''} disabled={bloqueado} onChange={(e) => aplicar({ credencial_usuario_id: e.target.value })}>
              {credenciales.map((c) => <option key={c.usuario_id} value={c.usuario_id}>{c.nombre} · {c.gbif_usuario}</option>)}
            </select>
          </label>
        )}
        <label className="block"><span className="font-semibold block mb-1">Cada cuántos días revisar</span>
          <select className="bio-campo" value={ajustes.frecuencia_dias} disabled={bloqueado} onChange={(e) => aplicar({ frecuencia_dias: Number(e.target.value) })}>
            {FRECUENCIAS.map((d) => <option key={d} value={d}>{d} días</option>)}
          </select>
        </label>
        <p className="text-xs text-text-muted">Para designar a otra persona, actívale el módulo «Datos de biodiversidad» en Administradores; ella guarda aquí su propia cuenta de GBIF.</p>
      </div>
    </Tarjeta>
  )
}

function MiCuenta({ estado, userId, esSuper, onAviso }: { estado: EstadoActualizacion; userId: string; esSuper: boolean; onAviso: (m: string) => void }) {
  const guardar = useGuardarCredencial()
  const borrar = useBorrarCredencial()
  const [form, setForm] = useState({ gbif_usuario: '', gbif_correo: '', clave: '' })
  const propia = estado.credenciales.find((c) => c.usuario_id === userId)
  const enviar = (e: FormEvent) => {
    e.preventDefault()
    guardar.mutate(form, {
      onSuccess: () => { setForm({ gbif_usuario: '', gbif_correo: '', clave: '' }); onAviso('Cuenta de GBIF guardada de forma cifrada.') },
      onError: (err) => onAviso(getApiErrorMessage(err, 'No se pudo guardar la cuenta')),
    })
  }
  const quitar = (usuarioId?: string) => borrar.mutate(usuarioId, {
    onSuccess: () => onAviso('Cuenta de GBIF eliminada.'),
    onError: (err) => onAviso(getApiErrorMessage(err, 'No se pudo eliminar')),
  })
  return (
    <Tarjeta titulo="Cuenta de GBIF" icono={KeyRound} aviso="La clave se guarda cifrada y no vuelve a mostrarse. Una cuenta de GBIF es gratuita (gbif.org).">
      {!estado.cifrado_disponible && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/40 p-3 text-xs"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />El servidor aún no tiene configurada la clave de cifrado (BIODIVERSIDAD_ENCRYPTION_KEY): no se pueden guardar cuentas todavía.</p>
      )}
      {propia && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm">
          <span>Tu cuenta: <strong>{propia.gbif_usuario}</strong> <span className="text-text-muted">({propia.gbif_correo}) · {fecha(propia.actualizado_en)}</span></span>
          <button type="button" className="bio-boton bio-boton-chico" onClick={() => quitar()} disabled={borrar.isPending}><Trash2 className="w-4 h-4" aria-hidden="true" />Quitar</button>
        </div>
      )}
      <form onSubmit={enviar} className="grid gap-3 sm:grid-cols-3" autoComplete="off">
        <label className="text-sm"><span className="font-semibold block mb-1">Usuario de GBIF</span><input className="bio-campo w-full" required minLength={3} maxLength={100} value={form.gbif_usuario} onChange={(e) => setForm({ ...form, gbif_usuario: e.target.value })} /></label>
        <label className="text-sm"><span className="font-semibold block mb-1">Correo de la cuenta</span><input className="bio-campo w-full" type="email" required maxLength={200} value={form.gbif_correo} onChange={(e) => setForm({ ...form, gbif_correo: e.target.value })} /></label>
        <label className="text-sm"><span className="font-semibold block mb-1">Clave</span><input className="bio-campo w-full" type="password" required minLength={6} maxLength={200} autoComplete="new-password" value={form.clave} onChange={(e) => setForm({ ...form, clave: e.target.value })} /></label>
        <div className="sm:col-span-3"><button type="submit" className="bio-boton bio-boton-lleno" disabled={guardar.isPending || !estado.cifrado_disponible}>{propia ? 'Reemplazar mi cuenta' : 'Guardar mi cuenta'}</button></div>
      </form>
      {esSuper && estado.credenciales.some((c) => c.usuario_id !== userId) && (
        <ul className="space-y-2 text-sm" aria-label="Cuentas de otras personas">
          {estado.credenciales.filter((c) => c.usuario_id !== userId).map((c) => (
            <li key={c.usuario_id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3">
              <span><strong>{c.nombre}</strong> <span className="text-text-muted">· {c.gbif_usuario} · {fecha(c.actualizado_en)}</span></span>
              <button type="button" className="bio-boton bio-boton-chico" onClick={() => quitar(c.usuario_id)} disabled={borrar.isPending} aria-label={`Quitar la cuenta de ${c.nombre}`}><Trash2 className="w-4 h-4" aria-hidden="true" />Quitar</button>
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  )
}

function Historial() {
  const { data, isPending } = useEjecucionesActualizacion()
  return (
    <Tarjeta titulo="Historial" icono={Clock}>
      {isPending ? <SkeletonLista filas={3} /> : !data || data.ejecuciones.length === 0 ? <p className="text-sm text-text-muted">Sin ejecuciones todavía.</p> : (
        <ul className="divide-y divide-border text-sm" data-lenis-prevent>
          {data.ejecuciones.map((e) => (
            <li key={e.id} className="py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <span className="font-medium">{TAREAS.find((t) => t.clave === e.tarea)?.titulo ?? e.tarea}<span className="text-xs text-text-muted font-normal"> · {e.disparador === 'manual' ? `pedida por ${e.solicitado_por ?? 'alguien'}` : 'programada'}</span></span>
              <span className="flex items-center gap-3"><span className="text-xs text-text-muted">{fecha(e.fin ?? e.creado_en)}</span><EstadoChip estado={e.estado} /></span>
              {textoResumen(e) && <span className="basis-full text-xs text-text-muted break-words">{textoResumen(e)}</span>}
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  )
}

export default function DatosBiodiversidad() {
  const { user } = useAuth()
  const { data: estado, isPending, isError, error } = useEstadoActualizacion()
  const [aviso, setAviso] = useState<string | null>(null)
  const esSuper = user?.rol === 'super_admin'
  const puedeEditar = puedeEditarModulo(user, 'biodiversidad_datos')

  return (
    <div className="space-y-5 max-w-5xl">
      <header>
        <h1 className="font-display text-2xl font-bold">Datos de biodiversidad</h1>
        <p className="text-sm text-text-muted mt-1">Mantén al día el Observatorio de biodiversidad: qué se actualiza, cada cuánto y con qué cuenta de GBIF.</p>
      </header>
      {aviso && <p role="status" className="rounded-xl bg-primary-600/10 border border-primary-600/30 px-4 py-2 text-sm">{aviso}</p>}
      {isPending ? <SkeletonLista filas={4} /> : isError || !estado || !user ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">{getApiErrorMessage(error, 'No se pudo cargar el estado de la actualización')}</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="lg:col-span-2"><Cortes estado={estado} /></div>
          <Tareas estado={estado} puedeEditar={puedeEditar} onAviso={setAviso} />
          <Ajustes estado={estado} esSuper={esSuper} onAviso={setAviso} />
          {puedeEditar && <div className="lg:col-span-2"><MiCuenta estado={estado} userId={user.id} esSuper={esSuper} onAviso={setAviso} /></div>}
          <div className="lg:col-span-2"><Historial /></div>
        </div>
      )}
    </div>
  )
}
