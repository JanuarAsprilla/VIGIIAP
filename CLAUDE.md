# VIGIIAP — Visor y Gestor de Información Ambiental del IIAP

## Proyecto
Plataforma web tipo dashboard para gestión de información ambiental del Chocó Biogeográfico colombiano. Desarrollado para el Instituto de Investigaciones Ambientales del Pacífico (IIAP).

## Stack Técnico
- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS v4 + Framer Motion
- **Router:** React Router v6 con lazy loading por módulo
- **Íconos:** lucide-react
- **Mapas:** Leaflet + react-leaflet
- **Estado auth:** React Context (AuthContext.tsx)
- **HTTP:** axios + TanStack Query (queryClient.ts)
- **Tests:** Vitest + Testing Library | E2E: Playwright

## Estructura
```
src/
├── components/
│   ├── admin/            # AdminSidebar
│   ├── herramientas/     # Componentes del módulo Herramientas
│   ├── topbar/           # TopBar, ProfileDropdown
│   ├── ui/               # Primitivos reutilizables (Toast, CommandPalette, etc.)
│   ├── AuthLayout.tsx
│   ├── BottomTabs.tsx
│   ├── ErrorBoundary.tsx
│   ├── FooterBar.tsx
│   ├── MarqueeStrip.tsx
│   ├── NuevoAnalisisModal.tsx
│   ├── PlatformIntroSection.tsx
│   ├── Preloader.tsx
│   ├── RequireAuth.tsx    # Guards: RequireAuth, RequireVerified, RequireAdmin, RequireSuperAdmin
│   ├── Sidebar.tsx
│   └── TopBar.tsx
├── contexts/
│   ├── AuthContext.tsx
│   ├── SearchContext.tsx
│   ├── ThemeContext.tsx
│   └── UIContext.tsx
├── hooks/                # useCatalogue, useDocumentos, useMapas, useUsuarios...
├── lib/
│   ├── constants/        # Rutas, datos estáticos, configuración
│   ├── api.ts            # Cliente axios centralizado
│   ├── apiError.ts
│   ├── animations.ts
│   ├── dateUtils.ts
│   ├── proyeccionMagna.ts
│   ├── queryClient.ts
│   ├── search.ts
│   └── validators.ts
├── types/                # Tipos TypeScript globales (index.ts, forms.ts)
└── pages/
    ├── admin/            # Panel admin: Dashboard, Usuarios, Mapas, Documentos, Solicitudes, Auditoria, Custodia
    ├── auth/             # Login, SolicitarAcceso, RecuperarPassword
    ├── recursos/         # GuiaUsuario, FAQ, Terminos
    ├── Home.tsx
    ├── Mapas.tsx
    ├── Documentos.tsx
    ├── Geovisor.tsx
    ├── Herramientas.tsx
    ├── NotFound.tsx
    ├── Perfil.tsx
    └── Solicitudes.tsx
```

## Design System
- **Primary:** #1B4332 (forest-800) → Paleta OKLCH `--color-forest-*`
- **Gold:** `--color-gold-500` (#F7AC42) — acciones y alertas
- **Lime:** `--color-lime-500` (#B0CB1F) — biodiversidad
- **Fonts:** Playfair Display (títulos) + Source Sans 3 (cuerpo)
- **Layout:** Sidebar 200px fijo + TopBar + BottomTabs móvil
- **Tokens:** Definidos en `src/index.css` como variables CSS

## RBAC (Roles)
Jerarquía: `super_admin` > `admin_sig` > `investigador` = `tecnico` = `institucional` > `publico` = `visitante`

| Rol | Panel Admin | Subir docs | Solicitudes | Perfil editable |
|-----|------------|-----------|-------------|-----------------|
| super_admin | Completo | ✓ | ✓ | ✓ |
| admin_sig | Sin ver/tocar super_admin | ✓ | ✓ | ✓ |
| investigador/tecnico/institucional | ✗ | ✗ | ✓ | ✓ |
| publico/visitante | ✗ | ✗ | ✗ | ✗ (403 backend) |

Guards en `src/components/RequireAuth.tsx`:
- `<RequireAuth>` — cualquier sesión
- `<RequireVerified>` — roles verificados (no publico/visitante)
- `<RequireAdmin>` — admin_sig o super_admin
- `<RequireSuperAdmin>` — solo super_admin

## Reglas de Desarrollo
1. Cada módulo es una ruta independiente con lazy loading en `App.tsx`
2. Componentes auth-condicionales: TopBar y Sidebar cambian según sesión y rol
3. Sin sesión: solo nav + "Ingresar". Con sesión: dropdown por rol, Bell, Settings, perfil
4. Usar clases utilitarias de index.css: `.page-header-tag`, `.page-header-title`, `.page-header-description`, `.card-title`, `.card-text`, `.table-header`
5. Formatos de mapas: solo PDF, IMG y link al Geovisor (sin SHP/GeoJSON/TIF)
6. Commits convencionales: `feat:`, `fix:`, `refactor:`
7. No hay módulo Noticias — fue eliminado del proyecto

## Estado Actual
Fase 1 frontend **completa + RBAC endurecido**:
- TypeScript en todo el frontend
- Auth condicional por rol en Sidebar, TopBar y FAB de Home
- RBAC gating en panel admin/Usuarios (super_admin invisible para admin_sig)
- Perfil bloqueado para roles no verificados (publico/visitante)
- Guards de ruta implementados
- 2FA UI, sesiones activas, contraseña expirada, rate limiting 429

## Backend (ya implementado — Fase 2)
Repositorio separado: `VIGIIAP-backend`
- Node.js + Express + PostgreSQL + PostGIS (Supabase)
- JWT con HttpOnly cookies, 5 roles RBAC
- API REST en `https://vigiiap-backend.onrender.com`
- Ver repo backend para detalles de endpoints
