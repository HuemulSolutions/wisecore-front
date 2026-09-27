# Wisecore — Crear una entidad relacionada desde un Sheet de asignación, sin salir de él

## Cuándo aplica

Un `HuemulSheet` asigna/vincula entidades existentes (ej. "Asignar Usuarios" a un rol, "Asignar Roles" a un usuario) buscando en una lista paginada server-side. Si la entidad que el usuario necesita todavía no existe, hoy obligaría a cerrar el sheet, ir a otra página, crearla ahí, y volver — perdiendo el contexto (búsqueda, selección ya hecha).

Usar este patrón cuando:
- [ ] Existe ya un componente de creación para esa entidad (`Create<Entity>Dialog` / `Create<Entity>Sheet`, con su propio form y mutation).
- [ ] La entidad recién creada debe quedar automáticamente seleccionada en el sheet, lista para asignar en el mismo submit.

No usar esto para un solo campo de texto libre (ej. tags, etiquetas) — para eso ya existe el patrón de `HuemulTagPicker` (ver `src/huemul/components/huemul-tag-picker.tsx`): un botón "Crear «texto»" dentro del propio popover, sin overlay adicional.

## Regla clave: reusar el componente de creación existente, no reconstruir su formulario

**Nunca duplicar el formulario de creación dentro de un panel nuevo.** Si ya existe `Create<Entity>Dialog`/`Create<Entity>Sheet` (con su form, validación, mutation, manejo de errores y toasts), se invoca tal cual desde el sheet de asignación — no se arma una versión "compacta" con los mismos campos sueltos. Duplicar el formulario significa duplicar validación, mensajes de error y el día que cambie un campo en un lugar, hay que acordarse del otro.

## Un overlay sobre otro: renderizar como sibling, no anidado

El componente de creación existente (sea `Dialog` o `Sheet`) se monta como **sibling** del `HuemulSheet` de asignación — mismo componente contenedor, envuelto en un fragment — nunca anidado dentro de sus `children`:

```tsx
return (
  <>
    <HuemulSheet open={open} onOpenChange={onOpenChange} ...>
      {/* toolbar con el botón "Crear usuario", lista, paginación */}
    </HuemulSheet>

    <CreateUserSheet
      open={showCreateUserSheet}
      onOpenChange={setShowCreateUserSheet}
      canCreate={canCreateUser}
      onSuccess={handleUserCreated}
    />
  </>
)
```

Este es el mismo patrón que ya documenta `ia context/danger-zone-sheet-guide.md` para `HuemulAlertDialog` como sibling de un `HuemulSheet` (no anidado en `children`, para que el renderizado condicional del Sheet no lo desmonte). `ia context/z-index-layering-guide.md` confirma que `dialog` y `sheet` comparten el mismo nivel base (`z-50`) y que, con el mismo z-index, el que se monta **después** en el DOM pinta encima — un segundo overlay abierto mientras el primero ya está abierto queda arriba de forma natural, sin tocar ningún z-index. Esto vale tanto si el componente reusado es un `HuemulDialog` como un `HuemulSheet` — dos `Sheet` apilados (mismo lado) funcionan igual de bien que un `Dialog` sobre un `Sheet`.

Referencia: [`roles-user-add-popover.tsx`](../src/components/roles/roles-user-add-popover.tsx) — botón "Invitar uno nuevo" abre [`CreateUserSheet`](../src/components/users/users-create-sheet.tsx) (el mismo componente que usa `/users` y `/global-admin`) sobre el popover "Agregar usuario" del panel de detalle de un rol. Variante con más superficie (sheet completo, no popover): [`users-role-add-popover.tsx`](../src/components/users/users-role-add-popover.tsx), vía "Con permisos", abre `CreateRoleSheet` **como sibling del `HuemulPageLayout`** (no del popover) porque el popover no es un contenedor de overlay — mismo principio, sibling del contenedor de más arriba en el árbol que sí lo es.

## Botón trigger

En la fila de toolbar (junto a búsqueda/refresh), gateado por el permiso de creación de la entidad:
```tsx
const { canCreate } = useUserPermissions()
const canCreateUser = canCreate('user') // 'user', 'role', etc. según el recurso

{canCreateUser && (
  <HuemulButton
    variant="outline" size="sm" icon={UserPlus}
    label={t('roles:assignToUsers.createUserButton')}
    onClick={() => setShowCreateUserSheet(true)}
  />
)}
```
Nota: `HuemulButton` solo renderiza el ícono junto al texto si el texto se pasa por la prop `label`, no como `children` — pasar `children` reemplaza todo el contenido del botón e ignora `icon`.

## Auto-selección de la entidad recién creada

Si el componente de creación existente no expone el objeto creado en su callback de éxito (caso típico: `onSuccess?: () => void` sin payload, pensado solo para refrescar una lista), **ampliar esa prop** en vez de bypassearla con una mutation paralela:

```ts
// antes
onSuccess?: () => void

// después
onSuccess?: (user: User) => void
```

Es un cambio retrocompatible: en TypeScript, una función con menos parámetros (`() => void`) es asignable a un tipo que espera más (`(user: User) => void`), así que los consumidores existentes del componente (otras páginas que ya lo usan) siguen compilando sin tocarlos. Dentro del componente de creación, pasar el resultado real de la mutation (`createUser.mutate(data, { onSuccess: (newUser) => onSuccess?.(newUser) })`) en vez de descartarlo.

En el sheet de asignación, el handler de éxito:
```tsx
const handleUserCreated = (newUser: User) => {
  setSelectedUsers(prev => prev.includes(newUser.id) ? prev : [...prev, newUser.id])
  setSearchInput("")
  setSearchQuery("")
  setPage(1)
  refetch()
}
```
- Agrega el `id` al estado de selección **inmediatamente** — el chip contador ("N seleccionados") refleja el cambio al instante, sin esperar a que la entidad aparezca en la lista visible.
- Limpia búsqueda/página para maximizar la chance de que la entidad nueva aparezca en la lista tras el refetch.
- **Refetch explícito** de la query propia del sheet (`refetch()` del hook `useQuery`) en vez de depender de `invalidateQueries` con una key parcial — varias mutations del proyecto (ej. `assignUsersToRoleMutation` en `useRbac.ts`) invalidan con una key que fija page/pageSize/search en sus valores por defecto, lo cual **no** cubre la combinación de filtros que el sheet tiene actualmente abierta.
- No agregar un toast manual de éxito ni manejo de error propio — el componente de creación reusado ya se encarga de ambos (toast vía `meta.successMessage`, error vía el `onError` global de `queryClient`).

## Reset al cerrar el sheet

El `useEffect` que limpia el estado del sheet padre al cerrarse debe limpiar también el estado del diálogo/sheet de creación (`setShowCreateUserSheet(false)`), igual que limpia búsqueda/selección/paginación.

## Errores comunes

- Reconstruir el formulario de creación en un panel/`Card` inline en vez de reusar el componente existente — duplica validación y mensajes, y diverge con el tiempo del componente "oficial".
- Anidar el `Dialog`/`Sheet` de creación dentro de los `children` del `HuemulSheet` de asignación — puede desmontarse junto con contenido condicional y complica el stacking.
- Pasar el label del botón trigger como `children` de `HuemulButton` en vez de la prop `label` — el ícono desaparece silenciosamente.
- Confiar en `invalidateQueries` con key parcial para refrescar la lista del sheet — usar `refetch()` del propio hook.
- Cambiar la firma de `onSuccess` de un componente compartido sin verificar que sigue siendo asignable desde los consumidores existentes (lo es, por variance de funciones, mientras solo se agreguen parámetros).

## Checklist final

```
[ ] Botón trigger gateado por permiso puntual (canCreate('resource'))
[ ] Se reusa el componente de creación EXISTENTE de la entidad — nada de formulario nuevo
[ ] Componente de creación renderizado como sibling del Sheet de asignación (fragment), no anidado en children
[ ] Si hace falta auto-seleccionar: onSuccess del componente reusado ampliado para pasar la entidad creada (cambio retrocompatible)
[ ] onSuccess en el sheet de asignación: agrega el id nuevo al estado de selección
[ ] onSuccess en el sheet de asignación: limpia filtros (search/page) y llama refetch() explícito
[ ] No hay toast ni manejo de error duplicado — el componente reusado ya lo tiene
[ ] useEffect de reset del sheet padre también cierra el diálogo/sheet de creación
[ ] Todos los strings vía traducciones (label del botón trigger)
```
