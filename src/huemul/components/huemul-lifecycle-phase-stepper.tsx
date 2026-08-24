import { Fragment } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LifecyclePhase } from "@/types/lifecycle"

interface HuemulLifecyclePhaseStepperProps {
  phases: LifecyclePhase[]
  className?: string
}

/**
 * Stepper horizontal de fases del ciclo de vida (Creación → Elaboración →
 * Revisión → Aprobación → Aprobado → Publicado, recortado por
 * `getLifecycleMilestones`). Puramente de lectura — no hay fase clickeable.
 */
export function HuemulLifecyclePhaseStepper({ phases, className }: HuemulLifecyclePhaseStepperProps) {
  if (phases.length === 0) return null

  return (
    <div className={cn("flex items-start", className)}>
      {phases.map((phase, index) => {
        const previous = phases[index - 1]
        const segmentDone = !!previous && previous.state === "done"
        return (
          <Fragment key={phase.key}>
            {index > 0 && (
              <div className={cn("mt-2.5 h-px flex-1", segmentDone ? "bg-[#4f46e5]" : "bg-[#e2e8f0]")} />
            )}
            <div className="flex shrink-0 flex-col items-center gap-1 px-1">
              <span
                className={cn(
                  "inline-flex size-5 items-center justify-center rounded-full",
                  phase.state === "upcoming" ? "bg-[#e2e8f0]" : "bg-[#4f46e5]",
                )}
              >
                {phase.state === "done" && <Check className="size-3 text-white" strokeWidth={3} />}
                {phase.state === "current" && <span className="size-1.5 rounded-full bg-white" />}
              </span>
              <span
                className={cn(
                  "text-center text-[11px] font-medium leading-tight whitespace-nowrap",
                  phase.state === "upcoming" ? "text-[#94a3b8]" : "text-[#4f46e5]",
                )}
              >
                {phase.label}
              </span>
            </div>
          </Fragment>
        )
      })}
    </div>
  )
}
