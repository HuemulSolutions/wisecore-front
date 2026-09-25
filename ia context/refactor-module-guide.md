# Wisecore — Guide for Refactoring Existing Modules

This document is the **refactoring companion** to `new-module-guide.md`. Use it to bring an existing module in line with the current conventions without breaking it. Read both documents before touching any file.

> **Principle:** Refactor incrementally. Each section below is independent — you can apply them one at a time. Always verify the module still works after each step.

---

## 0. Quick audit checklist

Run through this checklist before starting. Each `[ ]` that fails is a refactoring task.

```
Core layer
[ ] src/types/<module>.ts  or  src/types/<module>/   — dedicated types file or subdirectory (not embedded in service)
[ ]   src/types/<module>/hooks.ts                    — Use*Options / Use*Props / Use*Return (if module has TanStack Query hooks)
[ ] src/services/<module>.ts       — uses httpClient, sends X-Org-Id header when org-scoped
[ ] src/hooks/use<Module>.ts       — TanStack Query hooks, placeholderData on list queries
[ ] src/i18n/locales/<module>.ts   — all UI strings covered
[ ] src/i18n/index.ts              — namespace registered

Component layer (src/components/<module>/)
[ ] index.ts                       — barrel re-exports every public component
[ ] <module>-loading-state.tsx     — renders <PageSkeleton />
[ ] <module>-error-state.tsx       — shows message + retry button
[ ] <module>-table.tsx             — uses HuemulTable (if list view exists)
[ ] dialogs use HuemulDialog / HuemulAlertDialog
[ ] mutations wrapped in new Promise<void>
[ ] edit dialog prefills via useEffect when item && open

Page (src/pages/<module>.tsx)
[ ] uses HuemulPageLayout (multi-column) or bare flex container (single-column)
[ ] single PageState object (no scattered useState calls)
[ ] imports from barrel (@/components/<module>), not individual files
[ ] PageHeader used directly — no separate *-page-header.tsx wrapper
[ ] useTableLoadingState drives showPageLoader / isTableLoading / isTableFetching
[ ] no toast.success / toast.error calls in the page — dialogs own that
```

---

## 1. Types — extract from service into a dedicated file

**When:** The module's types live inside the service file or have no dedicated `src/types/<module>.ts` (or `src/types/<module>/`).

**After** — create `src/types/<module>.ts` (flat, for new or simple modules):
```ts
// src/types/auth-types.ts
export type AuthTypeKind = 'internal' | 'entra'

export interface AuthType {
  id: string
  name: string
  type: AuthTypeKind
  created_at: string
  updated_at: string
}

// ... request/response interfaces
```

**Subdirectory:** If the module also needs dialog props, sheet props, or hook option types, migrate to `src/types/<module>/` — see `docs/consolidate-types-subdirectory-guide.md`.

**Example structure:**
```
src/types/document-type-relationships/
  index.ts        ← barrel: export * from './core', './dialogs', './components', './hooks'
  core.ts         ← DocumentTypeRelationship, *Response, *Request types
  dialogs.ts      ← RelationshipCreateDialogProps, RelationshipFormData, AttributesDialogProps
  components.ts   ← RelationshipsCanvasProps, AssetTypeSidebarProps
  hooks.ts        ← UseDocumentTypeRelationshipsOptions
```

Place entity types in `core.ts`, dialog/form props in `dialogs.ts`, and `Use*Options` interfaces in `hooks.ts`.

Then update the service and hooks to import from `@/types/<module>` instead of defining inline.

---

## 2. Service — align to standard shape

**Checklist:**
- Uses `httpClient` (not raw `fetch` or `axios`).
- Org-scoped endpoints send `'X-Org-Id': organizationId` header.
- Functions accept `organizationId` as the **first** argument.
- Response unwrapping (`data.data`) happens inside the service, not in hooks or components.

**Before** (anti-patterns to fix):
```ts
// ❌ Raw fetch
const res = await fetch(`${BASE_URL}/auth-types`, { headers: { Authorization: `Bearer ${token}` } })

// ❌ Returning the full envelope instead of the inner data
export async function getAuthType(id: string): Promise<AuthTypeResponse> { ... }

// ❌ No org header on an org-scoped endpoint
const res = await httpClient.get(`${BASE_URL}/auth-types`)
```

**After:**
```ts
import { backendUrl } from '@/config'
import { httpClient } from '@/lib/http-client'
import type { AuthType, AuthTypesResponse, AuthTypeResponse, CreateAuthTypeRequest, UpdateAuthTypeRequest } from '@/types/auth-types'

const BASE_URL = `${backendUrl}/auth-types`

export async function getAuthTypes(organizationId: string): Promise<AuthTypesResponse> {
  const res = await httpClient.get(`${BASE_URL}/`, { headers: { 'X-Org-Id': organizationId } })
  return res.json() as Promise<AuthTypesResponse>
}

export async function getAuthType(organizationId: string, id: string): Promise<AuthType> {
  const res = await httpClient.get(`${BASE_URL}/${id}`, { headers: { 'X-Org-Id': organizationId } })
  const data = (await res.json()) as AuthTypeResponse
  return data.data           // ✅ unwrap here
}
```

> **Global (non-org-scoped) services** omit the `organizationId` parameter and the `X-Org-Id` header entirely.

---

## 3. Hooks — add `placeholderData` and align query keys

### 3.1 `placeholderData` on every list query

**Why:** Without it, `HuemulTable` shows skeleton rows on every page/search change.

```ts
// ❌ Missing
export function useAuthTypes(options = {}) {
  return useQuery({
    queryKey: ['auth-types', options],
    queryFn: () => getAuthTypes(orgId, options),
  })
}

// ✅ Fixed
export function useAuthTypes(organizationId: string, options: UseAuthTypesOptions = {}) {
  const { enabled = true, page = 1, pageSize = 50, search } = options
  return useQuery({
    queryKey: authTypeQueryKeys.list(organizationId, page, pageSize, search),
    queryFn: () => getAuthTypes(organizationId, { page, page_size: pageSize, search }),
    enabled: enabled && !!organizationId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,   // ← required
    retry: 0,
  })
}
```

### 3.2 Structured query keys

```ts
export const authTypeQueryKeys = {
  all: ['auth-types'] as const,
  listBase: () => [...authTypeQueryKeys.all, 'list'] as const,
  list: (orgId: string, page: number, pageSize: number, search?: string) =>
    [...authTypeQueryKeys.listBase(), orgId, page, pageSize, search ?? ''] as const,
  detail: (orgId: string, id: string) =>
    [...authTypeQueryKeys.all, 'detail', orgId, id] as const,
}
```

### 3.3 Extract a `use<Module>Mutations` function

If mutations are scattered across the page or individual components, consolidate them:

```ts
export function useAuthTypeMutations(organizationId: string) {
  const queryClient = useQueryClient()
  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: authTypeQueryKeys.listBase() })

  const createMutation = useMutation({
    mutationFn: (body: CreateAuthTypeRequest) => createAuthType(organizationId, body),
    onSuccess: invalidateList,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateAuthTypeRequest }) =>
      updateAuthType(organizationId, id, body),
    onSuccess: (_data, { id }) => {
      invalidateList()
      queryClient.invalidateQueries({ queryKey: authTypeQueryKeys.detail(organizationId, id) })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAuthType(organizationId, id),
    onSuccess: (_data, id) => {
      invalidateList()
      queryClient.removeQueries({ queryKey: authTypeQueryKeys.detail(organizationId, id) })
    },
  })

  return { createAuthType: createMutation, updateAuthType: updateMutation, deleteAuthType: deleteMutation }
}
```

---

## 4. i18n — cover all strings

### 4.1 Ensure the namespace is registered

In `src/i18n/index.ts`, confirm two things exist:

```ts
// 1. Import at top
import authTypes from './locales/auth-types'

// 2. Entry in modules object
const modules = {
  // ...
  'auth-types': authTypes,
} as const
```

### 4.2 Move hardcoded strings into the locale file

```ts
// ❌ Hardcoded in component
<p>No authentication types found</p>

// ✅ Via i18n
const { t } = useTranslation('auth-types')
<p>{t('emptyState.empty')}</p>
```

### 4.3 Required locale sections

Every module locale must have at minimum:

```ts
const translations = {
  header: { title, addItem, searchPlaceholder },
  columns: { /* one key per column */ },
  emptyState: { empty, noResults },
  errorState: { failedToLoad, errorDescription },
  create: { title, submitLabel, success },
  edit: { title, submitLabel, success },
  delete: { title, description, confirmLabel },
  actions: { edit, delete },
}
```

---

## 5. Component layer — align individual files

### 5.1 Add missing loading state

If the module has no loading component, add one:

```tsx
// src/components/auth-types/auth-types-loading-state.tsx
import { PageSkeleton } from "@/components/ui/page-skeleton"

export function AuthTypesLoadingState() {
  return <PageSkeleton />
}
```

### 5.2 Add missing error state

```tsx
// src/components/auth-types/auth-types-error-state.tsx
import { RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { HuemulButton } from "@/huemul/components/huemul-button"

interface AuthTypesErrorStateProps {
  error?: unknown
  onRetry?: () => void
}

export function AuthTypesErrorState({ error, onRetry }: AuthTypesErrorStateProps) {
  const { t } = useTranslation(["auth-types", "common"])
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

### 5.3 Replace a custom `*-page-header.tsx` with `PageHeader` inline

Many older modules have a thin wrapper component around `PageHeader` that doesn't add value. Delete it and use `PageHeader` directly in the page.

**Before** — `auth-types-search.tsx` (separate file, 40 lines):
```tsx
// ❌ Thin wrapper that only passes props through
export function AuthTypesSearch({ searchTerm, onSearchChange, ... }) {
  return <PageHeader icon={Shield} title={t('header.title')} ... />
}
```

**After** — inline in the page:
```tsx
// ✅ Use PageHeader directly inside the page
<PageHeader
  icon={Shield}
  title={t("header.title")}
  primaryAction={{ label: t("header.addItem"), onClick: openCreateDialog }}
  searchConfig={{ placeholder: t("header.searchPlaceholder"), value: state.searchTerm, onChange: onSearchChange }}
/>
```

Then delete the wrapper file and remove its export from `index.ts`.

### 5.4 Migrate dialogs to use `HuemulDialog` / `HuemulAlertDialog`

**Before** (raw Radix Dialog with manual state):
```tsx
// ❌ Raw shadcn dialog + manual isLoading state
export function CreateAuthTypeDialog({ open, onOpenChange }) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      await createAuthType(body)
      toast.success("Created!")
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        ...
        <Button disabled={isLoading} onClick={handleSubmit}>Save</Button>
      </DialogContent>
    </Dialog>
  )
}
```

**After** (`HuemulDialog` owns loading/success/error):
```tsx
// ✅ HuemulDialog manages loading and error automatically
export function CreateAuthTypeDialog({ open, onOpenChange, organizationId }) {
  const { t } = useTranslation(["auth-types", "common"])
  const [formData, setFormData] = useState<CreateAuthTypeRequest>({ name: "", type: "internal" })
  const { createAuthType } = useAuthTypeMutations(organizationId)

  const handleSubmit = async () => {
    await new Promise<void>((resolve, reject) => {
      createAuthType.mutate(formData, {
        onSuccess: () => { setFormData({ name: "", type: "internal" }); resolve() },
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
      saveAction={{ label: t("create.submitLabel"), onClick: handleSubmit }}
    >
      <HuemulFieldGroup className="py-2">
        <HuemulField label={t("columns.name")} name="name" value={formData.name}
          onChange={(v) => setFormData((p) => ({ ...p, name: v as string }))} required />
      </HuemulFieldGroup>
    </HuemulDialog>
  )
}
```

### 5.5 Migrate delete dialogs to `HuemulAlertDialog`

```tsx
// ✅ HuemulAlertDialog for destructive actions
export function DeleteAuthTypeDialog({ open, onOpenChange, organizationId, item }) {
  const { t } = useTranslation(["auth-types", "common"])
  const { deleteAuthType } = useAuthTypeMutations(organizationId)

  const handleDelete = async () => {
    if (!item) return
    await new Promise<void>((resolve, reject) => {
      deleteAuthType.mutate(item.id, {
        onSuccess: () => resolve(),
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

### 5.6 Ensure `HuemulTable` has `searchTerm` for empty-state logic

```tsx
// ❌ Always shows the same empty message
emptyState={{ title: t("emptyState.empty") }}

// ✅ Differentiates search-empty from no-data-empty
emptyState={{
  title: searchTerm ? t("emptyState.noResults") : t("emptyState.empty"),
  description: searchTerm ? undefined : t("list.emptyDescription"),
}}
```

### 5.7 Add/update the barrel `index.ts`

```ts
// src/components/auth-types/index.ts
export { AuthTypesTable } from "./auth-types-table"
export { AuthTypesLoadingState } from "./auth-types-loading-state"
export { AuthTypesErrorState } from "./auth-types-error-state"
export { CreateAuthTypeDialog } from "./auth-types-create-dialog"
export { EditAuthTypeDialog } from "./auth-types-edit-dialog"
export { DeleteAuthTypeDialog } from "./auth-types-delete-dialog"
// Only export components that exist — never export a file that doesn't exist
```

---

## 6. Page — consolidate state and layout

### 6.1 Replace scattered `useState` with a single `PageState`

**Before:**
```tsx
// ❌ Scattered state
const [inputSearch, setInputSearch] = useState("")
const [searchTerm, setSearchTerm] = useState("")
const [page, setPage] = useState(1)
const [pageSize, setPageSize] = useState(10)
const [editingAuthType, setEditingAuthType] = useState<AuthType | null>(null)
const [deletingAuthType, setDeletingAuthType] = useState<AuthType | null>(null)
const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
const [isRefreshing, setIsRefreshing] = useState(false)
```

**After:**
```tsx
// ✅ Single state object (pagination is separate — it's passed to HuemulTable)
interface PageState {
  searchTerm: string
  showCreateDialog: boolean
  editingItem: AuthType | null
  deletingItem: AuthType | null
}

const [page, setPage] = useState(1)
const [pageSize, setPageSize] = useState(10)
const [state, setState] = useState<PageState>({
  searchTerm: "",
  showCreateDialog: false,
  editingItem: null,
  deletingItem: null,
})
```

### 6.2 Use `HuemulPageLayout` for multi-column pages

**Before:**
```tsx
// ❌ Manual flex/grid layout
<div className="min-h-screen bg-background p-4 md:p-6">
  <div className="mx-auto">
    ...
  </div>
</div>
```

**After (two-column with resizable panes):**
```tsx
<HuemulPageLayout
  columns={[
    {
      content: (
        <>
          <PageHeader ... />
          {error ? <ErrorState /> : <Table ... />}
        </>
      ),
      defaultSize: 40,
      minSize: 25,
    },
    {
      content: <DetailPanel item={state.selectedItem} />,
      defaultSize: 60,
      minSize: 30,
    },
  ]}
/>
```

**After (single-column):**
```tsx
<div className="h-full flex flex-col overflow-hidden">
  <PageHeader ... />
  <div className="flex-1 overflow-auto p-6">
    {error ? <ErrorState /> : <Table ... />}
  </div>
</div>
```

### 6.3 Switch all imports to the barrel

```tsx
// ❌ Direct file imports
import { CreateAuthTypeDialog } from "@/components/auth-types/auth-types-create-dialog"
import { AuthTypesTable }       from "@/components/auth-types/auth-types-table"

// ✅ Barrel imports
import {
  AuthTypesTable,
  AuthTypesLoadingState,
  AuthTypesErrorState,
  CreateAuthTypeDialog,
  EditAuthTypeDialog,
  DeleteAuthTypeDialog,
} from "@/components/auth-types"
```

### 6.4 Remove `toast` calls from the page

The page should **not** call `toast.success` / `toast.error`. Dialogs own that via `HuemulDialog`'s built-in success/error handling. If you need a toast after a delete, put it in `onDeleted` only if the dialog cannot handle it.

```tsx
// ❌ Toast in page
const handleRefresh = async () => {
  setIsRefreshing(true)
  try {
    await refetch()
    toast.success(t('dataRefreshed'))   // ← move this out
  } finally {
    setIsRefreshing(false)
  }
}

// ✅ PageHeader handles refresh loading state; no toast needed
<PageHeader
  onRefresh={refetch}
  isLoading={isFetching}
  ...
/>
```

### 6.5 Client-side pagination → server-side pagination

If the page currently slices the data array manually:

```tsx
// ❌ Client-side slice
const pagedAuthTypes = useMemo(
  () => authTypes.slice((page - 1) * pageSize, page * pageSize),
  [authTypes, page, pageSize]
)
```

Move pagination parameters into the query:

```tsx
// ✅ Server-side pagination
const { data, isLoading, isFetching, error, refetch } = useAuthTypes(orgId, {
  page,
  pageSize,
  search: state.searchTerm || undefined,
})
const items = data?.data ?? []
// Pass data?.has_next to the table's pagination prop
```

Update the hook to accept `page` / `pageSize` and forward them to the service.

---

## 7. Full page example after refactor

```tsx
// src/pages/auth-types.tsx
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Shield } from "lucide-react"
import { useOrganization } from "@/contexts/organization-context"
import { useAuthTypes } from "@/hooks/useAuthTypes"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { PageHeader } from "@/huemul/components/huemul-page-header"
import type { AuthType } from "@/types/auth-types"
import {
  AuthTypesTable,
  AuthTypesLoadingState,
  AuthTypesErrorState,
  CreateAuthTypeDialog,
  EditAuthTypeDialog,
  DeleteAuthTypeDialog,
} from "@/components/auth-types"

interface PageState {
  searchTerm: string
  showCreateDialog: boolean
  editingItem: AuthType | null
  deletingItem: AuthType | null
}

export default function AuthTypesPage() {
  const { t } = useTranslation("auth-types")
  const { selectedOrganizationId } = useOrganization()
  const orgId = selectedOrganizationId ?? ""

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [state, setState] = useState<PageState>({
    searchTerm: "",
    showCreateDialog: false,
    editingItem: null,
    deletingItem: null,
  })

  const { data, isLoading, isFetching, error, refetch } = useAuthTypes(orgId, {
    page,
    pageSize,
    search: state.searchTerm || undefined,
  })

  const { showPageLoader, isTableLoading, isTableFetching } = useTableLoadingState({
    isLoading,
    isFetching,
    hasData: !!data,
  })

  if (showPageLoader) return <AuthTypesLoadingState />

  const items = data?.data ?? []

  return (
    <>
      <div className="h-full flex flex-col overflow-hidden">
        <PageHeader
          icon={Shield}
          title={t("header.title")}
          primaryAction={{
            label: t("header.addItem"),
            onClick: () => setState((s) => ({ ...s, showCreateDialog: true })),
          }}
          searchConfig={{
            placeholder: t("header.searchPlaceholder"),
            value: state.searchTerm,
            onChange: (v) => { setState((s) => ({ ...s, searchTerm: v })); setPage(1) },
          }}
          onRefresh={refetch}
          isLoading={isFetching}
        />
        <div className="flex-1 overflow-auto">
          {error ? (
            <AuthTypesErrorState error={error} onRetry={() => refetch()} />
          ) : (
            <AuthTypesTable
              items={items}
              isLoading={isTableLoading}
              isFetching={isTableFetching}
              searchTerm={state.searchTerm}
              onEdit={(item) => setState((s) => ({ ...s, editingItem: item }))}
              onDelete={(item) => setState((s) => ({ ...s, deletingItem: item }))}
              pagination={{
                page,
                pageSize,
                hasNext: data?.has_next ?? false,
                onPageChange: setPage,
                onPageSizeChange: (size) => { setPageSize(size); setPage(1) },
                pageSizeOptions: [5, 10, 25],
              }}
            />
          )}
        </div>
      </div>

      <CreateAuthTypeDialog
        open={state.showCreateDialog}
        onOpenChange={(open) => setState((s) => ({ ...s, showCreateDialog: open }))}
        organizationId={orgId}
      />
      <EditAuthTypeDialog
        open={!!state.editingItem}
        onOpenChange={(open) => !open && setState((s) => ({ ...s, editingItem: null }))}
        organizationId={orgId}
        item={state.editingItem}
      />
      <DeleteAuthTypeDialog
        open={!!state.deletingItem}
        onOpenChange={(open) => !open && setState((s) => ({ ...s, deletingItem: null }))}
        organizationId={orgId}
        item={state.deletingItem}
        onDeleted={() => setState((s) => ({ ...s, deletingItem: null }))}
      />
    </>
  )
}
```

---

## 8. Files to delete after refactoring

After every step, remove files that are now superseded:

| Old file | Reason to delete |
|----------|-----------------|
| `*-page-header.tsx` | Replaced by `PageHeader` inline in the page |
| `*-search.tsx` (thin wrapper) | Replaced by `searchConfig` on `PageHeader` |
| `*-page-dialogs.tsx` | Dialog state belongs in the page, not a separate file |
| `*-page-empty-state.tsx` | Replaced by `emptyState` prop on `HuemulTable` |
| `*-content-empty-state.tsx` | Same as above |
| `*-page-skeleton.tsx` | Replaced by `*-loading-state.tsx` using `<PageSkeleton />` |
| `*-actions.tsx` | Actions defined inline in `HuemulTableAction[]` array inside the table component |
| `*-form-fields.tsx` | `HuemulField` instances live directly inside the dialog component |

> Only delete a file after confirming nothing else imports it. Run a workspace-wide search for the file name before deleting.

---

## 9. Critical rules (same as new module guide — never skip)

| Rule | Reason |
|------|--------|
| `placeholderData: (prev) => prev` on list queries | Prevents skeleton flash during pagination / search |
| `useTableLoadingState` in every page with a list | Provides correct `showPageLoader` / `isTableLoading` / `isTableFetching` signals |
| Mutations wrapped in `new Promise<void>` | Lets `HuemulDialog` / `HuemulAlertDialog` manage loading + error state |
| `useEffect` prefills edit form when `item && open` | Prevents stale form data on reopen |
| `onDeleted` clears `selectedItem` when it matches | Prevents detail panel from showing a deleted item |
| Import from barrel `@/components/<module>`, not individual files | Cleaner imports, easier future moves |
| All text via `useTranslation` | i18n requirement — zero hardcoded strings |
| No `toast.success` / `toast.error` in the page | Dialogs own success/error feedback |
| `hover:cursor-pointer` on interactive elements | Project-wide CSS standard |
