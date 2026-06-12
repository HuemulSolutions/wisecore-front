import * as React from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { lifecycleAllows } from "@/hooks/useDocumentAccess";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import type { HuemulButtonProps } from "@/types/huemul";
export type { HuemulButtonProps } from "@/types/huemul";

export const HuemulButton = React.forwardRef<HTMLButtonElement, HuemulButtonProps>(
  function HuemulButton(
    {
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
      requiredAccess,
      requireAll = false,
      checkGlobalPermissions = false,
      resource,
      lifecyclePermissions,
      ...props
    }: HuemulButtonProps,
    ref: React.Ref<HTMLButtonElement>,
  ) {
    const { canCreate, canRead, canUpdate, canDelete, isRootAdmin } = useUserPermissions();
    const [asyncLoading, setAsyncLoading] = React.useState(false);

    // ── Permission guard ─────────────────────────────────────────────────
    let isAllowed = true;
    if (requiredAccess !== undefined) {
      const accessArray = Array.isArray(requiredAccess) ? requiredAccess : [requiredAccess];

      // Lifecycle permissions check (when provided)
      if (lifecyclePermissions) {
        const lifecycleChecks = accessArray.map(access => lifecycleAllows(lifecyclePermissions, access));
        const hasLifecyclePermission = requireAll
          ? lifecycleChecks.every(Boolean)
          : lifecycleChecks.some(Boolean);
        if (!hasLifecyclePermission) isAllowed = false;
      }

      // Global permissions check (when requested)
      if (isAllowed && checkGlobalPermissions && resource && !isRootAdmin) {
        const globalChecks = accessArray.map((access) => {
          switch (access) {
            case "create": return canCreate(resource);
            case "read":   return canRead(resource);
            case "edit":   return canUpdate(resource);
            case "delete": return canDelete(resource);
            case "approve": return canUpdate(resource);
            default:       return true;
          }
        });
        const hasGlobalPermission = requireAll
          ? globalChecks.every(Boolean)
          : globalChecks.some(Boolean);
        if (!hasGlobalPermission) isAllowed = false;
      }
    }

    const isLoading = controlledLoading || asyncLoading;

    const handleClick = React.useCallback(
      async (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!onClick || isLoading) return;
        const result: unknown = onClick(e);
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

    if (!isAllowed) return null;

    // Determine if this is an icon-only button (no label and no children)
    const isIconOnly = !label && !children && !!Icon;

    // Auto-select an icon size if the user chose an icon-* size or the button is icon-only
    const resolvedSize =
      size ??
      (isIconOnly ? "icon" : "default");

    // ── Icon element ──────────────────────────────────────────────────────
    const iconElement = isLoading ? (
      <Loader2 className={cn("animate-spin", iconClassName)} />
    ) : Icon ? (
      <Icon className={cn(iconClassName)} />
    ) : null;

    // ── Button content ────────────────────────────────────────────────────
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
        ref={ref}
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
  },
);
