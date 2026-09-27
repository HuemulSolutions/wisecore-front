import { useTranslation } from "react-i18next";
import { HuemulField } from "@/huemul/components/huemul-field";
import type {
  ConditionalCalculationConfig,
  FormulaCalculationConfig,
  SectionFormField,
} from "@/types/sections/core";
import {
  CALCULATED_CONDITIONAL_DATA_TYPES,
  FORMULA_QUESTION_TYPE,
  customFieldDataTypeLabel,
  type FormFieldDraft,
} from "./question-type-meta";
import { validateCalculationConfig } from "./validate-calculation-config";
import { SectionFormulaTermsEditor } from "./section-formula-terms-editor";
import { SectionConditionalRuleEditor } from "./section-conditional-rule-editor";

interface SectionCalculatedFieldEditorProps {
  field: FormFieldDraft;
  availableFields: SectionFormField[];
  isPending?: boolean;
  onUpdate: (patch: Partial<SectionFormField>) => void;
}

const DEFAULT_FORMULA_CONFIG: FormulaCalculationConfig = { mode: "formula", terms: [], constant: 0, round_decimals: 2 };
const DEFAULT_CONDITIONAL_CONFIG: ConditionalCalculationConfig = {
  mode: "conditional",
  root: { if: [], then: { type: "value", value: null }, else: { type: "value", value: null } },
};

// Punto de entrada único para configurar campo_calculado_formula/campo_calculado_condicional
// (ver ia context/campos-calculados-en-formularios-guide.md). Sin selector de modo: el modo
// lo determina el question_type, ya elegido en section-form-field-card.tsx.
export function SectionCalculatedFieldEditor({
  field,
  availableFields,
  isPending,
  onUpdate,
}: SectionCalculatedFieldEditorProps) {
  const { t } = useTranslation(["sections", "custom-fields"]);
  const errors = validateCalculationConfig(field, availableFields);
  const isFormula = field.question_type === FORMULA_QUESTION_TYPE;

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">{t("form.formFields.calculated.notAnswerable")}</p>

      {isFormula ? (
        <SectionFormulaTermsEditor
          config={field.calculation_config?.mode === "formula" ? field.calculation_config : DEFAULT_FORMULA_CONFIG}
          ownFieldId={field.field_id}
          availableFields={availableFields}
          errors={errors}
          onChange={(next) => onUpdate({ calculation_config: next })}
          disabled={isPending}
        />
      ) : (
        <>
          <HuemulField
            type="select"
            label={t("form.formFields.calculated.dataType")}
            required
            value={field.data_type ?? ""}
            onChange={(v) => onUpdate({ data_type: v as SectionFormField["data_type"] })}
            options={CALCULATED_CONDITIONAL_DATA_TYPES.map((dt) => ({
              value: dt,
              label: customFieldDataTypeLabel(dt, t),
            }))}
            placeholder={t("form.formFields.calculated.dataTypePlaceholder")}
            disabled={isPending}
          />
          <SectionConditionalRuleEditor
            rule={
              field.calculation_config?.mode === "conditional"
                ? field.calculation_config.root
                : DEFAULT_CONDITIONAL_CONFIG.root
            }
            dataType={field.data_type}
            ownFieldId={field.field_id}
            availableFields={availableFields}
            errors={errors}
            onChange={(root) => onUpdate({ calculation_config: { mode: "conditional", root } })}
            disabled={isPending}
          />
        </>
      )}
    </div>
  );
}
