# Wisecore — Guía para tabla agrupada por carpeta con drag & drop

Aplica cuando una entidad plana (ej. tipos de documento) se puede agrupar en un
recurso "carpeta" **de un solo nivel** (sin subcarpetas), y la UI debe mostrar
un árbol de dos niveles dentro de un único `HuemulTable`, con asignación por
arrastrar-y-soltar la fila del ítem sobre la fila de la carpeta.

`HuemulTable` soporta este patrón de forma nativa vía la prop `folders` — no
hace falta reimplementarlo por feature. Referencia viva del consumidor:
[assets-types.tsx](../src/pages/assets-types.tsx),
[assets-types-table.tsx](../src/components/assets-types/assets-types-table.tsx),
[document-type-folders.ts](../src/types/document-type-folders.ts). Referencia
del componente genérico:
[huemul-table.tsx](../src/huemul/components/huemul-table.tsx),
[huemul-table-folder-parts.tsx](../src/huemul/components/huemul-table-folder-parts.tsx),
[useTableFolderDrag.ts](../src/hooks/useTableFolderDrag.ts).

> Nota histórica: hasta agosto 2026 este patrón se construía **por fuera** de
> `HuemulTable` con `@dnd-kit/core` (discriminated union de fila, row keys
> prefijadas, `DndContext` en el componente de tabla del feature). Se migró
> porque el costo de replicarlo por feature era alto — prefijos de key que
> había que desprefijar antes de llamar a un service, feedback de drop que no
> podía usar `isOver`, medición manual de droppables — y porque `HuemulTable`
> sí puede controlar el `<tr>` directamente (el motivo original para no
> tocarlo, la falta de ref de fila, ya no aplica una vez que la lógica vive
> adentro). El drag & drop es ahora HTML5 nativo, sin dependencias.

---

## 0. Cuándo aplica

```
¿La entidad puede pertenecer a como mucho UNA carpeta (no hay subcarpetas)?
  └─ NO (jerarquía real, N niveles) → no uses este patrón; `folders` es de
     un solo nivel por diseño.

¿La carpeta y el ítem deben convivir en la MISMA tabla/columna, no en un
panel lateral separado?
  └─ NO → usar un panel lateral de carpetas + tabla filtrada es más simple;
     no hace falta este patrón.

¿La asignación se hace arrastrando la fila del ítem sobre la fila de la
carpeta (no solo un campo de formulario / combobox)?
  └─ Sí a ambas → aplica.
```

## 1. Usar la prop `folders` de `HuemulTable`

No aplanar el árbol a mano ni prefijar row keys: `HuemulTable` recibe `data`
plano (los ítems, sin carpetas mezcladas) y un objeto `folders`, y arma el
árbol internamente.

```tsx
<HuemulTable
  data={assetTypes}                 // T[] — solo ítems, homogéneo
  columns={columns}                 // una columna con `primary: true`
  getRowKey={(at) => at.document_type_id}   // id crudo, sin prefijo
  folders={{
    folders: pageFolders.map((f) => ({ id: f.id, name: f.name, itemCount: counts[f.id] })),
    getFolderId: (at) => at.document_type_folder_id ?? null,
    openFolders: expandedFolderIds,
    onOpenFoldersChange: setExpandedFolderIds,
    onMoveRow: (at, folderId) => handleMove(at.document_type_id, folderId),
    onCreateFolder: (name) => handleCreateFolder(name),   // Promise<HuemulTableFolder | void>
    onRenameFolder: canManage ? (folder, name) => handleRename(folder.id, name) : undefined,
    onDeleteFolder: canDelete ? (folder) => confirmDelete(folder) : undefined,
    renderCount: (count) => t('folders.typesCount', { count }),
    canDragRows: canManage,
  }}
/>
```

Puntos clave del contrato (`HuemulTableFolders<T>` en `src/types/huemul/table.ts`):

- `getFolderId(item)` — no hace falta prefijar nada: el id crudo del backend
  alcanza como `getRowKey`, `HuemulTable` distingue carpetas de ítems
  internamente por `kind`.
- `itemCount` en cada `HuemulTableFolder` es opcional — si se omite,
  `HuemulTable` lo calcula contando los ítems de `data` cuya `getFolderId`
  apunta a esa carpeta. **Ojo con el optimistic update**: si tu mutación de
  mover parchea la query de ítems (`onMutate` + `setQueriesData`, como
  `patchDocumentTypeFolderId` en `useDocumentTypeFolders.ts`) pero NO la
  query de carpetas, es mejor dejar `itemCount` sin definir (que se recalcule
  desde `data`, que sí está parchada) en vez de pasar el conteo stale de la
  respuesta de carpetas.
- `onCreateFolder`/`onRenameFolder` son async y devuelven una promesa —
  `HuemulTable` maneja el estado de guardado/error del formulario inline.
  `onDeleteFolder` es síncrono: solo dispara la confirmación (el borrado en sí
  vive en un diálogo aparte, ver §6).
- Marcar `primary: true` en la columna de nombre (`HuemulTableColumn.primary`)
  — ahí es donde `HuemulTable` pone el chevron, el ícono de carpeta, la
  indentación de hijos y el badge de conteo. Sin `primary` en ninguna
  columna, usa la primera.

## 2. Row keys — ya no hace falta prefijarlas

Con el árbol armado por `HuemulTable`, `getRowKey` puede devolver el id crudo
del backend: carpetas e ítems son tipos distintos (`HuemulTableFolder` vs `T`)
y nunca comparten espacio de keys. `selectedKeys`/`onSelectionChange` reciben
y devuelven directamente esos ids — no hace falta filtrar por prefijo antes de
pasarlos a un service de exportación ni nada similar.

## 3. Selección multi-fila con `selectable`

Las filas de carpeta muestran su propio checkbox (selecciona/deselecciona
todos sus hijos visibles, con estado `indeterminate` si hay algunos) pero
**la carpeta en sí nunca entra a `selectedKeys`** — `HuemulTable` ya filtra
eso internamente. La página recibe siempre un `Set` de ids de ítems, sin
necesidad de wrapper propio.

## 4. Drag & drop — ya lo resuelve `HuemulTable`

HTML5 nativo (`draggable`, `onDragStart/Over/Drop/End`), sin dependencias.
Nada de esto hay que reimplementarlo por feature:

- Auto-expandir una carpeta cerrada tras ~650ms de hover con el drag encima.
- Feedback visual de drop target (`ring` + fondo, propagado a los hijos
  visibles y a la fila "carpeta vacía").
- Indicador de gap (línea de 2px) entre filas de raíz para sacar un ítem de
  su carpeta soltándolo entre otras filas.
- Alternativa sin mouse: acción "Mover a carpeta" inyectada automáticamente
  al menú de acciones de cada fila (submenú con las carpetas + "Quitar de la
  carpeta"), y expandir/colapsar por teclado vía el botón del nombre.
- `canDragRows: false` en `folders` apaga el drag entero por permisos (el
  menú "Mover a carpeta" sigue funcionando).

**Lo único que el consumidor sigue resolviendo**: el propio `onMoveRow`
callback (la mutación real) y, si la mutación no es optimista, tolerar que el
drop "tarde" en verse — igual que antes, `HuemulTable` apaga el body
(`opacity-50 pointer-events-none`) mientras `isFetching`.

## 5. Carga y paginación cuando el agrupamiento es client-side

Si el backend no ofrece un endpoint "árbol ya armado" ni filtro confiable por
carpeta en el listado usado por la tabla, traer TODO con un `page_size` alto
(1000, documentado con un comentario) y agrupar en cliente — aceptable para
pantallas de administración de volumen bajo, no para catálogos grandes.

La paginación sigue siendo sobre las **filas de raíz** (carpetas + ítems sin
carpeta), nunca sobre el total de filas aplanadas. A diferencia de la versión
anterior de esta guía, ya no hace falta construir `rows` a mano: la página
solo arma dos listas por página —

```ts
const pageFolders = pagedRootItems.filter(isFolder).map((i) => i.folder)
const pageRootTypes = pagedRootItems.filter(isType).map((i) => i.dt)
const data = [
  ...pageRootTypes.map(toItem),
  // Los hijos de una carpeta COLAPSADA no hace falta mandarlos — el badge usa
  // `itemCount`/`renderCount`, no `data.length`. Si tu `itemCount` depende de
  // que los hijos estén en `data` (ver nota del optimistic update en §1),
  // mandalos siempre, expandida o no.
  ...pageFolders.flatMap((f) => expandedFolderIds.has(f.id) ? childrenOf(f).map(toItem) : []),
]
```

`HuemulTable` inserta los hijos de una carpeta expandida justo después de su
fila automáticamente — no cuentan contra el `pageSize`.

## 6. Menú de la fila de carpeta

`HuemulTable` arma el menú "Renombrar"/"Eliminar" solo con las entradas cuyo
callback venga presente (`onRenameFolder`/`onDeleteFolder` en `folders`) —
condicionalos por permiso ahí, no con un `show` extra. En esta implementación
"Renombrar" es inline (mismo input que crear) y "Eliminar" abre un
`HuemulAlertDialog` de confirmación en la página (el `onDeleteFolder` de
`folders` solo dispara esa confirmación, el borrado real queda fuera de
`HuemulTable`). Si el caso de uso que estás replicando tiene edición
no-trivial de la carpeta (más campos que un nombre), evaluar el patrón de
[`danger-zone-sheet-guide.md`](danger-zone-sheet-guide.md) en su lugar.

## 7. Deshacer (undo) en los toasts

El repo no tiene un mecanismo de undo genérico — cada página arma su propio
toast con `action: { label: t('common:undo'), onClick }` usando `sonner`, y
dispara ahí mismo la mutación inversa. Puntos importantes:

- **Capturar el estado a deshacer en el momento del toast**, no en un ref/
  estado compartido que la siguiente operación pueda pisar. Ver
  `handleMoveAssetType` en `assets-types.tsx`: `previousFolderId` se lee ANTES
  de disparar la mutación y queda cerrado en el callback del toast — dos
  movimientos seguidos deshacen cada uno lo suyo, no siempre el último. Este
  es justo el bug que tenía el prototipo de referencia del feature (un único
  snapshot compartido).
- Duración más larga que el default de `sonner` (4s) para que alcance a
  notar y clickear el botón — 6s para movimientos, 4s para creación (más
  corta porque no hay nada más que leer en el mensaje). Precedente similar en
  `ERROR_TOAST_DURATION_MS` (`src/lib/error-utils.ts`).
- Si la operación tiene un toast automático vía `meta.successMessage` de la
  mutación (`MutationCache.onSuccess` en `src/lib/query-client.ts`), hay que
  **sacarle el `meta.successMessage`** para no duplicar el toast — el de la
  página (con el botón de undo) lo reemplaza.

## Checklist final

```
[ ] `data` es plano — solo ítems, `getFolderId` los liga a su carpeta
[ ] `getRowKey` devuelve el id crudo, sin prefijar
[ ] Una columna con `primary: true` (o la primera, sin marcar)
[ ] `itemCount` sin definir en las carpetas si depende de una query que se
    parchea con optimistic update — dejar que `HuemulTable` lo calcule de `data`
[ ] `onRenameFolder`/`onDeleteFolder` condicionados por permiso (undefined si no aplica)
[ ] `canDragRows` condicionado por permiso
[ ] Paginación sobre filas de raíz; hijos de carpetas colapsadas fuera de `data`
    salvo que el conteo dependa de que estén presentes
[ ] Toasts de mover/crear con "Deshacer", snapshot capturado en el cierre del
    toast (no en estado compartido) — ver §7
[ ] meta.successMessage removido de la mutación si la página pone su propio toast
```
