import type { ButtonHTMLAttributes } from "react"
import { ChevronRight, Loader2, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"

/** Color de fallback cuando el template no trae `document_type_color`. */
export const DEFAULT_TEMPLATE_COLOR = "#CBD5E1"

interface TemplateCardShellProps {
  color: string
  className?: string
  children: React.ReactNode
}

/** Marco común de tarjeta-template: borde + barra de color a la izquierda. */
export function TemplateCardShell({ color, className, children }: TemplateCardShellProps) {
  return (
    <div
      className={cn(
        "relative flex overflow-hidden rounded-[11px] border border-border bg-card pl-3.5 shadow-[0_1px_1px_rgba(15,23,42,0.03)] transition-shadow hover:shadow-[0_2px_6px_rgba(15,23,42,0.06)]",
        className,
      )}
    >
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: color }} />
      {children}
    </div>
  )
}

interface TemplateShareButtonProps extends Pick<ButtonHTMLAttributes<HTMLButtonElement>, "tabIndex" | "onFocus"> {
  label: string
  onClick: () => void
}

export function TemplateShareButton({ label, onClick, tabIndex, onFocus }: TemplateShareButtonProps) {
  return (
    <button
      type="button"
      tabIndex={tabIndex}
      onFocus={onFocus}
      onClick={onClick}
      aria-label={label}
      className="flex size-5.5 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:cursor-pointer hover:bg-muted"
    >
      <Share2 className="size-3" />
    </button>
  )
}

interface TemplateStartButtonProps extends Pick<ButtonHTMLAttributes<HTMLButtonElement>, "tabIndex" | "onFocus"> {
  label: string
  ariaLabel: string
  isStarting: boolean
  onClick: () => void
  buttonRef?: (el: HTMLButtonElement | null) => void
}

export function TemplateStartButton({
  label,
  ariaLabel,
  isStarting,
  onClick,
  buttonRef,
  tabIndex,
  onFocus,
}: TemplateStartButtonProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      tabIndex={tabIndex}
      onFocus={onFocus}
      disabled={isStarting}
      onClick={onClick}
      aria-label={ariaLabel}
      className="flex h-7 shrink-0 items-center gap-0.5 rounded-lg px-2 text-[12.5px] font-semibold text-accent-foreground transition-colors hover:cursor-pointer hover:bg-accent disabled:cursor-default disabled:opacity-70"
    >
      {isStarting ? (
        <Loader2 className="size-3 animate-spin" />
      ) : (
        <>
          {label}
          <ChevronRight className="size-3" />
        </>
      )}
    </button>
  )
}
