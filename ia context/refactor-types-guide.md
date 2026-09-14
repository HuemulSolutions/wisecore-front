# Wisecore — Guide for Extracting Types & Interfaces to `src/types`

This document describes **how to move `interface` and `type` declarations** out of component files into the centralised `src/types/` folder.

Apply this guide whenever you encounter a component that defines its own interfaces or types inline.

---

## 0. When to extract

Extract **all** `interface` and `type` declarations from a file when **any** of the following is true:

- The file contains one or more `interface` or `type` declarations alongside React component code.
- A type is (or will be) referenced from more than one file.
- The component file is > 150 lines and types are adding visual noise.

Do **not** create a new types file if the only "types" are simple inline prop objects used in a single JSX expression (e.g. `FC<{ label: string }>`). Those can stay inline.

---

## 1. File naming convention

| Component file | New types file |
|---|---|
| `src/components/foo-bar.tsx` | `src/types/foo-bar.ts` |
| `src/components/module/baz-widget.tsx` | `src/types/baz-widget.ts` |
| `src/components/MarkdownDiffViewer.tsx` | `src/types/markdown-diff-viewer.ts` |

Use **kebab-case**. The base name must match the component file exactly (minus the extension).

> **Exception — module subdirectories:** If the component belongs to an established module that already has a `src/types/<module>/` subdirectory (e.g. `assets/`, `document-type-relationships/`, `execution/`, `llm-provider/`), place the types in the appropriate sub-file there:
> - `dialogs.ts` — dialog component props (`*DialogProps`, `*FormData`)
> - `components.ts` — misc component props
> - `hooks.ts` — `Use*Options` / `Use*Props` / `Use*Return` interfaces
> - `core.ts` — main entity types (already exists)
>
> See `docs/consolidate-types-subdirectory-guide.md` for full grouping rules.

---

## 2. Step-by-step

### 2.1 Identify every declaration to extract

Scan the component file for:

```ts
type Foo = ...
interface Bar { ... }
```

Include **all** of them — internal helpers (`DragState`, `Viewport`) as well as public props (`FooProps`).  
The **only exception** is a truly anonymous inline type that only appears once as a prop (see Section 0).

### 2.2 Create the types file

Create a new file and export every declaration:

```ts
// src/types/foo-bar.ts

export type DiffType = "eq" | "ins" | "del";

export interface FooEntry {
  type: DiffType;
  val: string;
}

export interface FooBarProps {
  value?: string;
  onChange?: (v: string) => void;
}
```

> **Module subdirectory:** If the target module uses `src/types/<module>/`, add the types to the relevant sub-file instead of creating a new flat file:
> - `RelationshipCreateDialogProps` → `dialogs.ts`
> - `UseDocumentTypeRelationshipsOptions` → `hooks.ts`
> - `AssetTypeSidebarProps` → `components.ts`
>
> The `index.ts` barrel in that subdirectory already re-exports everything — no extra step needed for `src/types/index.ts`.

If a type **extends** another type that was previously defined in the same component file, make sure the dependency is exported too (so the `extends` clause resolves correctly after the move).

### 2.3 Update `src/types/index.ts`

Append a re-export at the **end** of the file:

```ts
export * from './foo-bar'
```

> If exporting a type from the new file would create a **name collision** with an existing export in `index.ts`, use a named export instead:
> ```ts
> export type { FooBarProps } from './foo-bar'
> ```

### 2.4 Update the component file

Replace the inline declarations with a single import block at the top of the file, right after the React import:

```tsx
// Before
import { useState } from "react"

interface DragState { ... }
type ViewMode = "split" | "unified"
interface FooBarProps { ... }
```

```tsx
// After
import { useState } from "react"
import type {
  DragState,
  ViewMode,
  FooBarProps,
} from "@/types/foo-bar"
export type { FooBarProps } from "@/types/foo-bar"  // only for the public props type
```

Rules:
- Use `import type { ... }` (type-only import) for every import.
- Re-export with `export type { XxxProps }` **only** for the type that consumers of the component import (usually the `Props` interface). Internal types like `DragState` do not need to be re-exported from the component.
- Do **not** duplicate the declaration in both files. Once it lives in `src/types/`, delete it from the component.

### 2.5 Remove unused imports

After the move, some imported type names may not be used directly in the component (e.g. they are only referenced inside another type that is now in `src/types/`). Remove them from the component's import list to keep the compiler happy.

Example: if `SplitEntry = DiffEntryWithLine | EmptyEntry` is now defined in `src/types/`, the component only needs to import `SplitEntry`, not `DiffEntryWithLine` or `EmptyEntry` individually — unless the component references those names itself.

### 2.6 Verify — zero compiler errors

After completing the migration:

1. Check the component file for TypeScript errors.
2. Check `src/types/<name>.ts` for TypeScript errors.
3. Ensure no `interface` or `type` keyword remains at the top level of the component file.

---

## 3. Real-world example

### Before — `src/components/MarkdownDiffViewer.tsx` (excerpt)

```tsx
import { useState, useMemo, type FC } from "react"

type DiffType = "eq" | "ins" | "del"
type ViewMode = "split" | "unified" | "rendered"

interface DiffEntry {
  type: DiffType
  val: string
}

interface PairedRow {
  kind: "paired"
  oldLine: string
  newLine: string
}
interface SingleRow {
  kind: "eq" | "del" | "ins"
  line: string
}
type GroupedTableRow = PairedRow | SingleRow

export interface MarkdownDiffViewerProps {
  oldContent?: string
  newContent?: string
}

const MarkdownDiffViewer: FC<MarkdownDiffViewerProps> = ({ ... }) => { ... }
export default MarkdownDiffViewer
```

### After — `src/types/markdown-diff-viewer.ts`

```ts
export type DiffType = "eq" | "ins" | "del"
export type ViewMode = "split" | "unified" | "rendered"

export interface DiffEntry {
  type: DiffType
  val: string
}

export interface PairedRow {
  kind: "paired"
  oldLine: string
  newLine: string
}
export interface SingleRow {
  kind: "eq" | "del" | "ins"
  line: string
}
export type GroupedTableRow = PairedRow | SingleRow

export interface MarkdownDiffViewerProps {
  oldContent?: string
  newContent?: string
}
```

### After — `src/components/MarkdownDiffViewer.tsx` (top of file)

```tsx
import { useState, useMemo, type FC } from "react"
import type {
  DiffType,
  ViewMode,
  DiffEntry,
  PairedRow,
  SingleRow,
  GroupedTableRow,
  MarkdownDiffViewerProps,
} from "@/types/markdown-diff-viewer"
export type { MarkdownDiffViewerProps } from "@/types/markdown-diff-viewer"
```

### After — `src/types/index.ts` (appended line)

```ts
export * from './markdown-diff-viewer'
```

---

## 4. Checklist

```
[ ] Every interface / type removed from the component file
[ ] New src/types/<name>.ts created with all declarations exported
[ ] src/types/index.ts updated with re-export
[ ] Component imports from @/types/<name> using `import type`
[ ] Public Props type re-exported from the component with `export type`
[ ] Unused type imports removed from the component
[ ] Zero TypeScript errors in component file and types file
```
