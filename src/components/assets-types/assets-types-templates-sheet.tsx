"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { LayoutTemplate, X, Loader2 } from "lucide-react"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { HuemulCombobox } from "@/huemul/components/huemul-combobox"
import { useDocumentTypeTemplates, useAssetTypeMutations } from "@/hooks/useAssetTypes"
import { getAllTemplates } from "@/services/templates"
import { useOrganization } from "@/contexts/organization-context"
import { cn } from "@/lib/utils"
import type { AssetTypeWithRoles, LinkedTemplate } from "@/types/assets"
import type { FetchOptionsParams } from "@/huemul/components/huemul-field"

interface AssetTypeTemplatesSheetProps {
  assetType: AssetTypeWithRoles | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function TemplateStrip({
  template,
  onRemove,
  isRemoving,
}: {
  template: LinkedTemplate
  onRemove: (id: string) => void
  isRemoving: boolean
}) {
  const { t } = useTranslation("asset-types")
  const barColor =
    template.asset_kind === "text"
      ? "bg-primary"
      : template.asset_kind === "design"
        ? "bg-purple-500"
        : "bg-border"

  return (
    <li className="flex items-center border border-border rounded-lg overflow-hidden min-h-[44px] hover:border-muted-foreground/30 transition-colors">
      <div className={cn("w-[3px] self-stretch shrink-0", barColor)} aria-hidden="true" />
      <div className="flex-1 px-3 py-2.5 min-w-0">
        <p className="text-xs font-medium truncate">{template.name}</p>
        {template.description && (
          <p className="text-[11px] text-muted-foreground truncate mt-0.5">{template.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 pr-2 shrink-0">
        {template.asset_kind && (
          <span
            className={cn(
              "font-mono text-[9px] font-medium px-1.5 py-0.5 rounded",
              template.asset_kind === "text"
                ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                : "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
            )}
          >
            {template.asset_kind}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onRemove(template.id)}
          disabled={isRemoving}
          aria-label={t("templates.remove", { name: template.name })}
        >
          {isRemoving ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <X className="h-3 w-3" />
          )}
        </Button>
      </div>
    </li>
  )
}

export function AssetTypeTemplatesSheet({
  assetType,
  open,
  onOpenChange,
}: AssetTypeTemplatesSheetProps) {
  const { t } = useTranslation("asset-types")
  const { selectedOrganizationId } = useOrganization()
  const mutations = useAssetTypeMutations()

  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string>("")
  const [unlinkingId, setUnlinkingId] = React.useState<string | null>(null)

  const documentTypeId = assetType?.document_type_id ?? ""
  const { data, isLoading } = useDocumentTypeTemplates(documentTypeId, open && !!assetType)
  const linked = data?.data ?? []

  const fetchTemplateOptions = React.useCallback(
    async ({ search, page, pageSize }: FetchOptionsParams) => {
      if (!selectedOrganizationId) return { options: [], hasMore: false }
      const res = await getAllTemplates(selectedOrganizationId, search, page, pageSize)
      return {
        options: res.data.map((tpl) => ({
          value: tpl.id,
          label: tpl.name,
          description: tpl.description ?? undefined,
        })),
        hasMore: res.has_next,
      }
    },
    [selectedOrganizationId],
  )

  const handleLink = () => {
    if (!selectedTemplateId || !documentTypeId) return
    mutations.linkTemplate.mutate(
      { documentTypeId, templateId: selectedTemplateId },
      { onSuccess: () => setSelectedTemplateId("") },
    )
  }

  const handleUnlink = (templateId: string) => {
    if (!documentTypeId) return
    setUnlinkingId(templateId)
    mutations.unlinkTemplate.mutate(
      { documentTypeId, templateId },
      { onSettled: () => setUnlinkingId(null) },
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md w-full flex flex-col p-0 gap-0">
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2 text-sm font-semibold">
            <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
            {t("templates.title")}
            {assetType && (
              <span className="text-muted-foreground font-normal">
                — {assetType.document_type_name}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* Linked templates */}
          <section className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {t("templates.linkedTemplates")}
            </p>

            {isLoading ? (
              <ul className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 rounded-lg" />
                ))}
              </ul>
            ) : linked.length === 0 ? (
              <div className="py-5 px-4 text-center border border-dashed border-border rounded-lg bg-muted/40">
                <LayoutTemplate className="h-6 w-6 text-border mx-auto mb-2" />
                <p className="text-xs font-medium text-muted-foreground">
                  {t("templates.noLinkedTemplates")}
                </p>
                <p className="text-[11px] text-muted-foreground/70 mt-1 leading-relaxed">
                  {t("templates.noLinkedTemplatesHint")}
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {linked.map((tpl) => (
                  <TemplateStrip
                    key={tpl.id}
                    template={tpl}
                    onRemove={handleUnlink}
                    isRemoving={unlinkingId === tpl.id}
                  />
                ))}
              </ul>
            )}
          </section>

          {/* Add template */}
          <section className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {t("templates.addTemplate")}
            </p>
            <div className="flex gap-2">
              <div className="flex-1 min-w-0">
                <HuemulCombobox
                  value={selectedTemplateId}
                  onValueChange={(v) => setSelectedTemplateId(v as string)}
                  fetchOptions={fetchTemplateOptions}
                  placeholder={t("templates.searchPlaceholder")}
                  searchPlaceholder={t("templates.searchPlaceholder")}
                  emptyMessage={t("templates.noTemplatesAvailable")}
                  disabled={!selectedOrganizationId || mutations.linkTemplate.isPending}
                  pageSize={20}
                />
              </div>
              <Button
                size="sm"
                onClick={handleLink}
                disabled={!selectedTemplateId || mutations.linkTemplate.isPending}
                className="shrink-0"
              >
                {mutations.linkTemplate.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  t("templates.link")
                )}
              </Button>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
