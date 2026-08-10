import type { Permission } from "@/lib/jwt-utils";

/**
 * Fuente única de verdad de qué permisos exige cada página org-scoped.
 *
 * Antes de esta matriz, `src/App.tsx` (guard de ruta) y
 * `src/components/layout/app-layout.tsx` (filtro del nav) declaraban los
 * permisos de una misma página en dos lugares distintos, y ya divergían
 * (ej. la ruta `/workflow` pedía solo `asset:l` pero el nav ocultaba/mostraba
 * el ítem con `canAccessAssets`, que exige *cualquiera* de las 5 acciones de
 * `asset` — un usuario con únicamente `asset:c` veía el ítem de nav pero el
 * guard de ruta lo rebotaba a `/home`). Ver ia context/rbac-audit-guide.md.
 *
 * Cómo leer un `FeatureSpec`:
 * - `Permission` (string): requiere exactamente ese permiso.
 * - `Permission[]`: requiere CUALQUIERA de la lista (OR).
 * - `{ all: Permission[] }`: requiere TODOS los de la lista (AND).
 *
 * `routePermissions` sigue la misma convención `Permission[]` (OR) que ya
 * usa `PermissionProtectedRoute` en App.tsx.
 *
 * `features` solo está completo para las páginas ya auditadas (por ahora,
 * `templates`). Para el resto, poblar `features` página por página es en sí
 * mismo el trabajo de auditoría — ver ia context/rbac-audit-guide.md.
 */

export type FeatureSpec = Permission | Permission[] | { all: Permission[] };

export interface RbacNavSpec {
  /** Debe coincidir con el título usado en `navigationItems` (app-layout.tsx). */
  title: string;
  orgScoped: boolean;
}

export interface RbacPageSpec {
  /** Path relativo bajo `/:orgId/...` (sin barra inicial), o absoluto si no es org-scoped. */
  route: string;
  /** Permisos del guard de ruta (OR). Vacío/omitido = sin restricción de permiso. */
  routePermissions?: Permission[];
  /** Solo accesible para root admin (rutas técnicas). */
  requireRootAdmin?: boolean;
  /** Metadata de navegación, si la página tiene entrada en el nav superior. */
  nav?: RbacNavSpec;
  /** Permisos por affordance (botón, tab, acción de fila, etc). */
  features?: Record<string, FeatureSpec>;
}

export const RBAC_PAGES = {
  templates: {
    route: "templates",
    routePermissions: ["template:r", "template:l"],
    nav: { title: "Templates", orgScoped: true },
    features: {
      listTemplates: ["template:l", "template:r"],
      createTemplate: "template:c",
      updateTemplate: "template:u",
      deleteTemplate: "template:d",
      exportTemplate: "template:r",
      importTemplate: { all: ["template:c", "template:u"] },
      listSections: ["template_section:l", "template_section:r"],
      createSection: "template_section:c",
      updateSection: "template_section:u",
      deleteSection: "template_section:d",
      listCustomFields: ["custom_fields:l", "custom_fields:r"],
      createCustomField: "custom_fields:c",
      updateCustomField: "custom_fields:u",
      deleteCustomField: "custom_fields:d",
      listDocx: ["docx_template:l", "docx_template:r"],
      createDocx: "docx_template:c",
      updateDocx: "docx_template:u",
      deleteDocx: "docx_template:d",
      listMedia: "media:l",
      createMedia: "media:c",
      deleteMedia: "media:d",
    },
  },
  organizations: {
    route: "organizations",
    routePermissions: ["organization:r", "organization:l"],
  },
  asset: {
    route: "asset",
    routePermissions: ["asset:r", "asset:l"],
    nav: { title: "Assets", orgScoped: true },
  },
  search: {
    route: "search",
    nav: { title: "Search", orgScoped: true },
  },
  models: {
    route: "models",
    routePermissions: ["llm:r", "llm_provider:r"],
  },
  "auth-types": {
    route: "auth-types",
    routePermissions: ["asset_type:r", "asset_type:l"],
    // NOTA: la página además exige isRootAdmin internamente
    // (src/pages/auth-types.tsx) — no representado aquí todavía.
  },
  users: {
    route: "users",
    routePermissions: ["user:r", "user:l"],
  },
  roles: {
    route: "roles",
    routePermissions: ["rbac:r", "rbac:l"],
  },
  "asset-types": {
    route: "asset-types",
    routePermissions: ["asset_type:r", "asset_type:l"],
  },
  "custom-fields": {
    route: "custom-fields",
    // NOTA: preexistente — la página gestiona custom_fields pero el guard de
    // ruta pide permisos de asset_type. No corregido en esta pasada (fuera
    // de alcance de la auditoría de /templates); ver rbac-audit-guide.md.
    routePermissions: ["asset_type:r", "asset_type:l"],
  },
  canvas: {
    route: "canvas",
    routePermissions: ["canvas:r", "canvas:l"],
  },
  diagrams: {
    route: "diagrams",
    routePermissions: ["diagram:r", "diagram:l"],
  },
  advanced: {
    route: "advanced/:section",
    routePermissions: ["section_execution:r", "section_execution:l"],
    nav: { title: "Advanced", orgScoped: true },
    // NOTA: `canAccessMassExecution`/`canAccessExcelExport` en advanced.tsx son
    // AND de varios de estos features (FeatureSpec no representa AND-de-OR),
    // por eso se listan atómicos y la página los combina a mano.
    features: {
      listTemplates: ["template:l", "template:r"],
      listTemplateSections: ["template_section:l", "template_section:r"],
      listLlms: ["llm:l", "llm:r"],
      createExecution: "section_execution:c",
      listExecutions: ["section_execution:l", "section_execution:r"],
      wordExport: "version:r",
    },
  },
  "external-systems": {
    route: "external-systems",
    routePermissions: ["external_system:r", "external_system:l"],
  },
  "asset-type-relationships": {
    route: "asset-type-relationships",
    routePermissions: ["asset_type:r", "asset_type:l"],
  },
  "token-usage": {
    route: "token-usage",
    routePermissions: ["token_usage:r", "token_usage:l"],
  },
  workflow: {
    route: "workflow",
    routePermissions: ["asset:l"],
    nav: { title: "Workflow", orgScoped: true },
  },
  "global-admin": {
    route: "global-admin",
    requireRootAdmin: true,
  },
} as const satisfies Record<string, RbacPageSpec>;

export type RbacPageKey = keyof typeof RBAC_PAGES;
