# Wisecore — Guide for Refactoring Pages to Use HuemulPageLayout

This document explains how to refactor an existing page to use `HuemulPageLayout`. Follow it when migrating pages that currently use raw `<div>` wrappers, custom flexbox layouts, or ad-hoc column arrangements.

Read `new-module-guide.md` and `refactor-module-guide.md` for general conventions. This guide focuses specifically on the layout component.

---

## 0. Decision tree — which layout pattern does this page need?

```
Does the page have a single content area (table, form, cards)?
  └─ YES → Single column with optional header  (Pattern A)

Does the page have a sidebar/tree + detail area?
  └─ YES → 2-column master-detail  (Pattern B)

Does the page have a sidebar + main + context/preview panel?
  └─ YES → 3-column layout  (Pattern C)

Does the page need a top/bottom split (e.g. editor + output)?
  └─ YES → Vertical direction layout  (Pattern D)

Does the page have a sidebar nav + nested inner layout?
  └─ YES → Nested HuemulPageLayout  (Pattern E)
```

---

## 1. Import

```tsx
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"

// Only if you need programmatic collapse/expand:
import type { ImperativePanelHandle } from "@/huemul/components/huemul-page-layout"
```

---

## 2. Component API quick reference

### Top-level props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `header` | `ReactNode` | — | Full-width content above columns |
| `showHeader` | `boolean` | `true` | Toggle header visibility |
| `columns` | `HuemulPageLayoutColumn[]` | — | 1–3 column definitions |
| `className` | `string` | — | Class on outer flex-col wrapper |
| `headerClassName` | `string` | — | Class on the header strip |
| `bodyClassName` | `string` | — | Class on the columns area |
| `withHandle` | `boolean` | `false` | Show grip icon on resize handles |
| `direction` | `"horizontal" \| "vertical"` | `"horizontal"` | Panel stacking direction |

### Column props (`HuemulPageLayoutColumn`)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `ReactNode` | — | **Required.** What to render |
| `defaultSize` | `number` | auto | Initial size as percentage (0–100) |
| `minSize` | `number` | — | Minimum resize constraint (%) |
| `maxSize` | `number` | — | Maximum resize constraint (%) |
| `show` | `boolean` | `true` | Conditionally show/hide the column |
| `collapsible` | `boolean` | — | Allow dragging to fully hide |
| `collapsedSize` | `number` | `0` | Size when collapsed (%) |
| `onCollapse` | `() => void` | — | Callback when panel collapses |
| `onExpand` | `() => void` | — | Callback when panel expands |
| `panelRef` | `RefObject<ImperativePanelHandle>` | — | For programmatic collapse/expand |
| `resizable` | `boolean` | `true` | Whether handle is draggable |
| `className` | `string` | — | Class on the panel element |

> **Size normalization:** columns without `defaultSize` share remaining space equally. If all sizes don't sum to 100, they're scaled proportionally.

---

## 3. Layout patterns with examples

### Pattern A — Single column with header

Use for pages with a table, card grid, or single content area.

**Before (raw divs):**
```tsx
return (
  <div className="bg-background p-4 md:p-6">
    <div className="mx-auto">
      <PageHeader ... />
      <DataTable ... />
      <Dialogs ... />
    </div>
  </div>
)
```

**After:**
```tsx
return (
  <>
    <HuemulPageLayout
      header={<PageHeader ... />}
      headerClassName="p-4 md:p-6 pb-0 md:pb-0"
      columns={[
        {
          content: isError ? (
            <ErrorState onRetry={handleRefresh} />
          ) : filteredItems.length === 0 ? (
            <EmptyState />
          ) : (
            <DataTable ... />
          ),
          className: "p-4 md:p-6 pt-0 md:pt-0",
        },
      ]}
    />
    {/* Dialogs always outside the layout */}
    <Dialogs ... />
  </>
)
```

**Key rules:**
- Header goes in the `header` prop, not inside a column.
- Padding is split: header gets bottom padding removed, column gets top padding removed, so they share spacing naturally.
- Dialogs and sheets live **outside** `HuemulPageLayout` to avoid portal/z-index issues.
- With a single column, the component renders a plain `<div>` (no resize overhead).

---

### Pattern B — 2-column master-detail

Use for pages with a navigation tree/list on the left and a detail panel on the right.

```tsx
<HuemulPageLayout
  columns={[
    {
      content: (
        <div className="flex flex-col gap-0 px-4 py-3">
          <TreeHeader />
          <FileTree ... />
        </div>
      ),
      defaultSize: 20,
    },
    {
      content: renderDetail(),
      defaultSize: 80,
      minSize: 50,
    },
  ]}
/>
```

**Key rules:**
- Left sidebar typically gets `defaultSize: 20` (15–25 range).
- Main content gets the remainder.
- Set `minSize` on the main panel to prevent it from becoming too narrow.
- No header prop needed — the tree/list has its own inline header.

---

### Pattern C — 3-column layout

Use for pages with sidebar + main + context panel.

```tsx
<HuemulPageLayout
  withHandle
  header={<PageHeader ... />}
  columns={[
    { content: <Sidebar />, defaultSize: 20, minSize: 12 },
    { content: <MainContent /> },
    { content: <ContextPanel />, defaultSize: 25, minSize: 15 },
  ]}
/>
```

**Key rules:**
- Use `withHandle` so users see a grip icon on resize handles.
- The middle column auto-fills the remaining space.

---

### Pattern D — Vertical split

Use for editor + output, tabs + response, or any top/bottom arrangement.

```tsx
<HuemulPageLayout
  direction="vertical"
  className="flex-1 min-h-0"
  columns={[
    {
      content: <TabContent />,
      defaultSize: 55,
      minSize: 15,
    },
    {
      content: <ResponsePanel />,
      defaultSize: 45,
      minSize: 15,
      className: "flex flex-col overflow-hidden",
    },
  ]}
/>
```

**Key rules:**
- Always add `className="flex-1 min-h-0"` to the layout so it fills available vertical space.
- Both panels need `minSize` to remain usable.

---

### Pattern E — Nested layouts (sidebar nav + inner content)

Use for pages with a fixed sidebar navigation and a dynamic content area that itself has columns.

```tsx
<HuemulPageLayout
  columns={[
    {
      content: <SidebarNav />,
      defaultSize: 15,
      resizable: false,
    },
    {
      content: (
        <HuemulPageLayout
          header={pageHeader}
          showHeader={!isHome}
          columns={[
            { content: <FormContent />, defaultSize: 35, resizable: false },
            { content: <SelectionPanel />, defaultSize: 65, show: needsSelection, resizable: false },
          ]}
        />
      ),
      defaultSize: 85,
      resizable: false,
    },
  ]}
/>
```

**Key rules:**
- Set `resizable: false` on all columns when the sidebar is a fixed-width nav.
- Inner `HuemulPageLayout` is independent — it manages its own header and columns.
- Use `show` on inner columns to dynamically toggle sections.

---

## 4. Conditional column visibility

Use the `show` prop to dynamically add or remove columns based on state:

```tsx
columns={[
  { content: <List />, defaultSize: 60 },
  { content: <Detail item={selected} />, defaultSize: 40, show: selected != null },
]}
```

When `show` is `false`, the column is fully removed from the layout and remaining columns are resized to fill the space. **Do not** use CSS `display: none` — use `show` instead.

---

## 5. Collapsible panels

### Via drag (user-controlled)

```tsx
{
  content: <Sidebar />,
  defaultSize: 25,
  minSize: 15,
  collapsible: true,
}
```

### Programmatic collapse/expand

```tsx
const panelRef = useRef<ImperativePanelHandle>(null)
const [isCollapsed, setIsCollapsed] = useState(false)

// In columns:
{
  content: <Sidebar />,
  defaultSize: 25,
  collapsible: true,
  panelRef: panelRef,
  onCollapse: () => setIsCollapsed(true),
  onExpand: () => setIsCollapsed(false),
}

// Toggle from a button:
<Button onClick={() => {
  if (isCollapsed) panelRef.current?.expand()
  else panelRef.current?.collapse()
}}>
  Toggle sidebar
</Button>
```

---

## 6. Step-by-step refactoring checklist

```
[ ] 1. Identify the layout pattern (A–E) from the decision tree.
[ ] 2. Import HuemulPageLayout.
[ ] 3. Remove the outer wrapper divs (<div className="bg-background p-4 ...">).
[ ] 4. Extract the header section into the `header` prop.
[ ] 5. Move content into `columns[].content`.
[ ] 6. Move dialogs, sheets, and alert dialogs OUTSIDE HuemulPageLayout.
[ ] 7. Apply padding via `headerClassName` and column `className` (not on outer wrapper).
[ ] 8. Set `defaultSize`, `minSize` on columns as needed.
[ ] 9. Handle loading states:
      - Full-page skeleton → early return BEFORE the layout (unchanged).
      - Content-level loading → conditional rendering INSIDE `columns[].content`.
[ ] 10. Handle error states inside `columns[].content` (conditional rendering).
[ ] 11. Verify no TypeScript errors: `npx tsc --noEmit`.
[ ] 12. Verify visual result matches previous layout.
```

---

## 7. Loading and error state placement

Loading and error states interact with `HuemulPageLayout` in two ways:

### Full-page states (early returns)

These stay **before** the layout render. They are not affected by the refactoring.

```tsx
// Permission loading
if (isLoadingPermissions) return <PageSkeleton />

// Access denied
if (!canAccess) return <EmptyState type="access-denied" />

// No organization selected
if (!selectedOrganizationId) return <EmptyState type="no-organization" />

// Initial data loading (first load, no cached data)
if (showPageLoader) return <PageSkeleton />
```

### Content-level states (inside columns)

These go inside `columns[].content` with conditional rendering:

```tsx
columns={[
  {
    content: isError ? (
      <ErrorState onRetry={handleRefresh} />
    ) : !isTableLoading && !isTableFetching && items.length === 0 ? (
      <EmptyState />
    ) : (
      <DataTable ... />
    ),
  },
]}
```

---

## 8. Common mistakes to avoid

### ❌ Putting dialogs inside HuemulPageLayout

```tsx
// BAD — dialog may clip or have z-index issues inside resizable panels
<HuemulPageLayout
  columns={[{ content: <><Table /><DeleteDialog /></> }]}
/>

// GOOD — dialogs always outside
<>
  <HuemulPageLayout columns={[{ content: <Table /> }]} />
  <DeleteDialog />
</>
```

### ❌ Wrapping HuemulPageLayout in padding divs

```tsx
// BAD — double-wrapping defeats the full-height flex layout
<div className="p-6">
  <HuemulPageLayout ... />
</div>

// GOOD — use headerClassName and column className for padding
<HuemulPageLayout
  headerClassName="p-4 md:p-6 pb-0 md:pb-0"
  columns={[{ content: ..., className: "p-4 md:p-6 pt-0 md:pt-0" }]}
/>
```

### ❌ Using `defaultSize` values that don't make sense

```tsx
// BAD — all three sum to 100 but sidebar is 50%
columns={[
  { content: <Sidebar />, defaultSize: 50 },
  { content: <Main />, defaultSize: 30 },
  { content: <Right />, defaultSize: 20 },
]}

// GOOD — sidebar is small, main fills, right is moderate
columns={[
  { content: <Sidebar />, defaultSize: 20 },
  { content: <Main /> },  // auto-fills remainder
  { content: <Right />, defaultSize: 25 },
]}
```

### ❌ Forgetting `minSize` on resizable panels

Without `minSize`, a user can drag a panel to near-zero, breaking the content inside.

```tsx
// GOOD
{ content: <Sidebar />, defaultSize: 20, minSize: 12 }
```

### ❌ Using CSS to hide columns instead of `show`

```tsx
// BAD — column still takes space and renders
{ content: <Detail />, className: selected ? "" : "hidden" }

// GOOD — column is removed from the layout entirely
{ content: <Detail />, show: selected != null }
```

---

## 9. Real codebase examples

### Single column — Users page (`src/pages/users.tsx`)

```tsx
<HuemulPageLayout
  header={<UserPageHeader ... />}
  headerClassName="p-4 md:p-6 pb-0 md:pb-0"
  columns={[
    {
      content: isError ? <ErrorState /> : items.length === 0 ? <EmptyState /> : <UserTable ... />,
      className: "flex flex-col",
    },
  ]}
/>
```

**Nota:** cuando el contenido es una tabla que debe llenar todo el alto disponible (`HuemulTable` es internamente `flex flex-1 min-h-0 flex-col`), la columna necesita `className: "flex flex-col"` — **sin padding**. Sin `flex flex-col` el contenedor no es un flex context y el `flex-1` interno de la tabla no tiene efecto: la tabla queda con su altura natural y deja un espacio en blanco debajo (bug visto en `/roles` antes de estandarizarse contra `/users`). El padding va solo en `headerClassName`; la tabla queda a borde completo. Ver `ia context/list-detail-panel-guide.md` para el patrón completo de listado + panel de detalle.

### 2-column master-detail — External Systems page (`src/pages/external-systems.tsx`)

```tsx
<HuemulPageLayout
  columns={[
    {
      content: error ? <ErrorState /> : <FileTreePanel />,
      defaultSize: 20,
    },
    {
      content: renderDetail(),
      defaultSize: 80,
      minSize: 50,
    },
  ]}
/>
```

### Nested layout — Advanced page (`src/pages/advanced.tsx`)

```tsx
<HuemulPageLayout
  columns={[
    { content: <SidebarNav />, defaultSize: 15, resizable: false },
    {
      content: (
        <HuemulPageLayout
          header={pageHeader}
          showHeader={!isHome}
          columns={[
            { content: <FormContent />, defaultSize: 35, resizable: false },
            { content: <SelectionPanel />, defaultSize: 65, show: needsSelection, resizable: false },
          ]}
        />
      ),
      defaultSize: 85,
      resizable: false,
    },
  ]}
/>
```

### Vertical split — External Functionality Detail (`src/components/external-functionalities/external-functionality-detail.tsx`)

```tsx
<HuemulPageLayout
  direction="vertical"
  className="flex-1 min-h-0"
  columns={[
    { content: <TabContent />, defaultSize: 55, minSize: 15 },
    { content: <ResponsePanel />, defaultSize: 45, minSize: 15, className: "flex flex-col overflow-hidden" },
  ]}
/>
```
