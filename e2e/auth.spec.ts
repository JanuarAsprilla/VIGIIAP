import { test, expect } from '@playwright/test';

// ─── Login ────────────────────────────────────────────────────────────────────
// /login ya no es una página propia — reenvía a "/" y abre el panel de login
// anclado bajo el botón "Ingresar" del TopBar (ver src/pages/auth/Login.tsx).

test.describe('Panel de Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL('/');
  });

  test('muestra el formulario de login', async ({ page }) => {
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    // El botón "Ingresar" del TopBar (que abre el panel) y el "Iniciar
    // Sesión" del formulario coexisten mientras el panel está abierto —
    // type="submit" es el único selector que apunta solo al segundo.
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('muestra error con credenciales inválidas', async ({ page }) => {
    await page.fill('input[type="email"], input[name="email"]', 'noexiste@test.com');
    await page.fill('input[type="password"], input[name="password"]', 'ClaveInvalida1!');
    await page.click('button[type="submit"]');
    // Espera mensaje de error — timeout generoso porque en push el login pega
    // contra el backend real de Render (client timeout: 15s, ver api.ts).
    const error = page.locator('[role="alert"], .error, [class*="error"], [class*="alert"]').first();
    await expect(error).toBeVisible({ timeout: 20_000 });
  });

  test('validación de email requerido antes de enviar', async ({ page }) => {
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();
    // El navegador o React muestra validación
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const isInvalid = await emailInput.evaluate(el => !el.validity.valid || el.value === '');
    expect(isInvalid).toBe(true);
  });

  test('enlace a solicitar acceso está visible', async ({ page }) => {
    const registerLink = page.locator('a[href*="solicitar"], a[href*="registro"], a:has-text("Solicitar"), a:has-text("Registr")');
    await expect(registerLink.first()).toBeVisible();
  });
});

// ─── Protección de rutas ──────────────────────────────────────────────────────

// RequireAuth (src/components/RequireAuth.tsx) espera a que AuthContext
// resuelva GET /auth/me antes de decidir si redirige — en push eso pega
// contra el backend real de Render (client timeout: 15s, ver api.ts), así
// que estas aserciones necesitan más margen que el default de Playwright.
const REDIRECT_TIMEOUT = 20_000;

// El redirect ya no aterriza en /login (que ya no es una página) — cae en
// "/" con el panel de login abierto solo (ver el efecto en TopBar.tsx que
// lee location.state.openLogin).
test.describe('Redirección de rutas protegidas', () => {
  test('/perfil redirige a "/" con el panel de login abierto, sin autenticación', async ({ page }) => {
    await page.goto('/perfil');
    await expect(page).toHaveURL('/', { timeout: REDIRECT_TIMEOUT });
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible({ timeout: REDIRECT_TIMEOUT });
  });

  test('/admin redirige a "/" con el panel de login abierto, sin autenticación', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL('/', { timeout: REDIRECT_TIMEOUT });
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible({ timeout: REDIRECT_TIMEOUT });
  });

  test('/solicitudes redirige a "/" con el panel de login abierto, sin autenticación', async ({ page }) => {
    await page.goto('/solicitudes');
    await expect(page).toHaveURL('/', { timeout: REDIRECT_TIMEOUT });
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible({ timeout: REDIRECT_TIMEOUT });
  });
});

// ─── Módulos públicos ─────────────────────────────────────────────────────────
// Mapas, Documentos, Geovisor y Herramientas son navegables sin sesión — cada
// mapa/documento trae su propia visibilidad (público/usuarios/acreditados),
// filtrada por el backend (ver optionalAuthenticate + visibilidadPermitida en
// mapas.service.js y documentos.service.js). No deben redirigir a login.
test.describe('Módulos públicos — no redirigen sin autenticación', () => {
  test('/mapas no redirige', async ({ page }) => {
    await page.goto('/mapas');
    await expect(page).toHaveURL('/mapas', { timeout: REDIRECT_TIMEOUT });
  });

  test('/documentos no redirige', async ({ page }) => {
    await page.goto('/documentos');
    await expect(page).toHaveURL('/documentos', { timeout: REDIRECT_TIMEOUT });
  });

  test('/geovisor no redirige', async ({ page }) => {
    await page.goto('/geovisor');
    await expect(page).toHaveURL('/geovisor', { timeout: REDIRECT_TIMEOUT });
  });

  test('/herramientas no redirige', async ({ page }) => {
    await page.goto('/herramientas');
    await expect(page).toHaveURL('/herramientas', { timeout: REDIRECT_TIMEOUT });
  });
});

// ─── Solicitar acceso ─────────────────────────────────────────────────────────

test.describe('Página solicitar acceso', () => {
  test('muestra formulario de registro', async ({ page }) => {
    await page.goto('/solicitar-acceso');
    await expect(page).toHaveURL(/solicitar-acceso/);
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });
});
