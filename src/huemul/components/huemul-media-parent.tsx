import type { TFunction } from "i18next"
import { getAssetTypes } from "@/services/asset-types"
import { getAllDocuments } from "@/services/assets"
import { getAllExecutions } from "@/services/executions"
import { getAllTemplates } from "@/services/templates"
import { HuemulField } from "./huemul-field"
import type { MediaLevel } from "@/types/media"
import type { FetchOptionsParams, FetchOptionsResult } from "@/types/huemul/field"

type FetchOptions = (params: FetchOptionsParams) => Promise<FetchOptionsResult>

/**
 * Build the async-combobox `fetchOptions` for the parent entity of a media level.
 * Returns `null` for the `organization` level (no parent required).
 */
export function buildMediaParentFetchOptions(
  level: MediaLevel,
  organizationId: string,
): FetchOptions | null {
  switch (level) {
    case "document_type":
      return async ({ search, page, pageSize }) => {
        const res = await getAssetTypes(page, pageSize, search)
        return {
          options: (res.data ?? []).map((at) => ({
            value: at.id,
            label: at.name,
            color: at.color ?? undefined,
          })),
          hasMore: res.has_next ?? false,
        }
      }

    case "document":
      // getAllDocuments has no server-side pagination — slice client-side.
      return async ({ search, page, pageSize }) => {
        const all: Array<{ id: string; name: string }> =
          (await getAllDocuments(organizationId, undefined, search)) ?? []
        const start = (page - 1) * pageSize
        const slice = all.slice(start, start + pageSize)
        return {
          options: slice.map((d) => ({ value: d.id, label: d.name })),
          hasMore: start + pageSize < all.length,
        }
      }

    case "execution":
      return async ({ search, page, pageSize }) => {
        const res = await getAllExecutions(organizationId, {
          page,
          page_size: pageSize,
          query: search || undefined,
        })
        return {
          options: (res.data ?? []).map((exec) => ({
            value: exec.id,
            label: exec.name || exec.document_name || exec.id,
          })),
          hasMore: res.has_next ?? false,
        }
      }

    case "template":
      return async ({ search, page, pageSize }) => {
        const res = await getAllTemplates(organizationId, search, page, pageSize)
        return {
          options: (res.data ?? []).map((tpl) => ({ value: tpl.id, label: tpl.name })),
          hasMore: res.has_next ?? false,
        }
      }

    case "organization":
    default:
      return null
  }
}

/** Label for the parent selector — reuses the level's translated label. */
export function getMediaParentLabel(t: TFunction, level: MediaLevel): string {
  return t(`filters.levels.${level}`)
}

// ─── Field wrapper (used by the upload sheet) ───────────────────────────────────

export interface HuemulMediaParentFieldProps {
  level: MediaLevel
  organizationId: string
  value: string
  onValueChange: (value: string) => void
  onSelectedLabelChange?: (label?: string) => void
  placeholder?: string
  label?: string
}

export function HuemulMediaParentField({
  level,
  organizationId,
  value,
  onValueChange,
  onSelectedLabelChange,
  placeholder,
  label,
}: HuemulMediaParentFieldProps) {
  const fetchOptions = buildMediaParentFetchOptions(level, organizationId)
  if (!fetchOptions) return null

  return (
    <HuemulField
      type="async-combobox"
      label={label}
      value={value}
      onChange={(v) => onValueChange(v ? String(v) : "")}
      onSelectedLabelChange={onSelectedLabelChange}
      fetchOptions={fetchOptions}
      placeholder={placeholder}
      pageSize={20}
    />
  )
}
