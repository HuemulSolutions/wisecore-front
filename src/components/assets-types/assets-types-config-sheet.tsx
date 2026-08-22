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
import { TagsObjectPicker } from "@/components/tags"
import type {
  AssetTypeConfigSheetProps,
  AssetTypeConfigTab,
  LifecycleSaveApiRef,
  TemplatesSaveApiRef,
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
  canViewTags = false,
  canManageTags = false,
}: AssetTypeConfigSheetProps) {
  const { t } = useTranslation(["asset-types", "tags", "common"])

  const availableTabs = React.useMemo<AssetTypeConfigTab[]>(() => {
    const tabs: AssetTypeConfigTab[] = []
    if (canUpdate || canViewTags) tabs.push("general")
    if (canManageLifecycle) tabs.push("lifecycle")
    if (canManageTemplates) tabs.push("templates")
    return tabs
  }, [canUpdate, canViewTags, canManageTemplates, canManageLifecycle])

  const [activeTab, setActiveTab] = React.useState<AssetTypeConfigTab>(availableTabs[0] ?? "general")
  // Estado de la etapa abierta en «Permisos por rol»: alimenta el footer
  // (texto de cambios pendientes + botón «Guardar cambios») y el guard de descarte.
  const [lifecycleState, setLifecycleState] = React.useState<{
    isDirty: boolean
    stageLabel: string
  }>({ isDirty: false, stageLabel: "" })
  const lifecycleSaveApiRef = React.useRef<LifecycleSaveApiRef["current"]>(null)
  // Estado de guardado del tab «Plantillas», hermano del de lifecycle.
  const [templatesState, setTemplatesState] = React.useState<{ isDirty: boolean }>({ isDirty: false })
  const templatesSaveApiRef = React.useRef<TemplatesSaveApiRef["current"]>(null)

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
    setTemplatesState({ isDirty: false })
    form.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const discardPending = React.useCallback(() => {
    // Primero se limpia el editor y después se ejecuta la acción: si la acción
    // lo desmonta, el `discard()` ya corrió; si NO lo desmonta (cambio de tab
    // con el panel vivo), sin esto los cambios sobrevivían al «Descartar».
    lifecycleSaveApiRef.current?.discard()
    templatesSaveApiRef.current?.discard()
    pendingActionRef.current?.()
    pendingActionRef.current = null
    setLifecycleState((prev) => ({ ...prev, isDirty: false }))
    setTemplatesState({ isDirty: false })
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
      if (lifecycleState.isDirty || templatesState.isDirty || form.isDirty) {
        pendingActionRef.current = action
        setShowUnsavedAlert(true)
      } else {
        action()
      }
    },
    [lifecycleState.isDirty, templatesState.isDirty, form.isDirty],
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
  const isTemplatesTab = activeTab === "templates"

  // Cada tab decide qué guarda el footer: General envía el formulario, «Permisos
  // por rol» y «Plantillas» delegan en la API que publica su panel.
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
    if (isTemplatesTab && canManageTemplates) {
      return {
        label: t("asset-types:lifecycle.saveChanges"),
        onClick: () => templatesSaveApiRef.current?.save(),
        disabled: !templatesState.isDirty,
        closeOnSuccess: false,
      }
    }
    return undefined
  }, [
    isGeneralTab,
    isLifecycleTab,
    isTemplatesTab,
    canUpdate,
    canManageLifecycle,
    canManageTemplates,
    form.submit,
    form.isSaving,
    form.canSubmit,
    lifecycleState.isDirty,
    templatesState.isDirty,
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
        bodyClassName="flex flex-col overflow-hidden py-0 [scrollbar-gutter:auto]"
        cancelLabel={t("common:close")}
        onOpenAutoFocus={(e) => {
          // Radix enfoca el primer tab al montar y su focus-visible ring queda
          // dibujado como si el tab estuviera "en caja". Se mantiene el foco
          // dentro del sheet sin marcar ningún trigger.
          e.preventDefault()
          ;(e.currentTarget as HTMLElement | null)?.focus()
        }}
        footerLeft={
          isLifecycleTab && lifecycleState.isDirty ? (
            <span className="text-[12px] text-[#64748b]">
              {t("asset-types:lifecycle.unsavedInStage", {
                stage: lifecycleState.stageLabel,
              })}
            </span>
          ) : isTemplatesTab && templatesState.isDirty ? (
            <span className="text-[12px] text-[#64748b]">
              {t("asset-types:templates.unsavedChanges")}
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
                {availableTabs.includes("lifecycle") && (
                  <TabsTrigger value="lifecycle" className={TAB_TRIGGER_CLASS}>
                    {t("asset-types:config.tabs.lifecycle")}
                  </TabsTrigger>
                )}
                {availableTabs.includes("templates") && (
                  <TabsTrigger value="templates" className={TAB_TRIGGER_CLASS}>
                    {t("asset-types:config.tabs.templates")}
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
                <div className="max-w-xl space-y-4">
                  {canUpdate && (
                    form.isLoadingData ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <AssetTypeGeneralFormFields form={form} type="asset" />
                    )
                  )}
                  {canViewTags && documentTypeId && (
                    <div>
                      <p className="text-sm font-medium leading-snug mb-1.5">
                        {t("tags:assign.assignedLabel")}
                      </p>
                      <TagsObjectPicker
                        objectType="document_type"
                        objectIds={[documentTypeId]}
                        variant="field"
                        canView={open && activeTab === "general" && canViewTags}
                        canAssign={canManageTags}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>
            )}

            {/* ── Ciclo de vida ───────────────────────────────────────── */}
            {availableTabs.includes("lifecycle") && (
              <TabsContent
                value="lifecycle"
                className="flex-1 min-h-0 overflow-hidden pl-6 pr-0 pt-2 pb-0 mt-0 data-[state=active]:flex data-[state=active]:flex-col"
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
                  onDirtyChange={setTemplatesState}
                  saveApiRef={templatesSaveApiRef}
                />
              </TabsContent>
            )}
          </Tabs>
        )}
      </HuemulSheet>
    </>
  )
}
