# Wisecore — Guía del menú del header

El header tiene tres superficies de navegación distintas. Antes de agregar una opción, decidir en cuál va — el criterio no es "dónde hay espacio", es qué tipo de acción es.

## 0. Árbol de decisión

```
¿La opción nueva es...
├─ una superficie de trabajo diaria (algo que el usuario abre
│  seguido, para producir o consultar contenido)?
│    → Nav central (navigationItems en app-layout.tsx)
│      No forma parte de esta guía — ver el propio array.
│
├─ configuración de cómo se comporta/estructura la organización
│  (tipos, permisos, conexiones, consumo, administración)?
│    → Dropdown de Settings (SETTINGS_MENU_GROUPS en header-menu.ts)
│      Ver §1
│
└─ algo personal del usuario logueado (perfil, notificaciones,
   suscripciones propias, cerrar sesión)?
    → Menú de usuario (header-user-menu.tsx)
      Ver §2
```

Regla rápida: si la respuesta a "¿esto es igual para cualquier usuario de la organización, sin importar quién esté logueado?" es sí, es Settings. Si depende de la cuenta personal (mis notificaciones, mi perfil), es menú de usuario.

## 1. Dropdown de Settings

### 1.1 Los 6 grupos y su criterio

| Grupo (`labelKey`) | Criterio: la opción... | Ítems actuales |
|---|---|---|
| `settings.groups.assetStructure` | define QUÉ son y cómo se clasifican los activos | Tipos de Activo, Relaciones de Tipos de Activo, Campos Personalizados, Etiquetas |
| `settings.groups.designFiles` | maneja archivos o vistas visuales | Canvas, Media |
| `settings.groups.peopleAccess` | controla quién entra y qué puede hacer | Usuarios, Roles, Organizaciones |
| `settings.groups.connectionsAi` | conecta la organización con algo externo (IA, sistemas, credenciales) | Modelos, Sistemas Externos, Tipos de Autenticación, Tokens de API |
| `settings.groups.toolsUsage` | operación puntual o consumo de recursos | Avanzado, Uso y costos |
| `settings.groups.system` | administración técnica de toda la instalación (no de una organización) — casi siempre solo root admin | Configuración de Admin Global |

Si una opción nueva no encaja claramente en ninguno, es señal de que el grupo necesita revisarse — no la fuerces al que tenga menos ítems.

### 1.2 Cómo agregar una opción que navega a una página

1. Si la página es nueva, declararla primero en `src/lib/rbac-matrix.ts` (`RBAC_PAGES`) — ruta y `routePermissions`. Esa matriz es la única fuente de permisos; el guard de ruta en `App.tsx` y el menú la leen de ahí.
2. Registrar la ruta en `src/App.tsx` con `PermissionProtectedRoute permissions={[...RBAC_PAGES.<key>.routePermissions]}`.
3. Agregar la entrada en `src/lib/header-menu.ts`, dentro del grupo que corresponda:
   ```ts
   { kind: "page", page: "mi-pagina", icon: MiIcono, labelKey: "settings.miPagina" }
   ```
   `page` debe ser una key de `RbacPageKey` (o sea, existir en `RBAC_PAGES`). El path se arma como `/${page}` — si el segmento de ruta no coincide exactamente con la key de la matriz, no uses esta forma corta; hoy todas las entradas del menú coinciden.
4. Agregar `labelKey` en `src/i18n/locales/layout.ts` bajo `settings.*`.
5. Elegir un icono de `lucide-react` que **no esté repetido** en el menú — revisar `header-menu.ts` antes de importar uno.

**No** repitas el permiso a mano (`hasAnyPermission(RBAC_PAGES.x.routePermissions)`) fuera de la matriz: `HeaderSettingsMenu` ya resuelve visibilidad con `resolvePageAccess` (`src/hooks/usePageAccess.ts`), la misma función que usa `usePageAccess` en las páginas. Dos definiciones de "¿puede ver esto?" es exactamente el bug que ya se corrigió una vez (ver `ia context/rbac-audit-guide.md`).

### 1.3 Cómo agregar una opción que abre un sheet/dialog (no navega)

No tiene entrada en `RBAC_PAGES` porque no hay ruta. Usar la forma `kind: "action"`:
```ts
{ kind: "action", id: "mi-accion", icon: MiIcono, labelKey: "settings.miAccion", requireOrgAdmin: true }
```
`HeaderSettingsMenu` filtra las actions por `requireOrgAdmin` (o agregar un campo similar si el criterio es otro). El componente padre (`app-layout.tsx`) pasa el callback que abre el sheet como prop — seguir el patrón de `onOpenApiTokens`.

### 1.4 Grupo visible / oculto

Un grupo solo se renderiza si tiene al menos una entrada visible para el usuario actual. No hace falta (ni se debe) escribir un gate agregado a mano por grupo — eso fue lo que causó que `/tags` quedara fuera de `hasAssetManagementAccess` durante meses sin que nadie lo notara.

## 2. Menú de usuario (`header-user-menu.tsx`)

Solo lo que pertenece a la cuenta logueada, no a la organización: Actualizar Perfil, Notificaciones, Mis Suscripciones, Cerrar sesión. Si dudas si algo va acá o a Settings, preguntate: *¿esto cambia según quién está logueado, o es igual para toda la organización?* Lo segundo es Settings (ver Tokens de API, que se movió de acá a Settings > Conexiones e IA por ser configuración de organización, gateada con `isOrgAdmin`).

## 3. Errores comunes

- Hardcodear `<Link to="...">` + permiso directo en el JSX del menú en vez de agregar la entrada al registro (`header-menu.ts`). Vuelve a las ~190 líneas repetitivas que esta guía existe para evitar.
- Usar un helper `canAccessX` de `useUserPermissions` (más ancho, incluye 5 acciones CRUD) en vez de `RBAC_PAGES[page].routePermissions` — el ítem del menú queda visible para roles que el guard de ruta rebota.
- Repetir un icono ya usado en otra entrada del menú (antes: `Shield` en Roles y en Tipos de Autenticación, `Network` en Diagrams del nav central y en Sistemas Externos).
- Olvidar el estado activo: como el trigger del engranaje ilumina si CUALQUIER entrada visible está activa, agregar una página nueva sin pasar por el registro (p.ej. armando el `<Link>` a mano) la deja fuera de ese cálculo.
- Poner en el menú de usuario algo que en realidad es configuración de organización (gateado con `isOrgAdmin`, no personal del usuario).

## 4. Checklist de verificación

- [ ] La página nueva tiene entrada en `RBAC_PAGES` con `routePermissions` correctos.
- [ ] Ruta registrada en `App.tsx` con el mismo `routePermissions`.
- [ ] Entrada agregada en `SETTINGS_MENU_GROUPS` (`header-menu.ts`), en el grupo correcto según §1.1.
- [ ] `labelKey` con traducción `en`/`es` en `layout.ts`.
- [ ] Icono no repetido dentro del menú.
- [ ] Probado con un usuario que solo tiene el permiso mínimo de esa página: el grupo aparece con únicamente esa entrada.
- [ ] Navegar a la página nueva ilumina tanto el ítem como el trigger del engranaje.
