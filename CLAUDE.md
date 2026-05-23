# Loopi v2 — Frontend (Angular)

La fuente de verdad del proyecto es la constitución en `loopi-specs-v2/.specify/memory/constitution.md`.
Este archivo resume las reglas operativas que Claude Code necesita para escribir código correcto en este repo.

## Idioma

Todo en **español**: nombres de componentes de dominio, servicios, modelos, textos UI, mensajes de error.
Excepción: clases y métodos en PascalCase/camelCase según convención Angular/TypeScript.

## Gates — ejecutar antes de cada commit, push o PR (en orden)

```bash
ng build                          # compila (TypeScript estricto habilitado)
npm audit --audit-level=high      # CVEs de severidad alta/crítica en dependencias
gitleaks detect --no-git          # secrets en archivos del commit
ng test --watch=false             # tests unitarios
```

## Stack

- Angular (última versión estable), **componentes standalone** obligatorio. Sin NgModules.
- **Signals** para estado reactivo. RxJS solo donde signals no alcance.
- Tailwind CSS v4.

## Convenciones de API

- Base URL: `/api/v1/`
- Los errores siempre tienen esta forma:

```json
{ "error": "codigo_snake_case", "mensaje": "Texto para el usuario", "campo": "opcional", "detalles": [] }
```

- Mostrar `mensaje` al usuario en la UI.
- Usar `campo` para resaltar el campo con error en formularios.
- HTTP 401 → redirigir a login. HTTP 403 → mostrar mensaje de acceso denegado sin revelar contenido.

## Timestamps

Los timestamps de la API ya vienen en hora Colombia (`America/Bogota`).
**No convertir ni ajustar zona horaria**. Mostrar directamente.

## Roles

Cuatro roles: `admin`, `lider_compras`, `lider_tienda`, `barista`.
El frontend oculta elementos de UI según el rol del JWT.
La validación real de permisos es responsabilidad del backend — el frontend es solo UX.

---

# Git Workflow

## Gitflow — regla obligatoria

Todo cambio en este repositorio debe seguir el flujo **Gitflow**. Nunca hagas cambios directamente en `main` o `develop`.

### Ramas principales

| Rama | Propósito |
|------|-----------|
| `main` | Código en producción. Solo recibe merges desde `release/*` o `hotfix/*`. |
| `develop` | Base de integración. Todo trabajo nuevo parte desde aquí. |

### Crear un branch nuevo

**Siempre parte desde `develop`** (excepto `hotfix/*`, que parte desde `main`):

```bash
git checkout develop
git pull origin develop
git checkout -b <tipo>/<nombre-descriptivo>
```

### Convención de nombres

| Tipo | Prefijo | Cuándo usarlo | Ejemplo |
|------|---------|---------------|---------|
| Nueva funcionalidad | `feature/` | Cualquier nueva feature o mejora | `feature/auth-google-login` |
| Corrección urgente en prod | `hotfix/` | Bug crítico que requiere parche inmediato en `main` | `hotfix/fix-payment-crash` |
| Corrección no urgente | `bugfix/` | Bug detectado en `develop` o QA | `bugfix/fix-empty-cart-error` |
| Preparación de versión | `release/` | Estabilización antes de merge a `main` | `release/v1.2.0` |
| Tareas técnicas / refactor | `chore/` | Dependencias, CI, configuración, refactor | `chore/upgrade-node-20` |

### Reglas

- El nombre del branch debe ser en **minúsculas**, palabras separadas por `-`.
- Los `hotfix/*` parten desde `main` y se mergean a `main` **y** `develop`.
- Los `feature/*`, `bugfix/*` y `chore/*` parten desde `develop` y se mergean solo a `develop`.
- Los `release/*` parten desde `develop` y se mergean a `main` **y** `develop`.
- Nunca hagas `git push --force` en `main` o `develop`.
