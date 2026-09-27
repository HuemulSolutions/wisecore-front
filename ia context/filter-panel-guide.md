# Wisecore — Guide for the Global Filter Panel System

Use this when a page needs a **faceted-style filter UI**: a "Filtros" button with an applied-count badge, a collapsible left **column** panel, and removable **chips** above the content. Filters apply **instantly** (no "Apply" button).

This system replaces the legacy horizontal `HuemulFilters` bar for list pages. It is already in use in `src/pages/home.tsx` (list page) and `src/pages/search.tsx` (search page with URL persistence + "nothing until search" gating). `HuemulFilters` still exists for `media.tsx` — do not delete it, but prefer this system for new/migrated pages.

---

## 0. When this applies

```
Does the page show a list/table that the user filters by several fields?
  └─ YES → use this system (button + panel column + chips)
  └─ NO  → a single inline control is enough; skip this

Do the filter options need per-option counters (e.g. "Contrato 8")?
  └─ The backend does NOT expose facet counts. This system shows NO counters.
     If counts are required, that is a separate backend dependency.
```

---

## 1. The pieces

| Piece | File | Role |
|---|---|---|
| `useHuemulFilters(config)` | `src/hooks/useHuemulFilters.ts` | State hook: `values`, `setValue`, `clearValue`, `clearAll`, `activeCount`, `chips`, `open`, `setOpen`, `setSelectedLabel` |
| `HuemulFilterButton` | `src/huemul/components/huemul-filter-button.tsx` | Toolbar button + count badge; toggles the panel |
| `HuemulFilterChips` | `src/huemul/components/huemul-filter-chips.tsx` | Removable chips + "Limpiar todo"; renders nothing when empty |
| `HuemulFilterPanel` | `src/huemul/components/huemul-filter-panel.tsx` | The side-column body: header + grouped `HuemulField` controls (no client-side search) |
| `HuemulFilterInline` | `src/huemul/components/huemul-filter-inline.tsx` | Renders `toolbar: true` defs as compact controls next to the button |
| Types | `src/types/huemul/filters.ts` | `HuemulFilterDef` union, `HuemulFilterValues`, `HuemulDateRangeValue`, component props |
| Date chip format | `src/lib/format-date-range.ts` | `formatDateRangeValue()` for date chip labels |

`HuemulPageLayout` is **not** modified — the panel is passed as a normal column with `show={open}`.

---

## 2. Rules

- **Declare filters once** as a `HuemulFilterDef[]` (memoized). Each def has a `key` (also the values-record key + chip key), `label`, optional `group`, and a `type`-specific shape.
- **Filter types**: `select` (with `allValue` sentinel for "all"/inactive), `async-combobox` (reuses `fetchOptions`), `date-range` (single `HuemulDateRangeValue` object — never three flat keys), `boolean` (switch), `text`.
- **No client-side search**: the panel has no "search filters" box. There is no client-side filtering of data or of the filter list — everything is backend-driven.
- **Toolbar filters**: mark a def with `toolbar: true` to render its control inline next to the button (via `HuemulFilterInline`) instead of in the panel. Toolbar filters are **excluded from chips and the count badge** (their control is always visible). A `text` toolbar filter commits **on Enter** (local draft); `select`/`async-combobox` apply instantly.
- **Instant apply**: `values` drive the query directly. TanStack Query `placeholderData: (prev) => prev` prevents flicker. Wrap `setValue`/`clearValue`/`clearAll` to also `setPage(1)`.
- **`allValue`**: a select whose value equals its `allValue` is treated as inactive (no chip, no count). Used for "Todos los estados" (`__all__`) and the default `searchType: 'semantic'`.
- **Inverted boolean** (on by default, "off" is the filter — e.g. `filter_with_llm`): set `defaultValue: true` + `activeWhen: false` on the boolean def. It's inactive while ON, becomes an active chip (using `chipLabel`) when OFF, and `clearAll` resets it back to ON.
- **Conditional filter** (`hidden: true`): the control is not rendered (panel or inline) and is excluded from chips/count, but its value is still tracked. Drive `hidden` from another value to show/hide a filter (e.g. the LLM toggle only for semantic search). Keep the def **always present** in the array and toggle only `hidden` — this preserves its default/value across `clearAll`.
- **Search-page gating** ("nothing until search"): gate the query with `enabled` and conditionally render results. Compute `hasActiveSearch` from `values`/`chips` (e.g. `!!query || chips.some(c => c.key !== 'someModeToggle')`) and only render results when true. See `src/pages/search.tsx`.
- **URL persistence** (optional, see search.tsx): seed the hook with `initialValues` parsed from the URL on mount; persist with a `useEffect` on `values` that calls `setSearchParams(build(values), { replace: true })`. Derive any value that conditional defs depend on (e.g. searchType for the LLM `hidden` flag) from the URL/external state to avoid a `filterDefs → hook → values → filterDefs` cycle.
- **async-combobox chip labels**: the value stores an **id**; the display name is captured via `onSelectedLabelChange` → `setSelectedLabel(key, label)`. Chips fall back to the raw id only if restored from URL without ever opening the control (Home does not restore from URL).
- **Param mapping stays in the page** (param names are app-specific) — map `values` → the query hook options manually. Do not push API param names into the generic hook.
- **i18n**: panel/button/chip strings live in the `huemul-filters` namespace (`title`, `clearAll`, `noFilters`, `groups.*`). Field/option labels are passed in from the page's own namespace.
- **Panel groups are an accordion**: `HuemulFilterPanel` renders each non-empty `group` as an `AccordionItem` (`@/components/ui/accordion`, `type="multiple"` — groups expand/collapse independently, not exclusive). The group header stays visible when collapsed and shows a small count badge (via the exported `isActive` from `useHuemulFilters.ts`) so users can see which collapsed groups still hold an active filter. Default-open state is computed once at mount: groups with an active filter start open, otherwise only the first group opens; after that the user controls it freely (no auto re-opening on later value changes). Defs with no `group` still render flat, outside the accordion.

---

## 3. Example (from `src/pages/home.tsx`)

```tsx
const filterDefs = useMemo<HuemulFilterDef[]>(() => [
  { key: 'searchType', type: 'select', group: tFilters('groups.search'), toolbar: true,
    label: t('filters.searchType'), allValue: 'semantic', options: [...] },
  { key: 'query', type: 'text', group: tFilters('groups.search'), toolbar: true,
    label: t('filters.search'), placeholder: t('filters.searchPlaceholder') },
  { key: 'lifecycleState', type: 'select', group: tFilters('groups.classification'),
    label: t('filters.lifecycleState'), allValue: '__all__', options: [...] },
  { key: 'documentTypeId', type: 'async-combobox', group: tFilters('groups.classification'),
    label: t('filters.documentType'), fetchOptions: fetchDocumentTypes, pageSize: 50, searchOnEnter: true },
  { key: 'expirationDate', type: 'date-range', group: tFilters('groups.dates'),
    label: t('filters.expirationDate') },
  { key: 'hasUnresolvedComments', type: 'boolean', group: tFilters('groups.other'),
    label: t('filters.unresolvedComments') },
], [t, tAssets, tFilters, fetchDocumentTypes, fetchUsers]);

const { values, open: filtersOpen, setOpen: setFiltersOpen, setValue, clearValue,
        clearAll, chips, activeCount, setSelectedLabel } =
  useHuemulFilters({ filters: filterDefs, defaultOpen: false, initialValues: { searchType: 'semantic' } });

const handleFilterChange = useCallback((k, v) => { setValue(k, v); setPage(1); }, [setValue]);
const handleChipRemove   = useCallback((k)    => { clearValue(k); setPage(1); }, [clearValue]);
const handleClearAll     = useCallback(()     => { clearAll();    setPage(1); }, [clearAll]);

// header toolbar — button + inline (toolbar) filters
<HuemulFilterButton count={activeCount} open={filtersOpen} onToggle={() => setFiltersOpen(!filtersOpen)} />
<HuemulFilterInline filters={filterDefs} values={values} onChange={handleFilterChange} onSelectedLabel={setSelectedLabel} />

// layout: panel as the first (collapsible) column, content as the second
<HuemulPageLayout header={header} withHandle columns={[
  { content: <HuemulFilterPanel filters={filterDefs} values={values}
      onChange={handleFilterChange} onSelectedLabel={setSelectedLabel}
      onClose={() => setFiltersOpen(false)} />,
    show: filtersOpen, defaultSize: 22, minSize: 16, maxSize: 35, collapsible: true },
  { content: (
      <div className="flex flex-col h-full overflow-hidden p-4 md:p-6 gap-4">
        <HuemulFilterChips chips={chips} onRemove={handleChipRemove} onClearAll={handleClearAll} />
        {/* results count + HuemulTable */}
      </div>
    ) },
]} />
```

Date-range → query mapping (page-side):

```tsx
const expiration = (values.expirationDate as HuemulDateRangeValue | undefined) ?? {};
// expiration_date: expiration.date || undefined, expiration_date_from: expiration.from || undefined, ...
```

---

## 4. Common errors

- ❌ Storing a date filter as three flat keys (`fooDate`, `fooFrom`, `fooTo`). Use **one** `HuemulDateRangeValue` object per `key`.
- ❌ Forgetting `setPage(1)` on filter change → results show a stale page.
- ❌ Mapping a select's `allValue` straight into the query. Treat `value === allValue` as "no filter" (→ `undefined`).
- ❌ Expecting async-combobox chips to show the name without wiring `onSelectedLabel`/`setSelectedLabel`.
- ❌ Adding a `filterPanel` prop to `HuemulPageLayout`. The panel is a normal column with `show={open}` — keep the layout generic.
- ❌ Hardcoding panel/chip/button strings. Use the `huemul-filters` namespace.
- ❌ Modeling an on-by-default toggle as a plain boolean. Use `defaultValue: true` + `activeWhen: false`, or it counts/chips backwards.
- ❌ Removing a conditional def from the array instead of toggling `hidden` — that drops its key from state and loses its default after `clearAll`.
- ❌ Building `filterDefs` from `values.searchType` while the hook is fed by `filterDefs` (cycle). Derive the conditioning value from the URL/external state.

---

## 5. Final checklist

```
[ ] filterDefs is memoized; each def has a stable unique key
[ ] selects that can be "all" set an allValue; default-inactive values use allValue/initialValues
[ ] date filters use a single HuemulDateRangeValue per key
[ ] setValue / clearValue / clearAll are wrapped to reset pagination
[ ] async-combobox defs wire onSelectedLabel for correct chip names
[ ] panel passed as a HuemulPageLayout column with show={open}, collapsible, sizing
[ ] toolbar-flagged defs rendered via HuemulFilterInline next to the button
[ ] HuemulFilterButton in the toolbar, HuemulFilterChips above the content
[ ] inverted toggles use defaultValue/activeWhen; conditional filters use hidden (kept in the array)
[ ] search pages gate results with enabled + conditional render ("nothing until search")
[ ] new group/label strings added to the huemul-filters (or page) namespace
[ ] no extra work needed for the accordion — grouped defs get it automatically from HuemulFilterPanel
[ ] tsc -b and eslint pass
```
