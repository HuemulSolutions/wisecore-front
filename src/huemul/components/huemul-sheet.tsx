import * as React from "react";
import { type LucideIcon, Loader2 } from "lucide-react";

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

// ── Types ──────────────────────────────────────────────────────────────────

export interface HuemulSheetAction {
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
  /** Auto-close the sheet after a successful async click (default: true for saveAction, false for extraActions) */
  closeOnSuccess?: boolean;
  /** Where to render the button: "header" or "footer" (default: "footer") */
  position?: "header" | "footer";
}

export interface HuemulSheetProps {
  /** Controlled open state */
  open: boolean;
  /** Called when the sheet requests to open or close */
  onOpenChange: (open: boolean) => void;

  // ── Header ──────────────────────────────────────────────────────────────
  /** Sheet title (required) */
  title: string;
  /** Optional description below the title */
  description?: string;
  /** Optional icon rendered to the left of the title */
  icon?: LucideIcon;
  /** Icon className overrides (e.g. size, color) */
  iconClassName?: string;

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
  saveAction?: HuemulSheetAction;
  /** Extra action buttons — each can specify its position ("header" | "footer") */
  extraActions?: HuemulSheetAction[];

  /** Delay in ms before auto-closing the sheet after a successful async action (default: 500) */
  closeDelay?: number;

  // ── Layout ──────────────────────────────────────────────────────────────
  /** Side from which the sheet slides in (default: "right") */
  side?: "top" | "right" | "bottom" | "left";
  /** Width class override (default: "sm:max-w-md") */
  maxWidth?: string;
  /** Additional className on SheetContent */
  className?: string;
  /** Body content */
  children: React.ReactNode;
}

// ── Helpers ────────────────────────────────────────────────────────────────

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
  description,
  icon: Icon,
  iconClassName,
  bodyLoading = false,
  showFooter = true,
  showCancelButton = true,
  cancelLabel = "Cancel",
  saveAction,
  extraActions,
  closeDelay = 500,
  side = "right",
  maxWidth = "sm:max-w-md",
  className,
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

  // Determine if footer has any content
  const hasFooterContent = showFooter && (showCancelButton || saveInFooter || footerActions.length > 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        {...(!description && { "aria-describedby": undefined })}
        className={cn(
          "flex flex-col gap-0 p-0",
          maxWidth,
          className,
        )}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <SheetHeader className="px-6 pt-6 pb-4 space-y-1.5">
          <div className="flex items-center gap-2">
            {Icon && (
              <Icon
                className={cn("size-5 shrink-0 text-blue-600", iconClassName)}
              />
            )}
            <SheetTitle>{title}</SheetTitle>

            {/* Header-positioned actions (right-aligned) */}
            {(headerActions.length > 0 || saveInHeader) && (
              <div className="ml-auto flex items-center gap-2 pr-6">
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
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>

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
        {hasFooterContent && (
          <div className="sticky bottom-0 border-t bg-background px-6 py-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {showCancelButton && (
              <SheetClose asChild>
                <Button
                  variant="outline"
                  className="hover:cursor-pointer"
                  onClick={closeDialog}
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
        )}
      </SheetContent>
    </Sheet>
  );
}
