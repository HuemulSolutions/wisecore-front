# Guía de jerarquía de capas (z-index) y toolbars flotantes

Aplica cuando se agrega o modifica: un header sticky, un banner sticky, un overlay, un popover flotante dentro del editor Plate, o cualquier elemento que deba quedar **encima o debajo** de otro.

---

## Cuándo leer esta guía

- Voy a escribir una clase `z-…` nueva.
- Un elemento flotante se dibuja encima del header o del toolbar del editor.
- Estoy creando un toolbar flotante para un nodo de Plate (imagen, diagrama, tabla, embed…).
- Voy a agregar un header o barra sticky a una página de detalle.

---

## 1. Escala central

Fuente única: bloque `:root` de [`src/index.css`](../src/index.css). **Nunca escribir números de z-index sueltos** (`z-50`, `z-100`, `z-500`); usar el token.

| Token | Valor | Qué vive ahí |
|---|---|---|
| `--z-app-header` | 50 | Header global de la app ([`app-layout.tsx`](../src/components/layout/app-layout.tsx)) |
| `--z-page-header` | 40 | Header de detalle (activo, plantilla): título, tabs, acciones de ciclo de vida |
| `--z-page-sticky-elevated` | 32 | Banner de ejecución que **convive** con secciones reales visibles (ver nota abajo) |
| `--z-page-sticky` | 30 | Barra sticky de sección, banners de ejecución que reemplazan la lista por un skeleton |
| `--z-page-sticky-secondary` | 28 | Banners que viven **bajo** la barra de sección (`top-9`) |
| `--z-editor-toolbar` | 30 | `FixedToolbar` del editor (dentro del `isolate` del editor) |
| `--z-editor-node-toolbar` | 25 | Toolbars flotantes de nodo: mermaid, media, tabla, link |
| `--z-editor-floating-toolbar` | 20 | Toolbar de selección de texto |
| `--z-editor-selection` | 10 | Rectángulo de selección de bloques por arrastre |
| `--z-editor-menu` | 50 | Menús que el usuario abre a propósito: `/`, emoji, selects de nodo |
| `--z-launcher-scrim` | 49 | Velo de contexto bajo el panel del lanzador de workflows (queda debajo del `Popover` base en `z-50`) |
| `--z-feed-sticky` | 10 | Cabecera de grupo sticky dentro de un feed scrolleable (`HuemulGroupedFeed`, historial) |
| `--z-canvas-state` | 5 | Overlay de estado (ej. lienzo vacío) montado **dentro** de `<ReactFlow>`. React Flow apila `pane` 1, `viewport` 2, `renderer` 4, `Panel` 5: cualquier cosa por debajo de 5 queda tapada por el renderer y no recibe clics |
| `--z-canvas-rail-panel` | 12 | Panel superpuesto (300px) del riel de `/diagrams`: árbol, listado, recientes, búsqueda. Queda bajo `--z-canvas-overlay` (15) |

Sintaxis Tailwind v4: `className="z-(--z-page-header)"` (no `z-[var(--z-page-header)]`; el linter marca la forma larga).

### `--z-page-sticky` vs `--z-page-sticky-elevated`

Con z-index igual entre elementos `sticky`, CSS resuelve el pintado por orden en el DOM: gana el que aparece **después**. Un banner de ejecución que se monta ANTES de la lista de secciones (caso típico: banner global arriba, secciones abajo) queda tapado por la barra sticky de cualquier sección si ambos coinciden en `top-0`, salvo que el banner use un nivel más alto.

- **`--z-page-sticky`** (30): banners que, mientras están visibles, **reemplazan** la lista de secciones por un skeleton (no hay ninguna barra de sección montada con la que competir). Ej.: banner de ejecución completa/full-single sobre la versión que se está generando.
- **`--z-page-sticky-elevated`** (32): banners que deben convivir con secciones **reales e interactivas** en pantalla (ej. ejecución `single`/`from`: la sección sigue editable mientras se regenera). Usarlo siempre que el banner pueda coexistir con una barra de sección visible — si no, queda tapado sin que ningún error lo avise.

**No tocar** los primitivos de overlay: `dialog`, `alert-dialog`, `sheet`, `dropdown-menu`, `popover` base siguen en `z-50`. Son modales/menús invocados por el usuario y deben ir sobre el header. (No hay primitivo `tooltip`: los tooltips son `title=` nativo del navegador, sin z-index propio — ver `ia context/tooltip-guide.md`.)

### Por qué los toolbars del editor tienen números bajos

[`plate-editor.tsx`](../src/components/plate-editor/plate-editor.tsx) envuelve el editor en `relative isolate`, que crea un stacking context propio. Los z-index de adentro solo compiten entre sí; el contenedor entero se apila como `z: 0` frente al resto de la página. Por eso `--z-editor-toolbar` (30) > `--z-editor-node-toolbar` (25) > `--z-editor-floating-toolbar` (20) ordena el editor por dentro sin pelear con los headers.

---

## 2. El z-index no alcanza: hace falta control de colisión

Los toolbars de nodo son `Popover` de Radix **portalizados a `<body>`**. Un portal escapa del `isolate` del editor, así que ningún z-index lo deja "debajo" del toolbar fijo de forma fiable. La solución real es geométrica: reservar la franja superior para que floating-ui haga **flip debajo del nodo** en vez de invadirla.

### Inset del chrome fijo

[`editor-chrome-inset.tsx`](../src/components/plate-editor/components/editor-chrome-inset.tsx) expone `useEditorChromeInset(): number` — píxeles ocupados desde el tope del viewport por header global + header de detalle + barra de sección + toolbar del editor.

Se mide **una sola cosa**: el `getBoundingClientRect().bottom` del `FixedToolbar`. Al ser `sticky`, ya queda pegado bajo todo lo anterior, así que su borde inferior resume el apilado completo. Fallback cuando no hay toolbar (lector / `readOnly`): `[data-desktop-header]` → `[data-mobile-header]` → `[data-app-header]`.

Se recalcula con `ResizeObserver` + `scroll` en captura + `resize`, throttled por `requestAnimationFrame`, y solo re-renderiza si el valor cambia ≥ 1px.

### Toolbars de nodo: usar siempre el wrapper

```tsx
// ✅ correcto
import { NodeFloatingToolbarContent } from '@/components/ui/node-floating-toolbar';

<Popover open={open} modal={false}>
  <PopoverAnchor asChild>{content}</PopoverAnchor>
  <NodeFloatingToolbarContent onOpenAutoFocus={(e) => e.preventDefault()}>
    …botones…
  </NodeFloatingToolbarContent>
</Popover>
```

```tsx
// ❌ incorrecto: se dibuja sobre el toolbar del editor y sobre el header
<PopoverContent className="w-auto p-1">…</PopoverContent>
```

[`node-floating-toolbar.tsx`](../src/components/ui/node-floating-toolbar.tsx) aplica `side="top"`, `avoidCollisions`, `hideWhenDetached` y `collisionPadding={{ top: inset + 8, … }}`, más el token `--z-editor-node-toolbar`.

Ya lo usan: [`mermaid-node.tsx`](../src/components/ui/mermaid-node.tsx), [`media-toolbar.tsx`](../src/components/ui/media-toolbar.tsx), [`table-node.tsx`](../src/components/ui/table-node.tsx).

### Toolbars sobre floating-ui directo (no Radix)

Para los que arman su propio `middleware` ([`floating-toolbar.tsx`](../src/components/ui/floating-toolbar.tsx), [`link-toolbar.tsx`](../src/components/ui/link-toolbar.tsx)), pasar el inset como `padding` a `flip` **y** a `shift`, dentro de un `useMemo` que dependa del inset:

```tsx
const topInset = useEditorChromeInset();

const middleware = React.useMemo(() => {
  const padding = { top: topInset + 12, bottom: 12, left: 12, right: 12 };
  return [offset(10), flip({ fallbackPlacements: [...], padding }), shift({ padding })];
}, [topInset]);
```

### Menús de Ariakit

[`inline-combobox.tsx`](../src/components/ui/inline-combobox.tsx) (`/`, emoji, menciones) usa `ComboboxPopover`, que acepta un número:

```tsx
overflowPadding={Math.max(8, chromeInset + 8)}
```

---

## 3. Errores comunes

- Escribir `z-50` "porque el de al lado también" — el resultado real lo decide el orden del DOM, no el número. Usar el token de la capa.
- Subir el z-index para ganar una superposición de un portal: no funciona a través de `isolate`; el arreglo es `collisionPadding`.
- Poner `collisionPadding` fijo (ej. `64`): la franja cambia con el breakpoint, los banners de ejecución y el `toolbarTopOffset` de la sección. Usar `useEditorChromeInset()`.
- Olvidar `hideWhenDetached`: al scrollear, el toolbar queda huérfano flotando sobre el header.
- Agregar un header sticky nuevo sin `data-…-header`: rompe el fallback del inset en modo lector.

---

## Checklist final

- [ ] Ningún `z-` numérico nuevo; todo con token de `:root`.
- [ ] Toolbar de nodo nuevo usa `NodeFloatingToolbarContent`.
- [ ] Si usa floating-ui directo: `padding` del inset en `flip` + `shift`.
- [ ] Header sticky nuevo lleva `data-desktop-header` / `data-mobile-header` / `data-app-header`.
- [ ] Probado con el nodo pegado al tope del scroll → hace flip hacia abajo.
- [ ] Probado en variante `section` (con `toolbarTopOffset`) y `default`.
- [ ] Probado en modo lector (`readOnly`, sin toolbar) → usa el fallback.
- [ ] Dialogs, sheets y dropdowns del header siguen por encima del header.
