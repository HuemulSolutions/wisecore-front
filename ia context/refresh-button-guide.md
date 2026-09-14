# Wisecore — Guía de botón de refresh

Toda superficie que muestre datos provenientes de un GET al backend debe ofrecer una forma de recargarlos manualmente. Read `huemul-page-layout-guide.md` and `filter-panel-guide.md` for related layout conventions.

## 0. Árbol de decisión

```
¿La superficie muestra datos que vienen de un GET al backend?
├─ NO → sin refresh
└─ SÍ
    ├─ ¿Es un combobox / select / lookup / catálogo dentro de un
    │  formulario o sheet?            → EXENTO (ver §1)
    ├─ ¿Es una página completa?       → PageHeader showRefresh + onRefresh (§2)
    ├─ ¿Es un tab o panel con su
    │  propia query?                  → toolbar strip propio (§3)
    ├─ ¿Es un sheet / dialog / panel lateral
    │  que lista datos del backend?   → strip propio (§3) — no lo exime abrirse
    │                                    desde un menú o quedar "secundario"
    └─ ¿Es una sección embebida sin
       header propio?                 → strip alineado a la derecha (§3)
```

## 1. Regla y exenciones

**Regla:** cualquier contenedor visual (página, panel, tab, sección) que consuma datos del backend debe exponer un botón de refresh que recargue todas las queries de esa superficie.

**Exentos** (no agregar botón):
- Combobox / select con búsqueda server-side (`HuemulAsyncComboboxFilterDef`, campos `async-combobox`).
- Catálogos y lookups dentro de formularios/sheets (ej. selects de tipo de activo, dropdowns de opciones).
- Una superficie cuyos datos ya se recargan cuando el contenedor padre hace refresh (no dupliques el botón).

Granularidad: **un botón por contenedor**, no uno por endpoint. Si el panel dispara 2 o 3 queries, un solo `onRefresh` las agrupa.

## 2. Página completa: `PageHeader`

Patrón dominante (`users.tsx`, `roles.tsx`, `assets-types.tsx`, `custom-fields.tsx`, `canvas.tsx`, `diagrams.tsx`, `external-systems.tsx`, `models.tsx`, `organizations.tsx`, `auth-types.tsx`, `assets.tsx`, `templates.tsx`). Props reales (`src/types/huemul/page-header.ts:39-44`):

| Prop | Tipo | Default | Nota |
|---|---|---|---|
| `showRefresh` | `boolean` | `true` | Solo `false` con justificación explícita (precedente: `search.tsx:348`, `advanced.tsx:328`) |
| `onRefresh` | `() => void` | — | El botón no se renderiza si falta (`huemul-page-header.tsx:105`) |
| `isLoading` | `boolean` | — | Pasar `isFetching` de React Query, no el `isLoading` de la carga inicial |

No construyas el botón a mano: usa el wrapper `*-page-header.tsx` de la página (patrón `users-page-header.tsx:31-32`) que reexpone `onRefresh`/`isLoading` hacia `PageHeader`.

```tsx
// page-header.tsx del módulo
export function FooPageHeader({ onRefresh, isLoading, ...rest }: FooPageHeaderProps) {
  return (
    <PageHeader
      icon={FooIcon}
      title={t('foo:title')}
      onRefresh={onRefresh}
      isLoading={isLoading}
      {...rest}
    />
  )
}
```

Varias queries en la misma página:

```tsx
const handleRefresh = () => {
  void refetchList()
  void refetchStats()
}
```

## 3. Tab / panel / sección / sheet / dialog: toolbar strip

Cuando la superficie no tiene un `PageHeader` propio (un tab dentro de un detalle, una columna del layout, **un sheet o dialog que lista datos del backend**), agrega un strip icon-only con tooltip. Aplica igual si la superficie se abre desde un menú, un botón secundario o una fila de tabla — que sea "secundaria" en la navegación no la exime si hace su propio GET. Dos variantes reales, preferir la segunda:

```tsx
// ✅ Preferida — HuemulButton ya maneja loading + tooltip
<HuemulButton
  variant="ghost"
  size="icon"
  className="h-6 w-6"
  icon={RefreshCw}
  tooltip={t("common:refresh")}
  loading={isFetching}
  onClick={() => refetch()}
/>
```

```tsx
// Alternativa válida cuando ya se usa el Button base del tab (ej. tabs de external-systems)
<Button
  variant="ghost"
  size="icon"
  className="h-7 w-7"
  onClick={() => refetch()}
  disabled={isFetching}
  title={t("common:refresh")}
>
  <RefreshCw className={isFetching ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
</Button>
```

## 4. Estado de carga

`onRefresh={refetch}` + `isLoading={isFetching}`. No reemplaces toda la superficie por un loader durante un refresh: usa `useTableLoadingState` (`src/hooks/useTableLoadingState.ts`), que devuelve `{ showPageLoader, isTableLoading, isTableFetching }` — el loader de página completa solo aplica al primer mount. `HuemulTable` ya pinta su propia barra de refetch a partir de `isFetching` (`huemul-table.tsx:206-214`); no dupliques ese indicador.

**Variante aceptada — `handleRefresh` que envuelve `invalidateQueries`:** cuando el refresh dispara `queryClient.invalidateQueries(...)` en vez de usar directamente el `refetch` de la query, es común envolverlo en un `isRefreshing` local:

```tsx
const [isRefreshing, setIsRefreshing] = useState(false)
const handleRefresh = async () => {
  setIsRefreshing(true)
  try {
    await queryClient.invalidateQueries({ queryKey: fooQueryKeys.listBase() })
  } finally {
    setIsRefreshing(false)
  }
}
// ...
isLoading={isRefreshing || isFetching}
```

El `|| isFetching` es obligatorio: `invalidateQueries` resuelve en cuanto la invalidación se dispara, no cuando el refetch en curso termina. Sin el `|| isFetching` el spinner se corta mientras la tabla sigue cargando (bug real encontrado en varias páginas — `isRefreshing` solo, sin `isFetching`, no basta).

Si el badge de conteo del header también depende de `isLoading`, no lo alimentes con este mismo flag: ese `isLoading` representa el *refresh*, no la carga inicial, y el conteo real ya está disponible aunque el refresh esté en curso. Los headers con `if (showPageLoader) return <Skeleton />` antes de montarse nunca reciben `isLoading=true` en el primer render, así que el badge puede mostrar el conteo directamente sin ternario `isLoading ? "..." : count`.

## 5. Sin toast

```tsx
// ❌ No: el spinner del botón ya es el feedback
const handleRefresh = async () => {
  await refetch()
  toast.success(t('common:dataRefreshed'))
}

// ✅ Sí
onRefresh={refetch}
isLoading={isFetching}
```

Auditoría de 2026-08: se encontraron 13 sitios con este anti-patrón (no solo `media.tsx`), todos corregidos — quedó como referencia el patrón `try/finally` sin toast de [roles.tsx](../src/pages/roles.tsx).

## 6. Refresh vs `invalidateQueries`

Son cosas distintas, no se reemplazan entre sí:
- **Refresh manual** (este guide): `refetch()` de las queries que alimentan la superficie visible, disparado por el usuario.
- **Invalidación post-mutación**: `queryClient.invalidateQueries({ queryKey: ...QueryKeys.listBase() })` después de un create/update/delete. Sigue las reglas de `new-endpoints-guide.md`.

## 7. i18n

Reusar claves existentes de `common.ts`: `common:refresh` (`common.ts:2`) para el label/tooltip del botón, `common:retry` para estados de error. Solo crea una clave en el namespace del módulo si el texto necesita ser específico (precedente: `external-parameters.ts:3` → `"Refresh parameters"`). No agregues `dataRefreshed`/`refreshFailed` nuevas — ya existen en `common.ts` y, por la regla de §5, no se usan.

## Errores comunes

- ❌ Construir el botón de refresh a mano cuando `PageHeader` ya lo provee.
- ❌ Pasar `isLoading` (carga inicial) en vez de `isFetching` al prop `isLoading` del botón — el spinner queda pegado o nunca aparece en refresh.
- ❌ `showRefresh={false}` sin dejar constancia de por qué esa página no lo necesita.
- ❌ Un botón de refresh por cada endpoint dentro del mismo panel — agrupar en un solo `onRefresh`.
- ❌ Mostrar toast de éxito/error al refrescar.
- ❌ Agregar un prop `refresh`/`onRefresh` a `HuemulPageLayout` — el layout se mantiene genérico (mismo veto que a un prop `filterPanel`, ver `filter-panel-guide.md`); el refresh vive en `header` o en el header de la columna.
- ❌ Agregar refresh a un combobox o catálogo dentro de un formulario/sheet — está exento.
- ❌ Sheet, dialog o panel lateral que lista datos del backend sin refresh — modo de falla dominante encontrado en auditoría (21 superficies): se piensa el guide como "solo páginas y tabs" y se olvida todo lo que vive dentro de un sheet.
- ❌ Alimentar el badge de conteo del header con el mismo flag `isLoading` que usa el botón de refresh — el conteo parpadea a `"..."` en cada refresh aunque el dato ya esté disponible (ver §4).
- ❌ Gatear el render completo en el `isLoading` crudo de la query cuando hay paginación (u otro filtro) en la query key — cada cambio de página genera una query key nueva y vuelve a `isLoading=true`, dejando la superficie en blanco. Usar `useTableLoadingState` en su lugar.
- ❌ `isRefreshing` local sin `|| isFetching` en el `isLoading` del botón cuando el handler usa `invalidateQueries` — el spinner corta antes de que el refetch termine (ver §4).

## Checklist final

```
[ ] Identifiqué el contenedor visual (página / tab / panel / sección) y sus queries
[ ] No es un combobox/catálogo exento
[ ] Página completa: showRefresh (default true) + onRefresh + isLoading={isFetching} en PageHeader
[ ] Tab/panel: strip HuemulButton icon-only con tooltip={t("common:refresh")} y loading={isFetching}
[ ] Varias queries en la superficie: un solo handleRefresh que las agrupa
[ ] Sin toast de éxito/error al refrescar
[ ] i18n: reusa common:refresh / common:retry salvo texto específico del módulo
[ ] npx tsc --noEmit y eslint pasan
```
