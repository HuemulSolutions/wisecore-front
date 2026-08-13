import * as React from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  HuemulSheetAction,
  HuemulSheetIconVariant,
  HuemulSheetProps,
  HuemulSheetSize,
} from "@/types/huemul"
export type { HuemulSheetAction, HuemulSheetIconVariant, HuemulSheetProps, HuemulSheetSize }

// ── Helpers ────────────────────────────────────────────────────────────────

const SHEET_SIZE_CLASSES: Record<HuemulSheetSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
  "2xl": "sm:max-w-5xl",
  wide: "w-[90vw] sm:max-w-none",
};

function ActionButton({
  action,
  isLoading,
  onClickAction,
  defaultVariant = "secondary",
}: {
  action: HuemulSheetAction;
  isLoading: boolean;
  onClickAction: () => void;
  defaultVariant?: HuemulSheetAction["variant"];
}) {
  const ActionIcon = action.icon;
  const loading = action.loading || isLoading;

  return (
    <Button
      variant={action.variant ?? defaultVariant}
      disabled={action.disabled || loading}
      className="hover:cursor-pointer"
      onClick={onClickAction}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        ActionIcon && <ActionIcon className="size-4" />
      )}
      {action.label}
    </Button>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export function HuemulSheet({
  open,
  onOpenChange,
  title,
  eyebrow,
  description,
  icon: Icon,
  iconClassName,
  iconVariant = "plain",
  bodyLoading = false,
  showFooter = true,
  showCancelButton = true,
  cancelLabel = "Cancel",
  onCancel,
  saveAction,
  extraActions,
  closeDelay = 500,
  side = "right",
  maxWidth = "sm:max-w-md",
  size,
  className,
  bodyClassName,
  headerExtra,
  footerLeft,
  children,
}: HuemulSheetProps) {
  // Shared helper — all close paths go through Radix's onOpenChange
  const closeDialog = React.useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Internal loading state for save and extra action buttons
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [extraLoading, setExtraLoading] = React.useState<Record<number, boolean>>({});

  const handleActionClick = React.useCallback(
    async (
      action: HuemulSheetAction,
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

  // Reset loading states when sheet closes
  React.useEffect(() => {
    if (!open) {
      setSaveLoading(false);
      setExtraLoading({});
    }
  }, [open]);

  // ── Split extra actions by position ──────────────────────────────────
  const headerActions = extraActions?.filter((a) => a.position === "header") ?? [];
  const footerActions = extraActions?.filter((a) => a.position !== "header") ?? [];

  // Check if saveAction goes in header
  const saveInHeader = saveAction?.position === "header";
  const saveInFooter = saveAction && !saveInHeader;

  const widthClass = size ? SHEET_SIZE_CLASSES[size] : maxWidth;
  const isTile = iconVariant === "tile";

  // Determine if footer has any content
  const hasFooterContent = showFooter && (showCancelButton || saveInFooter || footerActions.length > 0 || !!footerLeft);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        {...(!description && { "aria-describedby": undefined })}
        className={cn(
          "flex flex-col gap-0 p-0",
          widthClass,
          className,
        )}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <SheetHeader
          className={cn("px-6 pt-6 pb-4 space-y-1.5", isTile && "space-y-1 pb-3")}
        >
          {eyebrow && (
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {eyebrow}
            </p>
          )}
          <div className={cn("flex gap-2", isTile ? "items-start gap-3" : "items-center")}>
            {Icon &&
              (isTile ? (
                <span className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] bg-[#eef2ff]">
                  <Icon className={cn("size-4 text-[#4f46e5]", iconClassName)} />
                </span>
              ) : (
                <Icon
                  className={cn("size-5 shrink-0 text-blue-600", iconClassName)}
                />
              ))}
            {isTile ? (
              <div className="flex min-w-0 flex-col gap-0.5">
                <SheetTitle className="text-[16px] font-semibold leading-tight text-[#0f172a]">
                  {title}
                </SheetTitle>
                {description && (
                  <SheetDescription className="text-[13px] leading-tight text-[#64748b]">
                    {description}
                  </SheetDescription>
                )}
              </div>
            ) : (
              <SheetTitle>{title}</SheetTitle>
            )}

            {/* Header-positioned actions (right-aligned) */}
            {(headerActions.length > 0 || saveInHeader || headerExtra) && (
              <div className="ml-auto flex items-center gap-2 pr-6">
                {headerExtra}
                {headerActions.map((action, _index) => {
                  const globalIndex = extraActions!.indexOf(action);
                  return (
                    <ActionButton
                      key={action.label}
                      action={action}
                      isLoading={extraLoading[globalIndex] ?? false}
                      defaultVariant="outline"
                      onClickAction={() =>
                        handleActionClick(
                          action,
                          (v) =>
                            setExtraLoading((prev) => ({
                              ...prev,
                              [globalIndex]: v,
                            })),
                          false,
                        )
                      }
                    />
                  );
                })}

                {saveInHeader && saveAction && (
                  <ActionButton
                    action={saveAction}
                    isLoading={saveLoading}
                    defaultVariant="default"
                    onClickAction={() =>
                      handleActionClick(saveAction, setSaveLoading, true)
                    }
                  />
                )}
              </div>
            )}
          </div>
          {!isTile && description && (
            <SheetDescription>{description}</SheetDescription>
          )}
        </SheetHeader>

        {/* ── Body ───────────────────────────────────────────────────── */}
        <div
          className={cn(
            "flex-1 overflow-y-auto px-6 py-2 scrollbar-gutter-stable",
            bodyClassName,
          )}
        >
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
        {hasFooterContent && (
          <div className="sticky bottom-0 border-t bg-background px-6 py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {footerLeft && (
              <div className="flex items-center gap-2">{footerLeft}</div>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:ml-auto">
              {showCancelButton && (
                <SheetClose asChild>
                  <Button
                    variant="outline"
                    className="hover:cursor-pointer"
                    onClick={() => onCancel?.()}
                  >
                    {cancelLabel}
                  </Button>
                </SheetClose>
              )}

              {footerActions.map((action) => {
                const globalIndex = extraActions!.indexOf(action);
                return (
                  <ActionButton
                    key={action.label}
                    action={action}
                    isLoading={extraLoading[globalIndex] ?? false}
                    defaultVariant="secondary"
                    onClickAction={() =>
                      handleActionClick(
                        action,
                        (v) =>
                          setExtraLoading((prev) => ({
                            ...prev,
                            [globalIndex]: v,
                          })),
                        false,
                      )
                    }
                  />
                );
              })}

              {saveInFooter && (
                <ActionButton
                  action={saveAction!}
                  isLoading={saveLoading}
                  defaultVariant="default"
                  onClickAction={() =>
                    handleActionClick(saveAction!, setSaveLoading, true)
                  }
                />
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
