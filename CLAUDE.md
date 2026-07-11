<!-- synced: constitution v2.0.0 | frontend-standards v1.0.0 | environments-ci v1.0.0 -->

# Loopi v2 — Frontend (Angular)

La fuente de verdad del proyecto es `loopi-specs-v2/.specify/memory/`:
- `constitution.md` — principios de producto/arquitectura (rara vez cambian).
- `standards/frontend.md` — normativo para este repo, cómo se implementa (cambia con frecuencia).
- `standards/environments-ci.md` — ambientes y CI comunes a los tres repos.

Este archivo es un **excerpt sincronizado** de esos documentos (ver cabecera de versión arriba).
Antes de construir una vista nueva, revisa primero el catálogo de componentes transversales
(`FE-COMP-01` abajo) — la mayoría de vistas de catálogo/maestro NO deberían escribir HTML/CSS
nuevo para lista, filtros, badges o formularios; deberían componer los componentes existentes.

## Idioma

Todo en **español**: nombres de componentes de dominio, servicios, modelos, textos UI, mensajes de error.
Excepción: clases y métodos en PascalCase/camelCase según convención Angular/TypeScript.

## Gates — ejecutar antes de cada commit, push o PR (en orden) [FE-CI-01]

```bash
ng build                          # compila (TypeScript estricto habilitado)
npm audit --audit-level=high      # CVEs de severidad alta/crítica en dependencias
gitleaks detect --no-git          # secrets en archivos del commit
ng test --watch=false             # tests unitarios
```

Gate adicional en CI (GitHub Actions): Trivy fs scan (`HIGH,CRITICAL`, `ignore-unfixed: true`).
Pruebas: unitarias por componente + funcionales automatizadas para flujos críticos (P1).

## Stack [FE-STACK-01]

- Angular (última versión estable), **componentes standalone** obligatorio. Sin NgModules.
- **Signals** para estado reactivo. RxJS solo donde signals no alcance.
- Tailwind CSS v4, utility-first. Sin PrimeNG, Angular Material, DaisyUI ni librerías de
  componentes externas. Componentes propios en `src/app/shared/components/`.
- Ningún color de marca hardcodeado en clases arbitrarias — como variable de diseño en
  `tailwind.config.ts` cuando el sistema de marca esté definido.

## Componentes Angular transversales — catálogo obligatorio [FE-COMP-01]

**Prohibido reimplementar** la funcionalidad de cualquiera de estos componentes en una vista de
feature. Si un caso no está cubierto, extender con un `@Input()` nuevo y actualizar
`specs/000-design-system/spec.md` — no crear una versión ad-hoc paralela.

| Componente / Servicio | Selector | Responsabilidad |
|----------------------|----------|-----------------|
| `ListCardComponent` | `app-list-card` | Card blanca para listados; capa 2 de la jerarquía visual |
| `FilterBarComponent` | `app-filter-bar` | Barra de filtros con chips; default Estado=Activo |
| `StatusBadgeComponent` | `app-status-badge` | Badge verde/gris para el campo `activo` |
| `DataTableComponent` | `app-data-table` | Tabla con filas clickeables; `opacity-60` en filas inactivas |
| `EmptyStateComponent` | `app-empty-state` | Estado vacío con mensaje y acción sugerida |
| `PaginationComponent` | `app-pagination` | Paginación server-side |
| `PageHeaderComponent` | `app-page-header` | H1 + breadcrumb + slot de acción primaria |
| `FormCardComponent` | `app-form-card` | Card blanca para formularios; variantes sm/md/lg |
| `ReadonlyFieldComponent` | `app-readonly-field` | Label + valor no editable con ícono de candado |
| `DangerZoneComponent` | `app-danger-zone` | Sección de acciones destructivas (borde rojo) |
| `FilterStateService` | `@Injectable({providedIn:'root'})` | Estado de filtros por ruta; persiste durante la sesión |
| `FormModeService` | `@Injectable()` (por feature) | Contexto create/edit; oculta `DangerZoneComponent` en create |

## Jerarquía visual de 3 capas [FE-LIST-01] [FE-FORMSURF-01]

**Listados** (`ListCardComponent`): página `bg-gray-50` → card `bg-white rounded-xl border
border-gray-100 shadow-sm` (ancho completo, sin `max-w-*`) → `<thead>` `bg-gray-50
border-b border-gray-200` → filas `bg-white hover:bg-blue-50/30 cursor-pointer`.

**Formularios** (`FormCardComponent`): página `bg-gray-50` → tarjeta `bg-white rounded-xl
border border-gray-100 shadow-sm p-6 lg:p-8` centrada con `mx-auto` → inputs con `bg-white`
explícito. Ancho según densidad: ≤6 campos `max-w-lg`, 7–15 `max-w-2xl`, >15 `max-w-4xl`.
Nunca fondo blanco en página y tarjeta a la vez. No usar `<main>` propio en la vista (el
`ShellComponent` ya lo aporta) — el elemento raíz es un `<div>`.

**Read-only/disabled**: nunca `bg-white` en un input `readonly`/`disabled`. Editable:
`bg-white border-gray-300`. Read-only: `bg-gray-100 border-gray-200 text-gray-500`. El label
lleva señal visual (candado o `(no editable)`). Implementación: `ReadonlyFieldComponent`.

**Estado de registros**: badge `StatusBadgeComponent` (verde `bg-green-100 text-green-700`
Activo / gris `bg-gray-100 text-gray-500` Inactivo) + fila inactiva con `opacity-60` (el badge
NO lleva `opacity-60`).

## Filtros en listados [FE-FILTER-01]

Usar siempre `FilterBarComponent` + `FilterStateService` — **prohibido filtro ad-hoc por
feature**. Filtros activos como chips removibles (`bg-blue-100 text-blue-700 rounded-full`).
Todo listado de una entidad con campo `activo` DEBE preseleccionar **Estado: Activo** al cargar
por primera vez en la sesión; el chip se traduce al parámetro `?estado` del backend
(nunca `?activo=true|false` — ver `loopi-api-v2/CLAUDE.md`).

## Patrón lista → formulario [FE-LISTFORM-01]

- **Lista**: filas clickeables que navegan al formulario de edición. Sin botones "Editar"/
  "Inactivar" por fila. `<tr>` con `cursor-pointer tabindex="0" role="button" (keydown.enter)`.
- **Formulario (edición)**: acciones destructivas en sección **"Zona de precaución"** al pie
  (`DangerZoneComponent`, borde rojo), separada con `<hr>` y `mt-8`. Modal de confirmación antes
  de toda acción irreversible.
- **Texto de impacto**: lenguaje para usuarios no técnicos, sin jerga interna ("soft delete",
  "FK"). Describir el efecto real en el negocio.

## Botones de acción [FE-BTN-01]

- Botón de creación (acción primaria de lista): prefijo `+ ` — `+ Nueva tienda`, `+ Nuevo pedido`.
- Título de formulario (`<h1>`): SIN `+ ` — `Nueva tienda`, `Editar empleado`.
- El prefijo `+ ` no aplica a acciones secundarias (Editar, Inactivar, Cancelar).

## Estados de carga, error y vacío [FE-STATE-01] [FE-ERR-01] [FE-EMPTY-01]

- Carga: <300ms sin indicador · 300ms–3s spinner/skeleton inline en el área afectada · >3s
  barra de progreso o mensaje. Nunca overlay de pantalla completa salvo login inicial.
- Errores de API siempre `{ "error", "mensaje", "campo", "detalles" }` — mostrar `mensaje` al
  usuario, usar `campo` para resaltar el input. HTTP 401 → `AuthInterceptor` redirige a
  `/login`. HTTP 403 → pantalla "No tienes permiso", sin revelar el recurso.
- Todo listado/tabla que pueda estar vacío DEBE tener `EmptyStateComponent` (texto en primera
  persona + acción sugerida). Nunca una lista en blanco sin contexto.

## Formularios [FE-FORM-01]

Validación on blur + on submit. Botón de submit deshabilitado durante `loading` (previene
doble-clic). Campos obligatorios con `*` + leyenda al pie. Placeholders solo como ejemplo de
formato, nunca como reemplazo del `<label>`.

## Feedback de acciones [FE-FEEDBACK-01]

Éxito (guardar/crear/actualizar): toast verde, esquina superior derecha, auto-cierre 3s.
Eliminar/inactivar: toast neutro con opción de deshacer si es reversible en sesión.
Destructivas irreversibles: modal de confirmación, botón de confirmar es el más llamativo.

## Responsive y accesibilidad [FE-RESP-01] [FE-A11Y-01]

Mobile-first (base <640px para baristas en tienda; `sm:`/`md:`/`lg:`/`xl:` hacia desktop admin).
Ninguna vista puede romperse bajo 320px. WCAG 2.1 AA: contraste 4.5:1 (texto normal), labels
obligatorios (nunca `placeholder` como reemplazo), errores con texto descriptivo (no solo color),
navegación completa por teclado en login/formularios/modales/menús, atributos ARIA en
componentes interactivos sin equivalente HTML semántico.

## Estructura mínima de vistas [FE-VIEW-01]

`<h1>` único y descriptivo (en pantalla y en `<title>`), breadcrumb si hay jerarquía padre,
acción primaria identificada cuando aplique. Implementación: `PageHeaderComponent`.

## Sub-menú lateral [FE-NAV-01]

Expansión de grupos controlada exclusivamente por el router (`routerLinkActive` o
`router.url`) — nunca una variable booleana local que colapse al navegar entre listado y
formulario del mismo módulo.

## Convenciones de API (consumo desde el frontend)

- Base URL: `/api/v1/`. HTTP 401 → redirigir a login. HTTP 403 → mensaje de acceso denegado
  sin revelar contenido del recurso.
- Timestamps de la API ya vienen en hora Colombia (`America/Bogota`). **No convertir ni
  ajustar zona horaria** — mostrar directamente.

## Roles (principio P-III, ver constitution.md)

Cuatro roles: `admin`, `lider_compras`, `lider_tienda`, `barista`. El frontend oculta
elementos de UI según el rol del JWT — la validación real de permisos es responsabilidad del
backend, el frontend es solo UX.

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
