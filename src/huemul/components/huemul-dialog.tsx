import * as React from "react";
import { type LucideIcon, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

// ── Types ──────────────────────────────────────────────────────────────────

export interface HuemulDialogFooterAction {
  /** Button label */
  label: string;
  /** Click handler — can be async; the button will show a loader until it resolves */
  onClick?: () => void | Promise<void>;
  /** Button variant (defaults to "default") */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  /** Disable the button */
  disabled?: boolean;
  /** Show a loading spinner / disable while loading (external control) */
  loading?: boolean;
  /** Optional icon to render inside the button */
  icon?: LucideIcon;
  /** Auto-close the dialog after a successful async click (default: true for saveAction, false for extraActions) */
  closeOnSuccess?: boolean;
}

export interface HuemulDialogProps {
  /** Controlled open state */
  open: boolean;
  /** Called when the dialog requests to open or close */
  onOpenChange: (open: boolean) => void;

  // ── Header ──────────────────────────────────────────────────────────────
  /** Dialog title (required) */
  title: string;
  /** Optional description below the title */
  description?: string;
  /** Optional icon rendered to the left of the title */
  icon?: LucideIcon;
  /** Icon className overrides (e.g. size, color) */
  iconClassName?: string;

  // ── Close button ────────────────────────────────────────────────────────
  /** Show the X close button in the top-right corner (default: true) */
  showCloseButton?: boolean;

  // ── Loading ─────────────────────────────────────────────────────────────
  /** Show a skeleton loader in the body while content is loading (default: false) */
  bodyLoading?: boolean;

  // ── Footer ──────────────────────────────────────────────────────────────
  /** Show the sticky footer (default: true) */
  showFooter?: boolean;
  /** Show a Cancel button in the footer (default: true when footer visible) */
  showCancelButton?: boolean;
  /** Label for the cancel button (default: "Cancel") */
  cancelLabel?: string;
  /** Primary save / confirm action */
  saveAction?: HuemulDialogFooterAction;
  /** Extra action buttons rendered between cancel and save */
  extraActions?: HuemulDialogFooterAction[];

  /** Delay in ms before auto-closing the dialog after a successful async action (default: 500) */
  closeDelay?: number;

  // ── Layout ──────────────────────────────────────────────────────────────
  /** Max-width class (default: "sm:max-w-lg") */
  maxWidth?: string;
  /** Max-height class (default: "max-h-[85vh]") */
  maxHeight?: string;
  /** Additional className on DialogContent */
  className?: string;
  /** Body content */
  children: React.ReactNode;
}

// ── Component ──────────────────────────────────────────────────────────────

export function HuemulDialog({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon,
  iconClassName,
  showCloseButton = true,
  bodyLoading = false,
  showFooter = true,
  showCancelButton = true,
  cancelLabel = "Cancel",
  saveAction,
  extraActions,
  closeDelay = 500,
  maxWidth = "sm:max-w-lg",
  maxHeight = "max-h-[85vh]",
  className,
  children,
}: HuemulDialogProps) {
  // Shared helpers so every path goes through Radix's onOpenChange
  const closeDialog = React.useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Internal loading state for save and extra action buttons
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [extraLoading, setExtraLoading] = React.useState<Record<number, boolean>>({});

  const handleActionClick = React.useCallback(
    async (
      action: HuemulDialogFooterAction,
      setLoading: (v: boolean) => void,
      autoClose: boolean,
    ) => {
      if (!action.onClick) return;
      const result = action.onClick();
      if (result instanceof Promise) {
        setLoading(true);
        try {
          await result;
          const shouldClose = action.closeOnSuccess ?? autoClose;
          if (shouldClose) {
            setTimeout(() => {
              setLoading(false);
              closeDialog();
            }, closeDelay);
          } else {
            setLoading(false);
          }
        } catch {
          setLoading(false);
        }
      } else {
        const shouldClose = action.closeOnSuccess ?? autoClose;
        if (shouldClose) {
          closeDialog();
        }
      }
    },
    [closeDialog, closeDelay],
  );

  // Reset loading states when dialog closes
  React.useEffect(() => {
    if (!open) {
      setSaveLoading(false);
      setExtraLoading({});
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={showCloseButton}
        {...(!description && { "aria-describedby": undefined })}
        className={cn(
          "flex flex-col gap-0 p-0 overflow-hidden",
          maxWidth,
          maxHeight,
          className,
        )}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-2">
            {Icon && (
              <Icon
                className={cn("size-5 shrink-0 text-blue-600", iconClassName)}
              />
            )}
            <DialogTitle>{title}</DialogTitle>
          </div>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {/* ── Body ───────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
          {bodyLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            children
          )}
        </div>

        {/* ── Footer (sticky) ────────────────────────────────────────── */}
        {showFooter && (
          <div className="sticky bottom-0 border-t bg-background px-6 py-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {showCancelButton && (
              <DialogClose asChild>
                <Button
                  variant="outline"
                  className="hover:cursor-pointer"
                  onClick={closeDialog}
                >
                  {cancelLabel}
                </Button>
              </DialogClose>
            )}

            {extraActions?.map((action, index) => {
              const ActionIcon = action.icon;
              const isLoading = action.loading || extraLoading[index];
              return (
                <Button
                  key={action.label}
                  variant={action.variant ?? "secondary"}
                  disabled={action.disabled || isLoading}
                  className="hover:cursor-pointer"
                  onClick={() =>
                    handleActionClick(
                      action,
                      (v) => setExtraLoading((prev) => ({ ...prev, [index]: v })),
                      false,
                    )
                  }
                >
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    ActionIcon && <ActionIcon className="size-4" />
                  )}
                  {action.label}
                </Button>
              );
            })}

            {saveAction && (
              <Button
                variant={saveAction.variant ?? "default"}
                disabled={saveAction.disabled || saveAction.loading || saveLoading}
                className="hover:cursor-pointer"
                onClick={() =>
                  handleActionClick(saveAction, setSaveLoading, true)
                }
              >
                {(saveAction.loading || saveLoading) ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  saveAction.icon && <saveAction.icon className="size-4" />
                )}
                {saveAction.label}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
