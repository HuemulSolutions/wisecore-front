import * as React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { HuemulField } from "./huemul-field";
import { HuemulSearchClearButton } from "./huemul-search-clear-button";

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

/**
 * Text filter with a local draft. Without `debounceMs`, commits only on Enter
 * (avoids per-keystroke queries). With `debounceMs`, also auto-commits the
 * debounced draft — for server-side search boxes (Enter still commits instantly).
 */
function InlineTextControl({
  def,
  value,
  onChange,
}: {
  def: HuemulTextFilterDef;
  value: string;
  onChange: HuemulFilterInlineProps["onChange"];
}) {
  const { t } = useTranslation("huemul-filters");
  const [draft, setDraft] = React.useState(value);
  const debouncedDraft = useDebounce(draft, def.debounceMs ?? 0);
  // Evita commitear en el mount y al resincronizar `draft` cuando `value`
  // cambia desde afuera (ver huemul-page-header.tsx para el mismo patrón).
  const isMountedRef = React.useRef(false);

  React.useEffect(() => {
    setDraft(value);
  }, [value]);

  React.useEffect(() => {
    if (!def.debounceMs) return;
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    if (debouncedDraft !== value) onChange(def.key, debouncedDraft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedDraft]);

  const Icon = def.icon;

  // Vaciar el draft no alcanza: sin commitear, el listado seguiría filtrado
  // hasta que venza el debounce (o para siempre si el filtro no lo tiene).
  const clear = () => {
    setDraft("");
    onChange(def.key, "");
  };

  return (
    <div className={cn("relative min-w-0 flex-1", def.icon && "flex items-center")}>
      {Icon && (
        <Icon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
      )}
      <HuemulField
        type="text"
        value={draft}
        onChange={(v) => setDraft(String(v ?? ""))}
        onKeyDown={(e) => {
          if (e.key === "Enter") onChange(def.key, draft);
          if (e.key === "Escape" && draft) {
            e.preventDefault();
            clear();
          }
        }}
        placeholder={def.placeholder}
        className="min-w-0 flex-1"
        inputClassName={cn("h-8 text-xs", Icon && "pl-8", draft && "pr-7", def.inputClassName ?? "w-48")}
      />
      {draft && (
        <HuemulSearchClearButton
          onClear={clear}
          label={t("clear")}
          className="absolute right-2 top-1/2 -translate-y-1/2"
        />
      )}
    </div>
  );
}
