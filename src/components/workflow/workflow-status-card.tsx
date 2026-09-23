"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { HuemulButton } from "@/huemul/components/huemul-button"

export type WorkflowStatusTone = "green" | "blue" | "amber" | "gray" | "red"

export interface WorkflowStatusAction {
  label: string
  tooltip?: string
  icon?: LucideIcon
  loading?: boolean
  disabled?: boolean
  onClick: () => void
}

interface WorkflowStatusCardProps {
  icon: LucideIcon
  tone: WorkflowStatusTone
  title: React.ReactNode
  description?: React.ReactNode
  /** Botón bajo los textos. `style: "retry"` pinta el outline azul de «Reintentar». */
  primaryAction?: (WorkflowStatusAction & { style?: "primary" | "retry" }) | null
  /** Link «Ver las respuestas»: ghost, sin borde ni fondo. */
  linkAction?: WorkflowStatusAction | null
  /** Bloque «¿Algo más?» bajo el separador. `primary` marca el único botón azul. */
  needMore?: { label: string; buttons: (WorkflowStatusAction & { primary?: boolean })[] } | null
  /** Para los bloqueos de página, que ocupan la pantalla entera (`h-full`). */
  className?: string
}

// Fondo del círculo + color del ícono por tono.
const TONE_CLASSES: Record<WorkflowStatusTone, { circle: string; icon: string }> = {
  green: { circle: "bg-[#dcfce7]", icon: "text-[#15803d]" },
  blue: { circle: "bg-[#eff5ff]", icon: "text-[#1d4ed8]" },
  amber: { circle: "bg-[#fef3c7]", icon: "text-[#b45309]" },
  gray: { circle: "bg-[#f1f5f9]", icon: "text-[#64748b]" },
  red: { circle: "bg-[#fee2e2]", icon: "text-[#b91c1c]" },
}

const BUTTON_BASE = "h-[34px] rounded-[7px]"
const PRIMARY_ENABLED = "border-[#2563eb] bg-[#2563eb] px-4 text-[13px] font-semibold text-white hover:bg-[#1d4ed8]"
const PRIMARY_DISABLED =
  "cursor-not-allowed border-[#eef1f6] bg-[#eef1f6] px-4 text-[13px] font-semibold text-[#94a3b8] hover:bg-[#eef1f6]"
const RETRY = "border-[#dfe3ea] bg-white px-4 text-[13px] font-semibold text-[#1d4ed8] hover:bg-[#f8fafc]"
const SECONDARY = "border-[#dfe3ea] bg-white px-[14px] text-[13px] font-medium text-[#334155] hover:bg-[#f8fafc]"
const NEED_MORE_PRIMARY =
  "border-[#2563eb] bg-[#2563eb] px-[14px] text-[13px] font-semibold text-white hover:bg-[#1d4ed8]"

/**
 * Contenedor único de los mensajes de estado del wizard de workflow en fullscreen: tarjeta
 * terminal, «continuar más tarde», paso vacío, bloqueos de página y error de carga. Ícono con
 * tono + título + descripción, una acción principal opcional, el link «Ver las respuestas» y el
 * bloque «¿Algo más?». Sin i18n propio — el contenido lo arma quien lo usa.
 *
 * Colores con hex fijos (sin variantes `dark:`), igual que workflow-panel-header.tsx: el panel de
 * workflow ya se pinta así en todas sus superficies.
 */
export function WorkflowStatusCard({
  icon: Icon,
  tone,
  title,
  description,
  primaryAction,
  linkAction,
  needMore,
  className,
}: WorkflowStatusCardProps) {
  const toneClasses = TONE_CLASSES[tone]
  const primaryStyle = primaryAction?.style ?? "primary"

  return (
    <div
      className={cn(
        "flex min-h-[300px] items-center justify-center bg-[#f8fafc] px-[28px] pb-[40px] pt-[36px]",
        className,
      )}
    >
      <div className="flex w-full flex-col items-center gap-[14px] rounded-[12px] border border-[#e8ecf2] bg-white px-[28px] pb-[24px] pt-[30px] text-center">
        <div className={cn("flex h-[44px] w-[44px] items-center justify-center rounded-full", toneClasses.circle)}>
          <Icon className={cn("h-[22px] w-[22px]", toneClasses.icon)} strokeWidth={2} />
        </div>

        <div className="flex flex-col items-center gap-[6px]">
          <h3 className="text-[17px] font-semibold leading-[1.35] tracking-[-0.01em] text-[#0f172a] [text-wrap:balance]">
            {title}
          </h3>
          {description && (
            <p className="max-w-[390px] text-[13.5px] leading-[1.55] text-[#475569] [text-wrap:pretty]">
              {description}
            </p>
          )}
        </div>

        {primaryAction && (
          <HuemulButton
            size="sm"
            icon={primaryAction.icon}
            iconPosition="left"
            label={primaryAction.label}
            tooltip={primaryAction.tooltip}
            loading={primaryAction.loading}
            disabled={primaryAction.disabled}
            onClick={primaryAction.onClick}
            variant={primaryStyle === "retry" ? "outline" : "default"}
            className={cn(
              BUTTON_BASE,
              "mt-1",
              primaryStyle === "retry" ? RETRY : primaryAction.disabled ? PRIMARY_DISABLED : PRIMARY_ENABLED,
            )}
          />
        )}

        {linkAction && (
          <HuemulButton
            variant="ghost"
            size="sm"
            icon={linkAction.icon}
            iconPosition="left"
            label={linkAction.label}
            tooltip={linkAction.tooltip}
            onClick={linkAction.onClick}
            className="h-[28px] rounded-[7px] px-2 text-[13px] font-medium text-[#1d4ed8] hover:bg-[#f8fafc] hover:text-[#1d4ed8]"
          />
        )}

        {needMore && needMore.buttons.length > 0 && (
          <div className="mt-[6px] flex w-full flex-col items-center gap-[10px] border-t border-[#eef1f6] pt-4">
            <p className="text-[12px] text-[#64748b]">{needMore.label}</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {needMore.buttons.map((button) => (
                <HuemulButton
                  key={button.label}
                  size="sm"
                  variant={button.primary ? "default" : "outline"}
                  icon={button.icon}
                  iconPosition="left"
                  label={button.label}
                  tooltip={button.tooltip}
                  loading={button.loading}
                  disabled={button.disabled}
                  onClick={button.onClick}
                  className={cn(BUTTON_BASE, button.primary ? NEED_MORE_PRIMARY : SECONDARY)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
