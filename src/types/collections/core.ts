// Colecciones (backend: src/modules/collection). Una colección reúne activos en
// orden, con grupos de un nivel, para personas o para agentes (`for_agent`).

export type CollectionAgentKind = 'knowledge' | 'behavior'
export type CollectionAccessLevel = 'read' | 'admin'
export type CollectionAudience = 'human' | 'agent'

export const COLLECTION_NAME_MAX_LENGTH = 200
export const COLLECTION_INSTRUCTIONS_MAX_LENGTH = 10000

export interface Collection {
  id: string
  name: string
  description: string | null
  /** Reglas generales: van antes que los activos (al agente) y en la portada (a las personas). */
  instructions: string | null
  is_public: boolean
  for_agent: boolean
  agent_slug: string | null
  agent_usage: string | null
  agent_kind: CollectionAgentKind
  created_by: string | null
  updated_by: string | null
  created_at: string | null
  updated_at: string | null
  /** Listado: activos que el usuario puede ver. */
  item_count?: number
  can_admin?: boolean
  /** Listado con `contains_document_id`. */
  contains_document?: boolean
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

export interface CollectionItem {
  id: string
  document_id: string
  group_id: string | null
  position: number
  title: string | null
  internal_code: string | null
  document_type_id: string | null
  version: CollectionItemVersion | null
}

export interface CollectionDetail extends Collection {
  can_admin: boolean
  groups: CollectionGroup[]
  /** Activos visibles en orden: sin grupo primero, después cada grupo. */
  items: CollectionItem[]
  /** Activos de la colección que el usuario no puede ver (se omiten). */
  hidden_item_count: number
}

export interface CollectionAccess {
  id?: string
  role_id: string | null
  user_id: string | null
  access_level: CollectionAccessLevel
}

export interface CollectionFormData {
  name: string
  description: string
  instructions: string
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
}

export interface CollectionsResponse {
  data: Collection[]
  page: number
  page_size: number
  has_next: boolean
}

export interface AddCollectionItemRequest {
  document_id: string
  group_id?: string | null
  execution_id?: string | null
}

/** `null` explícito: sin grupo / volver a la versión oficial. */
export interface UpdateCollectionItemRequest {
  group_id?: string | null
  execution_id?: string | null
}

export interface CollectionItemOrderEntry {
  item_id: string
  group_id: string | null
}

export interface CollectionApiResponse<T> {
  data: T
  transaction_id: string
}
