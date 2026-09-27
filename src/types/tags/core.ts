// Tipos de objeto etiquetables soportados por el backend. Mandar cualquier otro
// valor devuelve 400: agregar uno nuevo requiere cambio de backend.
export type TagObjectType = 'document' | 'template' | 'document_type';

export interface Tag {
  id: string;
  name: string;
  color: string | null; // string libre: el backend no valida formato hex
  description: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

// Relación etiqueta ↔ objeto. No trae el nombre del objeto etiquetado:
// resolverlo con el endpoint del módulo correspondiente (document/template/document_type).
export interface TagObjectAssignment {
  id: string;
  tag_id: string;
  object_type: TagObjectType;
  object_id: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface GetTagsParams {
  page?: number;
  page_size?: number;
  search?: string;
}

export interface GetTagObjectsParams {
  page?: number;
  page_size?: number;
}

export interface CreateTagRequest {
  name: string;
  color?: string | null;
  description?: string | null;
}

// Los tres campos son opcionales: se actualiza solo lo que se manda.
export interface UpdateTagRequest {
  name?: string;
  color?: string | null;
  description?: string | null;
}

export interface AssignTagObjectRequest {
  object_type: TagObjectType;
  object_id: string;
}

export interface TagsResponse {
  data: Tag[];
  transaction_id: string;
  page: number;
  page_size: number;
  has_next: boolean;
  timestamp: string;
}

export interface TagObjectsResponse {
  data: TagObjectAssignment[];
  transaction_id: string;
  page: number;
  page_size: number;
  has_next: boolean;
  timestamp: string;
}

export interface TagApiResponse<T> {
  data: T;
  transaction_id: string;
  timestamp: string;
}
