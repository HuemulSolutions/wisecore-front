import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { HuemulField } from "@/huemul/components/huemul-field";
import { useCalculationAvailableFields } from "@/hooks/useCalculationAvailableFields";
import type {
  CalculationPickerContext,
  ConditionalCalculationConfig,
  SectionFormField,
} from "@/types/sections/core";
import {
  CALCULATED_CONDITIONAL_DATA_TYPES,
  FORMULA_QUESTION_TYPE,
  NUMERIC_DATA_TYPES,
  customFieldDataTypeLabel,
  type FormFieldDraft,
} from "./question-type-meta";
import { validateCalculationConfig } from "./validate-calculation-config";
import { SectionFormulaExpressionEditor, type FormulaPickerOption } from "./section-formula-expression-editor";
import { SectionConditionalRuleEditor } from "./section-conditional-rule-editor";
import { normalizeFormulaConfig } from "./formula-expression";

export interface FormulaPickerSource {
  context?: CalculationPickerContext;
  /** Preguntas anteriores dentro de la misma sección (el endpoint no las devuelve). */
  ownSectionFields: SectionFormField[];
}

interface SectionCalculatedFieldEditorProps {
  field: FormFieldDraft;
  availableFields: SectionFormField[];
  /** Solo campo_calculado_formula: origen del picker `@` (endpoint + preguntas previas de la propia sección). */
  formulaPicker?: FormulaPickerSource;
  isPending?: boolean;
  onUpdate: (patch: Partial<SectionFormField>) => void;
}

type PickerField = SectionFormField & { section_order?: number };

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
  formulaPicker,
  isPending,
  onUpdate,
}: SectionCalculatedFieldEditorProps) {
  const { t } = useTranslation(["sections", "custom-fields"]);
  const isFormula = field.question_type === FORMULA_QUESTION_TYPE;

  // Picker `@`: preguntas numéricas previas de la propia sección + campos de secciones
  // anteriores del endpoint (ya filtrados por el backend). Sin contexto, o mientras el
  // endpoint carga/falla, se cae a la lista local (mismas reglas de referencia).
  const remote = useCalculationAvailableFields(formulaPicker?.context, isFormula);
  const ownId = field.field_id.trim();
  const formulaFields = useMemo<PickerField[]>(() => {
    if (!isFormula) return [];
    const isNumericOther = (f: SectionFormField) =>
      NUMERIC_DATA_TYPES.includes(f.data_type as string) &&
      f.field_id.trim() !== "" &&
      f.field_id.trim() !== ownId;
    if (!formulaPicker?.context || !remote.data) return availableFields.filter(isNumericOther);

    const own = formulaPicker.ownSectionFields.filter(isNumericOther);
    const ownIds = new Set(own.map((f) => f.field_id));
    const remoteFields = remote.data
      .filter((r) => r.field_id !== ownId && !ownIds.has(r.field_id))
      .map(
        (r): PickerField => ({
          field_id: r.field_id,
          field_name: r.field_name,
          data_type: r.data_type as SectionFormField["data_type"],
          question_type: r.question_type,
          section_order: r.section_order,
        }),
      );
    return [...own, ...remoteFields];
  }, [isFormula, availableFields, formulaPicker, remote.data, ownId]);

  const errors = validateCalculationConfig(field, isFormula ? formulaFields : availableFields);
  const pickerOptions: FormulaPickerOption[] = formulaFields.map((f) => ({
    field_id: f.field_id,
    field_name: f.field_name,
    question_type: f.question_type,
    section_order: f.section_order,
  }));

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">{t("form.formFields.calculated.notAnswerable")}</p>

      {isFormula ? (
        <SectionFormulaExpressionEditor
          config={normalizeFormulaConfig(field.calculation_config?.mode === "formula" ? field.calculation_config : null)}
          options={pickerOptions}
          isLoadingOptions={remote.isLoading}
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
