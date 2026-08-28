# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
El historial completo previo a esta fecha está disponible en `git log`; este
archivo empieza a trackear desde acá en adelante.

## [Unreleased]

### Seguridad
- El repositorio pasa a privado (frontend y backend).
- El pipeline de CI ya no expone secrets ni la URL del backend de producción
  a workflows disparados por `pull_request` — solo en `push` a `develop`/`main`.

### Corregido
- La sesión ya no se cerraba a la fuerza cada 15 minutos: el cliente axios
  ahora implementa refresh silencioso contra el backend.
- El gráfico "Distribución de Roles" del dashboard admin omitía Técnico SIG
  y Funcionario Institucional.
- El botón de descarga de mapas ya no dispara descargas duplicadas con
  doble clic.
- La barra de progreso del preloader volvía a animar `width` en vez de
  `transform` (regresión de un fix anterior).
- Un usuario `super_admin` no veía las estadísticas de administrador en
  Herramientas — el chequeo solo reconocía `admin_sig`.

### Rendimiento
- Los chunks de Three.js (886 KB) y Leaflet (163 KB) se precargaban en
  todas las páginas pese a cargarse de forma diferida (`React.lazy()`);
  ahora solo se piden cuando corresponde (Home, Mapas/Geovisor).

### Tests
- Cobertura de tests real corregida: `vitest.config.ts` no instrumentaba
  la mayoría del código fuente, así que el 98.84% reportado medía casi
  nada. Cobertura real actual: ~84% statements / ~82% branches.
- `e2e/authenticated.spec.ts` (flujos con sesión iniciada: dashboard,
  panel admin, mapas, documentos, solicitudes) conectado al pipeline de
  CI — antes solo corrían los tests públicos y de login.

### Quitado
- Documentación interna de auditoría y de proceso de desarrollo asistido
  por IA que no debía quedar en el repositorio.
