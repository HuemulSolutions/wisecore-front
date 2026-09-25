import type { LucideIcon } from "lucide-react"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { lifecycleStageTone, toneStyle } from "@/lib/lifecycle-colors"

interface HuemulLifecycleNextStepProps {
  label: string
  value: string
  /** `info` (hue de `stage`) para "Próximo paso"; `warning` (ámbar) para "Devolver a". */
  tone?: "info" | "warning"
  /** Etapa destino, para resolver el hue cuando `tone` es `info`. */
  stage?: string | null
  icon?: LucideIcon
  className?: string
}

/** Bloque destacado de dos líneas ("Próximo paso" / "Devolver a") con el destino de la acción. */
export function HuemulLifecycleNextStep({
  label,
  value,
  tone = "info",
  stage,
  icon: Icon = ArrowRight,
  className,
}: HuemulLifecycleNextStepProps) {
  const toneClasses = tone === "warning" ? toneStyle("amber").soft : lifecycleStageTone(stage).soft
  return (
    <div className={cn("flex items-center gap-2.5 rounded-md px-3 py-2.5", toneClasses, className)}>
      <Icon className="size-4 shrink-0" />
      <div className="flex flex-col min-w-0">
        <span className="text-[11px] font-medium uppercase tracking-wide opacity-80">{label}</span>
        <span className="truncate text-[13px] font-semibold">{value}</span>
      </div>
    </div>
  )
}
