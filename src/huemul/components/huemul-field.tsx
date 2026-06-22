import * as React from "react";
import { useTranslation } from "react-i18next";
import { HelpCircle, Asterisk, Check, ChevronsUpDown, X, CalendarIcon, UploadIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
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
import { type DateRange } from "react-day-picker";

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
          {selected ? format(selected, "d MMM yyyy", { locale: getBrowserDateLocale() }) : (placeholder || t('pickDate'))}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          locale={getBrowserDateLocale()}
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
  const [open, setOpen] = React.useState(false);

  // Derive initial mode from which values are set
  const [mode, setMode] = React.useState<'single' | 'range'>(
    valueFrom || valueTo ? 'range' : 'single',
  );

  const selectedSingle = dateValue ? parseISO(dateValue) : undefined;
  const selectedFrom = valueFrom ? parseISO(valueFrom) : undefined;
  const selectedTo = valueTo ? parseISO(valueTo) : undefined;
  const hasValue = mode === 'single' ? !!dateValue : !!(valueFrom || valueTo);

  let displayText: string;
  const browserLocale = getBrowserDateLocale();
  if (mode === 'single') {
    displayText = dateValue
      ? format(parseISO(dateValue), 'd MMM yyyy', { locale: browserLocale })
      : placeholder ?? t('anyDate');
  } else if (valueFrom && valueTo) {
    const from = parseISO(valueFrom);
    const to = parseISO(valueTo);
    const sameYear = from.getFullYear() === to.getFullYear();
    displayText = sameYear
      ? `${format(from, 'd MMM', { locale: browserLocale })} – ${format(to, 'd MMM yyyy', { locale: browserLocale })}`
      : `${format(from, 'd MMM yyyy', { locale: browserLocale })} – ${format(to, 'd MMM yyyy', { locale: browserLocale })}`;
  } else if (valueFrom) {
    displayText = `${t('dateFrom')} ${format(parseISO(valueFrom), 'd MMM yyyy', { locale: browserLocale })}`;
  } else if (valueTo) {
    displayText = `${t('dateTo')} ${format(parseISO(valueTo), 'd MMM yyyy', { locale: browserLocale })}`;
  } else {
    displayText = placeholder ?? t('anyDate');
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    if (mode === 'single') {
      onDateChange?.('');
    } else {
      onDateRangeChange?.('', '');
    }
  }

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
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                id={fieldId}
                type="button"
                variant="outline"
                disabled={disabled}
                aria-invalid={!!error || undefined}
                className={cn(
                  "w-full justify-start font-normal hover:cursor-pointer gap-2",
                  !hasValue && "text-muted-foreground",
                  error && "border-destructive ring-destructive/20 dark:ring-destructive/40",
                  inputClassName,
                )}
              >
                <CalendarIcon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate text-left">{displayText}</span>
                {hasValue && (
                  <span
                    role="button"
                    aria-label="Clear"
                    tabIndex={-1}
                    className="shrink-0 rounded-sm text-muted-foreground hover:text-foreground hover:cursor-pointer"
                    onClick={handleClear}
                  >
                    <X className="size-3.5" />
                  </span>
                )}
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          {hasValue && (
            <TooltipContent side="bottom">
              {displayText}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
      <PopoverContent className="w-auto p-0" align="start">
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
              locale={getBrowserDateLocale()}
              onSelect={(day) => {
                onDateChange?.(day ? day.toISOString() : '');
                if (day) setOpen(false);
              }}
            />
          ) : (
            <Calendar
              mode="range"
              defaultMonth={selectedFrom}
              locale={getBrowserDateLocale()}
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
            onKeyDown={onKeyDown}
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
