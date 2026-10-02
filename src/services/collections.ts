import { backendUrl } from '@/config';
import { httpClient } from '@/lib/http-client';
import type {
  Collection,
  CollectionAccessList,
  CollectionApiResponse,
  CollectionDetail,
  CollectionGroup,
  CollectionItem,
  CollectionItemOrderEntry,
  CollectionsResponse,
  AddCollectionItemRequest,
  CreateCollectionRequest,
  GetCollectionsParams,
  UpdateCollectionAccessRequest,
  UpdateCollectionItemRequest,
  UpdateCollectionRequest,
} from '@/types/collections';

const BASE_URL = `${backendUrl}/collections`;

// Nota: X-Org-Id lo inyecta httpClient desde el contexto de organización activa
// (ver src/lib/http-client.ts).

async function data<T>(response: Response): Promise<T> {
  const result: CollectionApiResponse<T> = await response.json();
  return result.data;
}

// Colecciones que el usuario puede leer (públicas, propias o compartidas).
export const getCollections = async (params?: GetCollectionsParams): Promise<CollectionsResponse> => {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', params.page.toString());
  if (params?.page_size) query.set('page_size', params.page_size.toString());
  if (params?.audience) query.set('audience', params.audience);
  if (params?.search?.trim()) query.set('search', params.search.trim());
  if (params?.can_admin) query.set('can_admin', 'true');
  if (params?.contains_document_id) query.set('contains_document_id', params.contains_document_id);

  const qs = query.toString();
  const response = await httpClient.get(`${BASE_URL}/${qs ? `?${qs}` : ''}`);
  return response.json();
};

// Detalle: grupos y activos visibles en orden, cada uno con la versión que se muestra.
export const getCollection = async (collectionId: string): Promise<CollectionDetail> =>
  data(await httpClient.get(`${BASE_URL}/${collectionId}`));

// Una colección para agentes exige además collection_agent:c (403 si falta).
export const createCollection = async (body: CreateCollectionRequest): Promise<Collection> =>
  data(await httpClient.post(`${BASE_URL}/`, body));

// Actualización parcial: solo se aplican los campos enviados.
export const updateCollection = async (collectionId: string, body: UpdateCollectionRequest): Promise<Collection> =>
  data(await httpClient.put(`${BASE_URL}/${collectionId}`, body));

export const deleteCollection = async (collectionId: string): Promise<void> => {
  await httpClient.delete(`${BASE_URL}/${collectionId}`);
};

// ── Grupos ──

export const createCollectionGroup = async (collectionId: string, name: string): Promise<CollectionGroup> =>
  data(await httpClient.post(`${BASE_URL}/${collectionId}/groups`, { name }));

export const renameCollectionGroup = async (collectionId: string, groupId: string, name: string): Promise<CollectionGroup> =>
  data(await httpClient.put(`${BASE_URL}/${collectionId}/groups/${groupId}`, { name }));

// Borrar un grupo deja sus activos sin grupo (no los quita de la colección).
export const deleteCollectionGroup = async (collectionId: string, groupId: string): Promise<void> => {
  await httpClient.delete(`${BASE_URL}/${collectionId}/groups/${groupId}`);
};

// Exige todos los grupos de la colección, en el orden nuevo.
export const reorderCollectionGroups = async (collectionId: string, groupIds: string[]): Promise<CollectionGroup[]> =>
  data(await httpClient.put(`${BASE_URL}/${collectionId}/groups/order`, { group_ids: groupIds }));

// ── Activos ──

export const addCollectionItem = async (collectionId: string, body: AddCollectionItemRequest): Promise<CollectionItem> =>
  data(await httpClient.post(`${BASE_URL}/${collectionId}/items`, body));

export const updateCollectionItem = async (
  collectionId: string,
  itemId: string,
  body: UpdateCollectionItemRequest,
): Promise<CollectionItem> => data(await httpClient.patch(`${BASE_URL}/${collectionId}/items/${itemId}`, body));

export const removeCollectionItem = async (collectionId: string, itemId: string): Promise<void> => {
  await httpClient.delete(`${BASE_URL}/${collectionId}/items/${itemId}`);
};

// Lista plana con los ítems que el usuario ve: el orden y el grupo de cada uno. Los que no ve
// los conserva el backend, al final de su grupo.
export const reorderCollectionItems = async (
  collectionId: string,
  items: CollectionItemOrderEntry[],
): Promise<CollectionDetail> => data(await httpClient.put(`${BASE_URL}/${collectionId}/items/order`, { items }));

// ── Accesos ──

// El creador y cada acceso con el nombre del rol o de la persona (y si sigue siendo miembro).
export const getCollectionAccess = async (collectionId: string): Promise<CollectionAccessList> =>
  data(await httpClient.get(`${BASE_URL}/${collectionId}/access`));

// Cambios explícitos: `add` da o cambia el nivel, `remove` quita. Lo que no se nombra queda como
// está; nunca se manda la lista completa. Devuelve los accesos resultantes.
export const updateCollectionAccess = async (
  collectionId: string,
  changes: UpdateCollectionAccessRequest,
): Promise<CollectionAccessList> => data(await httpClient.patch(`${BASE_URL}/${collectionId}/access`, changes));

