# VIGIIAP

**Visor y Gestor de Información Ambiental del Pacífico**

[![CI](https://github.com/JanuarAsprilla/VIGIIAP/actions/workflows/ci.yml/badge.svg)](https://github.com/JanuarAsprilla/VIGIIAP/actions/workflows/ci.yml)
[![Rama por defecto](https://img.shields.io/badge/rama%20base-develop-0e8a16)](https://github.com/JanuarAsprilla/VIGIIAP/tree/develop)
[![Licencia](https://img.shields.io/badge/licencia-MIT-blue)](LICENSE)

Plataforma web institucional de datos espaciales y gestión de información ambiental para el **Chocó Biogeográfico colombiano**, desarrollada para el [Instituto de Investigaciones Ambientales del Pacífico (IIAP)](https://www.iiap.org.co).

---

## Módulos

| Módulo | Descripción | Acceso |
|---|---|---|
| **Catálogo de Mapas** | Capas temáticas de biodiversidad, suelos y redes hídricas | Autenticado |
| **Biblioteca Documental** | Planes de ordenamiento, decretos y estudios técnicos | Autenticado |
| **Geovisor 3D** | Herramienta interactiva de análisis espacial en tiempo real | Autenticado |
| **Herramientas SIG** | Calculadoras de área, convertidores y consultas avanzadas | Autenticado |
| **Solicitudes** | Gestión de trámites ambientales y cartográficos | Autenticado |
| **Noticias** | Actualizaciones territoriales y eventos regionales | Público |

---

## Stack técnico

**Frontend**
- React 18 + Vite
- Tailwind CSS v4
- Framer Motion
- React Router v6 (lazy loading por módulo)
- Leaflet + react-leaflet
- lucide-react

**Backend** *(Fase 2 — en desarrollo)*
- Node.js + Express
- PostgreSQL + PostGIS (Supabase Pro)
- JWT — 3 roles: Administrador SIG, Investigador, Público
- Cloudflare R2 (almacenamiento de archivos)

---

## Estructura del proyecto

```
VIGIIAP/
├── .github/
│   ├── workflows/               # GitHub Actions CI/CD
│   ├── ISSUE_TEMPLATE/          # Templates de issues
│   └── PULL_REQUEST_TEMPLATE.md
├── src/
│   ├── components/              # Sidebar, TopBar, FooterBar, RequireAuth, NuevoAnalisisModal
│   ├── contexts/                # AuthContext, SearchContext, UIContext
│   ├── layouts/                 # MainLayout
│   ├── lib/                     # constants.js, search.js
│   └── pages/
│       ├── auth/                # Login, SolicitarAcceso, RecuperarPassword
│       ├── recursos/            # GuiaUsuario, FAQ, Terminos
│       ├── Home.jsx
│       ├── Mapas.jsx
│       ├── Documentos.jsx
│       ├── Geovisor.jsx
│       ├── Herramientas.jsx
│       ├── Solicitudes.jsx
│       ├── Noticias.jsx
│       └── NoticiaDetalle.jsx
├── CONTRIBUTING.md
└── README.md
```

---

## Instalación y desarrollo local

**Requisitos:** Node.js 18+, npm 9+

```bash
# 1. Clonar el repositorio
git clone https://github.com/JanuarAsprilla/VIGIIAP.git
cd VIGIIAP

# 2. Instalar dependencias
npm install

# 3. Servidor de desarrollo
npm run dev
# → http://localhost:5173

# 4. Build de producción
npm run build
```

> En modo demo, cualquier correo y contraseña no vacíos permiten ingresar.
> Las credenciales reales se conectarán en Fase 2 (backend).

---

## Flujo de trabajo

Ver [CONTRIBUTING.md](CONTRIBUTING.md) para la estrategia completa de ramas, commits y Pull Requests.

```
develop → feat/VIG-XXX-descripcion → PR → code review → merge → develop
                                                                    ↓
                                                          release/vX.X.X → main
```

---

## Fases del proyecto

| Fase | Descripción | Estado |
|---|---|---|
| **Fase 1** | Frontend completo — todos los módulos UI | ✅ Completada |
| **Fase 2** | Backend — API REST, auth JWT, base de datos | 🚧 En desarrollo |

---

## Licencia

MIT © 2026 [IIAP](https://www.iiap.org.co) — Instituto de Investigaciones Ambientales del Pacífico
# redespliegue Tue Apr 14 00:21:18 -05 2026
