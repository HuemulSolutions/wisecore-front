import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
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
  replaceCollectionAccess,
  updateCollection,
  updateCollectionItem,
} from "@/services/collections"
import type {
  AddCollectionItemRequest,
  CollectionAccess,
  CollectionDetail,
  CollectionItemOrderEntry,
  GetCollectionsParams,
  UpdateCollectionItemRequest,
  UpdateCollectionRequest,
} from "@/types/collections"

export const collectionsQueryKeys = {
  all: ['collections'] as const,
  lists: () => [...collectionsQueryKeys.all, 'list'] as const,
  list: (params?: GetCollectionsParams) => [...collectionsQueryKeys.lists(), params] as const,
  details: () => [...collectionsQueryKeys.all, 'detail'] as const,
  detail: (collectionId: string) => [...collectionsQueryKeys.details(), collectionId] as const,
  access: (collectionId: string) => [...collectionsQueryKeys.all, 'access', collectionId] as const,
}

export function useCollections(options?: GetCollectionsParams & { enabled?: boolean }) {
  const { enabled = true, ...params } = options || {}
  return useQuery({
    queryKey: collectionsQueryKeys.list(params),
    queryFn: () => getCollections(params),
    placeholderData: (prev) => prev,
    enabled,
    staleTime: 60 * 1000,
    retry: 0,
  })
}

export function useCollection(collectionId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: collectionsQueryKeys.detail(collectionId ?? ''),
    queryFn: () => getCollection(collectionId!),
    enabled: enabled && !!collectionId,
    retry: 0,
  })
}

export function useCollectionAccess(collectionId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: collectionsQueryKeys.access(collectionId ?? ''),
    queryFn: () => getCollectionAccess(collectionId!),
    enabled: enabled && !!collectionId,
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

  const invalidateDetail = (collectionId: string) => {
    queryClient.invalidateQueries({ queryKey: collectionsQueryKeys.detail(collectionId) })
    queryClient.invalidateQueries({ queryKey: collectionsQueryKeys.lists() })
  }

  const createMutation = useMutation({
    mutationFn: createCollection,
    meta: { successMessage: t('mutations.createSuccess') },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: collectionsQueryKeys.lists() }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: collectionsQueryKeys.all }),
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
    meta: { successMessage: t('mutations.itemAdded') },
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
      const queryKey = collectionsQueryKeys.detail(collectionId)
      await queryClient.cancelQueries({ queryKey })
      const snapshot = queryClient.getQueryData<CollectionDetail>(queryKey)
      if (optimistic) queryClient.setQueryData(queryKey, optimistic)
      return { queryKey, snapshot }
    },
    onError: (_error, _vars, context) => {
      if (context) queryClient.setQueryData(context.queryKey, context.snapshot)
    },
    onSuccess: (detail, { collectionId }) => {
      queryClient.setQueryData(collectionsQueryKeys.detail(collectionId), detail)
    },
  })

  const replaceAccessMutation = useMutation({
    mutationFn: ({ collectionId, accesses }: { collectionId: string; accesses: CollectionAccess[] }) =>
      replaceCollectionAccess(collectionId, accesses),
    meta: { successMessage: t('mutations.accessSaved') },
    onSuccess: (_data, { collectionId }) => {
      queryClient.invalidateQueries({ queryKey: collectionsQueryKeys.access(collectionId) })
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
    replaceAccess: replaceAccessMutation,
  }
}
