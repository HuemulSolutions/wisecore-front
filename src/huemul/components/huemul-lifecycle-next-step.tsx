import type { LucideIcon } from "lucide-react"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface HuemulLifecycleNextStepProps {
  label: string
  value: string
  /** `info` (índigo) para "Próximo paso"; `warning` (ámbar) para "Devolver a". */
  tone?: "info" | "warning"
  icon?: LucideIcon
  className?: string
}

const TONE_CLASSES: Record<"info" | "warning", string> = {
  info: "bg-[#eef2ff] text-[#4f46e5]",
  warning: "bg-amber-50 text-amber-700",
}

/** Bloque destacado de dos líneas ("Próximo paso" / "Devolver a") con el destino de la acción. */
export function HuemulLifecycleNextStep({
  label,
  value,
  tone = "info",
  icon: Icon = ArrowRight,
  className,
}: HuemulLifecycleNextStepProps) {
  return (
    <div className={cn("flex items-center gap-2.5 rounded-md px-3 py-2.5", TONE_CLASSES[tone], className)}>
      <Icon className="size-4 shrink-0" />
      <div className="flex flex-col min-w-0">
        <span className="text-[11px] font-medium uppercase tracking-wide opacity-80">{label}</span>
        <span className="truncate text-[13px] font-semibold">{value}</span>
      </div>
    </div>
  )
}
