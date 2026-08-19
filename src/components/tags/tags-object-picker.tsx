"use client"

import { useCallback, useMemo } from "react"
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { HuemulTagPicker } from "@/huemul/components/huemul-tag-picker"
import { tagsQueryKeys, useTagMutations } from "@/hooks/useTags"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { getTags, getObjectTags, createTag } from "@/services/tags"
import { ApiError } from "@/types/api-error"
import type { TagsObjectPickerProps } from "@/types/tags"
import type { FetchOptionsParams, HuemulTagPickerLabels, HuemulTagPickerTag } from "@/types/huemul"

export type { TagsObjectPickerProps } from "@/types/tags"

async function fetchTags({ search, page, pageSize }: FetchOptionsParams) {
  const res = await getTags({ search: search || undefined, page, page_size: pageSize })
  return {
    tags: res.data.map((tag) => ({ id: tag.id, name: tag.name, color: tag.color })),
    hasMore: res.has_next,
  }
}

/**
 * Wrapper de dominio del `HuemulTagPicker`: cablea `TagObjectType`, permisos
 * (`tag:r`/`tag:l` para ver, `tag:c` para crear, `tag:u` para asignar) y las
 * mutaciones de `useTagMutations`. Reemplaza al viejo `TagsObjectSheet` — se
 * monta como campo (`field`), celda (`cell`) o acción masiva (`bulk`) en el
 * lugar donde ya está la información, sin abrir un sheet aparte.
 *
 * @example
 * ```tsx
 * <TagsObjectPicker
 *   objectType="document"
 *   objectIds={[documentId]}
 *   variant="field"
 *   canView={hasPermission('tag:r')}
 *   canAssign={hasPermission('tag:u')}
 * />
 * ```
 */
export function TagsObjectPicker({
  objectType,
  objectIds,
  variant,
  canView = false,
  canAssign = false,
  className,
}: TagsObjectPickerProps) {
  const { t } = useTranslation(["tags", "common"])
  const queryClient = useQueryClient()
  const { hasPermission } = useUserPermissions()
  const canCreate = hasPermission("tag:c")
  const { assignTagToObject, unassignTagFromObject } = useTagMutations()

  // Un GET por objeto (staleTime propio) — en field/cell es un solo elemento;
  // en bulk resuelve el tri-estado sin más cambios en el picker.
  const objectQueries = useQueries({
    queries: objectIds.map((objectId) => ({
      queryKey: tagsQueryKeys.objectTags(objectType, objectId),
      queryFn: () => getObjectTags(objectType, objectId),
      enabled: canView && !!objectId,
      staleTime: 2 * 60 * 1000,
    })),
  })

  const targets = useMemo(
    () =>
      objectIds.map((id, index) => ({
        id,
        tagIds: (objectQueries[index]?.data ?? []).map((tag) => tag.id),
      })),
    [objectIds, objectQueries],
  )

  const assignedTags = useMemo(() => {
    const map = new Map<string, HuemulTagPickerTag>()
    for (const query of objectQueries) {
      for (const tag of query.data ?? []) map.set(tag.id, tag)
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [objectQueries])

  // Mutación propia (no useTagMutations): la creación en línea desde el
  // popover muestra el error de nombre duplicado inline en el pie, no como
  // toast — por eso no reusa la mutación de /tags (esa sí muestra toast).
  const inlineCreateMutation = useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagsQueryKeys.lists() })
    },
  })

  const handleCreate = useCallback(
    async (name: string) => {
      try {
        return await inlineCreateMutation.mutateAsync({ name })
      } catch (err) {
        const message = ApiError.isApiError(err) ? err.message : t("tags:picker.duplicateName")
        throw new Error(message)
      }
    },
    [inlineCreateMutation, t],
  )

  const handleAssign = useCallback(
    async (tag: HuemulTagPickerTag, targetIds: string[]) => {
      await Promise.all(
        targetIds.map((objectId) =>
          assignTagToObject.mutateAsync({
            tagId: tag.id,
            data: { object_type: objectType, object_id: objectId },
            tag: { id: tag.id, name: tag.name, color: tag.color ?? null, description: null, created_at: "", updated_at: "", created_by: null, updated_by: null },
          }),
        ),
      )
    },
    [assignTagToObject, objectType],
  )

  const handleUnassign = useCallback(
    async (tagId: string, targetIds: string[]) => {
      await Promise.all(
        targetIds.map((objectId) => unassignTagFromObject.mutateAsync({ tagId, objectType, objectId })),
      )
    },
    [objectType, unassignTagFromObject],
  )

  const labels: HuemulTagPickerLabels = useMemo(
    () => ({
      addTag: t("tags:picker.addTag"),
      searchPlaceholder: t("tags:picker.searchPlaceholder"),
      noResults: t("tags:picker.noResults"),
      noResultsCannotCreate: t("tags:picker.noResultsCannotCreate"),
      createAndAssign: (name: string) => t("tags:picker.createAndAssign", { name }),
      duplicateName: t("tags:picker.duplicateName"),
      selectExisting: t("tags:picker.selectExisting"),
      applyingTo: (count: number) => t("tags:picker.applyingTo", { count }),
      partialHint: t("tags:picker.partialHint"),
      allLabel: t("tags:picker.allLabel"),
      partialLabel: t("tags:picker.partialLabel"),
      keyboardHint: t("tags:picker.keyboardHint"),
      manageTags: t("tags:picker.manageTags"),
      removeTag: (name: string) => t("tags:picker.removeTag", { name }),
      moreCount: (count: number) => t("tags:picker.moreCount", { count }),
      empty: t("tags:picker.empty"),
      loading: t("common:loading"),
    }),
    [t],
  )

  if (!canView) {
    return null
  }

  return (
    <HuemulTagPicker
      targets={targets}
      variant={variant}
      canCreate={canCreate}
      canAssign={canAssign}
      fetchTags={fetchTags}
      assignedTags={assignedTags}
      onAssign={handleAssign}
      onUnassign={handleUnassign}
      onCreate={handleCreate}
      manageHref="/tags"
      className={className}
      labels={labels}
    />
  )
}
