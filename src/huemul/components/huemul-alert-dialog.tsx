import * as React from "react";
import { type LucideIcon, Loader2, AlertTriangle, Check } from "lucide-react";

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

// ── Types ──────────────────────────────────────────────────────────────────

type ActionState = "idle" | "loading" | "success";

export interface HuemulAlertDialogProps {
  /** Controlled open state */
  open: boolean;
  /** Called when the dialog requests to open or close */
  onOpenChange: (open: boolean) => void;

  // ── Header ──────────────────────────────────────────────────────────────
  /** Dialog title (default: "Are you sure?") */
  title?: string;
  /** Optional description below the title */
  description?: React.ReactNode;
  /** Optional icon rendered to the left of the title (default: AlertTriangle) */
  icon?: LucideIcon;
  /** Icon className overrides (e.g. size, color) */
  iconClassName?: string;

  // ── Action ──────────────────────────────────────────────────────────────
  /** Label for the destructive action button (default: "Delete") */
  actionLabel?: string;
  /** Async handler executed when the action button is clicked */
  onAction: () => Promise<void>;
  /** Button variant for the action button (default: "destructive") */
  actionVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  /** Optional icon for the action button */
  actionIcon?: LucideIcon;

  // ── Cancel ──────────────────────────────────────────────────────────────
  /** Label for the cancel button (default: "Cancel") */
  cancelLabel?: string;

  // ── Timing ──────────────────────────────────────────────────────────────
  /** Delay in ms to keep the success state visible before closing (default: 600) */
  successDelay?: number;

  // ── Layout ──────────────────────────────────────────────────────────────
  /** Additional className on AlertDialogContent */
  className?: string;
}

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
