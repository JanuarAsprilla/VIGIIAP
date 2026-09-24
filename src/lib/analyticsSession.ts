// VIGIIAP — Sesión de analítica anónima (client-side).
//
// El sessionId es un UUID generado en el navegador, guardado en
// sessionStorage (no localStorage: debe expirar con la pestaña) junto a la
// marca de "última actividad". Si pasan más de 30 min sin una nueva vista de
// página, se considera una sesión distinta y se rota el id -- así una visita
// de la mañana y otra de la tarde no se cuentan como la misma sesión
// continua, mismo criterio que usan las herramientas de analítica web
// convencionales. No hay ningún vínculo con la cuenta del usuario ni con su
// IP: si vuelve a visitar la plataforma con sesión iniciada, esto sigue
// siendo un id anónimo nuevo, no su usuario_id.

const STORAGE_KEY = 'vigiiap_analytics_session';
const INACTIVIDAD_MAX_MS = 30 * 60 * 1000;

interface SesionGuardada {
  id: string;
  ultimaActividad: number;
}

function generarUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  // Fallback para entornos sin crypto.randomUUID (navegadores muy viejos) --
  // no necesita ser criptográficamente seguro, solo suficientemente único.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function leerSesionGuardada(): SesionGuardada | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.id !== 'string' || typeof parsed?.ultimaActividad !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function guardarSesion(sesion: SesionGuardada): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sesion));
  } catch {
    // sessionStorage puede fallar en modo privado/con storage bloqueado --
    // la analítica es una conveniencia, nunca debe romper la navegación.
  }
}

/** Devuelve el sessionId vigente, rotándolo si expiró por inactividad. */
export function obtenerSessionId(ahora: number = Date.now()): string {
  const guardada = leerSesionGuardada();
  if (guardada && ahora - guardada.ultimaActividad < INACTIVIDAD_MAX_MS) {
    guardarSesion({ id: guardada.id, ultimaActividad: ahora });
    return guardada.id;
  }
  const nuevoId = generarUuid();
  guardarSesion({ id: nuevoId, ultimaActividad: ahora });
  return nuevoId;
}

/** true si esta es la primera vista de la sesión actual (aún no existía en sessionStorage). */
export function esNuevaSesion(ahora: number = Date.now()): boolean {
  const guardada = leerSesionGuardada();
  return !guardada || ahora - guardada.ultimaActividad >= INACTIVIDAD_MAX_MS;
}

export type Dispositivo = 'movil' | 'tablet' | 'escritorio';

/** Clasifica el dispositivo por ancho de viewport -- mismos breakpoints que
 *  el resto de la plataforma (ver rules/web/testing.md: 320/768/1024/1440). */
export function detectarDispositivo(anchoViewport: number): Dispositivo {
  if (anchoViewport < 768) return 'movil';
  if (anchoViewport < 1024) return 'tablet';
  return 'escritorio';
}

interface InfoNavegador {
  navegador: string | null;
  sistemaOperativo: string | null;
}

/** Parseo ligero de user-agent -- suficiente para agrupar en el dashboard,
 *  no pretende ser exhaustivo (para eso existen librerías dedicadas que no
 *  vale la pena cargar solo para dos strings informativos). */
export function parsearNavegador(userAgent: string): InfoNavegador {
  if (!userAgent) return { navegador: null, sistemaOperativo: null };
  const ua = userAgent;

  let navegador: string | null = null;
  if (/Edg\//.test(ua)) navegador = 'Edge';
  else if (/OPR\//.test(ua)) navegador = 'Opera';
  else if (/Firefox\//.test(ua)) navegador = 'Firefox';
  else if (/CriOS\//.test(ua)) navegador = 'Chrome';
  else if (/Chrome\//.test(ua)) navegador = 'Chrome';
  else if (/Safari\//.test(ua) && /Version\//.test(ua)) navegador = 'Safari';

  let sistemaOperativo: string | null = null;
  if (/Windows/.test(ua)) sistemaOperativo = 'Windows';
  else if (/iPhone|iPad|iPod/.test(ua)) sistemaOperativo = 'iOS';
  else if (/Mac OS X/.test(ua)) sistemaOperativo = 'macOS';
  else if (/Android/.test(ua)) sistemaOperativo = 'Android';
  else if (/Linux/.test(ua)) sistemaOperativo = 'Linux';

  return { navegador, sistemaOperativo };
}

interface ParametrosUtm {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}

export function extraerUtm(search: string): ParametrosUtm {
  const params = new URLSearchParams(search);
  return {
    utmSource: params.get('utm_source'),
    utmMedium: params.get('utm_medium'),
    utmCampaign: params.get('utm_campaign'),
  };
}
