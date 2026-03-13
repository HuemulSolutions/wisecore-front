import { useState, useEffect, useRef, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Activity, X } from "lucide-react"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulField } from "@/huemul/components/huemul-field"
import { type AssetTypeWithRoles } from "@/services/asset-types"
import {
  useLifecycleStepTypes,
  useLifecycleSteps,
  useLifecycleMutations,
} from "@/hooks/useLifecycle"
import { useRoles } from "@/hooks/useRbac"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CreateStepContent } from "./assets-types-lifecycle-create-step"
import { EditStepContent } from "./assets-types-lifecycle-edit-step"

// Steps that show a Save button in the footer when in edit mode
const STEPS_WITH_FOOTER = new Set(["create", "publish", "archive", "view"])

// Handles all step types that are not "create" or "edit" (review, approve, etc.)

interface DefaultStepContentProps {
  documentTypeId: string
  stepType: string
  stepLabel: string
}

function DefaultStepContent({
  documentTypeId,
  stepType,
  stepLabel,
}: DefaultStepContentProps) {
  const { t } = useTranslation("asset-types")
  const { data, isLoading } = useLifecycleSteps(documentTypeId, stepType, true)
  const { data: rolesData } = useRoles(true, 1, 1000)
  const { updateStep, addRole, removeRole } = useLifecycleMutations(
    documentTypeId,
    stepType
  )

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
          label={t("lifecycle.allowAnyoneLabel")}
          name="access-all"
          value={isAll}
          onChange={(v) =>
            updateStep.mutate({
              stepId: step.id,
              data: { access_type: v ? "all" : "owner" },
            })
          }
          disabled={isCustom || isMutating}
          description={
            isAll
              ? t("lifecycle.allowAnyoneDescOn")
              : t("lifecycle.allowAnyoneDescOff")
          }
        />

        <div className="h-px bg-border" />

        {/* Switch: custom role configuration */}
        <HuemulField
          type="switch"
          label={t("lifecycle.customRolesLabel")}
          name="access-custom"
          value={isCustom}
          onChange={(v) =>
            updateStep.mutate({
              stepId: step.id,
              data: { access_type: v ? "custom" : "owner" },
            })
          }
          disabled={isMutating}
          description={t("lifecycle.customRolesDesc")}
        />
      </div>

      {/* Custom roles section */}
      {isCustom && (
        <HuemulField
          type="combobox"
          label={t("lifecycle.addRole")}
          name="add-role"
          placeholder={t("lifecycle.addRolePlaceholder")}
          value=""
          options={availableRoles.map((r) => ({ value: r.id, label: r.name }))}
          onChange={(roleId) => {
            if (!roleId) return
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
                    onClick={() =>
                      removeRole.mutate({
                        stepId: step.id,
                        roleId: sr.role_id,
                      })
                    }
                    aria-label={`Remove ${sr.role_name ?? sr.role_id}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </HuemulField>
      )}
    </div>
  )
}

// Routes to the appropriate sub-component based on stepType.

interface StepContentProps {
  documentTypeId: string
  stepType: string
  stepLabel: string
  onRegisterSave?: (fn: (() => Promise<void>) | null, isPending: boolean) => void
  onEditingChange?: (isEditing: boolean) => void
}

function StepContent({
  documentTypeId,
  stepType,
  stepLabel,
  onRegisterSave,
  onEditingChange,
}: StepContentProps) {
  if (stepType === "create" || stepType === "view" || stepType === "publish" || stepType === "archive") {
    return (
      <CreateStepContent
        documentTypeId={documentTypeId}
        stepType={stepType}
        hasSla={stepType === "publish" || stepType === "archive"}
        onRegisterSave={onRegisterSave}
        onEditingChange={onEditingChange}
      />
    )
  }
  if (stepType === "edit" || stepType === "review" || stepType === "approve") {
    return <EditStepContent documentTypeId={documentTypeId} stepType={stepType} />
  }
  return (
    <DefaultStepContent
      documentTypeId={documentTypeId}
      stepType={stepType}
      stepLabel={stepLabel}
    />
  )
}

// â”€â”€â”€ AssetTypeLifecycleDialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface AssetTypeLifecycleDialogProps {
  assetType: AssetTypeWithRoles | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AssetTypeLifecycleDialog({
  assetType,
  open,
  onOpenChange,
}: AssetTypeLifecycleDialogProps) {
  const { t } = useTranslation("asset-types")
  const { data, isLoading: loadingStepTypes } = useLifecycleStepTypes(open)
  const stepTypes = data?.data ?? []

  const [activeStep, setActiveStep] = useState<string | null>(null)
  const [activeStepIsEditing, setActiveStepIsEditing] = useState(false)

  // Save fn + pending state lifted to dialog footer (shared across all editable steps) â€” lifted to dialog footer
  const activeStepSaveFnRef = useRef<(() => Promise<void>) | null>(null)
  const [activeStepSavePending, setActiveStepSavePending] = useState(false)

  const handleRegisterSave = useCallback(
    (fn: (() => Promise<void>) | null, isPending: boolean) => {
      activeStepSaveFnRef.current = fn
      setActiveStepSavePending(isPending)
    },
    []
  )

  // Select first step type once loaded
  useEffect(() => {
    if (stepTypes.length > 0 && !activeStep) {
      setActiveStep(stepTypes[0].value)
    }
  }, [stepTypes, activeStep])

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setActiveStep(null)
      setActiveStepIsEditing(false)
    }
  }, [open])

  // Reset edit mode when switching step types
  useEffect(() => {
    setActiveStepIsEditing(false)
  }, [activeStep])

  const activeStepLabel =
    stepTypes.find((s) => s.value === activeStep)?.label ?? activeStep ?? ""

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("lifecycle.title")}
      description={t("lifecycle.description", {
        name: assetType?.document_type_name ?? "",
      })}
      icon={Activity}
      showFooter={STEPS_WITH_FOOTER.has(activeStep ?? "") && activeStepIsEditing}
      showCancelButton={false}
      saveAction={
        STEPS_WITH_FOOTER.has(activeStep ?? "") && activeStepIsEditing
          ? {
              label: t("lifecycle.save"),
              onClick: async () => {
                await activeStepSaveFnRef.current?.()
              },
              loading: activeStepSavePending,
              closeOnSuccess: false,
            }
          : undefined
      }
      maxWidth="sm:max-w-5xl"
    >
      <div className="flex flex-col gap-4 py-2">
        {/* Step type badge selector */}
        <div className="pb-2 -mx-6 px-6">
          {loadingStepTypes ? (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-20 rounded-full" />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {stepTypes.map((step) => (
                <Badge
                  key={step.value}
                  variant={activeStep === step.value ? "default" : "outline"}
                  className="cursor-pointer select-none text-sm px-4 py-1.5 transition-colors"
                  onClick={() => setActiveStep(step.value)}
                >
                  {t(`lifecycle.stepTypes.${step.value}`, {
                    defaultValue: step.label,
                  })}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Active step content */}
        {assetType && activeStep && (
          <StepContent
            key={`${assetType.document_type_id}-${activeStep}`}
            documentTypeId={assetType.document_type_id}
            stepType={activeStep}
            stepLabel={activeStepLabel}
            onRegisterSave={handleRegisterSave}
            onEditingChange={setActiveStepIsEditing}
          />
        )}
      </div>
    </HuemulDialog>
  )
}
