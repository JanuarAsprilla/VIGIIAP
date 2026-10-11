/**
 * Módulo-scope, no un ref ni un useState — tiene que sobrevivir al remount
 * completo que <ErrorBoundary key={location.key}> (ver App.tsx) dispara en
 * TODO navigate(), incluido el propio navigate() con el que TopBar limpia
 * location.state tras consumir un redirect a login: ese navigate cambia
 * location.key, lo que remonta TopBar entero (activePanel y autoOpenedRef
 * vuelven a su valor inicial) ANTES de que el 'login' recién asignado llegue
 * a pintarse. La instancia fresca que nace de ese remount ve location.state
 * ya vacío — sin esta bandera, su efecto de auto-apertura no tiene forma de
 * saber que este montaje viene de un redirect a login y abre 'welcome' en
 * su lugar. Ver TopBar.tsx.
 */
let pendingLoginRedirect = false

export function markPendingLoginRedirect() { pendingLoginRedirect = true }

/** Lee y consume la bandera en un solo paso — nunca queda a medio leer. */
export function consumePendingLoginRedirect(): boolean {
  const was = pendingLoginRedirect
  pendingLoginRedirect = false
  return was
}

// Solo para tests: fuera de un remount real, esta bandera puede quedar en
// `true` entre tests del mismo archivo — un test que dispara el redirect a
// login dentro de un render aislado (sin ese remount) no llega nunca a
// consumirla, y el siguiente test que renderiza TopBar desde cero la hereda.
export function __resetPendingLoginRedirectForTests() { pendingLoginRedirect = false }
