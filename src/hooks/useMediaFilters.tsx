import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useOrganization } from "@/contexts/organization-context"
import { useHuemulFilters } from "@/hooks/useHuemulFilters"
import { usePageAccess } from "@/hooks/usePageAccess"
import { getLevelOptions } from "@/huemul/components/huemul-media-icon"
import { buildMediaParentFetchOptions, getMediaParentLabel } from "@/huemul/components/huemul-media-parent"
import { HuemulAssetTreePickerField } from "@/huemul/components/huemul-asset-tree-picker"
import type { MediaLevel } from "@/types/media"
import type { HuemulFilterDef, HuemulFilterValue } from "@/types/huemul"

export interface UseMediaFiltersOptions {
  initialLevel?: MediaLevel
  initialParentId?: string
  /** Resolved display name for the initial parent (so its chip isn't a UUID). */
  initialParentLabel?: string
  /** Called after any filter change/chip-remove/clear (e.g. reset pagination). */
  onChange?: () => void
}

/**
 * Shared filter state machine for the Media list — level select + a level-dependent
 * parent selector (async-combobox for asset-type/template, folder-tree picker for
 * asset/execution) + media type. Used by the Media page and the editor media
 * reference picker so both filter identically.
 */
export function useMediaFilters(options: UseMediaFiltersOptions = {}) {
  const { initialLevel = "organization", initialParentId, initialParentLabel, onChange } = options
  const { t } = useTranslation("media")
  const { selectedOrganizationId } = useOrganization()
  const { can } = usePageAccess("media")

  // Mirror of the `level` filter, kept in its own state so `filterDefs` can depend
  // on it (the parent selector's visibility/fetcher) without a filterDefs↔values cycle.
  const [level, setLevel] = useState<MediaLevel>(initialLevel)
  // Resolved name of the picked parent (asset/execution), for the tree-picker trigger label.
  const [parentLabel, setParentLabel] = useState<string | undefined>(initialParentLabel)

  // Cada nivel distinto de "organization" hace que el selector de padre pegue a
  // un endpoint de otro recurso (asset types, biblioteca de assets, ejecuciones,
  // templates): sin su permiso de listar, elegirlo solo produce un 403 mudo.
  // Se recortan las OPCIONES en vez de omitir el `filterDef` — omitirlo dejaría
  // un valor huérfano fuera de `chips`/`clearAll` (ver el hallazgo de /home).
  // `initialLevel` se preserva siempre: el picker del editor lo fija en
  // "document"/"execution" desde /asset, donde el guard de ruta ya garantizó
  // esos permisos, y recortarlo dejaría el picker en un nivel inexistente.
  const allowedLevels = useMemo<MediaLevel[]>(() => {
    const levels: MediaLevel[] = ["organization"]
    if (can("listAssetTypes")) levels.push("document_type")
    if (can("listAssets") && can("listFolders")) levels.push("document")
    if (can("listExecutions")) levels.push("execution")
    if (can("listTemplates")) levels.push("template")
    if (!levels.includes(initialLevel)) levels.push(initialLevel)
    return levels
  }, [can, initialLevel])

  const filterDefs = useMemo<HuemulFilterDef[]>(() => {
    const parentFetch = buildMediaParentFetchOptions(level, selectedOrganizationId ?? "")
    const useTree = level === "document" || level === "execution"
    const parentDef: HuemulFilterDef = useTree
      ? {
          key: "parentId",
          type: "custom",
          label: getMediaParentLabel(t, level),
          render: ({ value, setValue: setParent }) => (
            <HuemulAssetTreePickerField
              mode={level === "execution" ? "execution" : "document"}
              organizationId={selectedOrganizationId ?? ""}
              valueId={(value as string) || undefined}
              valueLabel={parentLabel}
              placeholder={t("filters.parentPlaceholder")}
              onPick={(id, label) => { setParent(id, label); setParentLabel(label) }}
              onClear={() => { setParent("", undefined); setParentLabel(undefined) }}
            />
          ),
        }
      : {
          key: "parentId",
          type: "async-combobox",
          hidden: !parentFetch,
          label: getMediaParentLabel(t, level),
          placeholder: t("filters.parentPlaceholder"),
          fetchOptions: parentFetch ?? (async () => ({ options: [], hasMore: false })),
          pageSize: 20,
        }
    return [
      {
        key: "level",
        type: "select",
        label: t("filters.level"),
        allValue: "organization",
        options: getLevelOptions(t, allowedLevels),
      },
      parentDef,
      {
        key: "mediaType",
        type: "text",
        label: t("filters.mediaType"),
        placeholder: t("filters.mediaTypePlaceholder"),
      },
    ]
  }, [t, level, selectedOrganizationId, parentLabel, allowedLevels])

  const {
    values,
    open: filtersOpen,
    setOpen: setFiltersOpen,
    setValue,
    clearValue,
    clearAll,
    chips,
    activeCount,
    setSelectedLabel,
  } = useHuemulFilters({
    filters: filterDefs,
    defaultOpen: false,
    initialValues: { level: initialLevel, parentId: initialParentId ?? "" },
  })

  // Register the initial parent label once so its chip shows a name, not a UUID.
  const labelSeeded = useRef(false)
  useEffect(() => {
    if (!labelSeeded.current && initialParentId && initialParentLabel) {
      setSelectedLabel("parentId", initialParentLabel)
    }
    labelSeeded.current = true
  }, [initialParentId, initialParentLabel, setSelectedLabel])

  // Reset the parent selection (value + cached chip label) — used when the level
  // changes or the level chip is removed, since a parent id is level-specific.
  const resetParent = useCallback(() => {
    clearValue("parentId")
    setSelectedLabel("parentId", undefined)
    setParentLabel(undefined)
  }, [clearValue, setSelectedLabel])

  const onFilterChange = useCallback((key: string, value: HuemulFilterValue) => {
    setValue(key, value)
    if (key === "level") {
      setLevel((value as MediaLevel) || "organization")
      resetParent()
    }
    onChange?.()
  }, [setValue, resetParent, onChange])

  const onChipRemove = useCallback((key: string) => {
    clearValue(key)
    if (key === "level") {
      setLevel("organization")
      resetParent()
    }
    onChange?.()
  }, [clearValue, resetParent, onChange])

  const onClearAll = useCallback(() => {
    clearAll()
    setLevel("organization")
    setParentLabel(undefined)
    onChange?.()
  }, [clearAll, onChange])

  const parentId = level !== "organization" ? ((values.parentId as string) || undefined) : undefined
  const needsParent = level !== "organization" && !parentId
  const mediaType = (values.mediaType as string) || undefined

  return {
    // resolved query inputs
    level,
    parentId,
    mediaType,
    needsParent,
    // panel wiring
    filterDefs,
    values,
    filtersOpen,
    setFiltersOpen,
    activeCount,
    chips,
    onFilterChange,
    onChipRemove,
    onClearAll,
    onSelectedLabel: setSelectedLabel,
  }
}
