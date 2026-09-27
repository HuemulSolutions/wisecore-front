# Wisecore — Guide for Adding Endpoints or a New Endpoints Module

This document defines the **structure and conventions** to follow when adding API endpoints in `wisecore-front`. Read it fully before generating any file.

There are two scenarios covered:
- **A** — Adding one or more endpoints to an **existing** service file.
- **B** — Creating a **new** endpoints module from scratch (new resource).

---

## Core concepts

### `httpClient`

All HTTP calls go through `httpClient` from `@/lib/http-client`. Never use `fetch` directly.

Available methods:
```ts
httpClient.get(url, options?)
httpClient.post(url, body?, options?)
httpClient.put(url, body?, options?)
httpClient.patch(url, body?, options?)
httpClient.delete(url, options?)
```

`options` is a standard `RequestInit` object — commonly used to pass extra headers.

### `backendUrl`

Base URL for all API calls. Always import from `@/config`:

```ts
import { backendUrl } from '@/config'
// backendUrl = import.meta.env.VITE_API_URL
```

### Organization-scoped requests

Most endpoints are scoped to an organization and require the `X-Org-Id` header. The `httpClient` injects the stored organization ID automatically, but when calling endpoints on behalf of a **specific** org (e.g., from a service function that receives `organizationId` as a parameter), pass it explicitly to override the stored value:

```ts
headers: { 'X-Org-Id': organizationId }
```

### Global (non-org) requests

Endpoints that operate at the platform level (users, organizations, auth, llm providers) do **not** pass `X-Org-Id`. The `httpClient` selects the correct token automatically based on the URL.

---

## File locations

| Layer | Path |
|---|---|
| Types | `src/types/<resource>.ts` (flat) or `src/types/<resource>/` (subdirectory — see note below) |
| Service (raw API calls) | `src/services/<resource>.ts` |
| TanStack Query hooks | `src/hooks/use<Resource>.ts` |

> **Subdirectory modules:** If the resource already has a `src/types/<resource>/` subdirectory (e.g. `assets/`, `execution/`), add new types to the appropriate sub-file inside it (`core.ts` for entity types, `hooks.ts` for `Use*Options` interfaces) rather than creating a new flat file.

---

## Scenario A — Adding endpoints to an existing service

### 1. Add the function to `src/services/<resource>.ts`

Follow the exact signature style of existing functions in that file. Use `async/await` and return typed values.

**Org-scoped endpoint example (GET list with pagination + filters):**
```ts
export async function getFooBars(
  organizationId: string,
  params: GetFooBarsParams = {},
): Promise<FooBarsResponse> {
  const { page = 1, page_size = 50, search, status } = params

  const query = new URLSearchParams({
    page: page.toString(),
    page_size: page_size.toString(),
  })
  if (search?.trim()) query.set('search', search.trim())
  if (status) query.set('status', status)

  const response = await httpClient.get(`${BASE_URL}/?${query}`, {
    headers: { 'X-Org-Id': organizationId },
  })
  return response.json() as Promise<FooBarsResponse>
}
```

**Org-scoped endpoint example (GET single item):**
```ts
export async function getFooBar(
  organizationId: string,
  fooBarId: string,
): Promise<FooBar> {
  const response = await httpClient.get(`${BASE_URL}/${fooBarId}`, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as FooBarResponse
  return data.data
}
```

**Org-scoped endpoint example (POST create):**
```ts
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
```

**Org-scoped endpoint example (PUT update):**
```ts
export async function updateFooBar(
  organizationId: string,
  fooBarId: string,
  body: UpdateFooBarRequest,
): Promise<FooBar> {
  const response = await httpClient.put(`${BASE_URL}/${fooBarId}`, body, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as FooBarResponse
  return data.data
}
```

**Org-scoped endpoint example (DELETE):**
```ts
export async function deleteFooBar(
  organizationId: string,
  fooBarId: string,
): Promise<void> {
  await httpClient.delete(`${BASE_URL}/${fooBarId}`, {
    headers: { 'X-Org-Id': organizationId },
  })
}
```

**Global endpoint example (no org header):**
```ts
export async function getAllFooBars(page = 1, pageSize = 10, search?: string) {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  })
  if (search?.trim()) params.set('search', search.trim())
  const response = await httpClient.get(`${backendUrl}/foo-bars?${params}`)
  return response.json()
}
```

### 2. Add or update request/response types

Only add what the new endpoint needs. Do not touch types that aren't affected.

- **Flat module** (`src/types/<resource>.ts`): add the new interfaces directly to the file.
- **Subdirectory module** (`src/types/<resource>/`): add entity/request types to `core.ts`, hook option types (`Use*Options`) to `hooks.ts`. Import cross-file dependencies with relative paths (`from './core'`).

### 3. Add or update TanStack Query hooks in `src/hooks/use<Resource>.ts`

**New `useQuery` hook:**
```ts
export function useFooBar(organizationId: string, fooBarId: string) {
  return useQuery({
    queryKey: fooBarQueryKeys.detail(organizationId, fooBarId),
    queryFn: () => getFooBar(organizationId, fooBarId),
    enabled: !!organizationId && !!fooBarId,
    staleTime: 2 * 60 * 1000,
    retry: 0,
  })
}
```

**New mutation added to `useFooBarMutations`:**
```ts
const patchMutation = useMutation({
  mutationFn: ({ fooBarId, body }: { fooBarId: string; body: PatchFooBarRequest }) =>
    patchFooBar(organizationId, fooBarId, body),
  onSuccess: (_data, { fooBarId }) => {
    invalidateList()
    queryClient.invalidateQueries({
      queryKey: fooBarQueryKeys.detail(organizationId, fooBarId),
    })
  },
})
```

---

## Scenario B — Creating a new endpoints module

For a resource called `foo-bars` (replace throughout):

> **Important:** Each file listed below must be created as its own **new, standalone file** at the exact path shown. Do **not** add the code into an existing file that seems related (e.g., do not append types to an existing types file, or merge a new service into an existing service file). One resource = one dedicated file per layer.

### File checklist

| # | File | Action |
|---|------|--------|
| 1 | `src/types/foo-bars.ts` | **Create new file** — TypeScript interfaces |
| 2 | `src/services/foo-bars.ts` | **Create new file** — raw API calls |
| 3 | `src/hooks/useFooBars.ts` | **Create new file** — TanStack Query hooks |

---

### Step 1 — Types (`src/types/foo-bars.ts`)

```ts
// Constrained string fields
export type FooBarStatus = 'active' | 'inactive'

// Main entity — must match backend response shape exactly
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
  total?: number
}

// Single-item response wrapper
export interface FooBarResponse {
  data: FooBar
  transaction_id: string
}

// Query params for list endpoint
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
  name?: string
  status?: FooBarStatus
}
```

---

### Step 2 — Service (`src/services/foo-bars.ts`)

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

export async function getFooBars(
  organizationId: string,
  params: GetFooBarsParams = {},
): Promise<FooBarsResponse> {
  const { page = 1, page_size = 50, search, status } = params
  const query = new URLSearchParams({
    page: page.toString(),
    page_size: page_size.toString(),
  })
  if (search?.trim()) query.set('search', search.trim())
  if (status) query.set('status', status)
  const response = await httpClient.get(`${BASE_URL}/?${query}`, {
    headers: { 'X-Org-Id': organizationId },
  })
  return response.json() as Promise<FooBarsResponse>
}

export async function getFooBar(
  organizationId: string,
  fooBarId: string,
): Promise<FooBar> {
  const response = await httpClient.get(`${BASE_URL}/${fooBarId}`, {
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
  fooBarId: string,
  body: UpdateFooBarRequest,
): Promise<FooBar> {
  const response = await httpClient.put(`${BASE_URL}/${fooBarId}`, body, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as FooBarResponse
  return data.data
}

export async function deleteFooBar(
  organizationId: string,
  fooBarId: string,
): Promise<void> {
  await httpClient.delete(`${BASE_URL}/${fooBarId}`, {
    headers: { 'X-Org-Id': organizationId },
  })
}

export type { FooBar, FooBarsResponse }
```

---

### Step 3 — TanStack Query hooks (`src/hooks/useFooBars.ts`)

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getFooBars,
  getFooBar,
  createFooBar,
  updateFooBar,
  deleteFooBar,
} from '@/services/foo-bars'
import type {
  FooBarStatus,
  CreateFooBarRequest,
  UpdateFooBarRequest,
} from '@/types/foo-bars'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const fooBarQueryKeys = {
  all: ['foo-bars'] as const,
  listBase: () => [...fooBarQueryKeys.all, 'list'] as const,
  detail: (organizationId: string, fooBarId: string) =>
    [...fooBarQueryKeys.all, 'detail', organizationId, fooBarId] as const,
  list: (
    organizationId: string,
    page: number,
    pageSize: number,
    search?: string,
    status?: FooBarStatus,
  ) =>
    [
      ...fooBarQueryKeys.listBase(),
      organizationId,
      page,
      pageSize,
      search ?? '',
      status ?? '',
    ] as const,
}

// ─── Options ──────────────────────────────────────────────────────────────────

export interface UseFooBarsOptions {
  enabled?: boolean
  page?: number
  pageSize?: number
  search?: string
  status?: FooBarStatus
}

// ─── List query ───────────────────────────────────────────────────────────────

export function useFooBars(organizationId: string, options: UseFooBarsOptions = {}) {
  const { enabled = true, page = 1, pageSize = 50, search, status } = options

  return useQuery({
    queryKey: fooBarQueryKeys.list(organizationId, page, pageSize, search, status),
    queryFn: () => getFooBars(organizationId, { page, page_size: pageSize, search, status }),
    enabled: enabled && !!organizationId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,  // Required when feeding a HuemulTable
    retry: 0,
  })
}

// ─── Detail query ─────────────────────────────────────────────────────────────

export function useFooBar(organizationId: string, fooBarId: string) {
  return useQuery({
    queryKey: fooBarQueryKeys.detail(organizationId, fooBarId),
    queryFn: () => getFooBar(organizationId, fooBarId),
    enabled: !!organizationId && !!fooBarId,
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
    mutationFn: ({ fooBarId, body }: { fooBarId: string; body: UpdateFooBarRequest }) =>
      updateFooBar(organizationId, fooBarId, body),
    onSuccess: (_data, { fooBarId }) => {
      invalidateList()
      queryClient.invalidateQueries({
        queryKey: fooBarQueryKeys.detail(organizationId, fooBarId),
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (fooBarId: string) => deleteFooBar(organizationId, fooBarId),
    onSuccess: (_data, fooBarId) => {
      invalidateList()
      queryClient.removeQueries({
        queryKey: fooBarQueryKeys.detail(organizationId, fooBarId),
      })
    },
  })

  return {
    createFooBar: createMutation,
    updateFooBar: updateMutation,
    deleteFooBar: deleteMutation,
  }
}
```

---

## Rules & conventions

### Service file rules
- One `BASE_URL` constant per service file: `const BASE_URL = \`${backendUrl}/<resource>\``
- Always import `backendUrl` from `@/config` and `httpClient` from `@/lib/http-client`.
- All functions are named `async function` (not arrow functions at top level).
- Do not add `Content-Type: application/json` manually — `httpClient` injects it automatically for requests with a body.
- For list endpoints: always build query string with `URLSearchParams`. Guard optional string filters with `.trim()` before appending.
- For single-item and mutation endpoints: unwrap `data.data` before returning.
- For DELETE endpoints: return `Promise<void>` — do not try to parse the response body.
- Re-export the primary entity type and response type at the bottom of the service file.

### Hook file rules
- Every module with a list view **must** define a `queryKeys` object with `all`, `listBase()`, `list(...)`, and `detail(...)` keys. This enables precise cache invalidation.
- `staleTime: 2 * 60 * 1000` and `gcTime: 5 * 60 * 1000` are the project defaults.
- `retry: 0` — do not retry failed requests automatically.
- Any query that feeds a `HuemulTable` must include `placeholderData: (prev) => prev`. This preserves data visually while paginating or filtering.
- All mutations for a single resource are grouped in one `useFooBarMutations(organizationId)` hook.
- After a successful create/update/delete: always call `invalidateList()`. After update/delete: also invalidate/remove the detail query.
- The mutation hook returns an object whose keys are verb-prefixed: `createFooBar`, `updateFooBar`, `deleteFooBar`.

### Type file rules
- Types must match the backend response shape exactly — do not rename fields.
- Constrained string values (status enums, etc.) must use union types, not `enum`.
- Always define separate request types for create (`CreateFooBarRequest`) and update (`UpdateFooBarRequest`). Update types typically have all fields optional.
- Always define a paginated list response type (`FooBarsResponse`) and a single-item response wrapper (`FooBarResponse`) when the backend wraps the payload in `{ data: T }`.

---

## Quick reference — which token / header is used?

| Endpoint type | `X-Org-Id` header | Token injected by httpClient |
|---|---|---|
| Org-scoped resource | Pass explicitly from service function | `organizationToken` (falls back to `loginToken`) |
| Global admin (users, orgs, llm providers) | Not passed | `loginToken` (detected by URL pattern) |
| Auth endpoints (`/auth/*`) | Not passed | `loginToken` |

> The `httpClient` detects these patterns automatically based on the URL. Service functions only need to decide whether to pass `X-Org-Id`.
