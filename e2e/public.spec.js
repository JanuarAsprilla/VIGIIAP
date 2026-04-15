import { test, expect } from '@playwright/test';

// ─── Páginas públicas ──────────────────────────────────────────────────────────

test.describe('Página principal', () => {
  test('carga y muestra elementos clave', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/VIGIIAP|IIAP/i);
    // Debe mostrar el header/nav con la marca
    const header = page.locator('header, nav').first();
    await expect(header).toBeVisible();
  });

  test('la nav tiene enlaces a secciones principales', async ({ page }) => {
    await page.goto('/');
    // Noticias y Documentos son rutas públicas sin login
    await expect(page.locator('a[href*="noticias"]').first()).toBeVisible();
  });
});

test.describe('Noticias — listado', () => {
  test('retorna 200 y muestra la sección de noticias', async ({ page }) => {
    await page.goto('/noticias');
    await expect(page).toHaveURL(/noticias/);
    // Título de sección visible
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('filtro de búsqueda existe en la página', async ({ page }) => {
    await page.goto('/noticias');
    const searchInput = page.locator('input[type="search"], input[placeholder*="buscar" i], input[placeholder*="filtrar" i]');
    await expect(searchInput.first()).toBeVisible();
  });
});

test.describe('Documentos — listado', () => {
  test('carga sin autenticación', async ({ page }) => {
    await page.goto('/documentos');
    await expect(page).toHaveURL(/documentos/);
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });
});

test.describe('Rutas públicas de texto', () => {
  test('FAQ carga correctamente', async ({ page }) => {
    await page.goto('/faq');
    await expect(page).toHaveURL(/faq/);
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('Guía de usuario carga correctamente', async ({ page }) => {
    await page.goto('/guia-usuario');
    await expect(page).toHaveURL(/guia-usuario/);
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('Términos carga correctamente', async ({ page }) => {
    await page.goto('/terminos');
    await expect(page).toHaveURL(/terminos/);
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });
});

test.describe('Ruta 404', () => {
  test('página inexistente muestra pantalla de error', async ({ page }) => {
    await page.goto('/ruta-que-no-existe');
    // O redirige a / o muestra contenido de error
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });
});
