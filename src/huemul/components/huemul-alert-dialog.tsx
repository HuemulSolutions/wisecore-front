import * as React from "react";
import { Loader2, AlertTriangle, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ActionState, HuemulAlertDialogProps } from "@/types/huemul";
export type { HuemulAlertDialogProps } from "@/types/huemul";

// ── Component ──────────────────────────────────────────────────────────────

export function HuemulAlertDialog({
  open,
  onOpenChange,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  icon: Icon = AlertTriangle,
  iconClassName,
  actionLabel = "Delete",
  onAction,
  actionVariant = "destructive",
  actionIcon,
  cancelLabel = "Cancel",
  successDelay = 600,
  className,
}: HuemulAlertDialogProps) {
  const [actionState, setActionState] = React.useState<ActionState>("idle");

  // ── Shared helpers — all open/close goes through Radix's onOpenChange ──
  const closeDialog = React.useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setActionState("idle");
    }
  }, [open]);

  const handleAction = React.useCallback(async () => {
    setActionState("loading");
    try {
      await onAction();
      setActionState("success");
      setTimeout(() => {
        setActionState("idle");
        closeDialog();
      }, successDelay);
    } catch {
      setActionState("idle");
    }
  }, [onAction, closeDialog, successDelay]);

  const isProcessing = actionState !== "idle";
  const ActionIcon = actionIcon;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className={cn("sm:max-w-md", className)}
        {...(!description && { "aria-describedby": undefined })}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <Icon
              className={cn("size-5 shrink-0 text-destructive", iconClassName)}
            />
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          {description && (
            <AlertDialogDescription asChild={typeof description !== "string"}>
              {typeof description === "string" ? description : <div>{description}</div>}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isProcessing}
            className="hover:cursor-pointer"
          >
            {cancelLabel}
          </AlertDialogCancel>

          <Button
            variant={actionVariant}
            disabled={isProcessing}
            className="hover:cursor-pointer"
            onClick={handleAction}
          >
            {actionState === "loading" && (
              <Loader2 className="size-4 animate-spin" />
            )}
            {actionState === "success" && (
              <Check className="size-4" />
            )}
            {actionState === "idle" && ActionIcon && (
              <ActionIcon className="size-4" />
            )}
            {actionState === "success" ? "Done" : actionLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
