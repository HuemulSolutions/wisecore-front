# Wisecore — Guía de persistencia de estado de UI

Aplica cuando una interacción del usuario (qué carpeta dejó abierta, qué modo
de vista eligió, qué ancho le dio a una columna, en qué scroll estaba) debe
sobrevivir a un F5 o a volver a entrar a la pantalla. No confundir con caché de
datos del backend (React Query): esto es intención/estado de interacción del
usuario. Desde 2026-09 existe un endpoint genérico de preferencias
(`GET/PUT/DELETE /user/preferences/{key}`, ver §4) para el caso en que ese
estado deba seguir al usuario entre navegadores/dispositivos — pero sigue
siendo la excepción: la mayoría de lo que cubre esta guía es puramente
client-side (`localStorage`/`sessionStorage`).

## 0. Árbol de decisión

```
¿El estado debe sobrevivir a F5 / cerrar y reabrir la pestaña?
├─ NO → useState normal, sin persistencia
└─ SÍ
    ├─ ¿Debe sobrevivir a cerrar la pestaña (no solo a F5)?
    │   ├─ SÍ → localStorage
    │   └─ NO (alcanza con la sesión del tab) → sessionStorage
    ├─ ¿El valor es distinto por organización (o por usuario dentro de
    │  la misma org)? → prefijar la clave con ese id (§2)
    ├─ ¿Debe seguir al usuario entre navegadores/dispositivos (no solo
    │  sobrevivir a F5 en el mismo navegador)? → `useUserPreference` (§4),
    │  siempre híbrido (localStorage + servidor) — nunca solo servidor
    └─ ¿Es un patrón con lógica no trivial (expandir árbol, restaurar
       después de un fetch, etc.)? → considerar un adapter con
       load()/save() en vez de leer/escribir storage directo (§3)
```

## 1. Prefijo y convención de claves

Todas las claves nuevas en `localStorage` usan el prefijo `wisecore:`:

```ts
const STORAGE_KEY = "wisecore:media-view-mode"        // useMediaViewMode.ts:4
"wisecore:workflow-launcher-hidden"                     // useWorkflowLauncherState.ts:3
"wisecore:auto-recovered-at"                            // app-error-boundary.tsx
```

Excepción histórica sin prefijo (no repetir en código nuevo):
`external-functionality-logs-columns` (`external-functionality-logs-tab.tsx:276`).

## 2. Scoping por organización (y opcionalmente por usuario)

Si el valor no debe "pegarse" de una organización a otra (ej. qué carpetas
tiene abiertas, qué documento estaba viendo), la clave lleva el id de la
organización. Precedente (`useAssetNavigation.ts:16-17`):

```ts
const navStorageKey = (orgId: string | null | undefined, name: 'breadcrumb' | 'selectedFile') =>
  `library:${orgId ?? 'none'}:${name}`
```

Puntos clave de ese patrón, replicarlos:
- Fallback explícito (`orgId ?? 'none'`), nunca omitir el segmento.
- Limpiar las claves de la organización anterior al cambiar de org (no dejar
  basura de sesiones previas acumulándose).
- Si el componente que consume el storage se **remonta** al cambiar de
  organización (ej. `<FileTree key={selectedOrganizationId} .../>` en
  `nav-knowledge.tsx`), alcanza con incluir el orgId en la clave — no hace
  falta lógica de limpieza aparte, el remount ya descarta el estado en
  memoria de la org anterior.

Ningún patrón existente persiste hoy por usuario (todo es por organización o
global) — si una feature nueva lo necesita, sumar el id de usuario al mismo
esquema de prefijo (`wisecore:<key>:<orgId>:<userId>`), consistente con
`useAuth().user.id`.

## 3. Patrón: hook simple vs. adapter con `load`/`save`

**Hook simple** (lectura/escritura directa, sin lógica adicional) — patrón de
referencia `useMediaViewMode.ts`, reusado por `useColumnWidths.ts`:

```ts
function readStored(): ViewMode {
  if (typeof window === "undefined") return "grid"
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === "list" || stored === "grid" ? stored : "grid"
  } catch {
    return "grid"
  }
}

export function useMediaViewMode(): [ViewMode, (mode: ViewMode) => void] {
  const [mode, setModeState] = useState<ViewMode>(readStored)
  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, mode) } catch { /* modo privado */ }
  }, [mode])
  return [mode, useCallback((next) => setModeState(next), [])]
}
```

**Adapter `load`/`save`** — cuando la persistencia puede necesitar migrar a
backend más adelante (preferencias por usuario cross-device), o cuando quien
la usa no es un hook de React sino un componente genérico que no debe conocer
`localStorage` directamente.

Precedente real: las carpetas expandidas de la biblioteca de activos
(`HuemulFileTree`, consumido por el sidebar de `/asset` y varios pickers —
receta completa de cómo montarlo en `ia context/arbol-biblioteca-activos-guide.md`,
esta sección cubre el **contrato de persistencia** en sí). Un primer intento
se revirtió porque restaurar el estado persistido implicaba una request a
`GET /folder/{id}/get_content` por cada carpeta guardada (hasta 200). Backend
agregó el parámetro `expanded_folder_ids` a `get_content` (resuelve el
subárbol completo en 1 sola llamada, igual que ya hacía `focus_asset_id` — ver
`respuestas/backend-arbol-expansion-persistente.md`, Pedido 1), y con eso se
reintentó:

- El componente genérico (`huemul-file-tree.tsx`) no conoce `localStorage`:
  solo expone `onExpandedFoldersChange?: (folderIds: string[], context: {
  knownIds: string[] }) => void`, que dispara cada vez que cambia la expansión
  (expandir, colapsar, o una carga que ya viene con expansión resuelta). El
  callback se guarda en un `ref` interno para no forzar al consumidor a
  memoizarlo ni meterlo como dependencia del efecto que lo dispara.
- Guard imprescindible: el efecto que deriva `expandedFolders` desde `nodes`
  corre también en el primer render, cuando `nodes` todavía es `[]` — emitir
  ahí pisaría el storage persistido con un set vacío antes de restaurarlo. Por
  eso solo emite cuando `isInitialized` es `true`.
- El lado `load` no vive en un adapter dentro del componente: se resuelve
  server-side. Cada consumidor (vía `useLibraryTreeExpansion`, ver la guía de
  árboles) lee el set persistido y lo manda como `expandedFolderIds` en la
  carga root de `getLibraryContent` (`src/services/folders.ts`); la respuesta
  ya trae `is_expanded: true` en las carpetas correspondientes, que el árbol
  consume igual que hace con `focus_asset_id`. No hace falta reconstruir el
  árbol del lado del cliente.
- El set persistido se expone como `ref` (`expandedIdsRef`), no `useState`:
  el callback que arma la carga tiene dependencias acotadas y no debe
  recrearse en cada cambio de expansión — solo necesita leer el valor vigente
  en el momento de la carga.
- Ids muertos (carpeta borrada, o sin permiso) se auto-limpian: el backend los
  omite en silencio, así que no aparecen en la próxima respuesta ni en la
  próxima emisión de `onExpandedFoldersChange` — no hace falta código de purga
  aparte.
- **Solo se persiste la expansión visible.** `getExpandedIds` (dentro de
  `huemul-file-tree.tsx`) corta el recorrido en una carpeta colapsada — no
  reporta los `children` que tenga en memoria. Necesario porque el backend
  marca `is_expanded: true` en la carpeta pedida **y todos sus ancestros**
  (Pedido 1 de `respuestas/backend-arbol-expansion-persistente.md`): si se
  persistiera un hijo de una carpeta recién colapsada, la próxima carga
  reabriría esa misma carpeta por la vía del ancestro — el colapso del usuario
  se revertía solo. Dentro de la misma sesión el interior no se pierde (sigue
  en `nodes` con su `isExpanded`), solo deja de mandarse al backend; tras un
  refresh de servidor la carpeta reabre plana.
- **El foco automático (`focus_asset_id`) solo aplica a la primera carga
  root del montaje**, no a cada refresh. `nav-knowledge.tsx` guarda esto en
  `didInitialRootLoadRef`: la primera vez usa `activeAssetIdRef.current`
  (revela la cadena del asset abierto en la URL, como VS Code revela el
  archivo activo); de ahí en más solo un foco explícito
  (`pendingFocusAssetIdRef`, disparado por `revealAssetInTree` o por crear un
  asset nuevo) vuelve a mandar `focus_asset_id`. Sin este corte, cualquier
  refresh reexpandía la cadena del asset activo por encima de lo que el
  usuario hubiera colapsado.

Contrato usado (más simple que el `TreeExpansionStore` con `load`/`save` que
se había considerado — acá el "load" es un parámetro de la carga existente, no
una llamada aparte):

```ts
// huemul-file-tree.tsx (prop, agnóstica de storage)
onExpandedFoldersChange?: (folderIds: string[], context: { knownIds: string[] }) => void

// useTreeExpansionStorage.ts (hook basado en ref, sobre useUserPreference — ver §4)
function useTreeExpansionStorage(orgId: string | null | undefined): {
  expandedIdsRef: React.MutableRefObject<string[]>
  saveExpandedIds: (ids: string[], context?: { knownIds: string[] }) => void
  serverDiffered: boolean   // el servidor trajo un set distinto al del caché local
}
```

**Merge por cobertura, no reemplazo total.** La clave `tree-expanded` es
**compartida** por el sidebar (que pagina el root) y los pickers de activos
(que piden el root sin paginar) — dos árboles vivos que ven porciones
distintas de la biblioteca. Si `saveExpandedIds` reemplazara el set entero con
lo que cada árbol emite, el que escribe último borraría lo que el otro tenía
expandido (y un árbol que carga vacío por un error transitorio borraría todo).
Por eso `onExpandedFoldersChange` manda un segundo argumento, `knownIds`: todo
nodo persistible que ese árbol tiene materializado en memoria ahora mismo
(expandido o no, sin la poda por colapso de `folderIds`). `saveExpandedIds`
reemplaza solo esa porción y conserva el resto:

```ts
const covered = new Set(context.knownIds)
const kept = previous.filter((id) => !covered.has(id) && !ids.includes(id))
setExpandedValue({ expanded: [...ids, ...kept].slice(0, MAX) })
```

Es correcto porque `handleToggle` conserva `node.children` al colapsar (solo
apaga `isExpanded`) — los descendientes de una carpeta recién colapsada siguen
materializados y entran en `knownIds`, así que se eliminan del set igual que
antes exigía el corte de `getExpandedIds`. Una carpeta de otra página del root
paginado, o de otro árbol que no participó de esta emisión, simplemente no
está en `knownIds` y se preserva.

Desde la migración a `useUserPreference` (§4), el `ref` sigue leyendo primero de
`localStorage` (pintado instantáneo, sin esperar ningún request) y se actualiza
solo si el servidor responde con un set distinto — `serverDiffered` es la señal
que una superficie **persistente** (el sidebar; no un picker efímero) puede usar
para pedir un único refresh del root load cuando eso pasa (caso cross-device).
En el caso común (mismo navegador, servidor de acuerdo con el caché) no hay
refresh extra ni parpadeo.

Elegir este patrón (prop de cambio + hook de storage por fuera) en vez de
leer/escribir `localStorage` directo cuando:
- El componente que persiste es genérico/reusable (`HuemulFileTree`,
  `HuemulTable`) y no debe importar `localStorage` para no atarlo a un único
  mecanismo de persistencia.
- Hay una razón concreta para anticipar que esto migra a backend (estado que
  tiene sentido que siga al usuario entre dispositivos) — ver Pedido 2 en
  `respuestas/backend-arbol-expansion-persistente.md`.

Para todo lo demás (una preferencia local de una sola pantalla, sin plan de
mover a backend), el hook simple alcanza — no agregues la indirección de un
adapter sin necesidad.

## 4. Preferencias cross-device — `useUserPreference`

Desde 2026-09 existe un endpoint genérico de preferencias de usuario (Pedido 2
de `respuestas/backend-arbol-expansion-persistente.md`):

```
GET    /api/v1/user/preferences/{key}
PUT    /api/v1/user/preferences/{key}
DELETE /api/v1/user/preferences/{key}
```

Blob JSON opaco por clave (hasta 32 KB), scope usuario × organización vía
`X-Org-Id` (sin permiso RBAC especial — cada usuario solo lee/escribe las
suyas). `GET` sobre una clave nunca guardada responde 404
`PREFERENCE_NOT_FOUND`; `DELETE` es idempotente (204 aunque la clave no
exista). No hay lista cerrada de claves del lado del backend — cualquier
string no vacío (≤200 chars) sirve.

Capa del frontend, en `src/services/user-preferences.ts` +
`src/hooks/useUserPreference.ts` (no reimplementar esto por feature — es
genérico):

- `getUserPreference` devuelve `null` en 404 en vez de relanzar — es la única
  excepción del repo a "los services no interpretan 404", justificada porque
  acá 404 es el estado normal "nunca se guardó", no un error.
- `useUserPreference<T>({ key, organizationId, defaultValue, parse })` es
  **siempre híbrido**: lee `localStorage` de forma síncrona al montar (pintado
  instantáneo, mismo prefijo `wisecore:pref:<orgId>:<key>` de §1/§2), dispara
  el `GET` en paralelo, e hidrata solo si el servidor difiere del caché local
  (expone esa diferencia como `serverDiffered`, para que el consumidor decida
  si necesita reaccionar — ej. re-disparar una carga que ya usó el valor
  viejo). Las escrituras (`setValue`) van a `localStorage` de inmediato y al
  servidor con debounce (evita un `PUT` por cada click en algo que cambia
  seguido, como expandir/colapsar). Un fallo del `PUT` es silencioso: el
  caché local ya tiene el valor, no hay toast ni interrupción.
- **`serverDiffered` es one-shot de la hidratación inicial**, no una
  comparación viva: se calcula una única vez por combinación `(organizationId,
  key)`, en la primera resolución del `GET` (`hydratedTokenRef` marca si ya se
  decidió). Un `setValue` local posterior escribe en el mismo caché de
  TanStack Query que lee `serverDiffered`, así que sin este latch cualquier
  guardado propio (ej. colapsar una carpeta) se volvía a leer como "el
  servidor difiere" y disparaba el `useEffect` que reacciona a eso — un ciclo
  guardar → reaccionar (refrescar el árbol) → reexpandir → guardar. El hook
  también protege el refetch en background (`staleTime`) contra pisar una
  escritura debounced todavía sin confirmar: mientras haya un `setValue`
  pendiente de `flushPendingWrite`, `queryFn` devuelve ese valor en vez del que
  trajo el servidor.
- **Un `GET` en 404 (`null`) conserva el valor que ya había en caché — nunca
  lo pisa con `defaultValue`.** Un navegador con la preferencia en
  `localStorage` pero sin nada guardado todavía en el servidor no debe perder
  ese valor al primer fetch. El fallback dentro de `queryFn` es
  `parsed ?? queryClient.getQueryData(queryKey) ?? defaultValue` — `defaultValue`
  es el último recurso, no el resultado normal de un 404.
- **El valor reactivo vive en el caché de TanStack Query, no en un `useState`
  local.** Dos instancias del hook con la misma `key`/`organizationId`
  comparten la misma entrada de caché (misma `queryKey`): un `setValue` en una
  actualiza a la otra sin pasar por props ni contexto — necesario en cuanto
  una preferencia se edita desde más de un lugar (ej. `media-view-mode` desde
  el sheet de Preferencias y desde el toggle de cada galería).
- `remove()` borra la preferencia (local + `DELETE` al servidor) y vuelve a
  `defaultValue` — lo usa, por ejemplo, el botón "olvidar carpetas guardadas"
  de `useTreeExpansionStorage`.
- **Nunca** implementar una preferencia cross-device solo contra el servidor,
  sin `localStorage` de por medio — el primer render se quedaría sin valor
  hasta que responda el `GET`.
- El endpoint es usuario × **organización** (`X-Org-Id`): una preferencia
  puede diferir entre organizaciones del mismo usuario. Es el comportamiento
  esperado (así lo migró `useLanguagePreference`, no un caso especial), no
  algo a corregir con una clave sin scope.

Antes de usar esto, confirmar que la preferencia realmente necesita seguir al
usuario entre navegadores/dispositivos. Si es una preferencia de una sola
pantalla sin ese requisito, el hook simple (§3) sigue siendo el default — no
migrar preferencias existentes "porque se puede".

**Superficie de usuario:** el sheet de Preferencias
(`src/components/preferences/preferences-sheet.tsx`, abierto desde el menú
del avatar — es configuración personal, no de organización, ver
`ia context/header-menu-guide.md`) es el lugar donde el usuario edita estas
claves. Cada control escribe al instante, sin footer de guardado (el árbol de
decisión de `ia context/sheet-footer-batch-save-guide.md` descarta el patrón
batch acá). Al agregar una clave nueva a la tabla de abajo, sumar también su
control ahí en vez de dejarla sin UI.

**Inventario de claves** (a 2026-09):

| Clave | Estado |
|---|---|
| `tree-expanded` | Migrada — `useTreeExpansionStorage.ts`, ver contrato en §3. **Compartida**: sidebar de `/asset` y todos los pickers de la biblioteca de activos (ver `ia context/arbol-biblioteca-activos-guide.md`), no solo el sidebar |
| `tree-remember-expanded` | Migrada — switch del sheet de Preferencias; `enabled: false` vacía `expandedIdsRef` sin borrar el set guardado. Gobierna también `external-systems-tree-expanded` y el trail de menciones (una sola preferencia de usuario para los tres mecanismos) |
| `external-systems-tree-expanded` | Migrada — `useExternalSystemsExpansionStorage` en `useTreeExpansionStorage.ts`. Clave propia (no comparte `tree-expanded`), restauración client-side acotada (sin `expanded_folder_ids` server-side para esta jerarquía) — ver `ia context/arbol-biblioteca-activos-guide.md` §5 |
| `mention-trail` | **No** vía `useUserPreference` — `localStorage` simple, `wisecore:mention-trail:<orgId>` (`useMentionTrailStorage.ts`). El popover `@` del editor no es un árbol expandible sino un navegador de un nivel con breadcrumb; lo persistido es el trail de navegación, no un set de expandidas |
| `media-view-mode` | Migrada — `useMediaViewMode.ts`, misma firma `[mode, setMode]` que antes |
| `language` | Migrada — `useLanguagePreference.ts`, montado en `app-layout.tsx` (no solo en el sheet) para aplicar sin que el usuario lo abra. Requirió agregar `'localStorage'` al **inicio** de `detection.order` en `src/i18n/index.ts` — antes solo estaba en `caches`, así que `navigator` le ganaba siempre al idioma elegido en el próximo arranque |
| `table-column-widths` | Pendiente, sigue solo en `localStorage` |

**Candidata futura, sin persistencia hoy:** las carpetas expandidas de la
tabla agrupada de tipos de documento (`assets-types.tsx`,
`expandedFolderIds: Set<string>` local). Es otra jerarquía y otra entidad — si
se persiste, clave propia, nunca `tree-expanded`.

## 5. `try/catch` obligatorio

Todo acceso a `localStorage`/`sessionStorage` va envuelto en `try/catch` —
modo privado del navegador, cuota excedida, o storage deshabilitado por
política tiran una excepción sincrónica en `getItem`/`setItem`. Un fallo de
storage nunca debe romper el render ni la interacción; como mucho, la
preferencia no persiste esa vez. Precedente: `useMediaViewMode.ts:19-24`.

## 6. Tamaño acotado

Si lo que se persiste es una colección que puede crecer sin límite (ids de
carpetas expandidas, filtros recientes), poner un tope y descartar lo más
viejo — no dejar que la clave crezca indefinidamente.

## Errores comunes

- ❌ Clave sin prefijo `wisecore:` en código nuevo (excepción histórica en
  `external-functionality-logs-tab.tsx`, no repetir).
- ❌ Persistir un valor sensible a organización sin incluir el orgId en la
  clave — el dato de una org se filtra a la siguiente al cambiar de contexto.
- ❌ Leer/escribir `localStorage`/`sessionStorage` sin `try/catch`.
- ❌ Migrar una preferencia a `useUserPreference` (§4) sin necesidad real de
  cross-device — el hook simple (§3) sigue siendo el default.
- ❌ Usar `useUserPreference` sin caché local (solo servidor) — deja el primer
  render sin valor hasta que responda el `GET`.
- ❌ Meter un adapter `load`/`save` para una preferencia trivial de una sola
  pantalla sin ninguna razón para migrar a backend — el hook simple (§3)
  alcanza.
- ❌ Dejar crecer sin tope una colección persistida (ver §6).
- ❌ Confundir esto con caché de React Query — esto es intención/estado de
  interacción del usuario, no datos del backend que se puedan revalidar.
- ❌ Cablear `onExpandedFoldersChange` sin restaurar en la carga root (leer
  `expandedIdsRef` y mandarlo como `expanded_folder_ids`) — la primera
  emisión persiste lo que el usuario expande pero nunca restaura nada.
- ❌ Reemplazar el set entero ignorando `context.knownIds` cuando el árbol
  muestra un subconjunto de la biblioteca (root paginado, otro picker abierto
  en simultáneo) — pisa lo que otra superficie o página tenía expandido (ver
  el merge por cobertura en §3).
- ❌ Persistir ids de nodos que el árbol trata como expandibles pero no son
  carpetas reales (ej. un documento en modo "versión" del picker) —
  filtrar con `isNodePersistable`.
- ❌ Meter otra jerarquía (sistemas externos, carpetas de tipos de documento)
  en la clave `tree-expanded` de la biblioteca de activos — clave propia.

## Checklist final

```
[ ] Storage correcto: localStorage (sobrevive cerrar pestaña) vs
    sessionStorage (solo dentro de la sesión del tab)
[ ] Clave con prefijo wisecore: (o el esquema library:<orgId>:<name> si aplica)
[ ] Scoping por organización si el valor no debe cruzar de una org a otra
[ ] try/catch en toda lectura y escritura
[ ] Tope de tamaño si es una colección que puede crecer
[ ] Adapter load()/save() solo si hay razón concreta de migrar a backend o
    el componente es genérico/reusable — si no, hook simple
[ ] Si debe seguir al usuario entre dispositivos, useUserPreference (§4),
    siempre con caché local — nunca solo servidor
[ ] Árbol de la biblioteca de activos: restauración en la carga root
    (expandedIdsRef → expanded_folder_ids), merge por cobertura
    (context.knownIds), isNodePersistable si hay nodos expandibles que no
    son carpetas — ver ia context/arbol-biblioteca-activos-guide.md
```
