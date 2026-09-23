import type { ButtonHTMLAttributes } from "react"
import { forwardRef } from "react"
import { ChevronRight, Loader2, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"

/** Color de fallback cuando el template no trae `document_type_color`. */
export const DEFAULT_TEMPLATE_COLOR = "#CBD5E1"

/** Punto de color del tipo de documento (chip y fila del diálogo). */
export function TemplateColorDot({ color }: { color: string }) {
  return <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
}

interface TemplateShareButtonProps extends Pick<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  label: string
  onClick: () => void
}

export function TemplateShareButton({ label, onClick, className }: TemplateShareButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex shrink-0 items-center justify-center text-muted-foreground transition-colors hover:cursor-pointer hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      <Share2 className="size-3.75" />
    </button>
  )
}

interface TemplateStartButtonProps extends Pick<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  label: string
  ariaLabel: string
  startingLabel: string
  isStarting: boolean
  onClick: () => void
}

export const TemplateStartButton = forwardRef<HTMLButtonElement, TemplateStartButtonProps>(
  function TemplateStartButton({ label, ariaLabel, startingLabel, isStarting, onClick, className }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        disabled={isStarting}
        onClick={onClick}
        aria-label={ariaLabel}
        className={cn(
          "flex shrink-0 items-center gap-0.5 whitespace-nowrap font-semibold text-accent-foreground transition-colors hover:cursor-pointer hover:bg-accent disabled:cursor-default disabled:opacity-70",
          className,
        )}
      >
        {isStarting ? (
          <>
            <Loader2 className="size-3 animate-spin" />
            {startingLabel}
          </>
        ) : (
          <>
            {label}
            <ChevronRight className="size-3" />
          </>
        )}
      </button>
    )
  },
)
