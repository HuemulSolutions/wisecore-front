import { useTranslation } from "react-i18next";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulField } from "@/huemul/components/huemul-field";
import { HuemulCheckboxGroup } from "@/huemul/components/huemul-checkbox-group";
import type { FieldDependencyCondition, FieldDependencyOperator, SectionFormField } from "@/types/sections/core";
import { NUMERIC_DATA_TYPES, QUESTION_TYPE, questionTypeIcon, questionTypeLabel, readFieldOptions } from "./question-type-meta";
import type { FieldDependencyErrorCode } from "./validate-form-field-dependencies";

// Bloque de filas target/operador/valor compartido por el editor de depends_on
// (SectionFormFieldDependencyEditor, que le agrega el switch de show_when_inactive) y por
// el `if` de campo_calculado_condicional (SectionConditionalRuleEditor). Extraído para que
// ninguno de los dos herede lo que no le corresponde: el switch de show_when_inactive no
// existe en calculation_config, y la validación de duplicados de depends_on no aplica ahí
// (un mismo field_id dos veces, ej. "gt 10 AND lt 20", es legítimo en un `if`).
export interface FormFieldConditionsEditorProps {
  conditions: FieldDependencyCondition[];
  availableFields: SectionFormField[];
  onChange: (conditions: FieldDependencyCondition[]) => void;
  disabled?: boolean;
  emptyFieldsMessage?: string;
  // Aviso opcional por campo target, mostrado como description/warning en vez del
  // tipo de pregunta en el picker de field_id (ej. "Falta en: Plantilla DAP").
  fieldWarningFor?: (field: SectionFormField) => string | undefined;
  // Errores por índice, calculados por el caller (cada caller valida distinto).
  errors?: { conditionIndex: number; code: FieldDependencyErrorCode }[];
  // Sin borde/fondo por fila: para anidarse dentro del árbol condicional.
  dense?: boolean;
  addConditionLabel?: string;
}

const NUMERIC_OPERATORS: FieldDependencyOperator[] = ["eq", "neq", "gt", "gte", "lt", "lte", "is_empty", "is_not_empty"];
const DROPDOWN_OPERATORS: FieldDependencyOperator[] = ["eq", "neq", "in", "not_in", "is_empty", "is_not_empty"];
const MULTI_SELECT_OPERATORS: FieldDependencyOperator[] = ["contains", "not_contains", "is_empty", "is_not_empty"];
const DEFAULT_OPERATORS: FieldDependencyOperator[] = ["eq", "neq", "is_empty", "is_not_empty"];

function operatorsForTarget(target?: SectionFormField): FieldDependencyOperator[] {
  if (!target) return DEFAULT_OPERATORS;
  if (NUMERIC_DATA_TYPES.includes(target.data_type as string)) return NUMERIC_OPERATORS;
  if (target.question_type === QUESTION_TYPE.dropdownMultiple) return MULTI_SELECT_OPERATORS;
  if (target.question_type === QUESTION_TYPE.dropdown || target.question_type === QUESTION_TYPE.multipleChoice) {
    return DROPDOWN_OPERATORS;
  }
  return DEFAULT_OPERATORS;
}

export function FormFieldConditionsEditor({
  conditions,
  availableFields,
  onChange,
  disabled,
  emptyFieldsMessage,
  fieldWarningFor,
  errors,
  dense,
  addConditionLabel,
}: FormFieldConditionsEditorProps) {
  const { t } = useTranslation("sections");

  const errorFor = (index: number): FieldDependencyErrorCode | undefined =>
    errors?.find((e) => e.conditionIndex === index)?.code;

  const updateCondition = (index: number, patch: Partial<FieldDependencyCondition>) => {
    onChange(conditions.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };

  const addCondition = () => {
    onChange([...conditions, { field_id: "", operator: "eq", value: undefined }]);
  };

  const removeCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  const targetFor = (fieldId: string): SectionFormField | undefined =>
    availableFields.find((f) => f.field_id.trim() === fieldId.trim());

  const renderValueInput = (condition: FieldDependencyCondition, index: number) => {
    if (condition.operator === "is_empty" || condition.operator === "is_not_empty") return null;

    const target = targetFor(condition.field_id);
    if (!target) return null;

    const isNumericOp = condition.operator === "gt" || condition.operator === "gte" || condition.operator === "lt" || condition.operator === "lte";
    const isNumericTarget = NUMERIC_DATA_TYPES.includes(target.data_type as string);

    if (isNumericOp || (isNumericTarget && (condition.operator === "eq" || condition.operator === "neq"))) {
      return (
        <HuemulField
          type="number"
          label={t("form.formFields.dependency.value")}
          value={typeof condition.value === "number" ? condition.value : ""}
          onChange={(v) => updateCondition(index, { value: v === "" ? undefined : Number(v) })}
          allowDecimal={target.data_type === "decimal"}
          disabled={disabled}
        />
      );
    }

    if (target.question_type === QUESTION_TYPE.dropdownMultiple && (condition.operator === "contains" || condition.operator === "not_contains")) {
      const options = readFieldOptions(target);
      return (
        <HuemulField
          type="select"
          label={t("form.formFields.dependency.value")}
          value={typeof condition.value === "string" ? condition.value : ""}
          onChange={(v) => updateCondition(index, { value: v as string })}
          options={options.map((o) => ({ value: o.id, label: o.label }))}
          placeholder={t("form.formFields.dependency.valuePlaceholder")}
          disabled={disabled}
        />
      );
    }

    if (
      (target.question_type === QUESTION_TYPE.dropdown || target.question_type === QUESTION_TYPE.multipleChoice) &&
      (condition.operator === "in" || condition.operator === "not_in")
    ) {
      const options = readFieldOptions(target);
      const value = Array.isArray(condition.value) ? (condition.value as string[]) : [];
      return (
        <HuemulCheckboxGroup
          label={t("form.formFields.dependency.value")}
          options={options.map((o) => ({ value: o.id, label: o.label }))}
          value={value}
          onChange={(next) => updateCondition(index, { value: next })}
          disabled={disabled}
        />
      );
    }

    if (target.question_type === QUESTION_TYPE.dropdown || target.question_type === QUESTION_TYPE.multipleChoice) {
      const options = readFieldOptions(target);
      return (
        <HuemulField
          type="select"
          label={t("form.formFields.dependency.value")}
          value={typeof condition.value === "string" ? condition.value : ""}
          onChange={(v) => updateCondition(index, { value: v as string })}
          options={options.map((o) => ({ value: o.id, label: o.label }))}
          placeholder={t("form.formFields.dependency.valuePlaceholder")}
          disabled={disabled}
        />
      );
    }

    if (target.question_type === QUESTION_TYPE.yesNo) {
      return (
        <HuemulField
          type="yes-no"
          label={t("form.formFields.dependency.value")}
          value={condition.value as boolean}
          onChange={(v) => updateCondition(index, { value: v })}
          disabled={disabled}
        />
      );
    }

    if (target.question_type === QUESTION_TYPE.date) {
      return (
        <HuemulField
          type="date"
          label={t("form.formFields.dependency.value")}
          value={typeof condition.value === "string" ? condition.value : ""}
          onChange={(v) => updateCondition(index, { value: v })}
          disabled={disabled}
        />
      );
    }

    if (target.question_type === QUESTION_TYPE.time) {
      return (
        <HuemulField
          type="time"
          label={t("form.formFields.dependency.value")}
          value={typeof condition.value === "string" ? condition.value : ""}
          onChange={(v) => updateCondition(index, { value: v })}
          withSeconds={false}
          disabled={disabled}
        />
      );
    }

    return (
      <HuemulField
        type="text"
        label={t("form.formFields.dependency.value")}
        value={typeof condition.value === "string" ? condition.value : ""}
        onChange={(v) => updateCondition(index, { value: v })}
        disabled={disabled}
      />
    );
  };

  if (availableFields.length === 0) {
    return (
      <p className="text-xs text-gray-400 italic">
        {emptyFieldsMessage ?? t("form.formFields.dependency.noEarlierFields")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {conditions.length === 0 ? (
        <p className="text-xs text-gray-500 italic">{t("form.formFields.dependency.emptyState")}</p>
      ) : (
        <div className="space-y-3">
          {conditions.map((condition, index) => {
            const target = targetFor(condition.field_id);
            const operators = operatorsForTarget(target);
            const errorCode = errorFor(index);
            return (
              <div
                key={index}
                className={dense ? "space-y-2" : "space-y-2 rounded-md border border-gray-100 bg-gray-50 p-2"}
              >
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <HuemulField
                    type="combobox"
                    label={t("form.formFields.dependency.targetField")}
                    value={condition.field_id}
                    onChange={(v) => {
                      const fieldId = v as string;
                      const newTarget = targetFor(fieldId);
                      const newOperators = operatorsForTarget(newTarget);
                      const operator = newOperators.includes(condition.operator) ? condition.operator : newOperators[0];
                      updateCondition(index, { field_id: fieldId, operator, value: undefined });
                    }}
                    options={availableFields.map((f) => {
                      const warning = fieldWarningFor?.(f)
                      return {
                        value: f.field_id,
                        label: f.field_name || f.field_id,
                        description: warning ?? questionTypeLabel(f.question_type, t),
                        icon: warning ? AlertTriangle : questionTypeIcon(f.question_type),
                      }
                    })}
                    placeholder={t("form.formFields.dependency.targetFieldPlaceholder")}
                    disabled={disabled}
                  />
                  <HuemulField
                    type="select"
                    label={t("form.formFields.dependency.operator")}
                    value={condition.operator}
                    onChange={(v) => updateCondition(index, { operator: v as FieldDependencyOperator, value: undefined })}
                    options={operators.map((op) => ({ value: op, label: t(`form.formFields.dependency.operators.${op}`) }))}
                    placeholder={t("form.formFields.dependency.operatorPlaceholder")}
                    disabled={disabled || !condition.field_id}
                  />
                  {renderValueInput(condition, index)}
                </div>
                {errorCode && (
                  <p className="text-xs text-red-500">{t(`form.formFields.dependency.errors.${errorCode}`)}</p>
                )}
                <div className="flex justify-end">
                  <HuemulButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCondition(index)}
                    disabled={disabled}
                    icon={Trash2}
                    tooltip={t("form.formFields.dependency.removeCondition")}
                    className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <HuemulButton
        type="button"
        variant="outline"
        size="sm"
        onClick={addCondition}
        disabled={disabled}
        icon={Plus}
        className="h-7 text-xs border-[#4464f7] text-[#4464f7] hover:bg-[#4464f7] hover:text-white"
      >
        {addConditionLabel ?? t("form.formFields.dependency.addCondition")}
      </HuemulButton>
    </div>
  );
}
