# Wisecore — Guía del árbol de la biblioteca de activos

Aplica cuando una pantalla, sheet o diálogo nuevo necesita mostrar/navegar la
jerarquía de carpetas + activos de la organización (lo que devuelve
`GET /folder/{id}/get_content`, `services/folders.ts:getLibraryContent`) —
sea para navegar (sidebar de conocimiento), elegir un activo/versión (pickers)
o elegir una carpeta destino. No aplica a jerarquías de otra naturaleza
(sistemas externos, plantillas) — ver §6.

## 0. Superficies existentes (inventario)

| Superficie | Componente | Rol |
|---|---|---|
| Sidebar de `/asset` | `NavKnowledgeContent` (`src/components/layout/nav-knowledge.tsx`) | Navegación, es la referencia |
| Picker genérico de assets | `HuemulAssetTreePickerDialog`/`Field` (`src/huemul/components/huemul-asset-tree-picker.tsx`) | Elegir asset y/o versión — modos `document`/`execution`/`document-with-version` |
| ↳ Filtro de media | `src/hooks/useMediaFilters.tsx` | Usa el picker de arriba |
| ↳ Subida de media | `src/huemul/components/huemul-media-upload-sheet.tsx` | Ídem |
| ↳ Guardar como diagrama | `src/components/document-type-relationships/save-as-diagram-sheet.tsx` | Ídem, modo `execution` |
| ↳ Panel de dependencias | `src/components/dependency/dependency-panel.tsx` | `HuemulAssetTreePickerDialog` directo |
| ↳ Dependencias de plantillas | `src/components/templates/templates-dependencies-tab.tsx` | Ídem |
| ↳ Asset de referencia de sección | `src/components/sections/section-reference-block.tsx` | Ídem, `container="sheet"` |
| Diálogo de suscripciones | `src/components/subscriptions/subscriptions-create-dialog.tsx` | `HuemulFileTree` directo |
| Clonar a nuevo documento | `src/components/assets/dialogs/assets-clone-to-new-document-dialog.tsx` | `HuemulFileTree`, solo carpetas |

**Fuera de alcance, a propósito:**
- **`templates-sidebar.tsx`**: `templateToNode` produce una lista **plana** de
  templates (sin carpetas, `folderType="folder"` nunca matchea). No hay nada
  expandible que persistir.
- **Popover `@` del editor Plate** (`reference-combobox-input.tsx`): no es un
  árbol expandible, es un navegador de un nivel con breadcrumb. Tiene su
  propio mecanismo de persistencia (trail, no expansión) — ver §6.
- **Sistemas externos** (`external-systems.tsx`): jerarquía distinta (sistemas
  → funcionalidades), sin equivalente server-side de `expanded_folder_ids`.
  Tiene clave y mecánica propias — ver §5.
- **Carpetas de tipos de documento** (`assets-types.tsx`, tabla agrupada de un
  nivel): candidata futura, sin persistencia hoy. Si se agrega, clave propia —
  no meterla en `tree-expanded`.

## 1. Montar un árbol nuevo — checklist

```
[ ] ¿La jerarquía es la biblioteca de activos (getLibraryContent)? Si es otra
    (sistemas externos, plantillas planas), esta guía no aplica igual — ver §5/6.
[ ] Llamar useLibraryTreeExpansion({ organizationId, treeRef? }) —
    src/hooks/useLibraryTreeExpansion.ts
[ ] Usar loadRoot() para la carga del nivel raíz (folderId === null)
[ ] Construir los nodos con buildLibraryTree — src/lib/library-tree.ts —
    pasando parentFolderId: null para el root, o el folderId para una carga
    de hijos no-root (getLibraryContent normal, sin loadRoot)
[ ] Escupir {...treeProps} sobre <HuemulFileTree>/<FileTree>
    (preserveExpandedOnRefresh: false + onExpandedFoldersChange)
[ ] Si el árbol tiene nodos expandibles que NO son carpetas reales (ej. un
    modo "versión" donde un documento se vuelve expandible), pasar
    isNodePersistable filtrando esos nodos
[ ] NUNCA dejar preserveExpandedOnRefresh en su default (true) en un árbol
    que ya resuelve expansión server-side — dispara el camino de N requests
    (una por carpeta expandida) que expanded_folder_ids existe para evitar
```

## 2. `useLibraryTreeExpansion` — qué hace y qué no

`src/hooks/useLibraryTreeExpansion.ts`. Cablea un árbol a la persistencia
compartida (`useTreeExpansionStorage`, ver `ia
context/persistencia-estado-ui-guide.md` §3) sin repetir en cada consumidor:

```ts
const { loadRoot, treeProps, expandedIdsRef } = useLibraryTreeExpansion({
  organizationId,
  // Solo true en una superficie persistente montada todo el tiempo (el
  // sidebar). Un picker/diálogo efímero NO lo pide — default false.
  refreshOnServerDiffered: true,
  treeRef: fileTreeRef,
})
```

`loadRoot(params?)` hace el `GET /folder/root/get_content` con
`expanded_folder_ids` (+ `focus_asset_id` si se pasa) resueltos server-side, y
cae solo a una carga plana si el backend rechaza el enriquecimiento (400/404)
— nunca falla en silencio, `enriched: false` en el resultado avisa que la
respuesta no trae `is_expanded` confiable (igual da lo mismo pasarla por
`buildLibraryTree`: sin `expanded_folder_ids` el backend simplemente devuelve
`is_expanded: false` en todo, y el árbol sale plano, que es el comportamiento
correcto de fallback).

`treeProps` es literalmente `{ preserveExpandedOnRefresh: false,
onExpandedFoldersChange: saveExpandedIds }` — se pasa tal cual con spread.

## 3. `buildLibraryTree` — construir los nodos

`src/lib/library-tree.ts`. Toma una `LibraryContent` (folders + assets planos,
con `is_expanded` resuelto) y arma el árbol anidado, agnóstico del tipo de
nodo — cada consumidor aporta sus propios mappers:

```ts
buildLibraryTree<TNode>(content, {
  parentFolderId: null,        // null = root; un id = carga de hijos de esa carpeta
  mapFolder: (f: LibraryContentFolder) => TNode,
  mapAsset?: (a: LibraryContentAsset) => TNode | null,  // null descarta el asset
})
```

- `TNode` debe tener `id`, y opcionalmente `children`/`isExpanded`/`hasChildren`
  — el helper los escribe. `FileNode` y `HuemulTreeNode` ya cumplen.
- Sin `mapAsset`, los assets se ignoran (ver `assets-clone-to-new-document-dialog.tsx`,
  que solo elige carpeta destino).
- El mismo builder sirve para el root enriquecido y para una carga de hijos
  plana no-root (`parentFolderId: folderId`, sin pasar por `loadRoot`) — no
  hace falta un mapeo manual aparte para cada caso.

Ejemplo mínimo (picker de solo-carpetas):

```ts
const mapFolder = (f: LibraryContentFolder): HuemulTreeNode => ({
  id: f.id, name: f.name, type: "folder", hasChildren: true,
})

if (folderId === null) {
  const { content } = await loadRoot()
  return buildLibraryTree<HuemulTreeNode>(content, { parentFolderId: null, mapFolder })
}
const content = await getLibraryContent(organizationId, folderId)
return buildLibraryTree<HuemulTreeNode>(content, { parentFolderId: folderId, mapFolder })
```

## 4. Merge por cobertura — por qué `onExpandedFoldersChange` no reemplaza sin más

La clave `tree-expanded` es **compartida** entre el sidebar (que pagina el
root) y los pickers (que piden `page_size: 1000`, sin paginar). Sin cuidado,
el árbol que emite último borraría lo que el otro tenía expandido.

Por eso `onExpandedFoldersChange` manda, junto al set expandido, `knownIds`:
todo nodo persistible que ese árbol tiene materializado en memoria ahora
mismo (expandido o no). El storage (`useTreeExpansionStorage.saveExpandedIds`)
usa eso para hacer un **merge por cobertura**: reemplaza solo la porción que
el emisor puede dar cuenta, y conserva el resto. Esto es automático —
`treeProps.onExpandedFoldersChange` ya lo hace — no hay nada que implementar
en el consumidor, pero si escribís tu propio callback en vez de usar
`treeProps`, respetá el segundo argumento (`context.knownIds`) o vas a
reintroducir el bug de reemplazo total. Ver `ia
context/persistencia-estado-ui-guide.md` §3 para el detalle completo.

## 5. Nodos expandibles que no son carpetas — `isNodePersistable`

El picker de assets, en modo `execution`/`document-with-version`, vuelve
expandibles los **documentos** (para listar sus versiones) — `type: "folder"`
pero no son carpetas de la biblioteca. Sin filtrar, expandir un documento
mete su id en el set compartido de carpetas (gasta cupo de los 200, y el
backend lo ignora igual). Filtrar con la prop hermana de `isNodeExpandable`:

```ts
<HuemulFileTree
  {...expansionTreeProps}
  isNodePersistable={(node) => node.metadata?.kind === "folder"}
/>
```

Si todo nodo expandible de tu árbol es una carpeta real, no hace falta pasarla
(default: todos los expandibles son persistibles).

## 6. Otras jerarquías — client-side, clave propia

Cuando la jerarquía no es la biblioteca de activos, `getLibraryContent` no
aplica y por lo tanto tampoco `expanded_folder_ids` server-side. El patrón:

- **Clave propia** en `useUserPreference` (nunca compartir `tree-expanded`
  con una jerarquía distinta — contaminaría el cupo y el backend de la
  biblioteca ignoraría esos ids de todos modos).
- **Restauración en la carga root**, no `preserveExpandedOnRefresh`: leer
  `expandedIdsRef.current`, intersectar con los nodos raíz, y resolver los
  hijos de cada uno en paralelo (`Promise.all`, acotado a un tope bajo de
  fetches) para colgarlos con `isExpanded: true` en la respuesta de la carga
  root — así sigue siendo 1 carga (más N fetches acotados), nunca el camino
  de refresh carpeta-por-carpeta.
- Reusar el switch "recordar" existente (`useTreeExpansionRemember`) en vez
  de crear uno nuevo — es una preferencia de usuario, no una por árbol.

Precedente real: **sistemas externos** (`src/pages/external-systems.tsx`,
`useExternalSystemsExpansionStorage` en `src/hooks/useTreeExpansionStorage.ts`,
clave `external-systems-tree-expanded`, tope 50, máximo 10 fetches por carga
root).

El popover `@` del editor Plate no es ni siquiera un árbol expandible (es un
navegador de un nivel con breadcrumb) — su persistencia es un trail de
navegación, mecanismo y clave distintos (`useMentionTrailStorage.ts`,
localStorage simple, `wisecore:mention-trail:<orgId>`). No es una carpeta
expandida, así que no reusa nada de `useTreeExpansionStorage` salvo el switch
"recordar" para el gate.

## Errores comunes

- ❌ Dejar `preserveExpandedOnRefresh` en su default (`true`) en un árbol que
  ya restaura vía `expanded_folder_ids` — dispara el camino de N requests que
  ese parámetro server-side existe para evitar.
- ❌ Cablear `onExpandedFoldersChange` sin usar `loadRoot`/`expandedIdsRef` —
  el árbol persiste lo que el usuario expande pero nunca restaura nada.
- ❌ Escribir un callback de `onExpandedFoldersChange` propio que ignore
  `context.knownIds` y reemplace el set entero — pisa lo que otra superficie
  o página tenía expandido (ver §4).
- ❌ No filtrar con `isNodePersistable` cuando el árbol tiene nodos
  expandibles que no son carpetas reales (ej. documentos en modo versión).
- ❌ Meter otra jerarquía (sistemas externos, carpetas de tipos de documento)
  en la clave `tree-expanded` de la biblioteca — clave propia, ver §6.
- ❌ Reimplementar el mapeo de `LibraryContent` a nodos a mano en vez de
  `buildLibraryTree` — duplica la mecánica de anidado/`is_expanded`/`hasChildren`
  que ya está resuelta y probada.

## Checklist final

```
[ ] useLibraryTreeExpansion para leer/guardar el set compartido
[ ] loadRoot() para la carga del nivel raíz, buildLibraryTree para construir
    los nodos (root y no-root)
[ ] {...treeProps} en el componente de árbol
[ ] isNodePersistable si hay nodos expandibles que no son carpetas reales
[ ] Si es otra jerarquía: clave propia, restauración client-side acotada,
    switch "recordar" reusado (§5/6 según corresponda)
```
