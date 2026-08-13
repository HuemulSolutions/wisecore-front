import { useState, useEffect, useRef, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Activity, X } from "lucide-react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { HuemulField } from "@/huemul/components/huemul-field"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  useLifecycleSteps,
  useAllLifecycleSteps,
  useLifecycleMutations,
} from "@/hooks/useLifecycle"
import { useRoles } from "@/hooks/useRbac"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CreateStepContent } from "./assets-types-lifecycle-create-step"
import { EditStepContent } from "./assets-types-lifecycle-edit-step"
import { AssetTypeLifecycleMatrix } from "./assets-types-lifecycle-matrix"
import { LifecycleStepPanel } from "./assets-types-lifecycle-step-panel"
import type { DefaultStepContentProps, StepContentProps, AssetTypeLifecycleDialogProps } from '@/types/assets'

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
      <p className="text-sm text-muted-foreground py-4">
        {t("lifecycle.noConfig")}
      </p>
    )
  }

  const isAll = step.access_type === "all"
  const isCustom = step.access_type === "custom"
  const isMutating =
    updateStep.isPending || addRole.isPending || removeRole.isPending

  const assignedRoleIds = new Set(step.step_roles.map((r) => r.role_id))
  const availableRoles = allRoles.filter((r) => !assignedRoleIds.has(r.id))

  return (
    <div className="flex flex-col gap-4">
      {/* Step heading */}
      <p className="text-sm font-semibold text-foreground">
        {step.name ?? stepLabel}
      </p>

      {/* Access config card */}
      <div className="flex flex-col gap-4 rounded-md border border-border bg-muted/30 p-4">
        {/* Switch: all vs owner */}
        <HuemulField
          type="switch"
          label={t("lifecycle.allowAnyoneLabel", { action: stepAction })}
          name="access-all"
          value={isAll}
          onChange={(v) => {
            if (!canManage) return
            updateStep.mutate({
              stepId: step.id,
              data: { access_type: v ? "all" : "owner" },
            })
          }}
          disabled={!canManage || isCustom || isMutating}
          description={
            isAll
              ? t("lifecycle.allowAnyoneDescOn", { action: stepAction })
              : t("lifecycle.allowAnyoneDescOff", { action: stepAction })
          }
          labelFirst
        />

        <div className="h-px bg-border" />

        {/* Switch: custom role configuration */}
        <HuemulField
          type="switch"
          label={t("lifecycle.customRolesLabel")}
          name="access-custom"
          value={isCustom}
          onChange={(v) => {
            if (!canManage) return
            updateStep.mutate({
              stepId: step.id,
              data: { access_type: v ? "custom" : "owner" },
            })
          }}
          disabled={!canManage || isMutating}
          description={t("lifecycle.customRolesDesc", { action: stepAction })}
          labelFirst
        />
      </div>

      {/* Custom roles section */}
      {isCustom && (canManage ? (
        <HuemulField
          type="combobox"
          label={t("lifecycle.addRole", { action: stepAction })}
          name="add-role"
          placeholder={t("lifecycle.addRolePlaceholder")}
          value=""
          options={availableRoles.map((r) => ({ value: r.id, label: r.name }))}
          onChange={(roleId) => {
            if (!canManage || !roleId) return
            addRole.mutate({ stepId: step.id, roleId: roleId as string })
          }}
          disabled={addRole.isPending}
        >
          {step.step_roles.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {step.step_roles.map((sr) => (
                <Badge
                  key={sr.role_id}
                  variant="secondary"
                  className="flex items-center gap-1 pr-1.5"
                >
                  <span className="text-xs">{sr.role_name ?? sr.role_id}</span>
                  <button
                    type="button"
                    className="rounded-full hover:text-destructive hover:cursor-pointer transition-colors"
                    disabled={removeRole.isPending}
                    onClick={() => {
                      if (!canManage) return
                      removeRole.mutate({
                        stepId: step.id,
                        roleId: sr.role_id,
                      })
                    }}
                    aria-label={`Remove ${sr.role_name ?? sr.role_id}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </HuemulField>
      ) : (
        step.step_roles.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {step.step_roles.map((sr) => (
              <Badge key={sr.role_id} variant="secondary">
                <span className="text-xs">{sr.role_name ?? sr.role_id}</span>
              </Badge>
            ))}
          </div>
        )
      ))}
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
  onEditingChange,
  organizationId,
}: StepContentProps) {
  // Edit-style steps manage their own internal scroll area (header fixed, cards scroll)
  if (stepType === "edit" || stepType === "review" || stepType === "approve") {
    return (
      <EditStepContent
        documentTypeId={documentTypeId}
        stepType={stepType}
        onEditingChange={onEditingChange}
        organizationId={organizationId}
      />
    )
  }

  // Other step types don't have their own scroll container — wrap them so they scroll
  // within the fixed-height sheet body instead of relying on the sheet itself to scroll.
  return (
    <ScrollArea className="h-full">
      {stepType === "create" || stepType === "view" || stepType === "publish" || stepType === "archive" || stepType === "read" ? (
        <CreateStepContent
          documentTypeId={documentTypeId}
          stepType={stepType}
          hasSla={stepType === "publish" || stepType === "archive"}
          hasValidity={stepType === "create"}
          noOwner={stepType === "create"}
          useAllOrCustomOwner={stepType === "publish" || stepType === "archive" || stepType === "read" || stepType === "view"}
          onEditingChange={onEditingChange}
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
  /** Informa al contenedor si el step activo tiene cambios sin guardar. */
  onEditingChange: (editing: boolean) => void
  /** Envuelve las acciones que descartarían cambios sin guardar. */
  guardedAction: (action: () => void) => void
}

/**
 * Matriz de permisos por rol + panel lateral de configuración. Se monta como
 * tab dentro del sheet de configuración (`AssetTypeConfigSheet`) y también
 * dentro del `AssetTypeLifecycleDialog` que usan las páginas de relaciones.
 *
 * La matriz (`AssetTypeLifecycleMatrix`) lista roles × columnas (un
 * `LifecycleStep` por columna); el engranaje de cada columna pide abrir el
 * panel lateral (`LifecycleStepPanel`), que reutiliza el router `StepContent`
 * para el detalle (SLA, modo, reglas de acceso, grupos).
 */
export function AssetTypeLifecyclePanel({
  documentTypeId,
  organizationId,
  enabled = true,
  onEditingChange,
  guardedAction,
}: AssetTypeLifecyclePanelProps) {
  const { data } = useAllLifecycleSteps(documentTypeId, enabled)
  const allSteps = data?.data?.steps ?? []

  const [activeStepId, setActiveStepId] = useState<string | null>(null)
  const activeStep = allSteps.find((s) => s.id === activeStepId) ?? null

  // Reset edit mode cada vez que cambia el step mostrado en el panel lateral —
  // mismo contrato que antes: cada step activo administra su propio "sin guardar".
  useEffect(() => {
    onEditingChange(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStepId])

  const handleConfigureStep = (stepId: string) => {
    guardedAction(() => setActiveStepId(stepId))
  }

  const handleClosePanel = () => {
    guardedAction(() => setActiveStepId(null))
  }

  return (
    <HuemulPageLayout
      columns={[
        {
          content: (
            <AssetTypeLifecycleMatrix
              documentTypeId={documentTypeId}
              enabled={enabled}
              activeStepId={activeStepId}
              onConfigureStep={handleConfigureStep}
            />
          ),
        },
        {
          content: activeStep ? (
            <LifecycleStepPanel
              key={activeStep.id}
              documentTypeId={documentTypeId}
              step={activeStep}
              onClose={handleClosePanel}
              onEditingChange={onEditingChange}
              organizationId={organizationId}
            />
          ) : null,
          defaultSize: 34,
          minSize: 26,
          show: activeStep != null,
        },
      ]}
    />
  )
}

export default function AssetTypeLifecycleDialog({
  assetType,
  open,
  onOpenChange,
  organizationId,
}: AssetTypeLifecycleDialogProps) {
  const { t } = useTranslation("asset-types")

  const [activeStepIsEditing, setActiveStepIsEditing] = useState(false)

  // Unsaved-changes guard
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false)
  const pendingActionRef = useRef<(() => void) | null>(null)

  const guardedAction = useCallback(
    (action: () => void) => {
      if (activeStepIsEditing) {
        pendingActionRef.current = action
        setShowUnsavedAlert(true)
      } else {
        action()
      }
    },
    [activeStepIsEditing]
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
      setActiveStepIsEditing(false)
    }
  }, [open])

  return (
    <>
      <HuemulAlertDialog
        open={showUnsavedAlert}
        onOpenChange={setShowUnsavedAlert}
        title={t("lifecycle.unsavedChanges.title")}
        description={t("lifecycle.unsavedChanges.description")}
        actionLabel={t("lifecycle.unsavedChanges.discard")}
        cancelLabel={t("lifecycle.unsavedChanges.keepEditing")}
        actionVariant="destructive"
        onAction={async () => {
          pendingActionRef.current?.()
          pendingActionRef.current = null
          setActiveStepIsEditing(false)
        }}
      />
    <HuemulSheet
      open={open}
      onOpenChange={handleGuardedOpenChange}
      title={t("lifecycle.title")}
      description={t("lifecycle.description", {
        name: assetType?.document_type_name ?? "",
      })}
      icon={Activity}
      showFooter={false}
      size="wide"
      bodyClassName="flex flex-col overflow-hidden py-0"
    >
      {assetType && (
        <AssetTypeLifecyclePanel
          key={assetType.document_type_id}
          documentTypeId={assetType.document_type_id}
          organizationId={organizationId}
          enabled={open}
          onEditingChange={setActiveStepIsEditing}
          guardedAction={guardedAction}
        />
      )}
    </HuemulSheet>
    </>
  )
}
