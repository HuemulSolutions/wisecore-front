"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { FileText, Loader2, Plus, Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { PanelBadge, PanelCard } from "@/components/assets-types/assets-types-lifecycle-ui"
import { getAllTemplates } from "@/services/templates"
import { useOrganization } from "@/contexts/organization-context"
import { cn } from "@/lib/utils"
import type { TemplatesResponse } from "@/types/templates"

type TemplateResult = TemplatesResponse["data"][number]

const PAGE_SIZE = 100

export interface AssetTypeTemplatePickerProps {
  /** Ids de plantillas ya vinculadas a este tipo de activo — se muestran con badge y no son seleccionables. */
  linkedTemplateIds: Set<string>
  isLinking: boolean
  onLink: (templateId: string, templateName: string) => Promise<void>
}

/**
 * Card "Vincular una plantilla" del tab Plantillas: buscador siempre
 * expandido (no combobox) con lista de resultados paginada, para poder
 * mostrar el estado "Ya vinculada" de cada fila en vez de ocultarla.
 */
export function AssetTypeTemplatePicker({ linkedTemplateIds, isLinking, onLink }: AssetTypeTemplatePickerProps) {
  const { t } = useTranslation("asset-types")
  const { selectedOrganizationId } = useOrganization()

  const [searchInput, setSearchInput] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [items, setItems] = React.useState<TemplateResult[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [isFetchingMore, setIsFetchingMore] = React.useState(false)
  const [total, setTotal] = React.useState<number | undefined>(undefined)
  const [hasNext, setHasNext] = React.useState(false)
  const [selected, setSelected] = React.useState<{ id: string; name: string } | null>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  React.useEffect(() => {
    setPage(1)
  }, [search])

  React.useEffect(() => {
    if (!selectedOrganizationId) return
    let cancelled = false
    if (page === 1) setIsLoading(true)
    else setIsFetchingMore(true)

    getAllTemplates(selectedOrganizationId, search, page, PAGE_SIZE)
      .then((res) => {
        if (cancelled) return
        setItems((prev) => (page === 1 ? res.data : [...prev, ...res.data]))
        setHasNext(res.has_next)
        setTotal(res.total)
      })
      .finally(() => {
        if (cancelled) return
        setIsLoading(false)
        setIsFetchingMore(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedOrganizationId, search, page])

  React.useEffect(() => {
    if (selected && linkedTemplateIds.has(selected.id)) setSelected(null)
  }, [linkedTemplateIds, selected])

  // Scroll infinito: dispara la siguiente página cerca del fondo, y también
  // si la página actual no llenó el contenedor (si no, nunca aparecería
  // scroll y quedaría sin forma de pedir más) — mismo patrón que
  // huemul-combobox.tsx.
  React.useEffect(() => {
    if (isLoading || isFetchingMore || !hasNext) return
    const list = listRef.current
    if (list && list.scrollHeight <= list.clientHeight) {
      setPage((p) => p + 1)
    }
  }, [isLoading, isFetchingMore, hasNext, items])

  const handleScroll = React.useCallback(() => {
    const list = listRef.current
    if (!list || isFetchingMore || !hasNext) return
    const { scrollTop, scrollHeight, clientHeight } = list
    if (scrollHeight - scrollTop - clientHeight < 50) {
      setPage((p) => p + 1)
    }
  }, [isFetchingMore, hasNext])

  const handleLink = async () => {
    if (!selected) return
    await onLink(selected.id, selected.name)
    setSelected(null)
  }

  return (
    <PanelCard className="p-4">
      <h3 className="text-[13px] font-semibold text-[#0f172a]">{t("templates.addTemplate")}</h3>
      <p className="mb-3 text-[11px] text-[#94a3b8]">{t("templates.picker.subtitle")}</p>

      <div className="relative mb-3">
        <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t("templates.searchPlaceholder")}
          className="h-9 pl-8 text-[13px]"
        />
      </div>

      <div className="mb-2 flex items-center gap-2">
        <span className="text-[11px] font-semibold tracking-wide text-[#94a3b8] uppercase">
          {t("templates.picker.resultsLabel")}
        </span>
        {!isLoading && (
          <PanelBadge label={t("templates.picker.resultsCount", { shown: items.length, total: total ?? items.length })} />
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <p className="py-4 text-center text-[12px] text-muted-foreground">{t("templates.noTemplatesAvailable")}</p>
      ) : (
        <div ref={listRef} onScroll={handleScroll} className="mb-3 flex max-h-72 flex-col gap-1 overflow-y-auto">
          {items.map((tpl) => {
            const isLinked = linkedTemplateIds.has(tpl.id)
            const isSelected = selected?.id === tpl.id
            return (
              <button
                key={tpl.id}
                type="button"
                disabled={isLinked}
                onClick={() => setSelected(isSelected ? null : { id: tpl.id, name: tpl.name })}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors",
                  isLinked
                    ? "cursor-not-allowed border-transparent opacity-60"
                    : isSelected
                      ? "border-primary bg-primary/5 hover:cursor-pointer"
                      : "border-transparent hover:cursor-pointer hover:bg-[#f8fafc]",
                )}
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#f1effc]">
                  <FileText className="size-3.5 text-[#6d5ae0]" />
                </span>
                <span className={cn("min-w-0 flex-1 truncate text-[12.5px]", isSelected ? "font-semibold text-[#0f172a]" : "font-medium text-[#334155]")}>
                  {tpl.name}
                </span>
                {isLinked && <PanelBadge label={t("templates.picker.alreadyLinked")} />}
              </button>
            )
          })}
          {isFetchingMore && (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      )}

      <HuemulButton
        icon={Plus}
        label={t("templates.picker.linkButton")}
        loading={isLinking}
        disabled={!selected}
        onClick={handleLink}
        className="w-full"
      />
      <p className="mt-2 text-center text-[11px] leading-snug text-[#94a3b8]">{t("templates.picker.helperText")}</p>
    </PanelCard>
  )
}
