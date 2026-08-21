import type { Permission } from "@/lib/jwt-utils";

/**
 * Fuente única de verdad de qué permisos exige cada página org-scoped.
 *
 * Antes de esta matriz, `src/App.tsx` (guard de ruta) y
 * `src/components/layout/app-layout.tsx` (filtro del nav) declaraban los
 * permisos de una misma página en dos lugares distintos, y ya divergían
 * (ej. la ruta `/workflow` pedía solo `asset:l` mientras el nav ocultaba/
 * mostraba el ítem con `canAccessAssets`, que exige *cualquiera* de las 5
 * acciones de `asset` — un usuario con únicamente `asset:c` veía el ítem de
 * nav pero el guard de ruta lo rebotaba a `/home`; ambos ya corregidos).
 * Ver ia context/rbac-audit-guide.md.
 *
 * Cómo leer un `FeatureSpec`:
 * - `Permission` (string): requiere exactamente ese permiso.
 * - `Permission[]`: requiere CUALQUIERA de la lista (OR).
 * - `{ all: Permission[] }`: requiere TODOS los de la lista (AND).
 *
 * `routePermissions` sigue la misma convención `Permission[]` (OR) que ya
 * usa `PermissionProtectedRoute` en App.tsx.
 *
 * `features` solo está completo para las páginas ya auditadas. Para el resto,
 * poblar `features` página por página es en sí mismo el trabajo de auditoría
 * — ver ia context/rbac-audit-guide.md.
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
  /**
   * Permisos declarados antes de que exista la página (la capa de datos ya
   * está, la UI llega después). El validador de RBAC (scripts/validate-rbac.mjs)
   * salta para estas entradas los chequeos de ruta y de nav. Quitar el flag
   * al construir la página.
   */
  pending?: boolean;
}

export const RBAC_PAGES = {
  home: {
    // Ruta NO org-scoped (vive fuera de `/:orgId`): es la landing de todo
    // redirect — RootRedirect, el rebote de /advanced cuando falta el permiso
    // de una sección, y el de cualquier guard de ruta.
    //
    // Sin `routePermissions` a propósito: /home nunca debe dar un 403 de
    // página completa, o un usuario sin permisos queda sin ningún destino
    // alcanzable. Todo su RBAC vive en `features` y se aplica panel por panel
    // (tabla, KPIs, botones, filtros). Ver ia context/rbac-audit-guide.md.
    route: "/home",
    nav: { title: "Home", orgScoped: false },
    features: {
      // GET /execution/ — mismo permiso que `listExecutions` de `advanced` y
      // de `diagrams`: mismo endpoint, mismo recurso.
      listExecutions: ["section_execution:l", "section_execution:r"],
      readStatistics: ["asset:l", "asset:r"], // GET /documents/statistics (KPIs)
      listAssets: ["asset:l", "asset:r"], // GET /documents/ (panel de reseñas pendientes)
      // La acción de fila abre /asset/{id}, cuyo guard exige asset:r|l — sin
      // esto la acción existe pero aterriza en un rebote del guard de ruta.
      openAsset: ["asset:r", "asset:l"],
      createAsset: "asset:c", // crear asset + importar desde archivo
      // Los filtros son superficie RBAC: cada combobox asíncrono pega a su
      // propio endpoint y sin permiso se come un 403 mudo al abrirse.
      listAssetTypes: ["asset_type:l", "asset_type:r"], // filtro documentTypeId
      listUsers: ["user:l", "user:r"], // filtro ownerValue + nombres del panel de reseñas
      listCustomFields: ["custom_fields:l", "custom_fields:r"], // filtro customFieldFilter
      listNotifications: ["notification:l", "notification:r"],
    },
  },
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
      updateMedia: "media:u",
      deleteMedia: "media:d",
      // Popover de etiquetas asignadas al template (TagsObjectPicker, object_type
      // "template"). GET/POST/DELETE /tags/{id}/objects piden tag:r / tag:u.
      viewTags: "tag:r",
      manageTags: "tag:u",
      // Contexto y dependencias a nivel de template (tabs "Contexto" /
      // "Dependencias" del detalle). GET /templates/{id}/context y
      // /dependencies exigen template:r específico (con solo template:l el
      // tab existiría y se comería un 403 mudo). No existe recurso
      // template_context en PermissionResource: `context` es el recurso del
      // contexto de DOCUMENTO y no aplica acá.
      listTemplateContext: "template:r",
      manageTemplateContext: "template:u",
      listTemplateDependencies: "template:r",
      manageTemplateDependencies: "template:u",
      // El picker de documentos del alta de dependencia es el árbol de
      // conocimiento (GET /library).
      listAssetsForDependency: ["asset:l", "asset:r"],
      listFoldersForDependency: ["folder:l", "folder:r"],
      // version_mode="specific" lista executions del documento dependido
      // (DependencyVersionDialog ya gatea con canList('version')).
      listVersionsForDependency: ["version:l", "version:r"],
      // "Ver activo" desde la fila de dependencia abre /asset/{id}, cuyo
      // guard exige asset:r|l.
      openAsset: ["asset:r", "asset:l"],
    },
  },
  organizations: {
    // Vista plana org-scoped sobre un recurso propio (`organization`, ya
    // existente en PermissionResource). Sin `nav`: vive en el dropdown de
    // Settings, igual que `models`. `setOrganizationAdmin` NO se declara acá:
    // la única pantalla que lo ofrece es /global-admin, root-admin-only y sin
    // `features` a propósito.
    route: "organizations",
    routePermissions: ["organization:r", "organization:l"],
    features: {
      listOrganizations: ["organization:l", "organization:r"],
      createOrganization: "organization:c",
      updateOrganization: "organization:u",
      deleteOrganization: "organization:d",
    },
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
      // Asociar un custom field a un asset puede crear el custom field mismo
      // (`custom_field_document` no existe como recurso propio, ver hallazgos
      // pendientes), así que se gatea con la creación del recurso que produce.
      createCustomField: "custom_fields:c",
      // Bloque "Documentos relacionados" del tab Contenido: solo lectura,
      // mismo permiso que usa el listado equivalente en la página diagrams.
      listExecutionRelationships: ["execution_relationship:l", "execution_relationship:r"],
      // El bloque de relacionados resuelve el nombre del tipo de cada documento
      // con el catálogo GET /document_types (mismo criterio que la paleta del
      // canvas en diagrams): sin el permiso la fila omite ese segmento.
      listAssetTypes: ["asset_type:l", "asset_type:r"],
      // "Vincular documento" abre /diagrams?diagram=new&seedAsset=…, cuyo guard
      // exige diagram:r|l — se gatea con el permiso del destino, mismo criterio
      // que `openAsset` en search.
      openDiagramsCanvas: ["diagram:r", "diagram:l"],
      listNotifications: ["notification:l", "notification:r"],
      // Marcar leída/no leída escribe la notificación; eliminarla la borra. Las
      // suscripciones (POST/DELETE /subscriptions) no tienen recurso propio en
      // PermissionResource: se gatean con el CRUD de `notification`, que es lo
      // que producen y consumen (mismo criterio que `listLogs` en
      // external-systems). Pendiente de verificar contra backend.
      updateNotification: "notification:u",
      deleteNotification: "notification:d",
      createSubscription: "notification:c",
      deleteSubscription: "notification:d",
      createTemplateFromAsset: "template:c",
      // TemplateConfigSheet edita las secciones del template desde el flujo de
      // creación de asset: el recurso que muta es `template_section`, no `asset`.
      createTemplateSection: "template_section:c",
      updateTemplateSection: "template_section:u",
      deleteTemplateSection: "template_section:d",
      // El canvas de relaciones y los diagramas ya no viven acá: se movieron a
      // la página /diagrams, que declara sus propias features.

      // Popover de etiquetas asignadas al documento (TagsObjectPicker,
      // object_type "document"). GET/POST/DELETE /tags/{id}/objects piden
      // tag:r / tag:u.
      viewTags: "tag:r",
      manageTags: "tag:u",
    },
  },
  search: {
    // No existe recurso `search` en PermissionResource: GET /search/ devuelve
    // documentos y cada resultado abre /asset/{id}, cuyo guard exige
    // asset:l|r — se gatea con la lectura del recurso que sirve, mismo
    // criterio que `listLogs: external_functionality:l|r`.
    route: "search",
    routePermissions: ["asset:l", "asset:r"],
    nav: { title: "Search", orgScoped: true },
    features: {
      performSearch: ["asset:l", "asset:r"],
      openAsset: ["asset:r", "asset:l"],
      filterByAssetType: ["asset_type:l", "asset_type:r"],
      filterByTemplate: ["template:l", "template:r"],
      filterByUser: ["user:l", "user:r"],
      filterByCustomField: ["custom_fields:l", "custom_fields:r"],
      // Filtro por etiqueta (tag_id) — GET /tags/ pide tag:r|l. Sin confirmar
      // que /search/ acepte tag_id (ver types/search/core.ts).
      filterByTag: ["tag:l", "tag:r"],
    },
  },
  models: {
    // Vista plana con dos recursos propios (llm, llm_provider) más embedding
    // provider, que no existe como recurso propio en PermissionResource: se
    // gatea con el CRUD de `llm_provider` (mismo criterio que
    // `listLogs: external_functionality:l|r` en external-systems).
    route: "models",
    routePermissions: ["llm:l", "llm:r", "llm_provider:l", "llm_provider:r"],
    features: {
      listModels: ["llm:l", "llm:r"],
      createModel: "llm:c",
      // Editar, capabilities y set_default (estrella de la tabla + botón del
      // banner) comparten el mismo permiso: son formas distintas de mutar un LLM.
      updateModel: "llm:u",
      deleteModel: "llm:d",
      // POST /llms/{id}/test_connection y /image-generation/test_connection
      // hacen una llamada real al proveedor (consumen cuota): se gatean con
      // la escritura del recurso que diagnostican, no con su lectura.
      testModel: "llm:u",
      listProviders: ["llm_provider:l", "llm_provider:r"],
      createProvider: "llm_provider:c",
      updateProvider: "llm_provider:u",
      deleteProvider: "llm_provider:d",
    },
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
    // Vista plana org-scoped sobre un recurso propio (`user`, ya existente en
    // PermissionResource). Sin `nav`: vive en el dropdown de Settings, igual
    // que `organizations`/`models`/`roles`.
    //
    // `manageRootAdmin` NO se declara acá: PATCH /users/{id}/root-admin muta
    // un flag de sistema (no org-scoped) y su eje es isRootAdmin, que `can()`
    // no resuelve (hasPermission da bypass a isOrgAdmin, pero no a
    // isRootAdmin). Mismo criterio que `global-admin`/`auth-types`.
    route: "users",
    routePermissions: ["user:r", "user:l"],
    features: {
      // GET /user_roles/users_with_roles — el mismo endpoint que ya se gatea
      // con user:l|r desde el filtro de /token-usage.
      listUsers: ["user:l", "user:r"],
      createUser: "user:c",
      // Editar + aprobar/rechazar altas (POST /users/{id}/approve|reject):
      // tres formas de mutar un usuario ya existente.
      updateUser: "user:u",
      deleteUser: "user:d",
      // POST /user_roles/{roleId}/bulk_users — mismo endpoint y mismo permiso
      // que RBAC_PAGES.roles.features.assignRoleToUsers.
      assignRoles: "rbac:u",
    },
  },
  roles: {
    // Vista plana org-scoped sobre un recurso propio (`rbac`, ya existente en
    // PermissionResource). Sin `nav`: vive en el dropdown de Settings, igual
    // que `organizations`/`models`/`media`.
    route: "roles",
    routePermissions: ["rbac:r", "rbac:l"],
    features: {
      listRoles: ["rbac:l", "rbac:r"],
      createRole: "rbac:c",
      // Incluye otorgar/revocar permisos del rol (PATCH add_permissions/remove_permissions).
      updateRole: "rbac:u",
      deleteRole: "rbac:d",
      cloneRole: "rbac:c", // POST /rbac/roles/{id}/clone crea un rol nuevo
      // POST /user_roles/{roleId}/bulk_users — no existe un recurso propio
      // para asignaciones; se gatea con la escritura del rol asignado (mismo
      // criterio que `manageLifecycle: asset_type:u`).
      assignRoleToUsers: "rbac:u",
      // GET /rbac/permissions — catálogo que alimenta el selector de permisos
      // de los sheets de crear/editar.
      listPermissionCatalog: ["rbac:l", "rbac:r"],
      exportRoles: ["rbac:l", "rbac:r"],
      // on_conflict=overwrite pisa roles existentes: exige crear y actualizar.
      importRoles: { all: ["rbac:c", "rbac:u"] },
    },
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
      // Popover de etiquetas asignadas al tipo de activo (TagsObjectPicker,
      // object_type "document_type"). GET/POST/DELETE /tags/{id}/objects
      // piden tag:r / tag:u.
      viewTags: "tag:r",
      manageTags: "tag:u",
      // Carpetas de tipos de documento (document_type_folder): reutilizan
      // asset_type:* — el endpoint de mover por drag & drop
      // (POST /document_type_folders/{id}/document_types) también pide asset_type:u.
      createFolder: "asset_type:c",
      updateFolder: "asset_type:u",
      deleteFolder: "asset_type:d",
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
  tags: {
    route: "tags",
    routePermissions: ["tag:r", "tag:l"],
    features: {
      listTags: ["tag:l", "tag:r"],
      createTag: "tag:c",
      updateTag: "tag:u",
      deleteTag: "tag:d",
      // Asignar/quitar una etiqueta de un objeto valida tag:u en el backend
      // (POST y DELETE /tags/{id}/objects), no tag:c / tag:d.
      assignTagToObject: "tag:u",
      unassignTagFromObject: "tag:u",
      // GET /tags/{id}/objects y GET /tags/by-object/... piden tag:r.
      listTagObjects: "tag:r",
      listObjectTags: "tag:r",
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
    // Editor de diagramas: árbol de conocimiento a la izquierda + canvas de
    // relaciones a la derecha. Antes esta página era solo la tabla y la edición
    // vivía en /asset detrás del "modo relaciones"; por eso ahora declara
    // también las features del árbol y del canvas.
    route: "diagrams",
    routePermissions: ["diagram:r", "diagram:l"],
    nav: { title: "Diagrams", orgScoped: true },
    features: {
      listDiagrams: ["diagram:l", "diagram:r"],
      // Ver = abrir el visor read-only del diagrama. Antes pedía `diagram:u`,
      // un permiso de escritura gateando una lectura.
      viewDiagram: ["diagram:r", "diagram:l"],
      createDiagram: "diagram:c",
      updateDiagram: "diagram:u",
      deleteDiagram: "diagram:d",
      // El filtro por ejecución pega a GET /execution/ — mismo permiso que
      // `listExecutions` de `advanced`.
      listExecutions: ["section_execution:l", "section_execution:r"],

      // ── Canvas de relaciones (RelationshipsCanvas mode="execution") ──
      listExecutionRelationships: ["execution_relationship:l", "execution_relationship:r"],
      listAssetTypes: ["asset_type:l", "asset_type:r"], // paleta / colores de nodos
      // ── Árbol de conocimiento de la columna izquierda ──
      // Mismos permisos que usa el árbol en /asset: es el mismo componente y
      // pega a los mismos endpoints (GET /library).
      listAssets: ["asset:l", "asset:r"],
      listFolders: ["folder:l", "folder:r"],
    },
  },
  media: {
    // Vista plana con recurso propio, gemela de `canvas` y `diagrams`. Sin
    // `nav`: no está en `navigationItems`, vive en el dropdown de Settings.
    route: "media",
    routePermissions: ["media:r", "media:l"],
    features: {
      listMedia: ["media:l", "media:r"],
      // Cubre subir archivo, subir versión nueva y `POST /image-generation/generate`:
      // no existe un recurso `image_generation` en PermissionResource y ese
      // endpoint persiste una Media real de la organización, así que se gatea
      // con la escritura del recurso que produce (mismo criterio que
      // `listLogs: external_functionality:l|r` en external-systems).
      createMedia: "media:c",
      updateMedia: "media:u", // editar nombre/descripción (PATCH /media/{id})
      deleteMedia: "media:d", // borrar media, borrar versión, descartar generada
      // El select de nivel del filtro decide a qué endpoint pega el selector de
      // padre: cada nivel es una lectura de OTRO recurso, y sin permiso el
      // combobox/tree-picker se come un 403 mudo al abrirse. Mismo criterio que
      // el filtro de ejecuciones de /diagrams y los 3 comboboxes de /home.
      listAssetTypes: ["asset_type:l", "asset_type:r"], // nivel document_type
      listAssets: ["asset:l", "asset:r"], // nivel document (tree picker)
      listFolders: ["folder:l", "folder:r"], // nivel document (tree picker)
      listExecutions: ["section_execution:l", "section_execution:r"], // nivel execution
      listTemplates: ["template:l", "template:r"], // nivel template
      // El select de modelo del sheet de generación lee GET /llms/ (recurso ajeno):
      // sin permiso el select se comería un 403 mudo. Mismo criterio que
      // `listLlms` en la vista de ejecuciones (línea 464).
      listLlms: ["llm:l", "llm:r"],
    },
  },
  advanced: {
    // Sin `nav`: dejó de ser un tab del nav central y pasó al grupo
    // "Herramientas" del dropdown de configuración (ver app-layout.tsx).
    route: "advanced/:section",
    routePermissions: ["section_execution:r", "section_execution:l"],
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
    // Sin `nav`: vive en el dropdown de Settings, no en navigationItems
    // (mismo criterio que models/organizations/roles).
    route: "token-usage",
    routePermissions: ["token_usage:r", "token_usage:l"],
    features: {
      viewSummary: ["token_usage:r", "token_usage:l"],
      listByUser: ["token_usage:r", "token_usage:l"],
      viewDailySeries: ["token_usage:r", "token_usage:l"],
      filterByUser: ["user:l", "user:r"],
    },
  },
  workflow: {
    // Vista sobre el mismo recurso que /asset (`asset`), con otro envoltorio:
    // tabla de workflows + panel derecho con el wizard de respuesta. Eje RBAC
    // GRUESO (`asset:*`) a propósito, mismo criterio que RBAC_PAGES.asset —
    // ver el cruce lifecycle × RBAC en ia context/rbac-audit-guide.md.
    route: "workflow",
    routePermissions: ["asset:l", "asset:r"],
    nav: { title: "Workflow", orgScoped: true },
    features: {
      listWorkflows: ["asset:l", "asset:r"], // GET /workflows/
      readAsset: ["asset:r", "asset:l"], // GET /documents/{id}/content
      // Responder formularios (PATCH /form_values), review_status, editar
      // nombre/código (PUT /documents/{id}) y las 6 transiciones de lifecycle.
      updateAssetContent: "asset:u",
      // POST /document_types/{id}/templates/{id}/express crea un documento real.
      createExpressAsset: "asset:c",
      // Tarjetas de "iniciar" + filtro templateId (GET /templates/).
      listTemplates: ["template:l", "template:r"],
      // Los filtros son superficie RBAC: cada combobox asíncrono pega a su
      // propio endpoint y sin permiso se come un 403 mudo al abrirse.
      listAssetTypes: ["asset_type:l", "asset_type:r"], // filtro documentTypeId
      listUsers: ["user:l", "user:r"], // filtro ownerValue
      listCustomFields: ["custom_fields:l", "custom_fields:r"], // filtro customFieldFilter
      // DELETE /documents/{id} — borra el activo entero (documento + ejecuciones).
      deleteAsset: "asset:d",
    },
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
