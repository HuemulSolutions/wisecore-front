import * as React from "react";
import { type LucideIcon, HelpCircle, Asterisk, Check, ChevronsUpDown, X } from "lucide-react";

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

// ── Types ──────────────────────────────────────────────────────────────────

export type HuemulFieldType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "tel"
  | "url"
  | "textarea"
  | "select"
  | "checkbox"
  | "switch"
  | "file"
  | "combobox"
  | "color";

export interface HuemulFieldOption {
  /** Display label */
  label: string;
  /** Underlying value */
  value: string;
  /** Optional description shown below the label in combobox items */
  description?: string;
  /** Optional icon for each option */
  icon?: LucideIcon;
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

  // ── File ──────────────────────────────────────────────────────────────
  /** Accept attribute for file inputs (e.g. "image/*,.pdf") */
  accept?: string;
  /** Allow multiple files */
  multiple?: boolean;

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

  // ── Layout ────────────────────────────────────────────────────────────
  /** Additional className on the outermost wrapper */
  className?: string;
  /** Additional className on the input / control element */
  inputClassName?: string;
  /** Auto-focus */
  autoFocus?: boolean;
  /** Autocomplete hint */
  autoComplete?: string;
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
            {selectedOption ? selectedOption.label : placeholder || "Select..."}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Input
            placeholder="Search..."
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
        <div className="max-h-60 overflow-y-auto p-1">
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
  accept,
  multiple,
  rows = 3,
  min,
  max,
  step,
  checkLabel,
  className,
  inputClassName,
  autoFocus,
  autoComplete,
}: HuemulFieldProps) {
  const fieldId = id || generateId(name, label);
  const isInline = type === "checkbox" || type === "switch";

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

      case "select":
        return (
          <Select
            value={String(value ?? "")}
            onValueChange={handleSelectChange}
            disabled={disabled}
            required={required}
          >
            <SelectTrigger
              id={fieldId}
              className={cn("w-full", inputClassName)}
              aria-invalid={baseInvalid || undefined}
            >
              <SelectValue placeholder={placeholder || "Select..."} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="flex items-center gap-2">
                      {opt.icon &&
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

      case "file":
        return (
          <Input
            id={fieldId}
            name={name}
            type="file"
            onChange={handleInputChange}
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            required={required}
            autoFocus={autoFocus}
            aria-invalid={baseInvalid || undefined}
            className={inputClassName}
          />
        );

      // text, email, password, number, tel, url
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
        isInline ? "flex-row items-start gap-3" : "flex-col",
        className,
      )}
    >
      {/* ── Label row ──────────────────────────────────────────── */}
      <div
        className={cn(
          "flex items-center gap-1",
          isInline && "order-2",
        )}
      >
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

      {/* ── Control ────────────────────────────────────────────── */}
      <div className={cn(isInline && "order-1")}>
        {renderControl()}
      </div>

      {/* ── Description ────────────────────────────────────────── */}
      {description && !error && (
        <p
          className={cn(
            "text-muted-foreground text-sm leading-normal",
            isInline && "order-3",
          )}
        >
          {description}
        </p>
      )}

      {/* ── Error ──────────────────────────────────────────────── */}
      {error && (
        <p
          role="alert"
          className={cn(
            "text-destructive text-sm font-normal",
            isInline && "order-3",
          )}
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
