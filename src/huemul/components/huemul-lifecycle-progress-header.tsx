import type { LucideIcon } from "lucide-react"
import { HuemulLifecyclePhaseStepper } from "@/huemul/components/huemul-lifecycle-phase-stepper"
import { HuemulLifecycleStepProgress } from "@/huemul/components/huemul-lifecycle-step-progress"
import { HuemulLifecycleNextStep } from "@/huemul/components/huemul-lifecycle-next-step"
import { cn } from "@/lib/utils"
import type { LifecycleProgress } from "@/types/lifecycle"

interface HuemulLifecycleProgressHeaderProps {
  progress: LifecycleProgress
  /** Panel "N de M" de la fase actual — completar/aprobar sí, publicar/archivar/devolver no. */
  showStepProgress?: boolean
  /** Bloque destacado ("Próximo paso" / "Devolver a"). Omitir para no mostrarlo. */
  next?: { label: string; value: string; tone?: "info" | "warning"; stage?: string | null; icon?: LucideIcon } | null
  className?: string
}

/**
 * Compone el stepper de fases + panel de progreso + bloque destacado para las
 * 4 sheets de ciclo de vida que los muestran. Punto único de degradación:
 * si `progress.isAvailable` es `false` (sin permiso para leer los steps del
 * tipo de activo, o sin datos), no renderiza nada — el sheet sigue
 * funcionando con solo header + comentario + acción.
 */
export function HuemulLifecycleProgressHeader({
  progress,
  showStepProgress = false,
  next,
  className,
}: HuemulLifecycleProgressHeaderProps) {
  if (!progress.isAvailable) return null

  return (
    <div className={cn("space-y-3", className)}>
      <HuemulLifecyclePhaseStepper phases={progress.phases} />
      {showStepProgress && progress.currentPhase && (
        <HuemulLifecycleStepProgress currentPhase={progress.currentPhase} />
      )}
      {next && (
        <HuemulLifecycleNextStep
          label={next.label}
          value={next.value}
          tone={next.tone}
          stage={next.stage}
          icon={next.icon}
        />
      )}
    </div>
  )
}
