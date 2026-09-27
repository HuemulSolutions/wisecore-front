import { useTranslation } from "react-i18next"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { lifecycleStageTone, type StageToneClasses } from "@/lib/lifecycle-colors"
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

function StepDot({ state, tone }: { state: LifecycleStepProgressState; tone: StageToneClasses }) {
  if (state === "done") {
    return (
      <span className={cn("inline-flex size-4 shrink-0 items-center justify-center rounded-full", tone.solid)}>
        <Check className="size-2.5 text-white" strokeWidth={3} />
      </span>
    )
  }
  if (state === "current") {
    return (
      <span
        className={cn("inline-flex size-4 shrink-0 items-center justify-center rounded-full border-2", tone.border)}
      >
        <span className={cn("size-1.5 rounded-full", tone.solid)} />
      </span>
    )
  }
  return <span className="inline-block size-4 shrink-0 rounded-full border-2 border-border" />
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
  const tone = lifecycleStageTone(currentPhase.stage)

  return (
    <div className={cn("rounded-lg border bg-muted/40 p-3", className)}>
      <div className="mb-2 flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span>{caption}</span>
        <span className="shrink-0">
          {t("lifecycle.progress.counter", { completed: currentPhase.completed, total: currentPhase.total })}
        </span>
      </div>
      <ul className="space-y-1.5">
        {currentPhase.steps.map((step) => (
          <li key={step.id} className="flex items-center gap-2 text-[13px]">
            <StepDot state={step.state} tone={tone} />
            <span
              className={cn(
                step.state === "current" && "font-semibold text-foreground",
                step.state === "done" && "text-foreground/75",
                step.state === "upcoming" && "text-muted-foreground",
              )}
            >
              {/* `name` es el nombre configurado del step (dato del backend, se
                  muestra crudo); sin nombre cae al label de la etapa para no
                  dejar la fila vacía. */}
              {step.name ?? currentPhase.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
