# Guía de Contribución — VIGIIAP

Este documento define los estándares de trabajo del equipo. Seguirlos garantiza un historial de Git limpio, revisiones eficientes y un proceso de release predecible.

---

## Modelo de ramas

Usamos una variante de **GitFlow** adaptada al equipo:

```
main
 └── develop
      ├── feat/VIG-001-nombre-descriptivo
      ├── fix/VIG-002-nombre-del-bug
      ├── hotfix/VIG-003-nombre-critico
      ├── release/v1.2.0
      └── chore/nombre-tarea
```

### Ramas permanentes

| Rama | Propósito | Push directo |
|---|---|---|
| `main` | Código en producción. Solo recibe merges desde `release/*` o `hotfix/*` | **Prohibido** |
| `develop` | Integración continua. Base para todas las features | **Prohibido** |

### Ramas temporales

| Prefijo | Cuándo usarlo | Ejemplo |
|---|---|---|
| `feat/` | Nueva funcionalidad | `feat/VIG-014-modulo-reportes` |
| `fix/` | Corrección de bug en desarrollo | `fix/VIG-021-error-filtro-mapas` |
| `hotfix/` | Corrección urgente directamente sobre `main` | `hotfix/VIG-033-crash-login` |
| `release/` | Preparación de una versión para producción | `release/v1.1.0` |
| `chore/` | Tareas de mantenimiento (CI, dependencias, config) | `chore/actualizar-dependencias` |
| `docs/` | Solo documentación | `docs/guia-api-backend` |

> **Convención de nombres:** `prefijo/VIG-NNN-descripcion-en-minusculas-con-guiones`
> El número `VIG-NNN` corresponde al Issue de GitHub asociado.

---

## Ciclo de vida de una tarea

```
1. Crear Issue en GitHub  →  asignar label + milestone
2. git checkout develop && git pull origin develop
3. git checkout -b feat/VIG-NNN-descripcion
4. Desarrollar + commits atómicos
5. git push origin feat/VIG-NNN-descripcion
6. Abrir Pull Request → develop
7. CI pasa ✅ → merge con squash
8. Borrar rama remota
```

---

## Commits convencionales

Seguimos [Conventional Commits](https://www.conventionalcommits.org):

```
<tipo>(<alcance>): <descripción en imperativo>

[cuerpo opcional]

[pie opcional]
```

### Tipos permitidos

| Tipo | Cuándo |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `refactor` | Mejora de código sin cambio funcional |
| `chore` | Tareas de mantenimiento (build, CI, deps) |
| `docs` | Solo documentación |
| `style` | Cambios de formato (sin lógica) |
| `test` | Agregar o corregir tests |
| `perf` | Mejora de rendimiento |

### Ejemplos

```bash
feat(mapas): agregar filtro por año en catálogo de mapas
fix(auth): corregir redirección tras login con state.from
refactor(sidebar): extraer NuevoAnalisisModal a componente independiente
chore(ci): agregar step de lint en GitHub Actions
docs(contributing): agregar convención de nombres de ramas
```

---

## Pull Requests

### Reglas

- Todo PR debe ir hacia `develop` (nunca directo a `main`)
- El título del PR sigue la misma convención que los commits
- El CI debe pasar antes de mergear
- Usar **Squash and merge** para mantener historial limpio en `develop`

### Tamaño ideal de un PR

Un PR debe resolver **una sola cosa**. Si estás tocando más de 10 archivos sin relación entre sí, considera dividirlo.

---

## Estrategia de releases

Cuando `develop` acumula suficientes features para una versión:

```bash
# 1. Crear rama de release desde develop
git checkout develop
git checkout -b release/v1.1.0

# 2. Ajustar versión en package.json, actualizar CHANGELOG
# 3. Abrir PR: release/v1.1.0 → main
# 4. Tras el merge a main, crear tag
git tag -a v1.1.0 -m "Release v1.1.0"
git push origin v1.1.0

# 5. Merge de vuelta a develop (para incluir ajustes del release)
git checkout develop
git merge release/v1.1.0
```

### Versionado semántico

`vMAYOR.MENOR.PARCHE`

| Cambio | Incrementa |
|---|---|
| Breaking change, rediseño mayor | MAYOR |
| Nueva funcionalidad compatible | MENOR |
| Bug fix, ajuste menor | PARCHE |

---

## Hotfixes (bugs críticos en producción)

```bash
# Partir desde main (no desde develop)
git checkout main
git checkout -b hotfix/VIG-NNN-descripcion

# Fix + commit + push
# PR → main  (CI debe pasar)
# Tras merge: también mergear a develop
git checkout develop
git merge hotfix/VIG-NNN-descripcion
```

---

## Checklist antes de abrir un PR

- [ ] El build pasa localmente (`npm run build`)
- [ ] No hay `console.log` de debug en el código
- [ ] Los datos del dominio están en `constants.js`, no hardcodeados en componentes
- [ ] Los nuevos componentes tienen `aria-label` si son botones de icono
- [ ] Se actualizó `CLAUDE.md` si cambió la arquitectura
