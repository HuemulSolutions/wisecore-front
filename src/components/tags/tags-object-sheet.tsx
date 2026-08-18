"use client"

import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Tag as TagIcon, RefreshCw } from "lucide-react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulCombobox } from "@/huemul/components/huemul-combobox"
import { HuemulTagChip } from "@/huemul/components/huemul-tag-chip"
import { useObjectTags, useTagMutations } from "@/hooks/useTags"
import { getTags } from "@/services/tags"
import type { TagsObjectSheetProps } from "@/types/tags"
import type { FetchOptionsParams, FetchOptionsResult } from "@/types/huemul"

export type { TagsObjectSheetProps } from "@/types/tags"

async function fetchTagOptions({ search, page, pageSize }: FetchOptionsParams): Promise<FetchOptionsResult> {
  const res = await getTags({ search: search || undefined, page, page_size: pageSize })
  return {
    options: res.data.map((tag) => ({ value: tag.id, label: tag.name, color: tag.color ?? undefined })),
    hasMore: res.has_next,
  }
}

/**
 * Sheet reutilizable para asignar/quitar etiquetas de un objeto etiquetable
 * (documento, template o tipo de activo). Se monta desde la pantalla del
 * propio objeto (dropdown de más opciones, acción de fila, etc.) — no
 * confundir con el CRUD del catálogo en /tags.
 *
 * Guardado inmediato: cada alta/baja del combobox dispara su propia mutación
 * de asignación (la API de tags es idempotente por par tag/objeto), no hay
 * botón "Guardar" ni estado sucio que descartar.
 */
export function TagsObjectSheet({
  open,
  onOpenChange,
  objectType,
  objectId,
  objectName,
  canAssign = false,
  canView = false,
}: TagsObjectSheetProps) {
  const { t } = useTranslation(["tags", "common"])

  const {
    data: assignedTags = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useObjectTags(objectType, objectId, { enabled: open && canView })
  const { assignTagToObject, unassignTagFromObject } = useTagMutations()

  const assignedIds = useMemo(() => assignedTags.map((tag) => tag.id), [assignedTags])
  const selectedOptions = useMemo(
    () => assignedTags.map((tag) => ({ value: tag.id, label: tag.name, color: tag.color ?? undefined })),
    [assignedTags],
  )

  const handleValueChange = (next: string | string[]) => {
    const nextIds = Array.isArray(next) ? next : []
    const added = nextIds.filter((id) => !assignedIds.includes(id))
    const removed = assignedIds.filter((id) => !nextIds.includes(id))

    added.forEach((tagId) =>
      assignTagToObject.mutate({ tagId, data: { object_type: objectType, object_id: objectId } }),
    )
    removed.forEach((tagId) => unassignTagFromObject.mutate({ tagId, objectType, objectId }))
  }

  const title = objectName ? t("assign.titleWithName", { name: objectName }) : t("assign.title")

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      icon={TagIcon}
      size="md"
      showFooter={false}
      headerExtra={
        <HuemulButton
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          icon={RefreshCw}
          tooltip={t("common:refresh")}
          loading={isFetching}
          onClick={() => refetch()}
        />
      }
    >
      {!canView ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{t("assign.noPermission")}</p>
      ) : error ? (
        <div className="flex flex-col items-center justify-center min-h-[200px] text-center rounded-lg border border-dashed bg-muted/50 p-8">
          <p className="mb-2 text-sm font-medium text-red-600">{t("errorState.failedToLoad")}</p>
          <HuemulButton variant="outline" size="sm" onClick={() => refetch()} label={t("common:tryAgain")} />
        </div>
      ) : (
        <div className="space-y-2 py-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("assign.assignedLabel")}
          </span>

          {canAssign ? (
            <HuemulCombobox
              value={assignedIds}
              onValueChange={handleValueChange}
              multiSelect
              fetchOptions={fetchTagOptions}
              selectedOptions={selectedOptions}
              searchOnEnter
              placeholder={t("assign.searchPlaceholder")}
              disabled={isLoading}
            />
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">{t("common:loading")}</p>
          ) : assignedTags.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("assign.empty")}</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {assignedTags.map((tag) => (
                <HuemulTagChip key={tag.id} label={tag.name} color={tag.color} />
              ))}
            </div>
          )}
        </div>
      )}
    </HuemulSheet>
  )
}
