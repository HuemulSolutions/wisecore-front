# Wisecore — Guía de Validaciones RBAC

Este documento define **cómo y dónde integrar correctamente las validaciones de permisos RBAC** en páginas, secciones y componentes de la aplicación, usando los recursos reutilizables existentes.

---

## Tabla de contenidos

1. [Herramientas disponibles](#herramientas-disponibles)
2. [Recursos y acciones del sistema](#recursos-y-acciones-del-sistema)
3. [Patrón en páginas](#patrón-en-páginas)
4. [Patrón en componentes UI](#patrón-en-componentes-ui)
5. [Casos de uso específicos](#casos-de-uso-específicos)
6. [Reglas y errores comunes](#reglas-y-errores-comunes)

---

## Herramientas disponibles

### `useUserPermissions` — hook principal

**Ruta:** `src/hooks/useUserPermissions.ts`

Es el único hook que se debe usar para verificar permisos en páginas y componentes. **No llamar a `usePermissions` del contexto directamente.**

```ts
import { useUserPermissions } from "@/hooks/useUserPermissions"
```

**Valores retornados:**

| Valor | Tipo | Descripción |
|-------|------|-------------|
| `isLoading` | `boolean` | `true` mientras se cargan los permisos del JWT |
| `isOrgAdmin` | `boolean` | Admin de organización: hace **bypass total** de permisos CRUD |
| `isRootAdmin` | `boolean` | Admin técnico raíz: **NO hace bypass** de permisos normales, solo da acceso a rutas de administración del sistema |
| `permissions` | `string[]` | Lista cruda de permisos del usuario |
| `roles` | `string[]` | Lista cruda de roles del usuario |
| `hasPermission(p)` | `(p: Permission) => boolean` | Verifica un permiso exacto |
| `hasAnyPermission(ps)` | `(ps: Permission[]) => boolean` | Verifica si tiene al menos uno |
| `hasAllPermissions(ps)` | `(ps: Permission[]) => boolean` | Verifica si tiene todos |
| `hasRole(id)` | `(id: string) => boolean` | Verifica un rol por ID |
| `hasAnyRole(ids)` | `(ids: string[]) => boolean` | Verifica si tiene al menos un rol |
| `canCreate(resource)` | `(r: string) => boolean` | `resource:c` o `isOrgAdmin` |
| `canRead(resource)` | `(r: string) => boolean` | `resource:r` o `isOrgAdmin` |
| `canUpdate(resource)` | `(r: string) => boolean` | `resource:u` o `isOrgAdmin` |
| `canDelete(resource)` | `(r: string) => boolean` | `resource:d` o `isOrgAdmin` |
| `canList(resource)` | `(r: string) => boolean` | `resource:l` o `isOrgAdmin` |
| `canAccessUsers` | `boolean` | Tiene algún permiso sobre `user` |
| `canAccessRoles` | `boolean` | Tiene algún permiso sobre `rbac` |
| `canAccessAssets` | `boolean` | Tiene algún permiso sobre `asset` |
| `canAccessFolders` | `boolean` | Tiene algún permiso sobre `folder` |
| `canAccessTemplates` | `boolean` | Tiene algún permiso sobre `template` |
| `canAccessDocumentTypes` | `boolean` | Tiene algún permiso sobre `asset_type` |
| `canAccessSections` | `boolean` | Tiene algún permiso sobre `section` |
| `canAccessSectionExecutions` | `boolean` | Tiene algún permiso sobre `section_execution` |
| `canAccessContexts` | `boolean` | Tiene algún permiso sobre `context` |
| `canAccessModels` | `boolean` | Tiene algún permiso sobre `llm` o `llm_provider` |
| `canAccessOrganizations` | `boolean` | Tiene algún permiso sobre `organization` |
| `canAccessVersions` | `boolean` | Tiene algún permiso sobre `version` |
| `canAccessDiscussions` | `boolean` | Tiene algún permiso sobre `discussion` |
| `canAccessRoleFolders` | `boolean` | Tiene algún permiso sobre `role_folder` |
| `canManageGroupFolders` | `boolean` | Permiso especial `folder:manage_groups` (crear/eliminar carpetas grupales raíz) |
| `canAccessExternalSystems` | `boolean` | Tiene algún permiso sobre `external_system` |
| `canAccessExternalFunctionalities` | `boolean` | Tiene algún permiso sobre `external_functionality` |
| `canAccessExternalParameters` | `boolean` | Tiene algún permiso sobre `external_parameter` |
| `canAccessExternalSecrets` | `boolean` | Tiene algún permiso sobre `external_secret` |
| `canAccessCanvas` | `boolean` | Tiene algún permiso sobre `canvas` |
| `canAccessDiagrams` | `boolean` | Tiene algún permiso sobre `diagram` |
| `canAccessTokenUsage` | `boolean` | Tiene `token_usage:r` o `token_usage:l` (solo esas dos acciones existen) |
| `canAccessNotifications` | `boolean` | Tiene algún permiso sobre `notification` |
| `hasResourceAccess(resource, actions)` | `(r, a[]) => boolean` | Genérico: tiene alguna de las acciones en el recurso |
| `getAllowedActions(resource)` | `(r) => string[]` | Retorna las acciones permitidas (`c`, `r`, `u`, `d`, `l`) |

> El hook expone actualmente **23 helpers `canAccessX`** — la lista de arriba está completa. Si al leer el código de `useUserPermissions.ts` aparece uno que no está aquí, agregarlo a esta tabla (es señal de que esta guía quedó desactualizada de nuevo).

### `isRootAdmin` — prohibido usarlo como bypass

`isRootAdmin` **no** debe combinarse con `||` para saltarse un chequeo de permiso normal (`isRootAdmin || hasPermission(...)`). Eso fue exactamente el bug encontrado y corregido en `src/pages/templates.tsx` y `src/huemul/components/huemul-button.tsx` (permitía a un root admin sin rol en la organización ver botones de crear/editar/eliminar que un usuario normal sin esos permisos no vería). El único bypass válido dentro de una organización es `isOrgAdmin`, y ya está aplicado **dentro** de `hasPermission`/`hasAnyPermission`/`hasAllPermissions` (ver `permissions-context.tsx`) y de los helpers `canCreate`/`canRead`/`canUpdate`/`canDelete`/`canList`/`canAccessX` — no hace falta repetirlo al llamarlos.

---

### `ProtectedComponent` — wrapper declarativo

**Ruta:** `src/components/protected-component.tsx`

Envuelve cualquier JSX para mostrarlo u ocultarlo según permisos, sin lógica condicional en el componente padre.

```tsx
import ProtectedComponent from "@/components/protected-component"
```

**Props:**

| Prop | Tipo | Descripción |
|------|------|-------------|
| `permission` | `Permission \| string` | Un permiso exacto |
| `permissions` | `(Permission \| string)[]` | Lista de permisos |
| `requireAllPermissions` | `boolean` | Si `true`, requiere **todos** los permisos de `permissions` (default: `false`) |
| `role` | `string` | Un rol por ID |
| `roles` | `string[]` | Lista de roles |
| `requireAllRoles` | `boolean` | Si `true`, requiere **todos** los roles (default: `false`) |
| `resource` | `string` | Recurso (shortcut) |
| `resourceAction` | `'c' \| 'r' \| 'u' \| 'd' \| 'l' \| 'manage'` | Acción sobre el recurso |
| `resourceActions` | `('c' \| 'r' \| 'u' \| 'd' \| 'l' \| 'manage')[]` | Múltiples acciones (OR) |
| `requireRootAdmin` | `boolean` | Solo accesible para `isRootAdmin` |
| `inverse` | `boolean` | Invierte la lógica (muestra cuando NO tiene permisos) |
| `fallback` | `ReactNode` | JSX alternativo cuando no hay permisos |
| `showLoadingFallback` | `boolean` | Si `true`, muestra `loadingFallback` mientras carga |
| `loadingFallback` | `ReactNode` | JSX mientras `isLoading` es `true` |

---

## Recursos y acciones del sistema

Los permisos siguen el formato `recurso:acción`.

**Acciones disponibles:**

| Código | Acción |
|--------|--------|
| `c` | Create (crear) |
| `r` | Read (leer detalle) |
| `u` | Update (actualizar) |
| `d` | Delete (eliminar) |
| `l` | List (listar) |

**Recursos disponibles:**

```
organization · user · asset · folder · context · asset_type
docx_template · template · template_section · section
section_execution · version · llm_provider · llm · rbac
role_folder · external_system · external_functionality
external_parameter · external_secret · token_usage · notification
custom_fields · media · canvas · discussion
```

(Lista completa y con tipos en `src/types/jwt-utils.ts` → `PermissionResource`.)

**Ejemplos de permisos:**

```
user:c         → crear usuarios
asset:l        → listar assets
rbac:u         → actualizar roles
section:d      → eliminar secciones
llm_provider:r → leer providers de LLM
```

---

## Matriz declarativa y auditoría

Para páginas con varias affordances (tabs, botones de fila, acciones en masa),
en vez de repetir `hasAnyPermission([...])` a mano por cada botón, existe:

- **`src/lib/rbac-matrix.ts`** — declara, por página, los `routePermissions`
  (los mismos que usa el guard de ruta en `App.tsx`) y un mapa `features` con
  el/los permiso(s) de cada affordance. Es la fuente única de verdad que
  también consume el filtro del nav en `app-layout.tsx` — antes cada uno
  tenía su propia lista y ya divergían.
- **`src/hooks/usePageAccess.ts`** — hook fino sobre `useUserPermissions` que
  resuelve `canAccessPage` y `can('featureKey')` a partir de la matriz.

Páginas con `features` completo (ya auditadas): `templates`, `asset-types`,
`asset-type-relationships`, `advanced`, `asset`, `canvas`, `custom-fields`,
`diagrams`, `external-systems`, `home`, `media`, `models`, `organizations`,
`roles`, `search`, `token-usage`, `users`. Para auditar el resto, seguir
`ia context/rbac-audit-guide.md`.

Ojo con `home`: no tiene `routePermissions` **a propósito** (es el destino de
todo rebote de guard, así que nunca debe dar un 403 de página completa). Su
RBAC vive entero en `features`, aplicado panel por panel. Una página sin
`routePermissions` no es una página sin RBAC.

### `useAssetContentPermissions` — cruce lifecycle × RBAC

Cuando una superficie gatea escritura con `lifecycle_permissions` del documento
(grants por documento y step), ese eje **no reemplaza** RBAC: son ortogonales.
El lifecycle contesta *"¿sos el editor/revisor **de este documento**?"*; RBAC
contesta *"¿tu rol en la organización te permite esta acción **en absoluto**?"*.

Regla: **`affordanceVisible = lifecycleAllows && rbacAllows`** (AND).

- `src/hooks/useDocumentAccess.ts` → `useAssetContentPermissions(lifecyclePermissions, lifecycleStatus)`
  devuelve `{ frontendPermissions, rbac, canViewContent, isViewOnly, canSwitchToEditorMode }`.
  Es el único lugar donde se decide esa política para `/asset`.
- `computeFrontendPermissions` exige `rbac: AssetRbacCaps` como tercer
  parámetro **obligatorio**: olvidarse de cruzar RBAC rompe el build.
- `lifecycleAllows(undefined, x) === true` **es correcto y no debe cambiarse a
  fail-closed**: significa "el lifecycle no impone restricción", y con el AND la
  affordance degrada a *solo RBAC* en vez de a *permitir todo*. Un asset cuyo
  asset type no tiene lifecycle configurado depende de eso.
- No gatear la misma affordance dos veces (por `frontendPermissions` **y** por
  `HuemulButton requiredAccess + checkGlobalPermissions + resource`) con
  recursos distintos: el AND queda más estricto de lo diseñado y sin traza.

---

## Patrón en páginas

### Estructura estándar de una página con RBAC

```tsx
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { FooPageLoadingState } from "@/components/foo"  // Skeleton de página
import { FooPageEmptyState } from "@/components/foo"    // Pantallas de error/acceso denegado

export default function FooPage() {
  const {
    isLoading: isLoadingPermissions,
    isOrgAdmin,
    hasPermission,
    hasAnyPermission,
    canAccessFoo,  // si existe, usar el helper específico
  } = useUserPermissions()

  // 1. Esperar mientras se cargan los permisos
  if (isLoadingPermissions) {
    return <FooPageLoadingState />
  }

  // 2. Gate de acceso principal (¿tiene ALGÚN permiso sobre el recurso?)
  //    Usar el helper canAccess* si existe, o construirlo manualmente:
  const canAccess = isOrgAdmin || hasAnyPermission(['foo:r', 'foo:l', 'foo:c', 'foo:u', 'foo:d'])
  if (!canAccess) {
    return <FooPageEmptyState type="access-denied" />
  }

  // 3. Permisos individuales para habilitar/deshabilitar acciones
  const canCreate = isOrgAdmin || hasPermission('foo:c')
  const canUpdate = isOrgAdmin || hasPermission('foo:u')
  const canDelete = isOrgAdmin || hasPermission('foo:d')
  const canList   = isOrgAdmin || hasAnyPermission(['foo:l', 'foo:r'])

  // 4. Pasar los booleanos de permiso a los componentes hijos como props
  return (
    <FooPageHeader canCreate={canCreate} />
    <FooTable canUpdate={canUpdate} canDelete={canDelete} />
  )
}
```

### Página de solo administrador raíz (rutas técnicas)

Para módulos globales de sistema (auth types, custom fields globales, etc.):

```tsx
const { isRootAdmin, isLoading: isLoadingPermissions } = useUserPermissions()

if (isLoadingPermissions) return <FooLoadingState />

if (!isRootAdmin) {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2">{t('accessDenied')}</h1>
        <p className="text-muted-foreground">{t('noPermission')}</p>
      </div>
    </div>
  )
}
```

### Condicionar la llamada a la API según permisos

La query solo debe ejecutarse si el usuario tiene permisos para listar/leer. Pasar el booleano al parámetro `enabled`:

```tsx
const canList = isOrgAdmin || hasAnyPermission(['foo:l', 'foo:r'])

const { data, isLoading, isFetching, error } = useFooBars({
  enabled: !!selectedOrganizationId && canList,  // ← no hacer la request si no tiene acceso
})
```

---

## Patrón en componentes UI

### Opción A — `ProtectedComponent` (declarativo, recomendado para botones/acciones)

Usar cuando el JSX protegido es puntual (un botón, una sección, un menú).

```tsx
import ProtectedComponent from "@/components/protected-component"

// Permiso exacto
<ProtectedComponent permission="user:c">
  <Button>Create User</Button>
</ProtectedComponent>

// Cualquiera de varios permisos (OR)
<ProtectedComponent permissions={["user:r", "user:l"]}>
  <UsersList />
</ProtectedComponent>

// Todos los permisos (AND)
<ProtectedComponent permissions={["user:r", "user:u"]} requireAllPermissions>
  <EditUserForm />
</ProtectedComponent>

// Shortcut por recurso + acción
<ProtectedComponent resource="user" resourceAction="c">
  <Button>New User</Button>
</ProtectedComponent>

// Shortcut por recurso + varias acciones (OR)
<ProtectedComponent resource="user" resourceActions={["c", "u"]}>
  <ActionsMenu />
</ProtectedComponent>

// Solo root admin
<ProtectedComponent requireRootAdmin>
  <SystemAdminPanel />
</ProtectedComponent>

// Con fallback cuando no hay permisos
<ProtectedComponent
  permission="user:d"
  fallback={<span className="text-muted-foreground text-sm">No access</span>}
>
  <DeleteButton />
</ProtectedComponent>
```

### Opción B — `useUserPermissions` en componentes hijo (imperativo)

Usar cuando el permiso afecta al **estado interno** del componente (disabled, clases CSS, lógica de negocio) y no solo a la visibilidad.

```tsx
import { useUserPermissions } from "@/hooks/useUserPermissions"

interface FooTableProps {
  items: Foo[]
}

export function FooTable({ items }: FooTableProps) {
  const { isOrgAdmin, hasPermission } = useUserPermissions()

  const canEdit   = isOrgAdmin || hasPermission('foo:u')
  const canDelete = isOrgAdmin || hasPermission('foo:d')

  return (
    <table>
      {items.map(item => (
        <tr key={item.id}>
          <td>{item.name}</td>
          <td>
            <Button disabled={!canEdit}>Edit</Button>
            <Button disabled={!canDelete} variant="destructive">Delete</Button>
          </td>
        </tr>
      ))}
    </table>
  )
}
```

### Opción C — Recibir permisos por props (patrón page-down)

Cuando la página ya calculó los permisos, se pueden pasar como props simples al hijo para evitar múltiples llamadas al hook.

```tsx
// Página calcula una vez
const canCreate = isOrgAdmin || hasPermission('foo:c')

// Componente hijo los recibe como props
<FooPageHeader canCreate={canCreate} />

// Componente hijo
interface FooPageHeaderProps {
  canCreate: boolean
}

export function FooPageHeader({ canCreate }: FooPageHeaderProps) {
  return (
    <header>
      {canCreate && <Button>New Foo</Button>}
    </header>
  )
}
```

> **Cuándo usar cada opción:**
> - **`ProtectedComponent`**: visibilidad condicional de elementos UI puntuales (botones, secciones, menús).
> - **`useUserPermissions` en el hijo**: cuando el permiso afecta lógica interna (disabled, estilos, etc.).
> - **Props desde página**: cuando el padre ya calculó los permisos y es más limpio no duplicar el hook.

---

## Casos de uso específicos

### Deshabilitar botones en lugar de ocultarlos

Ver `ia context/tooltip-guide.md` para la regla completa de tooltips (`title=` nativo).

```tsx
const { isOrgAdmin, hasPermission } = useUserPermissions()
const canEdit = isOrgAdmin || hasPermission('foo:u')

<Button
  disabled={!canEdit}
  className="hover:cursor-pointer"
  title={!canEdit ? "You don't have permission to edit" : undefined}
>
  Edit
</Button>
```

### Acciones en context menu / dropdown

```tsx
<DropdownMenuContent>
  <DropdownMenuItem onSelect={() => handleView(item)}>
    View
  </DropdownMenuItem>

  <ProtectedComponent resource="foo" resourceAction="u">
    <DropdownMenuItem onSelect={() => handleEdit(item)}>
      Edit
    </DropdownMenuItem>
  </ProtectedComponent>

  <ProtectedComponent resource="foo" resourceAction="d">
    <DropdownMenuSeparator />
    <DropdownMenuItem
      className="text-destructive"
      onSelect={() => handleDelete(item)}
    >
      Delete
    </DropdownMenuItem>
  </ProtectedComponent>
</DropdownMenuContent>
```

### Verificar acciones permitidas sobre un recurso dinámico

```tsx
const { getAllowedActions } = useUserPermissions()

const allowedActions = getAllowedActions('foo')
// → ['r', 'l'] si solo tiene esos permisos
// → ['c', 'r', 'u', 'd', 'l'] si isOrgAdmin

const showEditButton = allowedActions.includes('u')
const showDeleteButton = allowedActions.includes('d')
```

### Mostrar contenido SOLO cuando NO tiene permisos (inverse)

```tsx
<ProtectedComponent permission="foo:r" inverse>
  <Banner>You have read-only access to this section.</Banner>
</ProtectedComponent>
```

### Pantalla de acceso denegado a nivel de sección

```tsx
const { isOrgAdmin, hasAnyPermission } = useUserPermissions()
const canAccess = isOrgAdmin || hasAnyPermission(['foo:r', 'foo:l'])

if (!canAccess) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Shield className="size-12 text-muted-foreground mb-3" />
      <h2 className="text-xl font-bold mb-2">{t('common:accessDenied')}</h2>
      <p className="text-muted-foreground">{t('foo:emptyState.accessDeniedDescription')}</p>
    </div>
  )
}
```

---

## Reglas y errores comunes

### ✅ Reglas

1. **Siempre esperar `isLoadingPermissions`** antes de evaluar cualquier permiso en la página. Los tokens JWT pueden no estar disponibles de inmediato.

2. **`isOrgAdmin` hace bypass completo** de permisos CRUD dentro de la organización. Incluirlo siempre en las verificaciones de permisos organizacionales:
   ```ts
   const canCreate = isOrgAdmin || hasPermission('foo:c')  // ✅
   const canCreate = hasPermission('foo:c')                // ❌ rompe para org admins
   ```

3. **`isRootAdmin` NO hace bypass** de permisos normales. Solo da acceso a módulos de administración técnica del sistema (global auth types, custom fields globales, etc.).

4. **No hacer la llamada API si no hay permiso.** Pasar el booleano de acceso al parámetro `enabled` de la query para evitar peticiones 403 innecesarias.

5. **No llamar `usePermissions` del contexto directamente** en componentes. Usar siempre `useUserPermissions`.

6. **`ProtectedComponent` sin ninguna prop de permiso** da acceso por defecto a todos. Asegúrate de pasar al menos una prop.

### ❌ Errores comunes

```tsx
// ❌ MAL: verificar permisos sin esperar isLoading
const { hasPermission } = useUserPermissions()
if (!hasPermission('foo:c')) return null  // puede fallar si aún carga

// ✅ BIEN:
const { isLoading, hasPermission } = useUserPermissions()
if (isLoading) return <Skeleton />
if (!hasPermission('foo:c')) return null
```

```tsx
// ❌ MAL: usar isRootAdmin como bypass de permisos normales
const canEdit = isRootAdmin || hasPermission('foo:u')

// ✅ BIEN: usar isOrgAdmin para bypass de permisos de organización
const canEdit = isOrgAdmin || hasPermission('foo:u')
```

```tsx
// ❌ MAL: importar usePermissions del contexto directamente
import { usePermissions } from "@/contexts/permissions-context"

// ✅ BIEN: usar el hook de conveniencia
import { useUserPermissions } from "@/hooks/useUserPermissions"
```

```tsx
// ❌ MAL: llamada API sin condición de permiso
const { data } = useFooBars({ enabled: !!orgId })

// ✅ BIEN: condición incluye permiso
const canList = isOrgAdmin || hasAnyPermission(['foo:l', 'foo:r'])
const { data } = useFooBars({ enabled: !!orgId && canList })
```

```tsx
// ❌ MAL: ProtectedComponent vacío (da acceso a todos)
<ProtectedComponent>
  <DeleteButton />
</ProtectedComponent>

// ✅ BIEN: siempre con permiso definido
<ProtectedComponent resource="foo" resourceAction="d">
  <DeleteButton />
</ProtectedComponent>
```
