# Wisecore — Guía de nodo Plate custom con datos frescos del backend

Aplica cuando se agrega un nodo propio (no de la librería `platejs`) al editor —
`mermaid`, `asset_reference`/`role_reference`, `data_table` ya siguen este molde. Tres piezas
siempre aparecen juntas: **constante de tipo + plugin**, **render component** y **regla de
serialización a Markdown**; algunos nodos suman una cuarta, un **provider de datos frescos**.

---

## 0. Árbol de decisión

```
¿El nodo necesita datos que vienen del backend (no solo lo que el usuario tipeó)?
├─ NO (ej. mermaid: el usuario escribe el código) → sin provider, solo plugin + render + serialize
└─ SÍ
    ├─ ¿Los datos frescos deben resolverse en vivo cada vez que se pinta el nodo,
    │  cayendo a un snapshot congelado mientras cargan?      → provider de contexto (§3)
    └─ ¿El nodo debe aparecer en el export a Word/Markdown del backend?
       → el snapshot se congela ANTES de serializar, nunca se serializan datos en vivo (§4)
```

---

## 1. Constante de tipo + plugin

Archivo `src/lib/plate-<nombre>-utils.ts`:

```ts
export const MI_NODO_KEY = 'mi_nodo';
```

Archivo `src/components/plate-editor/components/<nombre>-kit.tsx`:

```tsx
'use client';
import { createPlatePlugin } from 'platejs/react';
import { MiNodoElement } from '@/components/ui/mi-nodo-node';
import { MI_NODO_KEY } from '@/lib/plate-mi-nodo-utils';

const MiNodoPlugin = createPlatePlugin({
  key: MI_NODO_KEY,
  node: { isElement: true, isVoid: true }, // + isInline: true si es un chip en línea
}).withComponent(MiNodoElement);

export const MiNodoKit = [MiNodoPlugin];
```

Registrar el kit en el array de plugins de `plate-editor.tsx` (`usePlateEditor({ plugins: [...] })`).
Precedentes: [mermaid-kit.tsx](../src/components/plate-editor/components/mermaid-kit.tsx),
[data-table-kit.tsx](../src/components/plate-editor/components/data-table-kit.tsx).

Tipar el nodo en `src/types/<nombre>-node.ts`, extendiendo `TElement` de `platejs`
(ver `ia context/refactor-types-guide.md`).

---

## 2. Insertar el nodo

Dos rutas siempre coexisten: el botón de toolbar (`src/components/ui/<nombre>-toolbar-button.tsx`)
y el slash command (`src/components/ui/slash-node.tsx`).

- **Nodo sin configuración previa** (mermaid: se inserta vacío y se edita inline) → ambos llaman
  `insertBlock(editor, MI_NODO_KEY, { upsert: true })`, y el mapeo real vive en
  `insertBlockMap` de [transforms.ts](../src/components/plate-editor/components/transforms.ts).
- **Nodo que necesita elegir algo antes de existir** (data_table: fuente + columnas) → el botón de
  toolbar abre su propio diálogo de configuración y hace `editor.tf.insertNodes({...})` al
  confirmar; el slash command inserta con defaults sensatos vía `insertBlock` y el usuario
  reconfigura después desde el propio nodo (mismo diálogo, ver §5). No hace falta un contexto
  para coordinar "diálogo abierto antes de insertar" — el estado vive local al botón.

---

## 3. Provider de datos frescos

Cuando el nodo necesita datos que cambian fuera del control del editor (ejecuciones, assets,
metadata del documento), **no hace fetch propio** — recibe por props lo que la pantalla contenedora
(`assets-content.tsx`) ya tiene en el caché de React Query, igual que
[mention-refs-context.tsx](../src/contexts/mention-refs-context.tsx) y
[document-data-context.tsx](../src/contexts/document-data-context.tsx):

```tsx
const MiContext = createContext<MiContextValue>({ ...defaultsSeguros });

export function MiProvider({ data, isLoaded, children }) {
  const value = useMemo(() => ({ data, isLoaded }), [data, isLoaded]);
  return <MiContext.Provider value={value}>{children}</MiContext.Provider>;
}

export function useResolvedMiNodo(element: MiNodoElement) {
  const { data, isLoaded } = useContext(MiContext);
  return useMemo(() => {
    if (!isLoaded) return element.snapshot ?? fallbackVacio; // nunca romper el primer paint
    return resolver(element, data);
  }, [element, data, isLoaded]); // `element` completo en el array si el resolver lo usa entero
}
```

Montar el provider en `assets-content.tsx`, en la misma cadena donde ya viven
`MediaUrlProvider` / `MentionRefsProvider` / `RoleRefsProvider` (justo antes de
`AssetsSectionsList`). El default del `createContext` debe ser seguro para renderizar sin
provider (otros usos de `SectionPlateEditor` fuera de `assets-content.tsx` no rompen).

---

## 4. Export: snapshot antes de serializar, nunca datos en vivo

La serialización a Markdown (`markdown-kit.tsx`) corre **fuera de React**, sin acceso al caché —
solo puede leer lo que el propio nodo trae guardado. Por eso todo nodo con datos frescos guarda
un campo `snapshot` que se recalcula **justo antes de guardar**, mismo punto del pipeline que
`ensureMermaidSnapshots` (rasteriza el PNG) y `ensureDataTableSnapshots` (congela filas resueltas):

```ts
// src/lib/plate-mi-nodo-utils.ts
export async function ensureMiNodoSnapshots(nodes, resolve) {
  // recorre el árbol, recalcula `snapshot` de cada nodo MI_NODO_KEY contra `resolve(element)`
}
```

Se invoca en `handleSave` de
[section-plate-editor.tsx](../src/components/plate-editor/section-plate-editor.tsx), en la misma
pasada que `runEnsureMermaidSnapshots()`, antes de `editor.getMarkdown()`. El resolver sale del
provider (`useDataTableBatchResolver` es el ejemplo — `null` sin documento, así el pre-save
saltea la red en el editor de plantillas). Si el resolver es un batch (varios nodos, un solo
request — caso `data_table`), la función de snapshot se parte en dos pasadas porque hay un
`await` en el medio: recolectar todos los nodos primero, un único llamado a `resolve`, después
escribir el resultado por índice de recorrido (nunca recalculando por nodo un dato que solo se
conoce del lado del request, como un `node_id` recién generado — dos cálculos independientes
del mismo valor "aleatorio" nunca coinciden).

La regla de `markdown-kit.tsx` lee **solo** `element.snapshot`, nunca vuelve a resolver en vivo:

```ts
[MI_NODO_KEY]: {
  serialize: (slateNode: MiNodoElement) => ({ type: 'html', value: buildMarkdownDesde(slateNode.snapshot) } as any),
},
```

Sin `deserialize` — el nodo siempre vuelve desde `plate_content` (JSON), nunca se reconstruye
desde Markdown. Mismo criterio en los tres nodos existentes.

---

## 5. Render, toolbar de nodo y reconfiguración

- Nodo void bloque → `PlateElement` + `Popover`/`PopoverAnchor` + `NodeFloatingToolbarContent`
  (nunca `PopoverContent` pelado — ver `ia context/z-index-layering-guide.md`), visible solo
  cuando `isFocusedLast && !readOnly && selected && selectionCollapsed`.
- Si el nodo es configurable (fuente, columnas, filtros), un mismo componente de diálogo sirve
  para insertar (desde el botón de toolbar) y para reconfigurar (botón "Configurar" en el
  toolbar flotante del propio nodo, que hace `editor.tf.setNodes(config, { at: path })`).
- Estados a cubrir siempre: cargando, vacío, fuente no disponible (el nodo quedó apuntando a algo
  que ya no existe en el catálogo) — nunca dejar que el componente crashee por dato ausente.
- `contentEditable={false}` en el wrapper visual; `removeNode` vía `editor.api.findPath` +
  `editor.tf.removeNodes`.

---

## 6. Catálogo de fuentes/columnas (cuando el nodo permite elegir "qué mostrar")

Dos variantes, según de dónde sale el catálogo:

- **Server-side** (`data_table`, desde que el backend expone `/data-table/sources` +
  `/documents/{id}/data-tables/resolve`): el catálogo se pide con un hook cacheado
  (`useDataTableSources`, `src/hooks/useDataTables.ts`, `staleTime: Infinity`) y las
  filas/headers ya vienen formateados del backend — el front no vuelve a formatear nada.
  El único código propio es el **adaptador** (`src/lib/data-table-node-utils.ts`): normaliza
  el nodo (legacy y nuevo) al shape del request, arma el hash de dedupe del batch y lo que se
  persiste en `plate_content`. Un mapa `id -> clave i18n` aparte (`src/lib/data-table-catalog-labels.ts`)
  traduce los ids conocidos del catálogo; un id nuevo que el backend agregue cae al `label` que
  manda el propio backend (sin traducir) en vez de romper. Agregar una fuente o columna nueva es
  trabajo de backend — el front no necesita deploy.
- **Local** (cuando no hay endpoint de catálogo, o el nodo resuelve contra datos que ya están en
  el caché del cliente): un archivo `src/lib/<nombre>-sources.ts` con un array de fuentes, cada
  una con sus campos y un `accessor` que siempre devuelve el valor ya formateado como string.
  Agregar una fuente o columna nueva es agregar una entrada al catálogo — el nodo, el diálogo y
  la serialización no cambian. Precedente histórico de `data_table` antes de migrar a server-side
  (ver `respuestas/spec-data-table-backend.md` para el contrato actual).

---

## Errores comunes

- Serializar datos resueltos en vivo en vez del snapshot — el export queda con lo último que
  alguien vio en pantalla, no con lo que había al guardar (o peor, revienta si corre fuera de React).
- Agregar `deserialize` a un nodo que no lo necesita — repite un mismo dato en dos formatos que se
  pueden desincronizar; si el contenido siempre carga desde `plate_content`, no hace falta.
- `PopoverContent` sin el wrapper `NodeFloatingToolbarContent` — el toolbar de nodo se dibuja
  sobre el toolbar fijo o el header.
- Provider que hace su propio fetch en vez de recibir props — duplica la query que la pantalla
  contenedora ya tiene, y desincroniza el "Refrescar" del nodo del resto de la pantalla.
- En un snapshot en dos pasadas (recolectar → `await` batch → escribir), recalcular en la pasada
  de escritura algo que solo tiene sentido calculado una vez (típicamente un id generado para un
  nodo legacy que no lo traía, ej. `crypto.randomUUID()`). Cada llamada da un valor distinto, así
  que el resultado resuelto en la pasada de recolección nunca encuentra su nodo en la de escritura
  — todo cae silenciosamente al "snapshot anterior" como si el batch hubiera fallado. Correlacionar
  ambas pasadas por índice de recorrido (mismo orden depth-first en las dos) y calcular el id una
  sola vez en la recolección (bug real de `ensureDataTableSnapshots`, corregido antes de mergear).
- Pasar campos individuales (`element.foo, element.bar`) al array de deps de un `useMemo` cuando
  el cuerpo usa `element` completo — ESLint (`exhaustive-deps`) lo marca porque son cosas
  distintas; si el resolver recibe el objeto entero, la dependencia es `element` entero.
- Olvidar el botón de refresh en el toolbar de nodo cuando los datos vienen del backend
  (`ia context/refresh-button-guide.md` también aplica acá — invalidar las queries de la
  pantalla contenedora, no recargar la página).

---

## Checklist final

```
[ ] Constante <NOMBRE>_KEY en src/lib/plate-<nombre>-utils.ts
[ ] Tipo del nodo en src/types/<nombre>-node.ts, extiende TElement
[ ] Plugin (<nombre>-kit.tsx) registrado en plate-editor.tsx
[ ] Botón de toolbar + entrada en slash-node.tsx
[ ] Render component: Popover + NodeFloatingToolbarContent, estados loading/empty/unavailable
[ ] Si necesita datos frescos: provider que recibe props (no fetch propio), montado en assets-content.tsx
[ ] Si debe exportarse: snapshot congelado antes de getMarkdown() en section-plate-editor.tsx
[ ] Regla serialize en markdown-kit.tsx, sin deserialize salvo que el nodo lo necesite de verdad
[ ] npx tsc -p tsconfig.app.json --noEmit y eslint limpios
```
