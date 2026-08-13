"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { Settings2, Loader2 } from "lucide-react"

import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  useAssetTypeGeneralForm,
  AssetTypeGeneralFormFields,
} from "@/components/assets-types/assets-types-general-form"
import { AssetTypeTemplatesPanel } from "@/components/assets-types/assets-types-templates-panel"
import { AssetTypeLifecyclePanel } from "@/components/assets-types/assets-types-lifecycle-dialog"
import type {
  AssetTypeConfigSheetProps,
  AssetTypeConfigTab,
  LifecycleSaveApiRef,
} from "@/types/assets"

export type { AssetTypeConfigSheetProps } from "@/types/assets"

// Tabs de texto con subrayado: el `TabsTrigger` base es una pastilla sobre fondo
// gris, así que se neutraliza y el estado activo se dibuja con un inset shadow.
const TAB_TRIGGER_CLASS =
  "flex-none rounded-none border-0 bg-transparent px-0 pb-2.5 text-[13px] font-medium text-[#64748b] shadow-none hover:cursor-pointer hover:text-[#334155] data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-[#1d4ed8] data-[state=active]:shadow-[inset_0_-2px_0_#1d4ed8]"

/**
 * Sheet ancho que concentra toda la configuración de un tipo de activo:
 * datos generales, plantillas vinculadas y ciclo de vida. Cada tab se monta
 * solo si el usuario tiene el permiso correspondiente.
 */
export function AssetTypeConfigSheet({
  assetType,
  open,
  onOpenChange,
  organizationId,
  canUpdate,
  canManageTemplates,
  canManageLifecycle,
}: AssetTypeConfigSheetProps) {
  const { t } = useTranslation(["asset-types", "common"])

  const availableTabs = React.useMemo<AssetTypeConfigTab[]>(() => {
    const tabs: AssetTypeConfigTab[] = []
    if (canUpdate) tabs.push("general")
    if (canManageTemplates) tabs.push("templates")
    if (canManageLifecycle) tabs.push("lifecycle")
    return tabs
  }, [canUpdate, canManageTemplates, canManageLifecycle])

  const [activeTab, setActiveTab] = React.useState<AssetTypeConfigTab>(availableTabs[0] ?? "general")
  // Estado de la etapa abierta en «Permisos por rol»: alimenta el footer
  // (texto de cambios pendientes + botón «Guardar cambios») y el guard de descarte.
  const [lifecycleState, setLifecycleState] = React.useState<{
    isDirty: boolean
    stageLabel: string
  }>({ isDirty: false, stageLabel: "" })
  const lifecycleSaveApiRef = React.useRef<LifecycleSaveApiRef["current"]>(null)

  // Unsaved-changes guard (compartido entre cambio de tab y cierre del sheet)
  const [showUnsavedAlert, setShowUnsavedAlert] = React.useState(false)
  const pendingActionRef = React.useRef<(() => void) | null>(null)

  const documentTypeId = assetType?.document_type_id ?? ""

  const form = useAssetTypeGeneralForm({
    documentTypeId: documentTypeId || undefined,
    type: "asset",
    enabled: open && canUpdate && !!documentTypeId,
  })

  // Al cerrar, vuelve al primer tab disponible y limpia el formulario para que
  // la próxima apertura no arrastre estado de otro tipo de activo.
  React.useEffect(() => {
    if (open) return
    setActiveTab(availableTabs[0] ?? "general")
    setLifecycleState({ isDirty: false, stageLabel: "" })
    form.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const discardPending = React.useCallback(() => {
    pendingActionRef.current?.()
    pendingActionRef.current = null
    setLifecycleState((prev) => ({ ...prev, isDirty: false }))
    form.discard()
  }, [form])

  // Guard del panel de lifecycle: solo mira los cambios sin guardar de su propia etapa.
  const lifecycleGuardedAction = React.useCallback(
    (action: () => void) => {
      if (lifecycleState.isDirty) {
        pendingActionRef.current = action
        setShowUnsavedAlert(true)
      } else {
        action()
      }
    },
    [lifecycleState.isDirty],
  )

  // Guard del sheet: mira los cambios pendientes de cualquier tab.
  const sheetGuardedAction = React.useCallback(
    (action: () => void) => {
      if (lifecycleState.isDirty || form.isDirty) {
        pendingActionRef.current = action
        setShowUnsavedAlert(true)
      } else {
        action()
      }
    },
    [lifecycleState.isDirty, form.isDirty],
  )

  const handleGuardedOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        sheetGuardedAction(() => onOpenChange(false))
      } else {
        onOpenChange(true)
      }
    },
    [sheetGuardedAction, onOpenChange],
  )

  const isGeneralTab = activeTab === "general"
  const isLifecycleTab = activeTab === "lifecycle"

  // Cada tab decide qué guarda el footer: General envía el formulario, «Permisos
  // por rol» delega en la API que publica el panel de la etapa activa.
  const saveAction = React.useMemo(() => {
    if (isGeneralTab && canUpdate) {
      return {
        label: t("common:save"),
        onClick: form.submit,
        loading: form.isSaving,
        disabled: !form.canSubmit,
        closeOnSuccess: false,
      }
    }
    if (isLifecycleTab && canManageLifecycle) {
      return {
        label: t("asset-types:lifecycle.saveChanges"),
        onClick: () => lifecycleSaveApiRef.current?.save(),
        disabled: !lifecycleState.isDirty,
        closeOnSuccess: false,
      }
    }
    return undefined
  }, [
    isGeneralTab,
    isLifecycleTab,
    canUpdate,
    canManageLifecycle,
    form.submit,
    form.isSaving,
    form.canSubmit,
    lifecycleState.isDirty,
    t,
  ])

  return (
    <>
      <HuemulAlertDialog
        open={showUnsavedAlert}
        onOpenChange={setShowUnsavedAlert}
        title={t("asset-types:lifecycle.unsavedChanges.title")}
        description={t("asset-types:lifecycle.unsavedChanges.description")}
        actionLabel={t("asset-types:lifecycle.unsavedChanges.discard")}
        cancelLabel={t("asset-types:lifecycle.unsavedChanges.keepEditing")}
        actionVariant="destructive"
        onAction={async () => discardPending()}
      />

      <HuemulSheet
        open={open}
        onOpenChange={handleGuardedOpenChange}
        title={t("asset-types:config.title")}
        description={assetType?.document_type_name}
        icon={Settings2}
        iconVariant="tile"
        size="wide"
        bodyClassName="flex flex-col overflow-hidden py-0"
        cancelLabel={t("common:close")}
        footerLeft={
          isLifecycleTab && lifecycleState.isDirty ? (
            <span className="text-[12px] text-[#64748b]">
              {t("asset-types:lifecycle.unsavedInStage", {
                stage: lifecycleState.stageLabel,
              })}
            </span>
          ) : undefined
        }
        saveAction={saveAction}
      >
        {assetType && availableTabs.length > 0 && (
          <Tabs
            value={activeTab}
            onValueChange={(v) =>
              sheetGuardedAction(() => setActiveTab(v as AssetTypeConfigTab))
            }
            className="flex flex-col -mx-6 h-full"
          >
            {/* Tab bar — texto con subrayado, el borde inferior lo aporta la lista */}
            <div className="px-6">
              <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b border-[#e9edf2] bg-transparent p-0">
                {availableTabs.includes("general") && (
                  <TabsTrigger value="general" className={TAB_TRIGGER_CLASS}>
                    {t("asset-types:config.tabs.general")}
                  </TabsTrigger>
                )}
                {availableTabs.includes("templates") && (
                  <TabsTrigger value="templates" className={TAB_TRIGGER_CLASS}>
                    {t("asset-types:config.tabs.templates")}
                  </TabsTrigger>
                )}
                {availableTabs.includes("lifecycle") && (
                  <TabsTrigger value="lifecycle" className={TAB_TRIGGER_CLASS}>
                    {t("asset-types:config.tabs.lifecycle")}
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            {/* ── General ─────────────────────────────────────────────── */}
            {availableTabs.includes("general") && (
              <TabsContent
                value="general"
                className="flex-1 overflow-y-auto px-6 pt-4 pb-4 mt-0"
              >
                {form.isLoadingData ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="max-w-xl">
                    <AssetTypeGeneralFormFields form={form} type="asset" />
                  </div>
                )}
              </TabsContent>
            )}

            {/* ── Plantillas ──────────────────────────────────────────── */}
            {availableTabs.includes("templates") && (
              <TabsContent
                value="templates"
                className="flex-1 overflow-y-auto px-6 pt-4 pb-4 mt-0"
              >
                <AssetTypeTemplatesPanel
                  key={documentTypeId}
                  documentTypeId={documentTypeId}
                  enabled={open && activeTab === "templates"}
                />
              </TabsContent>
            )}

            {/* ── Ciclo de vida ───────────────────────────────────────── */}
            {availableTabs.includes("lifecycle") && (
              <TabsContent
                value="lifecycle"
                className="flex-1 min-h-0 overflow-hidden px-6 pt-2 pb-0 mt-0 data-[state=active]:flex data-[state=active]:flex-col"
              >
                <AssetTypeLifecyclePanel
                  key={documentTypeId}
                  documentTypeId={documentTypeId}
                  organizationId={organizationId}
                  enabled={open && activeTab === "lifecycle"}
                  onDirtyChange={setLifecycleState}
                  saveApiRef={lifecycleSaveApiRef}
                  guardedAction={lifecycleGuardedAction}
                />
              </TabsContent>
            )}
          </Tabs>
        )}
      </HuemulSheet>
    </>
  )
}
