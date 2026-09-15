# Wisecore — Guide for Pinning a Newly Created Row to the Top of a Paginated Table

Use this guide when a page has a server-side paginated `HuemulTable` (list fetched with `page`/`pageSize` via React Query) plus a create dialog, and the user wants a just-created row to be immediately visible at the top of the table — **without** navigating away from the page the user is currently on, and **without** changing the backend's real sort order.

Reference implementation: [assets-types.tsx](../src/pages/assets-types.tsx), [assets-types-page-dialogs.tsx](../src/components/assets-types/assets-types-page-dialogs.tsx), [assets-types-create.tsx](../src/components/assets-types/assets-types-create.tsx).

---

## 0. When this applies

```
Does the page fetch a list via a paginated query (page, pageSize) with no
backend support for "sort by newest first"?
  └─ NO  → not needed, backend order already surfaces new items where expected

Does the page have a create dialog whose mutation invalidates that query?
  └─ YES → apply this pattern
```

Do **not** apply this to edits/clones — only to brand-new creations. Editing an existing row should not reorder it.

---

## 1. Why not just navigate to page 1

The natural instinct is to reset to page 1 after creating. Do not do this — if the user is on page 3 managing a set of items and creates a new one, they expect to stay on page 3 with the new item pinned at the top of that page, not be yanked back to page 1. The "pin" is local to whatever page is currently rendered.

---

## 2. Steps

### 2.1 Thread the created entity up to the page component

The create dialog's mutation `onSuccess` already receives the created entity from the API. Make sure the prop type it's passed through (`on<Entity>Created`) includes enough fields to build a minimal row (id, name/label, color, `created_at`, count fields) — widen it if it was declared too narrowly (e.g. only `{ id, name, color }`).

In the dialogs wrapper component (the one that owns `state.editingX` / `state.showCreateDialog`), distinguish create vs edit using the existing dialog state **before** clearing it, and only invoke the "created" callback when it was a create:

```tsx
onDocumentTypeCreated={(result) => {
  const wasEditing = !!state.editingAssetType
  onCloseDialog('editingAssetType')
  onUpdateState({ showCreateDialog: false })
  if (!wasEditing) {
    onAssetTypeCreated?.(result)
  }
}}
```

### 2.2 Page-level pin state

```tsx
const [pinnedNewItem, setPinnedNewItem] = useState<ItemWithRoles | null>(null)

const handleItemCreated = (created: { id: string; name: string; color: string; created_at?: string; count?: number }) => {
  setPinnedNewItem({
    item_id: created.id,
    item_name: created.name,
    item_color: created.color,
    item_created_date: created.created_at ?? "",
    count: created.count ?? 0,
    // ...other required fields defaulted
  })
}
```

Note there is **no `setPage(1)`** here — the pin applies to whatever page the query is currently on.

### 2.3 Merge the pin into the rendered rows

Right after computing the raw list from the query response, reorder (don't refetch, don't mutate cache):

```tsx
const rawItems = response?.data || []
const effectivePageSize = response?.page_size || pageSize
const items = pinnedNewItem
  ? [
      rawItems.find((i) => i.item_id === pinnedNewItem.item_id) ?? pinnedNewItem,
      ...rawItems.filter((i) => i.item_id !== pinnedNewItem.item_id),
    ].slice(0, effectivePageSize)
  : rawItems
```

- Prefer the fetched version of the row if the invalidated query already returned it on this page (more accurate/complete data) — fall back to the locally-built stub if it hasn't shown up yet.
- `.slice(0, effectivePageSize)` keeps the row count consistent with the page size instead of showing one extra row.

### 2.4 Discard the pin on any manual navigation/refresh

The pin is meant to be transient. Clear it (`setPinnedNewItem(null)`) at every point where the user explicitly moves away from "just created" context:

- Manual refresh button handler.
- Search term change handler.
- Pagination `onPageChange`.
- Pagination `onPageSizeChange`.

Do **not** clear it on background refetches (`refetchOnWindowFocus`, etc.) — those aren't user-initiated navigation.

---

## 3. Checklist

```
[ ] Create callback prop widened to carry enough fields for a full row stub
[ ] Dialogs wrapper distinguishes create vs edit before invoking the callback
[ ] Page-level pin state does NOT call setPage — stays on the current page
[ ] Rendered list = pinned row (fetched version preferred) + rest, deduped, sliced to pageSize
[ ] Pin cleared on: manual refresh, search change, page change, page size change
[ ] tsc --noEmit passes after widening the callback type
```
