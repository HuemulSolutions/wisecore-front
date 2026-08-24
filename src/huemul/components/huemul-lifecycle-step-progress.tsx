import { useTranslation } from "react-i18next"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LifecycleCurrentPhaseProgress, LifecycleStepProgressState } from "@/types/lifecycle"

interface HuemulLifecycleStepProgressProps {
  currentPhase: LifecycleCurrentPhaseProgress
  className?: string
}

/** Caption del panel según el `type` de step de la fase actual (edit/review/approve). */
function captionKeyFor(stage: string): "groupsIn" | "sectionsIn" | "approvers" {
  if (stage === "review") return "sectionsIn"
  if (stage === "approve") return "approvers"
  return "groupsIn"
}

function StepDot({ state }: { state: LifecycleStepProgressState }) {
  if (state === "done") {
    return (
      <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-[#4f46e5]">
        <Check className="size-2.5 text-white" strokeWidth={3} />
      </span>
    )
  }
  if (state === "current") {
    return (
      <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full border-2 border-[#4f46e5]">
        <span className="size-1.5 rounded-full bg-[#4f46e5]" />
      </span>
    )
  }
  return <span className="inline-block size-4 shrink-0 rounded-full border-2 border-[#e2e8f0]" />
}

/**
 * Panel "GRUPOS EN ELABORACIÓN — N DE M" (o "SECCIONES EN REVISIÓN" /
 * "APROBADORES" según el tipo de step) con la lista de solo lectura de la
 * fase actual. No hay selección: los círculos son de estado, no radios.
 */
export function HuemulLifecycleStepProgress({ currentPhase, className }: HuemulLifecycleStepProgressProps) {
  const { t } = useTranslation("assets")
  const captionKey = captionKeyFor(currentPhase.stage)
  const caption =
    captionKey === "approvers"
      ? t("lifecycle.progress.approvers")
      : t(`lifecycle.progress.${captionKey}`, { stage: currentPhase.label })

  return (
    <div className={cn("rounded-lg border border-[#e5eaf0] bg-[#f7f9fb] p-3", className)}>
      <div className="mb-2 flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
        <span>{caption}</span>
        <span className="shrink-0">
          {t("lifecycle.progress.counter", { completed: currentPhase.completed, total: currentPhase.total })}
        </span>
      </div>
      <ul className="space-y-1.5">
        {currentPhase.steps.map((step) => (
          <li key={step.id} className="flex items-center gap-2 text-[13px]">
            <StepDot state={step.state} />
            <span
              className={cn(
                step.state === "current" && "font-semibold text-[#0f172a]",
                step.state === "done" && "text-[#334155]",
                step.state === "upcoming" && "text-[#94a3b8]",
              )}
            >
              {step.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
