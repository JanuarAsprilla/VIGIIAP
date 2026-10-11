// VIGIIAP — Envío del beacon de analítica (aislado de React para poder
// testearlo sin montar componentes ni JSDOM completo).
//
// A propósito NO usa el cliente `api.ts`: ese cliente adjunta CSRF y maneja
// refresh de sesión, ambas cosas pensadas para peticiones autenticadas que
// mutan datos del usuario. Este beacon es anónimo, dispara en cada
// navegación (incluye visitantes sin cuenta) y no debe fallar ni bloquear la
// navegación si la red está lenta -- por eso usa sendBeacon (fire-and-forget,
// sobrevive incluso si la pestaña se cierra) con fetch keepalive como único
// fallback para navegadores sin sendBeacon.

export interface PageviewPayload {
  sessionId: string;
  ruta: string;
  titulo: string | null;
  dispositivo: 'movil' | 'tablet' | 'escritorio';
  navegador: string | null;
  sistemaOperativo: string | null;
  referrerInicial?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  esAreaAdmin: boolean;
}

function apiBaseUrl(): string {
  return import.meta.env.VITE_API_URL ?? '/api/v1';
}

export function enviarPageviewBeacon(payload: PageviewPayload): void {
  const url = `${apiBaseUrl()}/analitica/pageview`;
  const body = JSON.stringify(payload);

  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      const ok = navigator.sendBeacon(url, blob);
      if (ok) return;
    }
  } catch {
    // Cae al fallback de fetch
  }

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    // Fire-and-forget: perder un pageview nunca debe generar un error visible.
  });
}
