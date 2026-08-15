import { useState, useContext, createContext } from "react";
import { Copy, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  InfoLayout,
  HuemulInfoItemVariant,
  HuemulInfoItemProps,
  HuemulInfoGroupProps,
  HuemulInfoSectionProps,
  HuemulInfoDisplayProps,
} from "@/types/huemul"
export type {
  InfoLayout,
  HuemulInfoItemVariant,
  HuemulInfoItemProps,
  HuemulInfoGroupProps,
  HuemulInfoSectionProps,
  HuemulInfoDisplayProps,
}

// ── Layout context ─────────────────────────────────────────────────────────

const InfoLayoutContext = createContext<InfoLayout>("vertical");

// ── Internal helpers ───────────────────────────────────────────────────────

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 p-1 rounded hover:bg-muted transition-colors hover:cursor-pointer"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {copied ? "Copied!" : "Copy"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ── HuemulInfoItem ─────────────────────────────────────────────────────────

export function HuemulInfoItem({
  label,
  value,
  icon: Icon,
  variant = "text",
  badgeVariant = "secondary",
  copyable = false,
  emptyText = "—",
  hideWhenEmpty = false,
  layout,
  className,
}: HuemulInfoItemProps) {
  const contextLayout = useContext(InfoLayoutContext);
  const activeLayout = layout ?? contextLayout;

  const isEmpty = value === undefined || value === null || value === "";
  if (hideWhenEmpty && isEmpty) return null;

  const copyValue =
    copyable && !isEmpty && (typeof value === "string" || typeof value === "number")
      ? String(value)
      : null;

  // ── Horizontal layout (card/row style) ────────────────────────────────

  if (activeLayout === "horizontal") {
    const renderValue = () => {
      if (isEmpty) {
        return <span className="text-sm text-muted-foreground italic">{emptyText}</span>;
      }

      // Custom ReactNode
      if (typeof value !== "string" && typeof value !== "number") {
        return <div className="flex items-center justify-end">{value}</div>;
      }

      if (variant === "mono") {
        return (
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded px-2 py-1 flex-1 min-w-0">
            <code className="text-[11px] font-mono text-gray-500 flex-1 truncate">{value}</code>
            {copyValue && <CopyButton value={copyValue} />}
          </div>
        );
      }

      return (
        <div className="flex items-center justify-end gap-1">
          {variant === "badge" ? (
            <Badge variant={badgeVariant} className="text-xs">{value}</Badge>
          ) : variant === "code" ? (
            <code className="text-[11px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{value}</code>
          ) : (
            <span>{value}</span>
          )}
          {copyValue && <CopyButton value={copyValue} />}
        </div>
      );
    };

    return (
      <div className={cn("flex items-start justify-between gap-3 py-2", className)}>
        <span className="text-xs text-gray-500 shrink-0 pt-0.5 w-30">{label}</span>
        <div className="text-sm text-gray-900 font-medium text-right flex-1 min-w-0">
          {renderValue()}
        </div>
      </div>
    );
  }

  // ── Vertical layout (icon + label above value) ─────────────────────────

  const renderVerticalValue = () => {
    if (isEmpty) {
      return <span className="text-sm text-muted-foreground italic">{emptyText}</span>;
    }

    if (typeof value !== "string" && typeof value !== "number") {
      return <div className="mt-0.5">{value}</div>;
    }

    if (variant === "mono") {
      return (
        <div className="flex items-center gap-1 mt-0.5">
          <code className="text-xs font-mono bg-muted text-muted-foreground px-2 py-1 rounded flex-1 min-w-0 truncate">
            {value}
          </code>
          {copyValue && <CopyButton value={copyValue} />}
        </div>
      );
    }

    if (variant === "badge") {
      return (
        <div className="flex items-center gap-1.5 mt-0.5">
          <Badge variant={badgeVariant} className="text-xs font-semibold tabular-nums">
            {value}
          </Badge>
          {copyValue && <CopyButton value={copyValue} />}
        </div>
      );
    }

    if (variant === "code") {
      return (
        <div className="flex items-center gap-1 mt-0.5">
          <code className="text-xs font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded flex-1 min-w-0 truncate">
            {value}
          </code>
          {copyValue && <CopyButton value={copyValue} />}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1">
        <p className="text-sm text-foreground break-all leading-relaxed flex-1">{value}</p>
        {copyValue && <CopyButton value={copyValue} />}
      </div>
    );
  };

  return (
    <div className={cn("flex gap-3", className)}>
      {Icon && (
        <div className="mt-0.5 shrink-0">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
          {label}
        </p>
        {renderVerticalValue()}
      </div>
    </div>
  );
}

// ── HuemulInfoSection ──────────────────────────────────────────────────────

/**
 * Card section with a header title and horizontal row items inside.
 * Automatically sets the layout context to "horizontal" for all child items.
 */
export function HuemulInfoSection({
  title,
  items,
  children,
  className,
}: HuemulInfoSectionProps) {
  return (
    <InfoLayoutContext.Provider value="horizontal">
      <div className={cn("rounded-lg border border-gray-200 overflow-hidden", className)}>
        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {title}
          </span>
        </div>
        <div className="px-3 divide-y divide-gray-100">
          {items?.map((item, i) => (
            <HuemulInfoItem key={i} {...item} />
          ))}
          {children}
        </div>
      </div>
    </InfoLayoutContext.Provider>
  );
}

// ── HuemulInfoGroup ────────────────────────────────────────────────────────

/**
 * Vertical group with an optional labeled separator divider.
 * Automatically sets the layout context to "vertical" for all child items.
 */
export function HuemulInfoGroup({
  label,
  items,
  children,
  className,
  layout = "vertical",
}: HuemulInfoGroupProps) {
  const isGrid = layout === "grid-2";
  return (
    <InfoLayoutContext.Provider value="vertical">
      <div
        className={cn(
          isGrid ? "grid grid-cols-2 gap-x-4 gap-y-3" : "flex flex-col gap-4",
          className,
        )}
      >
        {label && (
          <div className={cn("flex items-center gap-2 py-1", isGrid && "col-span-2")}>
            <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wider shrink-0">
              {label}
            </p>
            <Separator className="flex-1" />
          </div>
        )}
        {items?.map((item, i) => (
          <HuemulInfoItem key={i} {...item} />
        ))}
        {children}
      </div>
    </InfoLayoutContext.Provider>
  );
}

// ── HuemulInfoDisplay ──────────────────────────────────────────────────────

/**
 * Container for displaying structured read-only information inside sheets,
 * dialogs, or cards. Composes `HuemulInfoSection` (horizontal/card style)
 * and `HuemulInfoGroup` (vertical style).
 *
 * @example — Card sections (horizontal rows, assets style)
 * <HuemulInfoDisplay>
 *   <HuemulInfoSection title="Identifiers">
 *     <HuemulInfoItem label="ID" value={record.id} variant="mono" copyable />
 *   </HuemulInfoSection>
 * </HuemulInfoDisplay>
 *
 * @example — Vertical groups (templates style)
 * <HuemulInfoDisplay>
 *   <HuemulInfoGroup label="Identifiers">
 *     <HuemulInfoItem label="ID" value={record.id} icon={Hash} variant="mono" copyable />
 *   </HuemulInfoGroup>
 * </HuemulInfoDisplay>
 */
export function HuemulInfoDisplay({
  groups,
  children,
  className,
}: HuemulInfoDisplayProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {groups?.map((group, i) => (
        <HuemulInfoGroup key={i} {...group} />
      ))}
      {children}
    </div>
  );
}
