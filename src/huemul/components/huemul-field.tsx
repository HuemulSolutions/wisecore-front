import * as React from "react";
import { useTranslation } from "react-i18next";
import { type LucideIcon, HelpCircle, Asterisk, Check, ChevronsUpDown, X, CalendarIcon, UploadIcon, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { Value } from "platejs";
import { tokenize, tokenStyle } from "./json-viewer";

import SectionPlateEditor from "@/components/plate-editor/section-plate-editor";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";

// ── Types ──────────────────────────────────────────────────────────────────

export type HuemulFieldType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "tel"
  | "url"
  | "time"
  | "datetime"
  | "textarea"
  | "select"
  | "checkbox"
  | "switch"
  | "file"
  | "combobox"
  | "color"
  | "date"
  | "radio"
  | "richtext"
  | "async-select"
  | "json";

export interface HuemulFieldOption {
  /** Display label */
  label: string;
  /** Underlying value */
  value: string;
  /** Optional description shown below the label in combobox items */
  description?: string;
  /** Optional icon for each option */
  icon?: LucideIcon;
  /** Optional hex color — renders a filled circle before the label */
  color?: string;
}

// ── Grouped Select types ─────────────────────────────────────────────────

/** A group of options for the grouped select type */
export interface HuemulFieldOptionGroup {
  /** Label shown as the group header (non-selectable) */
  groupLabel: string;
  /** If provided, the group header is also a selectable item with this value */
  groupValue?: string;
  /** Options nested under this group */
  options: HuemulFieldOption[];
}

// ── Async Select types ────────────────────────────────────────────────────

export interface AsyncSelectOption {
  value: string;
  label: string;
  color?: string;
}

export interface FetchOptionsParams {
  search: string;
  page: number;
  pageSize: number;
}

export interface FetchOptionsResult {
  options: AsyncSelectOption[];
  hasMore: boolean;
  totalCount?: number;
}

export interface HuemulFieldLabelAction {
  /** Icon to render */
  icon: LucideIcon;
  /** Click handler */
  onClick: () => void;
  /** Tooltip text on hover */
  tooltip?: string;
}

export interface HuemulFieldProps {
  // ── Core ──────────────────────────────────────────────────────────────
  /** Input type (default: "text") */
  type?: HuemulFieldType;
  /** Field label */
  label: string;
  /** HTML name attribute */
  name?: string;
  /** HTML id attribute — auto-generated from name/label if omitted */
  id?: string;

  // ── Required ──────────────────────────────────────────────────────────
  /** Show required indicator (asterisk) next to the label */
  required?: boolean;

  // ── Help ──────────────────────────────────────────────────────────────
  /** Help text shown in a tooltip when clicking the help icon */
  helpText?: string;

  // ── Label action ──────────────────────────────────────────────────────
  /** Action button rendered to the right of the label row */
  labelAction?: HuemulFieldLabelAction;

  // ── Value ─────────────────────────────────────────────────────────────
  /** Current value (string | number for inputs, boolean for checkbox/switch) */
  value?: string | number | boolean;
  /** Change handler — receives the new value */
  onChange?: (value: string | number | boolean) => void;

  // ── Field props ───────────────────────────────────────────────────────
  /** Placeholder text */
  placeholder?: string;
  /** Description / helper text below the field */
  description?: string;
  /** Error message — puts the field in an invalid state */
  error?: string;
  /** Disable the field */
  disabled?: boolean;
  /** Read-only */
  readOnly?: boolean;

  // ── Select / Combobox ─────────────────────────────────────────────────
  /** Options for select or combobox types */
  options?: HuemulFieldOption[];
  /** Grouped options for select type — renders SelectGroups with headers */
  groupedOptions?: HuemulFieldOptionGroup[];

  // ── File ──────────────────────────────────────────────────────────────
  /** Accept attribute for file inputs (e.g. "image/*,.pdf") */
  accept?: string;
  /** Allow multiple files */
  multiple?: boolean;
  /** Called with the selected FileList (use this to access actual File objects) */
  onFileChange?: (files: FileList | null) => void;

  // ── Textarea ──────────────────────────────────────────────────────────
  /** Number of visible rows for textarea (default: 3) */
  rows?: number;

  // ── Number ────────────────────────────────────────────────────────────
  /** Minimum value for number inputs */
  min?: number;
  /** Maximum value for number inputs */
  max?: number;
  /** Step for number inputs */
  step?: number;

  // ── Checkbox / Switch ─────────────────────────────────────────────────
  /** Label for checkbox / switch placed inline after the control */
  checkLabel?: string;

  // ── Rich text ─────────────────────────────────────────────────────────
  /** Current Plate editor value (for richtext type) */
  richTextValue?: Value;
  /** Change handler for richtext type — receives Plate Value nodes */
  onRichTextChange?: (value: Value) => void;
  /** Minimum height for the rich text editor */
  richTextMinHeight?: string;

  // ── Layout ────────────────────────────────────────────────────────────
  /** Force the control to render stacked (label above, control below) even for switch/checkbox. Defaults to true for switch/checkbox. */
  inline?: boolean;
  /** When inline=true (switch/checkbox), render label before the control instead of after. */
  labelFirst?: boolean;
  /** Additional className on the outermost wrapper */
  className?: string;
  /** Additional className on the input / control element */
  inputClassName?: string;
  /** Auto-focus */
  autoFocus?: boolean;
  /** Autocomplete hint */
  autoComplete?: string;
  // ── Async Select ──────────────────────────────────────────────────────────
  /** Async fetch function for async-select type */
  fetchOptions?: (params: FetchOptionsParams) => Promise<FetchOptionsResult>;
  /** Page size for async-select pagination (default: 10) */
  pageSize?: number;
  /** Debounce delay in ms for async-select search (default: 300) */
  debounceMs?: number;
  /** Pre-selected label for async-select — shown when value is set but options haven't loaded yet */
  selectedLabel?: string;
  /** Pre-selected color for async-select — shown alongside selectedLabel before options load */
  selectedColor?: string;

  // ── Select size ──────────────────────────────────────────────────────────
  /** Size variant passed to the SelectTrigger. Use "xs" for compact inline usage (no forced height). */
  selectSize?: "sm" | "default" | "xs";

  // ── Control wrapper ──────────────────────────────────────────────────────
  /** Additional className on the div wrapping the control element (useful for height alignment in flex rows) */
  controlClassName?: string;

  // ── Slot ─────────────────────────────────────────────────────────────────
  /** Optional content rendered below the control (e.g. tag list) */
  children?: React.ReactNode;}

// ── Helpers ────────────────────────────────────────────────────────────────

function generateId(name?: string, label?: string): string {
  const base = name || label || "field";
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ── Sub-components ─────────────────────────────────────────────────────────

function FieldHelpButton({ helpText }: { helpText: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:cursor-pointer transition-colors"
            tabIndex={-1}
          >
            <HelpCircle className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p>{helpText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function FieldLabelAction({ action }: { action: HuemulFieldLabelAction }) {
  const ActionIcon = action.icon;

  const button = (
    <button
      type="button"
      className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:cursor-pointer transition-colors"
      onClick={action.onClick}
      tabIndex={-1}
    >
      <ActionIcon className="size-3.5" />
    </button>
  );

  if (action.tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="top">
            <p>{action.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}

// ── Combobox ───────────────────────────────────────────────────────────────

function ComboboxField({
  fieldId,
  value,
  onChange,
  options = [],
  placeholder,
  disabled,
  error,
  inputClassName,
}: {
  fieldId: string;
  value?: string | number | boolean;
  onChange?: (value: string | number | boolean) => void;
  options?: HuemulFieldOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  inputClassName?: string;
}) {
  const { t } = useTranslation('common');
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selectedOption = options.find((o) => o.value === String(value ?? ""));

  const filtered = React.useMemo(() => {
    if (!search) return options;
    const lower = search.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(lower) ||
        o.value.toLowerCase().includes(lower) ||
        o.description?.toLowerCase().includes(lower),
    );
  }, [options, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={fieldId}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={!!error || undefined}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal hover:cursor-pointer",
            !selectedOption && "text-muted-foreground",
            error &&
              "border-destructive ring-destructive/20 dark:ring-destructive/40",
            inputClassName,
          )}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder || t('selectPlaceholder')}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 focus-visible:border-0 h-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-muted-foreground hover:text-foreground hover:cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <div className="max-h-60 overflow-y-auto p-1" onWheel={(e) => e.stopPropagation()}>
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </p>
          ) : (
            filtered.map((option) => {
              const isSelected = String(value ?? "") === option.value;
              const OptionIcon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    "relative flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:cursor-pointer",
                    "hover:bg-accent hover:text-accent-foreground",
                    isSelected && "bg-accent text-accent-foreground",
                  )}
                  onClick={() => {
                    onChange?.(option.value);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <span className="flex size-4 items-center justify-center">
                    {isSelected && <Check className="size-4" />}
                  </span>
                  {OptionIcon && <OptionIcon className="size-4 text-muted-foreground" />}
                  <div className="flex flex-col items-start">
                    <span>{option.label}</span>
                    {option.description && (
                      <span className="text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Color Field ────────────────────────────────────────────────────────────

const DEFAULT_PRESET_COLORS = [
  "#000000", "#ffffff", "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#84cc16", "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
];

function ColorField({
  fieldId,
  value,
  onChange,
  options,
  disabled,
  error,
  inputClassName,
}: {
  fieldId: string;
  value?: string | number | boolean;
  onChange?: (value: string | number | boolean) => void;
  options?: HuemulFieldOption[];
  disabled?: boolean;
  error?: string;
  inputClassName?: string;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const color = String(value || "#000000");
  const [inputValue, setInputValue] = React.useState(color);

  React.useEffect(() => {
    setInputValue(String(value || "#000000"));
  }, [value]);

  const presets = options && options.length > 0
    ? options.map((o) => o.value)
    : DEFAULT_PRESET_COLORS;

  const handleColorChange = (newColor: string) => {
    setInputValue(newColor);
    onChange?.(newColor);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      onChange?.(val);
    }
  };

  const handleInputBlur = () => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(inputValue)) {
      setInputValue(color);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          id={fieldId}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={!!error || undefined}
          className={cn(
            "w-full justify-start gap-3 font-normal hover:cursor-pointer",
            error && "border-destructive ring-destructive/20 dark:ring-destructive/40",
            inputClassName,
          )}
        >
          <div
            className="size-5 shrink-0 rounded-full border-2 border-border"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs font-mono uppercase text-muted-foreground">{color}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <div className="space-y-3">
          <div className="space-y-2">
            <p className="text-sm font-medium">Preset colors</p>
            <div className="grid grid-cols-6 gap-2">
              {presets.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  className={cn(
                    "size-8 rounded-full border-2 transition-all hover:scale-110 hover:cursor-pointer",
                    color.toLowerCase() === presetColor.toLowerCase()
                      ? "border-ring ring-2 ring-ring ring-offset-2 ring-offset-background"
                      : "border-border",
                  )}
                  style={{ backgroundColor: presetColor }}
                  onClick={() => {
                    handleColorChange(presetColor);
                    setIsOpen(false);
                  }}
                  aria-label={presetColor}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Custom color</p>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={color}
                onChange={(e) => handleColorChange(e.target.value)}
                className="size-10 cursor-pointer rounded border border-input"
              />
              <Input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                className="flex-1 font-mono uppercase"
                placeholder="#000000"
                maxLength={7}
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── File Field ────────────────────────────────────────────────────────────

function FileInputField({
  fieldId,
  name,
  accept,
  multiple,
  disabled,
  required,
  autoFocus,
  error,
  inputClassName,
  onChange,
  onFileChange,
}: {
  fieldId: string;
  name?: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  error?: string;
  inputClassName?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileChange?: (files: FileList | null) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFileName(
        files.length === 1
          ? files[0].name
          : `${files.length} files selected`,
      );
    } else {
      setFileName(null);
    }
    onFileChange?.(files);
    onChange?.(e);
  };

  return (
    <>
      <input
        ref={inputRef}
        id={fieldId}
        name={name}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        required={required}
        autoFocus={autoFocus}
        aria-invalid={!!error || undefined}
        className="sr-only"
        onChange={handleChange}
      />
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        aria-invalid={!!error || undefined}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "w-full justify-start gap-2 font-normal hover:cursor-pointer",
          !fileName && "text-muted-foreground",
          error && "border-destructive ring-destructive/20 dark:ring-destructive/40",
          inputClassName,
        )}
      >
        <UploadIcon className="size-4 shrink-0" />
        <span className="truncate">
          {fileName ?? "Choose a file..."}
        </span>
      </Button>
    </>
  );
}

// ── Date Field ────────────────────────────────────────────────────────────

function DateInputField({
  fieldId,
  value,
  onChange,
  placeholder,
  disabled,
  error,
  inputClassName,
}: {
  fieldId: string;
  value?: string | number | boolean;
  onChange?: (value: string | number | boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  inputClassName?: string;
}) {
  const { t } = useTranslation('common');
  const [open, setOpen] = React.useState(false);
  const strValue = String(value ?? "");
  const selected = strValue ? parseISO(strValue) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={fieldId}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={!!error || undefined}
          className={cn(
            "w-full justify-start font-normal hover:cursor-pointer gap-2",
            !strValue && "text-muted-foreground",
            error && "border-destructive ring-destructive/20 dark:ring-destructive/40",
            inputClassName,
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0" />
          {selected ? format(selected, "dd-MM-yyyy") : (placeholder || t('pickDate'))}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(day) => {
            onChange?.(day ? day.toISOString() : "");
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

// ── Async Select Field ────────────────────────────────────────────────────

function AsyncSelectField({
  fieldId,
  value,
  onChange,
  placeholder,
  disabled,
  error,
  inputClassName,
  fetchOptions,
  pageSize = 10,
  externalSelectedLabel,
  externalSelectedColor,
}: {
  fieldId: string;
  value?: string | number | boolean;
  onChange?: (value: string | number | boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  inputClassName?: string;
  fetchOptions: (params: FetchOptionsParams) => Promise<FetchOptionsResult>;
  pageSize?: number;
  externalSelectedLabel?: string;
  externalSelectedColor?: string;
}) {
  const { t } = useTranslation('common');
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState<AsyncSelectOption[]>([]);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [selectedLabel, setSelectedLabel] = React.useState("");
  const [selectedColor, setSelectedColor] = React.useState<string | undefined>(undefined);

  const listRef = React.useRef<HTMLDivElement>(null);
  const isInitialMount = React.useRef(true);

  const loadOptions = React.useCallback(
    async (searchTerm: string, pageNum: number, append = false) => {
      const isPaginating = pageNum > 1;
      if (isPaginating) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      try {
        const [result] = await Promise.all([
          fetchOptions({ search: searchTerm, page: pageNum, pageSize }),
          isPaginating ? new Promise((r) => setTimeout(r, 400)) : Promise.resolve(),
        ]);
        setOptions((prev) => append ? [...prev, ...(result as FetchOptionsResult).options] : (result as FetchOptionsResult).options);
        setHasMore((result as FetchOptionsResult).hasMore);
        setPage(pageNum);
      } catch (err) {
        console.error("Error fetching options:", err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [fetchOptions, pageSize],
  );

  // Load initial options when popover opens
  React.useEffect(() => {
    if (open && isInitialMount.current) {
      isInitialMount.current = false;
      loadOptions("", 1);
    }
  }, [open, loadOptions]);

  // Reset state when popover closes
  React.useEffect(() => {
    if (!open) {
      setSearch("");
      setPage(1);
      setOptions([]);
      setHasMore(true);
      isInitialMount.current = true;
    }
  }, [open]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setPage(1);
      setHasMore(true);
      loadOptions(search, 1, false);
    }
  };

  const handleScroll = React.useCallback(() => {
    const list = listRef.current;
    if (!list || isLoadingMore || !hasMore) return;
    const { scrollTop, scrollHeight, clientHeight } = list;
    if (scrollHeight - scrollTop - clientHeight < 50) {
      loadOptions(search, page + 1, true);
    }
  }, [hasMore, isLoadingMore, loadOptions, page, search]);

  // Keep selectedLabel / selectedColor in sync when options list changes
  React.useEffect(() => {
    if (value) {
      const option = options.find((opt) => opt.value === String(value));
      if (option) {
        setSelectedLabel(option.label);
        setSelectedColor(option.color);
      } else if (externalSelectedLabel) {
        setSelectedLabel(externalSelectedLabel);
        setSelectedColor(externalSelectedColor);
      }
    } else {
      setSelectedLabel("");
      setSelectedColor(undefined);
    }
  }, [value, options, externalSelectedLabel, externalSelectedColor]);

  const strValue = String(value ?? "");

  const handleSelect = (selectedValue: string) => {
    const newValue = selectedValue === strValue ? "" : selectedValue;
    onChange?.(newValue);
    if (newValue) {
      const option = options.find((opt) => opt.value === newValue);
      if (option) {
        setSelectedLabel(option.label);
        setSelectedColor(option.color);
      }
    } else {
      setSelectedLabel("");
      setSelectedColor(undefined);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={fieldId}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={!!error || undefined}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal hover:cursor-pointer",
            !strValue && "text-muted-foreground",
            error && "border-destructive ring-destructive/20 dark:ring-destructive/40",
            inputClassName,
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {strValue && selectedColor && (
              <span
                className="shrink-0 size-3 rounded-full"
                style={{ backgroundColor: selectedColor }}
              />
            )}
            <span className="truncate">
              {strValue && selectedLabel ? selectedLabel : (placeholder || t('selectPlaceholder'))}
            </span>
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="min-w-[var(--radix-popover-trigger-width)] w-64 p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            className="border-0 shadow-none focus-visible:ring-0 focus-visible:border-0 h-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                loadOptions("", 1, false);
              }}
              className="text-muted-foreground hover:text-foreground hover:cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <div
          ref={listRef}
          className="max-h-60 overflow-y-auto p-1"
          onScroll={handleScroll}
          onWheel={(e) => e.stopPropagation()}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">{t('loading')}</span>
            </div>
          ) : options.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t('noResults')}</p>
          ) : (
            <>
              {/* All / clear option */}
              <button
                type="button"
                className={cn(
                  "relative flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:cursor-pointer",
                  "hover:bg-accent hover:text-accent-foreground",
                  !strValue && "bg-accent text-accent-foreground",
                )}
                onClick={() => {
                  onChange?.("");
                  setSelectedLabel("");
                  setSelectedColor(undefined);
                  setOpen(false);
                }}
              >
                <span className="flex size-4 items-center justify-center">
                  {!strValue && <Check className="size-4" />}
                </span>
                <span className="truncate text-muted-foreground">{placeholder ?? t('selectPlaceholder')}</span>
              </button>
              {options.map((option) => {
                const isSelected = strValue === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={cn(
                      "relative flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:cursor-pointer",
                      "hover:bg-accent hover:text-accent-foreground",
                      isSelected && "bg-accent text-accent-foreground",
                    )}
                    onClick={() => handleSelect(option.value)}
                  >
                    <span className="flex size-4 items-center justify-center">
                      {isSelected && <Check className="size-4" />}
                    </span>
                    {option.color && (
                      <span
                        className="shrink-0 size-3 rounded-full"
                        style={{ backgroundColor: option.color }}
                      />
                    )}
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })}
              {isLoadingMore && (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-xs text-muted-foreground">{t('loadingMore')}</span>
                </div>
              )}
              {!hasMore && options.length > 0 && (
                <p className="py-2 text-center text-xs text-muted-foreground">{t('noMoreResults')}</p>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── JSON Editor Field ──────────────────────────────────────────────────────

function JsonEditorField({
  fieldId,
  name,
  value,
  onChange,
  placeholder,
  disabled,
  readOnly,
  rows = 6,
  error,
  autoFocus,
  inputClassName,
}: {
  fieldId: string;
  name?: string;
  value: string;
  onChange?: (value: string | number | boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  rows?: number;
  error?: string;
  autoFocus?: boolean;
  inputClassName?: string;
}) {
  const [formatError, setFormatError] = React.useState<string | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const preRef = React.useRef<HTMLPreElement>(null);

  const tokens = React.useMemo(() => tokenize(value), [value]);

  // Auto-resize textarea to content height (fires before paint)
  React.useLayoutEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }, [value]);

  // Keep highlight layer scroll in sync with textarea
  const syncScroll = React.useCallback(() => {
    if (preRef.current && textareaRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  const handleFormat = () => {
    const raw = value.trim();
    if (!raw) return;
    try {
      const pretty = JSON.stringify(JSON.parse(raw), null, 2);
      onChange?.(pretty);
      setFormatError(null);
    } catch {
      setFormatError("Invalid JSON");
    }
  };

  // Approximate min-height: rows × line-height + top/bottom padding
  const rowLineHeight = 18; // 12px font × 1.5 line-height
  const paddingY = 8;
  const minH = rows * rowLineHeight + paddingY * 2;

  // Shared font/spacing so the pre and textarea overlap pixel-perfectly
  const sharedStyle: React.CSSProperties = {
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    fontSize: "0.75rem",
    lineHeight: "1.5",
    padding: "8px 12px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
  };

  const prRight = !readOnly && !disabled ? "72px" : "12px";

  return (
    <div>
      <div
        className={cn(
          "relative rounded-md border bg-background",
          error && "border-destructive ring-2 ring-destructive/20",
          (disabled || readOnly) && "opacity-60",
          inputClassName,
        )}
        style={{ minHeight: `${minH}px` }}
      >
        {/* ── Syntax-highlighted layer (behind textarea) ── */}
        <pre
          ref={preRef}
          aria-hidden
          style={{
            ...sharedStyle,
            paddingRight: prRight,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            margin: 0,
            overflow: "hidden",
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          {value.length > 0
            ? tokens.map((token, i) =>
                token.type === "whitespace" ? (
                  token.value
                ) : (
                  <span key={i} style={tokenStyle[token.type]}>
                    {token.value}
                  </span>
                ),
              )
            : (
              <span style={{ color: "var(--muted-foreground)" }}>
                {placeholder ?? '{\n  "key": "value"\n}'}
              </span>
            )}
        </pre>

        {/* ── Transparent textarea on top (drives height + input) ── */}
        <textarea
          ref={textareaRef}
          id={fieldId}
          name={name}
          value={value}
          onChange={(e) => {
            setFormatError(null);
            onChange?.(e.target.value);
          }}
          onScroll={syncScroll}
          disabled={disabled}
          readOnly={readOnly}
          autoFocus={autoFocus}
          spellCheck={false}
          aria-invalid={!!error || undefined}
          style={{
            ...sharedStyle,
            paddingRight: prRight,
            display: "block",
            position: "relative",
            zIndex: 1,
            width: "100%",
            minHeight: `${minH}px`,
            background: "transparent",
            color: "transparent",
            caretColor: "var(--foreground)",
            resize: "none",
            outline: "none",
            border: "none",
            overflow: "hidden",
          }}
        />

        {/* ── Format button ── */}
        {!readOnly && !disabled && (
          <button
            type="button"
            onClick={handleFormat}
            className="absolute top-2 right-2 z-10 text-[10px] px-2 py-0.5 rounded border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted hover:cursor-pointer transition-colors select-none"
            tabIndex={-1}
            title="Format JSON"
          >
            Format
          </button>
        )}
      </div>
      {formatError && (
        <p className="text-destructive text-xs mt-1">{formatError}</p>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function HuemulField({
  type = "text",
  label,
  name,
  id,
  required,
  helpText,
  labelAction,
  value,
  onChange,
  placeholder,
  description,
  error,
  disabled,
  readOnly,
  options = [],
  groupedOptions,
  accept,
  multiple,
  onFileChange,
  rows = 3,
  min,
  max,
  step,
  checkLabel,
  richTextValue,
  onRichTextChange,
  richTextMinHeight = "200px",
  className,
  inputClassName,
  autoFocus,
  autoComplete,
  inline,
  labelFirst,
  fetchOptions,
  pageSize = 10,
  selectedLabel,
  selectedColor,
  selectSize = "default",
  controlClassName,
  children,
}: HuemulFieldProps) {
  const fieldId = id || generateId(name, label);
  const isInline = (type === "checkbox" || type === "switch") && inline !== false;
  const { t } = useTranslation('common');

  // ── Handlers ────────────────────────────────────────────────────────

  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (type === "number") {
        const num = e.target.value === "" ? "" : Number(e.target.value);
        onChange?.(num);
      } else if (type === "file") {
        // For file inputs, pass the file name(s) — actual File objects should be handled via refs
        onChange?.(e.target.value);
      } else {
        onChange?.(e.target.value);
      }
    },
    [onChange, type],
  );

  const handleCheckedChange = React.useCallback(
    (checked: boolean) => {
      onChange?.(checked);
    },
    [onChange],
  );

  const handleSelectChange = React.useCallback(
    (val: string) => {
      onChange?.(val);
    },
    [onChange],
  );

  // ── Render control ──────────────────────────────────────────────────

  function renderControl() {
    const baseInvalid = !!error;

    switch (type) {
      case "textarea":
        return (
          <Textarea
            id={fieldId}
            name={name}
            value={String(value ?? "")}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            rows={rows}
            required={required}
            autoFocus={autoFocus}
            aria-invalid={baseInvalid || undefined}
            className={inputClassName}
          />
        );

      case "select": {
        const selectTrigger = (
          <SelectTrigger
            id={fieldId}
            size={selectSize}
            className={cn("w-full", inputClassName)}
            aria-invalid={baseInvalid || undefined}
          >
            <SelectValue placeholder={placeholder || t('selectPlaceholder')} />
          </SelectTrigger>
        );

        if (groupedOptions && groupedOptions.length > 0) {
          return (
            <Select
              value={String(value ?? "")}
              onValueChange={handleSelectChange}
              disabled={disabled}
              required={required}
            >
              {selectTrigger}
              <SelectContent>
                {groupedOptions.map((group) => (
                  <SelectGroup key={group.groupLabel}>
                    {group.groupValue ? (
                      <SelectItem
                        value={group.groupValue}
                        className="font-medium"
                      >
                        {group.groupLabel}
                      </SelectItem>
                    ) : (
                      <SelectLabel>{group.groupLabel}</SelectLabel>
                    )}
                    {group.options.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className="pl-6"
                      >
                        <span className="flex items-center gap-2">
                          {opt.color && (
                            <span
                              className="size-3 rounded-full shrink-0 border border-border/40 inline-block"
                              style={{ backgroundColor: opt.color }}
                            />
                          )}
                          {opt.icon && !opt.color &&
                            React.createElement(opt.icon, {
                              className: "size-4 text-muted-foreground",
                            })}
                          {opt.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          );
        }

        return (
          <Select
            value={String(value ?? "")}
            onValueChange={handleSelectChange}
            disabled={disabled}
            required={required}
          >
            {selectTrigger}
            <SelectContent>
              <SelectGroup>
                {options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="flex items-center gap-2">
                      {opt.color && (
                        <span
                          className="size-3 rounded-full shrink-0 border border-border/40 inline-block"
                          style={{ backgroundColor: opt.color }}
                        />
                      )}
                      {opt.icon && !opt.color &&
                        React.createElement(opt.icon, {
                          className: "size-4 text-muted-foreground",
                        })}
                      {opt.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        );
      }

      case "combobox":
        return (
          <ComboboxField
            fieldId={fieldId}
            value={value}
            onChange={onChange}
            options={options}
            placeholder={placeholder}
            disabled={disabled}
            error={error}
            inputClassName={inputClassName}
          />
        );

      case "color":
        return (
          <ColorField
            fieldId={fieldId}
            value={value}
            onChange={onChange}
            options={options}
            disabled={disabled}
            error={error}
            inputClassName={inputClassName}
          />
        );

      case "date":
        return (
          <DateInputField
            fieldId={fieldId}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            error={error}
            inputClassName={inputClassName}
          />
        );

      case "radio":
        return (
          <RadioGroup
            id={fieldId}
            value={String(value ?? "")}
            onValueChange={handleSelectChange}
            disabled={disabled}
            className={cn("flex flex-row flex-wrap gap-4", inputClassName)}
          >
            {options.map((opt) => {
              const isSelected = String(value ?? "") === opt.value;
              return (
                <div key={opt.value} className="flex items-center">
                  <RadioGroupItem
                    value={opt.value}
                    id={`${fieldId}-${opt.value}`}
                    className="sr-only"
                  />
                  <Label
                    htmlFor={`${fieldId}-${opt.value}`}
                    className={cn(
                      "inline-flex items-center gap-2 text-sm font-medium transition-colors hover:cursor-pointer select-none",
                      isSelected ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                      disabled && "pointer-events-none opacity-50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-full border-1 transition-colors",
                        isSelected ? "border-primary" : "border-muted-foreground/50",
                      )}
                    >
                      {isSelected && (
                        <span className="size-2 rounded-full bg-primary" />
                      )}
                    </span>
                    {opt.label}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        );

      case "checkbox":
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              id={fieldId}
              name={name}
              checked={!!value}
              onCheckedChange={handleCheckedChange}
              disabled={disabled}
              required={required}
              aria-invalid={baseInvalid || undefined}
            />
            {checkLabel && (
              <Label
                htmlFor={fieldId}
                className="text-sm font-normal leading-snug hover:cursor-pointer"
              >
                {checkLabel}
              </Label>
            )}
          </div>
        );

      case "switch":
        return (
          <div className="flex items-center gap-2">
            <Switch
              id={fieldId}
              name={name}
              checked={!!value}
              onCheckedChange={handleCheckedChange}
              disabled={disabled}
              required={required}
              aria-invalid={baseInvalid || undefined}
            />
            {checkLabel && (
              <Label
                htmlFor={fieldId}
                className="text-sm font-normal leading-snug hover:cursor-pointer"
              >
                {checkLabel}
              </Label>
            )}
          </div>
        );

      case "async-select":
        return fetchOptions ? (
          <AsyncSelectField
            fieldId={fieldId}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            error={error}
            inputClassName={inputClassName}
            fetchOptions={fetchOptions}
            pageSize={pageSize}
            externalSelectedLabel={selectedLabel}
            externalSelectedColor={selectedColor}
          />
        ) : null;

      case "json":
        return (
          <JsonEditorField
            fieldId={fieldId}
            name={name}
            value={String(value ?? "")}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            rows={rows}
            error={error}
            autoFocus={autoFocus}
            inputClassName={inputClassName}
          />
        );

      case "richtext":
        return (
          <div
            className={cn(
              "w-full rounded-md",
              error && "ring-2 ring-destructive/30 rounded-md",
              inputClassName,
            )}
            style={{ minHeight: richTextMinHeight }}
          >
            <SectionPlateEditor
              initialValue={richTextValue}
              isEditing={!disabled && !readOnly}
              hideActions={true}
              enableComments={false}
              enableCreateSection={false}
              onValueChange={onRichTextChange}
            />
          </div>
        );

      case "file":
        return (
          <FileInputField
            fieldId={fieldId}
            name={name}
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            required={required}
            autoFocus={autoFocus}
            error={error}
            inputClassName={inputClassName}
            onChange={handleInputChange}
            onFileChange={onFileChange}
          />
        );

      case "datetime":
        return (
          <Input
            id={fieldId}
            name={name}
            type="datetime-local"
            value={String(value ?? "")}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            autoFocus={autoFocus}
            aria-invalid={baseInvalid || undefined}
            className={inputClassName}
          />
        );

      // text, email, password, number, tel, url, time
      default:
        return (
          <Input
            id={fieldId}
            name={name}
            type={type}
            value={String(value ?? "")}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            autoFocus={autoFocus}
            autoComplete={autoComplete}
            min={min}
            max={max}
            step={step}
            aria-invalid={baseInvalid || undefined}
            className={inputClassName}
          />
        );
    }
  }

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div
      role="group"
      data-slot="huemul-field"
      data-invalid={!!error || undefined}
      data-disabled={disabled || undefined}
      className={cn(
        "flex w-full gap-1.5",
        isInline ? "flex-col" : "flex-col",
        className,
      )}
    >
      {/* ── Inline row (switch/checkbox) or stacked label+control ── */}
      {isInline ? (
        <div className={cn(
          "flex flex-row gap-3",
          labelFirst ? "items-center justify-between max-w-sm" : "items-center",
        )}>
          {/* Label row (left) */}
          {labelFirst && (
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-1">
                <Label
                  htmlFor={fieldId}
                  className={cn(
                    "text-sm font-medium leading-snug",
                    disabled && "opacity-50",
                  )}
                >
                  {label}
                </Label>
                {required && (
                  <Asterisk
                    className="size-3 text-destructive shrink-0"
                    aria-label="required"
                  />
                )}
                {helpText && <FieldHelpButton helpText={helpText} />}
                {labelAction && <FieldLabelAction action={labelAction} />}
              </div>
              {description && !error && (
                <p className="text-muted-foreground text-sm leading-normal">
                  {description}
                </p>
              )}
            </div>
          )}
          {/* Control */}
          <div className="shrink-0">{renderControl()}</div>
          {/* Label row (right) */}
          {!labelFirst && <div className="flex items-center gap-1">
            <Label
              htmlFor={fieldId}
              className={cn(
                "text-sm font-medium leading-snug",
                disabled && "opacity-50",
              )}
            >
              {label}
            </Label>

            {required && (
              <Asterisk
                className="size-3 text-destructive shrink-0"
                aria-label="required"
              />
            )}

            {helpText && <FieldHelpButton helpText={helpText} />}

            {labelAction && <FieldLabelAction action={labelAction} />}
          </div>}
        </div>
      ) : (
        <>
          {/* ── Label row ──────────────────────────────────────── */}
          {(label || required || helpText || labelAction) && (
          <div className="flex items-center gap-1">
            {label && (
            <Label
              htmlFor={fieldId}
              className={cn(
                "text-sm font-medium leading-snug",
                disabled && "opacity-50",
              )}
            >
              {label}
            </Label>
            )}

            {required && (
              <Asterisk
                className="size-3 text-destructive shrink-0"
                aria-label="required"
              />
            )}

            {helpText && <FieldHelpButton helpText={helpText} />}

            {labelAction && <FieldLabelAction action={labelAction} />}
          </div>
          )}

          {/* ── Control ────────────────────────────────────────── */}
          <div className={controlClassName}>{renderControl()}</div>
        </>
      )}

      {/* ── Children slot ───────────────────────────────────────── */}
      {children && <div className="mt-1.5">{children}</div>}

      {/* ── Description (stacked layout only; inline uses inline description) ── */}
      {description && !error && !isInline && (
        <p className="text-muted-foreground text-sm leading-normal">
          {description}
        </p>
      )}

      {/* ── Error ──────────────────────────────────────────────── */}
      {error && (
        <p
          role="alert"
          className="text-destructive text-sm font-normal"
        >
          {error}
        </p>
      )}
    </div>
  );
}

// ── FieldGroup helper ──────────────────────────────────────────────────────

export interface HuemulFieldGroupProps {
  /** Group title (rendered as a legend) */
  title?: string;
  /** Optional description */
  description?: string;
  /** Gap between fields (default: "gap-5") */
  gap?: string;
  /** Additional className */
  className?: string;
  /** Children (HuemulField components) */
  children: React.ReactNode;
}

export function HuemulFieldGroup({
  title,
  description,
  gap = "gap-5",
  className,
  children,
}: HuemulFieldGroupProps) {
  return (
    <fieldset
      data-slot="huemul-field-group"
      className={cn("flex flex-col", gap, className)}
    >
      {title && (
        <legend className="mb-1 text-base font-medium">{title}</legend>
      )}
      {description && (
        <p className="text-muted-foreground text-sm -mt-1 mb-2">
          {description}
        </p>
      )}
      {children}
    </fieldset>
  );
}
