# VIGIIAP — Visor y Gestor de Información Ambiental del IIAP

## Proyecto
Plataforma web tipo dashboard para gestión de información ambiental del Chocó Biogeográfico colombiano. Desarrollado para el Instituto de Investigaciones Ambientales del Pacífico (IIAP).

## Stack Técnico
- **Frontend:** React 18 + Vite + Tailwind CSS v4 + Framer Motion
- **Router:** React Router v6 con lazy loading por módulo
- **Íconos:** lucide-react
- **Mapas:** Leaflet + react-leaflet
- **Estado auth:** React Context (AuthContext)

## Estructura
```
src/
├── components/       # Sidebar, TopBar, FooterBar, BottomTabs, Preloader
├── contexts/         # AuthContext.jsx
├── layouts/          # MainLayout.jsx (Sidebar + TopBar + Outlet + FooterBar)
├── lib/              # constants.js (rutas, datos, configuración)
├── pages/
│   ├── auth/         # Login, SolicitarAcceso, RecuperarPassword
│   ├── recursos/     # GuiaUsuario, FAQ, Terminos
│   ├── Home.jsx
│   ├── Mapas.jsx
│   ├── Documentos.jsx
│   ├── Geovisor.jsx
│   ├── Herramientas.jsx
│   ├── Solicitudes.jsx
│   ├── Noticias.jsx
│   └── NoticiaDetalle.jsx
└── index.css         # Design tokens Tailwind v4
```

## Design System (Figma)
- **Primary:** #1B4332 (900) → #D8F3DC (100)
- **Gold:** #D4A373
- **Orange:** #E76F51
- **Fonts:** Playfair Display (títulos) + Source Sans 3 (cuerpo)
- **Layout:** Dashboard con sidebar 200px fijo + topbar + bottom tabs móvil

## Reglas de Desarrollo
1. Cada módulo es una ruta independiente con lazy loading
2. Componentes auth-condicionales: TopBar y Sidebar cambian según sesión
3. Sin sesión: solo nav + "Ingresar". Con sesión: Soporte, Ayuda, Bell, Settings, perfil, Nuevo Análisis, Cerrar Sesión
4. Usar clases utilitarias de index.css: .page-header-tag, .page-header-title, .page-header-description, .card-title, .card-text, .table-header
5. Formatos de mapas: solo PDF, IMG y link al Geovisor (sin SHP/GeoJSON/TIF)
6. Commits convencionales: feat:, fix:, refactor:
7. Ramas de feature: feat/nombre-de-tarea

## Estado Actual
Fase 1 frontend **completa**. Todos los módulos implementados y verificados:
- Auth condicional en Sidebar, TopBar y FAB de Home
- Páginas Noticias y NoticiaDetalle con ALL_NEWS en constants.js
- Footer con `<Link>` de React Router para recursos
- Páginas auth: Login, SolicitarAcceso, RecuperarPassword
- Páginas recursos: GuiaUsuario, FAQ, Terminos
- Listo para Fase 2 (backend)

## Backend (Fase 2 — próximo)
- Node.js + Express
- PostgreSQL + PostGIS (Supabase Pro)
- JWT auth con 3 roles: Administrador SIG, Investigador, Público
- API REST por dominio: /api/auth, /api/mapas, /api/documentos, etc.
- Cloudflare R2 para almacenamiento de archivos
```

---

### Ahora usa Claude Code para aplicar los cambios pendientes

En la terminal donde tienes Claude Code activo, dale este prompt:
```
Revisa el estado actual del proyecto. Necesito que apliques estos cambios pendientes:

1. Verificar que src/components/Sidebar.jsx tenga auth condicional (useAuth) — sin sesión no debe mostrar Nuevo Análisis, Configuración ni Cerrar Sesión
2. Verificar que src/components/TopBar.jsx tenga auth condicional — sin sesión no debe mostrar Soporte, Ayuda, Bell ni Settings. Debe tener dropdown en el avatar
3. Que el Footer.jsx tenga los links de recursos usando <Link> de React Router apuntando a /guia-usuario, /faq, /terminos
4. Crear src/pages/Noticias.jsx (listado) y src/pages/NoticiaDetalle.jsx (detalle con slug)
5. Agregar ALL_NEWS en constants.js y las rutas /noticias y /noticias/:slug en App.jsx
6. Quitar SystemStatus del Home.jsx
7. Que las noticias en Home sean clickeables y lleven al detalle
8. Crear src/pages/auth/RecuperarPassword.jsx y agregar ruta /recuperar-password

Después de aplicar cada cambio, verifica con npm run dev que compile sin errores.
```

Claude Code va a leer los archivos, detectar qué falta, hacer las ediciones directamente y verificar que todo compile. Eso te ahorra todo el copiar/pegar.

---

### Flujo de trabajo de aquí en adelante

Para cada tarea nueva, el flujo será:
```
1. Tú me dices qué quieres hacer
2. Yo te doy la especificación detallada
3. Tú le pasas esa especificación a Claude Code
4. Claude Code edita los archivos y verifica
5. Tú revisas visualmente en el navegador
6. Commit + merge
