import type { ReactNode } from 'react'
import type {
  HuemulFieldOption,
  AsyncSelectOption,
  FetchOptionsParams,
  FetchOptionsResult,
} from './field'

// ── Legacy collapsible filter bar (HuemulFilters) ────────────────────────────
// Still used by media.tsx. Kept for backward compatibility.
export interface HuemulFiltersProps {
  children: ReactNode;
  title?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onApply?: () => void;
  onClear?: () => void;
  hasActiveFilters?: boolean;
  className?: string;
}

// ── Faceted-style filter panel system ────────────────────────────────────────

/** Structured value for a date-range filter. `date` is mutually exclusive with `from`/`to`. */
export interface HuemulDateRangeValue {
  date?: string;
  from?: string;
  to?: string;
}

export type HuemulFilterValue = string | boolean | HuemulDateRangeValue | undefined;
export type HuemulFilterValues = Record<string, HuemulFilterValue>;

interface HuemulFilterDefBase {
  /** Stable key — used as the values-record key and the chip key. */
  key: string;
  /** Group heading this control renders under (group order = first appearance). */
  group?: string;
  /** Field label shown inside the panel and used as the chip prefix. */
  label: string;
  /** className passthrough for the underlying HuemulField control. */
  inputClassName?: string;
  /** When true, this filter renders inline in the toolbar (via HuemulFilterInline)
   *  instead of in the panel, and is excluded from chips and the applied count. */
  toolbar?: boolean;
  /** When true, the control is not rendered (panel/inline) and is excluded from
   *  chips/count, but its value is still tracked. Use for conditional filters. */
  hidden?: boolean;
}

export interface HuemulSelectFilterDef extends HuemulFilterDefBase {
  type: 'select';
  options: HuemulFieldOption[];
  placeholder?: string;
  /** Value that means "no filter" (e.g. '__all__' or 'semantic'); treated as inactive. */
  allValue?: string;
}

export interface HuemulAsyncSelectFilterDef extends HuemulFilterDefBase {
  type: 'async-select';
  fetchOptions: (params: FetchOptionsParams) => Promise<FetchOptionsResult>;
  placeholder?: string;
  pageSize?: number;
  searchOnEnter?: boolean;
  staticOptions?: AsyncSelectOption[];
  staticOptionsLabel?: string;
  asyncResultsLabel?: string;
}

export interface HuemulDateRangeFilterDef extends HuemulFilterDefBase {
  type: 'date-range';
  placeholder?: string;
}

export interface HuemulBooleanFilterDef extends HuemulFilterDefBase {
  type: 'boolean';
  /** Label shown on the chip when active; defaults to `label`. */
  chipLabel?: string;
  /** Inactive/empty value (used by clearAll and the default state). Defaults to `false`. */
  defaultValue?: boolean;
  /** Value that counts as active (chip + count). Defaults to `true`.
   *  Set to `false` for inverted toggles (on by default, "off" is the filter). */
  activeWhen?: boolean;
}

export interface HuemulTextFilterDef extends HuemulFilterDefBase {
  type: 'text';
  placeholder?: string;
}

export type HuemulFilterDef =
  | HuemulSelectFilterDef
  | HuemulAsyncSelectFilterDef
  | HuemulDateRangeFilterDef
  | HuemulBooleanFilterDef
  | HuemulTextFilterDef;

export interface HuemulFilterChip {
  /** Filter def key — what `clearValue(key)` / `onRemove(key)` targets. */
  key: string;
  /** Fully formatted, translated chip label (e.g. "Propietario: Juan Pérez"). */
  label: string;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export interface UseHuemulFiltersConfig {
  filters: HuemulFilterDef[];
  defaultOpen?: boolean;
  /** Optional initial values (e.g. a default search type or restored state). */
  initialValues?: HuemulFilterValues;
}

export interface UseHuemulFiltersReturn {
  values: HuemulFilterValues;
  setValue: (key: string, value: HuemulFilterValue) => void;
  clearValue: (key: string) => void;
  clearAll: () => void;
  activeCount: number;
  chips: HuemulFilterChip[];
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Registers a resolved display label for an async-select id (used by chips). */
  setSelectedLabel: (key: string, label?: string) => void;
}

// ── Components ─────────────────────────────────────────────────────────────────

export interface HuemulFilterButtonProps {
  count: number;
  open: boolean;
  onToggle: () => void;
  /** Defaults to t('huemul-filters:title'). */
  label?: string;
  className?: string;
}

export interface HuemulFilterChipsProps {
  chips: HuemulFilterChip[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
  className?: string;
}

export interface HuemulFilterPanelProps {
  filters: HuemulFilterDef[];
  values: HuemulFilterValues;
  onChange: (key: string, value: HuemulFilterValue) => void;
  /** Called when an async-select resolves a label, so chips can show names. */
  onSelectedLabel?: (key: string, label?: string) => void;
  title?: string;
  /** Renders a close (X) button in the panel header when provided. */
  onClose?: () => void;
  className?: string;
}

export interface HuemulFilterInlineProps {
  filters: HuemulFilterDef[];
  values: HuemulFilterValues;
  onChange: (key: string, value: HuemulFilterValue) => void;
  /** Called when an async-select resolves a label, so chips can show names. */
  onSelectedLabel?: (key: string, label?: string) => void;
  className?: string;
}
