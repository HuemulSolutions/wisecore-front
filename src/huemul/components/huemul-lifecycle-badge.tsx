import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { lifecycleStateColor, lifecycleStateDot, lifecycleStateSolidColor } from "@/lib/lifecycle-colors"
import type { ExecutionLifecycleState } from "@/types/execution"

interface HuemulLifecycleBadgeProps {
  state: ExecutionLifecycleState
  className?: string
  /**
   * "soft" (default): badge suave + punto de color, para tablas, listas y paneles de relacionados.
   * "solid": fondo sólido sin punto, solo para el estado del activo abierto (header, selector de versión).
   * "published" siempre se muestra sólido sin importar `variant`: es el estado que se busca de un
   * vistazo y lo que lo separa de "approved", su hue vecino.
   */
  variant?: "soft" | "solid"
}

/** Pill de estado de ciclo de vida de una ejecución, con color por estado y label traducido. */
export function HuemulLifecycleBadge({ state, className, variant = "soft" }: HuemulLifecycleBadgeProps) {
  const { t } = useTranslation("assets")
  const label = t(`lifecycle.stateLabels.${state}`)
  const isSolid = variant === "solid" || state === "published"

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        isSolid ? lifecycleStateSolidColor(state) : lifecycleStateColor(state),
        className,
      )}
      title={label}
      aria-label={label}
    >
      {!isSolid && <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", lifecycleStateDot(state))} aria-hidden="true" />}
      {label}
    </span>
  )
}
