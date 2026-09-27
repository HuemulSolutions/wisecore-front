import { useState, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { Undo2 } from "lucide-react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulField } from "@/huemul/components/huemul-field"
import { HuemulLifecyclePhaseStepper } from "@/huemul/components/huemul-lifecycle-phase-stepper"
import type { RollbackTargetsResponse } from "@/services/executions"
import type { LifecycleProgress } from "@/types/lifecycle"
import type { LifecycleRollbackDialogProps } from '@/types/lifecycle'
export type { LifecycleRollbackDialogProps } from '@/types/lifecycle'

interface LifecycleRollbackSheetProps extends LifecycleRollbackDialogProps {
  /** Stepper de fases — mismo `controller.progress` que las otras sheets. */
  progress: LifecycleProgress
}

export function LifecycleRollbackSheet({
  open,
  onOpenChange,
  executionId,
  organizationId,
  onConfirm,
  isProcessing = false,
  progress,
}: LifecycleRollbackSheetProps) {
  const { t } = useTranslation("assets")
  const [selectedTarget, setSelectedTarget] = useState<string>("")
  const [comment, setComment] = useState("")

  // Misma query key que `useLifecycleProgress` — comparten el fetch.
  const { data: rollbackTargets, isLoading: isLoadingTargets } = useQuery<RollbackTargetsResponse>({
    queryKey: ["rollback-targets", executionId, organizationId],
    queryFn: async () => {
      const { getRollbackTargets } = await import("@/services/executions")
      return getRollbackTargets(executionId!, organizationId)
    },
    enabled: open && !!executionId && !!organizationId,
    staleTime: 0,
  })

  // Reset state when the sheet closes
  useEffect(() => {
    if (!open) {
      setSelectedTarget("")
      setComment("")
    }
  }, [open])

  // Pre-select first available option once data loads
  useEffect(() => {
    if (!rollbackTargets || selectedTarget) return
    const firstStep = [...rollbackTargets.steps].sort((a, b) => a.order - b.order)[0]
    if (firstStep) {
      setSelectedTarget(`step:${firstStep.step_id}`)
      return
    }
    const firstState = rollbackTargets.states[0]
    if (firstState) {
      setSelectedTarget(`state:${firstState.value}`)
    }
  }, [rollbackTargets, selectedTarget])

  // Build grouped options: one group per state, steps nested underneath.
  // When states is empty but steps exist, group steps by their lifecycle_state value.
  // Groups whose state matches current_state use a non-selectable label instead of
  // a selectable item so the user cannot roll back to the state they are already in.
  const groupedOptions = useMemo(() => {
    if (!rollbackTargets) return []

    const currentState = rollbackTargets.current_state

    // Collect all unique lifecycle_state values referenced by steps
    const stateValuesFromStates = new Set(rollbackTargets.states.map((s) => s.value))

    // Groups from the explicit states array
    const groups = rollbackTargets.states.map((state) => ({
      groupLabel: t(`lifecycle.stateLabels.${state.value}`, state.display_name),
      groupValue: state.value === currentState ? undefined : `state:${state.value}`,
      options: rollbackTargets.steps
        .filter((step) => step.lifecycle_state === state.value)
        .sort((a, b) => a.order - b.order)
        .map((step) => ({
          label: step.name,
          value: `step:${step.step_id}`,
        })),
    }))

    // Steps whose lifecycle_state is not in the states array (e.g. current state steps)
    const orphanStateKeys = [
      ...new Set(
        rollbackTargets.steps
          .filter((s) => !stateValuesFromStates.has(s.lifecycle_state))
          .map((s) => s.lifecycle_state),
      ),
    ]
    for (const stateKey of orphanStateKeys) {
      groups.push({
        groupLabel: t(`lifecycle.stateLabels.${stateKey}`, stateKey),
        groupValue: stateKey === currentState ? undefined : `state:${stateKey}`,
        options: rollbackTargets.steps
          .filter((step) => step.lifecycle_state === stateKey)
          .sort((a, b) => a.order - b.order)
          .map((step) => ({
            label: step.name,
            value: `step:${step.step_id}`,
          })),
      })
    }

    return groups
  }, [rollbackTargets])

  function handleConfirm() {
    const options: { comment: string; target_state?: string; target_step_id?: string } = {
      comment,
    }
    if (selectedTarget.startsWith("step:")) {
      options.target_step_id = selectedTarget.slice(5)
    } else if (selectedTarget.startsWith("state:")) {
      options.target_state = selectedTarget.slice(6)
    }
    onConfirm(options)
  }

  const hasOptions = groupedOptions.length > 0

  return (
    <HuemulSheet
      open={open}
      onOpenChange={(o) => !isProcessing && onOpenChange(o)}
      title={t("lifecycle.returnTitle")}
      icon={Undo2}
      iconVariant="tile"
      maxWidth="sm:max-w-xl"
      bodyLoading={isLoadingTargets}
      saveAction={{
        label: t("lifecycle.returnConfirm"),
        onClick: handleConfirm,
        variant: "destructive",
        loading: isProcessing,
        disabled: !selectedTarget || !hasOptions,
      }}
    >
      <div className="space-y-4">
        {progress.isAvailable && <HuemulLifecyclePhaseStepper phases={progress.phases} />}
        {!isLoadingTargets && !hasOptions ? (
          <p className="text-sm text-muted-foreground">{t("lifecycle.noRollbackTargets")}</p>
        ) : (
          <>
            <HuemulField
              type="select"
              label={t("lifecycle.rollbackTargetLabel")}
              value={selectedTarget}
              onChange={(v) => setSelectedTarget(String(v))}
              groupedOptions={groupedOptions}
              disabled={isProcessing || isLoadingTargets}
              placeholder="—"
            />
            <HuemulField
              type="textarea"
              label={t("lifecycle.commentLabel")}
              value={comment}
              onChange={(v) => setComment(String(v))}
              placeholder={t("lifecycle.commentPlaceholder")}
              disabled={isProcessing}
              rows={3}
            />
          </>
        )}
      </div>
    </HuemulSheet>
  )
}
