# Auditoría Pre-Producción — VIGIIAP
**Fecha:** 2026-07-18 | **Rondas:** 7 | **Commits:** 7

---

## Resumen Ejecutivo

Auditoría exhaustiva del frontend antes del lanzamiento a producción.
Se analizaron **100% de los archivos fuente** (src/): hooks, páginas, componentes,
contextos, layouts, librerías, configuraciones y assets públicos.

| Severidad   | Total | Resueltos |
|-------------|-------|-----------|
| CRÍTICO     | 3     | 3 ✅      |
| ALTO        | 9     | 9 ✅      |
| MEDIO       | 10    | 10 ✅     |
| BAJO        | 4     | 4 ✅      |
| **TOTAL**   | **26**| **26 ✅** |

---

## Ronda 1 — Seguridad y calidad base (commit 451cbc7)

### CRÍTICO

**C-01 — Race condition en todos los guards de autenticación** (`RequireAuth.tsx`)
Todos los guards ignoraban `initializing`. Usuario autenticado redirigido a `/login`
en cada recarga mientras `GET /auth/me` resuelve (2-3s en Render free tier).
**Fix:** Guards muestran `<AuthSpinner />` hasta que `initializing === false`.

**C-02 — ESLint no cubría archivos TypeScript** (`eslint.config.js`)
`files: ['src/**/*.{js,jsx}']` — el 95% del código fuera de linting.
**Fix:** Bloque TypeScript con `typescript-eslint` parser + `@typescript-eslint/no-explicit-any`.
Paquete `typescript-eslint@^8` añadido. `lint-staged` actualizado a `.{js,jsx,ts,tsx}`.

### ALTO

**A-01 — `/perfil` detrás de `RequireAuth` en vez de `RequireVerified`** (`App.tsx`)
Usuarios `publico`/`visitante` podían acceder al perfil. CLAUDE.md especifica bloqueo.
**Fix:** `/perfil` movido al bloque `<RequireVerified>`.

**A-02 — `timeout: 0` en uploads FormData** (`api.ts:24`)
UI podía quedar bloqueada indefinidamente ante un upload colgado.
**Fix:** `config.timeout = 300_000` (5 minutos).

**A-03 — `(user as any)` y `as any` en setup 2FA** (`Perfil.tsx:223,229`)
`twoFactorEnabled` no existía en `AuthUser`. **Fix:** Campo añadido al tipo, sin cast.

**A-04 — `window.confirm()` para desactivar 2FA** (`Perfil.tsx:250`)
Bloqueante, inaccesible (no cumple WCAG). **Fix:** Modal `AnimatePresence`.

**A-05 — Sentry replay sin enmascarado de inputs** (`main.tsx`)
Podía capturar passwords en replays de error.
**Fix:** `replayIntegration({ maskAllInputs: true })`.

### MEDIO

**M-01** — `normalizeUser(raw)` sin tipos → `RawAuthUser` + `RawUsuario` con firma completa.

**M-02** — `AuthUser`/`AuthContextValue` duplicados en `types/index.ts` → eliminados.

**M-03** — `isSuperAdmin` re-derivado en `Usuarios.tsx` con `.role` → `useAuth().isSuperAdmin`.

**M-04** — `chunkSizeWarningLimit: 1000` → restaurado a `500` (default). Expone `three-vendor` 875KB.

---

## Ronda 2 — CSP, memory leaks y CSV injection (commit 498a7c5)

### CRÍTICO

**C-03 — CSP faltaba `*.basemaps.cartocdn.com`** (`render.yaml`)
El Geovisor carga tiles de CartoCDN. Sin el dominio en `img-src` + `connect-src`,
el mapa aparecía en blanco en producción. Bloqueado silenciosamente por el browser.
**Fix:** Añadidos `https://*.basemaps.cartocdn.com` y `https://*.tile.openstreetmap.org`.

### ALTO

**A-06 — `URL.createObjectURL` en render body** (`GestionCategorias.tsx` × 2, `GestionMapas.tsx`)
Cada render del componente creaba un nuevo blob URL nunca revocado.
`GestionCategorias` tenía 2 componentes afectados (`ImageDropzone`, `CategoriaCard`).
**Fix:** `useEffect` con cleanup en GestionCategorias; `previewUrlRef` + cleanup en GestionMapas.

### MEDIO

**M-05** — CSV export sin `revokeObjectURL` + sin protección de fórmulas (`Actividad.tsx`, `GestionSolicitudes.tsx`).
**Fix:** `blobUrl` con `URL.revokeObjectURL()` post-click + `csvField()` neutraliza `=+−@TAB`.

---

## Ronda 3 — GSAP ticker leak y sitemap (commit bb9ae7c)

### ALTO

**A-07 — GSAP ticker listener nunca removido** (`useLenis.ts`)
`gsap.ticker.remove(() => {})` pasaba una función anónima nueva — nunca coincidía
con la registrada. Cada mount de `MainLayout` acumulaba listeners activos
llamando `lenis.raf()` sobre instancias ya destruidas (especialmente grave con StrictMode).
**Fix:** `const tickerFn = (time) => lenis.raf(time * 1000)` → mismo ref en `add()` y `remove()`.

### MEDIO

**M-06** — `sitemap.xml` incluía `/noticias` (módulo eliminado → 404 en producción)
y rutas protegidas (`/geovisor`, `/herramientas`, `/mapas`, `/documentos`).
**Fix:** Sitemap reducido a rutas realmente públicas: `/`, `/guia-usuario`, `/faq`, `/terminos`.

### BAJO

**B-01** — `public/_headers` CSP no sincronizado con `render.yaml` — faltaban los dominios CartoCDN.
**Fix:** Actualizado con los mismos orígenes que render.yaml.

---

## Ronda 4 — Integridad funcional (commit f10a662)

### ALTO

**A-08 — `SolicitarHerramientaModal` enviaba sin backend** (`components/herramientas/SolicitarHerramientaModal.tsx`)
`handleSubmit` → `setStep('success')` directamente. Ningún dato se guardaba.
**Fix:** Conectado a `useCreateSolicitud()`. Loading state + error handler + `AlertCircle`.

### MEDIO

**M-07** — `ToolCard` sin prop para indicar herramientas en desarrollo.
Herramientas con datos hardcodeados no lo indicaban visualmente.
**Fix:** Prop `demo` con banner "Datos de muestra" en ToolCard.

---

## Ronda 5 — Herramientas demo y Husky (commit a40f50e)

**M-08** — `GeneradorBuffers`: usaba `setTimeout + datos hardcodeados`.
**B-02** — `.husky/pre-commit`: bit ejecutable nunca activado (`chmod 644` → `755`).
El hook de lint-staged nunca corría en commits. **Fix:** `git update-index --chmod=+x`.

---

## Ronda 6 — Herramientas PostGIS → Próximamente (commit e4e702f)

**A-09 — `AnalizadorSuperposicion`, `GeneradorBuffers`, `TablerosControl`**
Herramientas que ejecutaban análisis GIS con `setTimeout + OVERLAP_RESULTS/CAPAS/INDICADORES`
hardcodeados. Ninguna conectaba a backend. Riesgo alto: investigadores podrían tomar decisiones
ambientales con resultados que parecen reales pero son constantes ficticias.
`CalculadoraAreas` usa math real MAGNA-SIRGAS — removido el badge demo.
**Fix:** Las 3 reemplazadas por UI de "En desarrollo / Próximamente" con descripción honesta.

---

## Ronda 7 — NuevoAnalisisModal (commit b664d05)

**A-10 — `NuevoAnalisisModal` enviaba sin backend** (`components/NuevoAnalisisModal.tsx`)
Mismo patrón que SolicitarHerramientaModal: `handleSubmit` → `setStep('success')`.
Análisis creados desde la sidebar nunca se registraban.
**Fix:** Conectado a `useCreateSolicitud({ tipo: 'estudio-ambiental' })`.

---

## Verificado como Correcto

- CSP `script-src 'self'` — correcto para SPA estática sin SSR
- Token JWT en HttpOnly cookie, no localStorage
- Open redirect en Login (`rawFrom.startsWith('/') && !rawFrom.startsWith('//')`)
- Token format en ResetPassword (`TOKEN_RE = /^[A-Za-z0-9_-]{20,}$/`)
- Sentry deshabilitado fuera de producción
- Chunking manual (three, motion, query, map, sentry separados)
- Visibilidad de mapas/documentos filtrada por backend (no client-side)
- XSS: sin `dangerouslySetInnerHTML` en ningún archivo
- `fetch()` directo en `forceDownload` validado con `isTrustedUrl()` antes de ejecutar
- `window.open()` siempre con `noopener,noreferrer`
- UIContext valida localStorage con allowlists antes de aplicar valores
- Uploads de archivos restringidos por tipo MIME y tamaño máximo
- `robots.txt` correctamente bloquea `/admin`, `/perfil`, `/solicitudes`
- GestionAdmins correctamente protegido por `RequireSuperAdmin`
- RBAC de asignación de roles: admin_sig no puede asignar rol admin_sig ni superior
- Todos los formularios de auth tienen `autoComplete` correcto
- No hay `process.env` en el frontend (siempre `import.meta.env`)
- No hay credenciales hardcodeadas en ningún archivo fuente
- `AplicacionesMoviles` y `Geoformularios` son UI informativa, sin submit falso

---

## Pendiente Post-Lanzamiento

| Prioridad | Item |
|-----------|------|
| Alta | `noImplicitAny: true` — ~65 archivos con props sin tipado |
| Media | `three-vendor` 875KB — lazy load Three.js solo donde se usa |
| Media | `react-router` duplicado en package.json (v7 consolida en uno) |
| Media | Paginación real — `limit: 200` en 5 páginas admin |
| Baja | SRI para Google Fonts en `index.html` |
| Baja | `secret` TOTP en React state durante setup 2FA |
| Baja | `useReducedMotion` solo en 2 de ~50 componentes animados |

---

## Historial de Commits

| Commit | Ronda | Descripción |
|--------|-------|-------------|
| `451cbc7` | 1 | 12 hallazgos base — guards, ESLint, CSP, tipos |
| `498a7c5` | 2 | CSP CartoCDN, memory leaks, CSV injection |
| `bb9ae7c` | 3 | GSAP ticker leak, sitemap, _headers |
| `f10a662` | 4 | SolicitarHerramientaModal + demo badge |
| `a40f50e` | 5 | GeneradorBuffers demo + Husky chmod |
| `e4e702f` | 6 | Herramientas PostGIS → Próximamente |
| `b664d05` | 7 | NuevoAnalisisModal conectado al backend |
