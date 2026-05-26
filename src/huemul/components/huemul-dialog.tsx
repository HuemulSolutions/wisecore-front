import * as React from "react";
import { Loader2 } from "lucide-react";

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
import type { HuemulDialogFooterAction, HuemulDialogProps } from "@/types/huemul";
export type { HuemulDialogFooterAction, HuemulDialogProps } from "@/types/huemul";

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

  // Submit on Enter key (skip textareas and contenteditable elements like the Plate rich text editor)
  React.useEffect(() => {
    if (!open || !saveAction) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.shiftKey) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA") return;
      if (target.isContentEditable) return;
      if (saveAction.disabled || saveAction.loading || saveLoading) return;
      e.preventDefault();
      handleActionClick(saveAction, setSaveLoading, true);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, saveAction, saveLoading, handleActionClick]);

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
                  className={cn("hover:cursor-pointer", action.className)}
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
                className={cn("hover:cursor-pointer", saveAction.className)}
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
