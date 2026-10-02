import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useOrganization } from "@/contexts/organization-context"
import {
  addCollectionItem,
  createCollection,
  createCollectionGroup,
  deleteCollection,
  deleteCollectionGroup,
  getCollection,
  getCollectionAccess,
  getCollections,
  removeCollectionItem,
  renameCollectionGroup,
  reorderCollectionGroups,
  reorderCollectionItems,
  updateCollection,
  updateCollectionAccess,
  updateCollectionItem,
} from "@/services/collections"
import type {
  AddCollectionItemRequest,
  CollectionDetail,
  CollectionItemOrderEntry,
  GetCollectionsParams,
  UpdateCollectionAccessRequest,
  UpdateCollectionItemRequest,
  UpdateCollectionRequest,
} from "@/types/collections"

// Todas las keys llevan la organización: cambiar de organización no limpia la caché, y sin
// ella el listado (con `placeholderData`) mostraría las colecciones de la anterior.
export const collectionsQueryKeys = {
  all: ['collections'] as const,
  org: (organizationId: string | null) => [...collectionsQueryKeys.all, organizationId] as const,
  lists: (organizationId: string | null) => [...collectionsQueryKeys.org(organizationId), 'list'] as const,
  list: (organizationId: string | null, params?: GetCollectionsParams) =>
    [...collectionsQueryKeys.lists(organizationId), params] as const,
  detail: (organizationId: string | null, collectionId: string) =>
    [...collectionsQueryKeys.org(organizationId), 'detail', collectionId] as const,
  access: (organizationId: string | null, collectionId: string) =>
    [...collectionsQueryKeys.org(organizationId), 'access', collectionId] as const,
}

export function useCollections(options?: GetCollectionsParams & { enabled?: boolean }) {
  const { enabled = true, ...params } = options || {}
  const { selectedOrganizationId } = useOrganization()
  return useQuery({
    queryKey: collectionsQueryKeys.list(selectedOrganizationId, params),
    queryFn: () => getCollections(params),
    placeholderData: (prev) => prev,
    enabled: enabled && !!selectedOrganizationId,
    staleTime: 60 * 1000,
    retry: 0,
  })
}

export function useCollection(collectionId: string | undefined, enabled = true) {
  const { selectedOrganizationId } = useOrganization()
  return useQuery({
    queryKey: collectionsQueryKeys.detail(selectedOrganizationId, collectionId ?? ''),
    queryFn: () => getCollection(collectionId!),
    enabled: enabled && !!collectionId && !!selectedOrganizationId,
    retry: 0,
  })
}

export function useCollectionAccess(collectionId: string | undefined, enabled = true) {
  const { selectedOrganizationId } = useOrganization()
  return useQuery({
    queryKey: collectionsQueryKeys.access(selectedOrganizationId, collectionId ?? ''),
    queryFn: () => getCollectionAccess(collectionId!),
    enabled: enabled && !!collectionId && !!selectedOrganizationId,
    retry: 0,
  })
}

/**
 * Mutaciones de colecciones. Los errores (403 por permisos, 409 por identificador
 * duplicado) los muestra el onError global de src/lib/query-client.ts; los
 * formularios además atajan el 409 para marcar el campo.
 */
export function useCollectionMutations() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('collections')
  const { selectedOrganizationId } = useOrganization()
  const keys = {
    lists: () => collectionsQueryKeys.lists(selectedOrganizationId),
    detail: (collectionId: string) => collectionsQueryKeys.detail(selectedOrganizationId, collectionId),
    access: (collectionId: string) => collectionsQueryKeys.access(selectedOrganizationId, collectionId),
  }

  const invalidateDetail = (collectionId: string) => {
    queryClient.invalidateQueries({ queryKey: keys.detail(collectionId) })
    queryClient.invalidateQueries({ queryKey: keys.lists() })
  }

  const createMutation = useMutation({
    mutationFn: createCollection,
    meta: { successMessage: t('mutations.createSuccess') },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.lists() }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ collectionId, data }: { collectionId: string; data: UpdateCollectionRequest }) =>
      updateCollection(collectionId, data),
    meta: { successMessage: t('mutations.updateSuccess') },
    onSuccess: (_data, { collectionId }) => invalidateDetail(collectionId),
  })

  const deleteMutation = useMutation({
    mutationFn: (collectionId: string) => deleteCollection(collectionId),
    meta: { successMessage: t('mutations.deleteSuccess') },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: collectionsQueryKeys.org(selectedOrganizationId) }),
  })

  const createGroupMutation = useMutation({
    mutationFn: ({ collectionId, name }: { collectionId: string; name: string }) => createCollectionGroup(collectionId, name),
    onSuccess: (_data, { collectionId }) => invalidateDetail(collectionId),
  })

  const renameGroupMutation = useMutation({
    mutationFn: ({ collectionId, groupId, name }: { collectionId: string; groupId: string; name: string }) =>
      renameCollectionGroup(collectionId, groupId, name),
    onSuccess: (_data, { collectionId }) => invalidateDetail(collectionId),
  })

  const deleteGroupMutation = useMutation({
    mutationFn: ({ collectionId, groupId }: { collectionId: string; groupId: string }) =>
      deleteCollectionGroup(collectionId, groupId),
    onSuccess: (_data, { collectionId }) => invalidateDetail(collectionId),
  })

  const reorderGroupsMutation = useMutation({
    mutationFn: ({ collectionId, groupIds }: { collectionId: string; groupIds: string[] }) =>
      reorderCollectionGroups(collectionId, groupIds),
    onSuccess: (_data, { collectionId }) => invalidateDetail(collectionId),
  })

  const addItemMutation = useMutation({
    mutationFn: ({ collectionId, data }: { collectionId: string; data: AddCollectionItemRequest }) =>
      addCollectionItem(collectionId, data),
    // Sin toast: el selector queda abierto para elegir varios y cada activo aparece en el índice.
    onSuccess: (_data, { collectionId }) => invalidateDetail(collectionId),
  })

  const updateItemMutation = useMutation({
    mutationFn: ({ collectionId, itemId, data }: { collectionId: string; itemId: string; data: UpdateCollectionItemRequest }) =>
      updateCollectionItem(collectionId, itemId, data),
    onSuccess: (_data, { collectionId }) => invalidateDetail(collectionId),
  })

  const removeItemMutation = useMutation({
    mutationFn: ({ collectionId, itemId }: { collectionId: string; itemId: string }) =>
      removeCollectionItem(collectionId, itemId),
    meta: { successMessage: t('mutations.itemRemoved') },
    onSuccess: (_data, { collectionId }) => invalidateDetail(collectionId),
  })

  // Optimista: el índice se reordena antes de que responda el backend; la
  // respuesta trae el detalle completo y reemplaza al optimista.
  const reorderItemsMutation = useMutation({
    mutationFn: ({ collectionId, items }: { collectionId: string; items: CollectionItemOrderEntry[]; optimistic?: CollectionDetail }) =>
      reorderCollectionItems(collectionId, items),
    onMutate: async ({ collectionId, optimistic }) => {
      const queryKey = keys.detail(collectionId)
      await queryClient.cancelQueries({ queryKey })
      const snapshot = queryClient.getQueryData<CollectionDetail>(queryKey)
      if (optimistic) queryClient.setQueryData(queryKey, optimistic)
      return { queryKey, snapshot }
    },
    onError: (_error, _vars, context) => {
      if (context) queryClient.setQueryData(context.queryKey, context.snapshot)
    },
    onSuccess: (detail, { collectionId }) => {
      queryClient.setQueryData(keys.detail(collectionId), detail)
    },
  })

  // Cambios explícitos: solo lo que se agrega y lo que se quita, nunca la lista completa.
  const updateAccessMutation = useMutation({
    mutationFn: ({ collectionId, changes }: { collectionId: string; changes: UpdateCollectionAccessRequest }) =>
      updateCollectionAccess(collectionId, changes),
    meta: { successMessage: t('mutations.accessSaved') },
    onSuccess: (accesses, { collectionId }) => {
      queryClient.setQueryData(keys.access(collectionId), accesses)
      invalidateDetail(collectionId)
    },
  })

  return {
    createCollection: createMutation,
    updateCollection: updateMutation,
    deleteCollection: deleteMutation,
    createGroup: createGroupMutation,
    renameGroup: renameGroupMutation,
    deleteGroup: deleteGroupMutation,
    reorderGroups: reorderGroupsMutation,
    addItem: addItemMutation,
    updateItem: updateItemMutation,
    removeItem: removeItemMutation,
    reorderItems: reorderItemsMutation,
    updateAccess: updateAccessMutation,
  }
}
