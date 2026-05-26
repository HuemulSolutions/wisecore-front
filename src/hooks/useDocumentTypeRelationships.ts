import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getRelationshipAttributeTypes,
  getDocumentTypeRelationships,
  getDocumentTypeRelationship,
  createDocumentTypeRelationship,
  updateDocumentTypeRelationship,
  deleteDocumentTypeRelationship,
  getRelationshipAttributes,
  getRelationshipAttribute,
  createRelationshipAttribute,
  updateRelationshipAttribute,
  deleteRelationshipAttribute,
} from '@/services/document-type-relationships'
import type {
  CreateDocumentTypeRelationshipRequest,
  UpdateDocumentTypeRelationshipRequest,
  CreateRelationshipAttributeRequest,
  UpdateRelationshipAttributeRequest,
} from '@/types/document-type-relationships'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const documentTypeRelationshipQueryKeys = {
  all: ['document-type-relationships'] as const,
  listBase: () => [...documentTypeRelationshipQueryKeys.all, 'list'] as const,
  list: (organizationId: string, page: number, pageSize: number, search?: string) =>
    [
      ...documentTypeRelationshipQueryKeys.listBase(),
      organizationId,
      page,
      pageSize,
      search ?? '',
    ] as const,
  detail: (organizationId: string, relationshipId: string) =>
    [...documentTypeRelationshipQueryKeys.all, 'detail', organizationId, relationshipId] as const,
  attributes: (organizationId: string, relationshipId: string) =>
    [...documentTypeRelationshipQueryKeys.all, 'attributes', organizationId, relationshipId] as const,
  attribute: (organizationId: string, relationshipId: string, attributeId: string) =>
    [
      ...documentTypeRelationshipQueryKeys.all,
      'attribute',
      organizationId,
      relationshipId,
      attributeId,
    ] as const,
  attributeTypes: () => [...documentTypeRelationshipQueryKeys.all, 'attribute-types'] as const,
}

// ─── Options ──────────────────────────────────────────────────────────────────

export interface UseDocumentTypeRelationshipsOptions {
  enabled?: boolean
  page?: number
  pageSize?: number
  search?: string
}

// ─── Attribute types query ─────────────────────────────────────────────────────

export function useRelationshipAttributeTypes() {
  return useQuery({
    queryKey: documentTypeRelationshipQueryKeys.attributeTypes(),
    queryFn: getRelationshipAttributeTypes,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 0,
  })
}

// ─── List query ───────────────────────────────────────────────────────────────

export function useDocumentTypeRelationships(
  organizationId: string,
  options: UseDocumentTypeRelationshipsOptions = {},
) {
  const { enabled = true, page = 1, pageSize = 100, search } = options

  return useQuery({
    queryKey: documentTypeRelationshipQueryKeys.list(organizationId, page, pageSize, search),
    queryFn: () =>
      getDocumentTypeRelationships(organizationId, { page, page_size: pageSize, search }),
    enabled: enabled && !!organizationId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    retry: 0,
  })
}

// ─── Detail query ─────────────────────────────────────────────────────────────

export function useDocumentTypeRelationship(
  organizationId: string,
  relationshipId: string,
) {
  return useQuery({
    queryKey: documentTypeRelationshipQueryKeys.detail(organizationId, relationshipId),
    queryFn: () => getDocumentTypeRelationship(organizationId, relationshipId),
    enabled: !!organizationId && !!relationshipId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 0,
  })
}

// ─── Relationship attributes queries ─────────────────────────────────────────

export function useRelationshipAttributes(
  organizationId: string,
  relationshipId: string,
) {
  return useQuery({
    queryKey: documentTypeRelationshipQueryKeys.attributes(organizationId, relationshipId),
    queryFn: () => getRelationshipAttributes(organizationId, relationshipId),
    enabled: !!organizationId && !!relationshipId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 0,
  })
}

export function useRelationshipAttribute(
  organizationId: string,
  relationshipId: string,
  attributeId: string,
) {
  return useQuery({
    queryKey: documentTypeRelationshipQueryKeys.attribute(
      organizationId,
      relationshipId,
      attributeId,
    ),
    queryFn: () => getRelationshipAttribute(organizationId, relationshipId, attributeId),
    enabled: !!organizationId && !!relationshipId && !!attributeId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 0,
  })
}

// ─── Relationship mutations ───────────────────────────────────────────────────

export function useDocumentTypeRelationshipMutations(organizationId: string) {
  const queryClient = useQueryClient()

  const invalidateList = () =>
    queryClient.invalidateQueries({
      queryKey: documentTypeRelationshipQueryKeys.listBase(),
    })

  const createMutation = useMutation({
    mutationFn: (body: CreateDocumentTypeRelationshipRequest) =>
      createDocumentTypeRelationship(organizationId, body),
    onSuccess: invalidateList,
  })

  const updateMutation = useMutation({
    mutationFn: ({
      relationshipId,
      body,
    }: {
      relationshipId: string
      body: UpdateDocumentTypeRelationshipRequest
    }) => updateDocumentTypeRelationship(organizationId, relationshipId, body),
    onSuccess: (_data, { relationshipId }) => {
      invalidateList()
      queryClient.invalidateQueries({
        queryKey: documentTypeRelationshipQueryKeys.detail(organizationId, relationshipId),
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (relationshipId: string) =>
      deleteDocumentTypeRelationship(organizationId, relationshipId),
    onSuccess: (_data, relationshipId) => {
      invalidateList()
      queryClient.removeQueries({
        queryKey: documentTypeRelationshipQueryKeys.detail(organizationId, relationshipId),
      })
    },
  })

  return {
    createDocumentTypeRelationship: createMutation,
    updateDocumentTypeRelationship: updateMutation,
    deleteDocumentTypeRelationship: deleteMutation,
  }
}

// ─── Relationship attribute mutations ─────────────────────────────────────────

export function useRelationshipAttributeMutations(
  organizationId: string,
  relationshipId: string,
) {
  const queryClient = useQueryClient()

  const invalidateAttributes = () =>
    queryClient.invalidateQueries({
      queryKey: documentTypeRelationshipQueryKeys.attributes(organizationId, relationshipId),
    })

  const createMutation = useMutation({
    mutationFn: (body: CreateRelationshipAttributeRequest) =>
      createRelationshipAttribute(organizationId, relationshipId, body),
    onSuccess: invalidateAttributes,
  })

  const updateMutation = useMutation({
    mutationFn: ({
      attributeId,
      body,
    }: {
      attributeId: string
      body: UpdateRelationshipAttributeRequest
    }) => updateRelationshipAttribute(organizationId, relationshipId, attributeId, body),
    onSuccess: (_data, { attributeId }) => {
      invalidateAttributes()
      queryClient.invalidateQueries({
        queryKey: documentTypeRelationshipQueryKeys.attribute(
          organizationId,
          relationshipId,
          attributeId,
        ),
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (attributeId: string) =>
      deleteRelationshipAttribute(organizationId, relationshipId, attributeId),
    onSuccess: (_data, attributeId) => {
      invalidateAttributes()
      queryClient.removeQueries({
        queryKey: documentTypeRelationshipQueryKeys.attribute(
          organizationId,
          relationshipId,
          attributeId,
        ),
      })
    },
  })

  return {
    createRelationshipAttribute: createMutation,
    updateRelationshipAttribute: updateMutation,
    deleteRelationshipAttribute: deleteMutation,
  }
}
