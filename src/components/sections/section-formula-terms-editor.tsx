import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulField } from "@/huemul/components/huemul-field";
import type { FormulaCalculationConfig, FormulaTerm, FormulaTermOperator, SectionFormField } from "@/types/sections/core";
import { NUMERIC_DATA_TYPES, questionTypeIcon, questionTypeLabel } from "./question-type-meta";
import type { CalculationConfigError } from "./validate-calculation-config";
import { buildFormulaPreview } from "./formula-preview";

interface SectionFormulaTermsEditorProps {
  config: FormulaCalculationConfig;
  ownFieldId: string;
  availableFields: SectionFormField[];
  errors?: CalculationConfigError[];
  onChange: (config: FormulaCalculationConfig) => void;
  disabled?: boolean;
}

// Editor de términos de campo_calculado_formula: suma/resta de campos numéricos anteriores
// con multiplicador por término (ver ia context/campos-calculados-en-formularios-guide.md).
// El mismo field_id puede repetirse (patrón IVA: subtotal ×1 + subtotal ×0,19) — a
// diferencia de depends_on, acá el duplicado nunca se marca como error.
export function SectionFormulaTermsEditor({
  config,
  ownFieldId,
  availableFields,
  errors,
  onChange,
  disabled,
}: SectionFormulaTermsEditorProps) {
  const { t } = useTranslation("sections");
  const numericFields = availableFields.filter(
    (f) => NUMERIC_DATA_TYPES.includes(f.data_type as string) && f.field_id.trim() !== ownFieldId.trim(),
  );
  const terms = config.terms ?? [];

  const errorFor = (index: number) => errors?.find((e) => e.path === `terms[${index}]`)?.code;
  const termsMissing = errors?.some((e) => e.path === "terms" && e.code === "emptyTerms");

  const updateTerm = (index: number, patch: Partial<FormulaTerm>) => {
    onChange({ ...config, terms: terms.map((term, i) => (i === index ? { ...term, ...patch } : term)) });
  };
  const addTerm = () => {
    onChange({ ...config, terms: [...terms, { field_id: "", operator: "add", multiplier: 1 }] });
  };
  const removeTerm = (index: number) => {
    onChange({ ...config, terms: terms.filter((_, i) => i !== index) });
  };

  if (numericFields.length === 0) {
    return <p className="text-xs text-gray-400 italic">{t("form.formFields.calculated.formula.noNumericFields")}</p>;
  }

  return (
    <div className="space-y-3 rounded-md border border-gray-100 bg-gray-50 p-3">
      {terms.length === 0 ? (
        <p className="text-xs text-gray-500 italic">{t("form.formFields.calculated.formula.emptyState")}</p>
      ) : (
        <div className="space-y-2">
          {terms.map((term, index) => {
            const errorCode = errorFor(index);
            return (
              <div key={index} className="space-y-1">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-[6rem_1fr_6rem_auto] md:items-end">
                  <HuemulField
                    type="select"
                    label={t("form.formFields.calculated.formula.operator")}
                    value={term.operator}
                    onChange={(v) => updateTerm(index, { operator: v as FormulaTermOperator })}
                    options={[
                      { value: "add", label: t("form.formFields.calculated.formula.operatorAdd") },
                      { value: "subtract", label: t("form.formFields.calculated.formula.operatorSubtract") },
                    ]}
                    disabled={disabled}
                  />
                  <HuemulField
                    type="combobox"
                    label={t("form.formFields.calculated.formula.termField")}
                    value={term.field_id}
                    onChange={(v) => updateTerm(index, { field_id: v as string })}
                    options={numericFields.map((f) => ({
                      value: f.field_id,
                      label: f.field_name || f.field_id,
                      description: questionTypeLabel(f.question_type, t),
                      icon: questionTypeIcon(f.question_type),
                    }))}
                    placeholder={t("form.formFields.calculated.formula.termFieldPlaceholder")}
                    disabled={disabled}
                  />
                  <HuemulField
                    type="number"
                    label={t("form.formFields.calculated.formula.multiplier")}
                    value={term.multiplier ?? 1}
                    onChange={(v) => updateTerm(index, { multiplier: v === "" ? undefined : Number(v) })}
                    allowDecimal
                    disabled={disabled}
                  />
                  <HuemulButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTerm(index)}
                    disabled={disabled}
                    icon={Trash2}
                    tooltip={t("form.formFields.calculated.formula.removeTerm")}
                    className="h-8 w-8 shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  />
                </div>
                {errorCode && (
                  <p className="text-xs text-red-500">{t(`form.formFields.calculated.errors.${errorCode}`)}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {termsMissing && (
        <p className="text-xs text-red-500">{t("form.formFields.calculated.errors.emptyTerms")}</p>
      )}

      <HuemulButton
        type="button"
        variant="outline"
        size="sm"
        onClick={addTerm}
        disabled={disabled}
        icon={Plus}
        className="h-7 text-xs border-[#4464f7] text-[#4464f7] hover:bg-[#4464f7] hover:text-white"
      >
        {t("form.formFields.calculated.formula.addTerm")}
      </HuemulButton>

      <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
        <HuemulField
          type="number"
          label={t("form.formFields.calculated.formula.constant")}
          value={config.constant ?? 0}
          onChange={(v) => onChange({ ...config, constant: v === "" ? 0 : Number(v) })}
          allowDecimal
          disabled={disabled}
        />
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

      {terms.length > 0 && (
        <p className="text-xs text-gray-500">
          {t("form.formFields.calculated.formula.preview")}: {buildFormulaPreview(config, availableFields) || "—"}
        </p>
      )}
    </div>
  );
}
