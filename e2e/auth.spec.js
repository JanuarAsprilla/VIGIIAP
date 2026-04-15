import { test, expect } from '@playwright/test';

// ─── Login ────────────────────────────────────────────────────────────────────

test.describe('Página de Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('muestra el formulario de login', async ({ page }) => {
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"], button:has-text("Ingresar"), button:has-text("Iniciar")')).toBeVisible();
  });

  test('muestra error con credenciales inválidas', async ({ page }) => {
    await page.fill('input[type="email"], input[name="email"]', 'noexiste@test.com');
    await page.fill('input[type="password"], input[name="password"]', 'ClaveInvalida1!');
    await page.click('button[type="submit"]');
    // Espera mensaje de error
    const error = page.locator('[role="alert"], .error, [class*="error"], [class*="alert"]').first();
    await expect(error).toBeVisible({ timeout: 5000 });
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

test.describe('Redirección de rutas protegidas', () => {
  test('/perfil redirige a login sin autenticación', async ({ page }) => {
    await page.goto('/perfil');
    await expect(page).toHaveURL(/login/);
  });

  test('/admin redirige a login sin autenticación', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/login/);
  });

  test('/mapas redirige a login sin autenticación', async ({ page }) => {
    await page.goto('/mapas');
    await expect(page).toHaveURL(/login/);
  });

  test('/solicitudes redirige a login sin autenticación', async ({ page }) => {
    await page.goto('/solicitudes');
    await expect(page).toHaveURL(/login/);
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
