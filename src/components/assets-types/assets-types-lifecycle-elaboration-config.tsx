"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { HuemulField } from "@/huemul/components/huemul-field"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useExternalSystems } from "@/hooks/useExternalSystems"
import { useExternalFunctionalities } from "@/hooks/useExternalFunctionalities"
import { useDocumentTypeFormSections } from "@/hooks/useDocumentTypeFormSections"
import {
  useLifecycleElaborationConfig,
  useLifecycleElaborationConfigMutations,
} from "@/hooks/useLifecycle"
import { PanelCard as HuemulSectionCard, PanelBadge, PanelHeaderSwitch, PanelInfoHint } from "./assets-types-lifecycle-ui"

interface LifecycleElaborationConfigSectionProps {
  organizationId: string
  documentTypeId: string
  stepId: string
  readOnly?: boolean
}

interface AddDialogState {
  systemId: string
  functionalityId: string
}

/**
 * Config 1:1 de elaboración externa de un step `edit` — a diferencia de las
 * acciones de revisión/publicación (1:N, con orden), acá solo hay una
 * `LifecycleElaborationConfig` por step, así que no hay tabla ni reorder: alta
 * (si no existe), y edición inline de sus tres campos si existe.
 *
 * Persiste al instante (PUT/POST/DELETE directos por control), NO participa
 * del batch-save del footer del sheet — mismos motivos que
 * `LifecycleReviewActionsSection`: permisos propios
 * (`lifecycle_elaboration_config:*`, distintos de `asset_type:u`) y un verbo
 * que depende del estado del servidor.
 */
export function LifecycleElaborationConfigSection({
  organizationId,
  documentTypeId,
  stepId,
  readOnly = false,
}: LifecycleElaborationConfigSectionProps) {
  const { t } = useTranslation(["asset-types", "common"])
  const { isOrgAdmin, hasPermission } = useUserPermissions()

  const canList = isOrgAdmin || hasPermission("lifecycle_elaboration_config:l")
  const canCreate = isOrgAdmin || hasPermission("lifecycle_elaboration_config:c")
  const canUpdate = isOrgAdmin || hasPermission("lifecycle_elaboration_config:u")
  const canDelete = isOrgAdmin || hasPermission("lifecycle_elaboration_config:d")
  const canListSystems = isOrgAdmin || hasPermission("external_system:l") || hasPermission("external_system:r")
  const canListFunctionalities = isOrgAdmin || hasPermission("external_functionality:l") || hasPermission("external_functionality:r")

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [addForm, setAddForm] = useState<AddDialogState>({ systemId: "", functionalityId: "" })
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  // ─── Data ───────────────────────────────────────────────────────────────────

  const { data: configData, isLoading: isLoadingConfig } = useLifecycleElaborationConfig(
    organizationId,
    stepId,
    canList && !!stepId,
  )
  const config = configData?.data ?? null

  const { createConfig, updateConfig, deleteConfig } = useLifecycleElaborationConfigMutations(
    organizationId,
    stepId,
  )

  // Systems combobox (solo mientras el diálogo de alta está abierto)
  const { data: systemsData, isLoading: isLoadingSystems } = useExternalSystems(organizationId, {
    pageSize: 200,
    enabled: showAddDialog && canListSystems,
  })
  const systems = systemsData?.data ?? []

  // Functionalities combobox — solo funcionalidades con el objetivo de elaboración
  const { data: functionalitiesData, isLoading: isLoadingFunctionalities } = useExternalFunctionalities(
    organizationId,
    addForm.systemId,
    { objective: "lifecycle_elaboration", pageSize: 200, enabled: showAddDialog && !!addForm.systemId && canListFunctionalities },
  )
  const functionalities = functionalitiesData?.data ?? []

  // Secciones de formulario disponibles como blueprint — solo si hay config,
  // que es cuando el selector se muestra.
  const { sections: formSections, templateCount } = useDocumentTypeFormSections(
    documentTypeId,
    organizationId,
    !!config,
  )

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleOpenAdd = () => {
    setAddForm({ systemId: "", functionalityId: "" })
    setShowAddDialog(true)
  }

  const handleSaveAdd = () => {
    createConfig.mutate(
      { external_functionality_id: addForm.functionalityId },
      { onSuccess: () => setShowAddDialog(false) },
    )
  }

  const handleConfirmDelete = async () => {
    await deleteConfig.mutateAsync()
  }

  const resolveName = () =>
    config?.external_functionality?.name ?? `${config?.external_functionality_id.slice(0, 8)}…`

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <HuemulSectionCard
      title={t("lifecycle.elaborationConfig.title")}
      subtitle={t("lifecycle.elaborationConfig.subtitle")}
      headerRight={
        config && canUpdate ? (
          <PanelHeaderSwitch
            checked={config.is_enabled}
            disabled={readOnly || updateConfig.isPending}
            ariaLabel={t("lifecycle.elaborationConfig.isEnabled")}
            onChange={(v) => updateConfig.mutate({ is_enabled: v })}
          />
        ) : undefined
      }
      className="flex flex-col gap-3 p-4"
    >
      {isLoadingConfig ? (
        <p className="py-2 text-center text-[12px] text-[#94a3b8]">{t("common:loading", "Loading…")}</p>
      ) : !config ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[#dde4ec] py-6 text-center">
          <p className="text-[12.5px] font-medium text-[#334155]">{t("lifecycle.elaborationConfig.empty")}</p>
          <p className="text-[11.5px] text-[#94a3b8]">{t("lifecycle.elaborationConfig.emptyDescription")}</p>
          {canCreate && (
            <Button variant="outline" size="sm" onClick={handleOpenAdd} disabled={readOnly} className="mt-1">
              <Plus className="mr-1.5 h-4 w-4" />
              {t("lifecycle.elaborationConfig.configure")}
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[12.5px] font-medium text-[#0f172a]">{resolveName()}</p>
              {config.external_functionality && (
                <p className="truncate text-[11.5px] text-[#94a3b8]">
                  {config.external_functionality.system.name} · {config.external_functionality.http_method}{" "}
                  {config.external_functionality.partial_url}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <PanelBadge label={t(`external-functionalities:executionType.${config.external_functionality?.execution_type ?? "sync"}`)} />
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  disabled={readOnly || deleteConfig.isPending}
                  onClick={() => setConfirmDeleteOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          <HuemulField
            type="select"
            label={t("lifecycle.elaborationConfig.sectionBlueprint")}
            name="elaboration-section-blueprint"
            value={config.new_section_template_section_id ?? ""}
            options={formSections.map((s) => ({
              value: s.id,
              label: templateCount > 1 ? `${s.templateName} · ${s.name}` : s.name,
            }))}
            placeholder={t("lifecycle.elaborationConfig.sectionBlueprintPlaceholder")}
            emptyOptionLabel={t("lifecycle.elaborationConfig.sectionBlueprintClear")}
            onChange={(v) => updateConfig.mutate({ new_section_template_section_id: v ? String(v) : null })}
            disabled={readOnly || !canUpdate || updateConfig.isPending}
            helpText={t("lifecycle.elaborationConfig.sectionBlueprintHelp")}
          />

          {!config.new_section_template_section_id && (
            <PanelInfoHint tone="warning">{t("lifecycle.elaborationConfig.noBlueprintWarning")}</PanelInfoHint>
          )}
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={showAddDialog} onOpenChange={(v) => !v && setShowAddDialog(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("lifecycle.elaborationConfig.configure")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <HuemulField
              type="combobox"
              label={t("lifecycle.reviewActions.selectSystem")}
              name="elaboration-system"
              value={addForm.systemId}
              onChange={(v) => setAddForm({ systemId: String(v), functionalityId: "" })}
              placeholder={isLoadingSystems ? t("common:loading", "Loading…") : t("lifecycle.reviewActions.selectSystemPlaceholder")}
              options={systems.map((s) => ({ value: s.id, label: s.name }))}
              disabled={isLoadingSystems}
            />
            <HuemulField
              type="combobox"
              label={t("lifecycle.reviewActions.selectFunctionality")}
              name="elaboration-functionality"
              value={addForm.functionalityId}
              onChange={(v) => setAddForm((prev) => ({ ...prev, functionalityId: String(v) }))}
              placeholder={
                !addForm.systemId
                  ? t("lifecycle.reviewActions.selectSystemPlaceholder")
                  : isLoadingFunctionalities
                    ? t("common:loading", "Loading…")
                    : t("lifecycle.reviewActions.selectFunctionalityPlaceholder")
              }
              options={functionalities.map((f) => ({ value: f.id, label: f.name }))}
              disabled={!addForm.systemId || isLoadingFunctionalities}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={createConfig.isPending}>
              {t("lifecycle.reviewActions.cancel")}
            </Button>
            <Button onClick={handleSaveAdd} disabled={createConfig.isPending || !addForm.functionalityId}>
              {createConfig.isPending ? t("common:saving", "Saving…") : t("lifecycle.reviewActions.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <HuemulAlertDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title={t("lifecycle.elaborationConfig.deleteTitle")}
        description={t("lifecycle.elaborationConfig.deleteDescription")}
        actionLabel={t("common:delete", "Delete")}
        onAction={handleConfirmDelete}
      />
    </HuemulSectionCard>
  )
}
