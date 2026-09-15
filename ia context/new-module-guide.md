# Wisecore — Guide for Creating a New Module

This document defines the **structure and conventions** to follow when creating a new module in `wisecore-front`. Read it fully before generating any file.

Modules vary in complexity and layout. The guide is divided into:
- **Core layer** — always required (types, service, hooks, i18n).
- **Huemul component catalog** — the building blocks to compose from.
- **UI component layer** — module-specific components; only create what the module needs.
- **Page** — pure layout orchestrator that wires everything together.
- **Route & navigation** — wiring up the new page.

> **Default to Huemul components.** Every interactive element, form field, dialog, table, and button should use an existing `huemul-*` component. If a pattern is reused across more than one module or would benefit the whole app, create a new `huemul-*` component in `src/huemul/components/` instead of duplicating it.

---

## 1. Core layer (always required)

For a module called `foo-bars` (replace with the real name throughout):

| # | File | Purpose |
|---|------|---------|
| 1 | `src/types/foo-bars.ts` | TypeScript interfaces (start here; migrate to `src/types/foo-bars/` subdirectory if the module accumulates component props, dialog props, or hook option types — see `consolidate-types-subdirectory-guide.md`) |
| 2 | `src/services/foo-bars.ts` | Raw API calls via `httpClient` |
| 3 | `src/hooks/useFooBars.ts` | TanStack Query hooks + mutations |
| 4 | `src/i18n/locales/foo-bars.ts` | EN/ES translations |
| 5 | `src/i18n/index.ts` *(edit)* | Register new namespace |

## 2. UI component layer (compose as needed)

Only create the components the module actually requires. Common examples:

| File | When to create |
|------|----------------|
| `foo-bars-table.tsx` | Module has a list view |
| `foo-bars-detail.tsx` | Module has a right-panel detail view |
| `foo-bars-create-dialog.tsx` | Module allows creating items |
| `foo-bars-edit-dialog.tsx` | Module allows editing items |
| `foo-bars-delete-dialog.tsx` | Module allows deleting items |
| `foo-bars-loading-state.tsx` | Always — shows skeleton while first load runs |
| `foo-bars-error-state.tsx` | Always — shows error + retry |
| `index.ts` | Always — barrel re-exports |

Non-list modules may instead have cards, tabs, forms, or other layouts — create components that match the actual design. **Never generate a component just because the template includes it.**

## 3. Page & routing

| File | Purpose |
|------|---------|
| `src/pages/foo-bars.tsx` | Layout orchestrator only — no raw UI |
| `src/App.tsx` *(edit)* | Add route |
| `src/components/layout/app-layout.tsx` *(edit)* | Add nav item (if org-scoped) |
| `src/i18n/locales/layout.ts` *(edit)* | Add nav label translation |

---

---

## 4. Types (`src/types/foo-bars.ts` or `src/types/foo-bars/`)

### Flat file (default — use for new modules)

Start with a single `src/types/foo-bars.ts`. Migrate to a subdirectory (see `docs/consolidate-types-subdirectory-guide.md`) once the module also needs component prop types, dialog props, or hook option types.

**When to consolidate into a subdirectory:**
- You have 2+ flat type files with the same `<module>-` prefix (e.g., `foo-bars.ts`, `foo-bars-dialogs.ts`)
- A single flat file contains both entity types AND component/dialog props — mixing concerns
- A hook needs a `Use*Options` interface that belongs to the module domain

**Example:** The `document-type-relationships` module uses a subdirectory:
```
src/types/document-type-relationships/
  index.ts        ← barrel re-exports all group files
  core.ts         ← main entity types, API responses, requests
  dialogs.ts      ← dialog component props, form data interfaces
  components.ts   ← misc component props (canvas, sidebar, etc.)
  hooks.ts        ← Use*Options interfaces for hooks
```

```ts
// Union type for constrained string fields
export type FooBarStatus = 'active' | 'inactive'

// Main entity — matches backend response shape exactly
export interface FooBar {
  id: string
  name: string
  status: FooBarStatus
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
}

// Paginated list response
export interface FooBarsResponse {
  data: FooBar[]
  transaction_id: string
  page: number
  page_size: number
  has_next: boolean
  timestamp: string
}

// Single-item response wrapper
export interface FooBarResponse {
  data: FooBar
  transaction_id: string
  timestamp: string
}

// Query params for the list endpoint
export interface GetFooBarsParams {
  page?: number
  page_size?: number
  search?: string
  status?: FooBarStatus
}

// Request bodies
export interface CreateFooBarRequest {
  name: string
  status?: FooBarStatus
}

export interface UpdateFooBarRequest {
  name: string
  status?: FooBarStatus
}

// Hook option types — query options consumed by useFooBars.ts
export interface UseFooBarsOptions {
  enabled?: boolean
  page?: number
  pageSize?: number
  search?: string
  status?: FooBarStatus
}
```

### Subdirectory (use when the module grows)

If the module accumulates dialog props, sheet props, or multiple hook option types, convert to a subdirectory. See `docs/consolidate-types-subdirectory-guide.md` for the full migration steps.

```
src/types/foo-bars/
  index.ts       ← re-exports all sub-files
  core.ts        ← FooBar, FooBarsResponse, GetFooBarsParams, Create/UpdateFooBarRequest
  dialogs.ts     ← CreateFooBarDialogProps, DeleteFooBarDialogProps, …
  components.ts  ← FooBarsTableProps, FooBarsEmptyStateProps, …
  hooks.ts       ← UseFooBarsOptions, …
```

Internal cross-references use relative imports (`from './core'`). External consumers always import from `@/types/foo-bars` — TypeScript resolves the directory's `index.ts` automatically.

---

## 5. Service (`src/services/foo-bars.ts`)

```ts
import { backendUrl } from '@/config'
import { httpClient } from '@/lib/http-client'
import type {
  FooBar,
  FooBarResponse,
  FooBarsResponse,
  GetFooBarsParams,
  CreateFooBarRequest,
  UpdateFooBarRequest,
} from '@/types/foo-bars'

const BASE_URL = `${backendUrl}/foo-bars`

// All org-scoped endpoints receive organizationId and send it as X-Org-Id header.
// Non-org-scoped endpoints omit the header entirely.

export async function getFooBars(
  organizationId: string,
  params: GetFooBarsParams = {},
): Promise<FooBarsResponse> {
  const { page = 1, page_size = 50, search, status } = params
  const query = new URLSearchParams({ page: page.toString(), page_size: page_size.toString() })
  if (search?.trim()) query.set('search', search.trim())
  if (status) query.set('status', status)

  const response = await httpClient.get(`${BASE_URL}/?${query}`, {
    headers: { 'X-Org-Id': organizationId },
  })
  return response.json() as Promise<FooBarsResponse>
}

export async function getFooBar(organizationId: string, id: string): Promise<FooBar> {
  const response = await httpClient.get(`${BASE_URL}/${id}`, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as FooBarResponse
  return data.data
}

export async function createFooBar(
  organizationId: string,
  body: CreateFooBarRequest,
): Promise<FooBar> {
  const response = await httpClient.post(`${BASE_URL}/`, body, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as FooBarResponse
  return data.data
}

export async function updateFooBar(
  organizationId: string,
  id: string,
  body: UpdateFooBarRequest,
): Promise<FooBar> {
  const response = await httpClient.put(`${BASE_URL}/${id}`, body, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as FooBarResponse
  return data.data
}

export async function deleteFooBar(organizationId: string, id: string): Promise<void> {
  await httpClient.delete(`${BASE_URL}/${id}`, {
    headers: { 'X-Org-Id': organizationId },
  })
}

export type { FooBar, FooBarsResponse, GetFooBarsParams, CreateFooBarRequest, UpdateFooBarRequest }
```

---

---

## 6. Hooks (`src/hooks/useFooBars.ts`)

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getFooBars, getFooBar, createFooBar, updateFooBar, deleteFooBar,
} from '@/services/foo-bars'
import type { FooBarStatus, CreateFooBarRequest, UpdateFooBarRequest } from '@/types/foo-bars'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const fooBarQueryKeys = {
  all: ['foo-bars'] as const,
  listBase: () => [...fooBarQueryKeys.all, 'list'] as const,
  list: (orgId: string, page: number, pageSize: number, search?: string, status?: FooBarStatus) =>
    [...fooBarQueryKeys.listBase(), orgId, page, pageSize, search ?? '', status ?? ''] as const,
  detail: (orgId: string, id: string) =>
    [...fooBarQueryKeys.all, 'detail', orgId, id] as const,
}

// ─── List query ───────────────────────────────────────────────────────────────

export interface UseFooBarsOptions {
  enabled?: boolean
  page?: number
  pageSize?: number
  search?: string
  status?: FooBarStatus
}

export function useFooBars(organizationId: string, options: UseFooBarsOptions = {}) {
  const { enabled = true, page = 1, pageSize = 50, search, status } = options
  return useQuery({
    queryKey: fooBarQueryKeys.list(organizationId, page, pageSize, search, status),
    queryFn: () => getFooBars(organizationId, { page, page_size: pageSize, search, status }),
    enabled: enabled && !!organizationId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev, // REQUIRED for smooth pagination
    retry: 0,
  })
}

// ─── Detail query ─────────────────────────────────────────────────────────────

export function useFooBar(organizationId: string, id: string) {
  return useQuery({
    queryKey: fooBarQueryKeys.detail(organizationId, id),
    queryFn: () => getFooBar(organizationId, id),
    enabled: !!organizationId && !!id,
    staleTime: 2 * 60 * 1000,
    retry: 0,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useFooBarMutations(organizationId: string) {
  const queryClient = useQueryClient()
  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: fooBarQueryKeys.listBase() })

  const createMutation = useMutation({
    mutationFn: (body: CreateFooBarRequest) => createFooBar(organizationId, body),
    onSuccess: invalidateList,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateFooBarRequest }) =>
      updateFooBar(organizationId, id, body),
    onSuccess: (_data, { id }) => {
      invalidateList()
      queryClient.invalidateQueries({ queryKey: fooBarQueryKeys.detail(organizationId, id) })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFooBar(organizationId, id),
    onSuccess: (_data, id) => {
      invalidateList()
      queryClient.removeQueries({ queryKey: fooBarQueryKeys.detail(organizationId, id) })
    },
  })

  return {
    createFooBar: createMutation,
    updateFooBar: updateMutation,
    deleteFooBar: deleteMutation,
  }
}
```

> **Rule:** `placeholderData: (prev) => prev` is **mandatory** on any list query that feeds a `HuemulTable`. Without it the table shows skeleton rows on every page/search change instead of keeping the previous data visible.

---

## 7. Locale (`src/i18n/locales/foo-bars.ts`)

Every locale file exports a **default** object. Each leaf is `{ en: "...", es: "..." }`. The file must cover all sections used by every component.

```ts
const translations = {
  header: {
    title: { en: "Foo Bars", es: "Foo Bars" },
    addItem: { en: "Add Foo Bar", es: "Agregar Foo Bar" },
    searchPlaceholder: { en: "Search foo bars...", es: "Buscar foo bars..." },
    itemsCount: { en: "{{count}} items", es: "{{count}} elementos" },
  },
  columns: {
    name: { en: "Name", es: "Nombre" },
    status: { en: "Status", es: "Estado" },
    updatedAt: { en: "Updated", es: "Actualizado" },
  },
  list: {
    emptyDescription: {
      en: "Get started by adding your first foo bar.",
      es: "Comienza agregando tu primer foo bar.",
    },
  },
  detail: {
    placeholder: {
      en: "Select an item to view its details",
      es: "Selecciona un elemento para ver sus detalles",
    },
    createdAt: { en: "Created At", es: "Creado el" },
    updatedAt: { en: "Updated At", es: "Actualizado el" },
  },
  form: {
    namePlaceholder: { en: "e.g. My Foo Bar", es: "ej. Mi Foo Bar" },
    statusPlaceholder: { en: "Select status", es: "Seleccionar estado" },
  },
  emptyState: {
    empty: { en: "No foo bars yet", es: "No hay foo bars aún" },
    noResults: { en: "No items match your search", es: "Ningún elemento coincide con tu búsqueda" },
  },
  errorState: {
    failedToLoad: { en: "Failed to load foo bars", es: "Error al cargar los foo bars" },
    errorDescription: {
      en: "An error occurred. Please try again.",
      es: "Ocurrió un error. Por favor, inténtalo de nuevo.",
    },
  },
  create: {
    title: { en: "Add Foo Bar", es: "Agregar Foo Bar" },
    submitLabel: { en: "Add", es: "Agregar" },
    success: { en: "Foo bar added successfully", es: "Foo bar agregado correctamente" },
  },
  edit: {
    title: { en: "Edit Foo Bar", es: "Editar Foo Bar" },
    submitLabel: { en: "Save Changes", es: "Guardar Cambios" },
    success: { en: "Foo bar updated successfully", es: "Foo bar actualizado correctamente" },
  },
  delete: {
    title: { en: "Delete Foo Bar", es: "Eliminar Foo Bar" },
    description: {
      en: "Are you sure you want to delete \"{{name}}\"? This action cannot be undone.",
      es: "¿Estás seguro de que deseas eliminar \"{{name}}\"? Esta acción no se puede deshacer.",
    },
    confirmLabel: { en: "Delete", es: "Eliminar" },
  },
  actions: {
    edit: { en: "Edit", es: "Editar" },
    delete: { en: "Delete", es: "Eliminar" },
  },
}

export default translations
```

---

---

## 8. Register namespace in `src/i18n/index.ts`

Add **two lines**:

```ts
// 1. Import at the top with the other imports
import fooBars from './locales/foo-bars'

// 2. Add to the modules object
const modules = {
  // ...existing modules...
  'foo-bars': fooBars,
} as const
```

The namespace key (e.g. `'foo-bars'`) is what you pass to `useTranslation('foo-bars')`.

---

## 9. Huemul Component Catalog

Before building any UI, check whether a `huemul-*` component already covers the need. All components live in `src/huemul/components/`.

| Component | Import path | Use when |
|-----------|-------------|----------|
| `HuemulPageLayout` | `huemul-page-layout` | Any page with one or more resizable columns |
| `PageHeader` | `huemul-page-header` | Top bar with title, icon, search, primary action, refresh |
| `HuemulTable` | `huemul-table` | Any tabular list — handles columns, actions, pagination, empty state, loading |
| `HuemulDialog` | `huemul-dialog` | Create / edit forms in a modal |
| `HuemulAlertDialog` | `huemul-alert-dialog` | Destructive confirmations (delete, disable, etc.) |
| `HuemulSheet` | `huemul-sheet` | Side-panel forms or detail views that need more vertical space |
| `HuemulField` / `HuemulFieldGroup` | `huemul-field` | Every form input — text, select, combobox, checkbox, switch, date, richtext, etc. |
| `HuemulButton` | `huemul-button` | Any button — supports async `onClick`, loading state, native `title` tooltip, permission guard |
| `HuemulTruncatedText` | `huemul-truncated-text` | Text that truncates and must reveal its full value on hover — only when it actually overflows (see `ia context/tooltip-guide.md`) |

### 9.1 When to create a new Huemul component

Create a new `huemul-*` component in `src/huemul/components/` when:

- A UI pattern would be repeated across **two or more modules** (e.g. a "status badge with tooltip" that multiple tables need).
- The existing catalog has no equivalent and the new component is generic enough to be reused app-wide.
- You need to extend an existing Huemul component's behaviour — subclass it rather than duplicating the internals.

**Do not** wrap a Huemul component in another component just to give it a module-specific name. Use Huemul components directly in module components.

---

## 10. UI Component Layer

Module-specific components live in `src/components/foo-bars/`. Only create what the module actually needs. The patterns below are examples — adapt them to the real design.

### 10.1 Loading state (always required)

```tsx
import { PageSkeleton } from "@/components/ui/page-skeleton"

export function FooBarsLoadingState() {
  return <PageSkeleton />
}
```

### 10.2 Error state (always required)

```tsx
import { RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { HuemulButton } from "@/huemul/components/huemul-button"

interface FooBarsErrorStateProps {
  error?: unknown
  onRetry?: () => void
}

export function FooBarsErrorState({ error, onRetry }: FooBarsErrorStateProps) {
  const { t } = useTranslation(["foo-bars", "common"])
  const message = error instanceof Error ? error.message : t("errorState.failedToLoad")

  return (
    <div className="flex flex-col items-center justify-center min-h-100 text-center rounded-lg border border-dashed bg-muted/50 p-8">
      <p className="text-red-600 mb-4 font-medium">{message}</p>
      <p className="text-sm text-muted-foreground mb-6">{t("errorState.errorDescription")}</p>
      {onRetry && (
        <HuemulButton onClick={onRetry} variant="outline" icon={RefreshCw} label={t("common:tryAgain")} />
      )}
    </div>
  )
}
```

### 10.3 Table (list modules)

Use `HuemulTable`. Pass `columns`, `actions`, `pagination`, and `emptyState` — no table markup needed.

```tsx
import { Edit2, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { FooBar } from "@/types/foo-bars"
import {
  HuemulTable,
  type HuemulTableColumn,
  type HuemulTableAction,
  type HuemulTablePagination,
} from "@/huemul/components/huemul-table"

interface FooBarsTableProps {
  items: FooBar[]
  onEdit: (item: FooBar) => void
  onDelete: (item: FooBar) => void
  isLoading?: boolean
  isFetching?: boolean
  pagination?: HuemulTablePagination
  searchTerm?: string
}

export function FooBarsTable({ items, onEdit, onDelete, isLoading, isFetching, pagination, searchTerm = "" }: FooBarsTableProps) {
  const { t } = useTranslation(["foo-bars", "common"])

  const columns: HuemulTableColumn<FooBar>[] = [
    {
      key: "name",
      label: t("columns.name"),
      render: (item) => <span className="text-xs font-medium text-foreground">{item.name}</span>,
    },
    // add more columns as needed
  ]

  const actions: HuemulTableAction<FooBar>[] = [
    { key: "edit",   label: t("actions.edit"),   icon: Edit2,  onClick: onEdit,   separator: true },
    { key: "delete", label: t("actions.delete"), icon: Trash2, onClick: onDelete, destructive: true },
  ]

  return (
    <HuemulTable
      data={items}
      columns={columns}
      actions={actions}
      getRowKey={(item) => item.id}
      isLoading={isLoading}
      isFetching={isFetching}
      pagination={pagination}
      emptyState={{
        title: searchTerm ? t("emptyState.noResults") : t("emptyState.empty"),
        description: searchTerm ? undefined : t("list.emptyDescription"),
      }}
    />
  )
}
```

### 10.4 Detail panel (table + detail layout)

Only needed when the page uses a two-column layout with a right-side detail view.

```tsx
import { SomeIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Separator } from "@/components/ui/separator"
import type { FooBar } from "@/types/foo-bars"

export function FooBarDetail({ item }: { item: FooBar | null }) {
  const { t } = useTranslation(["foo-bars", "common"])

  if (!item) {
    return (
      <div className="flex h-full items-center justify-center text-center text-muted-foreground p-6">
        <div className="flex flex-col items-center gap-3">
          <SomeIcon className="size-10 opacity-25" />
          <p className="text-sm">{t("detail.placeholder")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="px-6 py-4 border-b shrink-0 flex items-center gap-3">
        <SomeIcon className="size-5 text-muted-foreground" />
        <h2 className="text-base font-semibold">{item.name}</h2>
      </div>
      <div className="flex-1 overflow-auto p-6 space-y-4">
        <DetailField label={t("detail.createdAt")} value={new Date(item.created_at).toLocaleString()} />
        <Separator />
        <DetailField label={t("detail.updatedAt")} value={new Date(item.updated_at).toLocaleString()} />
      </div>
    </div>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground break-all">{value}</span>
    </div>
  )
}
```

### 10.5 Create dialog

Use `HuemulDialog` + `HuemulField`. Wrap the mutation in `new Promise<void>` so the dialog manages its own loading/success state.

```tsx
"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Plus } from "lucide-react"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulField, HuemulFieldGroup } from "@/huemul/components/huemul-field"
import { useFooBarMutations } from "@/hooks/useFooBars"
import type { CreateFooBarRequest } from "@/types/foo-bars"

const INITIAL_FORM: CreateFooBarRequest = { name: "" }

interface FooBarCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
}

export function FooBarCreateDialog({ open, onOpenChange, organizationId }: FooBarCreateDialogProps) {
  const { t } = useTranslation(["foo-bars", "common"])
  const [formData, setFormData] = useState<CreateFooBarRequest>(INITIAL_FORM)
  const { createFooBar } = useFooBarMutations(organizationId)

  const handleChange = <K extends keyof CreateFooBarRequest>(field: K, value: CreateFooBarRequest[K]) =>
    setFormData((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    await new Promise<void>((resolve, reject) => {
      createFooBar.mutate(formData, {
        onSuccess: () => { setFormData(INITIAL_FORM); resolve() },
        onError: (err) => reject(err),
      })
    })
  }

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("create.title")}
      icon={Plus}
      maxWidth="sm:max-w-md"
      saveAction={{ label: t("create.submitLabel"), onClick: handleSubmit }}
    >
      <HuemulFieldGroup className="py-2">
        <HuemulField
          label={t("columns.name")}
          name="name"
          value={formData.name}
          onChange={(v) => handleChange("name", v as string)}
          placeholder={t("form.namePlaceholder")}
          required
        />
        {/* Add more HuemulField instances as the form requires */}
      </HuemulFieldGroup>
    </HuemulDialog>
  )
}
```

> **Alternative:** For forms that need more vertical space (e.g. rich text, many fields), replace `HuemulDialog` with `HuemulSheet`. The API is identical for `saveAction` and `onOpenChange`.

### 10.6 Edit dialog

Same as create, but pre-fills via `useEffect` when `item && open` changes.

```tsx
"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Edit } from "lucide-react"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulField, HuemulFieldGroup } from "@/huemul/components/huemul-field"
import { useFooBarMutations } from "@/hooks/useFooBars"
import type { FooBar, UpdateFooBarRequest } from "@/types/foo-bars"

interface FooBarEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  item: FooBar | null
}

export function FooBarEditDialog({ open, onOpenChange, organizationId, item }: FooBarEditDialogProps) {
  const { t } = useTranslation(["foo-bars", "common"])
  const [formData, setFormData] = useState<UpdateFooBarRequest>({ name: "" })
  const { updateFooBar } = useFooBarMutations(organizationId)

  // Pre-fill form when item changes
  useEffect(() => {
    if (item && open) setFormData({ name: item.name })
  }, [item, open])

  const handleChange = <K extends keyof UpdateFooBarRequest>(field: K, value: UpdateFooBarRequest[K]) =>
    setFormData((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    if (!item) return
    await new Promise<void>((resolve, reject) => {
      updateFooBar.mutate({ id: item.id, body: formData }, {
        onSuccess: () => resolve(),
        onError: (err) => reject(err),
      })
    })
  }

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("edit.title")}
      icon={Edit}
      maxWidth="sm:max-w-md"
      saveAction={{ label: t("common:update"), onClick: handleSubmit }}
    >
      <HuemulFieldGroup className="py-2">
        <HuemulField
          label={t("columns.name")}
          name="name"
          value={formData.name}
          onChange={(v) => handleChange("name", v as string)}
          placeholder={t("form.namePlaceholder")}
          required
        />
      </HuemulFieldGroup>
    </HuemulDialog>
  )
}
```

### 10.7 Delete dialog

Use `HuemulAlertDialog` — the only dialog that does not use `HuemulDialog`.

```tsx
"use client"

import { useTranslation } from "react-i18next"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { useFooBarMutations } from "@/hooks/useFooBars"
import type { FooBar } from "@/types/foo-bars"

interface FooBarDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  item: FooBar | null
  onDeleted?: () => void
}

export function FooBarDeleteDialog({ open, onOpenChange, organizationId, item, onDeleted }: FooBarDeleteDialogProps) {
  const { t } = useTranslation(["foo-bars", "common"])
  const { deleteFooBar } = useFooBarMutations(organizationId)

  const handleDelete = async () => {
    if (!item) return
    await new Promise<void>((resolve, reject) => {
      deleteFooBar.mutate(item.id, {
        onSuccess: () => { onDeleted?.(); resolve() },
        onError: (err) => reject(err),
      })
    })
  }

  return (
    <HuemulAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("delete.title")}
      description={t("delete.description", { name: item?.name })}
      actionLabel={t("common:delete")}
      onAction={handleDelete}
    />
  )
}
```

### 10.8 Barrel (`index.ts`)

Export only what the module actually contains:

```ts
export { FooBarsTable } from "./foo-bars-table"
export { FooBarDetail } from "./foo-bars-detail"
export { FooBarCreateDialog } from "./foo-bars-create-dialog"
export { FooBarEditDialog } from "./foo-bars-edit-dialog"
export { FooBarDeleteDialog } from "./foo-bars-delete-dialog"
export { FooBarsLoadingState } from "./foo-bars-loading-state"
export { FooBarsErrorState } from "./foo-bars-error-state"
```

---

## 11. Page Layout Patterns

The page is a **pure layout orchestrator**: it owns state, calls hooks, and wires module components together. It contains no UI markup beyond the layout shell. Choose the pattern that fits the design.

### 11.1 Table + Detail panel

Two resizable columns: list on the left, contextual detail on the right.

```tsx
import { useState } from "react"
import { useOrganization } from "@/contexts/organization-context"
import { useFooBars } from "@/hooks/useFooBars"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import { PageHeader } from "@/huemul/components/huemul-page-header"
import { SomeIcon } from "lucide-react"
import type { FooBar } from "@/types/foo-bars"
import {
  FooBarsTable, FooBarsLoadingState, FooBarsErrorState,
  FooBarDetail, FooBarCreateDialog, FooBarEditDialog, FooBarDeleteDialog,
} from "@/components/foo-bars"

interface PageState {
  searchTerm: string
  selectedItem: FooBar | null
  showCreateDialog: boolean
  editingItem: FooBar | null
  deletingItem: FooBar | null
}

export default function FooBarsPage() {
  const { selectedOrganizationId } = useOrganization()
  const orgId = selectedOrganizationId ?? ""

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [state, setState] = useState<PageState>({
    searchTerm: "", selectedItem: null,
    showCreateDialog: false, editingItem: null, deletingItem: null,
  })

  const { data, isLoading, isFetching, error, refetch } = useFooBars(orgId, {
    page, pageSize, search: state.searchTerm || undefined,
  })

  const { showPageLoader, isTableLoading, isTableFetching } = useTableLoadingState({
    isLoading, isFetching, hasData: !!data,
  })

  const items = data?.data ?? []

  if (showPageLoader) return <FooBarsLoadingState />

  return (
    <>
      <HuemulPageLayout
        columns={[
          {
            content: (
              <>
                <PageHeader
                  icon={SomeIcon}
                  title={t("header.title")}
                  primaryAction={{ label: t("header.addItem"), onClick: () => setState((s) => ({ ...s, showCreateDialog: true })) }}
                  searchConfig={{ placeholder: t("header.searchPlaceholder"), value: state.searchTerm, onChange: (v) => { setState((s) => ({ ...s, searchTerm: v })); setPage(1) } }}
                />
                {error ? (
                  <FooBarsErrorState error={error} onRetry={() => refetch()} />
                ) : (
                  <FooBarsTable
                    items={items}
                    isLoading={isTableLoading}
                    isFetching={isTableFetching}
                    searchTerm={state.searchTerm}
                    onEdit={(item) => setState((s) => ({ ...s, editingItem: item }))}
                    onDelete={(item) => setState((s) => ({ ...s, deletingItem: item }))}
                    pagination={{
                      page, pageSize, hasNext: data?.has_next ?? false,
                      onPageChange: setPage,
                      onPageSizeChange: (size) => { setPageSize(size); setPage(1) },
                      pageSizeOptions: [10, 25, 50],
                    }}
                  />
                )}
              </>
            ),
            defaultSize: 40,
            minSize: 25,
          },
          {
            content: <FooBarDetail item={state.selectedItem} />,
            defaultSize: 60,
            minSize: 30,
          },
        ]}
      />

      <FooBarCreateDialog open={state.showCreateDialog} onOpenChange={(open) => setState((s) => ({ ...s, showCreateDialog: open }))} organizationId={orgId} />
      <FooBarEditDialog open={!!state.editingItem} onOpenChange={(open) => !open && setState((s) => ({ ...s, editingItem: null }))} organizationId={orgId} item={state.editingItem} />
      <FooBarDeleteDialog
        open={!!state.deletingItem}
        onOpenChange={(open) => !open && setState((s) => ({ ...s, deletingItem: null }))}
        organizationId={orgId}
        item={state.deletingItem}
        onDeleted={() => setState((s) => ({
          ...s, deletingItem: null,
          selectedItem: s.selectedItem?.id === s.deletingItem?.id ? null : s.selectedItem,
        }))}
      />
    </>
  )
}
```

### 11.2 Single-column (full-page)

Use when there is no detail panel — e.g. a settings page, a dashboard, or a page with cards.

```tsx
import { useOrganization } from "@/contexts/organization-context"
import { useFooBars } from "@/hooks/useFooBars"
import { PageHeader } from "@/huemul/components/huemul-page-header"
import { SomeIcon } from "lucide-react"
import { FooBarsLoadingState, FooBarsErrorState } from "@/components/foo-bars"

export default function FooBarsPage() {
  const { selectedOrganizationId } = useOrganization()
  const orgId = selectedOrganizationId ?? ""
  const { data, isLoading, error, refetch } = useFooBars(orgId)

  if (isLoading) return <FooBarsLoadingState />

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader icon={SomeIcon} title={t("header.title")} />
      <div className="flex-1 overflow-auto p-6">
        {error ? (
          <FooBarsErrorState error={error} onRetry={() => refetch()} />
        ) : (
          // render cards, grids, or any other layout here
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data?.data.map((item) => (
              <FooBarCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

### 11.3 Tabs layout

Use when the module groups unrelated sections under a single page.

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function FooBarsPage() {
  return (
    <div className="h-full flex flex-col bg-background p-6 overflow-hidden">
      <PageHeader icon={SomeIcon} title={t("header.title")} />
      <Tabs defaultValue="list" className="flex-1 flex flex-col min-h-0 mt-4">
        <TabsList className="shrink-0">
          <TabsTrigger value="list">{t("tabs.list")}</TabsTrigger>
          <TabsTrigger value="settings">{t("tabs.settings")}</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="flex-1 min-h-0 flex flex-col mt-4">
          {/* list section component */}
        </TabsContent>
        <TabsContent value="settings" className="flex-1 min-h-0 flex flex-col mt-4">
          {/* settings section component */}
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

---

## 12. Register route in `src/App.tsx`

```tsx
import { Edit2, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { FooBar } from "@/types/foo-bars"
import {
  HuemulTable,
  type HuemulTableColumn,
  type HuemulTableAction,
  type HuemulTablePagination,
} from "@/huemul/components/huemul-table"
import { Badge } from "@/components/ui/badge"

interface FooBarsTableProps {
  items: FooBar[]
  onEdit: (item: FooBar) => void
  onDelete: (item: FooBar) => void
  isLoading?: boolean
  isFetching?: boolean
  pagination?: HuemulTablePagination
  searchTerm?: string
}

export function FooBarsTable({ items, onEdit, onDelete, isLoading, isFetching, pagination, searchTerm = "" }: FooBarsTableProps) {
  const { t } = useTranslation(["foo-bars", "common"])

  const columns: HuemulTableColumn<FooBar>[] = [
    {
      key: "name",
      label: t("columns.name"),
      render: (item) => <span className="text-xs font-medium text-foreground">{item.name}</span>,
    },
    {
      key: "status",
      label: t("columns.status"),
      render: (item) => (
        <Badge variant={item.status === "active" ? "default" : "secondary"} className="text-xs">
          {item.status === "active" ? t("common:active") : t("common:inactive")}
        </Badge>
      ),
    },
    {
      key: "updated_at",
      label: t("columns.updatedAt"),
      render: (item) => (
        <span className="text-xs text-muted-foreground">
          {new Date(item.updated_at).toLocaleDateString()}
        </span>
      ),
    },
  ]

  const actions: HuemulTableAction<FooBar>[] = [
    { key: "edit",   label: t("actions.edit"),   icon: Edit2,  onClick: onEdit,   separator: true },
    { key: "delete", label: t("actions.delete"), icon: Trash2, onClick: onDelete, destructive: true },
  ]

  return (
    <HuemulTable
      data={items}
      columns={columns}
      actions={actions}
      getRowKey={(item) => item.id}
      isLoading={isLoading}
      isFetching={isFetching}
      pagination={pagination}
      emptyState={{
        title: searchTerm ? t("emptyState.noResults") : t("emptyState.empty"),
        description: searchTerm ? undefined : t("list.emptyDescription"),
      }}
    />
  )
}
```

---

## 13. Settings dropdown in `src/components/layout/app-layout.tsx`

Add the menu item inside the **Administration** group:

```tsx
{(canAccessFooBars || isOrgAdmin) && (
  <DropdownMenuItem asChild>
    <Link to={buildPath("/foo-bars")} className="hover:cursor-pointer">
      {t('settings.fooBars')}
    </Link>
  </DropdownMenuItem>
)}
```

And add the corresponding translation in `src/i18n/locales/layout.ts`:

```ts
fooBars: { en: "Foo Bars", es: "Foo Bars" },
```

---

## 14. Critical rules (never skip)

| Rule | Reason |
|------|--------|
| **Default to Huemul components** | Every button, field, dialog, table must use a `huemul-*` component. Only create a new one for truly reusable patterns. |
| `placeholderData: (prev) => prev` in every list query | Keeps previous rows visible while fetching — required by `useTableLoadingState` |
| `useTableLoadingState` in any page with a list | Splits `isLoading`/`isFetching` into `showPageLoader`, `isTableLoading`, `isTableFetching` for correct UX |
| Mutations wrapped in `new Promise<void>` | Allows `HuemulDialog` / `HuemulAlertDialog` to handle loading/success/error states automatically |
| `useEffect` to pre-fill edit form when `item && open` | Prevents stale form data when reopening the dialog |
| `onDeleted` clears `selectedItem` if it was the deleted one | Prevents the detail panel from showing a ghost item |
| `hover:cursor-pointer` on all interactive elements | Project-wide CSS standard |
| All text via `useTranslation` — never hardcoded strings | i18n requirement |
| `"use client"` directive only on interactive components (dialogs, forms) | Consistency with existing components |
| Import from component barrel (`@/components/foo-bars`) not individual files | Cleaner imports |
| Namespace in `i18n/index.ts` uses kebab-case key matching the locale file name | Required by the `extractLang` helper |
| Only create components that the design actually requires | Avoid over-engineering; never generate a component because the template has it |
