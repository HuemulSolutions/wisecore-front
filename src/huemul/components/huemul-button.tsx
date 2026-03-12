import * as React from "react";
import { type LucideIcon, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type VariantProps } from "class-variance-authority";

// ── Types ──────────────────────────────────────────────────────────────────

export interface HuemulButtonProps
  extends Omit<React.ComponentProps<"button">, "onClick">,
    VariantProps<typeof buttonVariants> {
  /** Button text — omit for icon-only buttons */
  label?: string;
  /** Lucide icon component */
  icon?: LucideIcon;
  /** Icon placement relative to the label (default: "left") */
  iconPosition?: "left" | "right";
  /** Additional className applied to the icon */
  iconClassName?: string;

  // ── Loading ─────────────────────────────────────────────────────────────
  /**
   * Controlled loading state.
   * When true the button shows a spinner and is disabled.
   * If `onClick` returns a Promise, loading is managed automatically.
   */
  loading?: boolean;

  // ── Async click ─────────────────────────────────────────────────────────
  /**
   * Click handler — can return a Promise.
   * While the promise is pending the button shows a spinner automatically.
   */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;

  // ── Tooltip ─────────────────────────────────────────────────────────────
  /** Tooltip text — useful for icon-only buttons */
  tooltip?: string;
  /** Tooltip placement (default: "top") */
  tooltipSide?: "top" | "right" | "bottom" | "left";

  // ── Slot ────────────────────────────────────────────────────────────────
  /** Render as child (Radix Slot) */
  asChild?: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────

export function HuemulButton({
  label,
  icon: Icon,
  iconPosition = "left",
  iconClassName,
  loading: controlledLoading,
  onClick,
  tooltip,
  tooltipSide = "top",
  variant,
  size,
  asChild = false,
  disabled,
  className,
  children,
  ...props
}: HuemulButtonProps) {
  const [asyncLoading, setAsyncLoading] = React.useState(false);
  const isLoading = controlledLoading || asyncLoading;

  const handleClick = React.useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!onClick || isLoading) return;
      const result = onClick(e);
      if (result instanceof Promise) {
        setAsyncLoading(true);
        try {
          await result;
        } finally {
          setAsyncLoading(false);
        }
      }
    },
    [onClick, isLoading],
  );

  // Determine if this is an icon-only button (no label and no children)
  const isIconOnly = !label && !children && !!Icon;

  // Auto-select an icon size if the user chose an icon-* size or the button is icon-only
  const resolvedSize =
    size ??
    (isIconOnly ? "icon" : "default");

  // ── Icon element ────────────────────────────────────────────────────────
  const iconElement = isLoading ? (
    <Loader2 className={cn("animate-spin", iconClassName)} />
  ) : Icon ? (
    <Icon className={cn(iconClassName)} />
  ) : null;

  // ── Button content ──────────────────────────────────────────────────────
  const content = children ?? (
    <>
      {iconPosition === "left" && iconElement}
      {label && <span>{label}</span>}
      {iconPosition === "right" && iconElement}
      {/* Show spinner when loading + icon is on the opposite side or there's no icon */}
      {isLoading && !Icon && !children && !label && (
        <Loader2 className="animate-spin" />
      )}
    </>
  );

  // When loading with no icon and we have a label, put the spinner before the label
  const contentWithLoadingFallback =
    isLoading && !Icon && label ? (
      <>
        {iconPosition === "left" && <Loader2 className="animate-spin" />}
        <span>{label}</span>
        {iconPosition === "right" && <Loader2 className="animate-spin" />}
      </>
    ) : (
      content
    );

  const button = (
    <Button
      variant={variant}
      size={resolvedSize}
      asChild={asChild}
      disabled={disabled || isLoading}
      className={cn("hover:cursor-pointer", className)}
      onClick={handleClick}
      {...props}
    >
      {contentWithLoadingFallback}
    </Button>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side={tooltipSide}>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
