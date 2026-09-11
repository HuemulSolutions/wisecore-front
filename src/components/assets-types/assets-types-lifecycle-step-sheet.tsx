"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronRight, Plus, RefreshCw, Settings, Trash2 } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useRoles } from "@/hooks/useRbac"
import { lifecycleQueryKeys } from "@/hooks/useLifecycle"
import { formatRelativeTime } from "@/lib/format-relative-time"
import { cn } from "@/lib/utils"
import { useLifecycleStepDraft } from "./assets-types-lifecycle-step-draft"
import { LifecycleStepConfigTab } from "./assets-types-lifecycle-step-config-tab"
import { LifecycleStepRolesTab } from "./assets-types-lifecycle-step-roles-tab"
import { LifecycleStepConditions } from "./assets-types-lifecycle-step-conditions"
import { PanelBadge } from "./assets-types-lifecycle-ui"
import type { LifecycleSaveApi, LifecycleStepSheetTarget } from "@/types/assets"

const TAB_CLASS =
  "gap-1.5 rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"

interface LifecycleStepSheetProps {
  documentTypeId: string
  organizationId?: string
  target: LifecycleStepSheetTarget | null
  /** Setter crudo del contenedor — usarlo directo salta el guard (borrado, entidad borrada). */
  onTargetChange: (target: LifecycleStepSheetTarget | null) => void
  /** Cierre que sí pasa por el guard de cambios sin guardar del contenedor (X, ESC, overlay, Cancelar). */
  onRequestClose: () => void
  /** Publica `{isDirty, save, discard, isSaving}` hacia el footer del contenedor. */
  onRegisterEditor?: (api: LifecycleSaveApi | null) => void
}

/**
 * Sheet mono-entidad de configuración de un step/grupo del ciclo de vida.
 * Reemplaza el panel multi-tarjeta (`LifecycleStepPanel` + `EditStepContent` +
 * `CreateStepContent`): se abre ya enfocado en UNA entidad — un grupo
 * existente (`target.mode === "edit"`), una etapa sin grupos
 * (`"stage"`), o el alta de un grupo nuevo (`"create"`) — con tabs
 * Configuración / Roles y accesos / Condiciones y un solo guardado en el
 * footer.
 */
export function LifecycleStepSheet({
  documentTypeId,
  organizationId,
  target,
  onTargetChange,
  onRequestClose,
  onRegisterEditor,
}: LifecycleStepSheetProps) {
  const { t } = useTranslation(["asset-types", "common"])
  const queryClient = useQueryClient()
  const { refetch: refetchRoles, isFetching: isFetchingRoles } = useRoles(!!target, 1, 1000)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const draft = useLifecycleStepDraft({
    documentTypeId,
    target,
    enabled: !!target,
    organizationId,
    fallbackGroupName: t("lifecycle.newGroupName"),
    saveErrorMessage: t("lifecycle.saveError"),
    savedSuccessMessage: t("lifecycle.savedSuccess"),
    onCreated: (stepId) => onTargetChange({ mode: "edit", stepId }),
  })

  // Condiciones persiste al instante (PATCH parcial, no participa del batch
  // de `draft`) pero igual publica su propio `{isDirty, discard}` — mismo
  // contrato que el resto del panel — para que el guard de cambios sin
  // guardar del contenedor no deje pasar una condición a medio editar.
  const [conditionsEditor, setConditionsEditor] = useState<{ isDirty: boolean; discard: () => void } | null>(null)
  const [refreshConditionsApi, setRefreshConditionsApi] = useState<{ refresh: () => void } | null>(null)

  const combinedIsDirty = draft.isDirty || (conditionsEditor?.isDirty ?? false)
  const draftDiscard = draft.discard
  const combinedDiscard = useCallback(() => {
    draftDiscard()
    conditionsEditor?.discard()
  }, [draftDiscard, conditionsEditor])

  useEffect(() => {
    onRegisterEditor?.({ isDirty: combinedIsDirty, save: draft.save, discard: combinedDiscard, isSaving: draft.isSaving })
    return () => onRegisterEditor?.(null)
  }, [combinedIsDirty, draft.save, combinedDiscard, draft.isSaving, onRegisterEditor])

  // El grupo editado desapareció (otra pestaña, o el propio borrado): cerrar
  // sin pasar por el guard — no hay nada local que valga la pena proteger.
  useEffect(() => {
    if (draft.stepMissing) onTargetChange(null)
  }, [draft.stepMissing, onTargetChange])

  if (!target) return null

  const stageType = draft.stageType
  const stageLabel = t(`lifecycle.stepTypes.${stageType}`, { defaultValue: stageType })
  const isCreateMode = draft.isCreateMode
  const title = isCreateMode
    ? t("lifecycle.newGroupName")
    : draft.capabilities.editableName
      ? draft.draft.name.trim() || t("lifecycle.newGroupName")
      : stageLabel

  const rolesCount = draft.draft.roleIds.length
  const summaryParts: string[] = []
  if (draft.capabilities.hasPosition) {
    summaryParts.push(t("lifecycle.summaryLine.group", { index: draft.draft.positionIndex + 1, total: draft.totalGroupCount }))
  } else {
    summaryParts.push(t("lifecycle.summaryLine.stageComplete"))
  }
  if (draft.draft.accessType === "all") {
    summaryParts.push(t("lifecycle.allowAnyoneDescShort"))
  } else if (rolesCount > 0) {
    summaryParts.push(t("lifecycle.summaryLine.roles", { count: rolesCount }))
  } else {
    summaryParts.push(t("lifecycle.summaryLine.noRoles"))
  }
  if (draft.capabilities.hasSla) {
    summaryParts.push(
      draft.draft.hasSla
        ? t("lifecycle.summaryLine.sla", {
            value: draft.draft.slaValue,
            unit: t(`lifecycle.slaUnits.${draft.draft.slaUnit}`, {
              defaultValue: draft.slaUnitOptions.find((u) => u.value === draft.draft.slaUnit)?.label ?? draft.draft.slaUnit,
            }),
          })
        : t("lifecycle.summaryLine.noSla"),
    )
  }

  const savedStateLabel = combinedIsDirty
    ? t("lifecycle.unsavedInGroup", { group: title })
    : draft.lastSavedAt
      ? t("lifecycle.savedAt", { time: formatRelativeTime(draft.lastSavedAt) })
      : null

  const handleRefresh = () => {
    void queryClient.invalidateQueries({ queryKey: lifecycleQueryKeys.stepsByDocumentType(documentTypeId) })
    void refetchRoles()
    refreshConditionsApi?.refresh()
    // La tarjeta de elaboración externa (tab Config) persiste al instante y no
    // participa del batch — mismo motivo que `refreshConditionsApi` arriba.
    if (draft.step?.id) {
      void queryClient.invalidateQueries({ queryKey: lifecycleQueryKeys.elaborationConfig(draft.step.id) })
    }
  }

  return (
    <>
      <HuemulSheet
        open={!!target}
        onOpenChange={(next) => {
          if (!next) onRequestClose()
        }}
        hideHeaderBorder
        title={title}
        description={
          <span className="flex flex-col gap-1">
            <span className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-[#64748b]">
              {t("lifecycle.breadcrumbRoot")}
              <ChevronRight className="size-3 shrink-0 text-[#c3cbd6]" />
              {stageLabel}
              {draft.groupable && <PanelBadge label={t("lifecycle.groupableBadge")} />}
            </span>
            <span className="text-[12.5px] text-[#64748b]">{summaryParts.join(" · ")}</span>
          </span>
        }
        icon={isCreateMode ? Plus : Settings}
        iconVariant="tile"
        size="lg"
        bodyClassName="flex flex-col overflow-hidden py-0 [scrollbar-gutter:auto]"
        cancelLabel={t("common:close")}
        footerLeft={
          <div className="flex items-center gap-3">
            {draft.capabilities.canDelete && !isCreateMode && draft.step && draft.canManage && (
              <HuemulButton
                variant="ghost"
                size="sm"
                icon={Trash2}
                label={t("lifecycle.deleteGroup")}
                className="text-destructive hover:bg-destructive/10"
                onClick={() => setConfirmDeleteOpen(true)}
              />
            )}
            {savedStateLabel && <span className="text-[12px] text-[#64748b]">{savedStateLabel}</span>}
          </div>
        }
        saveAction={{
          label: isCreateMode ? t("lifecycle.addGroupTitle") : t("lifecycle.saveChanges"),
          onClick: () => draft.save(),
          disabled: !draft.canSave,
          loading: draft.isSaving,
          closeOnSuccess: false,
        }}
      >
        <div className="flex h-full min-h-0 flex-col">
          {draft.isLoading ? (
            <div className="flex flex-col gap-3 py-4">
              <p className="text-[11.5px] leading-snug text-[#94a3b8]">{t("lifecycle.panel.firstLoadHint")}</p>
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          ) : (
            <Tabs defaultValue="config" className="flex min-h-0 flex-1 flex-col gap-0">
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#e9edf2]">
                <TabsList className="h-auto bg-transparent p-0">
                  <TabsTrigger value="config" className={TAB_CLASS}>
                    {t("lifecycle.panel.tabConfig")}
                  </TabsTrigger>
                  <TabsTrigger value="roles" className={TAB_CLASS}>
                    {t("lifecycle.panel.tabAccess")}
                  </TabsTrigger>
                  {draft.capabilities.hasConditions && (
                    <TabsTrigger
                      value="conditions"
                      disabled={isCreateMode}
                      title={isCreateMode ? t("lifecycle.tabDisabledInCreate") : undefined}
                      className={cn(TAB_CLASS, isCreateMode && "opacity-50")}
                    >
                      {t("lifecycle.panel.tabConditions")}
                    </TabsTrigger>
                  )}
                </TabsList>
                <HuemulButton
                  variant="ghost"
                  size="icon"
                  className="mr-1 size-7.5 shrink-0"
                  icon={RefreshCw}
                  tooltip={combinedIsDirty ? t("lifecycle.refreshBlockedByDirty") : t("common:refresh")}
                  disabled={combinedIsDirty}
                  loading={isFetchingRoles || draft.isFetching}
                  onClick={handleRefresh}
                />
              </div>

              <TabsContent value="config" className="m-0 min-h-0 flex-1 overflow-y-auto">
                <LifecycleStepConfigTab draft={draft} />
              </TabsContent>

              <TabsContent value="roles" className="m-0 min-h-0 flex-1 overflow-y-auto">
                <LifecycleStepRolesTab draft={draft} />
              </TabsContent>

              {draft.capabilities.hasConditions && (
                <TabsContent value="conditions" className="m-0 flex min-h-0 flex-1 flex-col">
                  {isCreateMode ? (
                    <p className="py-6 text-center text-[12px] text-[#94a3b8]">{t("lifecycle.tabDisabledInCreate")}</p>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 pb-2">
                        <p className="text-[12px] leading-snug text-[#64748b]">{t("lifecycle.conditions.subtitle")}</p>
                        <PanelBadge label={t("templates.instantSaveBadge")} />
                      </div>
                      <ScrollArea className="min-h-0 flex-1" viewportClassName="pr-1">
                        <LifecycleStepConditions
                          documentTypeId={documentTypeId}
                          stepType={stageType}
                          focusStepId={draft.step?.id ?? null}
                          onRegisterEditor={setConditionsEditor}
                          onRegisterRefresh={setRefreshConditionsApi}
                        />
                      </ScrollArea>
                    </>
                  )}
                </TabsContent>
              )}
            </Tabs>
          )}
        </div>
      </HuemulSheet>

      <HuemulAlertDialog
        open={confirmDeleteOpen}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteOpen(false)
        }}
        title={t("lifecycle.deleteGroup")}
        description={t("lifecycle.deleteGroupConfirmDesc")}
        actionLabel={t("lifecycle.deleteGroup")}
        alert={draft.deleteBlocked ? { description: t("lifecycle.cannotDeleteLastStep") } : undefined}
        onAction={async () => {
          await draft.remove()
          setConfirmDeleteOpen(false)
          onTargetChange(null)
        }}
      />
    </>
  )
}
