import { test, expect } from '@playwright/test';

/**
 * Tests para flujos que requieren autenticación.
 * Estos tests usan credenciales reales de la base de datos de Supabase.
 * Se puede configurar vía variables de entorno:
 *   E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD
 *   E2E_USER_EMAIL  / E2E_USER_PASSWORD
 */

const ADMIN_EMAIL    = process.env.E2E_ADMIN_EMAIL    || 'admin@iiap.org.co';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || '';
const USER_EMAIL     = process.env.E2E_USER_EMAIL     || '';
const USER_PASSWORD  = process.env.E2E_USER_PASSWORD  || '';

// Helper: login programático
async function loginAs(page, email, password) {
  await page.goto('/login');
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);
  await page.click('button[type="submit"]');
  // Esperar redirección fuera de /login
  await page.waitForURL(url => !url.pathname.includes('login'), { timeout: 8000 });
}

// ─── Flujos de usuario autenticado ───────────────────────────────────────────

test.describe('Flujo usuario autenticado (investigador/publico)', () => {
  test.skip(!USER_EMAIL || !USER_PASSWORD, 'E2E_USER_EMAIL y E2E_USER_PASSWORD no configurados');

  test.beforeEach(async ({ page }) => {
    await loginAs(page, USER_EMAIL, USER_PASSWORD);
  });

  test('ve la página de mapas después de login', async ({ page }) => {
    await page.goto('/mapas');
    await expect(page).toHaveURL(/mapas/);
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('ve sus propias solicitudes', async ({ page }) => {
    await page.goto('/solicitudes');
    await expect(page).toHaveURL(/solicitudes/);
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('puede ver su perfil', async ({ page }) => {
    await page.goto('/perfil');
    await expect(page).toHaveURL(/perfil/);
    // Debe mostrar el email del usuario
    const content = await page.textContent('body');
    expect(content.toLowerCase()).toContain(USER_EMAIL.split('@')[0].toLowerCase());
  });
});

// ─── Flujos de administrador ──────────────────────────────────────────────────

test.describe('Panel de administración', () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD no configurados');

  test.beforeEach(async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('admin accede al dashboard', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/admin/);
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('admin ve estadísticas en el dashboard', async ({ page }) => {
    await page.goto('/admin');
    // Stats cards con números
    const stats = page.locator('[class*="stat"], [class*="card"], [class*="metric"]');
    await expect(stats.first()).toBeVisible({ timeout: 5000 });
  });

  test('admin accede a gestión de usuarios', async ({ page }) => {
    await page.goto('/admin/usuarios');
    await expect(page).toHaveURL(/admin\/usuarios/);
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('admin accede a gestión de solicitudes', async ({ page }) => {
    await page.goto('/admin/solicitudes');
    await expect(page).toHaveURL(/admin\/solicitudes/);
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('admin accede a gestión de noticias', async ({ page }) => {
    await page.goto('/admin/noticias');
    await expect(page).toHaveURL(/admin\/noticias/);
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('admin accede a gestión de documentos', async ({ page }) => {
    await page.goto('/admin/documentos');
    await expect(page).toHaveURL(/admin\/documentos/);
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('admin accede a actividad/audit log', async ({ page }) => {
    await page.goto('/admin/actividad');
    await expect(page).toHaveURL(/admin\/actividad/);
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('admin accede a configuración del sistema', async ({ page }) => {
    await page.goto('/admin/configuracion');
    await expect(page).toHaveURL(/admin\/configuracion/);
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('panel admin no es accesible sin autenticación (redirección)', async ({ page: newPage }) => {
    // Nueva página sin sesión
    await newPage.goto('/admin');
    await expect(newPage).toHaveURL(/login/);
  });
});
