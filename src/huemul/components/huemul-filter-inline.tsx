import * as React from "react";

import { cn } from "@/lib/utils";
import { HuemulField } from "./huemul-field";

import type {
  HuemulDateRangeValue,
  HuemulFilterDef,
  HuemulFilterInlineProps,
  HuemulTextFilterDef,
} from "@/types/huemul";
export type { HuemulFilterInlineProps };

/**
 * `HuemulFilterInline` — renders the filters marked `toolbar: true` as compact,
 * label-less controls meant to sit next to `HuemulFilterButton` in the toolbar.
 *
 * Shares the same `values`/`onChange` as the panel (state lives in
 * `useHuemulFilters`). Text filters commit on Enter; selects apply instantly.
 */
export function HuemulFilterInline({
  filters,
  values,
  onChange,
  onSelectedLabel,
  className,
}: HuemulFilterInlineProps) {
  const inlineFilters = React.useMemo(() => filters.filter((d) => d.toolbar && !d.hidden), [filters]);

  if (inlineFilters.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {inlineFilters.map((def) => (
        <InlineControl
          key={def.key}
          def={def}
          value={values[def.key]}
          onChange={onChange}
          onSelectedLabel={onSelectedLabel}
        />
      ))}
    </div>
  );
}

// ── Single control ───────────────────────────────────────────────────────────

interface InlineControlProps {
  def: HuemulFilterDef;
  value: HuemulFilterInlineProps["values"][string];
  onChange: HuemulFilterInlineProps["onChange"];
  onSelectedLabel?: HuemulFilterInlineProps["onSelectedLabel"];
}

function InlineControl({ def, value, onChange, onSelectedLabel }: InlineControlProps) {
  switch (def.type) {
    case "text":
      return <InlineTextControl def={def} value={String(value ?? "")} onChange={onChange} />;

    case "select":
      return (
        <HuemulField
          type="select"
          value={String(value ?? "")}
          onChange={(v) => onChange(def.key, String(v))}
          options={def.options}
          placeholder={def.placeholder}
          selectSize="xs"
          className="w-auto"
          inputClassName={cn("h-8 text-xs", def.inputClassName ?? "w-36")}
        />
      );

    case "async-combobox":
      return (
        <HuemulField
          type="async-combobox"
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
          className="w-auto"
          inputClassName={cn("h-8 text-xs", def.inputClassName ?? "w-44")}
        />
      );

    case "date-range": {
      const dr = (value as HuemulDateRangeValue | undefined) ?? {};
      return (
        <HuemulField
          type="date-range"
          dateValue={dr.date ?? ""}
          dateRangeFrom={dr.from ?? ""}
          dateRangeTo={dr.to ?? ""}
          onDateChange={(v) => onChange(def.key, v ? { date: v } : undefined)}
          onDateRangeChange={(from, to) =>
            onChange(def.key, from || to ? { from: from || undefined, to: to || undefined } : undefined)
          }
          placeholder={def.placeholder}
          className="w-auto"
          inputClassName={cn("h-8 text-xs", def.inputClassName ?? "w-52")}
        />
      );
    }

    case "boolean":
      return (
        <HuemulField
          type="switch"
          label={def.label}
          value={Boolean(value)}
          onChange={(v) => onChange(def.key, Boolean(v))}
          className="w-auto"
          controlClassName="h-8 flex items-center"
        />
      );

    default:
      return null;
  }
}

/** Text filter with a local draft that commits on Enter (avoids per-keystroke queries). */
function InlineTextControl({
  def,
  value,
  onChange,
}: {
  def: HuemulTextFilterDef;
  value: string;
  onChange: HuemulFilterInlineProps["onChange"];
}) {
  const [draft, setDraft] = React.useState(value);

  React.useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <HuemulField
      type="text"
      value={draft}
      onChange={(v) => setDraft(String(v ?? ""))}
      onKeyDown={(e) => {
        if (e.key === "Enter") onChange(def.key, draft);
      }}
      placeholder={def.placeholder}
      className="min-w-0 flex-1"
      inputClassName={cn("h-8 text-xs", def.inputClassName ?? "w-48")}
    />
  );
}
