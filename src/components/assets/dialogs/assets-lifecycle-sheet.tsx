import { useState, useEffect, useRef, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { ShieldCheck, X, Save, Pencil, Ban, Loader2 } from "lucide-react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { HuemulField } from "@/huemul/components/huemul-field"
import { HuemulButton } from "@/huemul/components/huemul-button"
import {
  useLifecycleStepTypes,
  useLifecycleSteps,
  useDocumentStepGrants,
  useDocumentGrantMutations,
} from "@/hooks/useLifecycle"
import { useUsers } from "@/hooks/useUsers"
import { useOrganization } from "@/contexts/organization-context"
import { getUsers } from "@/services/users"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { AssetLifecycleSheetProps } from "@/types/assets"
import type { LifecycleStep } from "@/types/lifecycle"
import type { User } from "@/types/users"
import type { FetchOptionsParams, FetchOptionsResult } from "@/types/huemul/field"

// ─── Step grants panel ───────────────────────────────────────────────────────

interface StepGrantsPanelProps {
  organizationId: string
  documentId: string
  step: LifecycleStep
  stepType: string
  /** When true, shows only step.name as title instead of the type label + description */
  isGrouped?: boolean
  users: User[]
  fetchUserOptions: (params: FetchOptionsParams) => Promise<FetchOptionsResult>
  onSaveGrants: (stepId: string, userIds: string[]) => void
  onSaveRevokes: (stepId: string, userIds: string[]) => void
  onPendingChange: (stepId: string, hasPending: boolean) => void
  isGrantPending: boolean
  isRevokePending: boolean
}

function StepGrantsPanel({
  organizationId,
  documentId,
  step,
  stepType,
  isGrouped = false,
  users,
  fetchUserOptions,
  onSaveGrants,
  onSaveRevokes,
  onPendingChange,
  isGrantPending,
  isRevokePending,
}: StepGrantsPanelProps) {
  const { t } = useTranslation("asset-types")
  const stepAction = t(`lifecycle.stepActions.${stepType}`, { defaultValue: stepType })
  const { data: grantsData, isLoading } = useDocumentStepGrants(
    organizationId,
    documentId,
    step.id,
  )

  const [isEditing, setIsEditing] = useState(false)
  const [pendingUserIds, setPendingUserIds] = useState<string[]>([])
  const [pendingRevokeIds, setPendingRevokeIds] = useState<string[]>([])
  // Optimistic: users added but not yet confirmed by the server refetch
  const [optimisticUserIds, setOptimisticUserIds] = useState<string[]>([])

  const isMutating = isGrantPending || isRevokePending

  useEffect(() => {
    onPendingChange(step.id, isEditing)
  }, [isEditing]) // eslint-disable-line react-hooks/exhaustive-deps

  const grants = grantsData?.data?.grants ?? []
  const grantedUserIds = new Set(grants.map((g) => g.user_id))
  const userById = new Map(users.map((u) => [u.id, u]))

  // Clear optimistic IDs once the server data confirms them
  useEffect(() => {
    if (optimisticUserIds.length > 0) {
      const allConfirmed = optimisticUserIds.every((id) => grantedUserIds.has(id))
      if (allConfirmed) setOptimisticUserIds([])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grants])

  // Merged grants for display: real grants + optimistic ones not yet in server data
  const displayGrants = [
    ...grants,
    ...optimisticUserIds
      .filter((id) => !grantedUserIds.has(id))
      .map((id) => ({ id: `opt-${id}`, user_id: id })),
  ]

  const fetchOptions = useCallback(
    async (params: FetchOptionsParams): Promise<FetchOptionsResult> => {
      const result = await fetchUserOptions(params)
      return {
        ...result,
        options: result.options.filter(
          (o) => !grantedUserIds.has(o.value) && !pendingUserIds.includes(o.value),
        ),
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetchUserOptions, grants, pendingUserIds],
  )

  const handleEdit = () => setIsEditing(true)

  const handleCancel = () => {
    setPendingUserIds([])
    setPendingRevokeIds([])
    setIsEditing(false)
  }

  const handleSaveAll = () => {
    if (pendingUserIds.length > 0) {
      setOptimisticUserIds(pendingUserIds)
      onSaveGrants(step.id, pendingUserIds)
      setPendingUserIds([])
    }
    if (pendingRevokeIds.length > 0) {
      onSaveRevokes(step.id, pendingRevokeIds)
      setPendingRevokeIds([])
    }
    setIsEditing(false)
  }

  const handleAddPending = (userId: string) => {
    if (!userId) return
    setPendingUserIds((prev) => [...prev, userId])
  }

  const handleRemovePending = (userId: string) => {
    setPendingUserIds((prev) => prev.filter((id) => id !== userId))
  }

  const handleAddPendingRevoke = (userId: string) => {
    setPendingRevokeIds((prev) => [...prev, userId])
  }

  const handleRemovePendingRevoke = (userId: string) => {
    setPendingRevokeIds((prev) => prev.filter((id) => id !== userId))
  }

  return (
    <div className={isGrouped
      ? "flex flex-col gap-3 rounded-md border border-border bg-background p-4 shadow-sm"
      : "flex flex-col gap-6"
    }>
      {/* Header: title + description + edit/cancel/save buttons */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          {isGrouped ? (
            <p className="text-sm font-medium text-foreground">{step.name}</p>
          ) : (
            <>
              <p className="text-base font-semibold text-foreground">
                {t(`lifecycle.stepTypes.${stepType}`, { defaultValue: step.name ?? stepType })}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("lifecycle.grants.sectionDescription", { action: stepAction })}
              </p>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <HuemulButton
                icon={Ban}
                label={t("common:cancel")}
                variant="ghost"
                onClick={handleCancel}
                disabled={isMutating}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              />
              <HuemulButton
                icon={Save}
                label={t("common:save")}
                variant="default"
                onClick={handleSaveAll}
                loading={isMutating}
                disabled={isMutating}
              />
            </>
          ) : (
            <div className="flex items-center gap-1">
              {isMutating && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              <HuemulButton
                icon={Pencil}
                label={t("common:edit")}
                variant="ghost"
                onClick={handleEdit}
                disabled={isMutating}
                className="text-muted-foreground"
              />
            </div>
          )}
        </div>
      </div>

      {isGrouped && <div className="h-px bg-border" />}

      {/* Content card */}
      <div className={isGrouped
        ? "flex flex-col gap-3"
        : "flex flex-col gap-3 rounded-md border border-border bg-muted/30 p-4"
      }>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-9 w-full" />
            <div className="flex flex-wrap gap-1.5">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        ) : (
          <>
            {/* Grants */}
            {displayGrants.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-muted-foreground font-medium">
                  {t("lifecycle.grants.currentUsersAction", { action: stepAction })}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {displayGrants.map((g) => {
                    const user = userById.get(g.user_id)
                    const label = user ? `${user.name} ${user.last_name}` : g.user_id
                    const isPendingRevoke = pendingRevokeIds.includes(g.user_id)
                    const isOptimistic = g.id.startsWith('opt-')
                    return (
                      <Badge
                        key={g.id}
                        variant={isPendingRevoke ? "destructive" : "secondary"}
                        className={`flex items-center gap-1 pr-1.5 ${isOptimistic ? 'opacity-60' : ''}`}
                      >
                        <span className="text-xs">{label}</span>
                        {isEditing && !isOptimistic && (
                          <button
                            type="button"
                            className="rounded-full hover:text-destructive hover:cursor-pointer transition-colors"
                            disabled={isMutating}
                            onClick={() =>
                              isPendingRevoke
                                ? handleRemovePendingRevoke(g.user_id)
                                : handleAddPendingRevoke(g.user_id)
                            }
                            aria-label={isPendingRevoke ? `Cancel revoke ${label}` : `Mark ${label} for revoke`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            ) : !isEditing ? (
              <p className="text-xs text-muted-foreground">
                {t("lifecycle.grants.noGrants")}
              </p>
            ) : null}

            {/* Edit mode: user picker */}
            {isEditing && (
              <HuemulField
                type="async-combobox"
                label={t("lifecycle.grants.addUser")}
                name={`add-user-${step.id}`}
                placeholder={t("lifecycle.grants.addUserPlaceholder")}
                value=""
                fetchOptions={fetchOptions}
                pageSize={20}
                searchOnEnter
                onChange={(userId) => handleAddPending(userId as string)}
                disabled={isMutating}
              >
                {pendingUserIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {pendingUserIds.map((uid) => {
                      const user = userById.get(uid)
                      const label = user ? `${user.name} ${user.last_name}` : uid
                      return (
                        <Badge
                          key={uid}
                          variant="outline"
                          className="flex items-center gap-1 pr-1.5 border-dashed"
                        >
                          <span className="text-xs">{label}</span>
                          <button
                            type="button"
                            className="rounded-full hover:text-destructive hover:cursor-pointer transition-colors"
                            onClick={() => handleRemovePending(uid)}
                            aria-label={`Remove ${label}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      )
                    })}
                  </div>
                )}
              </HuemulField>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main sheet ──────────────────────────────────────────────────────────────

export default function AssetLifecycleSheet({
  asset,
  open,
  onOpenChange,
}: AssetLifecycleSheetProps) {
  const { t } = useTranslation("asset-types")
  const { selectedOrganizationId } = useOrganization()
  const organizationId = selectedOrganizationId ?? ""

  const { data: stepTypesData, isLoading: loadingStepTypes } =
    useLifecycleStepTypes(open)
  const stepTypes = stepTypesData?.data ?? []

  const [activeStep, setActiveStep] = useState<string | null>(null)

  // Unsaved-changes guard
  const [pendingSteps, setPendingSteps] = useState<Set<string>>(new Set())
  const hasUnsavedChanges = pendingSteps.size > 0
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false)
  const pendingActionRef = useRef<(() => void) | null>(null)

  const guardedAction = useCallback(
    (action: () => void) => {
      if (hasUnsavedChanges) {
        pendingActionRef.current = action
        setShowUnsavedAlert(true)
      } else {
        action()
      }
    },
    [hasUnsavedChanges],
  )

  const handleGuardedOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        guardedAction(() => onOpenChange(false))
      } else {
        onOpenChange(true)
      }
    },
    [guardedAction, onOpenChange],
  )

  const handlePendingChange = useCallback((stepId: string, hasPending: boolean) => {
    setPendingSteps((prev) => {
      const next = new Set(prev)
      if (hasPending) next.add(stepId)
      else next.delete(stepId)
      return next
    })
  }, [])

  // Select first step type once loaded or when sheet opens
  useEffect(() => {
    if (open && stepTypes.length > 0 && !activeStep) {
      setActiveStep(stepTypes[0].value)
    }
  }, [open, stepTypes, activeStep])

  // Reset when sheet closes
  useEffect(() => {
    if (!open) {
      setActiveStep(null)
      setPendingSteps(new Set())
    }
  }, [open])

  // Reset pending state when switching step type
  useEffect(() => {
    setPendingSteps(new Set())
  }, [activeStep])

  const documentTypeId = asset?.document_type_id ?? null

  const { data: stepsData, isLoading: loadingSteps } = useLifecycleSteps(
    documentTypeId,
    activeStep,
    open && !!documentTypeId && !!activeStep,
  )
  const steps = stepsData?.data?.steps ?? []

  const { data: usersData } = useUsers(open && !!organizationId, organizationId, 1, 100)
  const users = usersData?.data ?? []

  const fetchUserOptions = useCallback(
    async ({ search, page, pageSize }: { search: string; page: number; pageSize: number }) => {
      const response = await getUsers(organizationId, page, pageSize, search)
      return {
        options: (response.data ?? []).map((u) => ({
          value: u.id,
          label: `${u.name} ${u.last_name} (${u.email})`,
        })),
        hasMore: response.has_next,
      }
    },
    [organizationId],
  )

  const { grant, revoke } = useDocumentGrantMutations(organizationId, asset?.id ?? "")

  const handleSaveGrants = (stepId: string, userIds: string[]) => {
    grant.mutate({ lifecycle_step_id: stepId, user_ids: userIds })
  }

  const handleSaveRevokes = (stepId: string, userIds: string[]) => {
    revoke.mutate({ lifecycle_step_id: stepId, user_ids: userIds })
  }

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
          setPendingSteps(new Set())
        }}
      />
      <HuemulSheet
        open={open}
        onOpenChange={handleGuardedOpenChange}
        title={t("lifecycle.title")}
        description={t("lifecycle.description", {
          name: asset?.name ?? "",
        })}
        icon={ShieldCheck}
        showFooter={false}
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
                    className="cursor-pointer select-none text-sm px-4 py-1.5 transition-colors hover:cursor-pointer"
                    onClick={() => guardedAction(() => setActiveStep(step.value))}
                  >
                    {t(`lifecycle.stepTypes.${step.value}`, {
                      defaultValue: step.label,
                    })}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Grants per step */}
          {!documentTypeId ? (
            <p className="text-sm text-muted-foreground">
              {t("lifecycle.grants.noDocumentType")}
            </p>
          ) : loadingSteps ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-24 w-full rounded-md" />
            </div>
          ) : steps.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              {t("lifecycle.noConfig")}
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              {steps.length > 1 && (
                <div className="flex flex-col gap-1">
                  <p className="text-base font-semibold text-foreground">
                    {t(`lifecycle.stepTypes.${activeStep!}`, { defaultValue: activeStep! })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("lifecycle.grants.sectionDescription", { action: t(`lifecycle.stepActions.${activeStep!}`, { defaultValue: activeStep! }) })}
                  </p>
                </div>
              )}
              <div className={steps.length > 1 ? "flex flex-col gap-3" : "flex flex-col gap-6"}>
              {steps.map((step) => (
                <StepGrantsPanel
                  key={step.id}
                  organizationId={organizationId}
                  documentId={asset!.id}
                  step={step}
                  stepType={activeStep!}
                  isGrouped={steps.length > 1}
                  users={users}
                  fetchUserOptions={fetchUserOptions}
                  onSaveGrants={handleSaveGrants}
                  onSaveRevokes={handleSaveRevokes}
                  onPendingChange={handlePendingChange}
                  isGrantPending={grant.isPending}
                  isRevokePending={revoke.isPending}
                />
              ))}
              </div>
            </div>
          )}
        </div>
      </HuemulSheet>
    </>
  )
}

