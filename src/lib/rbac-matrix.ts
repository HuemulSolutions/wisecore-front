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
    features: {
      // ── Árbol de conocimiento (NavKnowledgeHeader / NavKnowledgeContent) ──
      listAssets: ["asset:l", "asset:r"],
      listFolders: ["folder:l", "folder:r"],
      createAsset: "asset:c",
      updateAsset: "asset:u", // renombrar + mover (kebab y drag&drop)
      deleteAsset: "asset:d",
      createFolder: "folder:c",
      createGroupFolder: { all: ["folder:c", "folder:manage_groups"] },
      updateFolder: "folder:u",
      deleteFolder: "folder:d",
      // Grants de lifecycle por documento (POST /lifecycle/documents/{id}/grants).
      // Mismo criterio que `manageLifecycle` en asset-types: el endpoint es del
      // recurso padre, así que se valida con la acción de update del padre.
      manageAssetLifecycleGrants: "asset:u",
      listUsers: ["user:l", "user:r"], // picker de usuarios del sheet de grants

      // ── Panel derecho: contenido del asset ──
      // Granularidad gruesa: el eje RBAC del cruce lifecycle × RBAC es asset:*.
      // La granularidad fina (section_execution:u, version:c, custom_fields:u,
      // media:c) queda como paso 2 — ver ia context/rbac-audit-guide.md.
      readAsset: ["asset:r", "asset:l"],
      updateAssetContent: "asset:u", // secciones, formularios, autosave, IA, review status
      createVersion: "asset:c", // crear ejecución, clonar versión / a nuevo documento
      deleteVersion: "asset:d", // borrar versión y borrar documento
      exportVersion: "asset:r",

      // ── Recursos propios que se listan dentro de la página ──
      listCustomFields: ["custom_fields:l", "custom_fields:r"],
      listNotifications: ["notification:l", "notification:r"],
      listAssetTypes: ["asset_type:l", "asset_type:r"], // paleta del canvas de relaciones
      createTemplateFromAsset: "template:c",

      // ── Modo relaciones / diagramas (RelationshipsCanvas mode="execution") ──
      listExecutionRelationships: ["execution_relationship:l", "execution_relationship:r"],
      listDiagrams: ["diagram:l", "diagram:r"],
      createDiagram: "diagram:c",
    },
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
    // Recurso técnico global: no existe `auth_type` en PermissionResource
    // (src/types/jwt-utils.ts), por eso el guard de ruta pedía `asset_type:*`
    // prestado mientras la página exigía isRootAdmin adentro. La página siempre
    // fue root-admin-only; ahora la matriz lo declara y es la única fuente.
    //
    // Sin `features` a propósito: `can()` resuelve por hasPermission, que da
    // bypass a isOrgAdmin pero NO a isRootAdmin — un feature con permisos de
    // otro recurso devolvería false justo para el root admin. Todas las
    // affordances comparten el eje de `canAccessPage`. Ver rbac-audit-guide.md.
    requireRootAdmin: true,
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
    features: {
      listAssetTypes: ["asset_type:l", "asset_type:r"],
      createAssetType: "asset_type:c",
      updateAssetType: "asset_type:u",
      deleteAssetType: "asset_type:d",
      cloneAssetType: "asset_type:c",
      exportAssetTypes: "asset_type:r",
      importAssetTypes: { all: ["asset_type:c", "asset_type:u"] },
      // Lifecycle y vínculos template↔asset_type son sub-recursos del asset
      // type: el endpoint que validan es /document_types/{id}/..., de ahí
      // asset_type:u en vez de un recurso propio.
      manageLifecycle: "asset_type:u",
      listLinkedTemplates: ["asset_type:l", "asset_type:r"],
      manageLinkedTemplates: "asset_type:u",
      listRelationships: ["asset_type_relationship:l", "asset_type_relationship:r"],
    },
  },
  "custom-fields": {
    route: "custom-fields",
    routePermissions: ["custom_fields:r", "custom_fields:l"],
    features: {
      listCustomFields: ["custom_fields:l", "custom_fields:r"],
      createCustomField: "custom_fields:c",
      updateCustomField: "custom_fields:u",
      deleteCustomField: "custom_fields:d",
    },
  },
  canvas: {
    route: "canvas",
    routePermissions: ["canvas:r", "canvas:l"],
    features: {
      listCanvas: ["canvas:l", "canvas:r"],
      createCanvas: "canvas:c",
      updateCanvas: "canvas:u",
      deleteCanvas: "canvas:d",
    },
  },
  diagrams: {
    route: "diagrams",
    routePermissions: ["diagram:r", "diagram:l"],
    features: {
      listDiagrams: ["diagram:l", "diagram:r"],
      // Ver = abrir el visor read-only del diagrama. Antes pedía `diagram:u`,
      // un permiso de escritura gateando una lectura.
      viewDiagram: ["diagram:r", "diagram:l"],
      // No hay botón de crear en /diagrams: los diagramas se crean desde
      // /asset en modo relaciones. Se declara igual porque el canvas
      // (RelationshipsCanvas / SaveAsDiagramSheet) gatea con este permiso.
      createDiagram: "diagram:c",
      updateDiagram: "diagram:u", // acción "Editar" del sheet → /asset?diagram=id
      deleteDiagram: "diagram:d",
      // El filtro por ejecución pega a GET /execution/ — mismo permiso que
      // `listExecutions` de `advanced`.
      listExecutions: ["section_execution:l", "section_execution:r"],
    },
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
    features: {
      listSystems: ["external_system:l", "external_system:r"],
      createSystem: "external_system:c",
      updateSystem: "external_system:u",
      deleteSystem: "external_system:d",
      // Las funcionalidades son un recurso propio que se lista al expandir un
      // sistema en el árbol: sin este permiso no se dispara la llamada.
      listFunctionalities: ["external_functionality:l", "external_functionality:r"],
      createFunctionality: "external_functionality:c",
      updateFunctionality: "external_functionality:u",
      deleteFunctionality: "external_functionality:d",
      listParameters: ["external_parameter:l", "external_parameter:r"],
      createParameter: "external_parameter:c",
      updateParameter: "external_parameter:u",
      deleteParameter: "external_parameter:d",
      listSecrets: ["external_secret:l", "external_secret:r"],
      createSecret: "external_secret:c",
      updateSecret: "external_secret:u",
      deleteSecret: "external_secret:d",
      // Los logs de ejecución no tienen recurso propio en PermissionResource:
      // se gatean con la lectura de la funcionalidad que los produce (mismo
      // criterio que `manageLifecycle` en asset-types). Antes se pedía
      // `external_execution_log:l as never`, un recurso inexistente que dejaba
      // el tab invisible para todos salvo org admin.
      listLogs: ["external_functionality:l", "external_functionality:r"],
      listPublishActions: "lifecycle_external_publish_action:l",
      createPublishAction: "lifecycle_external_publish_action:c",
      updatePublishAction: "lifecycle_external_publish_action:u",
      deletePublishAction: "lifecycle_external_publish_action:d",
    },
  },
  "asset-type-relationships": {
    // Ruta sin entrada de nav ni link desde ninguna pantalla: solo se alcanza
    // por URL directa. No lleva `nav` a propósito — si algún día se agrega al
    // menú, gatearlo con `routePermissions` y no con un helper `canAccessX`.
    route: "asset-type-relationships",
    routePermissions: ["asset_type:r", "asset_type:l"],
    features: {
      listRelationships: ["asset_type_relationship:l", "asset_type_relationship:r"],
      updateAssetType: "asset_type:u",
      deleteAssetType: "asset_type:d",
      cloneAssetType: "asset_type:c",
      manageLifecycle: "asset_type:u",
    },
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
    // Ruta técnica NO org-scoped (vive fuera de `/:orgId`): gestiona todas las
    // organizaciones y todos los usuarios de la instalación.
    //
    // Sin `features` a propósito, mismo criterio que `auth-types`: `can()`
    // resuelve vía hasPermission, que da bypass a isOrgAdmin pero NO a
    // isRootAdmin, así que un feature con permisos org-scoped (`user:c`,
    // `organization:u`) devolvería false justo para el root admin que la
    // página existe para servir. Todas las affordances comparten el eje de
    // `canAccessPage`. Ver ia context/rbac-audit-guide.md.
    route: "global-admin",
    requireRootAdmin: true,
  },
} as const satisfies Record<string, RbacPageSpec>;

export type RbacPageKey = keyof typeof RBAC_PAGES;
