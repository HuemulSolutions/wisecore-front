import * as React from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { HuemulField } from "./huemul-field";

import type {
  HuemulDateRangeValue,
  HuemulFilterDef,
  HuemulFilterPanelProps,
} from "@/types/huemul";
export type { HuemulFilterPanelProps };

/** Group definitions in first-appearance order. */
function groupFilters(filters: HuemulFilterDef[]): { group: string; defs: HuemulFilterDef[] }[] {
  const order: string[] = [];
  const map = new Map<string, HuemulFilterDef[]>();
  for (const def of filters) {
    const key = def.group ?? "";
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)!.push(def);
  }
  return order.map((group) => ({ group, defs: map.get(group)! }));
}

/**
 * `HuemulFilterPanel` — the side-column body for the faceted filter system.
 * Renders a header, an optional "search filters" box, and the filter controls
 * (reusing `HuemulField`) grouped by their `group`.
 *
 * Designed to be passed as a `HuemulPageLayout` column with `show={open}`.
 */
export function HuemulFilterPanel({
  filters,
  values,
  onChange,
  onSelectedLabel,
  title,
  onClose,
  className,
}: HuemulFilterPanelProps) {
  const { t } = useTranslation(["huemul-filters", "common"]);

  // Toolbar filters render outside the panel (see HuemulFilterInline).
  const panelFilters = React.useMemo(() => filters.filter((d) => !d.toolbar && !d.hidden), [filters]);
  const groups = React.useMemo(() => groupFilters(panelFilters), [panelFilters]);

  return (
    <div className={cn("flex h-full flex-col overflow-hidden border-r bg-background", className)}>
      {/* ── Header ── */}
      <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
        <span className="text-sm font-semibold">{title ?? t("title", "Filters")}</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common:close", "Close")}
            className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground hover:cursor-pointer"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* ── Filter groups ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {groups.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t("noFilters", "No filters match")}
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {groups.map(({ group, defs }) => (
              <div key={group || "_"} className="flex flex-col gap-3">
                {group && (
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group}
                  </p>
                )}
                {defs.map((def) => (
                  <FilterControl
                    key={def.key}
                    def={def}
                    value={values[def.key]}
                    onChange={onChange}
                    onSelectedLabel={onSelectedLabel}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Single control ───────────────────────────────────────────────────────────

interface FilterControlProps {
  def: HuemulFilterDef;
  value: HuemulFilterPanelProps["values"][string];
  onChange: HuemulFilterPanelProps["onChange"];
  onSelectedLabel?: HuemulFilterPanelProps["onSelectedLabel"];
}

function FilterControl({ def, value, onChange, onSelectedLabel }: FilterControlProps) {
  switch (def.type) {
    case "select":
      return (
        <HuemulField
          type="select"
          label={def.label}
          value={String(value ?? "")}
          onChange={(v) => onChange(def.key, String(v))}
          options={def.options}
          placeholder={def.placeholder}
          selectSize="sm"
          inputClassName={def.inputClassName}
        />
      );

    case "async-select":
      return (
        <HuemulField
          type="async-select"
          label={def.label}
          value={String(value ?? "")}
          onChange={(v) => onChange(def.key, v ? String(v) : "")}
          onSelectedLabelChange={(label) => onSelectedLabel?.(def.key, label)}
          fetchOptions={def.fetchOptions}
          placeholder={def.placeholder}
          pageSize={def.pageSize}
          searchOnEnter={def.searchOnEnter}
          asyncStaticOptions={def.staticOptions}
          asyncStaticOptionsLabel={def.staticOptionsLabel}
          asyncResultsLabel={def.asyncResultsLabel}
          inputClassName={def.inputClassName}
        />
      );

    case "date-range": {
      const dr = (value as HuemulDateRangeValue | undefined) ?? {};
      return (
        <HuemulField
          type="date-range"
          label={def.label}
          dateValue={dr.date ?? ""}
          dateRangeFrom={dr.from ?? ""}
          dateRangeTo={dr.to ?? ""}
          onDateChange={(v) => onChange(def.key, v ? { date: v } : undefined)}
          onDateRangeChange={(from, to) =>
            onChange(def.key, from || to ? { from: from || undefined, to: to || undefined } : undefined)
          }
          placeholder={def.placeholder}
          inputClassName={def.inputClassName}
        />
      );
    }

    case "boolean":
      return (
        <HuemulField
          type="switch"
          label={def.label}
          inline={false}
          value={Boolean(value)}
          onChange={(v) => onChange(def.key, Boolean(v))}
          controlClassName="flex items-center"
        />
      );

    case "text":
      return (
        <HuemulField
          type="text"
          label={def.label}
          value={String(value ?? "")}
          onChange={(v) => onChange(def.key, String(v ?? ""))}
          placeholder={def.placeholder}
          inputClassName={def.inputClassName}
        />
      );

    default:
      return null;
  }
}
