# Wisecore — Guía de paginación por nodo en árboles

Aplica cuando un árbol (`HuemulFileTree` / `FileTree`) muestra carpetas con **muchos hijos** y no debe cargarlos todos de una. La paginación pertenece al **nodo**, no al árbol: cada carpeta pide sus primeros 25 hijos al expandirse y su propia fila "Mostrar 25 más · 25 de 143" pide el resto. **Nunca** paginar el árbol completo con un paginador de pie de panel: los hijos de una carpeta quedan repartidos entre páginas y el usuario pierde el contexto jerárquico.

## 0. Árbol de decisión

```
¿El árbol puede tener carpetas con cientos de hijos?
├─ NO (jerarquía chica: sistemas externos, plantillas, pickers de carpeta destino)
│   → onLoadChildren devuelve un array, como siempre. Sin cambios.
└─ SÍ (biblioteca de activos en el sidebar)
    → onLoadChildren devuelve HuemulTreePage (§1)
    ├─ ¿Es una BÚSQUEDA, no navegación?
    │   → lista plana paginada con ruta, no el árbol (§5)
    └─ ¿Marca/selecciona carpetas en cascada?
        → la cascada recorre todas las páginas (§4)
```

## 1. Contrato de `onLoadChildren`

```ts
onLoadChildren(parentId, node, { cursor, limit })
  → HuemulTreeNode[]            // sin paginar: "todo cargado", como siempre
  | HuemulTreePage              // { items, total?, hasMore, nextCursor }
```

- Tipos en `src/types/huemul/tree.ts` (`HuemulTreePageRequest`, `HuemulTreePage`, `HuemulTreeLoadResult`); el wrapper de assets usa `FileTreePage` (`src/types/assets/components.ts`).
- `cursor: null` = primera página. El **cursor es opaco** para el árbol: lo guarda en el nodo y lo devuelve tal cual. Quién lo emite decide qué significa.
- `limit` por defecto es `TREE_CHILDREN_PAGE_SIZE` (25, `src/huemul/constants.ts`); se cambia con la prop `childrenPageSize`.
- Devolver un **array** es válido y no activa nada (`normalizeTreePage` en `src/lib/tree-page.ts` lo trata como `hasMore: false`, sin `total`). Por eso los pickers y árboles chicos no se tocan.
- `total` es opcional: si no está, no hay contador ("de N" ni número junto a la carpeta).
- Un `onLoadChildren` que falla en una página **posterior** a la primera debe **lanzar** el error: el árbol conserva lo ya cargado y deja la fila para reintentar. En la primera página, devolver una página vacía como siempre.

## 2. El estado vive en el nodo

`HuemulTreeNode` (y `FileNode`) suman `childrenTotal`, `nextCursor`, `loadedPages` e `isLoadingMore`. La raíz tiene su propio estado interno en `HuemulFileTree` (`rootPaging`).

- Colapsar y volver a expandir **no** pide de nuevo ni pierde lo cargado (el nodo conserva `children`).
- **`refresh()` repite las mismas páginas** que estaban visibles: arma un mapa `id → loadedPages` del estado actual y recarga cada carpeta abierta encadenando cursores esa cantidad de veces (`loadPages` en `huemul-file-tree.tsx`). Un cursor que no avanza corta la cadena.
- Con `preserveExpandedOnRefresh={false}` (sidebar de la biblioteca) la respuesta de la raíz es autoritativa: las carpetas expandidas llegan completas desde esa respuesta y no se re-paginan (§6).

## 3. La fila "Mostrar más" y la autocarga

`src/huemul/components/huemul-tree-load-more-row.tsx`. Se renderiza como **último hijo del nodo** (o al final de la lista raíz) con la misma indentación y conectores que sus hermanos, cuando `nextCursor` no es nulo.

- Texto: "Mostrar {n} más" con `n = min(limit, total - cargados)` (`nextBatchSize`), y a la derecha "25 de 143" si hay `total`. Spinner mientras carga. El botón queda **siempre visible**: es el control explícito y el estado de carga aunque la autocarga esté activa.
- **Autocarga solo en la fila del final del árbol** (`tailPagingKey`): un `IntersectionObserver` (`rootMargin: "0px 0px 200px 0px"`) dispara la siguiente página al acercarse al borde. Las filas intermedias se cargan **con clic**: una carpeta que apenas pasa por la vista no debe encadenar cargas en cascada.
- El guard es doble: `loadingMoreRef` (síncrono, por nodo) y `isLoadingMore` (visual). Dos disparos del observer = una sola request.
- Durante un drag & drop el autoscroll existente alcanza para que la fila de cola entre en vista y cargue la página siguiente; no hay código extra.

## 4. Selección en cascada

`collectLeafIds` sigue los cursores hasta agotarlos: marcar una carpeta es una acción explícita sobre **todo** su contenido, no solo lo cargado. Mientras una carpeta tenga `nextCursor`, `getCheckState` nunca devuelve `checked`: queda `indeterminate` si hay algo marcado. Si el volumen justifica no traer todo al cliente, la alternativa es resolverlo en backend; hoy no hay endpoint para eso.

## 5. Búsqueda: lista plana, no árbol

Con una query activa el sidebar **no navega la jerarquía**: `NavKnowledgeSearchResults` (`src/components/layout/nav-knowledge-search-results.tsx`) muestra coincidencias planas con su ruta (`folder_path ?? folder_name` en activos, `path` en carpetas), paginadas de a 25 con la misma fila "Mostrar más" (con `autoLoad`). Reiniciar la lista al cambiar la query y descartar respuestas viejas con un `epoch`.

## 6. Cursor del sidebar de la biblioteca (`nav-knowledge`)

`handleLoadChildren` (`src/components/layout/nav-knowledge.tsx`) devuelve `FileTreePage` con `toTreePage` (`nav-knowledge-utils.ts`):

- **Con backend nuevo**: usa `next_cursor` y `total` de la respuesta de `get_content` (opacos, clave estable `name+id`) y los reenvía como `cursor` (`getLibraryContent(..., { cursor })`).
- **Fallback actual**: sin `next_cursor`, pagina por número de página con el cursor `"<página>:<tamaño>"` (`encodePageCursor` / `parsePageCursor`). Lleva el tamaño porque la carga raíz **enriquecida** (foco del asset abierto + carpetas expandidas persistidas, `useLibraryTreeExpansion.loadRoot`) usa una página grande (`ROOT_ENRICHED_PAGE_SIZE = 1000`) y la página 2 debe alinearse con ella.
- Una página con cursor **nunca** es enriquecida ni consume `pendingFocusAssetIdRef` / el foco del asset activo (solo la primera carga raíz).
- Contrato pedido a backend: `respuestas/backend-arbol-paginacion-por-carpeta.md`.

## 7. Virtualización (siguiente paso, no implementado)

Si una carpeta supera unos cientos de nodos **cargados**, el render recursivo se degrada. La salida es aplanar el árbol visible a una lista de filas y virtualizarla con `@tanstack/react-virtual` (ya es dependencia). Requiere reescribir `renderNode` (hoy recursivo, con conectores por nivel) y que la fila "Mostrar más" sea una fila más de esa lista. No se hace hasta que haya un caso real que lo pida.

## Errores comunes

- ❌ Volver a un paginador global (`HuemulPagination`) para el árbol: reparte los hijos de una carpeta entre páginas.
- ❌ Autocargar **todas** las filas "Mostrar más" visibles: abrir varias carpetas dispara cargas en cascada. Solo la de la cola.
- ❌ Interpretar el cursor en el árbol: es opaco, lo emite el consumidor.
- ❌ Devolver `[]` ante un error en una página posterior a la primera: la fila desaparece y no se puede reintentar. Lanzar el error.
- ❌ Hacer que `refresh()` vuelva a la página 1: el usuario pierde lo que había scrolleado. Repetir `loadedPages`.
- ❌ Poner `total` a un consumidor que devuelve un array: mostraría el contador en árboles que no paginan.
- ❌ Tratar una carpeta con `nextCursor` como "todo seleccionado" en la cascada.
- ❌ Pedir una página con cursor usando la carga raíz enriquecida: el foco y la expansión solo aplican a la primera carga.

## Checklist final

```
[ ] onLoadChildren devuelve HuemulTreePage (items, total?, hasMore, nextCursor); un árbol chico sigue devolviendo array
[ ] El cursor se trata como opaco; errores de páginas posteriores se lanzan
[ ] Solo la fila de cola lleva autoLoad; las demás, clic
[ ] refresh() conserva las páginas visibles (loadedPages)
[ ] Selección en cascada resuelve todas las páginas
[ ] La búsqueda es una lista plana con ruta, no el árbol
[ ] Textos de la fila en i18n (huemul-file-tree: showMore, showMoreProgress)
[ ] Tests: expandir pide limit 25, "Mostrar más" solo toca su nodo, refresh repite páginas, array sin fila
```
