# VIGIA-IIAP

**Visor y Gestor de Información Ambiental del Pacífico**

[![CI](https://github.com/JanuarAsprilla/VIGIIAP/actions/workflows/ci.yml/badge.svg)](https://github.com/JanuarAsprilla/VIGIIAP/actions/workflows/ci.yml)
[![Licencia: MIT](https://img.shields.io/badge/licencia-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)](https://www.typescriptlang.org)

Plataforma web institucional de datos espaciales y gestión de información ambiental del
**Chocó Biogeográfico colombiano**, desarrollada para el
[Instituto de Investigaciones Ambientales del Pacífico (IIAP)](https://www.iiap.org.co).

🌐 **En producción:** <https://vigiiap.iiap.org.co>

Este repositorio contiene la aplicación web (frontend). Consume la API de
[VIGIIAP-backend](https://github.com/JanuarAsprilla/VIGIIAP-backend).

---

## Funcionalidades

| Módulo | Descripción |
|---|---|
| **Mapas** | Cartografía oficial en PDF, imagen o enlace a geovisor, con metadatos técnicos. |
| **Documentos** | Biblioteca de planes, decretos y estudios técnicos. |
| **Geovisores** | Catálogo de geovisores temáticos conectados en vivo a servidores GeoServer. Las capas nuevas se detectan y se señalan automáticamente. |
| **Herramientas** | Calculadoras y paneles de análisis para el trabajo con información geoespacial. |
| **Solicitudes** | Trámites de acceso a información geoespacial. |
| **Panel de administración** | Gestión de contenido, usuarios, categorías, conexiones a servidores de mapas, reportes y trazabilidad, con permisos por módulo. |

La plataforma es responsiva, soporta modo claro/oscuro y sigue criterios de accesibilidad WCAG AA.

---

## Tecnologías

- **React 19** y **TypeScript** sobre **Vite**
- **Tailwind CSS 4** para estilos
- **React Router** con carga perezosa por página
- **TanStack Query** para estado de servidor y caché
- **Leaflet** para mapas y **Three.js** para la escena 3D de portada
- **Framer Motion** para transiciones
- **Vitest** y **Testing Library** para pruebas; **Playwright** para pruebas de extremo a extremo

---

## Primeros pasos

**Requisitos:** Node.js 20 o superior y npm 9 o superior. Necesitas el
[backend](https://github.com/JanuarAsprilla/VIGIIAP-backend) en ejecución
(por defecto en `http://localhost:4000`).

```bash
git clone https://github.com/JanuarAsprilla/VIGIIAP.git
cd VIGIIAP
npm install
cp .env.example .env
npm run dev
```

La aplicación queda disponible en <http://localhost:5173>.

### Comandos útiles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm run typecheck` | Verificación de tipos |
| `npm run lint` | Análisis estático |
| `npm run test:run` | Pruebas unitarias y de integración |
| `npm run test:coverage` | Pruebas con informe de cobertura |

### Configuración

Las variables de entorno están documentadas en [`.env.example`](.env.example).
No subas tu archivo `.env` al repositorio.

---

## Estructura

```
src/
├── components/   # Interfaz compartida y formularios por módulo
├── contexts/     # Estado global (sesión, tema, búsqueda)
├── hooks/        # Acceso a datos y lógica reutilizable
├── layouts/      # Estructuras de página
├── lib/          # Cliente de API, constantes, utilidades
├── pages/        # Una página por ruta
└── types/        # Tipos compartidos
e2e/              # Pruebas de extremo a extremo
```

---

## Calidad

Cada Pull Request pasa por una verificación automática de lint, tipos, pruebas con
umbral de cobertura, compilación, pruebas de extremo a extremo, auditoría de dependencias
y detección de secretos.

---

## Contribuir

Lee la [guía de contribución](CONTRIBUTING.md): flujo de ramas (`develop` → `main`),
convención de commits y lista de verificación para Pull Requests.

## Seguridad

Para reportar una vulnerabilidad sigue la [política de seguridad](SECURITY.md).
**No abras un issue público.**

## Licencia

[MIT](LICENSE) © Instituto de Investigaciones Ambientales del Pacífico (IIAP)
