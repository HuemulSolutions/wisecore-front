"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import { getCustomFields } from "@/services/custom-fields"
import { customFieldDataTypeLabel } from "@/components/sections/question-type-meta"
import { HuemulField } from "./huemul-field"
import { HuemulCombobox } from "./huemul-combobox"
import type { CustomField, CustomFieldDataType, CustomFieldOption } from "@/types/custom-fields"
import type {
  FetchOptionsParams,
  FetchOptionsResult,
  HuemulCustomFieldFilterProps,
} from "@/types/huemul"

export type { HuemulCustomFieldFilterProps } from "@/types/huemul"

/** Splits a `"name"` / `"name:value"` entry into its field name. */
function nameOf(entry: string): string {
  const sep = entry.indexOf(":")
  return sep === -1 ? entry : entry.slice(0, sep)
}

/** Splits a `"name"` / `"name:value"` entry into its value (`""` when name-only). */
function valueOf(entry: string): string {
  const sep = entry.indexOf(":")
  return sep === -1 ? "" : entry.slice(sep + 1)
}

/** `data_type`s whose value control commits instantly (picker/select), vs.
 *  draft + Enter for free-typed values (text/number). */
const INSTANT_DATA_TYPES: CustomFieldDataType[] = ["list", "bool", "date", "datetime", "time"]

/**
 * `HuemulCustomFieldFilter` — guided field + value composer for the
 * `custom_field_filter` query param (`"name"` or `"name:value"` entries).
 *
 * Instant-apply, like every other filter in the panel: picking a field in the
 * multi-select combobox adds a `"name"` entry immediately (any value). Each
 * selected field then gets its own value row to optionally refine the entry
 * to `"name:value"` — a `data_type`-aware control (date/datetime/time picker,
 * select for `list`/`bool`, number input, free text otherwise). The
 * dropdown itself also shows each field's data type below its name.
 */
export function HuemulCustomFieldFilter({
  value,
  onChange,
  className,
}: HuemulCustomFieldFilterProps) {
  const { t } = useTranslation(["huemul-filters", "custom-fields"])
  // Caches full CustomField objects (data_type, options) by name, filled as
  // fetchFieldOptions resolves pages — the combobox itself only round-trips
  // the string value/label pair.
  const fieldCacheRef = React.useRef<Map<string, CustomField>>(new Map())
  // Per-field draft text for free-typed values (text/number), keyed by field
  // name; committed to `value` on Enter (see commitValue and renderValueControl).
  const [drafts, setDrafts] = React.useState<Record<string, string>>({})

  const selectedNames = React.useMemo(() => value.map(nameOf), [value])

  const fetchFieldOptions = React.useCallback(
    async ({ search, page, pageSize }: FetchOptionsParams): Promise<FetchOptionsResult> => {
      const res = await getCustomFields({ search: search || undefined, page, page_size: pageSize })
      for (const cf of res.data) fieldCacheRef.current.set(cf.name, cf)
      return {
        options: res.data.map((cf) => ({
          value: cf.name,
          label: cf.name,
          description: customFieldDataTypeLabel(cf.data_type, t),
        })),
        hasMore: res.has_next,
      }
    },
    [t],
  )

  const handleNamesChange = React.useCallback(
    (nextNames: string[]) => {
      const next = nextNames.map((name) => value.find((e) => nameOf(e) === name) ?? name)
      onChange(next)
    },
    [value, onChange],
  )

  const commitValue = React.useCallback(
    (name: string, raw: string) => {
      const trimmed = raw.trim()
      const entry = trimmed ? `${name}:${trimmed}` : name
      onChange(value.map((e) => (nameOf(e) === name ? entry : e)))
    },
    [value, onChange],
  )

  /** Value control for one selected field — `data_type`-aware: date/datetime/time
   *  pickers and select (list/bool) commit instantly; text/number use the
   *  draft + Enter pattern so typing doesn't refetch on every keystroke. */
  const renderValueControl = React.useCallback(
    (field: CustomField | undefined, name: string, currentValue: string) => {
      if (field?.data_type === "list") {
        return (
          <HuemulField
            type="select"
            value={currentValue}
            onChange={(v) => commitValue(name, String(v))}
            options={(field.options?.length ? field.options : (field.default_value as CustomFieldOption[] | null) ?? []).map((o) => ({
              value: o.label,
              label: o.label,
            }))}
            placeholder={t("customFieldFilter.valueSelectPlaceholder")}
            selectSize="sm"
          />
        )
      }

      if (field?.data_type === "bool") {
        return (
          <HuemulField
            type="select"
            value={currentValue}
            onChange={(v) => commitValue(name, String(v))}
            options={[
              { value: "true", label: t("customFieldFilter.boolTrue") },
              { value: "false", label: t("customFieldFilter.boolFalse") },
            ]}
            placeholder={t("customFieldFilter.valueBoolPlaceholder")}
            selectSize="sm"
          />
        )
      }

      if (field?.data_type === "date" || field?.data_type === "datetime" || field?.data_type === "time") {
        return (
          <HuemulField
            type={field.data_type}
            value={currentValue}
            onChange={(v) => commitValue(name, String(v))}
          />
        )
      }

      const isNumeric = field?.data_type === "int" || field?.data_type === "decimal"
      return (
        <HuemulField
          type={isNumeric ? "number" : "text"}
          value={drafts[name] ?? currentValue}
          onChange={(v) => setDrafts((prev) => ({ ...prev, [name]: String(v) }))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              commitValue(name, drafts[name] ?? currentValue)
            }
          }}
          placeholder={
            isNumeric
              ? t("customFieldFilter.valueNumberPlaceholder")
              : t("customFieldFilter.valuePlaceholder")
          }
        />
      )
    },
    [commitValue, drafts, t],
  )

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <HuemulCombobox
        multiSelect
        value={selectedNames}
        onValueChange={(v) => handleNamesChange(v as string[])}
        fetchOptions={fetchFieldOptions}
        placeholder={t("customFieldFilter.fieldPlaceholder")}
        pageSize={50}
        searchOnEnter
      />

      {value.length > 0 && (
        <div className="flex flex-col gap-2">
          {value.map((entry) => {
            const name = nameOf(entry)
            const field = fieldCacheRef.current.get(name)
            const currentValue = valueOf(entry)
            const isInstant = !!field && INSTANT_DATA_TYPES.includes(field.data_type)
            return (
              <div key={name} className="flex flex-col gap-1">
                <div className="flex items-baseline gap-1.5">
                  <p className="truncate text-xs font-medium text-muted-foreground">{name}</p>
                  {field && (
                    <span className="truncate text-[11px] text-muted-foreground/70">
                      · {customFieldDataTypeLabel(field.data_type, t)}
                    </span>
                  )}
                </div>
                {renderValueControl(field, name, currentValue)}
                {field && !isInstant && (
                  <p className="text-[11px] text-muted-foreground">{t("customFieldFilter.valueEnterHint")}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
