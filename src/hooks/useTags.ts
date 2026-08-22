import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import {
  getTags,
  getTag,
  createTag,
  updateTag,
  deleteTag,
  assignTagToObject,
  getTagObjects,
  unassignTagFromObject,
  getObjectTags,
} from "@/services/tags"
import type {
  Tag,
  GetTagsParams,
  GetTagObjectsParams,
  UpdateTagRequest,
  AssignTagObjectRequest,
  TagObjectType,
} from "@/types/tags"

// Query keys
export const tagsQueryKeys = {
  all: ['tags'] as const,
  lists: () => [...tagsQueryKeys.all, 'list'] as const,
  list: (params?: GetTagsParams) => [...tagsQueryKeys.lists(), params] as const,
  details: () => [...tagsQueryKeys.all, 'detail'] as const,
  detail: (tagId: string) => [...tagsQueryKeys.details(), tagId] as const,
  // objetos que tienen una etiqueta (paginado)
  objects: () => [...tagsQueryKeys.all, 'objects'] as const,
  objectsList: (tagId: string, params?: GetTagObjectsParams) => [...tagsQueryKeys.objects(), tagId, params] as const,
  // etiquetas de un objeto puntual
  byObject: () => [...tagsQueryKeys.all, 'by-object'] as const,
  objectTags: (objectType: TagObjectType, objectId: string) => [...tagsQueryKeys.byObject(), objectType, objectId] as const,
}

// Hook for fetching the tags catalog (paginated, optional search)
export function useTags(options?: GetTagsParams & { enabled?: boolean }) {
  const { enabled = true, ...params } = options || {}
  return useQuery({
    queryKey: tagsQueryKeys.list(params),
    queryFn: () => getTags(params),
    placeholderData: (prev) => prev, // obligatorio: alimenta un HuemulTable
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 0,
  })
}

// Hook for fetching a single tag
export function useTag(tagId: string, enabled = true) {
  return useQuery({
    queryKey: tagsQueryKeys.detail(tagId),
    queryFn: () => getTag(tagId),
    enabled: enabled && !!tagId,
    retry: 0,
  })
}

// Hook for fetching the objects a tag is assigned to (paginated)
export function useTagObjects(tagId: string, params?: GetTagObjectsParams, options?: { enabled?: boolean }) {
  const { enabled = true } = options || {}
  return useQuery({
    queryKey: tagsQueryKeys.objectsList(tagId, params),
    queryFn: () => getTagObjects(tagId, params),
    placeholderData: (prev) => prev,
    enabled: enabled && !!tagId,
    retry: 0,
  })
}

// Hook for fetching the tags assigned to a given object — el más usado, para
// pintar los chips de etiquetas en el detalle de un documento/template/document type.
export function useObjectTags(objectType: TagObjectType, objectId: string, options?: { enabled?: boolean }) {
  const { enabled = true } = options || {}
  return useQuery({
    queryKey: tagsQueryKeys.objectTags(objectType, objectId),
    queryFn: () => getObjectTags(objectType, objectId),
    enabled: enabled && !!objectId,
    staleTime: 2 * 60 * 1000,
    retry: 0,
  })
}

// Tags mutations hook
export function useTagMutations() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('tags')

  const createMutation = useMutation({
    mutationFn: createTag,
    meta: { successMessage: t('mutations.createSuccess') },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagsQueryKeys.lists() })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ tagId, data }: { tagId: string; data: UpdateTagRequest }) => updateTag(tagId, data),
    meta: { successMessage: t('mutations.updateSuccess') },
    onSuccess: () => {
      // Nombre/color cambian también en by-object y en las listas de objetos.
      queryClient.invalidateQueries({ queryKey: tagsQueryKeys.all })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (tagId: string) => deleteTag(tagId),
    meta: { successMessage: t('mutations.deleteSuccess') },
    onSuccess: () => {
      // El borrado arrastra en cascada todas las asignaciones: soltar by-object completo.
      queryClient.invalidateQueries({ queryKey: tagsQueryKeys.all })
    },
  })

  // assign/unassign SIN successMessage: el picker de asignación guarda en
  // inmediato, un toast por cada chip agregado/quitado sería ruido — el
  // propio chip apareciendo/desapareciendo ya es el feedback (ver
  // huemul-tag-picker.tsx). Los errores sí se muestran vía el onError
  // global de mutations en src/lib/query-client.ts.
  //
  // Optimista: el chip se pinta/quita antes de que responda el backend
  // (mismo patrón que useTemplateSectionLifecycleAccess.applyOptimisticAccess),
  // con rollback en onError. `tag` es opcional porque el llamador puede no
  // tener el objeto completo a mano (ej. quitar por id); sin él se omite el
  // patch optimista de assign y sólo queda la invalidación en onSettled.
  const assignMutation = useMutation({
    mutationFn: ({ tagId, data }: { tagId: string; data: AssignTagObjectRequest; tag?: Tag }) =>
      assignTagToObject(tagId, data),
    onMutate: async ({ tagId, data, tag }) => {
      const queryKey = tagsQueryKeys.objectTags(data.object_type, data.object_id)
      await queryClient.cancelQueries({ queryKey })
      const snapshot = queryClient.getQueryData<Tag[]>(queryKey)
      if (tag) {
        queryClient.setQueryData<Tag[]>(queryKey, (prev) => {
          const list = prev ?? []
          if (list.some((t) => t.id === tagId)) return list
          return [...list, tag].sort((a, b) => a.name.localeCompare(b.name))
        })
      }
      return { queryKey, snapshot }
    },
    onError: (_error, _vars, context) => {
      if (context) queryClient.setQueryData(context.queryKey, context.snapshot)
    },
    onSettled: (_data, _error, { data }) => {
      queryClient.invalidateQueries({ queryKey: tagsQueryKeys.objects() })
      queryClient.invalidateQueries({ queryKey: tagsQueryKeys.objectTags(data.object_type, data.object_id) })
    },
  })

  const unassignMutation = useMutation({
    mutationFn: ({ tagId, objectType, objectId }: { tagId: string; objectType: TagObjectType; objectId: string }) =>
      unassignTagFromObject(tagId, objectType, objectId),
    onMutate: async ({ tagId, objectType, objectId }) => {
      const queryKey = tagsQueryKeys.objectTags(objectType, objectId)
      await queryClient.cancelQueries({ queryKey })
      const snapshot = queryClient.getQueryData<Tag[]>(queryKey)
      queryClient.setQueryData<Tag[]>(queryKey, (prev) => (prev ?? []).filter((t) => t.id !== tagId))
      return { queryKey, snapshot }
    },
    onError: (_error, _vars, context) => {
      if (context) queryClient.setQueryData(context.queryKey, context.snapshot)
    },
    onSettled: (_data, _error, { objectType, objectId }) => {
      queryClient.invalidateQueries({ queryKey: tagsQueryKeys.objects() })
      queryClient.invalidateQueries({ queryKey: tagsQueryKeys.objectTags(objectType, objectId) })
    },
  })

  return {
    createTag: createMutation,
    updateTag: updateMutation,
    deleteTag: deleteMutation,
    assignTagToObject: assignMutation,
    unassignTagFromObject: unassignMutation,
  }
}
