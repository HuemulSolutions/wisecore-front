import * as React from "react";
import { useTranslation } from "react-i18next";
import { HelpCircle, Asterisk, Check, ChevronsUpDown, X, CalendarIcon, UploadIcon, Star, Clock } from "lucide-react";
import { format, parse, parseISO, isValid } from "date-fns";
import { ar, de, enUS, es, fr, it, ja, ptBR, zhCN, type Locale } from "date-fns/locale";
import { tokenize, tokenStyle } from "./json-viewer";
import type {
  HuemulFieldType,
  HuemulFieldOption,
  HuemulFieldOptionGroup,
  AsyncSelectOption,
  FetchOptionsParams,
  FetchOptionsResult,
  HuemulFieldLabelAction,
  HuemulFieldProps,
  HuemulFieldGroupProps,
} from "@/types/huemul"
export type {
  HuemulFieldType,
  HuemulFieldOption,
  HuemulFieldOptionGroup,
  AsyncSelectOption,
  FetchOptionsParams,
  FetchOptionsResult,
  HuemulFieldLabelAction,
  HuemulFieldProps,
  HuemulFieldGroupProps,
}

import SectionPlateEditor from "@/components/plate-editor/section-plate-editor";
import { HuemulCombobox } from "@/huemul/components/huemul-combobox";

import { cn } from "@/lib/utils";
import { NUMERIC_DATE_PATTERN } from "@/lib/format-date-range";
import { DEFAULT_SWATCH_COLORS } from "@/huemul/constants";
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
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { type DateRange } from "react-day-picker";

// Sentinel para el ítem "sin valor" de type="select"/"radio" (Radix prohíbe value="").
const EMPTY_OPTION_VALUE = "__huemul_empty__";

// ── Browser locale helper ─────────────────────────────────────────────────

const DATE_FNS_LOCALE_MAP: Record<string, Locale> = {
  ar, de, fr, it, ja,
  es, 'es-419': es, 'es-AR': es, 'es-MX': es, 'es-CL': es, 'es-CO': es,
  en: enUS, 'en-US': enUS, 'en-GB': enUS, 'en-AU': enUS,
  pt: ptBR, 'pt-BR': ptBR, 'pt-PT': ptBR,
  zh: zhCN, 'zh-CN': zhCN, 'zh-TW': zhCN,
};

function getBrowserDateLocale(): Locale {
  const lang = typeof navigator !== 'undefined' ? navigator.language : 'en';
  return DATE_FNS_LOCALE_MAP[lang]
    ?? DATE_FNS_LOCALE_MAP[lang.split('-')[0]]
    ?? enUS;
}

// ── Number locale helpers ───────────────────────────────────────────────────

// Decimal separator for the browser's locale ("," for es-CL, "." for en-US, etc).
function getDecimalSeparator(): "," | "." {
  try {
    const lang = typeof navigator !== 'undefined' ? navigator.language : 'en';
    const part = new Intl.NumberFormat(lang).formatToParts(1.1).find((p) => p.type === "decimal");
    return part?.value === "," ? "," : ".";
  } catch {
    return ".";
  }
}

// Parses user-typed decimal text tolerating either "," or "." as the separator.
// Returns null for incomplete/invalid states (e.g. "", "-", "1,", "1,,") — the
// caller treats null as "still typing", not as a value to emit.
function parseDecimalText(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

// No thousands grouping — decimal capture only. `minDecimals` pads the fractional
// part with trailing zeros (e.g. 567 -> "567,0") so a decimal field stays visually
// distinct from an integer one even when the value has no fractional part.
function formatDecimalText(n: number, sep: "," | ".", minDecimals = 0): string {
  const [int, frac = ""] = String(n).split(".");
  const padded = frac.padEnd(minDecimals, "0");
  return padded ? `${int}${sep}${padded}` : int;
}

// Filters keystrokes without reformatting: digits, one leading "-", and at most
// one decimal separator (typed as "," or ".", always displayed as `sep`).
function sanitizeNumberText(raw: string, sep: "," | ".", allowDecimal: boolean): string {
  let out = "";
  let seenSeparator = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === "-") {
      if (i === 0) out += ch;
    } else if (ch === "," || ch === ".") {
      if (allowDecimal && !seenSeparator) {
        out += sep;
        seenSeparator = true;
      }
    } else if (ch >= "0" && ch <= "9") {
      out += ch;
    }
  }
  return out;
}

// ── Date/Time helpers ──────────────────────────────────────────────────────

// Localized short date pattern (e.g. "MM/dd/yyyy" en, "dd/MM/yyyy" es), used for
// both display (`format`) and typed input parsing (`parse`) so they stay in sync.
function getDatePattern(locale: Locale): string {
  const short = locale.formatLong?.date({ width: "short" }) ?? "dd/MM/yyyy";
  return short
    .replace(/y+/, "yyyy")
    .replace(/d+/, "dd")
    .replace(/M+/, "MM");
}

const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

// Pad a typed/partial "H:m" or "HH:mm:ss" string to canonical "HH:mm" or "HH:mm:ss".
function normalizeTime(str: string, withSeconds = true): string {
  const [h = "0", m = "0", s = "0"] = str.split(":");
  const pad = (n: string) => n.padStart(2, "0");
  return withSeconds
    ? `${pad(h)}:${pad(m)}:${pad(s)}`
    : `${pad(h)}:${pad(m)}`;
}

// Scrollable hour/minute(/second) columns shared by the time and datetime pickers.
// `value` is "HH:mm" or "HH:mm:ss"; `onChange` receives the recomposed string.
function TimeColumns({
  value,
  onChange,
  withSeconds = true,
}: {
  value: string;
  onChange: (next: string) => void;
  withSeconds?: boolean;
}) {
  const [h, m, s] = normalizeTime(value || "00:00:00").split(":");
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const seconds = Array.from({ length: 60 }, (_, i) => i);

  const set = (part: "h" | "m" | "s", n: number) => {
    const cur = normalizeTime(value || "00:00:00").split(":");
    const idx = part === "h" ? 0 : part === "m" ? 1 : 2;
    cur[idx] = String(n).padStart(2, "0");
    onChange(normalizeTime(cur.join(":"), withSeconds));
  };

  const Column = ({
    items,
    selected,
    part,
  }: {
    items: number[];
    selected: string;
    part: "h" | "m" | "s";
  }) => {
    const listRef = React.useRef<HTMLDivElement>(null);
    const selectedRef = React.useRef<HTMLButtonElement>(null);

    // Center the selected value when the popover opens / selection changes.
    React.useEffect(() => {
      const list = listRef.current;
      const el = selectedRef.current;
      if (list && el) {
        list.scrollTop = el.offsetTop - list.clientHeight / 2 + el.clientHeight / 2;
      }
    }, [selected]);

    return (
      <div
        ref={listRef}
        className="relative flex max-h-72 w-20 flex-col overflow-y-auto p-1"
        onWheel={(e) => e.stopPropagation()}
      >
        {items.map((n) => {
          const label = String(n).padStart(2, "0");
          const isSelected = label === selected;
          return (
            <button
              key={n}
              ref={isSelected ? selectedRef : undefined}
              type="button"
              onClick={() => set(part, n)}
              className={cn(
                "rounded-sm px-3 py-1.5 text-base tabular-nums outline-none hover:cursor-pointer",
                "hover:bg-accent hover:text-accent-foreground",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex divide-x divide-border">
      <Column items={hours} selected={h} part="h" />
      <Column items={minutes} selected={m} part="m" />
      {withSeconds && <Column items={seconds} selected={s} part="s" />}
    </div>
  );
}

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
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
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
                autoComplete="off"
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

// ── Color Swatches Field ────────────────────────────────────────────────────

function ColorSwatchesField({
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
  const color = String(value || "");
  const [inputValue, setInputValue] = React.useState(color);

  React.useEffect(() => {
    setInputValue(String(value || ""));
  }, [value]);

  const swatches = options && options.length > 0
    ? options.map((o) => o.value)
    : DEFAULT_SWATCH_COLORS;

  const handleSwatchClick = (swatchColor: string) => {
    setInputValue(swatchColor);
    onChange?.(swatchColor);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange?.(val);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {swatches.map((swatchColor) => {
          const isSelected = color.toLowerCase() === swatchColor.toLowerCase();
          return (
            <button
              key={swatchColor}
              type="button"
              disabled={disabled}
              aria-label={swatchColor}
              aria-pressed={isSelected}
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-md border transition-all hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
                isSelected
                  ? "border-ring ring-2 ring-ring ring-offset-2 ring-offset-background"
                  : "border-border",
              )}
              style={{ backgroundColor: swatchColor }}
              onClick={() => handleSwatchClick(swatchColor)}
            >
              {isSelected && <Check className="size-4 text-white" />}
            </button>
          );
        })}
      </div>
      <Input
        id={fieldId}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        disabled={disabled}
        aria-invalid={!!error || undefined}
        autoComplete="off"
        className={cn(
          "max-w-50 font-mono uppercase",
          error && "border-destructive ring-destructive/20 dark:ring-destructive/40",
          inputClassName,
        )}
        placeholder="#000000"
      />
    </div>
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
  const { t } = useTranslation('common');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFileName(
        files.length === 1
          ? files[0].name
          : t('filesSelected', { count: files.length }),
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
          {fileName ?? t('chooseFile')}
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
  const locale = getBrowserDateLocale();
  const pattern = getDatePattern(locale);

  const strValue = String(value ?? "");
  const selected = strValue ? parseISO(strValue) : undefined;

  const anchorRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date | undefined>(selected);
  const [text, setText] = React.useState(
    selected && isValid(selected) ? format(selected, pattern, { locale }) : "",
  );

  // Keep the visible text in sync when the controlled value changes externally.
  React.useEffect(() => {
    const next = strValue ? parseISO(strValue) : undefined;
    setText(next && isValid(next) ? format(next, pattern, { locale }) : "");
    if (next && isValid(next)) setMonth(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strValue]);

  const handleTextChange = (raw: string) => {
    setText(raw);
    if (!raw.trim()) {
      onChange?.("");
      return;
    }
    const parsed = parse(raw, pattern, new Date(), { locale });
    if (isValid(parsed)) {
      onChange?.(parsed.toISOString());
      setMonth(parsed);
    }
  };

  const handleBlur = () => {
    if (!text.trim()) {
      onChange?.("");
      return;
    }
    const parsed = parse(text, pattern, new Date(), { locale });
    if (isValid(parsed)) {
      setText(format(parsed, pattern, { locale }));
    } else {
      // Revert to the last valid value.
      setText(selected && isValid(selected) ? format(selected, pattern, { locale }) : "");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div ref={anchorRef} className="w-full">
        <InputGroup
          className={cn(
            error && "border-destructive ring-destructive/20 dark:ring-destructive/40",
            inputClassName,
          )}
        >
          <InputGroupInput
            id={fieldId}
            value={text}
            placeholder={placeholder || t('pickDate')}
            disabled={disabled}
            autoComplete="off"
            aria-invalid={!!error || undefined}
            onChange={(e) => handleTextChange(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setOpen(true);
              }
            }}
          />
          <InputGroupAddon align="inline-start">
            <PopoverTrigger asChild>
              <InputGroupButton
                variant="ghost"
                size="icon-xs"
                disabled={disabled}
                aria-label={t('selectDate')}
              >
                <CalendarIcon />
              </InputGroupButton>
            </PopoverTrigger>
          </InputGroupAddon>
        </InputGroup>
      </div>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        alignOffset={0}
        sideOffset={10}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          if (anchorRef.current?.contains(e.target as Node)) e.preventDefault();
        }}
      >
        <Calendar
          mode="single"
          selected={selected}
          month={month}
          onMonthChange={setMonth}
          captionLayout="dropdown"
          locale={locale}
          onSelect={(day) => {
            onChange?.(day ? day.toISOString() : "");
            setText(day ? format(day, pattern, { locale }) : "");
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

// ── Number Field ─────────────────────────────────────────────────────────

function NumberInputField({
  fieldId,
  name,
  value,
  onChange,
  placeholder,
  disabled,
  readOnly,
  required,
  autoFocus,
  autoComplete,
  allowDecimal = false,
  maxLength,
  onKeyDown,
  error,
  inputClassName,
}: {
  fieldId: string;
  name?: string;
  value?: string | number | boolean;
  onChange?: (value: string | number | boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;
  allowDecimal?: boolean;
  maxLength?: number;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  error?: string;
  inputClassName?: string;
}) {
  const sep = React.useMemo(getDecimalSeparator, []);
  // A decimal field always shows at least one decimal (567 -> "567,0") so it
  // stays visually distinct from an integer field. Integers never get one.
  const minDecimals = allowDecimal ? 1 : 0;

  const toDisplay = (v?: string | number | boolean): string => {
    if (v === "" || v === null || v === undefined) return "";
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? formatDecimalText(n, sep, minDecimals) : "";
  };

  const [text, setText] = React.useState(() => toDisplay(value));

  // Keep the visible text in sync when the controlled value changes externally,
  // but don't clobber an in-progress edit that already parses to the same number
  // (e.g. typing the trailing "0" of "567,0" while the prop still echoes back 567).
  React.useEffect(() => {
    const incoming = value === "" || value === null || value === undefined
      ? null
      : (typeof value === "number" ? value : Number(value));
    const current = parseDecimalText(text);
    if (incoming === current) return;
    setText(toDisplay(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, sep]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = sanitizeNumberText(e.target.value, sep, allowDecimal);
    setText(next);
    if (next === "") {
      onChange?.("");
      return;
    }
    const parsed = parseDecimalText(next);
    if (parsed !== null) onChange?.(parsed);
    // else: still mid-edit (trailing separator, lone "-", etc.) — don't emit yet.
  };

  const handleBlur = () => {
    if (text === "") return;
    const parsed = parseDecimalText(text);
    if (parsed === null) {
      setText(toDisplay(value));
      return;
    }
    // Preserve however many decimals the user typed, never fewer than the minimum.
    const typedDecimals = text.split(sep)[1]?.length ?? 0;
    setText(formatDecimalText(parsed, sep, Math.max(minDecimals, typedDecimals)));
  };

  return (
    <Input
      id={fieldId}
      name={name}
      type="text"
      inputMode={allowDecimal ? "decimal" : "numeric"}
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      autoFocus={autoFocus}
      autoComplete={autoComplete ?? "off"}
      maxLength={maxLength}
      aria-invalid={!!error || undefined}
      className={inputClassName}
    />
  );
}

// ── Time Field ──────────────────────────────────────────────────────────────

function TimeInputField({
  fieldId,
  value,
  onChange,
  placeholder,
  disabled,
  error,
  inputClassName,
  withSeconds = true,
}: {
  fieldId: string;
  value?: string | number | boolean;
  onChange?: (value: string | number | boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  inputClassName?: string;
  withSeconds?: boolean;
}) {
  const { t } = useTranslation('common');
  const strValue = String(value ?? "");
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState(strValue);

  React.useEffect(() => {
    setText(strValue);
  }, [strValue]);

  const handleTextChange = (raw: string) => {
    setText(raw);
    if (!raw.trim()) {
      onChange?.("");
      return;
    }
    if (TIME_RE.test(raw)) {
      onChange?.(normalizeTime(raw, withSeconds));
    }
  };

  const handleBlur = () => {
    if (!text.trim()) {
      onChange?.("");
      return;
    }
    if (TIME_RE.test(text)) {
      const normalized = normalizeTime(text, withSeconds);
      setText(normalized);
      onChange?.(normalized);
    } else {
      setText(strValue);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div ref={anchorRef} className="w-full">
        <InputGroup
          className={cn(
            error && "border-destructive ring-destructive/20 dark:ring-destructive/40",
            inputClassName,
          )}
        >
          <InputGroupInput
            id={fieldId}
            value={text}
            placeholder={placeholder || t('pickTime')}
            disabled={disabled}
            autoComplete="off"
            aria-invalid={!!error || undefined}
            onChange={(e) => handleTextChange(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setOpen(true);
              }
            }}
          />
          <InputGroupAddon align="inline-start">
            <PopoverTrigger asChild>
              <InputGroupButton
                variant="ghost"
                size="icon-xs"
                disabled={disabled}
                aria-label={t('selectTime')}
              >
                <Clock />
              </InputGroupButton>
            </PopoverTrigger>
          </InputGroupAddon>
        </InputGroup>
      </div>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        alignOffset={0}
        sideOffset={10}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          if (anchorRef.current?.contains(e.target as Node)) e.preventDefault();
        }}
      >
        <TimeColumns
          value={normalizeTime(strValue || "00:00:00", withSeconds)}
          withSeconds={withSeconds}
          onChange={(next) => {
            setText(next);
            onChange?.(next);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

// ── DateTime Field ────────────────────────────────────────────────────────

function DateTimeInputField({
  fieldId,
  value,
  onChange,
  placeholder,
  disabled,
  error,
  inputClassName,
  withSeconds = true,
}: {
  fieldId: string;
  value?: string | number | boolean;
  onChange?: (value: string | number | boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  inputClassName?: string;
  withSeconds?: boolean;
}) {
  const { t } = useTranslation('common');
  const locale = getBrowserDateLocale();
  const timeMask = withSeconds ? "HH:mm:ss" : "HH:mm";
  const pattern = `${getDatePattern(locale)} ${timeMask}`;
  const storePattern = withSeconds ? "yyyy-MM-dd'T'HH:mm:ss" : "yyyy-MM-dd'T'HH:mm";

  const strValue = String(value ?? "");
  // Stored as local "yyyy-MM-dd'T'HH:mm(:ss)" (no Z), like a native datetime-local input.
  const selected = strValue ? parseISO(strValue) : undefined;
  const hasValidValue = !!selected && isValid(selected);

  const anchorRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date | undefined>(
    hasValidValue ? selected : undefined,
  );
  const [text, setText] = React.useState(
    hasValidValue ? format(selected!, pattern, { locale }) : "",
  );

  React.useEffect(() => {
    const next = strValue ? parseISO(strValue) : undefined;
    const ok = !!next && isValid(next);
    setText(ok ? format(next!, pattern, { locale }) : "");
    if (ok) setMonth(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strValue]);

  const emit = (date: Date) => onChange?.(format(date, storePattern));

  const handleTextChange = (raw: string) => {
    setText(raw);
    if (!raw.trim()) {
      onChange?.("");
      return;
    }
    const parsed = parse(raw, pattern, new Date(), { locale });
    if (isValid(parsed)) {
      emit(parsed);
      setMonth(parsed);
    }
  };

  const handleBlur = () => {
    if (!text.trim()) {
      onChange?.("");
      return;
    }
    const parsed = parse(text, pattern, new Date(), { locale });
    if (isValid(parsed)) {
      setText(format(parsed, pattern, { locale }));
    } else {
      setText(hasValidValue ? format(selected!, pattern, { locale }) : "");
    }
  };

  // Current date+time as the base for popover edits (defaults to today @ 00:00:00).
  const base = hasValidValue ? selected! : new Date(new Date().setHours(0, 0, 0, 0));
  const timeStr = format(base, "HH:mm:ss");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div ref={anchorRef} className="w-full">
        <InputGroup
          className={cn(
            error && "border-destructive ring-destructive/20 dark:ring-destructive/40",
            inputClassName,
          )}
        >
          <InputGroupInput
            id={fieldId}
            value={text}
            placeholder={placeholder || t('pickDateTime')}
            disabled={disabled}
            autoComplete="off"
            aria-invalid={!!error || undefined}
            onChange={(e) => handleTextChange(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setOpen(true);
              }
            }}
          />
          <InputGroupAddon align="inline-start">
            <PopoverTrigger asChild>
              <InputGroupButton
                variant="ghost"
                size="icon-xs"
                disabled={disabled}
                aria-label={t('selectDate')}
              >
                <CalendarIcon />
              </InputGroupButton>
            </PopoverTrigger>
          </InputGroupAddon>
        </InputGroup>
      </div>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        alignOffset={0}
        sideOffset={10}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          if (anchorRef.current?.contains(e.target as Node)) e.preventDefault();
        }}
      >
        <div className="flex items-start">
          <Calendar
            mode="single"
            selected={hasValidValue ? selected : undefined}
            month={month}
            onMonthChange={setMonth}
            captionLayout="dropdown"
            locale={locale}
            onSelect={(day) => {
              if (!day) return;
              const [h, m, s] = timeStr.split(":").map(Number);
              const next = new Date(day);
              next.setHours(h, m, s, 0);
              emit(next);
              setText(format(next, pattern, { locale }));
              setMonth(next);
            }}
          />
          <div className="border-l border-border">
            <TimeColumns
              value={timeStr}
              withSeconds={withSeconds}
              onChange={(nextTime) => {
                const [h, m, s = 0] = nextTime.split(":").map(Number);
                const next = new Date(base);
                next.setHours(h, m, s, 0);
                emit(next);
                setText(format(next, pattern, { locale }));
                setMonth(next);
              }}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Async Select Field ────────────────────────────────────────────────────

function DateRangeField({
  fieldId,
  dateValue,
  valueFrom,
  valueTo,
  onDateChange,
  onDateRangeChange,
  placeholder,
  disabled,
  error,
  inputClassName,
}: {
  fieldId: string;
  dateValue?: string;
  valueFrom?: string;
  valueTo?: string;
  onDateChange?: (value: string) => void;
  onDateRangeChange?: (from: string, to: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  inputClassName?: string;
}) {
  const { t } = useTranslation('common');
  const locale = getBrowserDateLocale();
  const pattern = NUMERIC_DATE_PATTERN; // "dd/MM/yyyy"

  const [open, setOpen] = React.useState(false);

  // Derive initial mode from which values are set
  const [mode, setMode] = React.useState<'single' | 'range'>(
    valueFrom || valueTo ? 'range' : 'single',
  );

  const selectedSingle = dateValue ? parseISO(dateValue) : undefined;
  const selectedFrom = valueFrom ? parseISO(valueFrom) : undefined;
  const selectedTo = valueTo ? parseISO(valueTo) : undefined;

  const anchorRef = React.useRef<HTMLDivElement>(null);
  const [month, setMonth] = React.useState<Date | undefined>(
    selectedSingle ?? selectedFrom,
  );

  const fmt = (d?: Date) => (d && isValid(d) ? format(d, pattern, { locale }) : "");

  // Visible text for each input (kept in sync with the controlled ISO values).
  const [text, setText] = React.useState(fmt(selectedSingle));
  const [textFrom, setTextFrom] = React.useState(fmt(selectedFrom));
  const [textTo, setTextTo] = React.useState(fmt(selectedTo));

  React.useEffect(() => {
    const d = dateValue ? parseISO(dateValue) : undefined;
    setText(fmt(d));
    if (d && isValid(d)) setMonth(d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateValue]);

  React.useEffect(() => {
    const d = valueFrom ? parseISO(valueFrom) : undefined;
    setTextFrom(fmt(d));
    if (d && isValid(d)) setMonth(d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueFrom]);

  React.useEffect(() => {
    setTextTo(fmt(valueTo ? parseISO(valueTo) : undefined));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueTo]);

  // ── Single-mode typing ─────────────────────────────────────────────────────
  const handleSingleChange = (raw: string) => {
    setText(raw);
    if (!raw.trim()) {
      onDateChange?.('');
      return;
    }
    const parsed = parse(raw, pattern, new Date(), { locale });
    if (isValid(parsed)) {
      onDateChange?.(parsed.toISOString());
      setMonth(parsed);
    }
  };

  const handleSingleBlur = () => {
    if (!text.trim()) {
      onDateChange?.('');
      return;
    }
    const parsed = parse(text, pattern, new Date(), { locale });
    setText(isValid(parsed) ? fmt(parsed) : fmt(selectedSingle));
  };

  // ── Range-mode typing ──────────────────────────────────────────────────────
  const handleRangeChange = (which: 'from' | 'to', raw: string) => {
    if (which === 'from') setTextFrom(raw);
    else setTextTo(raw);

    let fromIso = valueFrom ?? '';
    let toIso = valueTo ?? '';
    if (!raw.trim()) {
      if (which === 'from') fromIso = '';
      else toIso = '';
      onDateRangeChange?.(fromIso, toIso);
      return;
    }
    const parsed = parse(raw, pattern, new Date(), { locale });
    if (isValid(parsed)) {
      if (which === 'from') fromIso = parsed.toISOString();
      else toIso = parsed.toISOString();
      onDateRangeChange?.(fromIso, toIso);
      setMonth(parsed);
    }
  };

  const handleRangeBlur = (which: 'from' | 'to') => {
    const value = which === 'from' ? textFrom : textTo;
    const selected = which === 'from' ? selectedFrom : selectedTo;
    const setTxt = which === 'from' ? setTextFrom : setTextTo;
    if (!value.trim()) return;
    const parsed = parse(value, pattern, new Date(), { locale });
    setTxt(isValid(parsed) ? fmt(parsed) : fmt(selected));
  };

  function handleModeChange(next: 'single' | 'range') {
    if (next === mode) return;
    setMode(next);
    // Clear the outgoing mode values
    if (next === 'range') {
      onDateChange?.('');
    } else {
      onDateRangeChange?.('', '');
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div ref={anchorRef} className="w-full">
        {mode === 'single' ? (
          <InputGroup
            className={cn(
              error && "border-destructive ring-destructive/20 dark:ring-destructive/40",
              inputClassName,
            )}
          >
            <InputGroupInput
              id={fieldId}
              value={text}
              placeholder={placeholder || t('pickDate')}
              disabled={disabled}
              autoComplete="off"
              aria-invalid={!!error || undefined}
              onChange={(e) => handleSingleChange(e.target.value)}
              onFocus={() => setOpen(true)}
              onBlur={handleSingleBlur}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setOpen(true);
                }
              }}
            />
            <InputGroupAddon align="inline-start">
              <PopoverTrigger asChild>
                <InputGroupButton
                  variant="ghost"
                  size="icon-xs"
                  disabled={disabled}
                  aria-label={t('selectDate')}
                >
                  <CalendarIcon />
                </InputGroupButton>
              </PopoverTrigger>
            </InputGroupAddon>
            {!!dateValue && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  variant="ghost"
                  size="icon-xs"
                  disabled={disabled}
                  aria-label="Clear"
                  onClick={() => onDateChange?.('')}
                >
                  <X />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>
        ) : (
          <div className="flex w-full items-center gap-2">
            <InputGroup
              className={cn(
                "flex-1",
                error && "border-destructive ring-destructive/20 dark:ring-destructive/40",
                inputClassName,
              )}
            >
              <InputGroupInput
                id={fieldId}
                value={textFrom}
                placeholder={t('dateFrom')}
                aria-label={t('dateFrom')}
                disabled={disabled}
                autoComplete="off"
                aria-invalid={!!error || undefined}
                onChange={(e) => handleRangeChange('from', e.target.value)}
                onFocus={() => setOpen(true)}
                onBlur={() => handleRangeBlur('from')}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setOpen(true);
                  }
                }}
              />
              <InputGroupAddon align="inline-start">
                <PopoverTrigger asChild>
                  <InputGroupButton
                    variant="ghost"
                    size="icon-xs"
                    disabled={disabled}
                    aria-label={t('selectDate')}
                  >
                    <CalendarIcon />
                  </InputGroupButton>
                </PopoverTrigger>
              </InputGroupAddon>
            </InputGroup>
            <span className="shrink-0 text-muted-foreground">–</span>
            <InputGroup
              className={cn(
                "flex-1",
                error && "border-destructive ring-destructive/20 dark:ring-destructive/40",
              )}
            >
              <InputGroupInput
                value={textTo}
                placeholder={t('dateTo')}
                aria-label={t('dateTo')}
                disabled={disabled}
                autoComplete="off"
                aria-invalid={!!error || undefined}
                onChange={(e) => handleRangeChange('to', e.target.value)}
                onFocus={() => setOpen(true)}
                onBlur={() => handleRangeBlur('to')}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setOpen(true);
                  }
                }}
              />
            </InputGroup>
          </div>
        )}
      </div>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        alignOffset={0}
        sideOffset={10}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          if (anchorRef.current?.contains(e.target as Node)) e.preventDefault();
        }}
      >
        <div className="flex flex-col">
          {/* Mode toggle */}
          <div className="flex rounded-none border-b border-border overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => handleModeChange('single')}
              className={cn(
                "flex-1 px-3 py-2 hover:cursor-pointer transition-colors",
                mode === 'single'
                  ? "bg-primary text-primary-foreground font-medium"
                  : "bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              {t('dateSingle')}
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('range')}
              className={cn(
                "flex-1 px-3 py-2 hover:cursor-pointer transition-colors border-l border-border",
                mode === 'range'
                  ? "bg-primary text-primary-foreground font-medium"
                  : "bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              {t('dateRange')}
            </button>
          </div>

          {mode === 'single' ? (
            <Calendar
              mode="single"
              selected={selectedSingle}
              month={month}
              onMonthChange={setMonth}
              captionLayout="dropdown"
              locale={locale}
              onSelect={(day) => {
                onDateChange?.(day ? day.toISOString() : '');
                if (day) setOpen(false);
              }}
            />
          ) : (
            <Calendar
              mode="range"
              month={month}
              onMonthChange={setMonth}
              locale={locale}
              selected={{
                from: selectedFrom,
                to: selectedTo,
              } as DateRange}
              onSelect={(range) => {
                onDateRangeChange?.(
                  range?.from ? range.from.toISOString() : '',
                  range?.to ? range.to.toISOString() : '',
                );
              }}
              numberOfMonths={2}
            />
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
          autoComplete="off"
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
  emptyOptionLabel,
  accept,
  multiple,
  onFileChange,
  rows = 3,
  maxLength,
  showCharCount,
  min,
  max,
  step,
  allowDecimal = false,
  withSeconds = true,
  checkLabel,
  richTextValue,
  onRichTextChange,
  richTextMinHeight = "200px",
  dateRangeFrom,
  dateRangeTo,
  onDateRangeChange,
  dateValue,
  onDateChange,
  className,
  inputClassName,
  autoFocus,
  autoComplete,
  inline,
  labelFirst,
  fetchOptions,
  pageSize = 10,
  debounceMs,
  selectedLabel,
  selectedColor,
  onSelectedLabelChange,
  asyncStaticOptions,
  asyncStaticOptionsLabel,
  asyncResultsLabel,
  selectSize = "default",
  controlClassName,
  children,
  onKeyDown,
  searchOnEnter,
  minLabel,
  maxLabel,
}: HuemulFieldProps) {
  const fieldId = id || generateId(name, label);
  const isInline = (type === "checkbox" || type === "switch") && inline !== false;
  const { t } = useTranslation('common');

  // ── Handlers ────────────────────────────────────────────────────────

  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (type === "file") {
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
      onChange?.(val === EMPTY_OPTION_VALUE ? "" : val);
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
            maxLength={maxLength}
            required={required}
            autoFocus={autoFocus}
            autoComplete="off"
            aria-invalid={baseInvalid || undefined}
            className={inputClassName}
          />
        );

      case "select": {
        const currentValue = String(value ?? "")
        const flatOptions = groupedOptions
          ? groupedOptions.flatMap((g) => [
              ...(g.groupValue ? [{ value: g.groupValue, label: g.groupLabel }] : []),
              ...g.options,
            ])
          : options
        const selectedOpt = flatOptions.find((o) => o.value === currentValue)
        const selectedLabel = selectedOpt?.label
        const selectedColor = selectedOpt?.color

        const selectTrigger = (
          <SelectTrigger
            id={fieldId}
            size={selectSize}
            className={cn("w-full", inputClassName)}
            aria-invalid={baseInvalid || undefined}
          >
            <SelectValue placeholder={placeholder || t('selectPlaceholder')}>
              {selectedLabel && (
                <span className="flex items-center gap-2">
                  {selectedColor && (
                    <span
                      className="size-3 rounded-full shrink-0 border border-border/40 inline-block"
                      style={{ backgroundColor: selectedColor }}
                    />
                  )}
                  {selectedLabel}
                </span>
              )}
            </SelectValue>
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
                {emptyOptionLabel && (
                  <SelectItem value={EMPTY_OPTION_VALUE} className="text-muted-foreground italic">
                    {emptyOptionLabel}
                  </SelectItem>
                )}
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
                {emptyOptionLabel && (
                  <SelectItem value={EMPTY_OPTION_VALUE} className="text-muted-foreground italic">
                    {emptyOptionLabel}
                  </SelectItem>
                )}
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

      case "color-swatches":
        return (
          <ColorSwatchesField
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

      case "date-range":
        return (
          <DateRangeField
            fieldId={fieldId}
            dateValue={dateValue}
            valueFrom={dateRangeFrom}
            valueTo={dateRangeTo}
            onDateChange={onDateChange}
            onDateRangeChange={onDateRangeChange}
            placeholder={placeholder}
            disabled={disabled}
            error={error}
            inputClassName={inputClassName}
          />
        );

      case "radio": {
        const radioOptions = emptyOptionLabel
          ? [...options, { value: EMPTY_OPTION_VALUE, label: emptyOptionLabel }]
          : options;
        return (
          <RadioGroup
            id={fieldId}
            value={String(value ?? "")}
            onValueChange={handleSelectChange}
            disabled={disabled}
            className={cn("flex flex-row flex-wrap gap-4", inputClassName)}
          >
            {radioOptions.map((opt) => {
              const isSelected = String(value ?? "") === opt.value;
              const isEmptyOption = opt.value === EMPTY_OPTION_VALUE;
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
                      isEmptyOption && "italic",
                      disabled && "pointer-events-none opacity-50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
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
      }

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

      case "async-combobox":
        return fetchOptions ? (
          <HuemulCombobox
            id={fieldId}
            value={String(value ?? "")}
            onValueChange={(v) => onChange?.(v as string)}
            fetchOptions={fetchOptions}
            pageSize={pageSize}
            debounceMs={debounceMs}
            searchOnEnter={searchOnEnter}
            staticOptions={asyncStaticOptions}
            staticOptionsLabel={asyncStaticOptionsLabel}
            asyncResultsLabel={asyncResultsLabel}
            selectedOptions={
              value && selectedLabel
                ? [{ value: String(value), label: selectedLabel, color: selectedColor }]
                : []
            }
            onSelectedLabelChange={onSelectedLabelChange}
            placeholder={placeholder}
            error={error}
            disabled={disabled}
            className={inputClassName}
          />
        ) : null;

      case "yes-no": {
        return (
          <div className="flex items-center gap-2">
            {([true, false] as const).map((opt) => {
              const selected = value === opt;
              return (
                <button
                  key={String(opt)}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange?.(opt)}
                  className={cn(
                    "inline-flex h-9 items-center rounded-md border px-4 text-sm transition-colors",
                    selected
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : error
                        ? "border-destructive bg-white text-gray-600 hover:bg-gray-50"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
                    disabled && "pointer-events-none opacity-50",
                    inputClassName,
                  )}
                >
                  {opt ? t("yes") : t("no")}
                </button>
              );
            })}
          </div>
        );
      }

      case "linear-scale": {
        const scaleMin = typeof min === "number" ? min : 1;
        const scaleMax = typeof max === "number" ? max : 5;
        const steps =
          scaleMax > scaleMin && scaleMax - scaleMin <= 20
            ? Array.from({ length: scaleMax - scaleMin + 1 }, (_, i) => scaleMin + i)
            : [];
        return (
          <div className="w-fit max-w-full space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {steps.map((n) => {
                const selected = value === n;
                return (
                  <button
                    key={n}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange?.(n)}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-md border text-sm transition-colors",
                      selected
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : error
                          ? "border-destructive bg-white text-gray-600 hover:bg-gray-50"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
                      disabled && "pointer-events-none opacity-50",
                      inputClassName,
                    )}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            {(minLabel || maxLabel) && (
              <div className="flex justify-between text-xs text-gray-400">
                <span>{minLabel}</span>
                <span>{maxLabel}</span>
              </div>
            )}
          </div>
        );
      }

      case "rating": {
        const stars = typeof max === "number" ? max : 5;
        const current = typeof value === "number" ? value : 0;
        return (
          <div className="flex flex-wrap items-center gap-1">
            {Array.from({ length: stars }, (_, i) => {
              const n = i + 1;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && onChange?.(n)}
                  className={cn("p-0.5", disabled && "pointer-events-none opacity-50")}
                >
                  <Star
                    className={cn(
                      "size-6 transition-colors",
                      n <= current ? "fill-amber-400 text-amber-400" : "text-gray-300",
                    )}
                  />
                </button>
              );
            })}
          </div>
        );
      }

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

      case "time":
        return (
          <TimeInputField
            fieldId={fieldId}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            error={error}
            inputClassName={inputClassName}
            withSeconds={withSeconds}
          />
        );

      case "datetime":
        return (
          <DateTimeInputField
            fieldId={fieldId}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            error={error}
            inputClassName={inputClassName}
            withSeconds={withSeconds}
          />
        );

      case "number":
        return (
          <NumberInputField
            fieldId={fieldId}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            autoFocus={autoFocus}
            autoComplete={autoComplete}
            allowDecimal={allowDecimal}
            maxLength={maxLength}
            onKeyDown={onKeyDown}
            error={error}
            inputClassName={inputClassName}
          />
        );

      // text, email, password, tel, url
      default:
        return (
          <Input
            id={fieldId}
            name={name}
            type={type}
            value={String(value ?? "")}
            onChange={handleInputChange}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            autoFocus={autoFocus}
            autoComplete={autoComplete ?? "off"}
            min={min}
            max={max}
            step={step}
            maxLength={maxLength}
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
          {(label || required || helpText || labelAction || (showCharCount && maxLength != null)) && (
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

            {showCharCount && maxLength != null && (
              <span
                className={cn(
                  "ml-auto text-xs tabular-nums",
                  String(value ?? "").length >= maxLength
                    ? "text-destructive"
                    : "text-muted-foreground",
                )}
              >
                {String(value ?? "").length}/{maxLength}
              </span>
            )}
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
