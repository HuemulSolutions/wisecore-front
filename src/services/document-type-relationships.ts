import { backendUrl } from '@/config'
import { httpClient } from '@/lib/http-client'
import type {
  AttributeTypeOption,
  DocumentTypeRelationship,
  DocumentTypeRelationshipResponse,
  DocumentTypeRelationshipsResponse,
  GetDocumentTypeRelationshipsParams,
  CreateDocumentTypeRelationshipRequest,
  UpdateDocumentTypeRelationshipRequest,
  RelationshipAttributeDefinition,
  RelationshipAttributeDefinitionResponse,
  RelationshipAttributeDefinitionsResponse,
  CreateRelationshipAttributeRequest,
  UpdateRelationshipAttributeRequest,
} from '@/types/document-type-relationships'

const BASE_URL = `${backendUrl}/document_type_relationships`

// ─── Attribute types ──────────────────────────────────────────────────────────

export async function getRelationshipAttributeTypes(): Promise<AttributeTypeOption[]> {
  const response = await httpClient.get(`${BASE_URL}/attribute-types`)
  return response.json() as Promise<AttributeTypeOption[]>
}

// ─── Relationships ────────────────────────────────────────────────────────────

export async function getDocumentTypeRelationships(
  organizationId: string,
  params: GetDocumentTypeRelationshipsParams = {},
): Promise<DocumentTypeRelationshipsResponse> {
  const { page = 1, page_size = 100, search, document_type_id, include_subrelationships } = params

  const query = new URLSearchParams({
    page: page.toString(),
    page_size: page_size.toString(),
  })
  if (search?.trim()) query.set('search', search.trim())
  if (document_type_id?.trim()) query.set('document_type_id', document_type_id.trim())
  if (include_subrelationships !== undefined)
    query.set('include_subrelationships', String(include_subrelationships))

  const response = await httpClient.get(`${BASE_URL}/?${query}`, {
    headers: { 'X-Org-Id': organizationId },
  })
  return response.json() as Promise<DocumentTypeRelationshipsResponse>
}

export async function getDocumentTypeRelationship(
  organizationId: string,
  relationshipId: string,
): Promise<DocumentTypeRelationship> {
  const response = await httpClient.get(`${BASE_URL}/${relationshipId}`, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as DocumentTypeRelationshipResponse
  return data.data
}

export async function createDocumentTypeRelationship(
  organizationId: string,
  body: CreateDocumentTypeRelationshipRequest,
): Promise<DocumentTypeRelationship> {
  const response = await httpClient.post(`${BASE_URL}/`, body, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as DocumentTypeRelationshipResponse
  return data.data
}

export async function updateDocumentTypeRelationship(
  organizationId: string,
  relationshipId: string,
  body: UpdateDocumentTypeRelationshipRequest,
): Promise<DocumentTypeRelationship> {
  const response = await httpClient.patch(`${BASE_URL}/${relationshipId}`, body, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as DocumentTypeRelationshipResponse
  return data.data
}

export async function deleteDocumentTypeRelationship(
  organizationId: string,
  relationshipId: string,
): Promise<void> {
  await httpClient.delete(`${BASE_URL}/${relationshipId}`, {
    headers: { 'X-Org-Id': organizationId },
  })
}

// ─── Relationship attributes ──────────────────────────────────────────────────

export async function getRelationshipAttributes(
  organizationId: string,
  relationshipId: string,
): Promise<RelationshipAttributeDefinition[]> {
  const response = await httpClient.get(`${BASE_URL}/${relationshipId}/attributes`, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as RelationshipAttributeDefinitionsResponse
  return data.data
}

export async function getRelationshipAttribute(
  organizationId: string,
  relationshipId: string,
  attributeId: string,
): Promise<RelationshipAttributeDefinition> {
  const response = await httpClient.get(
    `${BASE_URL}/${relationshipId}/attributes/${attributeId}`,
    { headers: { 'X-Org-Id': organizationId } },
  )
  const data = (await response.json()) as RelationshipAttributeDefinitionResponse
  return data.data
}

export async function createRelationshipAttribute(
  organizationId: string,
  relationshipId: string,
  body: CreateRelationshipAttributeRequest,
): Promise<RelationshipAttributeDefinition> {
  const response = await httpClient.post(
    `${BASE_URL}/${relationshipId}/attributes`,
    body,
    { headers: { 'X-Org-Id': organizationId } },
  )
  const data = (await response.json()) as RelationshipAttributeDefinitionResponse
  return data.data
}

export async function updateRelationshipAttribute(
  organizationId: string,
  relationshipId: string,
  attributeId: string,
  body: UpdateRelationshipAttributeRequest,
): Promise<RelationshipAttributeDefinition> {
  const response = await httpClient.patch(
    `${BASE_URL}/${relationshipId}/attributes/${attributeId}`,
    body,
    { headers: { 'X-Org-Id': organizationId } },
  )
  const data = (await response.json()) as RelationshipAttributeDefinitionResponse
  return data.data
}

export async function deleteRelationshipAttribute(
  organizationId: string,
  relationshipId: string,
  attributeId: string,
): Promise<void> {
  await httpClient.delete(
    `${BASE_URL}/${relationshipId}/attributes/${attributeId}`,
    { headers: { 'X-Org-Id': organizationId } },
  )
}

export type { DocumentTypeRelationship, DocumentTypeRelationshipsResponse }
