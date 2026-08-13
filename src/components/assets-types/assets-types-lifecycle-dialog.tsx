import { useState, useEffect, useRef, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Activity } from "lucide-react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import {
  useLifecycleSteps,
  useAllLifecycleSteps,
  useLifecycleMutations,
} from "@/hooks/useLifecycle"
import { useRoles } from "@/hooks/useRbac"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { Skeleton } from "@/components/ui/skeleton"
import { CreateStepContent } from "./assets-types-lifecycle-create-step"
import { EditStepContent } from "./assets-types-lifecycle-edit-step"
import { AssetTypeLifecycleMatrix } from "./assets-types-lifecycle-matrix"
import { LifecycleStepPanel } from "./assets-types-lifecycle-step-panel"
import {
  ChipList,
  PanelFieldLabel,
  RemovableChip,
  SettingToggleList,
  SettingToggleRow,
} from "./assets-types-lifecycle-ui"
import { HuemulField } from "@/huemul/components/huemul-field"
import type {
  DefaultStepContentProps,
  StepContentProps,
  AssetTypeLifecycleDialogProps,
  LifecycleEditorApi,
  LifecycleSaveApiRef,
} from '@/types/assets'

export type { AssetTypeLifecycleDialogProps } from '@/types/assets'

// Handles all step types that are not "create" or "edit" (review, approve, etc.)

function DefaultStepContent({
  documentTypeId,
  stepType,
  stepLabel,
}: DefaultStepContentProps) {
  const { t } = useTranslation("asset-types")
  const { canUpdate } = useUserPermissions()
  const canManage = canUpdate('asset_type')
  const { data, isLoading } = useLifecycleSteps(documentTypeId, stepType, true)
  const { data: rolesData } = useRoles(true, 1, 1000)
  const { updateStep, addRole, removeRole } = useLifecycleMutations(
    documentTypeId,
    stepType
  )
  const stepAction = t(`lifecycle.stepActions.${stepType}`, { defaultValue: stepType })

  const step = data?.data?.steps?.[0] ?? null
  const allRoles = rolesData?.data ?? []

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 py-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-14 w-full rounded-md" />
        <Skeleton className="h-14 w-full rounded-md" />
      </div>
    )
  }

  if (!step) {
    return (
      <p className="py-4 text-[12.5px] text-[#64748b]">
        {t("lifecycle.noConfig")}
      </p>
    )
  }

  const isAll = step.access_type === "all"
  const isCustom = step.access_type === "custom"
  const isMutating =
    updateStep.isPending || addRole.isPending || removeRole.isPending
  const ro = !canManage || isMutating

  const assignedRoleIds = new Set(step.step_roles.map((r) => r.role_id))
  const availableRoles = allRoles.filter((r) => !assignedRoleIds.has(r.id))

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] font-semibold text-[#0f172a]">
        {step.name ?? stepLabel}
      </p>

      <SettingToggleList>
        <SettingToggleRow
          label={t("lifecycle.allowAnyoneLabel", { action: stepAction })}
          description={t("lifecycle.allowAnyoneDescShort")}
          checked={isAll}
          disabled={ro || isCustom}
          onChange={(v) => {
            if (!canManage) return
            updateStep.mutate({
              stepId: step.id,
              data: { access_type: v ? "all" : "owner" },
            })
          }}
        />
        <SettingToggleRow
          label={t("lifecycle.customRolesLabel")}
          description={t("lifecycle.customRolesDesc", { action: stepAction })}
          checked={isCustom}
          disabled={ro}
          onChange={(v) => {
            if (!canManage) return
            updateStep.mutate({
              stepId: step.id,
              data: { access_type: v ? "custom" : "owner" },
            })
          }}
        />
      </SettingToggleList>

      {isCustom && (
        <div className="flex flex-col gap-1.5">
          <PanelFieldLabel disabled={ro}>
            {t("lifecycle.rolesAllowedLabel", { action: stepAction })}
          </PanelFieldLabel>
          {step.step_roles.length > 0 && (
            <ChipList>
              {step.step_roles.map((sr) => (
                <RemovableChip
                  key={sr.role_id}
                  label={sr.role_name ?? sr.role_id}
                  disabled={removeRole.isPending}
                  removeLabel={t("lifecycle.matrix.removeRole")}
                  onRemove={
                    canManage
                      ? () =>
                          removeRole.mutate({ stepId: step.id, roleId: sr.role_id })
                      : undefined
                  }
                />
              ))}
            </ChipList>
          )}
          {canManage && (
            <HuemulField
              type="combobox"
              label=""
              name="add-role"
              placeholder={t("lifecycle.panel.addRoleToStep")}
              value=""
              options={availableRoles.map((r) => ({ value: r.id, label: r.name }))}
              onChange={(roleId) => {
                if (!roleId) return
                addRole.mutate({ stepId: step.id, roleId: roleId as string })
              }}
              disabled={addRole.isPending}
            />
          )}
        </div>
      )}
    </div>
  )
}

// Routes to the appropriate sub-component based on stepType. Exportado para que
// el panel lateral de la matriz de permisos por rol (`LifecycleStepPanel`) lo
// reutilice tal cual, sin duplicar el routing por step type.

export function StepContent({
  documentTypeId,
  stepType,
  stepLabel,
  onRegisterEditor,
  organizationId,
  addGroupSignal,
}: StepContentProps) {
  // Edit-style steps manage their own internal scroll area (cards scroll)
  if (stepType === "edit" || stepType === "review" || stepType === "approve") {
    return (
      <EditStepContent
        documentTypeId={documentTypeId}
        stepType={stepType}
        onRegisterEditor={onRegisterEditor}
        organizationId={organizationId}
        addGroupSignal={addGroupSignal}
      />
    )
  }

  // Other step types don't have their own scroll container — wrap them so they scroll
  // within the fixed-height panel instead of relying on the sheet itself to scroll.
  return (
    <ScrollArea className="h-full" viewportClassName="pr-1">
      {stepType === "create" || stepType === "view" || stepType === "publish" || stepType === "archive" || stepType === "read" ? (
        <CreateStepContent
          documentTypeId={documentTypeId}
          stepType={stepType}
          hasSla={stepType === "publish" || stepType === "archive"}
          hasValidity={stepType === "create"}
          noOwner={stepType === "create"}
          useAllOrCustomOwner={stepType === "publish" || stepType === "archive" || stepType === "read" || stepType === "view"}
          onRegisterEditor={onRegisterEditor}
          organizationId={organizationId}
        />
      ) : (
        <DefaultStepContent
          documentTypeId={documentTypeId}
          stepType={stepType}
          stepLabel={stepLabel}
        />
      )}
    </ScrollArea>
  )
}

interface AssetTypeLifecyclePanelProps {
  documentTypeId: string
  organizationId?: string
  /** Solo dispara el fetch de steps/roles cuando el panel está visible. */
  enabled?: boolean
  /** Informa al contenedor si la etapa activa tiene cambios sin guardar. */
  onDirtyChange?: (state: { isDirty: boolean; stageLabel: string }) => void
  /** El contenedor publica aquí `save`/`isDirty`/`isSaving` para su footer. */
  saveApiRef?: LifecycleSaveApiRef
  /** Envuelve las acciones que descartarían cambios sin guardar. */
  guardedAction: (action: () => void) => void
}

/**
 * Matriz de permisos por rol + panel lateral de configuración. Se monta como
 * tab dentro del sheet de configuración (`AssetTypeConfigSheet`) y también
 * dentro del `AssetTypeLifecycleDialog` que usan las páginas de relaciones.
 *
 * La matriz (`AssetTypeLifecycleMatrix`) lista roles × columnas (un
 * `LifecycleStep` por columna); el selector de etapa —y el engranaje de cada
 * columna— abre el panel lateral (`LifecycleStepPanel`) con los grupos de esa
 * etapa, que reutiliza el router `StepContent` para el detalle (SLA, modo,
 * reglas de acceso).
 *
 * Los controles del panel están siempre editables: los cambios se acumulan en
 * el contenido de la etapa y se persisten con «Guardar cambios» del footer del
 * sheet, vía la API publicada en `saveApiRef`.
 */
export function AssetTypeLifecyclePanel({
  documentTypeId,
  organizationId,
  enabled = true,
  onDirtyChange,
  saveApiRef,
  guardedAction,
}: AssetTypeLifecyclePanelProps) {
  const { t } = useTranslation("asset-types")
  const { data } = useAllLifecycleSteps(documentTypeId, enabled)
  const allSteps = data?.data?.steps ?? []

  const [activeStageType, setActiveStageType] = useState<string | null>(null)
  const [editor, setEditor] = useState<LifecycleEditorApi | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleRegisterEditor = useCallback((api: LifecycleEditorApi | null) => {
    setEditor(api)
  }, [])

  const isDirty = editor?.isDirty ?? false
  const stageLabel = activeStageType
    ? t(`lifecycle.stepTypes.${activeStageType}`, { defaultValue: activeStageType })
    : ""
  const groupCount = activeStageType
    ? allSteps.filter((s) => s.type === activeStageType).length
    : 0

  const save = useCallback(async () => {
    if (!editor) return
    setIsSaving(true)
    try {
      await editor.save()
    } finally {
      setIsSaving(false)
    }
  }, [editor])

  // Publica la API de guardado hacia el footer del contenedor.
  useEffect(() => {
    if (!saveApiRef) return
    saveApiRef.current = { save, isDirty, isSaving }
    return () => {
      saveApiRef.current = null
    }
  }, [saveApiRef, save, isDirty, isSaving])

  useEffect(() => {
    onDirtyChange?.({ isDirty, stageLabel })
  }, [isDirty, stageLabel, onDirtyChange])

  const handleSelectStage = (stepType: string) => {
    guardedAction(() =>
      setActiveStageType((prev) => (prev === stepType ? null : stepType))
    )
  }

  const handleClosePanel = () => {
    guardedAction(() => setActiveStageType(null))
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="-mr-6 h-full min-h-0">
      <ResizablePanel defaultSize={65} minSize={35} className="flex min-w-0 flex-col">
        <AssetTypeLifecycleMatrix
          documentTypeId={documentTypeId}
          enabled={enabled}
          activeStageType={activeStageType}
          lockedStageType={isDirty ? activeStageType : null}
          onSelectStage={handleSelectStage}
        />
      </ResizablePanel>

      {activeStageType && (
        <>
          <ResizableHandle className="mx-3 bg-[#e9edf2]" />
          <ResizablePanel defaultSize={35} minSize={24} maxSize={55} className="flex min-h-0 flex-col">
            <LifecycleStepPanel
              key={activeStageType}
              documentTypeId={documentTypeId}
              stageType={activeStageType}
              groupCount={groupCount}
              onClose={handleClosePanel}
              onRegisterEditor={handleRegisterEditor}
              organizationId={organizationId}
            />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  )
}

export default function AssetTypeLifecycleDialog({
  assetType,
  open,
  onOpenChange,
  organizationId,
}: AssetTypeLifecycleDialogProps) {
  const { t } = useTranslation(["asset-types", "common"])

  const [lifecycleState, setLifecycleState] = useState<{
    isDirty: boolean
    stageLabel: string
  }>({ isDirty: false, stageLabel: "" })
  const saveApiRef = useRef<LifecycleSaveApiRef["current"]>(null)

  // Unsaved-changes guard
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false)
  const pendingActionRef = useRef<(() => void) | null>(null)

  const guardedAction = useCallback(
    (action: () => void) => {
      if (lifecycleState.isDirty) {
        pendingActionRef.current = action
        setShowUnsavedAlert(true)
      } else {
        action()
      }
    },
    [lifecycleState.isDirty]
  )

  const handleGuardedOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        guardedAction(() => onOpenChange(false))
      } else {
        onOpenChange(true)
      }
    },
    [guardedAction, onOpenChange]
  )

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setLifecycleState({ isDirty: false, stageLabel: "" })
    }
  }, [open])

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
        onAction={async () => {
          pendingActionRef.current?.()
          pendingActionRef.current = null
          setLifecycleState((prev) => ({ ...prev, isDirty: false }))
        }}
      />
      <HuemulSheet
        open={open}
        onOpenChange={handleGuardedOpenChange}
        title={t("asset-types:lifecycle.title")}
        description={assetType?.document_type_name ?? undefined}
        icon={Activity}
        iconVariant="tile"
        size="wide"
        bodyClassName="flex flex-col overflow-hidden py-0 [scrollbar-gutter:auto]"
        cancelLabel={t("common:close")}
        footerLeft={
          lifecycleState.isDirty ? (
            <span className="text-[12px] text-[#64748b]">
              {t("asset-types:lifecycle.unsavedInStage", {
                stage: lifecycleState.stageLabel,
              })}
            </span>
          ) : undefined
        }
        saveAction={{
          label: t("asset-types:lifecycle.saveChanges"),
          onClick: () => saveApiRef.current?.save(),
          disabled: !lifecycleState.isDirty,
          closeOnSuccess: false,
        }}
      >
        {assetType && (
          <AssetTypeLifecyclePanel
            key={assetType.document_type_id}
            documentTypeId={assetType.document_type_id}
            organizationId={organizationId}
            enabled={open}
            onDirtyChange={setLifecycleState}
            saveApiRef={saveApiRef}
            guardedAction={guardedAction}
          />
        )}
      </HuemulSheet>
    </>
  )
}
