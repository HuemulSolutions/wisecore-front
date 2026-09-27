import * as React from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HuemulField } from "./huemul-field";
import { HuemulCombobox } from "./huemul-combobox";
import { isActive } from "@/hooks/useHuemulFilters";

import type {
  HuemulDateRangeValue,
  HuemulFilterDef,
  HuemulFilterPanelProps,
  HuemulFilterValues,
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

  // Groups render as an independent accordion (any number can be open at once).
  // Computed once at mount: groups that already have an active filter start open;
  // otherwise the first group opens. After that, the user controls it freely.
  const [openGroups, setOpenGroups] = React.useState<string[]>(() => {
    const named = groups.filter((g) => g.group);
    const active = named.filter((g) => g.defs.some((def) => isActive(def, values[def.key])));
    if (active.length > 0) return active.map((g) => g.group);
    return named.length > 0 ? [named[0].group] : [];
  });

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
          <Accordion type="multiple" value={openGroups} onValueChange={setOpenGroups}>
            {groups.map(({ group, defs }) =>
              group ? (
                <AccordionItem key={group} value={group} className="border-b-0">
                  <AccordionTrigger className="py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:no-underline">
                    <span className="flex items-center gap-2">
                      {group}
                      <GroupActiveBadge defs={defs} values={values} />
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="flex flex-col gap-3">
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
                  </AccordionContent>
                </AccordionItem>
              ) : (
                <div key="_" className="flex flex-col gap-3 py-3">
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
              ),
            )}
          </Accordion>
        )}
      </div>
    </div>
  );
}

// ── Group active-count badge ─────────────────────────────────────────────────

/** Small count badge shown on the group header, visible even while collapsed. */
function GroupActiveBadge({ defs, values }: { defs: HuemulFilterDef[]; values: HuemulFilterValues }) {
  const count = defs.filter((def) => isActive(def, values[def.key])).length;
  if (count === 0) return null;
  return (
    <Badge variant="secondary" className="h-4 min-w-4 rounded-full px-1 text-[10px] font-semibold normal-case tabular-nums">
      {count}
    </Badge>
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

    case "async-combobox":
      if (def.multiSelect) {
        return (
          <div className="flex w-full flex-col gap-1.5">
            <p className="text-sm font-medium leading-snug">{def.label}</p>
            <HuemulCombobox
              multiSelect
              value={Array.isArray(value) ? (value as string[]) : []}
              onValueChange={(v) => onChange(def.key, v as string[])}
              fetchOptions={def.fetchOptions}
              placeholder={def.placeholder}
              pageSize={def.pageSize}
              searchOnEnter={def.searchOnEnter}
            />
          </div>
        );
      }
      return (
        <HuemulField
          type="async-combobox"
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

    case "custom":
      return (
        <div className="flex w-full flex-col gap-1.5">
          <p className="text-sm font-medium leading-snug">{def.label}</p>
          {def.render({
            value,
            setValue: (v, label) => {
              onChange(def.key, v);
              onSelectedLabel?.(def.key, label);
            },
          })}
        </div>
      );

    default:
      return null;
  }
}
