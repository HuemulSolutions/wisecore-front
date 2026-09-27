# Wisecore — Guía de superficies de detalle (misma pieza como página o como sheet ancho)

Aplica cuando una misma pieza de contenido —típicamente con tabs— tiene que poder mostrarse como **página completa con URL propia** y/o como **sheet ancho** sobre la pantalla actual. Componente canónico: `src/huemul/components/huemul-detail-surface.tsx` (`HuemulDetailSurface`). Referencia de uso real: `src/pages/asset-type-detail.tsx` (página) + `src/components/assets-types/assets-types-config-sheet.tsx` (sheet), ambos sobre el mismo `useAssetTypeConfig` (`src/components/assets-types/assets-types-config-content.tsx`).

Leer también `ia context/huemul-page-layout-guide.md` (layout), `ia context/refresh-button-guide.md` (refresh por superficie), `ia context/sheet-footer-batch-save-guide.md` (zona de guardado) y `ia context/refactor-file-guide.md` §1 (reglas para promover a `huemul-*`).

---

## 0. Árbol de decisión

```
¿La pantalla es un detalle de UNA entidad (no un listado)?
├─ NO → esta guía no aplica (ver list-detail-panel-guide.md)
└─ SÍ
    ├─ ¿Debe ser linkeable / compartible / sobrevivir a un refresh?
    │   └─ SÍ → variant="page" + ruta con id (§3)
    ├─ ¿Se abre sobre un contexto que se perdería al navegar
    │   (un canvas, un grafo, un wizard a medio llenar)?
    │   └─ SÍ → variant="sheet"
    └─ ¿Las dos cosas, según desde dónde se abra?
        └─ SÍ → UN hook con el estado + DOS cascarones que solo eligen
                la variante (§2). Nunca dos copias del contenido.
```

Si la respuesta es "las dos", el reparto es siempre el mismo: **el estado y el contenido en un hook, la superficie en el cascarón**. Es la regla de `ia context/fullscreen-share-route-guide.md` §4 (parametrizar, no duplicar) aplicada al contenedor.

---

## 1. Qué resuelve `HuemulDetailSurface` y qué no

**Sí:** identidad (ícono + título + subtítulo), barra de tabs con el estilo estandarizado, botón de volver, refresh en el lugar correcto según la variante, y la zona de guardado.

| | `variant="page"` | `variant="sheet"` |
|---|---|---|
| Shell | `HuemulPageLayout` de una columna | `HuemulSheet` (`size="wide"` por default) |
| Identidad | `PageHeader` con `backAction` | header nativo del sheet, `iconVariant="tile"` |
| Refresh | `onRefresh`/`isLoading` del `PageHeader` | strip icon-only junto a la barra de tabs |
| Guardado | `HuemulPanelSaveBar` en el slot `footer` de la columna | footer sticky nativo (`saveAction` + `footerLeft`) |
| Cerrar | `backAction` | X nativa / ESC / overlay, vía `onOpenChange` |

**No** (a propósito, y no agregarlo):
- **Permisos.** Es un huemul: cero imports de `@/services`, `@/hooks/use*`, `@/contexts` y cero tipos de dominio (checklist de `refactor-file-guide.md` §1.2). Los tabs llegan ya filtrados.
- **El estado del tab.** Es controlado (`activeTab` + `onTabChange`) porque cada superficie lo guarda distinto: el sheet en `useState`, la página en la URL. Ahí está la fricción real entre ambas y el componente no debe tomar partido.
- **El guard de cambios sin guardar.** Vive en el consumidor. `onTabChange` es el punto donde se intercepta.
- **Los datos.** El componente no hace fetch.

---

## 2. El reparto en tres archivos

```
src/components/<módulo>/<módulo>-config-content.tsx   ← use<X>Config: estado + array `tabs` + saveBar + guard
src/components/<módulo>/<módulo>-config-sheet.tsx     ← cascarón: useState del tab + variant="sheet"
src/pages/<módulo>-detail.tsx                          ← cascarón: useUrlTab + variant="page"
```

El hook devuelve **el array `tabs` ya armado**, no piezas sueltas para que cada superficie las ensamble:

```ts
return {
  availableTabs,     // qué tabs habilitan los permisos
  tabs,              // HuemulDetailSurfaceTab[] listo para la superficie
  saveBar,           // descriptor del tab activo, undefined si ese tab no guarda
  isDirty,           // agregado de todos los tabs
  guardedAction,     // envuelve una navegación/cierre en el guard
  handleTabChange,   // para onTabChange: ya viene guardado
  unsavedAlert: { open, setOpen, discard },
}
```

Dos parámetros son los que absorben la diferencia de superficie:
- **`enabled`** en vez de `open`: gatea los fetch de los tabs. El sheet pasa su `open`; la página pasa `true` (ahí el desmontaje lo hace el router). El efecto de reset se cuelga de `enabled`, así que en la página nunca dispara.
- **`variant`**: solo ajusta el padding lateral de los tabs. En sheet la barra cancela el padding del body con `-mx-6`, así que el padding lo pone cada tab (`px-6`); en página, `px-4 md:px-6`.

El hook recibe **el id**, no la fila de la tabla. El nombre y el color son del header, y cada superficie arma el suyo — así la página no necesita hidratar un stub de fila para pasárselo al contenido.

---

## 3. La ruta de la variante página

```tsx
// App.tsx, dentro de <Route path="/:orgId" element={<AppLayout />}>
<Route path="asset-types/:documentTypeId" element={
  <PermissionProtectedRoute permissions={[...RBAC_PAGES["asset-types"].routePermissions]}>
    <AssetTypeDetailPage />
  </PermissionProtectedRoute>
} />
```

- `path` como **string literal**, nunca template literal.
- El primer segmento **debe** ser el del módulo dueño: así hereda su entrada de `RBAC_PAGES` sin tocar la matriz (mismo criterio que `templates/:id`). Ver `fullscreen-share-route-guide.md` §2.
- El prefijo `/:orgId` no se escribe en el `path`; `useOrgNavigate` lo agrega al construir el link.
- El call-site que antes abría el sheet pasa a `navigate(\`/<módulo>/${id}\`)`.

### El tab en la URL: `useUrlTab`

`src/hooks/useUrlTab.ts` es la única definición de este patrón (antes estaba copiado a mano en `users.tsx` y `roles.tsx`).

```tsx
const { tab, setTab } = useUrlTab({
  tabs: availableTabs,
  ready: !isLoadingPermissions,   // no reescribir antes de conocer los permisos
  normalize: true,                // corregir un ?tab= que el usuario no puede ver
})
```

- **`normalize: true`** cuando el conjunto de tabs depende de permisos: un `?tab=lifecycle` no permitido debe quedar corregido en la URL, no solo ignorado.
- **`normalize: false`** (default) cuando los tabs son fijos: el valor inválido cae al fallback solo en lectura, sin tocar la URL. Es lo que hacen `users`/`roles`.
- **`ready`** es obligatorio junto con `normalize`: sin él, el primer render reescribe el tab antes de que resuelvan los permisos.
- `applyTab(params, tab)` para escribir el tab **junto a otro param** en una sola navegación (`?user=<id>&tab=roles`), en vez de partirlo en dos `setSearchParams`.

### Guard de navegación

El repo usa `BrowserRouter`, así que **`useBlocker` de react-router no está disponible**. El mecanismo del proyecto es `useEditingGuard` / `useOptionalEditingGuard` (`src/contexts/editing-guard-context.tsx`):

```tsx
useEffect(() => {
  setIsSectionEditing(config.isDirty)
  return () => setIsSectionEditing(false)
}, [config.isDirty, setIsSectionEditing])
```

Eso cubre el nav lateral (`GuardedNavLink` en `app-layout.tsx`) y el cierre/refresh de pestaña (`beforeunload`). El botón de volver pasa por el `guardedAction` del hook, que muestra el `HuemulAlertDialog` y dispara los `discard()` de cada tab.

---

## 3bis. Ancho del contenido en pantallas grandes

**Primero la estructura, después el tope.** Si el contenido son bloques que deben convivir a lo ancho, eso es un **grid de columnas** con `contentWidth: "full"` — no un ancho calculado. El tope existe solo para **texto largo**, donde pasada cierta medida la lectura se vuelve incómoda.

Los tabs de configuración de tipos de activo pasaron por tres topes antes de que quedara claro que su problema era estructural: `max-w-xl` (encajonado), `max-w-4xl` centrado (vacío a los lados), `w-1/2` a la izquierda (media pantalla desperdiciada). Los tres eran un ancho tratando de resolver un layout. La forma correcta era un `grid md:grid-cols-2`.

**No escribir `max-w-*` a mano.** Los valores viven en `HUEMUL_CONTENT_WIDTH` (`src/huemul/constants.ts`):

| Valor | Clase | Cuándo |
|---|---|---|
| `reader` | `max-w-3xl` (768px) | Texto largo / lectura |
| `full` | — | Todo lo demás: grids de columnas, tablas, matrices, canvas |

Cada tab lo declara, y `HuemulDetailSurface` aplica la clase:

```tsx
// Grid de 2 columnas: reparte el ancho por sí solo.
tabs.push({ value: "general",   contentWidth: "full", ... })
tabs.push({ value: "templates", contentWidth: "full", ... })
// La matriz de permisos necesita todo el ancho.
tabs.push({ value: "lifecycle", contentWidth: "full", ... })
```

**Dos tabs hermanos que deben cortar en el mismo punto** se alinean usando el mismo grid y el mismo `gap` (`grid items-start gap-4 md:grid-cols-2` en General y en Plantillas), nunca anchos calculados para que coincidan.

La escala tiene solo lo que tiene consumidor real. Cuando aparezca un caso que necesite otro tope, se agrega **con ese caso** — no antes.

- **`contentAlign`** (`"start"` | `"center"`, default `"start"`) es decisión de cada superficie: con un tope aplicado, `"start"` deja todo el vacío a la derecha y `"center"` lo reparte.
- **El default de `contentWidth` es `"full"`**, y para un grid de columnas eso es lo correcto. Cuidado con dejar en `full` un bloque de **filas con acciones a la derecha** que no esté dentro de un grid: en un monitor ancho sus botones terminan en el borde de la pantalla, lejos del nombre del ítem.
- **Superficie con ramas de ancho distinto:** cuando un mismo tab muestra vistas que necesitan anchos diferentes, el tab declara `full` y la rama acotada aplica la escala adentro con el helper `contentWidthClass(width, align)` — nunca un ancho a mano. Hoy no hay ningún caso vivo (`AssetTypeTemplatesPanel` resolvió el suyo con un grid), pero ese es el camino cuando aparezca.
- El wrapper de ancho **solo se monta si hay límite**: un tab cuyo contenido cuenta con ser hijo flex directo del `TabsContent` (`data-[state=active]:flex`) se rompería con un div incondicional.

**Deuda conocida** — dos superficies anteriores a la escala, a migrar cuando se las toque: `workflow-detail-panel.tsx:636` y `assets-content.tsx:2984`, ambas con un `mx-auto w-full max-w-*` a mano que corresponde a `reader`.

---

## 3ter. Cards de sección

El contenedor de sección es **`HuemulSectionCard`** (`src/huemul/components/huemul-section-card.tsx`): shell + header opcional (`title`, `subtitle`, `headerRight`) + body + `footer` opcional, y colapsable si se le pasa `open`/`onOpenChange`.

- **Sin `title` es solo el shell**, sin div de body ni padding: el consumidor pone el padding por `className`. Ese es el contrato que hereda `PanelCard`.
- En `assets-types`, `PanelCard` es un alias de reexport de este componente y `PanelCollapsibleCard` un wrapper fino (su firma exige `title` y `open`). Sus consumidores no cambiaron.
- Los colores son hex literales, no tokens del tema, y no soporta dark mode: se conservaron tal cual al unificar para no alterar las superficies existentes. Migrarlos es un cambio aparte.
- No agregar un header de sección a mano (`div` + `h3` + `p` con clases hex): era exactamente la duplicación que este componente eliminó.

---

## 4. Errores comunes

- ❌ Duplicar el contenido en dos archivos, uno por superficie. Es exactamente lo que esta guía existe para evitar.
- ❌ Meter permisos, fetch o tipos de dominio dentro del `huemul-*`. Deja de ser reutilizable y rompe el checklist de `refactor-file-guide.md` §1.2.
- ❌ Que el componente posea el `activeTab`. La página lo necesita en la URL y el sheet en memoria; si el componente lo posee, una de las dos pierde.
- ❌ `normalize: true` sin `ready`: rebota el tab en el primer render.
- ❌ Olvidar el refresh. Es una superficie que consume el backend, así que la regla de `refresh-button-guide.md` aplica igual: un solo `onRefresh` que agrupa todas las queries de la superficie, sin toast, con `|| isFetching` en el flag si el handler usa `invalidateQueries`.
- ❌ Inventar un footer sticky en la variante página. `HuemulPageLayoutColumn` ya tiene slot `footer` y se monta como strip `shrink-0`.
- ❌ Copiar la clase de los tabs a mano. Vive en `huemul-detail-surface.tsx`.
- ❌ Dejar sin estructura ni tope un bloque de filas con acciones a la derecha: en un monitor ancho el botón de cada fila termina en el borde de la pantalla, a 1000px del nombre del ítem.
- ❌ Escribir un ancho a mano (`max-w-*`, `w-1/2`) en vez de usar la escala (`HUEMUL_CONTENT_WIDTH` / `contentWidthClass`). Era el estado previo: tres valores sueltos sin relación entre sí.
- ❌ Resolver con un ancho lo que es un problema de estructura. Si dos bloques deben quedar lado a lado, o si dos tabs hermanos deben cortar en el mismo punto, es un `grid` con el mismo `gap` — no un `max-w` ni un `w-1/2` elegidos a ojo.
- ❌ Dibujar un header de sección a mano (`div` + `h3` + `p`) en vez de `HuemulSectionCard` con `title`/`subtitle`.
- ❌ Dejar el estado viejo del sheet (`configXxx: Xxx | null` en el `PageState`) después de migrar el call-site a `navigate`.
- ❌ `path` con template literal en `App.tsx`, o un primer segmento distinto al del módulo: pierde el mapeo a `RBAC_PAGES`.

---

## 5. Checklist final

```
[ ] 1. El contenido y el estado viven en UN hook use<X>Config; las superficies son cascarones.
[ ] 2. El hook recibe `enabled` (no `open`) y el id de la entidad (no la fila).
[ ] 3. El hook devuelve `tabs` ya armado, `saveBar` del tab activo, `isDirty`, `guardedAction`.
[ ] 4. `HuemulDetailSurface` sin dominio: nada de permisos, fetch ni tipos de negocio.
[ ] 5. Página: ruta con `path` string literal, primer segmento = módulo, sin tocar rbac-matrix.
[ ] 6. Página: `useUrlTab` con `normalize`/`ready` según si los tabs dependen de permisos.
[ ] 7. Página: guards en orden — isLoadingPermissions → skeleton; sin acceso / sin id / sin
       ningún tab habilitado → access-denied.
[ ] 8. Página: `setIsSectionEditing(isDirty)` y botón volver a través de `guardedAction`.
[ ] 9. Refresh presente en las dos superficies, con un solo handler agrupado.
[ ] 9bis. El ancho se resolvió con estructura (grid de columnas) y no con topes;
       `contentWidth: "reader"` solo donde hay texto largo. Las secciones usan
       `HuemulSectionCard`.
[ ] 10. El sheet migrado se comporta EXACTAMENTE igual que antes (probarlo antes de seguir).
[ ] 11. Textos nuevos en `src/i18n/locales/<módulo>.ts`; el huemul recibe todo por props.
[ ] 12. `npx tsc -p tsconfig.app.json --noEmit` y `npx eslint <archivos>` sin errores.
```
