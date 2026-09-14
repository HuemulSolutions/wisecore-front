# Wisecore Frontend

**Version 1.0.97**

Wisecore is a multi-tenant, LLM-powered platform for generating, managing, and sharing organizational knowledge. This repository contains the frontend application, built with React, TypeScript, and Vite.

## Overview

Wisecore centralizes an organization's knowledge as **assets**, automates their generation through templated AI-driven executions, and moves them through a configurable review lifecycle. Core domain concepts:

- **Organization** — every piece of content is org-scoped; the app is multi-tenant and most routes carry an `/:orgId` prefix.
- **Asset** — the core unit of knowledge (what earlier versions of this app called a "document"). Assets live in a folder tree, can reference each other, and carry discussions, tags, and custom fields.
- **Asset type** — defines the structure, lifecycle, and templates available to a class of asset (e.g. "Policy", "Procedure").
- **Lifecycle** — the stages/steps an asset moves through, with per-section, per-step view/edit permissions.
- **Template / Section / Execution** — templates define reusable content structures; sections are AI-generated or manually authored pieces of an asset; an execution is a run that produces or updates content.
- **Workflow** — a form-like flow for collecting answers into an asset, shareable via a public link (either "each respondent creates their own asset" or "everyone answers the same execution").

## Key Features

### 🏠 Home Dashboard
KPIs, "my work" queue, recent assets table, and an onboarding checklist.

### 📚 Knowledge & Assets
- **Assets** — hierarchical folder tree + content panel, discussions, references between assets, deep-linkable by folder/document
- **Asset fullscreen view** — dedicated, shareable full-screen view of a single asset (no app chrome)
- **Search** — global search across organizational knowledge, with filters by type, template, user, custom field, and tag
- **Media** — media library with versioning and LLM-based image generation
- **Diagrams** — Mermaid-based diagram editor over the asset tree
- **Canvas** — visual canvas/template design surface

### 🗂 Asset Structure & Configuration
- **Asset types** — structure, lifecycle, and templates per asset type, with shareable detail pages
- **Asset type relationships** — relationships between asset types
- **Custom fields** — organization-defined fields on assets
- **Tags** — tagging and tagged-object management
- **Templates** — template creation, sections, context, dependencies, and document generation

### 🔀 Workflow
Table of workflows plus a response panel; supports both a shareable "fill your own asset from a template" link and a "everyone answers the same execution" link — no app chrome, answerable by anyone in the org with the link.

### 👥 People & Access
- **Users** — organization users, invitations/approval, role assignment
- **Roles (RBAC)** — roles, permissions, clone/import/export, users per role
- **Organizations** — organization CRUD, users/admins tab
- **Auth types** — authentication method configuration (root-admin only)

### 🤖 AI & Connections
- **Models** — LLM and embedding providers, connection testing, default model selection
- **External systems** — external system integrations, functionalities, parameters, secrets, logs, publish actions

### 🛠 Tools & Usage
- **Advanced tools** — bulk execution, change history, Excel/Word export
- **Token usage** — token consumption summary, daily series, and per-user breakdown

### 🔐 Administration
- **Global admin** — instance-wide admin surface across all organizations (root-admin only)

### 💬 AI Chatbot (Wisy)
Context-aware, expandable assistant available across the app.

## Technical Stack

### Core
- **React 19**, **TypeScript 5.8**, **Vite 6**
- **Tailwind CSS 4** — CSS-first configuration, design tokens defined in OKLCH (`src/index.css`)

### UI Components
- **shadcn/ui** (new-york style) + **Base UI** + **Radix UI** primitives
- **Huemul** — this project's own design system, built on top of shadcn/ui (see [Design System](#design-system-huemul) below)
- **Lucide** icons, IBM Plex Sans

### Data & State
- **TanStack Query 5** — server state, caching, mutations
- **TanStack Virtual** — virtualized lists
- A small custom `httpClient` wrapper (see [Data Layer](#data-layer))
- **React Router DOM 7** — routing
- **React Context** — auth, organization, permissions, and other cross-cutting state

### Rich Text Editor
- **Plate (platejs) v53** — the primary editor, with ~30 `@platejs/*` plugin packages (tables, comments, suggestions, mentions, media, Mermaid, math, code blocks, etc.)
- **MDX Editor** — legacy, retained only for two specific surfaces (lifecycle review sheet, simple section editor)

### Visualization
- **@xyflow/react** (diagrams/canvas), **Mermaid**, **Recharts**

### Other Notables
- **i18next** / **react-i18next** — internationalization
- **zod** — schema validation
- **sonner** — toasts
- **@dnd-kit** / **react-dnd** — drag and drop
- **date-fns** — date handling
- **@microsoft/fetch-event-source** — SSE streaming
- **react-resizable-panels** — resizable layout columns (used by `HuemulPageLayout`)

### Developer Experience
- **ESLint** + **typescript-eslint**
- No automated test suite exists yet — CI runs `npm run test --if-present`, but no `test` script is defined in `package.json`.

## Getting Started

### Prerequisites
- **Node.js >= 22** (see `.nvmrc` and `package.json` `engines`)
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/HuemulSolutions/wisecore-front.git
cd wisecore-front
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# edit .env with your backend URL
```

4. Start the development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

### Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check (`tsc -b`) and build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build locally |
| `npm run release` | Bump the version, sync it across files, update `CHANGELOG.md`, commit and tag |
| `npm run release:dry` | Preview the version bump and changelog section without writing anything |
| `npm run changelog` | Backfill any tagged version missing from `CHANGELOG.md` |
| `npm run changelog:dry` | Preview the changelog output without writing anything |
| `npm run changelog:full` | Regenerate the full `CHANGELOG.md` history from git tags |

> **Type-checking note:** running `tsc --noEmit` from the repo root is a no-op, since the root `tsconfig.json` is a solution file with no sources of its own. Use `tsc -p tsconfig.app.json --noEmit` instead.

## Environment Variables

Configured through `src/config.ts`, backed by Vite's `import.meta.env`. See `.env.example`.

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Base URL of the backend API |
| `VITE_SHOW_IN_CONSOLE` | No | Set to `'true'` to enable `logger.log` / `logger.warn` output in the browser console (`logger.error` always prints) |
| `VITE_TERMS_URL` | No | Terms-of-service link shown on the login screen; omitted → plain text with no link |
| `VITE_PRIVACY_URL` | No | Same as above, for the privacy policy |

## Project Structure

```
src/
├── App.tsx              # Full route tree: nested providers + org-scoped, RBAC-guarded routes
├── main.tsx             # Bootstrap: QueryClientProvider, Toaster, ErrorBoundary, BrowserRouter, i18n
├── config.ts             # Environment variable access
├── pages/                # One page per route (assets, workflow, roles, media, token-usage, ...)
├── components/           # ~40 feature-domain folders (assets/, templates/, workflow/, roles/, ...)
│   └── ui/                # shadcn/ui components + Plate editor nodes/toolbars (installed via the
│                            `@plate` registry in components.json)
├── huemul/               # In-house design system built on top of components/ui (see below)
├── services/             # Plain async functions per backend endpoint (no React)
├── hooks/                # One module per domain: TanStack Query hooks + hierarchical queryKeys
├── contexts/             # Auth, organization, permissions, chatbot, and other cross-cutting providers
├── types/                # Shared TypeScript types (component-local types stay in their file)
├── lib/                  # Utilities & singletons: http-client, query-client, rbac-matrix, etc.
└── i18n/                 # i18next setup + 41 translation namespaces (en/es)
```

`ia context/` at the repository root holds architecture and convention guides for common tasks (new module, new endpoint, RBAC audit, filters, i18n refactors, etc.); `CLAUDE.md` maps each kind of task to the guide that should be read before implementing it.

## Architecture

### Routing & Multi-tenancy
Every route except `/home` and `/global-admin` is nested under `/:orgId` (`src/App.tsx`). The provider tree is `AuthProvider → OrganizationProvider → PermissionsProvider → ProtectedRoute → Suspense`. Pages are code-split with `React.lazy` per route. Org-prefix helpers live in `src/hooks/useOrgRouter.ts`. A small set of routes (`asset/full/:assetId`, `workflow/share/*`) render without the app header/nav for shareable, standalone views.

### Authentication & RBAC
Access is enforced in three layers:
1. **Global auth** — the entire route tree is wrapped by an auth guard; unauthenticated users see the login page in place of the app.
2. **Per-route permissions** — routes are wrapped in a permission guard fed exclusively from `RBAC_PAGES` (`src/lib/rbac-matrix.ts`), never from ad-hoc logic.
3. **In-page gating** — pages re-check access via `usePageAccess` and gate individual actions with `useUserPermissions` / `ProtectedComponent`.

`RBAC_PAGES` is the single source of truth: each of its ~22 entries declares a `route`, `routePermissions` (a permission, an array = OR, or `{ all: [...] }` = AND), an optional `requireRootAdmin` flag, `nav` visibility, and a `features` map for fine-grained checks.

### Data Layer
`src/lib/http-client.ts` is a singleton HTTP client that:
- picks the login token or the organization token depending on the endpoint,
- automatically injects the **`X-Org-Id`** header when an organization is selected (without overriding one a service already set),
- normalizes backend errors into a typed `ApiError` (with `transaction_id` logging),
- handles 401s while distinguishing them from permission errors.

The data-access pattern is **service → hook**: `src/services/*.ts` exposes plain async functions that call `httpClient` and return `data.data`; `src/hooks/*.ts` wraps each domain's services with TanStack Query, exposing a hierarchical `queryKeys` object plus `useQuery`/`useMutation` hooks. `src/lib/query-client.ts` creates a single `QueryClient` outside of React (so `logout()` can purge it) with global error/success toasts driven by `meta.showErrorToast` / `meta.successMessage`.

### Design System (Huemul)
`src/huemul/` is this project's own design system, layered on top of `src/components/ui/` (shadcn/ui). Pages must use `HuemulPageLayout` (a 1–3 resizable-column page layout) rather than ad-hoc layout structures; `HuemulPageHeader` includes the refresh button every backend-data surface is expected to offer. Other building blocks include `HuemulTable`, `HuemulSheet`, `HuemulDialog`, the `huemul-filter-*` family, and `huemul-lifecycle-*` components for lifecycle badges/steppers. Shared design constants live in `src/huemul/constants.ts`.

### Internationalization
All UI text must come from `src/i18n/locales/` — never hardcoded. Each locale file declares both languages together per key (e.g. `{ refresh: { en: "Refresh", es: "Actualizar" } }`), and `src/i18n/index.ts` extracts per-language resources at init time across 41 namespaces (`defaultNS: 'common'`). Supported languages are `en` and `es`, detected via `localStorage → navigator → htmlTag` and persisted per user × organization.

### Rich Text Editor
The primary editor is **Plate**, configured as a set of plugin "kits" under `src/components/plate-editor/` (tables, media, mentions, comments, discussions, suggestions, Mermaid, Markdown, etc.). Node and toolbar components are installed into `src/components/ui/` via the `@plate` registry declared in `components.json`, alongside project-specific custom nodes (asset reference, role reference, Mermaid, data table, code drawing).

## Contributing

- All UI-visible text must come from translations (`src/i18n/locales/`) — never hardcoded.
- Always call the backend through `httpClient`, which handles the `X-Org-Id` header.
- Gate access with `useUserPermissions` / `ProtectedComponent` / `usePageAccess` — never custom permission logic.
- Use `HuemulPageLayout` for page layouts; don't build layout structures ad hoc.
- Any surface that displays backend data must offer a refresh action (forms/comboboxes are exempt).
- Shared types go in `src/types/`; component-local types can stay in their file.
- New reusable components belong in `src/huemul/components/`, prefixed `huemul-`.
- Commit messages follow a `feat:` / `fix:` convention (in Spanish, in this codebase) — they feed the generated changelog.
- Read the relevant guide in `ia context/` before implementing a new module, endpoint, layout pattern, or refactor; see the task-to-guide map in `CLAUDE.md`.

## Deployment

| Workflow | Trigger | Target |
|---|---|---|
| `main_web-hs-wisecore-prod-1.yml` | push to `main` | Azure Web App (production) |
| `dev_web-hs-wisecore-dev-1.yml` | push to `dev` | Azure Web App (dev) |
| `dev_web-hs-wisecore-frontend-qa-1.yml` | push to `dev` | Azure Web App (QA) |
| `azure-static-web-apps-*.yml` | push/PR to `main` | Azure Static Web Apps |
| `dockerhub-deploy.yml` | push to `main` | `huemulsolutions/wisecore-front:latest` (Docker Hub) |
| `dockerhub-dev.yml` | push to `dev` | `huemulsolutions/wisecore-frontend-dev:latest` (Docker Hub) |
| `deploy-ibm.yml` | push to `dev`, manual | IBM Code Engine |

The app is a client-side SPA; `staticwebapp.config.json` rewrites all non-asset/non-API paths to `/index.html`. Two Dockerfiles are provided: `Dockerfile` (serves the build with `serve` on port 8080) and `Dockerfile.orch` (used by the Docker Hub workflows, port 3000).

## Versioning & Changelog

Releases are tracked with git tags (`vX.Y.Z`) — the source of truth for both the app version and the changelog. To cut a release:

```bash
npm run release            # bump patch (default)
npm run release -- minor   # or: major, or an explicit "1.2.3"
```

This syncs `version` in `package.json`/`package-lock.json`, updates the `**Version X.Y.Z**` line in this README, prepends a new section to `CHANGELOG.md`, and creates the commit + tag locally. It never pushes — run `git push && git push origin vX.Y.Z` yourself once you've reviewed the result (`npm run release:dry` previews everything without writing).

`CHANGELOG.md` classifies commit subjects into **Nuevo** (`feat:`), **Arreglos** (`fix:`), and **Otros** (everything else), configured in `scripts/changelog.config.json`. `npm run changelog` backfills any tagged version missing a section — safe to re-run, it's idempotent (versions already documented are detected from the file's own `## [X.Y.Z]` headers, not from external state). `npm run changelog:full` regenerates the entire history from the git tags.

## License
WiseCore is licensed under the **Elastic License 2.0**.

### What does this mean?

- ✅ **Free to use** for personal and commercial purposes
- ✅ **Modify and distribute** the code
- ✅ **Use internally** in your business without restrictions
- ❌ **Cannot offer as SaaS** or managed service
- ❌ **Cannot resell** the software as a product
- ❌ **Cannot sell consulting services** primarily based on WiseCore

For more details, see:
- [![License](https://img.shields.io/badge/License-Elastic%202.0-blue.svg)](LICENSE.md) - Full legal terms
- [![Notice](https://img.shields.io/badge/Read-NOTICE-orange.svg)](NOTICE.md) - Plain language explanation


---

**Wisecore Frontend v1.0.97** - Empowering organizations with AI-driven knowledge management.
