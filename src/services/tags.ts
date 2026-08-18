import { backendUrl } from '@/config';
import { httpClient } from '@/lib/http-client';
import type {
  Tag,
  TagObjectAssignment,
  GetTagsParams,
  GetTagObjectsParams,
  CreateTagRequest,
  UpdateTagRequest,
  AssignTagObjectRequest,
  TagsResponse,
  TagObjectsResponse,
  TagApiResponse,
  TagObjectType,
} from '@/types/tags';

export type { Tag, TagObjectAssignment, TagsResponse, TagObjectsResponse };

const BASE_URL = `${backendUrl}/tags`;

// Nota: X-Org-Id lo inyecta httpClient desde el contexto de organización activa
// (ver src/lib/http-client.ts). No pasarlo a mano leyendo localStorage: ese header
// gana sobre el de httpClient y puede servir una organización obsoleta tras un
// cambio de organización activa.

// Get all tags (paginated, optional search by name)
export const getTags = async (params?: GetTagsParams): Promise<TagsResponse> => {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', params.page.toString());
  if (params?.page_size) query.set('page_size', params.page_size.toString());
  if (params?.search?.trim()) query.set('search', params.search.trim());

  const qs = query.toString();
  const response = await httpClient.get(`${BASE_URL}/${qs ? `?${qs}` : ''}`);

  return response.json();
};

// Get single tag
export const getTag = async (tagId: string): Promise<Tag> => {
  const response = await httpClient.get(`${BASE_URL}/${tagId}`);

  const result: TagApiResponse<Tag> = await response.json();
  return result.data;
};

// Create new tag. Nombre duplicado (case-sensitive, exacto) devuelve 400.
export const createTag = async (data: CreateTagRequest): Promise<Tag> => {
  const response = await httpClient.post(`${BASE_URL}/`, data);

  const result: TagApiResponse<Tag> = await response.json();
  return result.data;
};

// Update tag. Los tres campos son opcionales: se actualiza solo lo que se manda.
export const updateTag = async (tagId: string, data: UpdateTagRequest): Promise<Tag> => {
  const response = await httpClient.put(`${BASE_URL}/${tagId}`, data);

  const result: TagApiResponse<Tag> = await response.json();
  return result.data;
};

// Delete tag. Elimina en cascada todas sus asignaciones a objetos.
export const deleteTag = async (tagId: string): Promise<void> => {
  await httpClient.delete(`${BASE_URL}/${tagId}`);
};

// Assign a tag to an object. Idempotente: si ya estaba asignada, devuelve 200
// con la asignación existente (no crea duplicados) — se puede llamar sin
// chequear antes si ya estaba asignada.
export const assignTagToObject = async (
  tagId: string,
  data: AssignTagObjectRequest
): Promise<TagObjectAssignment> => {
  const response = await httpClient.post(`${BASE_URL}/${tagId}/objects`, data);

  const result: TagApiResponse<TagObjectAssignment> = await response.json();
  return result.data;
};

// List the objects a tag is assigned to (paginated). Cada item es la
// asignación (object_type + object_id), no el detalle del objeto.
export const getTagObjects = async (
  tagId: string,
  params?: GetTagObjectsParams
): Promise<TagObjectsResponse> => {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', params.page.toString());
  if (params?.page_size) query.set('page_size', params.page_size.toString());

  const qs = query.toString();
  const response = await httpClient.get(`${BASE_URL}/${tagId}/objects${qs ? `?${qs}` : ''}`);

  return response.json();
};

// Remove a tag from an object. 404 si la asignación no existe.
export const unassignTagFromObject = async (
  tagId: string,
  objectType: TagObjectType,
  objectId: string
): Promise<void> => {
  await httpClient.delete(`${BASE_URL}/${tagId}/objects/${objectType}/${objectId}`);
};

// List the tags assigned to a given object. [] si no tiene ninguna,
// ordenadas alfabéticamente por nombre.
export const getObjectTags = async (objectType: TagObjectType, objectId: string): Promise<Tag[]> => {
  const response = await httpClient.get(`${BASE_URL}/by-object/${objectType}/${objectId}`);

  const result: TagApiResponse<Tag[]> = await response.json();
  return result.data;
};
