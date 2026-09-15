# Wisecore — Guide for Consolidating Types into a Subdirectory

Use this guide when a module has accumulated many flat `src/types/<module>-*.ts` files that belong to the same domain and should be grouped into a single `src/types/<module>/` subdirectory.

> This is a **structural refactor only** — no logic changes. The public API exposed through `src/types/index.ts` must remain unchanged.

---

## 0. When to apply

Apply this guide when **any** of the following is true:

- There are **2 or more** flat type files sharing the same `<module>-` prefix AND they belong to the same product domain.
- A single flat `src/types/<module>.ts` has grown to contain both entity types (API response shapes) **and** component prop types or hook option types — mix of concerns signals it should be split into a subdirectory.
- A hook needs a `Use*Options` interface that belongs to an existing module domain.

Do **not** apply this guide to individual files that belong to unrelated domains, even if they have a common prefix.

**Real-world example:** The `document-type-relationships` module was refactored from a single flat file into:
```
src/types/document-type-relationships/
  index.ts        ← barrel exports
  core.ts         ← DocumentTypeRelationship, *Response, *Request types
  dialogs.ts      ← RelationshipCreateDialogProps, AttributeFormData
  components.ts   ← RelationshipsCanvasProps, AssetTypeSidebarProps
  hooks.ts        ← UseDocumentTypeRelationshipsOptions
```

---

## 1. Target structure

```
src/types/
  index.ts                   ← barrel (modified)
  <module>/
    index.ts                 ← sub-barrel (new)
    core.ts                  ← main entity types
    dialogs.ts               ← dialog component props
    sheets.ts                ← sheet/drawer component props
    components.ts            ← misc component props
    hooks.ts                 ← Use*Options / Use*Props / Use*Return for src/hooks/use<Module>.ts
    <other-group>.ts         ← any other logical group
```

### 1.1 Grouping rules

| Group file | What goes here |
|---|---|
| `core.ts` | Main entity interfaces (`Document`, `Folder`, `Library`, etc.) and foundational types used across the module |
| `dialogs.ts` | `*DialogProps` interfaces, form data interfaces used only in dialogs |
| `sheets.ts` | `*SheetProps` interfaces, config response types for sheet components |
| `components.ts` | Miscellaneous component props that don't fit dialog/sheet categories |
| `hooks.ts` | `Use*Options`, `Use*Props`, `Use*Return` interfaces consumed by `src/hooks/use<Module>.ts` |
| `<feature>.ts` | Dedicated file for a coherent sub-feature (e.g. `lifecycle.ts`, `page.ts`, `selection-panel.ts`) |

When in doubt, keep related things together. A single `components.ts` that covers several small prop types is better than four one-type files.

---

## 2. Step-by-step

### 2.1 Audit all files to consolidate

List every file that will be moved:

```
src/types/<module>.ts
src/types/<module>-dialogs.ts
src/types/<module>-*.ts
```

For each file, note:
- Every exported name
- Every external import (React, services, other type files)

Use `grep_search` to find all files that import from these paths so you know what will need updating.

### 2.2 Check for name collisions

Before creating any file, search for duplicate export names across all files being consolidated:

```bash
grep -h "^export" src/types/<module>*.ts | sort | uniq -d
```

For each duplicate:
- **Same shape** → keep one, delete the other, verify no consumer relied on the discarded version.
- **Different shapes** → rename one with a more specific name (e.g. `FileTreeProps` → `AssetFileTreeProps`). Update any component that re-exports it with an alias.

Also check for collisions with **other** exports in `src/types/index.ts`:

```bash
grep "export \*" src/types/index.ts
```

If a name from the new barrel collides with an existing barrel export from a different module:
- Remove `export * from './<other-file>'` from `index.ts` and replace with a comment explaining the collision.
- The consumers of that other type must import directly from `@/types/<other-file>` (not from the barrel).

### 2.3 Create `src/types/<module>/` and group files

Create each group file. Rules:
- Each file must `export` every type it contains.
- Internal cross-references between group files use relative imports (e.g. `import type { Foo } from './core'`).
- External dependencies use the full alias path (e.g. `import type { Bar } from '@/types/custom-fields-documents'`).
- React imports use named imports: `import type { ReactNode, HTMLAttributes } from 'react'`.
- Do **not** duplicate any type across group files.

### 2.4 Create `src/types/<module>/index.ts`

This file re-exports everything from every group file:

```ts
// src/types/<module>/index.ts
export * from './core'
export * from './dialogs'
export * from './sheets'
export * from './components'
export * from './lifecycle'
export * from './page'
```

If a cross-group collision exists that cannot be resolved by renaming, use named exports:

```ts
export type { FooProps } from './dialogs'
export type { FooProps as FooSheetProps } from './sheets'  // alias to resolve collision
```

### 2.5 Update `src/types/index.ts`

Replace all individual `export * from './<module>-*'` lines with a single export of the new sub-barrel:

```ts
// Before
export * from './assets'
export * from './assets-types'
export * from './assets-dialogs'
// ... 20+ more lines

// After
export * from './assets'   // now resolves to assets/index.ts
```

> TypeScript resolves `'./assets'` as `./assets/index.ts` when the path is a directory. No extra config needed.

Remove **all** the old flat exports that are now covered by the barrel. The re-exported names are identical so consumers using `@/types` see no change.

### 2.6 Update component and service imports

Every file that imported from `@/types/<module>-*` must be updated to import from `@/types/<module>` (or just `@/types` if it was already using the barrel).

Pattern for components that both use and re-export a type:

```tsx
// Before
import type { FooProps } from "@/types/<module>-foo"
export type { FooProps } from "@/types/<module>-foo"

// After
import type { FooProps } from '@/types/<module>'
export type { FooProps } from '@/types/<module>'
```

Use `multi_replace_string_in_file` to update all affected files in a single call.

### 2.7 Handle renamed types in consuming components

If a type was renamed during consolidation (e.g. `FileTreeProps` → `AssetFileTreeProps`), update the component that uses it:

```tsx
// assets-file-tree.tsx — internal usage updated
const Tree = forwardRef<FileTreeRef, AssetFileTreeProps>(...)

// re-export keeps the old public name for backward compatibility
export type { AssetFileTreeProps as FileTreeProps, FileTreeRef } from '@/types/<module>'
```

### 2.8 Delete the old flat type files

Only delete **after** all imports have been updated and a build passes cleanly. Use PowerShell:

```powershell
Remove-Item src/types/<module>-*.ts
Remove-Item src/types/<module>.ts   # if the root file was replaced by the sub-barrel
```

> `src/types/index.ts` itself is never deleted — only modified.

### 2.9 Verify — zero TypeScript errors

```powershell
npm run build
```

The build must complete with **zero `error TS`** lines. Warnings about chunk size or dynamic imports are pre-existing and can be ignored.

If errors remain, search for any file still importing from the old path:

```powershell
grep -r "@/types/<module>-" src/
```

---

## 3. Common pitfalls

### 3.1 Merged interfaces with the same name but different fields

When two old files export `Section` (or any interface) with different shapes, merge them into one by taking the **union of all fields** (making optional anything that was absent in one version). Verify that all consumers compile correctly.

### 3.2 Collision between module barrel and unrelated type file

Example: `assets/dialogs.ts` exports `AddSectionDialogProps`, but so does `templates-add-section-dialog.ts` which was re-exported from `index.ts`.

Resolution: Remove `export * from './templates-add-section-dialog'` from `index.ts` and replace with a comment:

```ts
// NOTE: templates-add-section-dialog exports AddSectionDialogProps which collides
// with the assets version. Import directly from '@/types/templates-add-section-dialog'.
```

Verify no consumer was relying on the barrel for that type.

### 3.3 Cross-group circular imports

If `sheets.ts` imports from `dialogs.ts` and `dialogs.ts` imports from `sheets.ts`, extract the shared type into `core.ts` and have both import from there.

### 3.4 Re-exported types from components

Many component files do `export type { XxxProps } from '@/types/...'` so external callers can use them without knowing the types path. Make sure the import path in those re-exports is also updated, otherwise the build will fail on the missing old type file.

---

## 4. Verification checklist

```
[ ] All old flat src/types/<module>-*.ts files deleted
[ ] src/types/<module>/index.ts re-exports all group files
[ ] src/types/index.ts has single export pointing to the sub-barrel
[ ] No file in src/ imports from @/types/<module>-* paths
[ ] npm run build passes with zero error TS lines
[ ] Types previously accessible via @/types barrel still resolve correctly
```

---

## 5. Complete example: document-type-relationships

This section shows the actual refactor applied to `document-type-relationships`.

### Before (single flat file)
```
src/types/document-type-relationships.ts   ← 135 lines mixing entity types, requests, and responses
```

Component files defined their own interfaces:
```tsx
// relationship-dialogs.tsx
interface RelationshipFormData { ... }
interface RelationshipCreateDialogProps { ... }
interface RelationshipEditDialogProps { ... }

// relationship-attributes-dialog.tsx
interface AttributesDialogProps { ... }
interface AttributeFormData { ... }

// relationships-canvas.tsx
interface PendingConnection { ... }
interface RelationshipsCanvasProps { ... }

// useDocumentTypeRelationships.ts (hook)
export interface UseDocumentTypeRelationshipsOptions { ... }
```

### After (subdirectory structure)
```
src/types/document-type-relationships/
  index.ts         ← export * from './core', './dialogs', './components', './hooks'
  core.ts          ← 135 lines: entity types, API requests/responses
  dialogs.ts       ← 58 lines: dialog props, form data interfaces
  components.ts    ← 27 lines: canvas & sidebar props
  hooks.ts         ← 8 lines: UseDocumentTypeRelationshipsOptions
```

**core.ts** contains:
- `AttributeValueType`, `RelationshipDirection` (enums)
- `DocumentTypeRelationship`, `RelationshipAttributeValue` (entities)
- `DocumentTypeRelationshipsResponse`, `CreateDocumentTypeRelationshipRequest` (API types)

**dialogs.ts** contains:
- `RelationshipFormData`, `AttributeFormData` (form state)
- `RelationshipCreateDialogProps`, `RelationshipEditDialogProps`, `RelationshipDeleteDialogProps`
- `AttributesDialogProps`

**components.ts** contains:
- `PendingConnection` (internal canvas state)
- `RelationshipsCanvasProps`, `AssetTypeSidebarProps`

**hooks.ts** contains:
- `UseDocumentTypeRelationshipsOptions` (hook config)

### Updated imports
All components now import from the barrel:
```tsx
// relationship-dialogs.tsx
import type {
  CreateDocumentTypeRelationshipRequest,
  RelationshipFormData,
  RelationshipCreateDialogProps,
} from '@/types/document-type-relationships'

// useDocumentTypeRelationships.ts
import type {
  CreateDocumentTypeRelationshipRequest,
  UseDocumentTypeRelationshipsOptions,
} from '@/types/document-type-relationships'
```

The subdirectory barrel (`src/types/document-type-relationships/index.ts`) re-exports everything, so consumers see no API change. The old flat file was deleted after verifying zero TypeScript errors.

