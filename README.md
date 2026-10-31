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

## Contenido

- [Funcionalidades](#funcionalidades)
- [Tecnologías](#tecnologías)
- [Primeros pasos](#primeros-pasos)
- [Estructura](#estructura)
- [Roles y panel de administración](#roles-y-panel-de-administración)
- [Modo mantenimiento](#modo-mantenimiento)
- [Analítica y privacidad](#analítica-y-privacidad)
- [Rendimiento](#rendimiento)
- [Calidad y pruebas](#calidad-y-pruebas)
- [Despliegue](#despliegue)
- [Solución de problemas](#solución-de-problemas)
- [Contribuir, seguridad y licencia](#contribuir)

---

## Funcionalidades

| Módulo | Descripción |
|---|---|
| **Mapas** | Cartografía oficial en PDF, imagen o enlace a geovisor, con metadatos técnicos. |
| **Documentos** | Biblioteca de planes, decretos y estudios técnicos. |
| **Geovisores** | Catálogo de geovisores temáticos conectados en vivo a servidores GeoServer. Las capas nuevas se detectan y se señalan automáticamente. |
| **Herramientas** | Calculadoras y paneles de análisis para el trabajo con información geoespacial. |
| **Solicitudes** | Trámites de acceso a información geoespacial. |
| **Panel de administración** | Gestión de contenido, usuarios, categorías, conexiones a servidores de mapas, reportes, analítica y trazabilidad, con permisos por módulo. |

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

Las variables de entorno están documentadas en [`.env.example`](.env.example):

| Variable | Uso |
|---|---|
| `VITE_API_URL` | URL de la API. En desarrollo se deja vacía (Vite usa un proxy al backend local); en producción apunta al backend desplegado. |
| `VITE_R2_PUBLIC_URL` | URL pública del almacenamiento de imágenes y miniaturas. |
| `VITE_APP_ENV` | Entorno de la aplicación (`development` o `production`). |

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

## Roles y panel de administración

La interfaz muestra u oculta opciones según el rol de la persona y, para los administradores de contenido, según los **módulos** que se le hayan concedido (ver / editar). La verificación definitiva siempre ocurre en el backend: ocultar un botón nunca sustituye un permiso.

Cuando una persona tiene acceso a un módulo pero no a otro del que depende (por ejemplo, puede gestionar geovisores pero no las conexiones a servidores), la pantalla le ofrece solo lo que sí puede usar.

---

## Modo mantenimiento

Cuando un administrador activa el modo mantenimiento desde el panel, los visitantes ven una pantalla informativa y la interfaz consulta cada 30 segundos si el servicio ya volvió. El inicio de sesión sigue disponible para que los administradores puedan entrar y desactivarlo.

---

## Analítica y privacidad

El sitio envía a la API **eventos anónimos** de uso: páginas vistas y acciones concretas (descargar un mapa o documento, abrir un geovisor, usar una herramienta). No se asocian a la cuenta de la persona, no se envían desde el panel de administración y nunca bloquean la navegación si fallan.

Los administradores los ven en la pestaña **Analítica** de la pantalla de Actividad: visitantes en tiempo real, evolución, acciones más frecuentes, dispositivos, orígenes y ubicación aproximada. El detalle de qué se guarda y por cuánto tiempo está en el [README del backend](https://github.com/JanuarAsprilla/VIGIIAP-backend#analítica-y-privacidad).

---

## Rendimiento

- Carga perezosa por página: cada ruta descarga su código solo cuando se visita.
- Las respuestas de la API se guardan con TanStack Query y se revalidan en segundo plano.
- Los estados de carga usan esqueletos que reservan el espacio para evitar saltos de diseño.
- Los recursos pesados (como la escena 3D de portada) se cargan de forma diferida.

---

## Calidad y pruebas

Cada Pull Request pasa por una verificación automática de lint, tipos, pruebas con
umbral de cobertura, compilación, pruebas de extremo a extremo, auditoría de dependencias
y detección de secretos.

Las pruebas de extremo a extremo (Playwright) viven en `e2e/`:

```bash
npx playwright install   # primera vez
npx playwright test
```

---

## Despliegue

La imagen de Docker compila la aplicación y la sirve como archivos estáticos con Nginx (construcción en dos etapas). Al fusionar en `main`, el flujo automático construye la imagen y la despliega. La URL de la API se define al compilar mediante `VITE_API_URL`.

---

## Solución de problemas

| Síntoma | Qué revisar |
|---|---|
| Las llamadas a la API fallan en desarrollo | Que el backend esté en ejecución en `http://localhost:4000` y que `VITE_API_URL` esté vacía. |
| Aparece la pantalla de mantenimiento | El modo mantenimiento está activo; un administrador puede desactivarlo desde el panel. |
| Una opción del panel aparece deshabilitada | Falta el permiso del módulo correspondiente; se concede desde la gestión de administradores. |
| Un cambio recién publicado no se ve | La API cachea el contenido público unos minutos; recarga pasado ese tiempo. |
| Fallan las pruebas de extremo a extremo | Ejecuta `npx playwright install` y confirma que el backend de pruebas está disponible. |

---

## Contribuir

Lee la [guía de contribución](CONTRIBUTING.md): flujo de ramas (`develop` → `main`),
convención de commits y lista de verificación para Pull Requests.

## Seguridad

Para reportar una vulnerabilidad sigue la [política de seguridad](SECURITY.md).
**No abras un issue público.**

## Licencia

[MIT](LICENSE) © Instituto de Investigaciones Ambientales del Pacífico (IIAP)
