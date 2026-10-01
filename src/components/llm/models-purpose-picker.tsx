import { useMemo, useState } from "react"
import { Check, Loader2, Plus, Search, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { ModelsProviderAvatar } from "@/components/llm/models-provider-avatar"
import {
  PURPOSE_REQUIRED_CAPABILITIES,
  isMarkedForPurpose,
  missingPurposeCapabilities,
} from "@/lib/llm-capabilities"
import type { LLM, ModelsPurposePickerProps } from "@/types/models"
export type { ModelsPurposePickerProps } from "@/types/models"

/** Desde cuántos modelos se muestra el buscador. */
const SEARCH_THRESHOLD = 6

/**
 * Selector de modelo para un propósito (rerank / análisis de imágenes) desde las filas de
 * estado. Los modelos sin las capabilities del propósito salen deshabilitados con el motivo;
 * si no hay ninguno compatible lo dice, en vez de no hacer nada (el backend respondería 400
 * LLM_MISSING_CAPABILITY). Misma regla que el menú "Usar para…" de la tabla.
 */
export function ModelsPurposePicker({
  purpose,
  models,
  triggerLabel,
  isPending,
  canCreateModel,
  onSelect,
  onClear,
  onAddModel,
}: ModelsPurposePickerProps) {
  const { t } = useTranslation('models')
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const capLabel = (cap: string) => t(`capabilities.${cap}.label`, { defaultValue: cap })
  const requiredCaps = PURPOSE_REQUIRED_CAPABILITIES[purpose].map(capLabel).join(" + ")
  const purposeName = t(`table.purposes.${purpose}`)
  const current = models.find((m) => isMarkedForPurpose(m, purpose)) ?? null

  const { compatible, incompatible } = useMemo(() => {
    const query = search.trim().toLowerCase()
    const matches = query ? models.filter((m) => m.name.toLowerCase().includes(query)) : models
    const byName = (a: LLM, b: LLM) => a.name.localeCompare(b.name)
    return {
      compatible: matches.filter((m) => missingPurposeCapabilities(m, purpose).length === 0).sort(byName),
      incompatible: matches.filter((m) => missingPurposeCapabilities(m, purpose).length > 0).sort(byName),
    }
  }, [models, purpose, search])

  const anyCompatible = models.some((m) => missingPurposeCapabilities(m, purpose).length === 0)

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) setSearch("")
  }

  const select = (model: LLM) => {
    if (!isMarkedForPurpose(model, purpose)) onSelect(model)
    handleOpenChange(false)
  }

  const renderModel = (model: LLM, disabled: boolean) => {
    const missing = missingPurposeCapabilities(model, purpose)
    const reason = missing.length
      ? t('table.purposes.missingCapability', { caps: missing.map(capLabel).join(', ') })
      : undefined
    const selected = current?.id === model.id
    return (
      <button
        key={model.id}
        type="button"
        role="option"
        aria-selected={selected}
        aria-disabled={disabled}
        disabled={disabled || isPending}
        title={reason}
        onClick={() => select(model)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-[8px] px-2 py-1.5 text-left",
          disabled ? "cursor-not-allowed opacity-60" : "hover:cursor-pointer hover:bg-[#f1f5fb]",
          selected && "bg-[#eef4ff]",
        )}
      >
        {model.provider?.type && <ModelsProviderAvatar type={model.provider.type} size="sm" />}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[13px] font-medium text-[#0f172a]">{model.name}</span>
          <span className="truncate text-[11px] leading-snug text-[#7c8798]">
            {reason ?? model.provider?.name ?? model.provider_name}
          </span>
        </span>
        {selected && <Check className="size-3.5 shrink-0 text-[#2563eb]" />}
      </button>
    )
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={isPending}
          className="flex h-7 items-center gap-1.5 whitespace-nowrap rounded-[7px] border border-[#dfe4ec] bg-white px-2.5 text-[12.5px] font-semibold text-[#334155] transition-colors hover:cursor-pointer hover:border-[#93b4f5] hover:bg-[#f9fbff] disabled:cursor-wait disabled:opacity-70"
        >
          {isPending && <Loader2 className="size-3 animate-spin" />}
          {triggerLabel}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] p-0" onWheel={(e) => e.stopPropagation()}>
        <div className="border-b border-[#eef2f7] px-3 py-2.5">
          <p className="text-[13px] font-semibold text-[#0f172a]">{purposeName}</p>
          <p className="text-[11.5px] text-[#7c8798]">{t('status.picker.requires', { caps: requiredCaps })}</p>
        </div>

        {models.length > SEARCH_THRESHOLD && (
          <div className="px-3 pt-2.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#9aa6b5]" />
              <Input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('status.picker.search')}
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>
        )}

        <div role="listbox" className="max-h-72 overflow-y-auto p-1.5" onWheel={(e) => e.stopPropagation()}>
          {!anyCompatible ? (
            <div className="flex flex-col items-center gap-2 px-3 py-5 text-center">
              <p className="text-[12.5px] text-[#475569]">
                {models.length === 0
                  ? t('status.picker.noModels')
                  : t('status.picker.noCompatible', { caps: requiredCaps })}
              </p>
              {canCreateModel && (
                <button
                  type="button"
                  onClick={() => {
                    handleOpenChange(false)
                    onAddModel()
                  }}
                  className="flex items-center gap-1 text-[12.5px] font-semibold text-[#2563eb] hover:cursor-pointer hover:underline"
                >
                  <Plus className="size-3.5" />
                  {t('status.picker.addModel')}
                </button>
              )}
            </div>
          ) : compatible.length === 0 && incompatible.length === 0 ? (
            <p className="px-3 py-5 text-center text-[12.5px] text-[#7c8798]">{t('status.picker.noResults')}</p>
          ) : (
            <>
              {compatible.map((m) => renderModel(m, false))}
              {incompatible.length > 0 && (
                <>
                  <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-[#9aa6b5]">
                    {t('status.picker.incompatible')}
                  </p>
                  {incompatible.map((m) => renderModel(m, true))}
                </>
              )}
            </>
          )}
        </div>

        {current && (
          <div className="border-t border-[#eef2f7] p-1.5">
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                onClear()
                handleOpenChange(false)
              }}
              className="flex w-full items-center gap-2 rounded-[8px] px-2 py-1.5 text-[12.5px] font-medium text-[#b42318] hover:cursor-pointer hover:bg-[#fdf2f1]"
            >
              <X className="size-3.5" />
              {t('table.purposes.stop', { purpose: purposeName })}
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
