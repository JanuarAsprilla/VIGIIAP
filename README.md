# VIGIA — VIGIIAP

**Visor y Gestor de Información Ambiental del Pacífico**

[![CI](https://github.com/JanuarAsprilla/VIGIIAP/actions/workflows/ci.yml/badge.svg)](https://github.com/JanuarAsprilla/VIGIIAP/actions/workflows/ci.yml)
[![Licencia](https://img.shields.io/badge/licencia-MIT-blue)](LICENSE)

Plataforma web institucional de datos espaciales y gestión de información ambiental para el **Chocó Biogeográfico colombiano**, desarrollada para el [Instituto de Investigaciones Ambientales del Pacífico (IIAP)](https://www.iiap.org.co).

Frontend en producción. Consume la API de [VIGIIAP-backend](https://github.com/JanuarAsprilla/VIGIIAP-backend), un servicio Node.js/Express independiente.

---

## Módulos

**Portal público** (sin sesión, con contenido restringido por rol cuando aplica):

| Módulo | Ruta | Descripción |
|---|---|---|
| Mapas | `/mapas` | Cartografía oficial — PDF, imagen o enlace a geovisor, con metadatos técnicos ISO 19115/IGAC opcionales |
| Documentos | `/documentos` | Biblioteca de planes, decretos y estudios técnicos |
| Geovisores | `/geovisores` | Catálogo de geovisores temáticos conectados en vivo a GeoServer (WMS) |
| Herramientas | `/herramientas` | Calculadoras y paneles de análisis (incluye el panel Chocó Biogeográfico) |
| Solicitudes | `/solicitudes` | Trámites de acceso a información geoespacial (usuarios verificados) |

**Panel de administración** (`/admin/*`, rol `admin_sig` o `super_admin`, con permisos granulares por módulo):

Usuarios · Solicitudes · Documentos · Mapas · Geovisores · Conexiones GeoServer · Categorías · Configuración · Registro de Actividad (auditoría) · Errores · Reportes · Papelera · Gestión de Administradores (solo `super_admin`).

---

## Stack técnico

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS v4**
- **React Router v7** — layouts separados para sitio público (`MainLayout`) y panel admin (`AdminLayout`), carga perezosa (`React.lazy`) por página
- **TanStack Query** — estado de servidor, caché e invalidación
- **Framer Motion** — animaciones y transiciones
- **Three.js + React Three Fiber** — escena 3D del hero
- **Leaflet** — mapas interactivos ligeros
- **ExcelJS** — exportación de reportes institucionales
- **Vitest + Testing Library** — pruebas unitarias/integración; **Playwright** para E2E
- **ESLint** — lint

---

## Estructura del proyecto

```
VIGIIAP/
├── .github/workflows/        # CI, Deploy (build Docker + push GHCR + SSH al VPS)
├── src/
│   ├── components/           # UI compartida, layout admin/público, formularios por módulo
│   ├── contexts/              # AuthContext, SearchContext, ThemeContext, UIContext
│   ├── hooks/                 # useMapas, useDocumentos, useGeovisores, useAuditLog, ...
│   ├── layouts/               # MainLayout (público), AdminLayout
│   ├── lib/                   # api.ts (cliente axios + CSRF), animations, constants
│   ├── types/                 # Tipos compartidos (espejo de los schemas Zod del backend)
│   └── pages/
│       ├── auth/               # Login, SolicitarAcceso, RecuperarPassword, 2FA
│       ├── admin/               # Una página por módulo del panel admin
│       └── recursos/            # GuiaUsuario, FAQ, Términos, Política de privacidad
├── nginx.conf                 # Config de assets estáticos (cache inmutable + no-cache en index.html)
├── Dockerfile                 # Build multi-stage: Node (build) → nginx (runtime)
├── CONTRIBUTING.md
└── README.md
```

---

## Instalación y desarrollo local

**Requisitos:** Node.js 20+, npm 9+. Necesita el [backend](https://github.com/JanuarAsprilla/VIGIIAP-backend) corriendo en paralelo (por defecto, `http://localhost:4000`).

```bash
git clone https://github.com/JanuarAsprilla/VIGIIAP.git
cd VIGIIAP
npm install

cp .env.example .env   # dejar VITE_API_URL vacío en dev — Vite usa el proxy al backend local

npm run dev             # → http://localhost:5173
npm run build            # build de producción
npm run typecheck        # tsc --noEmit
npm run lint
npm run test:run         # Vitest
```

---

## Despliegue

GitHub Actions construye la imagen Docker (nginx sirviendo el build estático), la publica en GitHub Container Registry, y la despliega vía SSH sobre un servidor propio (Docker Compose) — no depende de un PaaS de terceros. Ver `.github/workflows/deploy.yml`.

---

## Flujo de trabajo

Ver [CONTRIBUTING.md](CONTRIBUTING.md) para la estrategia de ramas, commits y Pull Requests. Cada cambio va en una rama propia contra `main`, con CI (lint, typecheck, tests, build, E2E) obligatorio antes de mergear.

---

## Licencia

MIT © [IIAP](https://www.iiap.org.co) — Instituto de Investigaciones Ambientales del Pacífico
