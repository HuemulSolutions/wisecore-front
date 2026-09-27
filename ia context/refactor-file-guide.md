# Wisecore — Guide for Refactoring Individual Files

This document covers **file-level refactoring**: splitting, promoting, or reorganizing a single file without rewriting its logic. Use it when a file is too large, mixes concerns, or contains a pattern that should be shared.

Read `new-module-guide.md` for conventions that apply to every new file you create during refactoring.

---

## 0. Decision tree — what kind of refactor does this file need?

```
Is the UI pattern used in ≥ 2 modules or clearly app-generic?
  └─ YES → Promote to a huemul-* component  (Section 1)
  └─ NO  → Continue below

Does the file contain multiple visually distinct sub-components
rendered by one top-level export?
  └─ YES → Extract sub-components  (Section 2)

Does the file manage non-trivial state / side-effects inline
(useEffect, useMemo, multiple useState)?
  └─ YES → Extract a custom hook  (Section 3)

Does the file define interfaces or types alongside component code?
  └─ YES → Extract types  (Section 4)

Does the file contain pure helper functions (no React, no imports
from context/hooks)?
  └─ YES → Extract utilities  (Section 5)
```

Run every branch — a file may need more than one kind of refactor.

---

## 1. Promoting a component to `huemul-*`

### 1.1 When to promote

Promote when **all** of the following are true:
- The component is already used in two or more modules, **or** it is clearly generic enough that a second module would need it.
- The component has no hard-coded domain logic (no service calls, no org-specific data).
- The component could be described in one sentence without mentioning a business entity.

**Good candidates from the codebase:**
- `FileTree` in `assets-file-tree.tsx` — generic tree with drag-drop; could be needed by any module with hierarchical data.
- A status badge with tooltip that appears in multiple tables.
- A "copy to clipboard" button used in several detail panels.

**Do NOT promote** a component if it imports from `@/services/*`, `@/hooks/use*`, or a specific domain type like `Asset`, `User`, etc.

### 1.2 Checklist before promoting

```
[ ] Component accepts only generic props (no domain types in its interface)
[ ] No imports from @/services, @/hooks/use*, @/contexts
[ ] No hardcoded i18n namespace (or no i18n at all)
[ ] The public API (props interface) is stable — avoid promoting a WIP component
[ ] No existing huemul-* component already covers this pattern
```

### 1.3 Steps

1. **Create** `src/huemul/components/huemul-<name>.tsx`.
2. Copy the component. Replace domain-specific prop types with generics or primitives.
3. Remove any namespace-specific translation keys — either accept `label` props or use the `common` namespace.
4. Export the component and its public types from the new file.
5. In the **original file**, delete the component body and re-import from the new huemul path.
6. Search the workspace for other usages and update their imports too.

### 1.4 Example — promoting `FileTree` to `huemul-file-tree`

**Before** (`src/components/assets/content/assets-file-tree.tsx`):
```tsx
// 600-line file that owns the entire FileTree implementation
export const FileTree = forwardRef<FileTreeRef, FileTreeProps>(...)
```

**After** — new `src/huemul/components/huemul-file-tree.tsx`:
```tsx
// All types and logic moved here
export interface HuemulFileTreeProps { ... }   // renamed from FileTreeProps
export interface HuemulFileTreeRef { ... }     // renamed from FileTreeRef
export const HuemulFileTree = forwardRef<HuemulFileTreeRef, HuemulFileTreeProps>(...)
```

**After** — original file becomes a thin re-export (keep it for backward compat until all imports are updated):
```tsx
// src/components/assets/content/assets-file-tree.tsx
// TODO: update all imports to @/huemul/components/huemul-file-tree
export { HuemulFileTree as FileTree } from "@/huemul/components/huemul-file-tree"
export type { HuemulFileTreeRef as FileTreeRef } from "@/huemul/components/huemul-file-tree"
```

### 1.5 Naming convention for huemul props

| Pattern | Before | After |
|---------|--------|-------|
| Component name | `FileTree` | `HuemulFileTree` |
| Props interface | `FileTreeProps` | `HuemulFileTreeProps` |
| Ref interface | `FileTreeRef` | `HuemulFileTreeRef` |
| File name | `assets-file-tree.tsx` | `huemul-file-tree.tsx` |

---

## 2. Extracting sub-components from a large file

### 2.1 When to extract

A file needs sub-component extraction when it:
- Exceeds ~250 lines of JSX/TSX.
- Returns JSX with clearly distinct visual regions (toolbar, list, detail, empty state, etc.).
- Contains anonymous inline components (`const X = () => <div>...</div>`) that are only used locally.

### 2.2 Splitting rules

| What you find in the file | Where to put it |
|---------------------------|-----------------|
| Sub-component used **only inside this file** | Same file, below the main export (if small) or new sibling file |
| Sub-component used by **this file + one other in the same module** | New sibling file in the same folder |
| Sub-component used across **multiple modules** | → Section 1 (promote to huemul) |
| Private helper component (e.g. `DetailField`, `SectionSeparator`) | Keep at bottom of the same file |

### 2.3 Steps

1. Identify the distinct regions in the JSX (use comments or visual indentation as guide).
2. For each region that exceeds ~40 lines or has its own internal state, create a sibling file:
   - Same folder as the original.
   - Name: `<module>-<description>.tsx` (e.g. `assets-toolbar.tsx`, `assets-section-list.tsx`).
3. Move the JSX + any local state/handlers that belong exclusively to that region.
4. Define a `*Props` interface for the extracted component.
5. Import and use the new component in the original file.
6. If the module has an `index.ts` barrel, add the new file to it only if it needs to be used outside the module.

### 2.4 Example — splitting `assets-content.tsx`

`assets-content.tsx` is ~1 500 lines. Visible regions:

```
assets-content.tsx (orchestrator)
  ├── assets-toolbar.tsx          ← header + action buttons extracted
  ├── assets-section-list.tsx     ← loop over sections extracted
  └── assets-custom-fields-panel.tsx  ← custom fields side panel extracted
```

**Before:**
```tsx
// assets-content.tsx — everything in one file
export function LibraryContent({ ... }: LibraryContentProps) {
  // 50 lines of state
  // 80 lines of handlers
  return (
    <div>
      {/* 60 lines of toolbar JSX */}
      {/* 200 lines of section list JSX */}
      {/* 80 lines of custom fields panel JSX */}
    </div>
  )
}
```

**After:**
```tsx
// assets-content.tsx — orchestrator only
import { AssetsToolbar }         from "./assets-toolbar"
import { AssetsSectionList }     from "./assets-section-list"
import { AssetsCustomFieldsPanel } from "./assets-custom-fields-panel"

export function LibraryContent({ ... }: LibraryContentProps) {
  // state and handlers stay here
  return (
    <div>
      <AssetsToolbar ... />
      <AssetsSectionList ... />
      <AssetsCustomFieldsPanel ... />
    </div>
  )
}
```

### 2.5 Inline private helpers — keep them in the same file

Small helpers used only once and with no external consumers stay at the bottom of the same file:

```tsx
// ✅ Keep at bottom of assets-content.tsx — not worth a separate file
function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  )
}
```

---

## 3. Extracting a custom hook

### 3.1 When to extract

Extract a custom hook when a component file contains:
- More than 3 `useState` / `useRef` calls that form a logical group.
- `useEffect` blocks longer than ~10 lines.
- Complex derived state (`useMemo`) that obscures the rendering logic.
- Mutation handlers (`useMutation`, `useQueryClient`) mixed into the JSX file.
- The same state shape repeated across multiple components in the same module.

### 3.2 Where to put the hook

| Scope | Location |
|-------|----------|
| Used only within one component | Same folder as the component, named `use<Description>.ts` |
| Used by multiple components in the same module | `src/components/<module>/hooks/use<Description>.ts` |
| Used across modules | `src/hooks/use<Description>.ts` |

### 3.3 Steps

1. Identify the state + handlers that form a coherent concern (e.g. "tree loading state", "dialog open state", "pagination state").
2. Create `use<Description>.ts` in the appropriate location.
3. Move all related `useState`, `useRef`, `useCallback`, `useEffect`, and derived state into the hook.
4. Return only what the component needs — keep the return object flat and named.
5. Import and call the hook in the original component.
6. If the hook lives inside the module folder, do **not** export it from `index.ts` (it is not a public API).

### 3.4 Example — extracting tree state from `assets-file-tree.tsx`

**Before** (all state inline in the component):
```tsx
export const FileTree = forwardRef<FileTreeRef, FileTreeProps>(({ onLoadChildren, ... }, ref) => {
  const [nodes, setNodes] = useState<FileNode[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [dragOverNode, setDragOverNode] = useState<string | null>(null)

  const loadInitialData = useCallback(async () => { ... }, [onLoadChildren])
  const refresh = useCallback(async () => { ... }, [onLoadChildren, expandedFolders])
  const updateNode = useCallback(...)
  const addChildNode = useCallback(...)
  const removeNode = useCallback(...)
  const findNode = useCallback(...)

  useImperativeHandle(ref, () => ({ refresh }))
  // ...
})
```

**After** — `src/components/assets/content/hooks/useFileTreeState.ts`:
```ts
import { useState, useCallback, useImperativeHandle } from "react"
import type { RefObject } from "react"
import type { FileNode } from "@/types/assets"
import type { FileTreeRef } from "../assets-file-tree"

interface UseFileTreeStateOptions {
  onLoadChildren?: (folderId: string | null) => Promise<FileNode[]>
  initialFolderId?: string | null
  ref: RefObject<FileTreeRef>
}

export function useFileTreeState({ onLoadChildren, initialFolderId = null, ref }: UseFileTreeStateOptions) {
  const [nodes, setNodes] = useState<FileNode[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [dragOverNode, setDragOverNode] = useState<string | null>(null)

  // ... all handlers ...

  useImperativeHandle(ref, () => ({ refresh }))

  return {
    nodes, setNodes,
    expandedFolders,
    isLoading,
    draggedNode, setDraggedNode,
    dragOverNode, setDragOverNode,
    refresh,
    updateNode, addChildNode, removeNode, findNode,
    handleToggle, handleDrop,
  }
}
```

**After** — the component becomes:
```tsx
export const FileTree = forwardRef<FileTreeRef, FileTreeProps>((props, ref) => {
  const tree = useFileTreeState({ onLoadChildren: props.onLoadChildren, initialFolderId: props.initialFolderId, ref })
  // pure rendering using tree.*
})
```

### 3.5 Extracting dialog/mutation state

When a file has `isCreateDialogOpen`, `editingItem`, `deletingItem` etc., extract them into a `use<Module>Dialogs` hook:

```ts
// src/components/auth-types/hooks/useAuthTypeDialogs.ts
import { useState } from "react"
import type { AuthType } from "@/types/auth-types"

export function useAuthTypeDialogs() {
  const [showCreate, setShowCreate] = useState(false)
  const [editingItem, setEditingItem] = useState<AuthType | null>(null)
  const [deletingItem, setDeletingItem] = useState<AuthType | null>(null)

  return {
    showCreate,
    openCreate: () => setShowCreate(true),
    closeCreate: () => setShowCreate(false),
    editingItem,
    openEdit: (item: AuthType) => setEditingItem(item),
    closeEdit: () => setEditingItem(null),
    deletingItem,
    openDelete: (item: AuthType) => setDeletingItem(item),
    closeDelete: () => setDeletingItem(null),
  }
}
```

---

## 4. Extracting types from a component file

### 4.1 When to extract

Extract types when:
- An interface or type is imported by more than one file.
- A type represents a domain entity (not just a component's `Props` interface).
- The same shape is duplicated across multiple files.

### 4.2 `Props` interfaces — keep them local

`*Props` interfaces belong **in the same file** as the component they describe. Never move them to `src/types/`.

```tsx
// ✅ Keep in the same file
interface FooBarTableProps {
  items: FooBar[]
  onEdit: (item: FooBar) => void
}
export function FooBarTable({ items, onEdit }: FooBarTableProps) { ... }
```

### 4.3 Domain types — move to the module's type location

```tsx
// ❌ Domain type in a component file
// src/components/assets/content/assets-file-tree.tsx
interface FileNode {
  id: string
  name: string
  type: "document" | "folder"
  children?: FileNode[]
}

// ✅ Move to src/types/assets/core.ts (module uses a subdirectory)
// Then import:
import type { FileNode } from "@/types/assets"
```

> If the module uses a flat file (`src/types/<module>.ts`), add the type there. If it uses a subdirectory (`src/types/<module>/`), add it to the appropriate sub-file (`core.ts` for entities, `dialogs.ts` for dialog props, `components.ts` for component props, `hooks.ts` for hook option types).

### 4.4 Shared non-domain types

When a type is shared across components but is not a backend entity (e.g. a UI state shape):

```ts
// ✅ If used by ≥ 2 files in the same module:
//   - flat module  → add to src/types/<module>.ts
//   - subdirectory → add to src/types/<module>/components.ts (or dialogs.ts / hooks.ts)
export interface MenuAction {
  key: string
  label: string
  icon: LucideIcon
  onClick: () => void
  destructive?: boolean
}
```

---

## 5. Extracting utility functions

### 5.1 When to extract

Extract a function to `src/lib/` when:
- It has **zero React imports** (no hooks, no JSX).
- It is a pure transformation: input → output, no side effects.
- It is used in ≥ 2 files, **or** it is complex enough to deserve its own unit tests.

### 5.2 Where to put it

| Type of utility | Location |
|-----------------|----------|
| Generic helper (string, date, number) | `src/lib/utils.ts` |
| Specific to one domain concept | `src/lib/<concept>-utils.ts` (e.g. `src/lib/execution-utils.ts`) |
| Already has a matching file | Add to the existing file |

### 5.3 Example — extracting helpers from `assets-content.tsx`

**Before** (inside the component file):
```tsx
/** Recursively extract all text from a Plate JSON node. */
function extractPlateText(node: unknown): string { ... }

/** Check whether a section has no visible content. */
function isSectionContentEmpty(section: ContentSection): boolean { ... }

/** Return the best display label for an execution. */
function getExecutionDisplayLabel(execution: ...): string { ... }
```

**After** — `src/lib/execution-utils.ts`:
```ts
import type { ContentSection } from "@/types/assets"

export function extractPlateText(node: unknown): string { ... }
export function isSectionContentEmpty(section: ContentSection): boolean { ... }
export function getExecutionDisplayLabel(execution: { version?: string | null; name?: string } | null | undefined): string { ... }
```

**After** — import in the component:
```tsx
import { extractPlateText, isSectionContentEmpty, getExecutionDisplayLabel } from "@/lib/execution-utils"
```

---

## 6. Eliminating dead patterns found in existing files

Some older files contain patterns that should be replaced during any refactor touching that file:

| Pattern found | Replace with |
|---------------|-------------|
| `*-form-fields.tsx` shared across dialogs | Move `HuemulField` instances **directly into each dialog** — the wrapper adds no value |
| `*-actions.tsx` that builds action arrays | Define the `HuemulTableAction[]` array **inside the table component** |
| `*-page-header.tsx` / `*-search.tsx` thin wrapper | Use `PageHeader` from `@/huemul/components/huemul-page-header` directly in the page |
| `*-content-empty-state.tsx` | Use the `emptyState` prop on `HuemulTable` or render `<Empty>` inline |
| `const STAGE_COLORS: Record<string, string>` inside a component | Move to the same file as the type it maps, or to `lib/` if reused |
| `ReusableAlertDialog` / custom alert wrappers | Replace with `HuemulAlertDialog` |
| Manual `isLoading` `useState` in dialogs | Wrap mutation in `new Promise<void>` and let `HuemulDialog` own loading state |
| `toast.success` / `toast.error` inside a page file | Move to `onSuccess` / `onError` inside the dialog or mutation |

---

## 7. After refactoring — checklist

```
[ ] No TypeScript errors (run tsc --noEmit)
[ ] Original consumers still compile (check all import sites)
[ ] If a file was deleted: grep workspace to confirm nothing imports it
[ ] If a file was moved: update every import path
[ ] If a new huemul-* component was added: check src/huemul/components/ — no index.ts needed
[ ] If a new file was added inside a module: decide whether to export from index.ts
     → Only export if the component is consumed outside the module folder
[ ] Barrel (index.ts) reflects current exports — no stale or missing entries
[ ] No component is both in the barrel AND imported directly by path in the same page
```

---

## 8. Quick reference — file naming

| What you are creating | Pattern | Example |
|----------------------|---------|---------|
| Huemul reusable component | `huemul-<name>.tsx` | `huemul-file-tree.tsx` |
| Module sub-component (extracted region) | `<module>-<region>.tsx` | `assets-toolbar.tsx` |
| Module-scoped custom hook | `use<Description>.ts` | `useFileTreeState.ts` |
| Module hooks folder | `src/components/<module>/hooks/` | `src/components/assets/hooks/` |
| Domain utility | `src/lib/<concept>-utils.ts` | `src/lib/execution-utils.ts` |
| Domain types | `src/types/<module>.ts` | `src/types/assets.ts` |
