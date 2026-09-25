import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AtSign } from "lucide-react";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulField } from "@/huemul/components/huemul-field";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { FormulaCalculationConfig } from "@/types/sections/core";
import { questionTypeIcon, questionTypeLabel } from "./question-type-meta";
import type { CalculationConfigError } from "./validate-calculation-config";
import { buildFormulaConfig, createFormulaTokenRegex } from "./formula-expression";

export interface FormulaPickerOption {
  field_id: string;
  field_name: string;
  question_type: string;
  /** order de la sección de origen; ausente si es de la propia sección. */
  section_order?: number;
}

interface SectionFormulaExpressionEditorProps {
  config: FormulaCalculationConfig;
  options: FormulaPickerOption[];
  isLoadingOptions?: boolean;
  errors?: CalculationConfigError[];
  onChange: (config: FormulaCalculationConfig) => void;
  disabled?: boolean;
}

// Menciones activas: `@` + letras/números/_ inmediatamente antes del cursor.
const ACTIVE_MENTION = /@([\p{L}\p{N}_]*)$/u;

// Editor de campo_calculado_formula: expresión aritmética libre con tokens `@field_id`
// (ver ia context/campos-calculados-en-formularios-guide.md). Textarea + lista de menciones
// al tipear `@`; `fields` se deriva siempre del texto, nunca se edita a mano.
export function SectionFormulaExpressionEditor({
  config,
  options,
  isLoadingOptions,
  errors,
  onChange,
  disabled,
}: SectionFormulaExpressionEditorProps) {
  const { t } = useTranslation("sections");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const matches = useMemo(() => {
    if (query === null) return [];
    const q = query.toLowerCase();
    return options.filter(
      (o) => o.field_id.toLowerCase().includes(q) || (o.field_name ?? "").toLowerCase().includes(q),
    );
  }, [options, query]);

  const optionById = useMemo(() => new Map(options.map((o) => [o.field_id, o])), [options]);
  const errorFor = (path: string) => errors?.find((e) => e.path === path)?.code;
  const expressionError = errorFor("expression");

  const emit = (expression: string) => onChange(buildFormulaConfig(expression, config.round_decimals));

  const detectMention = (value: string, caret: number) => {
    const match = ACTIVE_MENTION.exec(value.slice(0, caret));
    setQuery(match ? match[1] : null);
    setActiveIndex(0);
  };

  const handleTextChange = (value: string, caret: number) => {
    emit(value);
    detectMention(value, caret);
  };

  const insertMention = (option: FormulaPickerOption) => {
    const el = textareaRef.current;
    if (!el) return;
    const caret = el.selectionStart ?? config.expression.length;
    const before = config.expression.slice(0, caret).replace(ACTIVE_MENTION, "");
    const after = config.expression.slice(caret);
    const inserted = `@${option.field_id} `;
    emit(`${before}${inserted}${after}`);
    setQuery(null);
    const nextCaret = before.length + inserted.length;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(nextCaret, nextCaret);
    });
  };

  // Botón "insertar campo": abre la lista escribiendo un `@` en la posición del cursor.
  const openPicker = () => {
    const el = textareaRef.current;
    if (!el) return;
    const caret = el.selectionStart ?? config.expression.length;
    const next = `${config.expression.slice(0, caret)}@${config.expression.slice(caret)}`;
    emit(next);
    setQuery("");
    setActiveIndex(0);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caret + 1, caret + 1);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (query === null || matches.length === 0) {
      if (e.key === "Escape") setQuery(null);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % matches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + matches.length) % matches.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      insertMention(matches[activeIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setQuery(null);
    }
  };

  const tokens = useMemo(
    () => Array.from(config.expression.matchAll(createFormulaTokenRegex()), (m) => m[1]),
    [config.expression],
  );
  const uniqueTokens = useMemo(() => Array.from(new Set(tokens)), [tokens]);

  return (
    <div className="space-y-3 rounded-md border border-gray-100 bg-gray-50 p-3">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-medium text-gray-700">{t("form.formFields.calculated.formula.expression")}</label>
          <HuemulButton
            type="button"
            variant="outline"
            size="sm"
            onClick={openPicker}
            disabled={disabled}
            icon={AtSign}
            className="h-7 text-xs"
          >
            {t("form.formFields.calculated.formula.insertField")}
          </HuemulButton>
        </div>

        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={config.expression}
            rows={3}
            spellCheck={false}
            disabled={disabled}
            placeholder={t("form.formFields.calculated.formula.expressionPlaceholder")}
            aria-invalid={!!expressionError}
            className="bg-white font-mono text-sm"
            onChange={(e) => handleTextChange(e.target.value, e.target.selectionStart ?? e.target.value.length)}
            onKeyDown={handleKeyDown}
            onKeyUp={(e) => {
              if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
                detectMention(e.currentTarget.value, e.currentTarget.selectionStart ?? 0);
              }
            }}
            onClick={(e) => detectMention(e.currentTarget.value, e.currentTarget.selectionStart ?? 0)}
            onBlur={() => setQuery(null)}
          />

          {query !== null && (
            <ul
              role="listbox"
              className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-md"
            >
              {matches.length === 0 ? (
                <li className="px-3 py-2 text-xs text-gray-500 italic">
                  {isLoadingOptions ? t("form.formFields.calculated.formula.loadingFields") : t("form.formFields.calculated.formula.noMatches")}
                </li>
              ) : (
                matches.map((option, i) => {
                  const Icon = questionTypeIcon(option.question_type);
                  return (
                    <li
                      key={option.field_id}
                      role="option"
                      aria-selected={i === activeIndex}
                      // mouseDown (no click): el blur del textarea cerraría la lista antes del click.
                      onMouseDown={(e) => {
                        e.preventDefault();
                        insertMention(option);
                      }}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm",
                        i === activeIndex && "bg-gray-100",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                      <span className="truncate">{option.field_name || option.field_id}</span>
                      <span className="ml-auto shrink-0 font-mono text-[11px] text-gray-400">@{option.field_id}</span>
                      {option.section_order !== undefined && (
                        <span className="shrink-0 text-[11px] text-gray-400">
                          {t("form.formFields.calculated.formula.sectionLabel", { n: option.section_order })}
                        </span>
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </div>

        <p className="text-xs text-gray-500" title={t("form.formFields.calculated.formula.helpDetail")}>
          {t("form.formFields.calculated.formula.help")}
        </p>
        {expressionError && (
          <p className="text-xs text-red-500">{t(`form.formFields.calculated.errors.${expressionError}`)}</p>
        )}
      </div>

      {uniqueTokens.length > 0 && (
        <div className="space-y-1">
          <div className="flex flex-wrap gap-1.5">
            {uniqueTokens.map((id) => {
              const option = optionById.get(id);
              const error = errorFor(`field:${id}`);
              return (
                <span
                  key={id}
                  title={error ? t(`form.formFields.calculated.errors.${error}`) : `@${id}`}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-xs",
                    error || !option
                      ? "border-red-200 bg-red-50 text-red-600"
                      : "border-blue-200 bg-blue-50 text-blue-700",
                  )}
                >
                  {option ? option.field_name || id : t("form.formFields.calculated.formula.unknownField", { id })}
                  {option && (
                    <span className="ml-1 text-[10px] opacity-60">
                      {questionTypeLabel(option.question_type, t)}
                    </span>
                  )}
                </span>
              );
            })}
          </div>
          {uniqueTokens.map((id) => {
            const error = errorFor(`field:${id}`);
            return error ? (
              <p key={id} className="text-xs text-red-500">
                @{id}: {t(`form.formFields.calculated.errors.${error}`)}
              </p>
            ) : null;
          })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
        <HuemulField
          type="select"
          label={t("form.formFields.calculated.formula.roundDecimals")}
          value={config.round_decimals == null ? "none" : String(config.round_decimals)}
          onChange={(v) => onChange({ ...config, round_decimals: v === "none" ? null : Number(v) })}
          options={[
            { value: "none", label: t("form.formFields.calculated.formula.roundDecimalsNone") },
            ...[0, 1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: String(n) })),
          ]}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
