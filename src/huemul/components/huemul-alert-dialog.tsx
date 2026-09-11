import * as React from "react";
import { Loader2, AlertTriangle, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
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
  loadingLabel,
  onAction,
  actionVariant = "destructive",
  actionIcon,
  cancelLabel,
  successDelay = 600,
  showSuccessState = true,
  className,
  alert,
}: HuemulAlertDialogProps) {
  // Default traducido del botón de cancelar (ver HuemulSheet).
  const { t } = useTranslation("common");
  const [actionState, setActionState] = React.useState<ActionState>("idle");

  // ── Shared helpers — all open/close goes through Radix's onOpenChange ──
  const closeDialog = React.useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Reset al ABRIR, no al cerrar: si se reseteara al cerrar, el contenido
  // (ícono, texto, botones habilitados) cambiaría a mitad de la animación de
  // salida de Radix (~200ms), que deja el diálogo visible mientras se
  // desvanece — se lee como si el diálogo "parpadeara" o se reabriera.
  React.useEffect(() => {
    if (open) {
      setActionState("idle");
    }
  }, [open]);

  const handleAction = React.useCallback(async () => {
    setActionState("loading");
    try {
      await onAction();
      if (showSuccessState) {
        setActionState("success");
        setTimeout(() => {
          setActionState("idle");
          closeDialog();
        }, successDelay);
      } else {
        // Cierra apenas resuelve, sin pasar por "success": el botón queda
        // en su texto de loading hasta que Radix empieza a animar la
        // salida — nunca repinta contenido a mitad del fade-out.
        closeDialog();
      }
    } catch {
      setActionState("idle");
    }
  }, [onAction, closeDialog, successDelay, showSuccessState]);

  const isProcessing = actionState !== "idle";
  const ActionIcon = actionIcon;
  const AlertIcon = alert?.icon ?? AlertTriangle;
  // Default de borrado: los diálogos que pasan t('common:delete') obtienen
  // «Eliminando...» sin tocar cada archivo.
  const resolvedLoadingLabel =
    loadingLabel ?? (actionLabel === t("delete") ? t("deleting") : actionLabel);

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
          {alert && (
            <Alert
              variant="destructive"
              className="mt-1 border-destructive/30 bg-destructive/10"
            >
              <AlertIcon className="size-4" />
              {alert.title && <AlertTitle className="line-clamp-none">{alert.title}</AlertTitle>}
              {alert.description && <AlertDescription>{alert.description}</AlertDescription>}
            </Alert>
          )}
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
            {cancelLabel ?? t("cancel")}
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
            {actionState === "success"
              ? t("done")
              : actionState === "loading"
                ? resolvedLoadingLabel
                : actionLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
