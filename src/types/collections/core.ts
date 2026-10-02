// Colecciones (backend: src/modules/collection). Una colección reúne activos y otras
// colecciones (sub-colecciones, hasta 10 niveles) en orden, con grupos de un nivel, para
// personas o para agentes (`for_agent`).

export type CollectionAgentKind = 'knowledge' | 'behavior'
export type CollectionAccessLevel = 'read' | 'admin'
export type CollectionAudience = 'human' | 'agent'

export const COLLECTION_NAME_MAX_LENGTH = 200
export const COLLECTION_INSTRUCTIONS_MAX_LENGTH = 10000
/** Niveles de anidamiento: la raíz es el 1 y una cadena no pasa de 10 (lo valida el backend). */
export const COLLECTION_MAX_DEPTH = 10

export interface Collection {
  id: string
  name: string
  description: string | null
  /** Reglas generales: van antes que los activos (al agente) y en la portada (a las personas). */
  instructions: string | null
  /** Las reglas generales como entrada propia del índice, en vez de en la portada. */
  show_instructions_in_menu: boolean
  is_public: boolean
  for_agent: boolean
  agent_slug: string | null
  agent_usage: string | null
  agent_kind: CollectionAgentKind
  created_by: string | null
  updated_by: string | null
  created_at: string | null
  updated_at: string | null
  /** Listado: ítems directos que el usuario puede ver (activos y sub-colecciones). */
  item_count?: number
  can_admin?: boolean
  /** Listado con `contains_document_id`. */
  contains_document?: boolean
  /** Listado: grupos de la colección (para elegir dónde agregar sin pedir el detalle). */
  groups?: CollectionGroup[]
}

export interface CollectionGroup {
  id: string
  name: string
  position: number
}

/** Versión que muestra el ítem: la fija (`pinned`) o la de lectura por defecto. */
export interface CollectionItemVersion {
  execution_id: string
  name: string | null
  version: string | null
  lifecycle_state: string
  pinned: boolean
}

export type CollectionItemKind = 'document' | 'collection'

/** Resumen de una sub-colección dentro de su padre (su contenido se pide con su propio detalle). */
export interface CollectionItemChild {
  id: string
  name: string
  description: string | null
  for_agent: boolean
  /** Ítems directos que el usuario puede ver. */
  item_count: number
  can_admin: boolean
}

/** Un activo (`kind: 'document'`) o una sub-colección (`kind: 'collection'`). */
export interface CollectionItem {
  id: string
  kind: CollectionItemKind
  document_id: string | null
  child_collection_id: string | null
  group_id: string | null
  position: number
  title: string | null
  internal_code?: string | null
  document_type_id?: string | null
  version?: CollectionItemVersion | null
  /** El activo que se muestra como portada (a lo sumo uno por colección; nunca una sub-colección). */
  is_home: boolean
  collection?: CollectionItemChild | null
}

export interface CollectionDetail extends Collection {
  can_admin: boolean
  groups: CollectionGroup[]
  /** Ítems visibles en orden: sin grupo primero, después cada grupo. */
  items: CollectionItem[]
  /** Ítems que el usuario no puede ver (activos ocultos, sub-colecciones que no lee): se omiten. */
  hidden_item_count: number
}

/** Un rol o una persona (exactamente uno de los dos). */
export interface CollectionPrincipal {
  role_id: string | null
  user_id: string | null
}

export interface CollectionAccessGrant extends CollectionPrincipal {
  access_level: CollectionAccessLevel
}

/** Acceso guardado, con el nombre para mostrar. */
export interface CollectionAccess extends CollectionAccessGrant {
  id: string
  role_name?: string
  user?: CollectionPerson | null
  /** Personas: `false` si ya no es miembro de la organización (se puede quitar, no volver a dar). */
  is_member?: boolean
}

export interface CollectionPerson {
  name: string | null
  last_name: string | null
  email: string | null
}

/**
 * `GET /collections/{id}/access`: quién la creó (solo informativo) y los accesos otorgados. El
 * creador administra solo si tiene un grant `admin` en `accesses`, y se le puede quitar.
 */
export interface CollectionAccessList {
  creator: (Partial<CollectionPerson> & { user_id: string }) | null
  accesses: CollectionAccess[]
}

/** Cambios explícitos de acceso: lo que no se nombra queda como está. */
export interface UpdateCollectionAccessRequest {
  add: CollectionAccessGrant[]
  remove: CollectionPrincipal[]
}

export interface CollectionFormData {
  name: string
  description: string
  instructions: string
  show_instructions_in_menu: boolean
  is_public: boolean
  for_agent: boolean
  agent_slug: string
  agent_usage: string
  agent_kind: CollectionAgentKind
}

export type CreateCollectionRequest = Partial<Omit<CollectionFormData, 'name'>> & { name: string }
export type UpdateCollectionRequest = Partial<{
  name: string
  description: string | null
  instructions: string | null
  show_instructions_in_menu: boolean
  is_public: boolean
  for_agent: boolean
  agent_slug: string | null
  agent_usage: string | null
  agent_kind: CollectionAgentKind
}>

export interface GetCollectionsParams {
  page?: number
  page_size?: number
  audience?: CollectionAudience
  search?: string
  can_admin?: boolean
  contains_document_id?: string
  /** Solo las que se podrían agregar dentro de esa colección (misma audiencia, sin ciclos). */
  exclude_nesting_conflicts_for?: string
}

export interface CollectionsResponse {
  data: Collection[]
  page: number
  page_size: number
  has_next: boolean
}

/** Un activo (`document_id`) o una sub-colección (`child_collection_id`), exactamente uno. */
export type AddCollectionItemRequest =
  | { document_id: string; child_collection_id?: never; group_id?: string | null; execution_id?: string | null }
  | { child_collection_id: string; document_id?: never; group_id?: string | null; execution_id?: never }

/** `null` explícito: sin grupo / volver a la versión oficial. */
export interface UpdateCollectionItemRequest {
  group_id?: string | null
  execution_id?: string | null
  /** `true` = portada de la colección (desmarca la anterior); `false` = deja de serlo. */
  is_home?: boolean
}

export interface CollectionItemOrderEntry {
  item_id: string
  group_id: string | null
}

export interface CollectionApiResponse<T> {
  data: T
  transaction_id: string
}
